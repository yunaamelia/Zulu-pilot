/**
 * Unit tests for ProviderRegistry
 * @package @zulu-pilot/adapter
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ProviderRegistry } from '../../../packages/adapter/src/ProviderRegistry.js';
import type { ProviderConfiguration } from '@zulu-pilot/core';
import type {
  IModelProvider,
  ProviderConfig,
} from '../../../packages/providers/src/IModelProvider.js';

// Mock provider for testing
class MockProvider implements IModelProvider {
  constructor(_name: string) {}

  async *streamResponse(): AsyncGenerator<string, void, unknown> {
    yield 'test response';
  }

  async generateResponse(): Promise<string> {
    return 'test response';
  }
}

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = new ProviderRegistry();
  });

  describe('registerFactory', () => {
    it('should register a provider factory', () => {
      const factory = (config: ProviderConfig) => new MockProvider(config.name);
      registry.registerFactory('test', factory);

      // Factory should be registered (no error thrown)
      expect(true).toBe(true);
    });
  });

  describe('registerProvider', () => {
    it('should register a provider configuration', () => {
      const config: ProviderConfiguration = {
        type: 'ollama',
        name: 'test-provider',
        enabled: true,
      };

      registry.registerProvider('test-provider', config);
      expect(registry.hasProvider('test-provider')).toBe(true);
    });
  });

  describe('getProvider', () => {
    it('should get provider instance with lazy initialization', () => {
      const factory = (config: ProviderConfig) => new MockProvider(config.name);
      registry.registerFactory('ollama', factory);

      const config: ProviderConfiguration = {
        type: 'ollama',
        name: 'test-provider',
        enabled: true,
      };

      registry.registerProvider('test-provider', config);
      const provider = registry.getProvider('test-provider');

      expect(provider).toBeInstanceOf(MockProvider);
    });

    it('should throw error if provider not found', () => {
      expect(() => registry.getProvider('nonexistent')).toThrow();
    });

    it('should throw error if provider is disabled', () => {
      const config: ProviderConfiguration = {
        type: 'ollama',
        name: 'disabled-provider',
        enabled: false,
      };

      registry.registerProvider('disabled-provider', config);
      expect(() => registry.getProvider('disabled-provider')).toThrow('disabled');
    });
  });

  describe('listProviders', () => {
    it('should list all registered providers', () => {
      registry.registerProvider('provider1', {
        type: 'ollama',
        name: 'Provider 1',
        enabled: true,
      });
      registry.registerProvider('provider2', {
        type: 'openai',
        name: 'Provider 2',
        enabled: true,
      });

      const providers = registry.listProviders();
      expect(providers).toContain('provider1');
      expect(providers).toContain('provider2');
    });
  });
});
