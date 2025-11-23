/**
 * Test Google Search tool with all providers
 * T142: Test Google Search tool with all providers
 *
 * @package tests/integration/tools
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WebSearchTool } from '@zulu-pilot/core';
import { GeminiCLIModelAdapter, MultiProviderRouter, ProviderRegistry } from '@zulu-pilot/adapter';
import type { UnifiedConfiguration, ProviderConfiguration } from '@zulu-pilot/core';

describe('T142: Google Search Tool with All Providers', () => {
  let router: MultiProviderRouter;
  let registry: ProviderRegistry;
  let mockConfig: UnifiedConfiguration;

  beforeEach(() => {
    registry = new ProviderRegistry();
    mockConfig = {
      defaultProvider: 'ollama',
      providers: {
        ollama: {
          type: 'ollama',
          name: 'ollama',
          baseUrl: 'http://localhost:11434',
        } as ProviderConfiguration,
        openai: {
          type: 'openai',
          name: 'openai',
          apiKey: 'test-api-key',
        } as ProviderConfiguration,
        googleCloud: {
          type: 'googleCloud',
          name: 'googleCloud',
          projectId: 'test-project',
        } as ProviderConfiguration,
        gemini: {
          type: 'gemini',
          name: 'gemini',
          apiKey: 'test-api-key',
        } as ProviderConfiguration,
      },
      googleSearch: {
        enabled: true,
        allowAllProviders: false,
      },
    };
  });

  describe('Provider Support Detection', () => {
    it('should detect Gemini provider supports Google Search', () => {
      const geminiConfig: UnifiedConfiguration = {
        ...mockConfig,
        defaultProvider: 'gemini',
      };
      router = new MultiProviderRouter(registry, geminiConfig);
      const adapter = new GeminiCLIModelAdapter(router, geminiConfig);

      expect(adapter.supportsGoogleSearch()).toBe(true);
      expect(adapter.getCurrentProvider()).toBe('gemini');
    });

    it('should detect GoogleCloud provider supports Google Search', () => {
      const googleCloudConfig: UnifiedConfiguration = {
        ...mockConfig,
        defaultProvider: 'googleCloud',
      };
      router = new MultiProviderRouter(registry, googleCloudConfig);
      const adapter = new GeminiCLIModelAdapter(router, googleCloudConfig);

      expect(adapter.supportsGoogleSearch()).toBe(true);
      expect(adapter.getCurrentProvider()).toBe('googleCloud');
    });

    it('should detect Ollama provider does not support Google Search by default', () => {
      const ollamaConfig: UnifiedConfiguration = {
        ...mockConfig,
        defaultProvider: 'ollama',
      };
      router = new MultiProviderRouter(registry, ollamaConfig);
      const adapter = new GeminiCLIModelAdapter(router, ollamaConfig);

      expect(adapter.supportsGoogleSearch()).toBe(false);
      expect(adapter.getCurrentProvider()).toBe('ollama');
    });

    it('should detect OpenAI provider does not support Google Search by default', () => {
      const openaiConfig: UnifiedConfiguration = {
        ...mockConfig,
        defaultProvider: 'openai',
      };
      router = new MultiProviderRouter(registry, openaiConfig);
      const adapter = new GeminiCLIModelAdapter(router, openaiConfig);

      expect(adapter.supportsGoogleSearch()).toBe(false);
      expect(adapter.getCurrentProvider()).toBe('openai');
    });
  });

  describe('allowAllProviders Configuration', () => {
    it('should allow Ollama provider when allowAllProviders is true', () => {
      const ollamaConfig: UnifiedConfiguration = {
        ...mockConfig,
        defaultProvider: 'ollama',
        googleSearch: {
          enabled: true,
          allowAllProviders: true,
        },
      };
      router = new MultiProviderRouter(registry, ollamaConfig);
      const adapter = new GeminiCLIModelAdapter(router, ollamaConfig);

      expect(adapter.supportsGoogleSearch()).toBe(true);
    });

    it('should allow OpenAI provider when allowAllProviders is true', () => {
      const openaiConfig: UnifiedConfiguration = {
        ...mockConfig,
        defaultProvider: 'openai',
        googleSearch: {
          enabled: true,
          allowAllProviders: true,
        },
      };
      router = new MultiProviderRouter(registry, openaiConfig);
      const adapter = new GeminiCLIModelAdapter(router, openaiConfig);

      expect(adapter.supportsGoogleSearch()).toBe(true);
    });

    it('should still support Gemini providers when allowAllProviders is true', () => {
      const geminiConfig: UnifiedConfiguration = {
        ...mockConfig,
        defaultProvider: 'gemini',
        googleSearch: {
          enabled: true,
          allowAllProviders: true,
        },
      };
      router = new MultiProviderRouter(registry, geminiConfig);
      const adapter = new GeminiCLIModelAdapter(router, geminiConfig);

      expect(adapter.supportsGoogleSearch()).toBe(true);
    });
  });

  describe('WebSearchTool with Different Providers', () => {
    it('should create WebSearchTool with Gemini provider', () => {
      const geminiConfig: UnifiedConfiguration = {
        ...mockConfig,
        defaultProvider: 'gemini',
      };
      router = new MultiProviderRouter(registry, geminiConfig);
      const adapter = new GeminiCLIModelAdapter(router, geminiConfig);

      const mockConfigInstance = {
        getGeminiClient: jest.fn(),
      } as any;

      const tool = new WebSearchTool(mockConfigInstance, undefined, adapter as any, geminiConfig);

      expect(tool).toBeDefined();
      expect(adapter.supportsGoogleSearch()).toBe(true);
    });

    it('should create WebSearchTool with Ollama provider (graceful degradation)', async () => {
      const ollamaConfig: UnifiedConfiguration = {
        ...mockConfig,
        defaultProvider: 'ollama',
        googleSearch: {
          enabled: true,
          allowAllProviders: false,
        },
      };
      router = new MultiProviderRouter(registry, ollamaConfig);
      const adapter = new GeminiCLIModelAdapter(router, ollamaConfig);

      const mockConfigInstance = {
        getGeminiClient: jest.fn(),
      } as any;

      const tool = new WebSearchTool(mockConfigInstance, undefined, adapter as any, ollamaConfig);

      expect(tool).toBeDefined();
      expect(adapter.supportsGoogleSearch()).toBe(false);
      
      // Verify graceful degradation is configured correctly
      expect(ollamaConfig.googleSearch?.allowAllProviders).toBe(false);
    });

    it('should create WebSearchTool with OpenAI provider (graceful degradation)', async () => {
      const openaiConfig: UnifiedConfiguration = {
        ...mockConfig,
        defaultProvider: 'openai',
        googleSearch: {
          enabled: true,
          allowAllProviders: false,
        },
      };
      router = new MultiProviderRouter(registry, openaiConfig);
      const adapter = new GeminiCLIModelAdapter(router, openaiConfig);

      const mockConfigInstance = {
        getGeminiClient: jest.fn(),
      } as any;

      const tool = new WebSearchTool(mockConfigInstance, undefined, adapter as any, openaiConfig);

      expect(tool).toBeDefined();
      expect(adapter.supportsGoogleSearch()).toBe(false);
      
      // Verify graceful degradation is configured correctly
      expect(openaiConfig.googleSearch?.allowAllProviders).toBe(false);
    });

    it('should create WebSearchTool with GoogleCloud provider', () => {
      const googleCloudConfig: UnifiedConfiguration = {
        ...mockConfig,
        defaultProvider: 'googleCloud',
      };
      router = new MultiProviderRouter(registry, googleCloudConfig);
      const adapter = new GeminiCLIModelAdapter(router, googleCloudConfig);

      const mockConfigInstance = {
        getGeminiClient: jest.fn(),
      } as any;

      const tool = new WebSearchTool(mockConfigInstance, undefined, adapter as any, googleCloudConfig);

      expect(tool).toBeDefined();
      expect(adapter.supportsGoogleSearch()).toBe(true);
    });
  });
});

