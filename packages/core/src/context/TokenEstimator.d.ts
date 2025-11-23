/**
 * Token Estimator
 *
 * Estimates token count for text content using character-based estimation
 * @package @zulu-pilot/core
 */
import type { FileContext } from './FileContext.js';
/**
 * Configuration for TokenEstimator.
 */
export interface TokenEstimatorConfig {
  /** Characters per token (default: 4) */
  charsPerToken?: number;
  /** Safety margin percentage (default: 0.1 = 10%) */
  safetyMargin?: number;
}
/**
 * Estimates token count for text content.
 * Uses character-based estimation with configurable ratio.
 */
export declare class TokenEstimator {
  private readonly charsPerToken;
  private readonly safetyMargin;
  constructor(config?: TokenEstimatorConfig);
  /**
   * Estimate token count for given content.
   *
   * @param content - Text content to estimate
   * @returns Estimated token count
   */
  estimateTokens(content: string): number;
  /**
   * Estimate token count for a FileContext.
   *
   * @param fileContext - File context to estimate
   * @returns Estimated token count
   */
  estimateFileContextTokens(fileContext: FileContext): number;
  /**
   * Check if token count is within limit and calculate percentage.
   * Applies safety margin to the limit.
   *
   * @param tokens - Current token count
   * @param limit - Maximum token limit
   * @returns Object with withinLimit, percentage, and shouldWarn flags
   */
  checkTokenLimit(
    tokens: number,
    limit: number
  ): {
    withinLimit: boolean;
    percentage: number;
    shouldWarn: boolean;
  };
}
//# sourceMappingURL=TokenEstimator.d.ts.map
