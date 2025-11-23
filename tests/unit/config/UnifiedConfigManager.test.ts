/**
 * Unit tests for UnifiedConfigManager
 * @package @zulu-pilot/core
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UnifiedConfigManager } from '../../../packages/core/src/config/UnifiedConfigManager.js';
import type { UnifiedConfiguration } from '../../../packages/core/src/config/UnifiedConfiguration.js';
import { readFile, writeFile, unlink, rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.zulu-pilot');
const CONFIG_FILE = join(CONFIG_DIR, '.zulu-pilotrc');

describe('UnifiedConfigManager', () => {
  let manager: UnifiedConfigManager;

  beforeEach(() => {
    manager = new UnifiedConfigManager();
  });

  afterEach(async () => {
    // Clean up test config file and directory
    try {
      await unlink(CONFIG_FILE);
    } catch {
      // Ignore if file doesn't exist
    }
    try {
      await rm(CONFIG_DIR, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  });

  describe('loadConfig', () => {
    it('should return default config when file does not exist', async () => {
      const config = await manager.loadConfig();
      expect(config.defaultProvider).toBe('ollama');
      expect(config.providers.ollama).toBeDefined();
    });

    it('should load config from file when it exists', async () => {
      const testConfig: UnifiedConfiguration = {
        defaultProvider: 'test-provider',
        providers: {
          'test-provider': {
            type: 'ollama',
            name: 'Test Provider',
            enabled: true,
          },
        },
      };

      // Ensure directory exists
      await mkdir(CONFIG_DIR, { recursive: true });
      await writeFile(CONFIG_FILE, JSON.stringify(testConfig, null, 2), 'utf-8');
      const config = await manager.loadConfig();

      expect(config.defaultProvider).toBe('test-provider');
      expect(config.providers['test-provider']).toBeDefined();
    });

    it('should throw error for invalid JSON', async () => {
      // Ensure directory exists
      await mkdir(CONFIG_DIR, { recursive: true });
      await writeFile(CONFIG_FILE, 'invalid json', 'utf-8');

      await expect(manager.loadConfig()).rejects.toThrow();
    });
  });

  describe('saveConfig', () => {
    it('should save config to file', async () => {
      const testConfig: UnifiedConfiguration = {
        defaultProvider: 'test-provider',
        providers: {
          'test-provider': {
            type: 'ollama',
            name: 'Test Provider',
            enabled: true,
          },
        },
      };

      await manager.saveConfig(testConfig);

      const content = await readFile(CONFIG_FILE, 'utf-8');
      const saved = JSON.parse(content);

      expect(saved.defaultProvider).toBe('test-provider');
    });

    it('should validate config before saving', async () => {
      const invalidConfig = {
        // Missing required fields
      } as UnifiedConfiguration;

      await expect(manager.saveConfig(invalidConfig)).rejects.toThrow();
    });
  });

  describe('getConfig', () => {
    it('should return cached config if available', async () => {
      const testConfig: UnifiedConfiguration = {
        defaultProvider: 'test-provider',
        providers: {
          'test-provider': {
            type: 'ollama',
            name: 'Test Provider',
            enabled: true,
          },
        },
      };

      await manager.saveConfig(testConfig);
      const config1 = await manager.getConfig();
      const config2 = await manager.getConfig();

      expect(config1).toBe(config2); // Same reference (cached)
    });
  });
});

