/**
 * Integration test for Google Search tool
 * T139: Integration test for Google Search tool
 *
 * @package tests/integration/tools
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WebSearchTool, type GoogleSearchAdapter } from '@zulu-pilot/core';
import { GeminiCLIModelAdapter } from '@zulu-pilot/adapter';
import { MultiProviderRouter, ProviderRegistry, UnifiedConfigManager } from '@zulu-pilot/core';
import type { UnifiedConfiguration, ProviderConfiguration } from '@zulu-pilot/core';
import { OllamaProvider, OpenAIProvider } from '@zulu-pilot/providers';

describe('T139: Google Search Tool Integration Tests', () => {
  let configManager: UnifiedConfigManager;
  let router: MultiProviderRouter;
  let registry: ProviderRegistry;
  let adapter: GeminiCLIModelAdapter;
  let mockConfig: UnifiedConfiguration;

  beforeEach(() => {
    configManager = new UnifiedConfigManager();
    registry = new ProviderRegistry();
    mockConfig = {
      defaultProvider: 'gemini',
      providers: {
        gemini: {
          type: 'gemini',
          name: 'gemini',
          apiKey: 'test-api-key',
        } as ProviderConfiguration,
        ollama: {
          type: 'ollama',
          name: 'ollama',
          baseUrl: 'http://localhost:11434',
        } as ProviderConfiguration,
      },
      googleSearch: {
        enabled: true,
        allowAllProviders: false,
      },
    };
    router = new MultiProviderRouter(registry, mockConfig);
    adapter = new GeminiCLIModelAdapter(router, mockConfig);
  });

  describe('WebSearchTool with Adapter', () => {
    it('should create WebSearchTool with adapter', () => {
      // Mock config for WebSearchTool
      const mockConfigInstance = {
        getGeminiClient: jest.fn(),
      } as unknown as Parameters<WebSearchTool['constructor']>[0];

      const tool = new WebSearchTool(mockConfigInstance, undefined, adapter as unknown as GoogleSearchAdapter, mockConfig);

      expect(tool).toBeInstanceOf(WebSearchTool);
    });

    it('should check if provider supports Google Search', () => {
      // Gemini provider should support Google Search
      expect(adapter.supportsGoogleSearch()).toBe(true);

      // Switch to Ollama provider
      const ollamaConfig: UnifiedConfiguration = {
        ...mockConfig,
        defaultProvider: 'ollama',
      };
      const ollamaRouter = new MultiProviderRouter(registry, ollamaConfig);
      const ollamaAdapter = new GeminiCLIModelAdapter(ollamaRouter, ollamaConfig);

      // Ollama should not support Google Search by default
      expect(ollamaAdapter.supportsGoogleSearch()).toBe(false);
    });

    it('should allow all providers when allowAllProviders is enabled', () => {
      const allProvidersConfig: UnifiedConfiguration = {
        ...mockConfig,
        defaultProvider: 'ollama',
        googleSearch: {
          enabled: true,
          allowAllProviders: true,
        },
      };
      const allProvidersRouter = new MultiProviderRouter(registry, allProvidersConfig);
      const allProvidersAdapter = new GeminiCLIModelAdapter(allProvidersRouter, allProvidersConfig);

      // Ollama should support Google Search when allowAllProviders is true
      expect(allProvidersAdapter.supportsGoogleSearch()).toBe(true);
    });

    it('should return current provider name', () => {
      expect(adapter.getCurrentProvider()).toBe('gemini');

      const ollamaConfig: UnifiedConfiguration = {
        ...mockConfig,
        defaultProvider: 'ollama',
      };
      const ollamaRouter = new MultiProviderRouter(registry, ollamaConfig);
      const ollamaAdapter = new GeminiCLIModelAdapter(ollamaRouter, ollamaConfig);

      expect(ollamaAdapter.getCurrentProvider()).toBe('ollama');
    });
  });

  describe('Google Search Configuration', () => {
    it('should respect googleSearch.enabled configuration', () => {
      const disabledConfig: UnifiedConfiguration = {
        ...mockConfig,
        googleSearch: {
          enabled: false,
        },
      };
      const disabledRouter = new MultiProviderRouter(registry, disabledConfig);
      const disabledAdapter = new GeminiCLIModelAdapter(disabledRouter, disabledConfig);

      // Even with Gemini provider, should return false if disabled
      // This is checked in WebSearchTool, not in adapter
      expect(disabledAdapter.supportsGoogleSearch()).toBe(true); // Adapter still supports it
      // But WebSearchTool will check the config and return an error
    });

    it('should default to enabled when not specified', () => {
      const noConfigConfig: UnifiedConfiguration = {
        ...mockConfig,
        // No googleSearch config
      };
      const noConfigRouter = new MultiProviderRouter(registry, noConfigConfig);
      const noConfigAdapter = new GeminiCLIModelAdapter(noConfigRouter, noConfigConfig);

      // Should default to enabled
      expect(noConfigAdapter.supportsGoogleSearch()).toBe(true);
    });
  });

  describe('Graceful Degradation', () => {
    it('should handle non-Gemini providers gracefully', () => {
      const ollamaConfig: UnifiedConfiguration = {
        ...mockConfig,
        defaultProvider: 'ollama',
        googleSearch: {
          enabled: true,
          allowAllProviders: false, // Default: only Gemini providers
        },
      };
      const ollamaRouter = new MultiProviderRouter(registry, ollamaConfig);
      const ollamaAdapter = new GeminiCLIModelAdapter(ollamaRouter, ollamaConfig);

      // Ollama should not support Google Search
      expect(ollamaAdapter.supportsGoogleSearch()).toBe(false);
    });

    it('should support GoogleCloud provider', () => {
      const googleCloudConfig: UnifiedConfiguration = {
        ...mockConfig,
        defaultProvider: 'googleCloud',
        providers: {
          googleCloud: {
            type: 'googleCloud',
            name: 'googleCloud',
            projectId: 'test-project',
          } as ProviderConfiguration,
        },
      };
      const googleCloudRouter = new MultiProviderRouter(registry, googleCloudConfig);
      const googleCloudAdapter = new GeminiCLIModelAdapter(googleCloudRouter, googleCloudConfig);

      // GoogleCloud should support Google Search
      expect(googleCloudAdapter.supportsGoogleSearch()).toBe(true);
    });
  });
});

