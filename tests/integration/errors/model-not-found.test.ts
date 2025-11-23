/**
 * Integration Test: Model Not Found Error
 * T115: Write integration test for model not found error in tests/integration/errors/model-not-found.test.ts
 */

import { describe, it, expect } from '@jest/globals';
import { ModelNotFoundError } from '@zulu-pilot/core';

describe('Integration Test: Model Not Found Error (T115)', () => {
  describe('Error creation', () => {
    it('should create error with model name and provider', () => {
      const error = new ModelNotFoundError('Model not found', 'gpt-5', 'openai');
      expect(error.message).toBe('Model not found');
      expect(error.modelName).toBe('gpt-5');
      expect(error.provider).toBe('openai');
      expect(error.code).toBe('MODEL_NOT_FOUND');
    });

    it('should work without model name and provider', () => {
      const error = new ModelNotFoundError('Model not found');
      expect(error.message).toBe('Model not found');
      expect(error.modelName).toBeUndefined();
      expect(error.provider).toBeUndefined();
    });
  });

  describe('User-friendly messages', () => {
    it('should provide guidance with model and provider', () => {
      const error = new ModelNotFoundError('Model not found', 'gpt-5', 'openai');
      const message = error.getUserMessage();

      expect(message).toContain('Model "gpt-5"');
      expect(message).toContain('provider "openai"');
      expect(message).toContain('To resolve');
      expect(message).toContain('Verify the model name is correct');
      expect(message).toContain('zulu-pilot model list');
    });

    it('should provide guidance without provider', () => {
      const error = new ModelNotFoundError('Model not found', 'gpt-5');
      const message = error.getUserMessage();

      expect(message).toContain('Model "gpt-5"');
      expect(message).toContain('zulu-pilot model list --provider all');
    });

    it('should provide Ollama-specific guidance', () => {
      const error = new ModelNotFoundError('Model not found', 'qwen2.5-coder', 'ollama');
      const message = error.getUserMessage();

      expect(message).toContain('Model "qwen2.5-coder"');
      expect(message).toContain('provider "ollama"');
      expect(message).toContain('ollama pull');
      expect(message).toContain('For Ollama: Ensure the model is installed');
    });

    it('should provide OpenAI-specific guidance', () => {
      const error = new ModelNotFoundError('Model not found', 'gpt-5', 'openai');
      const message = error.getUserMessage();

      expect(message).toContain('For OpenAI/Gemini');
      expect(message).toContain('account/region');
    });
  });

  describe('Error message structure', () => {
    it('should include numbered resolution steps', () => {
      const error = new ModelNotFoundError('Model not found', 'gpt-4', 'openai');
      const message = error.getUserMessage();

      expect(message).toMatch(/1\./);
      expect(message).toMatch(/2\./);
      expect(message).toMatch(/3\./);
      expect(message).toMatch(/4\./);
      expect(message).toMatch(/5\./);
    });

    it('should include original error message', () => {
      const originalMessage = 'Model gpt-5 does not exist';
      const error = new ModelNotFoundError(originalMessage, 'gpt-5', 'openai');
      const message = error.getUserMessage();

      expect(message).toContain(originalMessage);
      expect(message).toContain('Error:');
    });

    it('should preserve error cause', () => {
      const cause = new Error('404 Not Found');
      const error = new ModelNotFoundError('Model not found', 'gpt-5', 'openai', cause);

      expect(error.cause).toBe(cause);
      expect(error.code).toBe('MODEL_NOT_FOUND');
    });
  });

  describe('Provider-specific scenarios', () => {
    it('should handle Gemini model names', () => {
      const error = new ModelNotFoundError('Model not found', 'gemini-ultra', 'gemini');
      const message = error.getUserMessage();

      expect(message).toContain('gemini-ultra');
      expect(message).toContain('provider "gemini"');
    });

    it('should handle Google Cloud model names', () => {
      const error = new ModelNotFoundError('Model not found', 'text-bison@001', 'googlecloud');
      const message = error.getUserMessage();

      expect(message).toContain('text-bison@001');
      expect(message).toContain('provider "googlecloud"');
    });

    it('should handle model names with special characters', () => {
      const error = new ModelNotFoundError('Model not found', 'model-name@v1', 'googlecloud');
      const message = error.getUserMessage();

      expect(message).toContain('model-name@v1');
    });
  });
});
