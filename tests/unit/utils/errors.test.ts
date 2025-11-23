/**
 * Unit Tests for Error Types
 * T112: Write unit tests for error types in tests/unit/utils/errors.test.ts
 */

import { describe, it, expect } from '@jest/globals';
import {
  AppError,
  ConnectionError,
  RateLimitError,
  ValidationError,
  ModelNotFoundError,
  InvalidApiKeyError,
} from '@zulu-pilot/core';

describe('Error Types (T112)', () => {
  describe('AppError', () => {
    it('should create error with message and code', () => {
      const error = new AppError('Test error', 'TEST_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should include cause error if provided', () => {
      const cause = new Error('Original error');
      const error = new AppError('Wrapped error', 'WRAPPED_ERROR', cause);
      expect(error.cause).toBe(cause);
      expect(error.message).toBe('Wrapped error');
    });

    it('should have correct error name', () => {
      const error = new AppError('Test', 'TEST_ERROR');
      expect(error.name).toBe('AppError');
    });
  });

  describe('ConnectionError', () => {
    it('should create connection error with provider', () => {
      const error = new ConnectionError('Connection refused', 'ollama');
      expect(error.message).toBe('Connection refused');
      expect(error.provider).toBe('ollama');
      expect(error.code).toBe('CONNECTION_ERROR');
    });

    it('should provide user-friendly message for Ollama', () => {
      const error = new ConnectionError('Connection refused', 'ollama');
      const message = error.getUserMessage();

      expect(message).toContain('Failed to connect to Ollama');
      expect(message).toContain('Ollama is running locally');
      expect(message).toContain('The model is installed');
      expect(message).toContain('network connection');
      expect(message).toContain('Connection refused');
    });

    it('should provide user-friendly message for Gemini', () => {
      const error = new ConnectionError('Network timeout', 'gemini');
      const message = error.getUserMessage();

      expect(message).toContain('Failed to connect to Gemini');
      expect(message).toContain('API key is valid');
      expect(message).toContain('internet connection');
      expect(message).toContain('API endpoint is accessible');
      expect(message).toContain('Network timeout');
    });

    it('should provide user-friendly message for OpenAI', () => {
      const error = new ConnectionError('Connection failed', 'openai');
      const message = error.getUserMessage();

      expect(message).toContain('Failed to connect to OpenAI');
      expect(message).toContain('API key is valid');
      expect(message).toContain('api.openai.com');
      expect(message).toContain('account quota and billing status');
    });

    it('should provide user-friendly message for Google Cloud', () => {
      const error = new ConnectionError('Auth failed', 'googleCloud');
      const message = error.getUserMessage();

      expect(message).toContain('Failed to connect to Google Cloud AI Platform');
      expect(message).toContain('gcloud CLI is installed');
      expect(message).toContain('Project ID and region');
      expect(message).toContain('API is enabled');
    });

    it('should provide generic message for unknown providers', () => {
      const error = new ConnectionError('Connection failed', 'unknown');
      const message = error.getUserMessage();

      expect(message).toContain('Failed to connect to unknown');
      expect(message).toContain('internet connection');
      expect(message).toContain('API endpoint is accessible');
    });

    it('should include actionable guidance steps', () => {
      const error = new ConnectionError('Connection refused', 'ollama');
      const message = error.getUserMessage();

      // Should have numbered steps
      expect(message).toMatch(/1\./);
      expect(message).toMatch(/2\./);
      expect(message).toMatch(/3\./);
    });

    it('should include cause error if provided', () => {
      const cause = new Error('Network error');
      const error = new ConnectionError('Connection failed', 'openai', cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error', () => {
      const error = new RateLimitError('Rate limit exceeded');
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe('RATE_LIMIT_ERROR');
    });

    it('should include retryAfter time if provided', () => {
      const error = new RateLimitError('Rate limit exceeded', 60);
      expect(error.retryAfter).toBe(60);
    });

    it('should provide retry guidance with retry-after time', () => {
      const error = new RateLimitError('Rate limit exceeded', 60);
      const message = error.getUserMessage();

      expect(message).toContain('Rate limit exceeded');
      expect(message).toContain('Retry after 60 seconds');
      expect(message).toContain('exponential backoff');
    });

    it('should provide generic retry guidance without retry-after time', () => {
      const error = new RateLimitError('Rate limit exceeded');
      const message = error.getUserMessage();

      expect(message).toContain('Rate limit exceeded');
      expect(message).toContain('Please retry in a few moments');
      expect(message).toContain('To resolve');
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
      expect(delay).toBe(5000);
    });

    it('should use custom base delay', () => {
      const delay = RateLimitError.calculateBackoff(2, 2000);
      expect(delay).toBe(8000); // 2000 * 2^2
    });

    it('should include cause error if provided', () => {
      const cause = new Error('HTTP 429');
      const error = new RateLimitError('Rate limit', 60, cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with field', () => {
      const error = new ValidationError('Invalid format', 'apiKey');
      expect(error.message).toBe('Invalid format');
      expect(error.field).toBe('apiKey');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should create validation error without field', () => {
      const error = new ValidationError('Invalid format');
      expect(error.message).toBe('Invalid format');
      expect(error.field).toBeUndefined();
    });

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

    it('should provide actionable guidance for filePath errors', () => {
      const error = new ValidationError('File path is outside the allowed directory', 'filePath');
      const message = error.getUserMessage();

      expect(message).toContain('Validation failed');
      expect(message).toContain('filePath');
      expect(message).toContain('Suggestions');
      expect(message).toContain('relative paths');
      expect(message).toContain('directory traversal');
    });

    it('should provide actionable guidance for apiKey errors', () => {
      const error = new ValidationError('Invalid API key format', 'apiKey');
      const message = error.getUserMessage();

      expect(message).toContain('Validation failed');
      expect(message).toContain('apiKey');
      expect(message).toContain('Suggestions');
      expect(message).toContain('env:VAR_NAME');
      expect(message).toContain('~/.zulu-pilotrc');
    });

    it('should provide actionable guidance for model errors', () => {
      const error = new ValidationError('Model not found', 'model');
      const message = error.getUserMessage();

      expect(message).toContain('Validation failed');
      expect(message).toContain('model');
      expect(message).toContain('Suggestions');
      expect(message).toContain('provider:model');
      expect(message).toContain('zulu-pilot model list');
    });

    it('should provide actionable guidance for provider errors', () => {
      const error = new ValidationError('Invalid provider', 'provider');
      const message = error.getUserMessage();

      expect(message).toContain('Validation failed');
      expect(message).toContain('provider');
      expect(message).toContain('Suggestions');
      expect(message).toContain('zulu-pilot provider list');
    });

    it('should include cause error if provided', () => {
      const cause = new Error('Validation failed');
      const error = new ValidationError('Invalid input', 'field', cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe('ModelNotFoundError', () => {
    it('should create model not found error', () => {
      const error = new ModelNotFoundError('Model not found', 'gpt-4', 'openai');
      expect(error.message).toBe('Model not found');
      expect(error.modelName).toBe('gpt-4');
      expect(error.provider).toBe('openai');
      expect(error.code).toBe('MODEL_NOT_FOUND');
    });

    it('should work without model name and provider', () => {
      const error = new ModelNotFoundError('Model not found');
      expect(error.message).toBe('Model not found');
      expect(error.modelName).toBeUndefined();
      expect(error.provider).toBeUndefined();
    });

    it('should provide user-friendly message with model and provider', () => {
      const error = new ModelNotFoundError('Model not found', 'gpt-4', 'openai');
      const message = error.getUserMessage();

      expect(message).toContain('Model "gpt-4"');
      expect(message).toContain('provider "openai"');
      expect(message).toContain('To resolve');
      expect(message).toContain('zulu-pilot model list');
    });

    it('should provide user-friendly message without provider', () => {
      const error = new ModelNotFoundError('Model not found', 'gpt-4');
      const message = error.getUserMessage();

      expect(message).toContain('Model "gpt-4"');
      expect(message).toContain('zulu-pilot model list --provider all');
    });

    it('should provide Ollama-specific guidance', () => {
      const error = new ModelNotFoundError('Model not found', 'qwen2.5-coder', 'ollama');
      const message = error.getUserMessage();

      expect(message).toContain('ollama pull');
    });

    it('should include cause error if provided', () => {
      const cause = new Error('API error');
      const error = new ModelNotFoundError('Model not found', 'gpt-4', 'openai', cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe('InvalidApiKeyError', () => {
    it('should create invalid API key error', () => {
      const error = new InvalidApiKeyError('Invalid API key', 'openai');
      expect(error.message).toBe('Invalid API key');
      expect(error.provider).toBe('openai');
      expect(error.code).toBe('INVALID_API_KEY');
    });

    it('should work without provider', () => {
      const error = new InvalidApiKeyError('Invalid API key');
      expect(error.message).toBe('Invalid API key');
      expect(error.provider).toBeUndefined();
    });

    it('should provide user-friendly message for OpenAI', () => {
      const error = new InvalidApiKeyError('Invalid API key', 'openai');
      const message = error.getUserMessage();

      expect(message).toContain('Invalid or missing API key');
      expect(message).toContain('for openai');
      expect(message).toContain('platform.openai.com/api-keys');
      expect(message).toContain('~/.zulu-pilotrc');
      expect(message).toContain('env:OPENAI_API_KEY');
    });

    it('should provide user-friendly message for Gemini', () => {
      const error = new InvalidApiKeyError('Invalid API key', 'gemini');
      const message = error.getUserMessage();

      expect(message).toContain('Invalid or missing API key');
      expect(message).toContain('for gemini');
      expect(message).toContain('makersuite.google.com/app/apikey');
      expect(message).toContain('env:GEMINI_API_KEY');
    });

    it('should provide user-friendly message for Google Cloud', () => {
      const error = new InvalidApiKeyError('Invalid API key', 'googlecloud');
      const message = error.getUserMessage();

      expect(message).toContain('Invalid or missing API key');
      expect(message).toContain('gcloud auth login');
      expect(message).toContain('gcloud config set project');
      expect(message).toContain('gcloud services enable');
    });

    it('should provide generic guidance without provider', () => {
      const error = new InvalidApiKeyError('Invalid API key');
      const message = error.getUserMessage();

      expect(message).toContain('Invalid or missing API key');
      expect(message).toContain('~/.zulu-pilotrc');
      expect(message).toContain('env:VAR_NAME');
    });

    it('should include cause error if provided', () => {
      const cause = new Error('Auth failed');
      const error = new InvalidApiKeyError('Invalid API key', 'openai', cause);
      expect(error.cause).toBe(cause);
    });
  });
});
