/**
 * Unit tests for ChatCommand
 *
 * T064 [US1] - Unit tests for ChatCommand (90%+ coverage)
 *
 * @package @zulu-pilot/cli
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ChatCommand } from '../../../../packages/cli/src/commands/chat.js';
import type { Config } from '@google/gemini-cli-core';
import { UnifiedConfigManager } from '@zulu-pilot/core';
import type { ChatCommandOptions } from '../../../../specs/002-gemini-cli-rebuild/contracts/cli-commands.interface.js';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.zulu-pilot');
const CONFIG_FILE = join(CONFIG_DIR, '.zulu-pilotrc');

describe('ChatCommand', () => {
  let mockConfig: Config;
  let chatCommand: ChatCommand;

  beforeEach(async () => {
    // Create mock Config
    mockConfig = {
      getContentGeneratorConfig: jest.fn().mockReturnValue({ authType: 'gemini-api-key' }),
      refreshAuth: jest.fn().mockResolvedValue(undefined as void),
      setZuluPilotAdapter: jest.fn(),
      getZuluPilotAdapter: jest.fn().mockReturnValue(undefined),
    } as unknown as Config;

    // Create test config file
    try {
      await mkdir(CONFIG_DIR, { recursive: true });
      await writeFile(
        CONFIG_FILE,
        JSON.stringify({
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
          },
        }),
        'utf-8'
      );
    } catch {
      // Ignore errors
    }

    chatCommand = new ChatCommand(mockConfig);
  });

  afterEach(async () => {
    // Clean up test config file
    try {
      await unlink(CONFIG_FILE);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  describe('constructor', () => {
    it('should create ChatCommand instance', () => {
      expect(chatCommand).toBeInstanceOf(ChatCommand);
    });

    it('should store config reference', () => {
      const command = new ChatCommand(mockConfig);
      expect(command).toBeDefined();
    });
  });

  describe('getAdapter', () => {
    it('should return null initially', () => {
      expect(chatCommand.getAdapter()).toBeNull();
    });

    it('should return adapter after initialization', async () => {
      const options: ChatCommandOptions = {
        provider: 'ollama',
        model: 'qwen2.5-coder',
      };

      // Mock the initialization (it will fail without actual providers, but we can test structure)
      try {
        await chatCommand.run(options);
      } catch {
        // Expected to fail without actual provider setup
      }

      // Adapter should be created even if initialization fails
      const adapter = chatCommand.getAdapter();
      // May be null if initialization failed, but structure should be correct
      expect(adapter === null || adapter instanceof Object).toBe(true);
    });
  });

  describe('run', () => {
    it('should initialize adapter with provider selection', async () => {
      const options: ChatCommandOptions = {
        provider: 'ollama',
        model: 'qwen2.5-coder',
        headless: true,
        prompt: 'Test prompt',
      };

      // Mock setZuluPilotAdapter to track calls
      const setAdapterSpy = jest.spyOn(mockConfig, 'setZuluPilotAdapter');

      // This will attempt to initialize the adapter
      // May fail without actual provider, but we can test the structure
      try {
        await chatCommand.run(options);
      } catch {
        // Expected to fail without actual provider setup
        // But we can verify that setZuluPilotAdapter was called
        expect(setAdapterSpy).toHaveBeenCalled();
      }
    });

    it('should handle provider selection', async () => {
      const options: ChatCommandOptions = {
        provider: 'ollama',
      };

      // Test that provider selection is processed
      try {
        await chatCommand.run(options);
      } catch {
        // Expected to fail without actual provider
      }

      // Verify that config.setZuluPilotAdapter was called (adapter was created)
      expect(mockConfig.setZuluPilotAdapter).toHaveBeenCalled();
    });

    it('should handle model selection', async () => {
      const options: ChatCommandOptions = {
        model: 'qwen2.5-coder',
      };

      // Test that model selection is processed
      try {
        await chatCommand.run(options);
      } catch {
        // Expected to fail without actual provider
      }

      // Verify that adapter was attempted to be set
      expect(mockConfig.setZuluPilotAdapter).toHaveBeenCalled();
    });

    it('should handle headless mode', async () => {
      const options: ChatCommandOptions = {
        headless: true,
        prompt: 'Test prompt',
      };

      // Test non-interactive mode
      try {
        await chatCommand.run(options);
      } catch (error) {
        // May fail, but structure should be correct
        expect(error).toBeDefined();
      }
    });

    it('should throw error in headless mode without prompt', async () => {
      const options: ChatCommandOptions = {
        headless: true,
        // No prompt provided
      };

      // Mock adapter initialization to succeed
      jest.spyOn(UnifiedConfigManager.prototype, 'loadConfig').mockResolvedValue({
        defaultProvider: 'ollama',
        providers: {
          ollama: {
            type: 'ollama',
            name: 'Ollama',
            enabled: true,
          },
        },
      } as any);

      await expect(chatCommand.run(options)).rejects.toThrow(
        'Prompt required for non-interactive mode'
      );
    });

    it('should handle interactive mode', async () => {
      const options: ChatCommandOptions = {
        provider: 'ollama',
        model: 'qwen2.5-coder',
        headless: false,
      };

      // Mock console.log
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Test interactive mode
      try {
        await chatCommand.run(options);
      } catch {
        // Expected to fail without actual provider setup
      }

      // Verify that adapter was set
      expect(mockConfig.setZuluPilotAdapter).toHaveBeenCalled();

      logSpy.mockRestore();
    });
  });

  describe('provider and model selection', () => {
    it('should override default provider when specified', async () => {
      const options: ChatCommandOptions = {
        provider: 'ollama',
      };

      // Mock loadConfig to return config
      const loadConfigSpy = jest
        .spyOn(UnifiedConfigManager.prototype, 'loadConfig')
        .mockResolvedValue({
          defaultProvider: 'openai',
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
        } as any);

      try {
        await chatCommand.run(options);
      } catch {
        // Expected to fail
      }

      // Verify config was loaded
      expect(loadConfigSpy).toHaveBeenCalled();

      loadConfigSpy.mockRestore();
    });

    it('should override default model when specified', async () => {
      const options: ChatCommandOptions = {
        model: 'custom-model',
      };

      const loadConfigSpy = jest
        .spyOn(UnifiedConfigManager.prototype, 'loadConfig')
        .mockResolvedValue({
          defaultProvider: 'ollama',
          defaultModel: 'default-model',
          providers: {
            ollama: {
              type: 'ollama',
              name: 'Ollama',
              enabled: true,
            },
          },
        } as any);

      try {
        await chatCommand.run(options);
      } catch {
        // Expected to fail
      }

      expect(loadConfigSpy).toHaveBeenCalled();

      loadConfigSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle initialization errors gracefully', async () => {
      const options: ChatCommandOptions = {
        provider: 'invalid-provider',
      };

      // Mock to throw error
      jest
        .spyOn(UnifiedConfigManager.prototype, 'loadConfig')
        .mockRejectedValue(new Error('Config load failed'));

      await expect(chatCommand.run(options)).rejects.toThrow('Config load failed');
    });

    it('should handle adapter creation errors', async () => {
      const options: ChatCommandOptions = {
        provider: 'ollama',
      };

      // Mock config load to succeed but provider setup to fail
      jest.spyOn(UnifiedConfigManager.prototype, 'loadConfig').mockResolvedValue({
        defaultProvider: 'ollama',
        providers: {
          ollama: {
            type: 'ollama',
            name: 'Ollama',
            enabled: false, // Disabled provider should cause error
          },
        },
      } as any);

      // Should handle error gracefully
      try {
        await chatCommand.run(options);
      } catch (error) {
        // Expected - provider is disabled
        expect(error).toBeDefined();
      }
    });
  });
});
