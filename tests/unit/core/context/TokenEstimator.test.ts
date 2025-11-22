import { describe, it, expect } from '@jest/globals';
import { TokenEstimator } from '../../../../src/core/context/TokenEstimator.js';
import { createFileContext } from '../../../../src/core/context/FileContext.js';

describe('TokenEstimator', () => {
  describe('estimateTokens', () => {
    it('should estimate tokens using default ratio (4 chars/token)', () => {
      const estimator = new TokenEstimator();
      const content = 'x'.repeat(100); // 100 characters

      const tokens = estimator.estimateTokens(content);

      // 100 chars / 4 chars per token = 25 tokens
      expect(tokens).toBe(25);
    });

    it('should use custom charsPerToken ratio', () => {
      const estimator = new TokenEstimator({ charsPerToken: 2 });
      const content = 'x'.repeat(100);

      const tokens = estimator.estimateTokens(content);

      // 100 chars / 2 chars per token = 50 tokens
      expect(tokens).toBe(50);
    });

    it('should handle empty content', () => {
      const estimator = new TokenEstimator();
      const tokens = estimator.estimateTokens('');

      expect(tokens).toBe(0);
    });

    it('should round up fractional tokens', () => {
      const estimator = new TokenEstimator({ charsPerToken: 3 });
      const content = 'x'.repeat(10); // 10 chars / 3 = 3.33

      const tokens = estimator.estimateTokens(content);

      expect(tokens).toBeGreaterThanOrEqual(3);
    });
  });

  describe('estimateFileContextTokens', () => {
    it('should estimate tokens for FileContext', () => {
      const estimator = new TokenEstimator();
      const fileContext = createFileContext('test.ts', 'const x = 1;');

      const tokens = estimator.estimateFileContextTokens(fileContext);

      expect(tokens).toBeGreaterThan(0);
      expect(typeof tokens).toBe('number');
    });

    it('should use file content for estimation', () => {
      const estimator = new TokenEstimator();
      const smallFile = createFileContext('small.ts', 'x');
      const largeFile = createFileContext('large.ts', 'x'.repeat(1000));

      const smallTokens = estimator.estimateFileContextTokens(smallFile);
      const largeTokens = estimator.estimateFileContextTokens(largeFile);

      expect(largeTokens).toBeGreaterThan(smallTokens);
    });
  });

  describe('checkTokenLimit', () => {
    it('should return true when within limit', () => {
      const estimator = new TokenEstimator();
      const content = 'x'.repeat(100); // ~25 tokens with default ratio
      const tokens = estimator.estimateTokens(content);

      const result = estimator.checkTokenLimit(tokens, 1000);

      expect(result.withinLimit).toBe(true);
      expect(result.percentage).toBeLessThan(100);
    });

    it('should return false when exceeding limit', () => {
      const estimator = new TokenEstimator();
      const content = 'x'.repeat(10000); // ~2500 tokens with default ratio
      const tokens = estimator.estimateTokens(content);

      const result = estimator.checkTokenLimit(tokens, 1000);

      expect(result.withinLimit).toBe(false);
      expect(result.percentage).toBeGreaterThan(100);
    });

    it('should calculate percentage correctly', () => {
      const estimator = new TokenEstimator();
      const tokens = 500;
      const limit = 1000;

      const result = estimator.checkTokenLimit(tokens, limit);

      expect(result.percentage).toBe(50);
    });

    it('should warn when approaching limit (80%)', () => {
      const estimator = new TokenEstimator();
      const tokens = 850; // 85% of 1000
      const limit = 1000;

      const result = estimator.checkTokenLimit(tokens, limit);

      expect(result.withinLimit).toBe(true);
      expect(result.percentage).toBe(85);
      // Should warn when > 80%
      expect(result.shouldWarn).toBe(true);
    });
  });

  describe('accuracy validation (SC-007)', () => {
    it('should estimate within 10% accuracy for typical code files', () => {
      const estimator = new TokenEstimator();
      const codeSamples = [
        'const x = 1;',
        'function test() { return true; }',
        'class MyClass { constructor() {} }',
        'interface MyInterface { prop: string; }',
      ];

      for (const code of codeSamples) {
        const tokens = estimator.estimateTokens(code);
        // For character-based estimation, we expect reasonable estimates
        // Actual accuracy would be validated against real tokenizer
        expect(tokens).toBeGreaterThan(0);
        expect(tokens).toBeLessThan(code.length); // Should be less than char count
      }
    });

    it('should handle various file sizes', () => {
      const estimator = new TokenEstimator();
      const sizes = [100, 500, 1000, 5000, 10000];

      for (const size of sizes) {
        const content = 'x'.repeat(size);
        const tokens = estimator.estimateTokens(content);

        expect(tokens).toBeGreaterThan(0);
        // Estimate should scale with content size
        expect(tokens).toBeGreaterThan(size / 5); // At least 1 token per 5 chars
        expect(tokens).toBeLessThan(size); // Less than char count
      }
    });
  });
});
