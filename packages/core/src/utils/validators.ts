/**
 * Validation utilities for context management
 * @package @zulu-pilot/core
 */

import * as path from 'node:path';
import { ValidationError } from './contextErrors.js';

/**
 * Validates a file path to prevent directory traversal attacks.
 *
 * @param filePath - File path to validate
 * @param baseDir - Base directory (default: current working directory)
 * @returns Normalized absolute path
 * @throws {ValidationError} If path is invalid or outside base directory
 */
export function validateFilePath(filePath: string, baseDir: string = process.cwd()): string {
  if (!filePath || typeof filePath !== 'string') {
    throw new ValidationError('File path must be a non-empty string', 'filePath');
  }

  // Resolve to absolute path
  const absolutePath = path.isAbsolute(filePath)
    ? path.normalize(filePath)
    : path.resolve(baseDir, filePath);

  // Normalize base directory
  const normalizedBase = path.resolve(baseDir);

  // Check if path is within base directory
  if (!absolutePath.startsWith(normalizedBase)) {
    throw new ValidationError(
      `File path "${filePath}" is outside the allowed directory`,
      'filePath'
    );
  }

  // Check for directory traversal patterns
  if (filePath.includes('..')) {
    const normalized = path.normalize(filePath);
    if (normalized.includes('..')) {
      throw new ValidationError(
        `File path "${filePath}" contains invalid directory traversal`,
        'filePath'
      );
    }
  }

  return absolutePath;
}
