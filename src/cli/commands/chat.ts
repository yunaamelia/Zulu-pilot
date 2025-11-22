import { ConfigManager } from '../../core/config/ConfigManager.js';
import { OllamaProvider } from '../../core/llm/OllamaProvider.js';
import { GeminiProvider } from '../../core/llm/GeminiProvider.js';
import { OpenAIProvider } from '../../core/llm/OpenAIProvider.js';
import { GoogleCloudProvider } from '../../core/llm/GoogleCloudProvider.js';
import { GoogleAuth } from 'google-auth-library';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
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
 * Debug logging utility.
 */
function debugLog(message: string, data?: unknown): void {
  if (process.env.DEBUG || process.env.ZULU_PILOT_DEBUG) {
    console.error(`[DEBUG] ${message}`);
    if (data !== undefined) {
      console.error(`[DEBUG] Data:`, JSON.stringify(data, null, 2));
    }
  }
}

/**
 * Chat command handler.
 */
export async function handleChatCommand(
  prompt?: string,
  providerOverride?: string,
  debug?: boolean
): Promise<void> {
  if (debug || process.env.DEBUG || process.env.ZULU_PILOT_DEBUG) {
    process.env.DEBUG = '1';
    process.env.ZULU_PILOT_DEBUG = '1';
    debugLog('Debug mode enabled');
  }

  debugLog('Loading configuration');
  const configManager = new ConfigManager();
  const config = await configManager.load();
  debugLog('Configuration loaded', { provider: config.provider, model: config.model });

  // Determine provider
  const providerName = providerOverride ?? config.provider;
  debugLog('Provider determined', { providerName, override: providerOverride });

  // Validate provider
  try {
    validateProviderName(providerName);
  } catch {
    console.error(`Error: Invalid provider "${providerName}"`);
    process.exit(1);
  }

  // Get provider config
  debugLog('Getting provider config', { providerName });
  const providerConfig = await configManager.getProviderConfig(providerName);
  debugLog('Provider config loaded', providerConfig);

  // Initialize provider based on provider name (with loading indicator)
  debugLog('Creating provider instance');
  const provider = await withLoadingIndicator('Initializing provider', async () => {
    const p = await createProvider(providerName, providerConfig, configManager);
    debugLog('Provider created', { providerType: p.constructor.name });
    return p;
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
  debugLog('Context loaded', {
    fileCount: context.length,
    files: context.map((f) => ({ path: f.path, tokens: f.estimatedTokens })),
  });

  // Check token limit and warn if approaching
  const warning = contextManager.checkTokenLimit(32000); // Default 32k limit
  if (warning) {
    console.warn(`⚠ ${warning}`);
  }
  debugLog('Token limit check', { warning: warning ?? 'OK' });

  // Stream response with context and collect for parsing
  debugLog('Starting stream response', { prompt: userPrompt, contextFiles: context.length });
  const fullResponse = await streamResponseWithSpinner(provider, userPrompt, context);
  debugLog('Response received', { length: fullResponse.length });

  // Parse code changes from response
  debugLog('Parsing code changes from response');
  const parser = new CodeChangeParser({ baseDir: process.cwd() });
  const changes = parser.parse(fullResponse);
  debugLog('Code changes parsed', {
    changeCount: changes.length,
    files: changes.map((c) => c.filePath),
  });

  if (changes.length > 0) {
    debugLog('Handling code changes');
    await handleCodeChanges(changes);
  } else {
    debugLog('No code changes detected in response');
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
      debugLog('Calling provider.streamResponse', {
        promptLength: prompt.length,
        contextCount: context.length,
      });
      // Collect full response for parsing with improved streaming
      const responseStream = provider.streamResponse(prompt, context);
      const streamHandler = new StreamHandler();
      debugLog('Response stream created');

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
      debugLog('Stream error occurred', {
        error: streamError instanceof Error ? streamError.message : String(streamError),
        errorType: streamError?.constructor?.name,
      });
      throw streamError;
    }
  } catch (error) {
    debugLog('Error in streamResponseWithSpinner', {
      error: error instanceof Error ? error.message : String(error),
      errorType: error?.constructor?.name,
      stack: error instanceof Error ? error.stack : undefined,
    });
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
    case 'googleClaude':
      // googleClaude uses GoogleCloudProvider with all models registered
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
/**
 * Create access token getter using service account key file if available,
 * otherwise fallback to gcloud auth.
 */
async function createAccessTokenGetter(): Promise<() => Promise<string>> {
  // Try to use service account key file (request.json) first
  const serviceAccountPath = join(process.cwd(), 'request.json');
  try {
    const serviceAccountKey = await readFile(serviceAccountPath, 'utf-8');
    const serviceAccount = JSON.parse(serviceAccountKey);

    // Validate service account structure
    if (
      serviceAccount.type === 'service_account' &&
      serviceAccount.project_id &&
      serviceAccount.private_key &&
      serviceAccount.client_email
    ) {
      const auth = new GoogleAuth({
        credentials: serviceAccount,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });

      return async (): Promise<string> => {
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();
        if (!accessToken.token) {
          throw new Error('Failed to get access token from service account');
        }
        return accessToken.token;
      };
    }
  } catch (error) {
    // If service account file doesn't exist or is invalid, fallback to gcloud
    if (process.env.DEBUG || process.env.ZULU_PILOT_DEBUG) {
      console.error(
        `[DEBUG] Service account auth failed, using gcloud: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Fallback to gcloud auth print-access-token
  const { exec } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execAsync = promisify(exec);

  return async (): Promise<string> => {
    try {
      const { stdout } = await execAsync('gcloud auth print-access-token');
      return stdout.trim();
    } catch (error) {
      throw new ConnectionError(
        `Failed to get access token: ${error instanceof Error ? error.message : String(error)}. Please run 'gcloud auth login' or provide request.json service account key file.`,
        'googleCloud'
      );
    }
  };
}

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

  // Create access token getter (will be resolved asynchronously)
  let accessTokenGetter: (() => Promise<string>) | undefined;
  const getAccessTokenPromise = createAccessTokenGetter().then((getter) => {
    accessTokenGetter = getter;
  });

  // For now, create provider with a wrapper that will use the getter once ready
  // We'll need to handle this asynchronously, but GoogleCloudProvider expects
  // getAccessToken to be provided synchronously. Let's create a lazy getter.
  const lazyGetAccessToken = async (): Promise<string> => {
    if (!accessTokenGetter) {
      await getAccessTokenPromise;
    }
    if (!accessTokenGetter) {
      throw new ConnectionError('Failed to initialize access token getter', 'googleCloud');
    }
    return accessTokenGetter();
  };

  return new GoogleCloudProvider({
    projectId,
    region,
    model: (providerConfig?.model as string | undefined) ?? 'deepseek-ai/deepseek-v3.1-maas',
    endpoint: providerConfig?.endpoint as 'v1beta1' | 'v1' | undefined,
    maxTokens: providerConfig?.maxTokens as number | undefined,
    temperature: providerConfig?.temperature as number | undefined,
    topP: providerConfig?.topP as number | undefined,
    getAccessToken: lazyGetAccessToken,
  });
}
