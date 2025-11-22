import { ConfigManager } from '../../core/config/ConfigManager.js';
import { OllamaProvider } from '../../core/llm/OllamaProvider.js';
import { GeminiProvider } from '../../core/llm/GeminiProvider.js';
import { OpenAIProvider } from '../../core/llm/OpenAIProvider.js';
import { GoogleCloudProvider } from '../../core/llm/GoogleCloudProvider.js';
import type { IModelProvider } from '../../core/llm/IModelProvider.js';
import type { FileContext } from '../../core/context/FileContext.js';
import { ConnectionError, RateLimitError } from '../../utils/errors.js';
import { validateProviderName } from '../../utils/validators.js';
import { getContextManager } from './add.js';
import { CodeChangeParser } from '../../core/parser/CodeChangeParser.js';
import { FilePatcher } from '../../core/parser/FilePatcher.js';
import { DiffDisplay } from '../ui/diff.js';
import { createCodeChange } from '../../core/parser/CodeChange.js';
import { Spinner } from '../ui/spinner.js';
import { StreamHandler } from '../ui/stream.js';
import { withLoadingIndicator } from '../ui/indicators.js';
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

/**
 * Chat command handler.
 */
export async function handleChatCommand(prompt?: string, providerOverride?: string): Promise<void> {
  const configManager = new ConfigManager();
  const config = await configManager.load();

  // Determine provider
  const providerName = providerOverride ?? config.provider;

  // Validate provider
  try {
    validateProviderName(providerName);
  } catch {
    console.error(`Error: Invalid provider "${providerName}"`);
    process.exit(1);
  }

  // Get provider config
  const providerConfig = await configManager.getProviderConfig(providerName);

  // Initialize provider based on provider name (with loading indicator)
  const provider = await withLoadingIndicator('Initializing provider', async () => {
    return createProvider(providerName, providerConfig, configManager);
  });

  // Get prompt from user if not provided
  const userPrompt = prompt;
  if (!userPrompt) {
    // For Phase 3, simple prompt input
    // In future phases, this will be interactive
    console.error('Error: Prompt is required. Usage: zulu-pilot chat "your question"');
    process.exit(1);
  }

  // Get context from context manager
  const contextManager = getContextManager();
  const context = contextManager.getContext();

  // Check token limit and warn if approaching
  const warning = contextManager.checkTokenLimit(32000); // Default 32k limit
  if (warning) {
    console.warn(`⚠ ${warning}`);
  }

  // Stream response with context and collect for parsing
  const fullResponse = await streamResponseWithSpinner(provider, userPrompt, context);

  // Parse code changes from response
  const parser = new CodeChangeParser({ baseDir: process.cwd() });
  const changes = parser.parse(fullResponse);

  if (changes.length > 0) {
    await handleCodeChanges(changes);
  }
}

/**
 * Stream response with spinner and collect full response.
 *
 * @param provider - Model provider
 * @param prompt - User prompt
 * @param context - File context
 * @returns Full response string
 */
async function streamResponseWithSpinner(
  provider: IModelProvider,
  prompt: string,
  context: FileContext[]
): Promise<string> {
  try {
    // Show spinner while connecting and waiting for first token
    const spinner = new Spinner('Connecting to AI model...');
    spinner.start();

    try {
      // Collect full response for parsing with improved streaming
      const responseStream = provider.streamResponse(prompt, context);
      const streamHandler = new StreamHandler();

      // Wait for first token before stopping spinner
      const tokenIterator = responseStream[Symbol.asyncIterator]();

      const firstResult = await tokenIterator.next();
      if (!firstResult.done) {
        spinner.stop();
        spinner.succeed('Connected');
        // Write first token
        process.stdout.write(firstResult.value);
        let fullResponse = firstResult.value;

        // Continue streaming remaining tokens
        for await (const token of tokenIterator) {
          process.stdout.write(token);
          fullResponse += token;
        }
        process.stdout.write('\n');
        return fullResponse;
      } else {
        spinner.stop();
        // Use StreamHandler for full streaming if no first token
        return await streamHandler.streamToStdout(responseStream);
      }
    } catch (streamError) {
      spinner.stop();
      throw streamError;
    }
  } catch (error) {
    if (error instanceof ConnectionError) {
      console.error(`\nError: ${error.getUserMessage()}`);
      process.exit(1);
    }
    if (error instanceof RateLimitError) {
      console.error(`\nError: ${error.getUserMessage()}`);
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Handle code changes proposed by AI.
 * Shows diff and prompts for approval.
 *
 * @param changes - Array of code changes to handle
 */
async function handleCodeChanges(
  changes: Array<{ filePath: string; newContent: string; changeType: string }>
): Promise<void> {
  const patcher = new FilePatcher({ baseDir: process.cwd() });
  const diffDisplay = new DiffDisplay();
  const rl = readline.createInterface({ input: stdin, output: stdout });

  diffDisplay.displaySummary(changes.map((c) => c.filePath));

  for (const change of changes) {
    try {
      // Load original content if file exists
      let originalContent = '';
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const absolutePath = path.isAbsolute(change.filePath)
        ? change.filePath
        : path.resolve(process.cwd(), change.filePath);

      try {
        originalContent = await fs.readFile(absolutePath, 'utf-8');
      } catch {
        // File doesn't exist, will be created
        originalContent = '';
      }

      const codeChange = createCodeChange(
        change.filePath,
        originalContent,
        change.newContent,
        change.changeType as 'add' | 'modify' | 'delete'
      );

      // Generate and display diff
      const diff = patcher.generateDiff(codeChange);
      diffDisplay.display(diff, change.filePath);

      // Prompt for approval
      const answer = await rl.question(`Apply this change to ${change.filePath}? (y/n): `);

      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        await patcher.applyChange(codeChange);
        console.log(`✓ Applied changes to ${change.filePath}`);
      } else {
        console.log(`✗ Skipped changes to ${change.filePath}`);
      }
    } catch (error) {
      console.error(`Error processing ${change.filePath}:`, error);
    }
  }

  rl.close();
}

/**
 * Create provider instance based on provider name.
 *
 * @param providerName - Provider name
 * @param providerConfig - Provider configuration
 * @param configManager - Config manager for resolving API keys
 * @returns Provider instance
 */
async function createProvider(
  providerName: string,
  providerConfig:
    | {
        apiKey?: string;
        baseUrl?: string;
        model?: string;
        projectId?: string;
        region?: string;
        [key: string]: unknown;
      }
    | undefined,
  configManager: ConfigManager
): Promise<IModelProvider> {
  switch (providerName) {
    case 'ollama':
      return createOllamaProvider(providerConfig);
    case 'gemini':
      return createGeminiProvider(providerConfig, configManager);
    case 'openai':
      return createOpenAIProvider(providerConfig, configManager);
    case 'googleCloud':
      return createGoogleCloudProvider(providerConfig);
    default:
      throw new ConnectionError(`Unsupported provider: ${providerName}`, providerName);
  }
}

/**
 * Create Ollama provider.
 */
function createOllamaProvider(
  providerConfig: { baseUrl?: string; model?: string; [key: string]: unknown } | undefined
): IModelProvider {
  return new OllamaProvider({
    baseUrl: providerConfig?.baseUrl as string | undefined,
    model: providerConfig?.model as string | undefined,
  });
}

/**
 * Create Gemini provider.
 */
function createGeminiProvider(
  providerConfig:
    | {
        apiKey?: string;
        baseUrl?: string;
        model?: string;
        enableGoogleSearch?: boolean;
        [key: string]: unknown;
      }
    | undefined,
  configManager: ConfigManager
): IModelProvider {
  const apiKey = providerConfig?.apiKey
    ? configManager.resolveApiKey(providerConfig.apiKey)
    : undefined;
  if (!apiKey) {
    throw new ConnectionError(
      'Gemini API key not configured. Please set apiKey in provider config.',
      'gemini'
    );
  }
  return new GeminiProvider({
    apiKey,
    model: providerConfig?.model as string | undefined,
    baseUrl: providerConfig?.baseUrl as string | undefined,
    enableGoogleSearch: providerConfig?.enableGoogleSearch as boolean | undefined,
  });
}

/**
 * Create OpenAI provider.
 */
function createOpenAIProvider(
  providerConfig:
    | {
        apiKey?: string;
        baseUrl?: string;
        model?: string;
        [key: string]: unknown;
      }
    | undefined,
  configManager: ConfigManager
): IModelProvider {
  const apiKey = providerConfig?.apiKey
    ? configManager.resolveApiKey(providerConfig.apiKey)
    : undefined;
  if (!apiKey) {
    throw new ConnectionError(
      'OpenAI API key not configured. Please set apiKey in provider config.',
      'openai'
    );
  }
  return new OpenAIProvider({
    apiKey,
    baseUrl: (providerConfig?.baseUrl as string | undefined) ?? 'https://api.openai.com/v1',
    model: (providerConfig?.model as string | undefined) ?? 'gpt-4',
  });
}

/**
 * Create Google Cloud provider.
 */
function createGoogleCloudProvider(
  providerConfig:
    | {
        projectId?: string;
        region?: string;
        model?: string;
        endpoint?: 'v1beta1' | 'v1';
        maxTokens?: number;
        temperature?: number;
        topP?: number;
        [key: string]: unknown;
      }
    | undefined
): IModelProvider {
  const projectId = providerConfig?.projectId as string | undefined;
  const region = providerConfig?.region as string | undefined;
  if (!projectId || !region) {
    throw new ConnectionError(
      'Google Cloud projectId and region must be configured.',
      'googleCloud'
    );
  }
  return new GoogleCloudProvider({
    projectId,
    region,
    model: (providerConfig?.model as string | undefined) ?? 'deepseek-ai/deepseek-v3.1-maas',
    endpoint: providerConfig?.endpoint as 'v1beta1' | 'v1' | undefined,
    maxTokens: providerConfig?.maxTokens as number | undefined,
    temperature: providerConfig?.temperature as number | undefined,
    topP: providerConfig?.topP as number | undefined,
  });
}
