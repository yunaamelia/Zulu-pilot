import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { OllamaProvider } from '../../../../src/core/llm/OllamaProvider.js';
import type { FileContext } from '../../../../src/core/context/FileContext.js';
import { ConnectionError, RateLimitError } from '../../../../src/utils/errors.js';

describe('OllamaProvider', () => {
  let provider: OllamaProvider;
  let mockAdapter: MockAdapter;
  let axiosInstance: ReturnType<typeof axios.create>;

  beforeEach(() => {
    axiosInstance = axios.create({
      baseURL: 'http://localhost:11434',
      timeout: 5000,
    });
    mockAdapter = new MockAdapter(axiosInstance);
    provider = new OllamaProvider({
      baseUrl: 'http://localhost:11434',
      model: 'qwen2.5-coder',
      axiosInstance,
    });
  });

  afterEach(() => {
    mockAdapter.restore();
  });

  describe('streamResponse', () => {
    it('should generate response successfully', async () => {
      const prompt = 'How do I sort an array?';
      const context: FileContext[] = [];

      // Mock response - full streaming test will be in integration tests
      mockAdapter.onPost('/v1/chat/completions').reply(200, {
        choices: [{ message: { content: 'Hello world' } }],
      });

      const result = await provider.generateResponse(prompt, context);
      expect(result).toBe('Hello world');
    });

    it('should handle connection errors gracefully', async () => {
      const prompt = 'Test prompt';
      const context: FileContext[] = [];

      mockAdapter.onPost('/v1/chat/completions').networkError();

      await expect(provider.generateResponse(prompt, context)).rejects.toThrow(ConnectionError);
    });

    it('should handle rate limit errors', async () => {
      const prompt = 'Test prompt';
      const context: FileContext[] = [];

      mockAdapter
        .onPost('/v1/chat/completions')
        .reply(429, { error: { message: 'rate limit exceeded' } });

      await expect(provider.generateResponse(prompt, context)).rejects.toThrow(RateLimitError);
    });
  });

  describe('generateResponse', () => {
    it('should generate complete response', async () => {
      const prompt = 'How do I sort an array?';
      const context: FileContext[] = [];

      const response = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1694268190,
        model: 'qwen2.5-coder',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'You can use Array.sort()',
            },
            finish_reason: 'stop',
          },
        ],
      };

      mockAdapter.onPost('/v1/chat/completions').reply(200, response);

      const result = await provider.generateResponse(prompt, context);

      expect(result).toBe('You can use Array.sort()');
    });

    it('should handle connection errors', async () => {
      const prompt = 'Test prompt';
      const context: FileContext[] = [];

      mockAdapter.onPost('/v1/chat/completions').networkError();

      await expect(provider.generateResponse(prompt, context)).rejects.toThrow(ConnectionError);
    });
  });

  describe('model configuration', () => {
    it('should use default model when not specified', () => {
      const defaultProvider = new OllamaProvider({
        baseUrl: 'http://localhost:11434',
        axiosInstance,
      });
      expect(defaultProvider.getModel()).toBe('qwen2.5-coder');
    });

    it('should use custom model when specified', () => {
      const customProvider = new OllamaProvider({
        baseUrl: 'http://localhost:11434',
        model: 'llama2',
        axiosInstance,
      });
      expect(customProvider.getModel()).toBe('llama2');
    });
  });
});
