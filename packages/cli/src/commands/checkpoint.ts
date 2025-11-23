import type { CommandModule, Argv } from 'yargs';
import { CheckpointManager } from '../../../packages/core/src/checkpoint/CheckpointManager.js';
import { createConversationCheckpoint } from '../../../packages/core/src/checkpoint/ConversationCheckpoint.js';
import type { ConversationManager } from '../../../packages/core/src/conversation/ConversationManager.js';
import { initializeOutputListenersAndFlush } from '../gemini.js';

/**
 * T176-T178, T180: CheckpointCommand - Manage conversation checkpoints
 */
export const checkpointCommand: CommandModule = {
  command: 'checkpoint',
  describe: 'Manage conversation checkpoints',
  builder: (yargs: Argv) =>
    yargs
      .middleware(() => initializeOutputListenersAndFlush())
      .command({
        command: 'save <name>',
        describe: 'Save current conversation as a checkpoint',
        builder: (yargs: Argv) =>
          yargs
            .positional('name', {
              type: 'string',
              describe: 'Name for the checkpoint',
              demandOption: true,
            })
            .option('description', {
              type: 'string',
              alias: 'd',
              describe: 'Description for the checkpoint',
            }),
        handler: async (argv) => {
          await handleSave(argv.name as string, argv.description as string | undefined);
        },
      })
      .command({
        command: 'list',
        describe: 'List all saved checkpoints',
        handler: async () => {
          await handleList();
        },
      })
      .command({
        command: 'load <id>',
        describe: 'Load a checkpoint by ID',
        builder: (yargs: Argv) =>
          yargs.positional('id', {
            type: 'string',
            describe: 'Checkpoint ID to load',
            demandOption: true,
          }),
        handler: async (argv) => {
          await handleLoad(argv.id as string);
        },
      })
      .command({
        command: 'delete <id>',
        describe: 'Delete a checkpoint by ID',
        builder: (yargs: Argv) =>
          yargs.positional('id', {
            type: 'string',
            describe: 'Checkpoint ID to delete',
            demandOption: true,
          }),
        handler: async (argv) => {
          await handleDelete(argv.id as string);
        },
      })
      .demandCommand(1, 'You need at least one command before continuing.')
      .version(false),
  handler: () => {
    // yargs will automatically show help if no subcommand is provided
  },
};

/**
 * T177: Handle checkpoint save command
 */
async function handleSave(name: string, description?: string): Promise<void> {
  try {
    // TODO: Get conversation manager and history from chat command
    // For now, create a placeholder checkpoint
    // In real implementation, this would get history from ConversationManager
    const manager = new CheckpointManager();
    const checkpoint = createConversationCheckpoint({
      name,
      description,
      history: [], // Will be populated from ConversationManager in real implementation
      workspaceRoot: process.cwd(),
    });

    await manager.saveCheckpoint(checkpoint);

    console.log(`✅ Checkpoint saved: ${checkpoint.id}`);
    console.log(`   Name: ${name}`);
    if (description) {
      console.log(`   Description: ${description}`);
    }
  } catch (error) {
    console.error('❌ Failed to save checkpoint:', error);
    process.exit(1);
  }
}

/**
 * T178: Handle checkpoint list command
 */
async function handleList(): Promise<void> {
  try {
    const manager = new CheckpointManager();
    const checkpoints = await manager.listCheckpoints();

    if (checkpoints.length === 0) {
      console.log('No checkpoints found.');
      return;
    }

    console.log(`\n📋 Found ${checkpoints.length} checkpoint(s):\n`);
    console.log('─'.repeat(80));

    for (const checkpoint of checkpoints) {
      console.log(`\nID: ${checkpoint.id}`);
      console.log(`Name: ${checkpoint.name}`);
      if (checkpoint.description) {
        console.log(`Description: ${checkpoint.description}`);
      }
      console.log(`Created: ${new Date(checkpoint.createdAt).toLocaleString()}`);
      if (checkpoint.lastAccessedAt) {
        console.log(`Last accessed: ${new Date(checkpoint.lastAccessedAt).toLocaleString()}`);
      }
      console.log('─'.repeat(80));
    }
  } catch (error) {
    console.error('❌ Failed to list checkpoints:', error);
    process.exit(1);
  }
}

/**
 * Handle checkpoint load command (used by chat command for resume)
 */
async function handleLoad(id: string): Promise<ConversationCheckpoint | null> {
  try {
    const manager = new CheckpointManager();
    const checkpoint = await manager.loadCheckpoint(id);

    if (!checkpoint) {
      console.error(`❌ Checkpoint not found: ${id}`);
      return null;
    }

    console.log(`✅ Checkpoint loaded: ${checkpoint.name}`);
    console.log(`   ID: ${checkpoint.id}`);
    if (checkpoint.description) {
      console.log(`   Description: ${checkpoint.description}`);
    }
    console.log(`   History: ${checkpoint.history.length} message(s)`);

    return checkpoint;
  } catch (error) {
    console.error('❌ Failed to load checkpoint:', error);
    return null;
  }
}

/**
 * T180: Handle checkpoint delete command
 */
async function handleDelete(id: string): Promise<void> {
  try {
    const manager = new CheckpointManager();
    const deleted = await manager.deleteCheckpoint(id);

    if (deleted) {
      console.log(`✅ Checkpoint deleted: ${id}`);
    } else {
      console.error(`❌ Checkpoint not found: ${id}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to delete checkpoint:', error);
    process.exit(1);
  }
}

// Export handleLoad for use in chat command
export { handleLoad };

