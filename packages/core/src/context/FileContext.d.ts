/**
 * File Context Interface
 *
 * Represents a file in the context for AI model requests
 * @package @zulu-pilot/core
 */
/**
 * File Context
 */
export interface FileContext {
  /** File path (relative to base directory) */
  path: string;
  /** File content */
  content: string;
  /** Last modified date */
  lastModified?: Date;
  /** File size in bytes */
  size?: number;
  /** Estimated token count for this file */
  estimatedTokens?: number;
}
/**
 * Creates a FileContext from file path and content.
 *
 * @param path - File path
 * @param content - File content
 * @param lastModified - Last modification date (defaults to now)
 * @param size - File size in bytes (optional, defaults to content length)
 * @returns FileContext instance
 */
export declare function createFileContext(
  path: string,
  content: string,
  lastModified?: Date,
  size?: number
): FileContext;
//# sourceMappingURL=FileContext.d.ts.map
