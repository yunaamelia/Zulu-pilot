/**
 * Context Command
 *
 * CLI command for listing files in context
 * T087-T088: Context command with metadata listing
 *
 * @package @zulu-pilot/cli
 */

import type { CommandModule, Argv } from 'yargs';
import { ContextManager } from '@zulu-pilot/core';
import path from 'node:path';

/**
 * Context command options interface
 */
export interface ContextCommandOptions {
  format?: 'table' | 'json' | 'list';
  verbose?: boolean;
}

/**
 * ContextCommand class
 *
 * Handles listing context files with metadata
 * T087: Create ContextCommand class
 */
export class ContextCommand {
  private contextManager: ContextManager;

  constructor(contextManager?: ContextManager) {
    this.contextManager =
      contextManager ??
      new ContextManager({
        baseDir: process.cwd(),
      });
  }

  /**
   * T088: Implement context listing with metadata
   */
  async run(options: ContextCommandOptions): Promise<void> {
    const context = this.contextManager.getContext();
    const totalTokens = this.contextManager.getTotalEstimatedTokens();
    const totalSize = context.reduce((sum, file) => sum + (file.size ?? 0), 0);

    // Display summary
    console.log(`\n📊 Context Summary:`);
    console.log(`   Total files: ${context.length}`);
    console.log(`   Total size: ${totalSize} bytes`);
    console.log(`   Estimated tokens: ${totalTokens}`);

    if (context.length === 0) {
      console.log(`\n   No files in context. Use 'zulu-pilot add <files>' to add files.`);
      return;
    }

    // Display files based on format
    const format = options.format ?? 'table';

    if (format === 'json') {
      this.displayJson(context);
    } else if (format === 'list') {
      this.displayList(context, options.verbose);
    } else {
      this.displayTable(context, options.verbose);
    }
  }

  /**
   * Display context as JSON
   */
  private displayJson(context: ReturnType<ContextManager['getContext']>): void {
    const json = context.map((file) => ({
      path: path.relative(process.cwd(), file.path),
      absolutePath: file.path,
      size: file.size,
      lastModified: file.lastModified?.toISOString(),
      estimatedTokens: file.estimatedTokens,
    }));

    console.log('\n');
    console.log(JSON.stringify(json, null, 2));
  }

  /**
   * Display context as simple list
   */
  private displayList(context: ReturnType<ContextManager['getContext']>, verbose?: boolean): void {
    console.log('\n📁 Files in context:');
    context.forEach((file) => {
      const relativePath = path.relative(process.cwd(), file.path);
      if (verbose) {
        const size = file.size ?? 0;
        const tokens = file.estimatedTokens ?? 0;
        const modified = file.lastModified?.toISOString().split('T')[0] ?? 'unknown';
        console.log(`   ${relativePath} (${size} bytes, ~${tokens} tokens, modified: ${modified})`);
      } else {
        console.log(`   ${relativePath}`);
      }
    });
  }

  /**
   * Display context as formatted table
   */
  private displayTable(context: ReturnType<ContextManager['getContext']>, verbose?: boolean): void {
    console.log('\n📁 Files in context:');
    console.log('');

    // Table header
    if (verbose) {
      console.log('   Path                                    Size      Tokens    Modified');
      console.log('   ────────────────────────────────────────────────────────────────────────');
    } else {
      console.log('   Path                                    Tokens');
      console.log('   ──────────────────────────────────────────────────────────────');
    }

    // Table rows
    context.forEach((file) => {
      const relativePath = path.relative(process.cwd(), file.path);
      const size = file.size ?? 0;
      const tokens = file.estimatedTokens ?? 0;
      const modified = file.lastModified?.toISOString().split('T')[0] ?? 'unknown';

      // Truncate long paths
      const displayPath =
        relativePath.length > 38 ? relativePath.slice(0, 35) + '...' : relativePath;

      if (verbose) {
        const sizeStr = formatSize(size);
        const tokenStr = tokens.toString().padStart(8);
        console.log(`   ${displayPath.padEnd(40)} ${sizeStr.padEnd(9)} ${tokenStr}   ${modified}`);
      } else {
        const tokenStr = tokens.toString().padStart(8);
        console.log(`   ${displayPath.padEnd(40)} ${tokenStr}`);
      }
    });

    console.log('');
  }

  /**
   * Get the context manager instance
   */
  getContextManager(): ContextManager {
    return this.contextManager;
  }
}

/**
 * Format size in human-readable format
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Yargs command definition for context
 */
export const contextCommand: CommandModule = {
  command: 'context',
  describe: 'List files in context with metadata',
  builder: (yargs: Argv): Argv =>
    yargs
      .option('format', {
        alias: 'f',
        type: 'string',
        choices: ['table', 'json', 'list'],
        default: 'table',
        description: 'Output format',
      })
      .option('verbose', {
        alias: 'v',
        type: 'boolean',
        default: false,
        description: 'Show detailed information',
      })
      .example('$0 context', 'List files in context')
      .example('$0 context --format json', 'List files in JSON format')
      .example('$0 context --verbose', 'Show detailed file information'),
  handler: async (argv) => {
    try {
      const command = new ContextCommand();
      await command.run({
        format: argv.format as 'table' | 'json' | 'list' | undefined,
        verbose: argv.verbose as boolean | undefined,
      });
    } catch (error) {
      console.error('Error listing context:', error);
      process.exit(1);
    }
  },
};
