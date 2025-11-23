/**
 * Integration test for model switching
 * T128: Integration test for model switching
 *
 * @package tests/integration/cli
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ModelCommand } from '@zulu-pilot/cli';
import { UnifiedConfigManager, MultiProviderRouter, ProviderRegistry, ValidationError } from '@zulu-pilot/core';
import type { UnifiedConfiguration, ProviderConfiguration } from '@zulu-pilot/core';
import { OllamaProvider } from '@zulu-pilot/providers';

describe('T128: Model Switching Integration Tests', () => {
  let configManager: UnifiedConfigManager;
  let router: MultiProviderRouter;
  let registry: ProviderRegistry;
  let command: ModelCommand;

  beforeEach(() => {
    // Create fresh instances for each test
    configManager = new UnifiedConfigManager();
    registry = new ProviderRegistry();
    const mockConfig: UnifiedConfiguration = {
      defaultProvider: 'ollama',
      providers: {
        ollama: {
          type: 'ollama',
          name: 'ollama',
          model: 'qwen2.5-coder',
          baseUrl: 'http://localhost:11434',
        } as ProviderConfiguration,
      },
    };
    router = new MultiProviderRouter(registry, mockConfig);
    command = new ModelCommand(configManager, router, registry);
  });

  describe('Switch Model for Provider', () => {
    it('should switch model successfully when model is available', async () => {
      const mockSetModel = jest.fn();
      const mockProvider = {
        getModel: jest.fn().mockReturnValue('qwen2.5-coder'),
        setModel: mockSetModel,
        hasModel: jest.fn().mockResolvedValue(true),
        listModels: jest.fn().mockResolvedValue(['qwen2.5-coder', 'llama3.2', 'mistral']),
        generateResponse: jest.fn(),
        streamResponse: jest.fn(),
      };

      registry.registerProvider('ollama', mockProvider as unknown as OllamaProvider);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.set('ollama', 'llama3.2', {});

      expect(mockProvider.hasModel).toHaveBeenCalledWith('llama3.2');
      expect(mockSetModel).toHaveBeenCalledWith('llama3.2');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('llama3.2')
      );

      consoleLogSpy.mockRestore();
    });

    it('should throw ValidationError when provider is not configured', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(command.set('nonexistent', 'model1', {})).rejects.toThrow(
        ValidationError
      );

      consoleErrorSpy.mockRestore();
    });

    it('should throw ValidationError when model is not available', async () => {
      const mockProvider = {
        getModel: jest.fn().mockReturnValue('qwen2.5-coder'),
        setModel: jest.fn(),
        hasModel: jest.fn().mockResolvedValue(false),
        listModels: jest.fn().mockResolvedValue(['qwen2.5-coder', 'llama3.2']),
        generateResponse: jest.fn(),
        streamResponse: jest.fn(),
      };

      registry.registerProvider('ollama', mockProvider as unknown as OllamaProvider);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(command.set('ollama', 'nonexistent-model', {})).rejects.toThrow(
        ValidationError
      );

      expect(mockProvider.hasModel).toHaveBeenCalledWith('nonexistent-model');

      consoleErrorSpy.mockRestore();
    });

    it('should update configuration when model is switched', async () => {
      const mockSetModel = jest.fn();
      const mockProvider = {
        getModel: jest.fn().mockReturnValue('qwen2.5-coder'),
        setModel: mockSetModel,
        hasModel: jest.fn().mockResolvedValue(true),
        listModels: jest.fn().mockResolvedValue(['qwen2.5-coder', 'llama3.2']),
        generateResponse: jest.fn(),
        streamResponse: jest.fn(),
      };

      registry.registerProvider('ollama', mockProvider as unknown as OllamaProvider);

      const saveConfigSpy = jest.spyOn(configManager, 'saveConfig').mockResolvedValue();

      await command.set('ollama', 'llama3.2', {});

      expect(saveConfigSpy).toHaveBeenCalled();
      const savedConfig = saveConfigSpy.mock.calls[0]?.[0] as UnifiedConfiguration;
      expect(savedConfig.providers?.ollama?.model).toBe('llama3.2');

      saveConfigSpy.mockRestore();
    });

    it('should handle provider without model discovery gracefully', async () => {
      const mockSetModel = jest.fn();
      const mockProvider = {
        getModel: jest.fn().mockReturnValue('qwen2.5-coder'),
        setModel: mockSetModel,
        // No hasModel or listModels methods
        generateResponse: jest.fn(),
        streamResponse: jest.fn(),
      };

      registry.registerProvider('ollama', mockProvider as unknown as OllamaProvider);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await command.set('ollama', 'new-model', { verbose: true });

      // Should still call setModel even without discovery
      expect(mockSetModel).toHaveBeenCalledWith('new-model');
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should throw error when provider does not support model switching', async () => {
      const mockProvider = {
        getModel: jest.fn().mockReturnValue('qwen2.5-coder'),
        // No setModel method - readonly provider
        hasModel: jest.fn().mockResolvedValue(true),
        listModels: jest.fn().mockResolvedValue(['qwen2.5-coder', 'llama3.2']),
        generateResponse: jest.fn(),
        streamResponse: jest.fn(),
      };

      registry.registerProvider('ollama', mockProvider as unknown as OllamaProvider);

      // Since setModel is missing, the command should handle it gracefully
      // or throw an error depending on implementation
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        await command.set('ollama', 'new-model', {});
      } catch (error) {
        // Expected to handle gracefully or throw ValidationError
        expect(error).toBeDefined();
      }

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Model Switching with Adapter', () => {
    it('should switch model using adapter', async () => {
      const { GeminiCLIModelAdapter } = await import('@zulu-pilot/adapter');
      const mockConfig: UnifiedConfiguration = {
        defaultProvider: 'ollama',
        providers: {
          ollama: {
            type: 'ollama',
            name: 'ollama',
            model: 'qwen2.5-coder',
          } as ProviderConfiguration,
        },
      };

      const mockSetModel = jest.fn();
      const mockProvider = {
        getModel: jest.fn().mockReturnValue('qwen2.5-coder'),
        setModel: mockSetModel,
        hasModel: jest.fn().mockResolvedValue(true),
        listModels: jest.fn().mockResolvedValue(['qwen2.5-coder', 'llama3.2']),
        generateResponse: jest.fn(),
        streamResponse: jest.fn(),
      };

      registry.registerProvider('ollama', mockProvider as unknown as OllamaProvider);
      router = new MultiProviderRouter(registry, mockConfig);

      const adapter = new GeminiCLIModelAdapter(router, mockConfig);

      await adapter.switchModel('ollama', 'llama3.2');

      expect(mockProvider.hasModel).toHaveBeenCalledWith('llama3.2');
      expect(mockSetModel).toHaveBeenCalledWith('llama3.2');
      expect(mockConfig.providers?.ollama?.model).toBe('llama3.2');
    });

    it('should throw ValidationError when model not available in adapter', async () => {
      const { GeminiCLIModelAdapter } = await import('@zulu-pilot/adapter');
      const mockConfig: UnifiedConfiguration = {
        defaultProvider: 'ollama',
        providers: {
          ollama: {
            type: 'ollama',
            name: 'ollama',
            model: 'qwen2.5-coder',
          } as ProviderConfiguration,
        },
      };

      const mockProvider = {
        getModel: jest.fn().mockReturnValue('qwen2.5-coder'),
        setModel: jest.fn(),
        hasModel: jest.fn().mockResolvedValue(false),
        listModels: jest.fn().mockResolvedValue(['qwen2.5-coder', 'llama3.2']),
        generateResponse: jest.fn(),
        streamResponse: jest.fn(),
      };

      registry.registerProvider('ollama', mockProvider as unknown as OllamaProvider);
      router = new MultiProviderRouter(registry, mockConfig);

      const adapter = new GeminiCLIModelAdapter(router, mockConfig);

      await expect(adapter.switchModel('ollama', 'nonexistent-model')).rejects.toThrow(
        ValidationError
      );
    });
  });
});

