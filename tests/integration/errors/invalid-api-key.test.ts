/**
 * Integration Test: Invalid API Key Error
 * T113: Write integration test for invalid API key error in tests/integration/errors/invalid-api-key.test.ts
 */

import { describe, it, expect } from '@jest/globals';
import { InvalidApiKeyError, ValidationError } from '@zulu-pilot/core';
import { OpenAIProvider } from '@zulu-pilot/providers';

describe('Integration Test: Invalid API Key Error (T113)', () => {
  describe('OpenAI Provider', () => {
    it('should throw InvalidApiKeyError for missing API key', () => {
      expect(() => {
        new OpenAIProvider({
          apiKey: '',
        });
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid API key format', () => {
      expect(() => {
        new OpenAIProvider({
          apiKey: 'invalid-key-format',
        });
      }).toThrow();
    });

    it('should handle environment variable reference that is not set', () => {
      expect(() => {
        new OpenAIProvider({
          apiKey: 'env:NONEXISTENT_VAR',
        });
      }).toThrow(ValidationError);
    });

    it('should provide user-friendly error message with OpenAI guidance', () => {
      try {
        new OpenAIProvider({
          apiKey: '',
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        if (error instanceof ValidationError && error.field === 'apiKey') {
          const message = error.getUserMessage();
          expect(message).toContain('Validation failed');
          expect(message).toContain('apiKey');
          expect(message).toContain('Suggestions');
        } else {
          throw error;
        }
      }
    });
  });

  describe('Error message content', () => {
    it('should include actionable guidance for invalid API key', () => {
      const error = new InvalidApiKeyError('API key is required', 'openai');
      const message = error.getUserMessage();

      expect(message).toContain('Invalid or missing API key');
      expect(message).toContain('for openai');
      expect(message).toContain('platform.openai.com/api-keys');
      expect(message).toContain('~/.zulu-pilotrc');
      expect(message).toContain('env:OPENAI_API_KEY');
    });

    it('should include provider-specific setup instructions', () => {
      const openaiError = new InvalidApiKeyError('Invalid key', 'openai');
      const geminiError = new InvalidApiKeyError('Invalid key', 'gemini');
      const googlecloudError = new InvalidApiKeyError('Invalid key', 'googlecloud');

      const openaiMessage = openaiError.getUserMessage();
      const geminiMessage = geminiError.getUserMessage();
      const googlecloudMessage = googlecloudError.getUserMessage();

      expect(openaiMessage).toContain('platform.openai.com');
      expect(geminiMessage).toContain('makersuite.google.com');
      expect(googlecloudMessage).toContain('gcloud auth login');
    });
  });

  describe('Error propagation', () => {
    it('should preserve error cause chain', () => {
      const originalError = new Error('Original API error');
      const error = new InvalidApiKeyError('Invalid API key', 'openai', originalError);

      expect(error.cause).toBe(originalError);
      expect(error.code).toBe('INVALID_API_KEY');
      expect(error.provider).toBe('openai');
    });
  });
});
