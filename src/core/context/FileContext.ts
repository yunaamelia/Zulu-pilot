/**
 * Represents a file loaded into conversation context for the AI to reference.
 */
export interface FileContext {
  /** Absolute or relative file path */
  path: string;

  /** Full file content */
  content: string;

  /** File modification timestamp */
  lastModified: Date;

  /** File size in bytes (optional, for token estimation) */
  size?: number;

  /** Estimated token count (optional, calculated) */
  estimatedTokens?: number;
}

/**
 * Creates a FileContext from file path and content.
 *
 * @param path - File path
 * @param content - File content
 * @param lastModified - Last modification date (defaults to now)
 * @param size - File size in bytes (optional)
 * @returns FileContext instance
 */
export function createFileContext(
  path: string,
  content: string,
  lastModified: Date = new Date(),
  size?: number
): FileContext {
  return {
    path,
    content,
    lastModified,
    size: size ?? content.length,
  };
}
