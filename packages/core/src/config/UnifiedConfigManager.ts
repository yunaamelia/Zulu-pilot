/**
 * Unified Configuration Manager
 *
 * Manages unified configuration for Zulu Pilot
 * @package @zulu-pilot/core
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type {
  UnifiedConfiguration,
  ProviderConfiguration,
} from './UnifiedConfiguration.js';

const CONFIG_DIR = join(homedir(), '.zulu-pilot');
const CONFIG_FILE = join(CONFIG_DIR, '.zulu-pilotrc');

/**
 * Unified Configuration Manager
 *
 * Manages loading, saving, and validation of unified configuration
 */
export class UnifiedConfigManager {
  private config: UnifiedConfiguration | null = null;

  /**
   * Get default configuration
   */
  private getDefaultConfig(): UnifiedConfiguration {
    return {
      defaultProvider: 'ollama',
      defaultModel: 'ollama:qwen2.5-coder',
      providers: {
        ollama: {
          type: 'ollama',
          name: 'Ollama Local',
          baseUrl: 'http://localhost:11434',
          model: 'qwen2.5-coder',
          timeout: 30000,
          enabled: true,
        },
      },
    };
  }

  /**
   * Load configuration from file
   *
   * @returns Unified configuration
   */
  async loadConfig(): Promise<UnifiedConfiguration> {
    try {
      const fileContent = await readFile(CONFIG_FILE, 'utf-8');
      const config = JSON.parse(fileContent) as UnifiedConfiguration;

      // Validate configuration
      this.validateConfig(config);

      this.config = config;
      return config;
    } catch (error) {
      // If file doesn't exist or is invalid, return default config
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        const defaultConfig = this.getDefaultConfig();
        this.config = defaultConfig;
        return defaultConfig;
      }

      // If JSON is invalid, throw error
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }

  /**
   * Save configuration to file
   *
   * @param config - Configuration to save
   */
  async saveConfig(config: UnifiedConfiguration): Promise<void> {
    // Validate configuration before saving
    this.validateConfig(config);

    // Ensure config directory exists
    try {
      await mkdir(CONFIG_DIR, { recursive: true });
    } catch {
      // Directory might already exist, ignore error
    }

    // Write to temporary file first, then rename (atomic write)
    const tempFile = `${CONFIG_FILE}.tmp`;
    await writeFile(tempFile, JSON.stringify(config, null, 2), 'utf-8');

    // Rename temp file to config file (atomic operation)
    const { rename } = await import('fs/promises');
    await rename(tempFile, CONFIG_FILE);

    this.config = config;
  }

  /**
   * Get provider configuration
   *
   * @param providerName - Provider name
   * @returns Provider configuration or undefined
   */
  getProviderConfig(providerName: string): ProviderConfiguration | undefined {
    if (!this.config) {
      return undefined;
    }
    return this.config.providers[providerName];
  }

  /**
   * Set provider configuration
   *
   * @param providerName - Provider name
   * @param config - Provider configuration
   */
  setProviderConfig(
    providerName: string,
    config: ProviderConfiguration
  ): void {
    if (!this.config) {
      this.config = this.getDefaultConfig();
    }
    this.config.providers[providerName] = config;
  }

  /**
   * Get current configuration
   *
   * @returns Current configuration or default
   */
  getConfig(): UnifiedConfiguration {
    return this.config || this.getDefaultConfig();
  }

  /**
   * Validate configuration
   *
   * @param config - Configuration to validate
   * @throws {Error} If configuration is invalid
   */
  private validateConfig(config: UnifiedConfiguration): void {
    if (!config.defaultProvider) {
      throw new Error('defaultProvider is required');
    }

    if (!config.providers || Object.keys(config.providers).length === 0) {
      throw new Error('At least one provider must be configured');
    }

    if (!config.providers[config.defaultProvider]) {
      throw new Error(
        `defaultProvider "${config.defaultProvider}" not found in providers`
      );
    }

    // Validate each provider configuration
    for (const [name, providerConfig] of Object.entries(config.providers)) {
      if (!providerConfig.type) {
        throw new Error(`Provider "${name}" missing type`);
      }
      if (!providerConfig.name) {
        throw new Error(`Provider "${name}" missing name`);
      }
    }
  }
}

