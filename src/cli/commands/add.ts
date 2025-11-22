import { ContextManager } from '../../core/context/ContextManager.js';
import { ValidationError } from '../../utils/errors.js';
import { withLoadingIndicator } from '../ui/indicators.js';

let globalContextManager: ContextManager | null = null;

/**
 * Set the global context manager instance.
 * This allows the add command to access the context manager.
 */
export function setContextManager(manager: ContextManager): void {
  globalContextManager = manager;
}

/**
 * Get the global context manager instance.
 */
export function getContextManager(): ContextManager {
  if (!globalContextManager) {
    globalContextManager = new ContextManager();
  }
  return globalContextManager;
}

/**
 * Handle the /add command.
 * Adds files to context using file paths or glob patterns.
 *
 * @param filePathOrGlob - File path or glob pattern
 * @param contextManager - Optional context manager (uses global if not provided)
 */
export async function handleAddCommand(
  filePathOrGlob: string,
  contextManager?: ContextManager
): Promise<void> {
  const manager = contextManager ?? getContextManager();

  try {
    await withLoadingIndicator(`Loading ${filePathOrGlob}`, async () => {
      await manager.addFile(filePathOrGlob);
    });

    const context = manager.getContext();
    const addedFile = context[context.length - 1];

    console.log(`✓ Added: ${addedFile.path}`);
    console.log(`  Tokens: ${addedFile.estimatedTokens ?? 0}`);

    // Check token limit and warn if approaching
    const warning = manager.checkTokenLimit(32000); // Default 32k limit
    if (warning) {
      console.warn(`⚠ ${warning}`);
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(`Error: ${error.getUserMessage()}`);
      process.exit(1);
    }
    throw error;
  }
}
