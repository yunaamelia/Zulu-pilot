import { ContextManager } from '../../core/context/ContextManager.js';
import { getContextManager } from './add.js';

/**
 * Handle the /clear command.
 * Removes all files from context.
 *
 * @param confirm - If true, skip confirmation prompt
 * @param contextManager - Optional context manager (uses global if not provided)
 */
export function handleClearCommand(
  confirm: boolean = false,
  contextManager?: ContextManager
): void {
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

  manager.clear();
  console.log('✓ Context cleared.');
}
