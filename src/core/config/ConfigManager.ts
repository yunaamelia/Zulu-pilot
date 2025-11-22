import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { Configuration, ProviderConfig } from '../../utils/validators.js';
import { validateConfiguration, validateProviderName } from '../../utils/validators.js';
import { ValidationError } from '../../utils/errors.js';

/**
 * Default configuration file path.
 */
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.zulu-pilotrc');

/**
 * Default configuration.
 */
const DEFAULT_CONFIG: Configuration = {
  provider: 'googleClaude',
  model: 'deepseek-ai/deepseek-v3.1-maas',
  tokenEstimation: {
    charsPerToken: 4,
    safetyMargin: 0.1,
  },
  providers: {
    googleClaude: {
      projectId: 'protean-tooling-476420-i8',
      region: 'us-west2',
      model: 'deepseek-ai/deepseek-v3.1-maas',
    },
  },
};

/**
 * Manages configuration loading and saving.
 */
export class ConfigManager {
  private configPath: string;
  private config: Configuration | null = null;

  constructor(configPath: string = DEFAULT_CONFIG_PATH) {
    this.configPath = configPath;
  }

  /**
   * Loads configuration from file or returns default.
   *
   * @returns Configuration object
   */
  async load(): Promise<Configuration> {
    if (this.config !== null) {
      return this.config;
    }

    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(content);
      this.config = validateConfiguration(parsed);
      return this.config;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, return default
        this.config = DEFAULT_CONFIG;
        return this.config;
      }

      if (error instanceof SyntaxError) {
        throw new ValidationError(
          `Invalid JSON in configuration file: ${this.configPath}`,
          'configuration',
          error
        );
      }

      throw error;
    }
  }

  /**
   * Saves configuration to file.
   *
   * @param config - Configuration to save
   */
  async save(config: Configuration): Promise<void> {
    const validated = validateConfiguration(config);
    const content = JSON.stringify(validated, null, 2);
    await fs.writeFile(this.configPath, content, 'utf-8');
    this.config = validated;
  }

  /**
   * Gets the current provider configuration.
   *
   * @param providerName - Provider name (optional, uses default if not provided)
   * @returns Provider configuration or undefined
   */
  async getProviderConfig(providerName?: string): Promise<ProviderConfig | undefined> {
    const config = await this.load();
    const provider = providerName ?? config.provider;
    return config.providers?.[provider];
  }

  /**
   * Sets provider configuration.
   *
   * @param providerName - Provider name
   * @param providerConfig - Provider configuration
   */
  async setProviderConfig(providerName: string, providerConfig: ProviderConfig): Promise<void> {
    const config = await this.load();
    validateProviderName(providerName);

    if (!config.providers) {
      config.providers = {};
    }

    config.providers[providerName] = providerConfig;
    await this.save(config);
  }

  /**
   * Resolves environment variable references in API keys.
   *
   * @param apiKey - API key or env:VAR_NAME format
   * @returns Resolved API key value
   */
  resolveApiKey(apiKey: string): string {
    if (apiKey.startsWith('env:')) {
      const envVar = apiKey.slice(4);
      const value = process.env[envVar];
      if (!value) {
        throw new ValidationError(`Environment variable "${envVar}" is not set`, 'apiKey');
      }
      return value;
    }
    return apiKey;
  }

  /**
   * Gets the configuration file path.
   *
   * @returns Configuration file path
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Resets cached configuration (forces reload on next access).
   */
  reset(): void {
    this.config = null;
  }
}
