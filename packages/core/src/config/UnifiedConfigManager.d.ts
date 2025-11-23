/**
 * Unified Configuration Manager
 *
 * Manages unified configuration for Zulu Pilot
 * @package @zulu-pilot/core
 */
import type { UnifiedConfiguration, ProviderConfiguration } from './UnifiedConfiguration.js';
/**
 * Unified Configuration Manager
 *
 * Manages loading, saving, and validation of unified configuration
 */
export declare class UnifiedConfigManager {
  private config;
  /**
   * Get default configuration
   */
  private getDefaultConfig;
  /**
   * Load configuration from file
   *
   * @returns Unified configuration
   */
  loadConfig(): Promise<UnifiedConfiguration>;
  /**
   * Save configuration to file
   *
   * @param config - Configuration to save
   */
  saveConfig(config: UnifiedConfiguration): Promise<void>;
  /**
   * Get provider configuration
   *
   * @param providerName - Provider name
   * @returns Provider configuration or undefined
   */
  getProviderConfig(providerName: string): ProviderConfiguration | undefined;
  /**
   * Set provider configuration
   *
   * @param providerName - Provider name
   * @param config - Provider configuration
   */
  setProviderConfig(providerName: string, config: ProviderConfiguration): void;
  /**
   * Get current configuration
   *
   * @returns Current configuration or default
   */
  getConfig(): UnifiedConfiguration;
  /**
   * Validate configuration
   *
   * @param config - Configuration to validate
   * @throws {Error} If configuration is invalid
   */
  private validateConfig;
}
//# sourceMappingURL=UnifiedConfigManager.d.ts.map
