/**
 * Validation utilities for context management
 * @package @zulu-pilot/core
 */
/**
 * Validates a file path to prevent directory traversal attacks.
 *
 * @param filePath - File path to validate
 * @param baseDir - Base directory (default: current working directory)
 * @returns Normalized absolute path
 * @throws {ValidationError} If path is invalid or outside base directory
 */
export declare function validateFilePath(filePath: string, baseDir?: string): string;
//# sourceMappingURL=validators.d.ts.map
