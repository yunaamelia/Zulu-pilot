/**
 * Unit tests for ProviderCommand
 * 
 * T110 [US4] - Write unit tests for ProviderCommand (90%+ coverage)
 * 
 * @package @zulu-pilot/tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ProviderCommand } from '../../../../packages/cli/src/commands/provider.js';
import { UnifiedConfigManager } from '@zulu-pilot/core';
import type { UnifiedConfiguration, ProviderConfiguration } from '@zulu-pilot/core';

// Mock UnifiedConfigManager
jest.mock('@zulu-pilot/core', () => {
  const actual = jest.requireActual('@zulu-pilot/core') as Record<string, unknown>;
  return {
    ...actual,
    UnifiedConfigManager: jest.fn(),
  };
});

describe('ProviderCommand', () => {
  let providerCommand: ProviderCommand;
  let mockConfigManager: jest.Mocked<UnifiedConfigManager>;
  let mockConfig: UnifiedConfiguration;

  beforeEach(() => {
    // Setup mock config
    mockConfig = {
      defaultProvider: 'ollama',
      defaultModel: 'qwen2.5-coder',
      providers: {
        ollama: {
          type: 'ollama',
          name: 'Ollama',
          enabled: true,
          model: 'qwen2.5-coder',
          baseUrl: 'http://localhost:11434',
        },
        openai: {
          type: 'openai',
          name: 'OpenAI',
          enabled: true,
          model: 'gpt-4',
          apiKey: 'env:OPENAI_API_KEY',
        },
        googleCloud: {
          type: 'googleCloud',
          name: 'Google Cloud',
          enabled: false,
          model: 'gemini-pro',
          providerSpecific: {
            projectId: 'test-project',
            region: 'us-central1',
          },
        },
      },
    };

    // Setup mock config manager
    mockConfigManager = {
      loadConfig: jest.fn().mockResolvedValue(mockConfig),
      saveConfig: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<UnifiedConfigManager>;

    // Mock UnifiedConfigManager constructor
    (UnifiedConfigManager as unknown as jest.Mock).mockImplementation(() => mockConfigManager);

    providerCommand = new ProviderCommand(mockConfigManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default config manager', () => {
      const command = new ProviderCommand();
      expect(command).toBeInstanceOf(ProviderCommand);
    });

    it('should create instance with provided config manager', () => {
      const command = new ProviderCommand(mockConfigManager);
      expect(command).toBeInstanceOf(ProviderCommand);
    });
  });

  describe('list', () => {
    it('should list all providers in table format by default', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await providerCommand.list({});

      expect(mockConfigManager.loadConfig).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should list providers in JSON format', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await providerCommand.list({ outputFormat: 'json' });

      expect(mockConfigManager.loadConfig).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should list providers in list format', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await providerCommand.list({ outputFormat: 'list' });

      expect(mockConfigManager.loadConfig).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should show message when no providers configured', async () => {
      const emptyConfig: UnifiedConfiguration = {
        defaultProvider: '',
        providers: {},
      };
      (mockConfigManager.loadConfig as jest.Mock) = jest.fn().mockResolvedValue(emptyConfig);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await providerCommand.list({});

      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should show verbose information when verbose is true', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await providerCommand.list({ verbose: true });

      expect(mockConfigManager.loadConfig).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('set', () => {
    it('should set default provider successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await providerCommand.set('openai', {});

      expect(mockConfigManager.loadConfig).toHaveBeenCalled();
      expect(mockConfigManager.saveConfig).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      
      // Verify config was updated
      const saveCall = (mockConfigManager.saveConfig as jest.Mock).mock.calls[0][0] as UnifiedConfiguration;
      expect(saveCall.defaultProvider).toBe('openai');
      
      consoleSpy.mockRestore();
    });

    it('should throw error if provider not found', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
        throw new Error(`process.exit called with code ${code}`);
      });

      await expect(providerCommand.set('nonexistent', {})).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should throw error if provider is disabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
        throw new Error(`process.exit called with code ${code}`);
      });

      await expect(providerCommand.set('googleCloud', {})).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should list available providers when provider not found', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
        throw new Error(`process.exit called with code ${code}`);
      });

      await expect(providerCommand.set('nonexistent', {})).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe('config', () => {
    it('should show provider configuration', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await providerCommand.config('ollama', {});

      expect(mockConfigManager.loadConfig).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should list all providers if no provider name provided', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const listSpy = jest.spyOn(providerCommand, 'list').mockResolvedValue();
      
      await providerCommand.config('', {});

      expect(listSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      listSpy.mockRestore();
    });

    it('should show error if provider not found', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
        throw new Error(`process.exit called with code ${code}`);
      });

      await expect(providerCommand.config('nonexistent', {})).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should display provider details correctly', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await providerCommand.config('ollama', {});

      expect(consoleSpy).toHaveBeenCalled();
      const logCalls = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(logCalls).toContain('ollama');
      
      consoleSpy.mockRestore();
    });

    it('should mask API keys in output', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await providerCommand.config('openai', {});

      expect(consoleSpy).toHaveBeenCalled();
      const logCalls = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
      // API key should be masked
      expect(logCalls).not.toContain('env:OPENAI_API_KEY');
      
      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle config load errors', async () => {
      (mockConfigManager.loadConfig as jest.Mock).mockRejectedValue(new Error('Config load failed'));
      
      await expect(providerCommand.list({})).rejects.toThrow('Config load failed');
    });

    it('should handle config save errors', async () => {
      (mockConfigManager.saveConfig as jest.Mock).mockRejectedValue(new Error('Config save failed'));
      
      await expect(providerCommand.set('ollama', {})).rejects.toThrow('Config save failed');
    });
  });

  describe('edge cases', () => {
    it('should handle empty providers object', async () => {
      const emptyConfig: UnifiedConfiguration = {
        defaultProvider: 'none',
        providers: {},
      };
      (mockConfigManager.loadConfig as jest.Mock).mockResolvedValue(emptyConfig);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await providerCommand.list({});

      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle empty default provider', async () => {
      const configWithoutDefault: UnifiedConfiguration = {
        defaultProvider: 'none',
        providers: mockConfig.providers,
      };
      (mockConfigManager.loadConfig as jest.Mock).mockResolvedValue(configWithoutDefault);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await providerCommand.list({});

      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle providers with missing optional fields', async () => {
      const minimalProvider: ProviderConfiguration = {
        type: 'ollama',
        enabled: true,
        name: 'Minimal Provider',
      };
      const configWithMinimal: UnifiedConfiguration = {
        defaultProvider: 'minimal',
        providers: {
          minimal: minimalProvider,
        },
      };
      (mockConfigManager.loadConfig as jest.Mock).mockResolvedValue(configWithMinimal);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await providerCommand.config('minimal', {});

      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});

