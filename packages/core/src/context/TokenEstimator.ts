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
export class TokenEstimator {
  private readonly charsPerToken: number;
  private readonly safetyMargin: number;

  constructor(config: TokenEstimatorConfig = {}) {
    this.charsPerToken = config.charsPerToken ?? 4; // Default: 4 chars per token
    this.safetyMargin = config.safetyMargin ?? 0.1; // 10% safety margin
  }

  /**
   * Estimate token count for given content.
   *
   * @param content - Text content to estimate
   * @returns Estimated token count
   */
  estimateTokens(content: string): number {
    if (!content || content.length === 0) {
      return 0;
    }
    return Math.ceil(content.length / this.charsPerToken);
  }

  /**
   * Estimate token count for a FileContext.
   *
   * @param fileContext - File context to estimate
   * @returns Estimated token count
   */
  estimateFileContextTokens(fileContext: FileContext): number {
    return this.estimateTokens(fileContext.content);
  }

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
  } {
    // Apply safety margin to effective limit
    const effectiveLimit = limit * (1 - this.safetyMargin);
    const percentage = (tokens / limit) * 100;
    const withinLimit = tokens <= effectiveLimit;
    const shouldWarn = percentage > 80; // Warn when > 80% of limit

    return {
      withinLimit,
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
      shouldWarn,
    };
  }
}
