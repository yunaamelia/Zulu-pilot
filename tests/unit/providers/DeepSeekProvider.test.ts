import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { DeepSeekProvider } from '../../../packages/providers/src/DeepSeekProvider.js';
import { ConnectionError, RateLimitError, ValidationError } from '../../../packages/providers/src/utils/errors.js';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * T211: Unit tests for DeepSeekProvider (90%+ coverage target)
 */
describe('T211: DeepSeekProvider', () => {
  let provider: DeepSeekProvider;
  let mockAxiosInstance: jest.Mocked<AxiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      request: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
      },
      defaults: {},
      getUri: jest.fn(),
      head: jest.fn(),
      options: jest.fn(),
    } as unknown as jest.Mocked<AxiosInstance>;

    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
  });

  describe('constructor', () => {
    it('should create provider with default config', () => {
      const originalEnv = process.env.DEEPSEEK_API_KEY;
      process.env.DEEPSEEK_API_KEY = 'test-api-key';

      provider = new DeepSeekProvider();

      expect(provider.getModel()).toBe('deepseek-chat');
      expect(mockedAxios.create).toHaveBeenCalled();
      
      process.env.DEEPSEEK_API_KEY = originalEnv;
    });

    it('should create provider with custom config', () => {
      provider = new DeepSeekProvider({
        apiKey: 'custom-key',
        baseUrl: 'https://custom.api.com',
        model: 'deepseek-coder',
        timeout: 60000,
      });

      expect(provider.getModel()).toBe('deepseek-coder');
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://custom.api.com',
          timeout: 60000,
        })
      );
    });

    it('should throw ValidationError if API key is missing', () => {
      const originalEnv = process.env.DEEPSEEK_API_KEY;
      delete process.env.DEEPSEEK_API_KEY;

      expect(() => {
        new DeepSeekProvider({ apiKey: undefined });
      }).toThrow(ValidationError);

      if (originalEnv) {
        process.env.DEEPSEEK_API_KEY = originalEnv;
      }
    });

    it('should support environment variable references', () => {
      process.env.CUSTOM_DEEPSEEK_KEY = 'env-key';

      provider = new DeepSeekProvider({
        apiKey: 'env:CUSTOM_DEEPSEEK_KEY',
      });

      expect(mockedAxios.create).toHaveBeenCalled();
      expect(provider).toBeDefined();

      delete process.env.CUSTOM_DEEPSEEK_KEY;
    });
  });

  describe('getModel', () => {
    it('should return current model', () => {
      provider = new DeepSeekProvider({
        apiKey: 'test-key',
        model: 'deepseek-coder',
      });

      expect(provider.getModel()).toBe('deepseek-coder');
    });
  });

  describe('setModel', () => {
    it('should set and get model', () => {
      provider = new DeepSeekProvider({
        apiKey: 'test-key',
        model: 'deepseek-chat',
      });

      provider.setModel('deepseek-coder');
      expect(provider.getModel()).toBe('deepseek-coder');
    });
  });

  describe('listModels', () => {
    it('should list available models', async () => {
      provider = new DeepSeekProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          data: [
            { id: 'deepseek-chat' },
            { id: 'deepseek-coder' },
          ],
        },
      });

      const models = await provider.listModels();

      expect(models).toEqual(['deepseek-chat', 'deepseek-coder']);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/models');
    });

    it('should throw ConnectionError on connection failure', async () => {
      provider = new DeepSeekProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      await expect(provider.listModels()).rejects.toThrow(ConnectionError);
    });
  });

  describe('hasModel', () => {
    it('should return true if model exists', async () => {
      provider = new DeepSeekProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          data: [{ id: 'deepseek-chat' }],
        },
      });

      const exists = await provider.hasModel('deepseek-chat');
      expect(exists).toBe(true);
    });

    it('should return false if model does not exist', async () => {
      provider = new DeepSeekProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          data: [{ id: 'deepseek-chat' }],
        },
      });

      const exists = await provider.hasModel('non-existent');
      expect(exists).toBe(false);
    });

    it('should return false on error', async () => {
      provider = new DeepSeekProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      mockAxiosInstance.get.mockRejectedValue(new Error('Error'));

      const exists = await provider.hasModel('any-model');
      expect(exists).toBe(false);
    });
  });

  describe('generateResponse', () => {
    it('should generate response successfully', async () => {
      provider = new DeepSeekProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: 'Generated response',
              },
            },
          ],
        },
      });

      const response = await provider.generateResponse('Hello', []);

      expect(response).toBe('Generated response');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/chat/completions',
        expect.objectContaining({
          model: 'deepseek-chat',
          messages: expect.any(Array),
        })
      );
    });

    it('should include context files in request', async () => {
      provider = new DeepSeekProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: 'Response' } }],
        },
      });

      const context = [
        {
          path: '/file.ts',
          content: 'file content',
          estimatedTokens: 10,
        },
      ];

      await provider.generateResponse('Prompt', context);

      const callArgs = mockAxiosInstance.post.mock.calls[0];
      const messages = callArgs[1].messages;
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toContain('file.ts');
      expect(messages[1].role).toBe('user');
    });

    it('should throw ConnectionError on connection failure', async () => {
      provider = new DeepSeekProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      const error = new Error('Network error') as AxiosError;
      error.response = undefined;
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(provider.generateResponse('Hello', [])).rejects.toThrow(ConnectionError);
    });

    it('should throw RateLimitError on 429 status', async () => {
      provider = new DeepSeekProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      const error = new Error('Rate limit') as AxiosError;
      error.response = {
        status: 429,
        data: { error: { message: 'Rate limit exceeded' } },
      } as any;
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(provider.generateResponse('Hello', [])).rejects.toThrow(RateLimitError);
    });
  });

  describe('streamResponse', () => {
    it('should stream response tokens', async () => {
      provider = new DeepSeekProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      // Mock SSE stream
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n');
          yield Buffer.from('data: {"choices":[{"delta":{"content":" World"}}]}\n\n');
          yield Buffer.from('data: [DONE]\n\n');
        },
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: mockStream,
      });

      const tokens: string[] = [];
      for await (const token of provider.streamResponse('Hello', [])) {
        tokens.push(token);
      }

      expect(tokens).toEqual(['Hello', ' World']);
    });

    it('should handle stream errors', async () => {
      provider = new DeepSeekProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      const error = new Error('Stream error') as AxiosError;
      error.response = undefined;
      mockAxiosInstance.post.mockRejectedValue(error);

      const generator = provider.streamResponse('Hello', []);

      await expect(generator.next()).rejects.toThrow(ConnectionError);
    });
  });
});

