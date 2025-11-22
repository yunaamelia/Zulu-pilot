import fs from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';
import type { FileContext } from './FileContext.js';
import { createFileContext } from './FileContext.js';
import { TokenEstimator } from './TokenEstimator.js';
import { validateFilePath } from '../../utils/validators.js';
import { ValidationError } from '../../utils/errors.js';

/**
 * Configuration for ContextManager.
 */
export interface ContextManagerConfig {
  baseDir?: string;
  maxFileSize?: number; // in bytes
  tokenEstimator?: TokenEstimator;
}

/**
 * Manages file context for AI conversations.
 */
export class ContextManager {
  private readonly baseDir: string;
  private readonly maxFileSize: number;
  private readonly tokenEstimator: TokenEstimator;
  private context: FileContext[] = [];

  constructor(config: ContextManagerConfig = {}) {
    this.baseDir = config.baseDir ?? process.cwd();
    this.maxFileSize = config.maxFileSize ?? 1024 * 1024; // 1MB default
    this.tokenEstimator = config.tokenEstimator ?? new TokenEstimator();
  }

  /**
   * Add file(s) to context.
   * Supports both single file paths and glob patterns.
   *
   * @param filePathOrGlob - File path or glob pattern
   * @throws {ValidationError} If file doesn't exist or path is invalid
   */
  async addFile(filePathOrGlob: string): Promise<void> {
    // Check if it's a glob pattern
    if (filePathOrGlob.includes('*') || filePathOrGlob.includes('?')) {
      await this.addFilesByGlob(filePathOrGlob);
      return;
    }

    // Single file
    let absolutePath: string;
    try {
      absolutePath = validateFilePath(filePathOrGlob, this.baseDir);
    } catch (error) {
      throw new ValidationError(`Invalid file path: ${filePathOrGlob}`, 'filePath', error as Error);
    }

    // Check if already in context
    if (this.context.some((f) => f.path === absolutePath)) {
      return; // Already added, skip
    }

    // Read file
    let stats;
    try {
      stats = await fs.stat(absolutePath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        throw new ValidationError(`File not found: ${filePathOrGlob}`, 'filePath', error as Error);
      }
      throw error;
    }

    if (!stats.isFile()) {
      throw new ValidationError(`Path is not a file: ${filePathOrGlob}`, 'filePath');
    }

    // Check file size
    if (stats.size > this.maxFileSize) {
      throw new ValidationError(
        `File too large: ${filePathOrGlob} (${stats.size} bytes, max: ${this.maxFileSize} bytes)`,
        'fileSize'
      );
    }

    // Read file content
    const content = await fs.readFile(absolutePath, 'utf-8');

    // Check if binary (simple heuristic: check for null bytes)
    if (content.includes('\0')) {
      throw new ValidationError(`File appears to be binary: ${filePathOrGlob}`, 'fileType');
    }

    // Create file context
    const fileContext = createFileContext(absolutePath, content, stats.mtime, stats.size);

    // Estimate tokens
    fileContext.estimatedTokens = this.tokenEstimator.estimateFileContextTokens(fileContext);

    // Add to context
    this.context.push(fileContext);
  }

  /**
   * Add multiple files using glob pattern.
   */
  private async addFilesByGlob(globPattern: string): Promise<void> {
    const resolvedPattern = path.isAbsolute(globPattern)
      ? globPattern
      : path.resolve(this.baseDir, globPattern);

    const files = await glob(resolvedPattern, {
      cwd: this.baseDir,
      absolute: true,
    });

    for (const file of files) {
      try {
        await this.addFile(file);
      } catch (error) {
        // Skip files that can't be added (binary, too large, etc.)
        // Log but don't fail the entire operation
        if (error instanceof ValidationError) {
          continue;
        }
        throw error;
      }
    }
  }

  /**
   * Clear all context.
   */
  clear(): void {
    this.context = [];
  }

  /**
   * Get current context.
   *
   * @returns Array of FileContext objects
   */
  getContext(): FileContext[] {
    return [...this.context]; // Return copy to prevent external modification
  }

  /**
   * Get total estimated tokens for current context.
   *
   * @returns Total estimated token count
   */
  getTotalEstimatedTokens(): number {
    return this.context.reduce((sum, file) => sum + (file.estimatedTokens ?? 0), 0);
  }

  /**
   * Check if context exceeds token limit and get warning.
   *
   * @param limit - Maximum token limit
   * @returns Warning message if limit exceeded or approaching, null otherwise
   */
  checkTokenLimit(limit: number): string | null {
    const totalTokens = this.getTotalEstimatedTokens();
    const check = this.tokenEstimator.checkTokenLimit(totalTokens, limit);

    if (!check.withinLimit) {
      return `Context exceeds token limit: ${totalTokens}/${limit} tokens (${check.percentage}%)`;
    }

    if (check.shouldWarn) {
      return `Context approaching token limit: ${totalTokens}/${limit} tokens (${check.percentage}%)`;
    }

    return null;
  }
}
