import { describe, it, expect } from '@jest/globals';
import {
  ConnectionError,
  RateLimitError,
  ValidationError,
} from '../../../src/utils/errors.js';

describe('Error Message Formatting', () => {
  describe('ConnectionError', () => {
    it('should provide user-friendly message for Ollama', () => {
      const error = new ConnectionError('Connection refused', 'ollama');
      const message = error.getUserMessage();

      expect(message).toContain('Failed to connect to Ollama');
      expect(message).toContain('Ollama is running locally');
      expect(message).toContain('The model is installed');
      expect(message).toContain('network connection');
      expect(message).toContain('Connection refused');
    });

    it('should provide user-friendly message for other providers', () => {
      const error = new ConnectionError('Network timeout', 'gemini');
      const message = error.getUserMessage();

      expect(message).toContain('Failed to connect to Gemini');
      expect(message).toContain('internet connection');
      expect(message).toContain('API endpoint is accessible');
      expect(message).toContain('Firewall settings');
      expect(message).toContain('Network timeout');
    });

    it('should include actionable guidance steps', () => {
      const error = new ConnectionError('Connection refused', 'ollama');
      const message = error.getUserMessage();

      // Should have numbered steps
      expect(message).toMatch(/1\./);
      expect(message).toMatch(/2\./);
      expect(message).toMatch(/3\./);
    });
  });

  describe('RateLimitError', () => {
    it('should provide retry guidance with retry-after time', () => {
      const error = new RateLimitError('Rate limit exceeded', 60);
      const message = error.getUserMessage();

      expect(message).toContain('Rate limit exceeded');
      expect(message).toContain('Retry after 60 seconds');
    });

    it('should provide generic retry guidance without retry-after time', () => {
      const error = new RateLimitError('Rate limit exceeded');
      const message = error.getUserMessage();

      expect(message).toContain('Rate limit exceeded');
      expect(message).toContain('Please retry in a few moments');
    });

    it('should calculate exponential backoff correctly', () => {
      const attempt0 = RateLimitError.calculateBackoff(0);
      const attempt1 = RateLimitError.calculateBackoff(1);
      const attempt2 = RateLimitError.calculateBackoff(2);
      const attempt3 = RateLimitError.calculateBackoff(3);

      expect(attempt0).toBe(1000); // Base delay
      expect(attempt1).toBe(2000); // 2x
      expect(attempt2).toBe(4000); // 4x
      expect(attempt3).toBe(8000); // 8x
    });

    it('should respect max delay limit', () => {
      const delay = RateLimitError.calculateBackoff(10, 1000, 5000);
      expect(delay).toBeLessThanOrEqual(5000);
    });
  });

  describe('ValidationError', () => {
    it('should provide user-friendly message with field name', () => {
      const error = new ValidationError('Invalid format', 'apiKey');
      const message = error.getUserMessage();

      expect(message).toContain('Validation failed');
      expect(message).toContain('field: apiKey');
      expect(message).toContain('Invalid format');
    });

    it('should provide message without field name if not provided', () => {
      const error = new ValidationError('Invalid format');
      const message = error.getUserMessage();

      expect(message).toContain('Validation failed');
      expect(message).toContain('Invalid format');
      expect(message).not.toContain('field:');
    });

    it('should provide actionable guidance for file path errors', () => {
      const error = new ValidationError(
        'File path is outside the allowed directory',
        'filePath'
      );
      const message = error.getUserMessage();

      expect(message).toContain('Validation failed');
      expect(message).toContain('filePath');
      expect(message).toContain('outside the allowed directory');
    });
  });
});

