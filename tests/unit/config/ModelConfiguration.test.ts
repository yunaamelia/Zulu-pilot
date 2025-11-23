/**
 * Unit tests for model configuration
 * T126: Unit tests for model configuration
 *
 * @package tests/unit/config
 */

import { describe, it, expect } from '@jest/globals';
import type { IModelProvider } from '@zulu-pilot/providers';
import type { UnifiedConfiguration, ProviderConfiguration } from '@zulu-pilot/core';

/**
 * Mock provider with model configuration support
 */
class MockProvider implements IModelProvider {
  private model: string;

  constructor(model: string = 'default-model') {
    this.model = model;
  }

  async generateResponse(_prompt: string, _context: unknown[]): Promise<string> {
    return 'response';
  }

  async *streamResponse(_prompt: string, _context: unknown[]): AsyncGenerator<string, void, unknown> {
    yield 'response';
  }

  getModel(): string {
    return this.model;
  }

  setModel(model: string): void {
    this.model = model;
  }

  async listModels(): Promise<string[]> {
    return ['model1', 'model2', 'model3'];
  }

  async hasModel(modelName: string): Promise<boolean> {
    const models = await this.listModels();
    return models.includes(modelName);
  }
}

/**
 * Mock provider without model switching support
 */
class ReadonlyProvider implements IModelProvider {
  private readonly model: string;

  constructor(model: string = 'readonly-model') {
    this.model = model;
  }

  async generateResponse(_prompt: string, _context: unknown[]): Promise<string> {
    return 'response';
  }

  async *streamResponse(_prompt: string, _context: unknown[]): AsyncGenerator<string, void, unknown> {
    yield 'response';
  }

  getModel(): string {
    return this.model;
  }

  // No setModel() method - readonly provider
  // No listModels() or hasModel() - no discovery support
}

describe('T126: Model Configuration', () => {
  describe('Provider Model Configuration', () => {
    it('should get current model from provider', () => {
      const provider = new MockProvider('test-model');
      expect(provider.getModel()).toBe('test-model');
    });

    it('should set model on provider that supports it', () => {
      const provider = new MockProvider('initial-model');
      expect(provider.getModel()).toBe('initial-model');

      provider.setModel('new-model');
      expect(provider.getModel()).toBe('new-model');
    });

    it('should list available models from provider', async () => {
      const provider = new MockProvider();
      const models = await provider.listModels();

      expect(models).toBeInstanceOf(Array);
      expect(models.length).toBeGreaterThan(0);
      expect(models).toContain('model1');
      expect(models).toContain('model2');
      expect(models).toContain('model3');
    });

    it('should check if model is available', async () => {
      const provider = new MockProvider();

      expect(await provider.hasModel('model1')).toBe(true);
      expect(await provider.hasModel('model2')).toBe(true);
      expect(await provider.hasModel('model3')).toBe(true);
      expect(await provider.hasModel('nonexistent-model')).toBe(false);
    });

    it('should handle readonly provider without setModel', () => {
      const provider = new ReadonlyProvider('readonly-model');

      expect(provider.getModel()).toBe('readonly-model');
      // Provider doesn't have setModel() method, so we can't switch models
      expect(typeof (provider as unknown as { setModel?: (model: string) => void }).setModel).toBe(
        'undefined'
      );
    });
  });

  describe('UnifiedConfiguration Model Storage', () => {
    it('should store model configuration per provider', () => {
      const config: UnifiedConfiguration = {
        defaultProvider: 'ollama',
        providers: {
          ollama: {
            type: 'ollama',
            name: 'ollama',
            model: 'qwen2.5-coder',
          } as ProviderConfiguration,
          openai: {
            type: 'openai',
            name: 'openai',
            model: 'gpt-4',
          } as ProviderConfiguration,
        },
      };

      expect(config.providers?.ollama?.model).toBe('qwen2.5-coder');
      expect(config.providers?.openai?.model).toBe('gpt-4');
    });

    it('should allow different models for different providers', () => {
      const config: UnifiedConfiguration = {
        defaultProvider: 'ollama',
        providers: {
          ollama: {
            type: 'ollama',
            name: 'ollama',
            model: 'qwen2.5-coder',
          } as ProviderConfiguration,
          gemini: {
            type: 'gemini',
            name: 'gemini',
            model: 'gemini-pro',
          } as ProviderConfiguration,
        },
      };

      expect(config.providers?.ollama?.model).toBe('qwen2.5-coder');
      expect(config.providers?.gemini?.model).toBe('gemini-pro');
      expect(config.providers?.ollama?.model).not.toBe(config.providers?.gemini?.model);
    });

    it('should support provider without model configuration', () => {
      const config: UnifiedConfiguration = {
        defaultProvider: 'ollama',
        providers: {
          ollama: {
            type: 'ollama',
            name: 'ollama',
            // No model property
          } as ProviderConfiguration,
        },
      };

      expect(config.providers?.ollama?.model).toBeUndefined();
    });
  });

  describe('Model Validation', () => {
    it('should validate model exists before switching', async () => {
      const provider = new MockProvider();

      // Valid model
      const isValid = await provider.hasModel('model1');
      expect(isValid).toBe(true);

      // Invalid model
      const isInvalid = await provider.hasModel('nonexistent');
      expect(isInvalid).toBe(false);
    });

    it('should handle provider without discovery support gracefully', () => {
      const provider = new ReadonlyProvider();

      // Provider doesn't have listModels() or hasModel()
      expect(typeof (provider as unknown as { listModels?: () => Promise<string[]> }).listModels).toBe(
        'undefined'
      );
      expect(typeof (provider as unknown as { hasModel?: (name: string) => Promise<boolean> }).hasModel).toBe(
        'undefined'
      );
    });
  });

  describe('Model Switching Workflow', () => {
    it('should switch model successfully when provider supports it', () => {
      const provider = new MockProvider('initial-model');

      // Get initial model
      expect(provider.getModel()).toBe('initial-model');

      // Switch model
      provider.setModel('new-model');

      // Verify new model
      expect(provider.getModel()).toBe('new-model');
      expect(provider.getModel()).not.toBe('initial-model');
    });

    it('should maintain model state after switching', () => {
      const provider = new MockProvider('model-a');

      provider.setModel('model-b');
      expect(provider.getModel()).toBe('model-b');

      provider.setModel('model-c');
      expect(provider.getModel()).toBe('model-c');

      // Verify state is maintained
      expect(provider.getModel()).not.toBe('model-a');
      expect(provider.getModel()).not.toBe('model-b');
    });
  });
});

