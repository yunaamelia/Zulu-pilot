import type { CodeChange } from './CodeChange.js';
import { createCodeChange } from './CodeChange.js';
import { validateFilePath } from '../../utils/validators.js';
import { ValidationError } from '../../utils/errors.js';

/**
 * Configuration for CodeChangeParser.
 */
export interface CodeChangeParserConfig {
  baseDir?: string;
}

/**
 * Parses AI responses to extract code changes from markdown code blocks.
 */
export class CodeChangeParser {
  private readonly baseDir: string;

  constructor(config: CodeChangeParserConfig = {}) {
    this.baseDir = config.baseDir ?? process.cwd();
  }

  /**
   * Parse AI response and extract code changes.
   *
   * @param response - AI response text containing markdown code blocks
   * @param config - Optional parser configuration
   * @returns Array of CodeChange objects
   */
  parse(response: string, config?: CodeChangeParserConfig): CodeChange[] {
    const baseDir = config?.baseDir ?? this.baseDir;
    const changes: CodeChange[] = [];

    // Match code blocks with filename annotations
    // Format: ```language:filename:path/to/file.ts or ```language:path/to/file.ts
    // Must have a colon after language (not just ```language)
    const codeBlockRegex = /```(?:\w+):(?:filename:)?([^\n`]+)\n([\s\S]*?)```/g;

    let match;
    while ((match = codeBlockRegex.exec(response)) !== null) {
      const filePath = match[1].trim();
      const codeContent = match[2].trim();

      // Skip if no file path
      if (!filePath) {
        continue;
      }

      // Validate file path (but keep relative path)
      try {
        const isValid = this.validateFilePath(filePath, baseDir);
        if (!isValid) {
          continue; // Skip invalid paths
        }

        // Use relative path (normalized)
        const normalizedPath = filePath.replace(/^\.\//, ''); // Remove leading ./

        // Determine change type
        const changeType = this.determineChangeType(normalizedPath, codeContent);

        // Create code change with relative path
        const change = createCodeChange(
          normalizedPath,
          '', // Original content will be loaded by FilePatcher
          codeContent,
          changeType
        );

        changes.push(change);
      } catch (error) {
        // Skip invalid file paths
        if (error instanceof ValidationError) {
          continue;
        }
        throw error;
      }
    }

    return changes;
  }

  /**
   * Validate file path and return true if valid.
   *
   * @param filePath - File path to validate
   * @param baseDir - Base directory for validation
   * @returns True if valid, false otherwise
   */
  private validateFilePath(filePath: string, baseDir: string): boolean {
    try {
      // Check for directory traversal
      if (filePath.includes('..')) {
        return false;
      }

      // Validate using existing validator (throws if invalid)
      validateFilePath(filePath, baseDir);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Determine change type based on file existence and content.
   *
   * @param _filePath - File path (unused, kept for future use)
   * @param newContent - New content
   * @returns Change type
   */
  private determineChangeType(_filePath: string, newContent: string): 'add' | 'modify' | 'delete' {
    // For now, we'll determine this when applying changes
    // Default to modify, FilePatcher will determine actual type
    if (newContent === '') {
      return 'delete';
    }
    return 'modify'; // Will be determined as 'add' if file doesn't exist
  }
}
