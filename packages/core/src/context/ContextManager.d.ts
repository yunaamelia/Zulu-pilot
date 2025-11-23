/**
 * Context Manager
 *
 * Manages file context for AI conversations
 * @package @zulu-pilot/core
 */
import type { FileContext } from './FileContext.js';
import { TokenEstimator } from './TokenEstimator.js';
import type { TokenEstimatorConfig } from './TokenEstimator.js';
/**
 * Configuration for ContextManager.
 */
export interface ContextManagerConfig {
  /** Base directory for file resolution (default: process.cwd()) */
  baseDir?: string;
  /** Maximum file size in bytes (default: 1MB) */
  maxFileSize?: number;
  /** Token estimator instance or config */
  tokenEstimator?: TokenEstimator | TokenEstimatorConfig;
}
/**
 * Manages file context for AI conversations.
 */
export declare class ContextManager {
  private readonly baseDir;
  private readonly maxFileSize;
  private readonly tokenEstimator;
  private context;
  constructor(config?: ContextManagerConfig);
  /**
   * Add file(s) to context.
   * Supports both single file paths and glob patterns.
   *
   * @param filePathOrGlob - File path or glob pattern
   * @throws {ValidationError} If file doesn't exist or path is invalid
   */
  addFile(filePathOrGlob: string): Promise<void>;
  /**
   * Add multiple files using glob pattern.
   */
  private addFilesByGlob;
  /**
   * Clear all context.
   */
  clear(): void;
  /**
   * Get current context.
   *
   * @returns Array of FileContext objects (copy to prevent external modification)
   */
  getContext(): FileContext[];
  /**
   * Get total estimated tokens for current context.
   *
   * @returns Total estimated token count
   */
  getTotalEstimatedTokens(): number;
  /**
   * Check if context exceeds token limit and get warning.
   *
   * @param limit - Maximum token limit
   * @returns Warning message if limit exceeded or approaching, null otherwise
   */
  checkTokenLimit(limit: number): string | null;
}
//# sourceMappingURL=ContextManager.d.ts.map
