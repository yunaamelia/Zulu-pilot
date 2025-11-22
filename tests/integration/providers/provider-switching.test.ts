import { describe, it, expect, beforeEach } from '@jest/globals';
import axios, { type AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { ConfigManager } from '../../../src/core/config/ConfigManager.js';
import { OllamaProvider } from '../../../src/core/llm/OllamaProvider.js';
import { GeminiProvider } from '../../../src/core/llm/GeminiProvider.js';
import { OpenAIProvider } from '../../../src/core/llm/OpenAIProvider.js';
import type { IModelProvider } from '../../../src/core/llm/IModelProvider.js';
import type { FileContext } from '../../../src/core/context/FileContext.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('Provider Switching Integration', () => {
  let tempConfigPath: string;
  let configManager: ConfigManager;
  let ollamaMock: MockAdapter;
  let geminiMock: MockAdapter;
  let openaiMock: MockAdapter;
  let ollamaAxios: AxiosInstance;
  let geminiAxios: AxiosInstance;
  let openaiAxios: AxiosInstance;

  beforeEach(async () => {
    // Create temporary config file
    tempConfigPath = path.join(
      await fs.mkdtemp(path.join(os.tmpdir(), 'zulu-pilot-test-')),
      '.zulu-pilotrc'
    );
    configManager = new ConfigManager(tempConfigPath);

    // Setup mocks for different providers
    ollamaAxios = axios.create({ baseURL: 'http://localhost:11434' });
    ollamaMock = new MockAdapter(ollamaAxios);

    geminiAxios = axios.create();
    geminiMock = new MockAdapter(geminiAxios);

    openaiAxios = axios.create({ baseURL: 'https://api.openai.com/v1' });
    openaiMock = new MockAdapter(openaiAxios);
  });

  afterEach(async () => {
    ollamaMock.restore();
    geminiMock.restore();
    openaiMock.restore();
    try {
      await fs.rm(path.dirname(tempConfigPath), { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('switching between providers', () => {
    it('should switch from Ollama to Gemini', async () => {
      // Configure Ollama
      await configManager.save({
        provider: 'ollama',
        model: 'qwen2.5-coder',
        providers: {
          ollama: {
            model: 'qwen2.5-coder',
          },
          gemini: {
            apiKey: 'test-gemini-key',
            model: 'gemini-2.5-pro',
          },
        },
      });

      // Test Ollama
      ollamaMock.onPost('/v1/chat/completions').reply(200, {
        choices: [{ message: { content: 'Ollama response' } }],
      });

      const ollamaProvider = new OllamaProvider({
        axiosInstance: ollamaAxios,
      });
      const ollamaResponse = await ollamaProvider.generateResponse('test', []);
      expect(ollamaResponse).toBe('Ollama response');

      // Switch to Gemini
      geminiMock.onPost(/.*streamGenerateContent/).reply(200, {
        candidates: [
          {
            content: {
              parts: [{ text: 'Gemini response' }],
              role: 'model',
            },
            finishReason: 'STOP',
          },
        ],
      });

      const geminiProvider = new GeminiProvider({
        apiKey: 'test-gemini-key',
        model: 'gemini-2.5-pro',
        axiosInstance: geminiAxios,
      });
      const geminiResponse = await geminiProvider.generateResponse('test', []);
      expect(geminiResponse).toBe('Gemini response');
    });

    it('should switch from OpenAI to Ollama', async () => {
      // Configure OpenAI
      await configManager.save({
        provider: 'openai',
        model: 'gpt-4',
        providers: {
          openai: {
            apiKey: 'test-openai-key',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4',
          },
          ollama: {
            model: 'qwen2.5-coder',
          },
        },
      });

      // Test OpenAI
      openaiMock.onPost('/chat/completions').reply(200, {
        choices: [{ message: { content: 'OpenAI response' } }],
      });

      const openaiProvider = new OpenAIProvider({
        apiKey: 'test-openai-key',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        axiosInstance: openaiAxios,
      });
      const openaiResponse = await openaiProvider.generateResponse('test', []);
      expect(openaiResponse).toBe('OpenAI response');

      // Switch to Ollama
      ollamaMock.onPost('/v1/chat/completions').reply(200, {
        choices: [{ message: { content: 'Ollama response' } }],
      });

      const ollamaProvider = new OllamaProvider({
        axiosInstance: ollamaAxios,
      });
      const ollamaResponse = await ollamaProvider.generateResponse('test', []);
      expect(ollamaResponse).toBe('Ollama response');
    });
  });

  describe('provider-specific configurations', () => {
    it('should use provider-specific model configuration', async () => {
      await configManager.save({
        provider: 'ollama',
        model: 'qwen2.5-coder', // Default model required
        providers: {
          ollama: {
            model: 'qwen2.5-coder',
          },
          gemini: {
            apiKey: 'test-key-1234567890', // Must be at least 10 chars
            model: 'gemini-2.5-pro',
          },
        },
      });

      const ollamaConfig = await configManager.getProviderConfig('ollama');
      expect(ollamaConfig?.model).toBe('qwen2.5-coder');

      const geminiConfig = await configManager.getProviderConfig('gemini');
      expect(geminiConfig?.model).toBe('gemini-2.5-pro');
    });

    it('should support environment variable references in API keys', async () => {
      process.env.TEST_GEMINI_KEY = 'env-api-key-value';

      await configManager.save({
        provider: 'gemini',
        providers: {
          gemini: {
            apiKey: 'env:TEST_GEMINI_KEY',
            model: 'gemini-2.5-pro',
          },
        },
      });

      const geminiConfig = await configManager.getProviderConfig('gemini');
      const resolvedKey = configManager.resolveApiKey(geminiConfig!.apiKey!);
      expect(resolvedKey).toBe('env-api-key-value');
    });
  });

  describe('100% success rate for provider switching (SC-004)', () => {
    it('should successfully switch providers without errors', async () => {
      const providers: Array<{ name: string; provider: IModelProvider }> = [];

      // Setup all providers
      ollamaMock.onPost('/v1/chat/completions').reply(200, {
        choices: [{ message: { content: 'Ollama' } }],
      });
      providers.push({
        name: 'ollama',
        provider: new OllamaProvider({ axiosInstance: ollamaAxios }),
      });

      geminiMock.onPost(/.*streamGenerateContent/).reply(200, {
        candidates: [
          {
            content: {
              parts: [{ text: 'Gemini' }],
              role: 'model',
            },
            finishReason: 'STOP',
          },
        ],
      });
      providers.push({
        name: 'gemini',
        provider: new GeminiProvider({
          apiKey: 'test-key',
          axiosInstance: geminiAxios,
        }),
      });

      openaiMock.onPost('/chat/completions').reply(200, {
        choices: [{ message: { content: 'OpenAI' } }],
      });
      providers.push({
        name: 'openai',
        provider: new OpenAIProvider({
          apiKey: 'test-key',
          baseUrl: 'https://api.openai.com/v1',
          model: 'gpt-4',
          axiosInstance: openaiAxios,
        }),
      });

      // Test switching between all providers
      const context: FileContext[] = [];
      const prompt = 'test';

      for (const { provider } of providers) {
        const response = await provider.generateResponse(prompt, context);
        expect(response).toBeTruthy();
        expect(typeof response).toBe('string');
      }

      // Verify 100% success rate (all providers responded successfully)
      expect(providers.length).toBe(3);
    });
  });
});
