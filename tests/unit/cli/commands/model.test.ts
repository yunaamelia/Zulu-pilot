import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type { SpyInstance } from 'jest-mock';
import { handleModelCommand } from '../../../../src/cli/commands/model.js';
import { ConfigManager } from '../../../../src/core/config/ConfigManager.js';

// Mock ConfigManager
jest.mock('../../../../src/core/config/ConfigManager.js');

describe('model command', () => {
  let mockConfigManager: jest.Mocked<ConfigManager>;
  let consoleLogSpy: SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockConfigManager = {
      load: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<ConfigManager>;

    (ConfigManager as jest.Mock).mockImplementation(() => mockConfigManager);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should list available models', async () => {
    mockConfigManager.load.mockResolvedValue({
      provider: 'ollama',
      model: 'qwen2.5-coder',
      providers: {
        ollama: { model: 'qwen2.5-coder' },
        gemini: { model: 'gemini-pro' },
      },
    });

    await handleModelCommand({ list: true });

    expect(consoleLogSpy).toHaveBeenCalledWith('Available models by provider:');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Default Provider:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Default Model:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Configured provider models:')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('All available models by provider:')
    );
  });

  it('should set default model', async () => {
    const config = {
      provider: 'ollama',
      model: 'qwen2.5-coder',
    };
    mockConfigManager.load.mockResolvedValue(config);
    mockConfigManager.save.mockResolvedValue(undefined);

    await handleModelCommand({ set: 'new-model' });

    expect(mockConfigManager.save).toHaveBeenCalledWith({
      ...config,
      model: 'new-model',
    });
    expect(consoleLogSpy).toHaveBeenCalledWith('Default model set to: new-model');
  });

  it('should show current model when no options provided', async () => {
    mockConfigManager.load.mockResolvedValue({
      provider: 'ollama',
      model: 'qwen2.5-coder',
    });

    await handleModelCommand({});

    expect(consoleLogSpy).toHaveBeenCalledWith('Current default model: qwen2.5-coder');
  });

  it('should show default model when model not set', async () => {
    mockConfigManager.load.mockResolvedValue({
      provider: 'ollama',
    });

    await handleModelCommand({});

    expect(consoleLogSpy).toHaveBeenCalledWith('Current default provider: ollama');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Current default model: deepseek-ai/deepseek-v3.1-maas'
    );
  });

  it('should list models with provider-specific configurations', async () => {
    mockConfigManager.load.mockResolvedValue({
      provider: 'ollama',
      model: 'qwen2.5-coder',
      providers: {
        ollama: { model: 'qwen2.5-coder' },
        gemini: { model: 'gemini-pro' },
        openai: { model: 'gpt-4' },
      },
    });

    await handleModelCommand({ list: true });

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ollama:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('gemini:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('openai:'));
  });

  it('should handle empty providers object', async () => {
    mockConfigManager.load.mockResolvedValue({
      provider: 'ollama',
      model: 'qwen2.5-coder',
      providers: {},
    });

    await handleModelCommand({ list: true });

    expect(consoleLogSpy).toHaveBeenCalledWith('Available models by provider:');
  });
});
