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
}

