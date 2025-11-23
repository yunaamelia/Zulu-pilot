/**
 * Integration Test: Rate Limit Error
 * T116: Write integration test for rate limit error in tests/integration/errors/rate-limit.test.ts
 */

import { describe, it, expect } from '@jest/globals';
import { RateLimitError } from '@zulu-pilot/core';

describe('Integration Test: Rate Limit Error (T116)', () => {
  describe('Error creation', () => {
    it('should create rate limit error', () => {
      const error = new RateLimitError('Rate limit exceeded');
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.retryAfter).toBeUndefined();
    });

    it('should create rate limit error with retry-after time', () => {
      const error = new RateLimitError('Rate limit exceeded', 60);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.retryAfter).toBe(60);
    });

    it('should include cause error if provided', () => {
      const cause = new Error('HTTP 429');
      const error = new RateLimitError('Rate limit exceeded', 60, cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe('User-friendly messages', () => {
    it('should provide retry guidance with retry-after time', () => {
      const error = new RateLimitError('Rate limit exceeded', 60);
      const message = error.getUserMessage();

      expect(message).toContain('Rate limit exceeded');
      expect(message).toContain('Retry after 60 seconds');
      expect(message).toContain('To resolve');
      expect(message).toContain('Wait for the retry period');
    });

    it('should provide generic retry guidance without retry-after time', () => {
      const error = new RateLimitError('Rate limit exceeded');
      const message = error.getUserMessage();

      expect(message).toContain('Rate limit exceeded');
      expect(message).toContain('Please retry in a few moments');
      expect(message).not.toContain('Retry after');
    });

    it('should include exponential backoff examples', () => {
      const error = new RateLimitError('Rate limit exceeded', 60);
      const message = error.getUserMessage();

      expect(message).toContain('exponential backoff');
      // Should show backoff examples
      expect(message).toMatch(/\d+ms/); // Should contain delay values like "1000ms"
    });

    it('should include actionable resolution steps', () => {
      const error = new RateLimitError('Rate limit exceeded', 60);
      const message = error.getUserMessage();

      expect(message).toMatch(/1\./);
      expect(message).toMatch(/2\./);
      expect(message).toMatch(/3\./);
      expect(message).toMatch(/4\./);
      expect(message).toContain('upgrading your API plan');
      expect(message).toContain('Reduce request frequency');
      expect(message).toContain('API usage dashboard');
    });

    it('should include original error message', () => {
      const originalMessage = 'Too many requests in the last minute';
      const error = new RateLimitError(originalMessage, 60);
      const message = error.getUserMessage();

      expect(message).toContain(originalMessage);
      expect(message).toContain('Error:');
    });
  });

  describe('Exponential backoff calculation', () => {
    it('should calculate exponential backoff correctly', () => {
      const attempt0 = RateLimitError.calculateBackoff(0);
      const attempt1 = RateLimitError.calculateBackoff(1);
      const attempt2 = RateLimitError.calculateBackoff(2);
      const attempt3 = RateLimitError.calculateBackoff(3);

      expect(attempt0).toBe(1000); // Base delay: 1s
      expect(attempt1).toBe(2000); // 2x: 2s
      expect(attempt2).toBe(4000); // 4x: 4s
      expect(attempt3).toBe(8000); // 8x: 8s
    });

    it('should respect max delay limit', () => {
      const delay = RateLimitError.calculateBackoff(10, 1000, 5000);
      expect(delay).toBeLessThanOrEqual(5000);
      expect(delay).toBe(5000); // Should be capped at maxDelay
    });

    it('should use custom base delay', () => {
      const delay = RateLimitError.calculateBackoff(2, 2000);
      expect(delay).toBe(8000); // 2000 * 2^2 = 8000
    });

    it('should handle high attempt numbers', () => {
      const delay = RateLimitError.calculateBackoff(20, 1000, 30000);
      expect(delay).toBeLessThanOrEqual(30000);
      expect(delay).toBe(30000); // Should cap at maxDelay
    });

    it('should handle zero attempt', () => {
      const delay = RateLimitError.calculateBackoff(0, 1000, 30000);
      expect(delay).toBe(1000); // Base delay
    });
  });

  describe('Error propagation', () => {
    it('should preserve error cause chain', () => {
      const originalError = new Error('HTTP 429 Too Many Requests');
      const error = new RateLimitError('Rate limit exceeded', 60, originalError);

      expect(error.cause).toBe(originalError);
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.retryAfter).toBe(60);
    });

    it('should handle errors with retry-after header', () => {
      const error = new RateLimitError('Rate limit exceeded', 120);
      expect(error.retryAfter).toBe(120);
      expect(error.code).toBe('RATE_LIMIT_ERROR');
    });
  });

  describe('Integration with retry logic', () => {
    it('should provide backoff values for multiple retry attempts', () => {
      const backoffs = [0, 1, 2, 3, 4].map((attempt) =>
        RateLimitError.calculateBackoff(attempt, 1000, 30000)
      );

      expect(backoffs).toEqual([1000, 2000, 4000, 8000, 16000]);
    });

    it('should handle rapid retries with short backoff', () => {
      const backoffs = [0, 1, 2].map((attempt) =>
        RateLimitError.calculateBackoff(attempt, 500, 5000)
      );

      expect(backoffs).toEqual([500, 1000, 2000]);
    });
  });
});
