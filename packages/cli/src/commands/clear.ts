/**
 * Clear Command
 *
 * CLI command for clearing context
 * T089-T090: Clear command with confirmation
 *
 * @package @zulu-pilot/cli
 */

import type { CommandModule, Argv } from 'yargs';
import { ContextManager } from '@zulu-pilot/core';
import readline from 'node:readline';

/**
 * Clear command options interface
 */
export interface ClearCommandOptions {
  force?: boolean;
  yes?: boolean;
}

/**
 * ClearCommand class
 *
 * Handles clearing context with confirmation
 * T089: Create ClearCommand class
 */
export class ClearCommand {
  private contextManager: ContextManager;

  constructor(contextManager?: ContextManager) {
    this.contextManager =
      contextManager ??
      new ContextManager({
        baseDir: process.cwd(),
      });
  }

  /**
   * T090: Implement context clearing with confirmation
   */
  async run(options: ClearCommandOptions): Promise<void> {
    const context = this.contextManager.getContext();
    const fileCount = context.length;
    const totalTokens = this.contextManager.getTotalEstimatedTokens();

    // Check if context is already empty
    if (fileCount === 0) {
      console.log('\n✅ Context is already empty.');
      return;
    }

    // Display what will be cleared
    console.log(`\n📊 Current Context:`);
    console.log(`   Files: ${fileCount}`);
    console.log(`   Estimated tokens: ${totalTokens}`);

    // T090: Request confirmation unless force or yes flag is set
    if (!options.force && !options.yes) {
      const confirmed = await this.promptConfirmation(
        `\n⚠️  This will clear all ${fileCount} file(s) from context. Continue? (yes/no): `
      );

      if (!confirmed) {
        console.log('\n❌ Clear cancelled.');
        return;
      }
    }

    // Clear context
    this.contextManager.clear();

    // Display success message
    console.log(`\n✅ Successfully cleared ${fileCount} file(s) from context.`);
    console.log(`   Context is now empty.`);
  }

  /**
   * Prompt user for confirmation
   */
  private promptConfirmation(question: string): Promise<boolean> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(question, (answer) => {
        rl.close();
        const normalized = answer.trim().toLowerCase();
        resolve(normalized === 'yes' || normalized === 'y');
      });
    });
  }

  /**
   * Get the context manager instance
   */
  getContextManager(): ContextManager {
    return this.contextManager;
  }
}

/**
 * Yargs command definition for clear
 */
export const clearCommand: CommandModule = {
  command: 'clear',
  describe: 'Clear all files from context',
  builder: (yargs: Argv): Argv =>
    yargs
      .option('force', {
        alias: 'f',
        type: 'boolean',
        default: false,
        description: 'Force clear without confirmation',
      })
      .option('yes', {
        alias: 'y',
        type: 'boolean',
        default: false,
        description: 'Auto-confirm clear (same as --force)',
      })
      .example('$0 clear', 'Clear context with confirmation')
      .example('$0 clear --force', 'Clear context without confirmation')
      .example('$0 clear -y', 'Clear context without confirmation'),
  handler: async (argv) => {
    try {
      const command = new ClearCommand();
      await command.run({
        force: argv.force as boolean | undefined,
        yes: argv.yes as boolean | undefined,
      });
    } catch (error) {
      console.error('Error clearing context:', error);
      process.exit(1);
    }
  },
};
