/**
 * File Context Interface
 *
 * Represents a file in the context for AI model requests
 * @package @zulu-pilot/core
 */
/**
 * Creates a FileContext from file path and content.
 *
 * @param path - File path
 * @param content - File content
 * @param lastModified - Last modification date (defaults to now)
 * @param size - File size in bytes (optional, defaults to content length)
 * @returns FileContext instance
 */
export function createFileContext(path, content, lastModified = new Date(), size) {
  return {
    path,
    content,
    lastModified,
    size: size ?? content.length,
  };
}
//# sourceMappingURL=FileContext.js.map
