/**
 * Add Command
 *
 * CLI command for adding files to context
 * T083-T086: Add command with file validation, glob support, and token estimation
 *
 * @package @zulu-pilot/cli
 */

import type { CommandModule, Argv } from 'yargs';
import { ContextManager } from '@zulu-pilot/core';
import { ValidationError } from '@zulu-pilot/core';
import path from 'node:path';

/**
 * Add command options interface
 */
export interface AddCommandOptions {
  files: string[];
  maxSize?: number;
  tokenLimit?: number;
}

/**
 * AddCommand class
 *
 * Handles adding files to context with validation and token estimation
 * T083: Create AddCommand class
 */
export class AddCommand {
  private contextManager: ContextManager;
  private defaultTokenLimit: number = 100000; // Default token limit

  constructor(contextManager?: ContextManager) {
    this.contextManager =
      contextManager ??
      new ContextManager({
        baseDir: process.cwd(),
        maxFileSize: 1024 * 1024, // 1MB default
      });
  }

  /**
   * T084: Implement file path validation with directory traversal prevention
   * Reject paths with `../`, absolute paths outside base directory
   */
  private validateFilePath(filePath: string): string {
    // Validation is handled by ContextManager.addFile which uses validateFilePath utility
    // This method is for additional CLI-specific validation if needed
    if (filePath.includes('..')) {
      throw new ValidationError(
        `Invalid file path: "${filePath}" contains directory traversal (../)`,
        'filePath'
      );
    }

    return filePath;
  }

  /**
   * T085: Implement glob pattern support
   * T086: Implement token estimation and warnings
   */
  async run(options: AddCommandOptions): Promise<void> {
    if (!options.files || options.files.length === 0) {
      throw new Error('No files specified');
    }

    const tokenLimit = options.tokenLimit ?? this.defaultTokenLimit;
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process each file or glob pattern
    for (const filePattern of options.files) {
      try {
        // Validate path (basic check)
        this.validateFilePath(filePattern);

        // T085: Add file(s) - glob patterns are automatically detected by ContextManager
        await this.contextManager.addFile(filePattern);
        successCount++;
      } catch (error) {
        errorCount++;
        if (error instanceof ValidationError) {
          errors.push(`  ${filePattern}: ${error.getUserMessage()}`);
        } else if (error instanceof Error) {
          errors.push(`  ${filePattern}: ${error.message}`);
        } else {
          errors.push(`  ${filePattern}: Unknown error`);
        }
      }
    }

    // T086: Get context summary and show token estimation
    const context = this.contextManager.getContext();
    const totalTokens = this.contextManager.getTotalEstimatedTokens();
    const tokenWarning = this.contextManager.checkTokenLimit(tokenLimit);

    // Display results
    console.log(`\n✅ Added ${successCount} file(s) to context`);

    if (errorCount > 0) {
      console.log(`\n⚠️  ${errorCount} file(s) failed to add:`);
      errors.forEach((error) => console.log(error));
    }

    // Display context summary
    console.log(`\n📊 Context Summary:`);
    console.log(`   Files: ${context.length}`);
    console.log(`   Estimated tokens: ${totalTokens}`);

    // T086: Show token warning if applicable
    if (tokenWarning) {
      console.log(`\n⚠️  ${tokenWarning}`);
    }

    // Show individual file info if few files
    if (context.length <= 10) {
      console.log(`\n📁 Files in context:`);
      context.forEach((file) => {
        const relativePath = path.relative(process.cwd(), file.path);
        const size = file.size ?? 0;
        const tokens = file.estimatedTokens ?? 0;
        console.log(`   ${relativePath} (${size} bytes, ~${tokens} tokens)`);
      });
    }
  }

  /**
   * Get the context manager instance
   */
  getContextManager(): ContextManager {
    return this.contextManager;
  }
}

/**
 * Yargs command definition for add
 */
export const addCommand: CommandModule = {
  command: 'add <files...>',
  describe: 'Add files to context for AI conversations',
  builder: (yargs: Argv): Argv =>
    yargs
      .positional('files', {
        type: 'string',
        array: true,
        demandOption: true,
        describe: 'File paths or glob patterns to add (e.g., src/**/*.ts)',
      })
      .option('max-size', {
        type: 'number',
        description: 'Maximum file size in bytes (default: 1MB)',
        default: 1024 * 1024,
      })
      .option('token-limit', {
        type: 'number',
        description: 'Token limit for warnings (default: 100000)',
        default: 100000,
      })
      .example('$0 add src/index.ts', 'Add a single file')
      .example('$0 add src/**/*.ts', 'Add all TypeScript files recursively')
      .example('$0 add "src/**/*.ts" "test/**/*.ts"', 'Add files matching multiple patterns'),
  handler: async (argv) => {
    try {
      const command = new AddCommand();
      await command.run({
        files: argv.files as string[],
        maxSize: argv['max-size'] as number | undefined,
        tokenLimit: argv['token-limit'] as number | undefined,
      });
    } catch (error) {
      console.error('Error adding files to context:', error);
      process.exit(1);
    }
  },
};
