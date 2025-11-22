import { ConfigManager } from '../../core/config/ConfigManager.js';
import { OllamaProvider } from '../../core/llm/OllamaProvider.js';
import { ConnectionError } from '../../utils/errors.js';
import { validateProviderName } from '../../utils/validators.js';
import { getContextManager } from './add.js';
import { CodeChangeParser } from '../../core/parser/CodeChangeParser.js';
import { FilePatcher } from '../../core/parser/FilePatcher.js';
import { DiffDisplay } from '../ui/diff.js';
import { createCodeChange } from '../../core/parser/CodeChange.js';
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

  // For Phase 3, only support Ollama
  if (providerName !== 'ollama') {
    console.error(
      `Error: Provider "${providerName}" not yet implemented. Only "ollama" is supported in Phase 3.`
    );
    process.exit(1);
  }

  // Get provider config
  const providerConfig = await configManager.getProviderConfig('ollama');
  const model = providerConfig?.model ?? config.model ?? 'qwen2.5-coder';

  // Initialize provider
  const provider = new OllamaProvider({
    baseUrl: providerConfig?.baseUrl as string | undefined,
    model,
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
  let fullResponse = '';

  try {
    // Collect full response for parsing
    const responseStream = provider.streamResponse(userPrompt, context);
    for await (const token of responseStream) {
      process.stdout.write(token);
      fullResponse += token;
    }
    process.stdout.write('\n');

    // Parse code changes from response
    const parser = new CodeChangeParser({ baseDir: process.cwd() });
    const changes = parser.parse(fullResponse);

    if (changes.length > 0) {
      await handleCodeChanges(changes);
    }
  } catch (error) {
    if (error instanceof ConnectionError) {
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
