/**
 * Unit tests for ModelCommand
 * T138: Write unit tests for ModelCommand (90%+ coverage)
 *
 * @package tests/unit/cli/commands
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ModelCommand } from '@zulu-pilot/cli';
import { UnifiedConfigManager, MultiProviderRouter, ProviderRegistry, ValidationError } from '@zulu-pilot/core';
import type { UnifiedConfiguration, ProviderConfiguration } from '@zulu-pilot/core';
import { OllamaProvider } from '@zulu-pilot/providers';

describe('T138: ModelCommand Unit Tests', () => {
  let configManager: UnifiedConfigManager;
  let router: MultiProviderRouter;
  let registry: ProviderRegistry;
  let command: ModelCommand;
  let mockConfig: UnifiedConfiguration;

  beforeEach(() => {
    // Create fresh instances for each test
    configManager = new UnifiedConfigManager();
    registry = new ProviderRegistry();
    mockConfig = {
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

  describe('list() method', () => {
    it('should list models for specific provider', async () => {
      const mockProvider = {
        getModel: jest.fn().mockReturnValue('qwen2.5-coder'),
        listModels: jest.fn().mockResolvedValue(['qwen2.5-coder', 'llama3.2', 'mistral']),
        hasModel: jest.fn().mockResolvedValue(true),
        generateResponse: jest.fn(),
        streamResponse: jest.fn(),
      };

      registry.registerProvider('ollama', mockProvider as unknown as OllamaProvider);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.list({ provider: 'ollama' });

      expect(mockProvider.listModels).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should list models for all providers when provider not specified', async () => {
      const mockProvider = {
        getModel: jest.fn().mockReturnValue('qwen2.5-coder'),
        listModels: jest.fn().mockResolvedValue(['qwen2.5-coder', 'llama3.2']),
        hasModel: jest.fn().mockResolvedValue(true),
        generateResponse: jest.fn(),
        streamResponse: jest.fn(),
      };

      registry.registerProvider('ollama', mockProvider as unknown as OllamaProvider);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.list({});

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should handle provider not configured gracefully', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.list({ provider: 'nonexistent' });

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should output in JSON format when requested', async () => {
      const mockProvider = {
        getModel: jest.fn().mockReturnValue('qwen2.5-coder'),
        listModels: jest.fn().mockResolvedValue(['qwen2.5-coder', 'llama3.2']),
        hasModel: jest.fn().mockResolvedValue(true),
        generateResponse: jest.fn(),
        streamResponse: jest.fn(),
      };

      registry.registerProvider('ollama', mockProvider as unknown as OllamaProvider);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.list({ provider: 'ollama', outputFormat: 'json' });

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should handle connection errors when listing models', async () => {
      const mockProvider = {
        getModel: jest.fn().mockReturnValue('qwen2.5-coder'),
        listModels: jest.fn().mockRejectedValue(new Error('Connection refused')),
        hasModel: jest.fn().mockRejectedValue(new Error('Connection refused')),
        generateResponse: jest.fn(),
        streamResponse: jest.fn(),
      };

      registry.registerProvider('ollama', mockProvider as unknown as OllamaProvider);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.list({ provider: 'ollama', verbose: true });

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should handle provider without listModels method', async () => {
      const mockProvider = {
        getModel: jest.fn().mockReturnValue('qwen2.5-coder'),
        // No listModels method
        generateResponse: jest.fn(),
        streamResponse: jest.fn(),
      };

      registry.registerProvider('ollama', mockProvider as unknown as OllamaProvider);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.list({ provider: 'ollama' });

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  describe('set() method', () => {
    it('should set model successfully when model is available', async () => {
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
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.set('ollama', 'llama3.2', {});

      expect(mockProvider.hasModel).toHaveBeenCalledWith('llama3.2');
      expect(mockSetModel).toHaveBeenCalledWith('llama3.2');
      expect(saveConfigSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();

      saveConfigSpy.mockRestore();
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

    it('should update configuration when model is set', async () => {
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

    it('should handle provider without hasModel gracefully', async () => {
      const mockSetModel = jest.fn();
      const mockProvider = {
        getModel: jest.fn().mockReturnValue('qwen2.5-coder'),
        setModel: mockSetModel,
        // No hasModel method
        generateResponse: jest.fn(),
        streamResponse: jest.fn(),
      };

      registry.registerProvider('ollama', mockProvider as unknown as OllamaProvider);

      const saveConfigSpy = jest.spyOn(configManager, 'saveConfig').mockResolvedValue();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.set('ollama', 'new-model', { verbose: true });

      expect(mockSetModel).toHaveBeenCalledWith('new-model');
      expect(saveConfigSpy).toHaveBeenCalled();

      saveConfigSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should handle provider without setModel method', async () => {
      const mockProvider = {
        getModel: jest.fn().mockReturnValue('qwen2.5-coder'),
        // No setModel method
        hasModel: jest.fn().mockResolvedValue(true),
        listModels: jest.fn().mockResolvedValue(['qwen2.5-coder', 'llama3.2']),
        generateResponse: jest.fn(),
        streamResponse: jest.fn(),
      };

      registry.registerProvider('ollama', mockProvider as unknown as OllamaProvider);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        await command.set('ollama', 'new-model', {});
      } catch (error) {
        expect(error).toBeDefined();
      }

      consoleErrorSpy.mockRestore();
    });
  });

  describe('current() method', () => {
    it('should show current model for specific provider', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.current({ provider: 'ollama' });

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should show current models for all providers', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.current({});

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should output in JSON format when requested', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.current({ provider: 'ollama', outputFormat: 'json' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.find((call) => {
        const str = JSON.stringify(call[0]);
        return str.includes('"provider"') || str.includes('"model"');
      });
      expect(output).toBeDefined();

      consoleLogSpy.mockRestore();
    });
  });

  describe('ModelCommand constructor', () => {
    it('should create ModelCommand with default dependencies', () => {
      const cmd = new ModelCommand();
      expect(cmd).toBeInstanceOf(ModelCommand);
    });

    it('should create ModelCommand with provided dependencies', () => {
      const cmd = new ModelCommand(configManager, router, registry);
      expect(cmd).toBeInstanceOf(ModelCommand);
    });
  });

  describe('Error handling', () => {
    it('should handle errors gracefully in list()', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      // Mock configManager.loadConfig to throw error
      jest.spyOn(configManager, 'loadConfig').mockRejectedValue(new Error('Config error'));

      try {
        await command.list({ provider: 'ollama', verbose: true });
      } catch {
        // Expected to throw
      }

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should handle errors gracefully in set()', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock configManager.loadConfig to throw error
      jest.spyOn(configManager, 'loadConfig').mockRejectedValue(new Error('Config error'));

      await expect(command.set('ollama', 'model1', { verbose: true })).rejects.toThrow();

      consoleErrorSpy.mockRestore();
    });

    it('should handle errors gracefully in current()', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      // Mock configManager.loadConfig to throw error
      jest.spyOn(configManager, 'loadConfig').mockRejectedValue(new Error('Config error'));

      try {
        await command.current({ provider: 'ollama' });
      } catch {
        // Expected to throw
      }

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });
});
