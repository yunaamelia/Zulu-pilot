import { ContextManager } from '../../core/context/ContextManager.js';
import { getContextManager } from './add.js';
import { withLoadingIndicator } from '../ui/indicators.js';

/**
 * Handle the /context command.
 * Lists all loaded files with their paths, modification dates, and token usage.
 */
export async function handleContextCommand(contextManager?: ContextManager): Promise<void> {
  const manager = contextManager ?? getContextManager();

  await withLoadingIndicator('Loading context', async () => {
    const context = manager.getContext();

    if (context.length === 0) {
      console.log('No files in context.');
      return;
    }

    console.log('\n📁 Context Files:');
    console.log('─'.repeat(60));

    for (const file of context) {
      const dateStr = file.lastModified.toLocaleDateString();
      const tokens = file.estimatedTokens ?? 0;
      console.log(`  ${file.path}`);
      console.log(`    Modified: ${dateStr}`);
      console.log(`    Tokens: ${tokens}`);
      console.log('');
    }

    const totalTokens = manager.getTotalEstimatedTokens();
    console.log(`Total tokens: ${totalTokens}`);
    console.log('─'.repeat(60));
  });
}
