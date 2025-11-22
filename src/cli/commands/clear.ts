import { ContextManager } from '../../core/context/ContextManager.js';
import { getContextManager } from './add.js';
import { withLoadingIndicator } from '../ui/indicators.js';

/**
 * Handle the /clear command.
 * Removes all files from context.
 *
 * @param confirm - If true, skip confirmation prompt
 * @param contextManager - Optional context manager (uses global if not provided)
 */
export async function handleClearCommand(
  confirm: boolean = false,
  contextManager?: ContextManager
): Promise<void> {
  const manager = contextManager ?? getContextManager();
  const context = manager.getContext();

  if (context.length === 0) {
    console.log('Context is already empty.');
    return;
  }

  if (!confirm) {
    console.log(`This will remove ${context.length} file(s) from context.`);
    console.log('Use --yes flag to confirm, or run with confirm=true parameter.');
    return;
  }

  await withLoadingIndicator('Clearing context', async () => {
    manager.clear();
    // Success message is shown by withLoadingIndicator if duration > 500ms
    // Otherwise, we show it here
    return Promise.resolve();
  });
  // Show success message if not already shown by indicator
  console.log('✓ Context cleared.');
}
