/**
 * Unit tests for MultiProviderRouter
 * @package @zulu-pilot/adapter
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MultiProviderRouter } from '../../../packages/adapter/src/MultiProviderRouter.js';
import { ProviderRegistry } from '../../../packages/adapter/src/ProviderRegistry.js';
import type { UnifiedConfiguration } from '@zulu-pilot/core';
import type {
  IModelProvider,
  ProviderConfig,
} from '../../../packages/providers/src/IModelProvider.js';

// Mock provider for testing
class MockProvider implements IModelProvider {
  private model: string = 'default-model';

  constructor(_name: string) {}

  async *streamResponse(): AsyncGenerator<string, void, unknown> {
    yield 'test response';
  }

  async generateResponse(): Promise<string> {
    return 'test response';
  }

  setModel(model: string): void {
    this.model = model;
  }

  getModel(): string | undefined {
    return this.model;
  }
}

describe('MultiProviderRouter', () => {
  let router: MultiProviderRouter;
  let registry: ProviderRegistry;
  let config: UnifiedConfiguration;

  beforeEach(() => {
    registry = new ProviderRegistry();
    config = {
      defaultProvider: 'ollama',
      providers: {
        ollama: {
          type: 'ollama',
          name: 'Ollama',
          enabled: true,
        },
        openai: {
          type: 'openai',
          name: 'OpenAI',
          enabled: true,
        },
      },
    };

    const factory = (providerConfig: ProviderConfig) => new MockProvider(providerConfig.name);
    registry.registerFactory('ollama', factory);
    registry.registerFactory('openai', factory);

    registry.registerProvider('ollama', config.providers.ollama);
    registry.registerProvider('openai', config.providers.openai);

    router = new MultiProviderRouter(registry, config);
  });

  describe('parseModelId', () => {
    it('should parse model ID with provider prefix', () => {
      const parsed = router.parseModelId('openai:gpt-4', 'ollama');
      expect(parsed.provider).toBe('openai');
      expect(parsed.model).toBe('gpt-4');
    });

    it('should use default provider when no prefix', () => {
      const parsed = router.parseModelId('qwen2.5-coder', 'ollama');
      expect(parsed.provider).toBe('ollama');
      expect(parsed.model).toBe('qwen2.5-coder');
    });
  });

  describe('getProviderForModel', () => {
    it('should get provider for model with prefix', () => {
      const provider = router.getProviderForModel('openai:gpt-4', 'ollama');
      expect(provider).toBeInstanceOf(MockProvider);
    });

    it('should use default provider when no prefix', () => {
      const provider = router.getProviderForModel('qwen2.5-coder', 'ollama');
      expect(provider).toBeInstanceOf(MockProvider);
    });

    it('should set model if provider supports it', () => {
      const provider = router.getProviderForModel('openai:gpt-4', 'ollama') as MockProvider;
      expect(provider.getModel()).toBe('gpt-4');
    });

    it('should throw error if provider not found', () => {
      expect(() => router.getProviderForModel('nonexistent:model', 'ollama')).toThrow();
    });
  });

  describe('switchProvider', () => {
    it('should switch to different provider', () => {
      router.switchProvider('openai');
      expect(router.getCurrentProvider()).toBe('openai');
    });

    it('should throw error if provider not found', () => {
      expect(() => router.switchProvider('nonexistent')).toThrow();
    });
  });
});
