/**
 * Integration test for model listing
 * T127: Integration test for model listing
 *
 * @package tests/integration/cli
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ModelCommand } from '@zulu-pilot/cli';
import { UnifiedConfigManager, MultiProviderRouter, ProviderRegistry } from '@zulu-pilot/core';
import type { UnifiedConfiguration, ProviderConfiguration } from '@zulu-pilot/core';
import { OllamaProvider } from '@zulu-pilot/providers';

describe('T127: Model Listing Integration Tests', () => {
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

  describe('List Models for Provider', () => {
    it('should list models for configured provider', async () => {
      // Mock the provider's listModels method
      const mockProvider = {
        getModel: jest.fn().mockReturnValue('qwen2.5-coder'),
        listModels: jest.fn().mockResolvedValue(['qwen2.5-coder', 'llama3.2', 'mistral']),
        hasModel: jest.fn().mockResolvedValue(true),
        generateResponse: jest.fn(),
        streamResponse: jest.fn(),
      };

      // Register mock provider
      registry.registerProvider('ollama', mockProvider as unknown as OllamaProvider);

      // Mock console.log to capture output
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.list({ provider: 'ollama' });

      expect(mockProvider.listModels).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should handle provider not configured', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await command.list({ provider: 'nonexistent' });

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
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

    it('should handle provider connection errors gracefully', async () => {
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

      // Should handle error gracefully and show configured models
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
      const output = consoleLogSpy.mock.calls.find((call) => {
        const str = call[0] as string;
        return str.includes('"provider"') || str.includes('"models"');
      });
      expect(output).toBeDefined();

      consoleLogSpy.mockRestore();
    });
  });

  describe('List Models Output Format', () => {
    it('should display models in table format by default', async () => {
      const mockProvider = {
        getModel: jest.fn().mockReturnValue('qwen2.5-coder'),
        listModels: jest.fn().mockResolvedValue(['qwen2.5-coder', 'llama3.2']),
        hasModel: jest.fn().mockResolvedValue(true),
        generateResponse: jest.fn(),
        streamResponse: jest.fn(),
      };

      registry.registerProvider('ollama', mockProvider as unknown as OllamaProvider);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.list({ provider: 'ollama', outputFormat: 'table' });

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should display models in list format when requested', async () => {
      const mockProvider = {
        getModel: jest.fn().mockReturnValue('qwen2.5-coder'),
        listModels: jest.fn().mockResolvedValue(['qwen2.5-coder', 'llama3.2']),
        hasModel: jest.fn().mockResolvedValue(true),
        generateResponse: jest.fn(),
        streamResponse: jest.fn(),
      };

      registry.registerProvider('ollama', mockProvider as unknown as OllamaProvider);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await command.list({ provider: 'ollama', outputFormat: 'list' });

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  describe('Current Model Display', () => {
    it('should show current model for provider', async () => {
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
  });
});

