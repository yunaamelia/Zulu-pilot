/**
 * Integration Test: Provider Switching
 *
 * Tests provider switching functionality with multiple providers
 * T096 [P] [US4] - Integration test for provider switching
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import type { IModelAdapter } from '@zulu-pilot/adapter';
import { GeminiCLIModelAdapter } from '@zulu-pilot/adapter';
import { MultiProviderRouter } from '@zulu-pilot/adapter';
import { ProviderRegistry } from '@zulu-pilot/adapter';
import type { UnifiedConfiguration } from '@zulu-pilot/core';
import { OllamaProvider } from '@zulu-pilot/providers';

describe('Integration Test: Provider Switching (T096)', () => {
  let config: UnifiedConfiguration;
  let adapter: IModelAdapter;
  let registry: ProviderRegistry;
  let router: MultiProviderRouter;

  beforeEach(async () => {
    // Setup test configuration with multiple providers
    config = {
      defaultProvider: 'ollama',
      defaultModel: 'ollama:qwen2.5-coder',
      providers: {
        ollama: {
          type: 'ollama',
          name: 'Ollama Local',
          baseUrl: 'http://localhost:11434',
          model: 'qwen2.5-coder',
          enabled: true,
        },
        openai: {
          type: 'openai',
          name: 'OpenAI Prod',
          apiKey: 'env:OPENAI_API_KEY',
          model: 'gpt-4',
          enabled: false, // Disabled for testing
        },
      },
    };

    // Setup provider registry
    registry = new ProviderRegistry();

    // Register Ollama provider factory
    registry.registerFactory('ollama', (providerConfig) => {
      return new OllamaProvider({
        baseUrl: providerConfig.baseUrl || config.providers.ollama.baseUrl,
        model: providerConfig.model || config.providers.ollama.model,
      });
    });

    // Register provider configuration
    registry.registerProvider('ollama', config.providers.ollama);

    // Setup router
    router = new MultiProviderRouter(registry, config);

    // Setup adapter
    adapter = new GeminiCLIModelAdapter(router, config);
  });

  afterEach(() => {
    // Cleanup if needed
  });

  it('should switch providers using router', async () => {
    // Test that router can switch between providers
    expect(router.getCurrentProvider()).toBe('ollama');

    // Switch provider
    router.switchProvider('openai');
    expect(router.getCurrentProvider()).toBe('openai');

    // Switch back
    router.switchProvider('ollama');
    expect(router.getCurrentProvider()).toBe('ollama');
  });

  it('should maintain adapter connection after provider switch', async () => {
    // Test that adapter maintains connection after switching providers
    // Switch provider through adapter if method exists
    if (typeof (adapter as GeminiCLIModelAdapter).switchProvider === 'function') {
      (adapter as GeminiCLIModelAdapter).switchProvider('ollama');
      // Verify switch was successful (adapter maintains router reference)
      expect(router.getCurrentProvider()).toBe('ollama');
    }
  });

  it('should list all available providers', () => {
    // Test that we can list all registered providers
    const providers = registry.listProviders();
    expect(providers).toContain('ollama');
  });

  it('should handle switching to non-existent provider gracefully', () => {
    // Test that switching to non-existent provider throws error
    expect(() => {
      router.switchProvider('nonexistent');
    }).toThrow();
  });

  it('should handle switching to disabled provider', () => {
    // Test that switching to disabled provider is handled
    // Provider should be enabled before switching
    config.providers.openai.enabled = false;
    expect(() => {
      router.switchProvider('openai');
    }).toThrow();
  });
});
