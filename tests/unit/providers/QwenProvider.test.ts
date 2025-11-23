import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { QwenProvider } from '../../../packages/providers/src/QwenProvider.js';
import { ConnectionError, RateLimitError, ValidationError } from '../../../packages/providers/src/utils/errors.js';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * T212: Unit tests for QwenProvider (90%+ coverage target)
 */
describe('T212: QwenProvider', () => {
  let provider: QwenProvider;
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
      const originalEnv = process.env.QWEN_API_KEY;
      process.env.QWEN_API_KEY = 'test-api-key';

      provider = new QwenProvider();

      expect(provider.getModel()).toBe('qwen-turbo');
      expect(mockedAxios.create).toHaveBeenCalled();
      
      process.env.QWEN_API_KEY = originalEnv;
    });

    it('should create provider with custom config', () => {
      provider = new QwenProvider({
        apiKey: 'custom-key',
        baseUrl: 'https://custom.api.com',
        model: 'qwen-plus',
        timeout: 60000,
      });

      expect(provider.getModel()).toBe('qwen-plus');
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://custom.api.com',
          timeout: 60000,
        })
      );
    });

    it('should throw ValidationError if API key is missing', () => {
      const originalEnv = process.env.QWEN_API_KEY;
      delete process.env.QWEN_API_KEY;

      expect(() => {
        new QwenProvider({ apiKey: undefined });
      }).toThrow(ValidationError);

      if (originalEnv) {
        process.env.QWEN_API_KEY = originalEnv;
      }
    });

    it('should support environment variable references', () => {
      process.env.CUSTOM_QWEN_KEY = 'env-key';

      provider = new QwenProvider({
        apiKey: 'env:CUSTOM_QWEN_KEY',
      });

      expect(mockedAxios.create).toHaveBeenCalled();
      expect(provider).toBeDefined();

      delete process.env.CUSTOM_QWEN_KEY;
    });
  });

  describe('getModel', () => {
    it('should return current model', () => {
      provider = new QwenProvider({
        apiKey: 'test-key',
        model: 'qwen-max',
      });

      expect(provider.getModel()).toBe('qwen-max');
    });
  });

  describe('setModel', () => {
    it('should set and get model', () => {
      provider = new QwenProvider({
        apiKey: 'test-key',
        model: 'qwen-turbo',
      });

      provider.setModel('qwen-plus');
      expect(provider.getModel()).toBe('qwen-plus');
    });
  });

  describe('listModels', () => {
    it('should return list of common Qwen models', async () => {
      provider = new QwenProvider({
        apiKey: 'test-key',
      });

      const models = await provider.listModels();

      expect(models).toContain('qwen-turbo');
      expect(models).toContain('qwen-plus');
      expect(models).toContain('qwen-max');
      expect(models).toContain('qwen-max-longcontext');
    });
  });

  describe('hasModel', () => {
    it('should return true if model exists', async () => {
      provider = new QwenProvider({
        apiKey: 'test-key',
      });

      const exists = await provider.hasModel('qwen-turbo');
      expect(exists).toBe(true);
    });

    it('should return false if model does not exist', async () => {
      provider = new QwenProvider({
        apiKey: 'test-key',
      });

      const exists = await provider.hasModel('non-existent');
      expect(exists).toBe(false);
    });
  });

  describe('generateResponse', () => {
    it('should generate response successfully', async () => {
      provider = new QwenProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          output: {
            choices: [
              {
                message: {
                  content: 'Generated response',
                },
              },
            ],
          },
        },
      });

      const response = await provider.generateResponse('Hello', []);

      expect(response).toBe('Generated response');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/services/aigc/text-generation/generation',
        expect.objectContaining({
          model: 'qwen-turbo',
          input: expect.objectContaining({
            messages: expect.any(Array),
          }),
        })
      );
    });

    it('should include context files in request', async () => {
      provider = new QwenProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          output: { choices: [{ message: { content: 'Response' } }] },
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
      const input = callArgs[1].input;
      expect(input.messages[0].role).toBe('system');
      expect(input.messages[0].content).toContain('file.ts');
      expect(input.messages[1].role).toBe('user');
    });

    it('should throw ConnectionError on connection failure', async () => {
      provider = new QwenProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      const error = new Error('Network error') as AxiosError;
      error.response = undefined;
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(provider.generateResponse('Hello', [])).rejects.toThrow(ConnectionError);
    });

    it('should throw RateLimitError on 429 status', async () => {
      provider = new QwenProvider({
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

    it('should throw ValidationError on 401/403 status', async () => {
      provider = new QwenProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      const error = new Error('Unauthorized') as AxiosError;
      error.response = {
        status: 401,
        data: { error: { message: 'Invalid API key' } },
      } as any;
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(provider.generateResponse('Hello', [])).rejects.toThrow(ValidationError);
    });
  });

  describe('streamResponse', () => {
    it('should stream response tokens', async () => {
      provider = new QwenProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      // Mock SSE stream
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('data: {"output":{"choices":[{"message":{"content":"Hello"}}]}}\n\n');
          yield Buffer.from('data: {"output":{"choices":[{"message":{"content":" World"}}]}}\n\n');
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
      provider = new QwenProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      const error = new Error('Stream error') as AxiosError;
      error.response = undefined;
      mockAxiosInstance.post.mockRejectedValue(error);

      const generator = provider.streamResponse('Hello', []);

      await expect(generator.next()).rejects.toThrow(ConnectionError);
    });

    it('should include streaming parameters in request', async () => {
      provider = new QwenProvider({
        apiKey: 'test-key',
        axiosInstance: mockAxiosInstance,
      });

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('data: [DONE]\n\n');
        },
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: mockStream,
      });

      for await (const _ of provider.streamResponse('Hello', [])) {
        // Consume stream
      }

      const callArgs = mockAxiosInstance.post.mock.calls[0];
      expect(callArgs[1].parameters.incremental_output).toBe(true);
    });
  });
});

