/**
 * Provider Registry
 *
 * Manages provider instances with lazy initialization
 * @package @zulu-pilot/adapter
 */

import type { IModelProvider, ProviderConfig } from '@zulu-pilot/providers';
import type { ProviderConfiguration } from '@zulu-pilot/core';

/**
 * Provider registry entry
 */
interface ProviderRegistryEntry {
  config: ProviderConfiguration;
  instance: IModelProvider | null;
  factory?: (config: ProviderConfig) => IModelProvider;
}

/**
 * Provider Registry
 *
 * Manages provider instances with lazy initialization
 */
export class ProviderRegistry {
  private readonly providers: Map<string, ProviderRegistryEntry> = new Map();
  private readonly factories: Map<string, (config: ProviderConfig) => IModelProvider> = new Map();

  /**
   * Register a provider factory
   *
   * @param type - Provider type identifier
   * @param factory - Factory function to create provider instance
   */
  registerFactory(type: string, factory: (config: ProviderConfig) => IModelProvider): void {
    this.factories.set(type, factory);
  }

  /**
   * Register a provider configuration
   *
   * @param name - Provider name
   * @param config - Provider configuration
   */
  registerProvider(name: string, config: ProviderConfiguration): void {
    const factory = this.factories.get(config.type);
    this.providers.set(name, {
      config,
      instance: null,
      factory: factory || undefined,
    });
  }

  /**
   * Get provider instance (lazy initialization)
   *
   * @param name - Provider name
   * @returns Provider instance
   * @throws {Error} If provider not found or cannot be initialized
   */
  getProvider(name: string): IModelProvider {
    const entry = this.providers.get(name);
    if (!entry) {
      throw new Error(`Provider "${name}" not found`);
    }

    if (!entry.config.enabled) {
      throw new Error(`Provider "${name}" is disabled`);
    }

    // Lazy initialization
    if (!entry.instance) {
      if (!entry.factory) {
        throw new Error(`No factory registered for provider type "${entry.config.type}"`);
      }

      // Convert ProviderConfiguration to ProviderConfig
      const providerConfig: ProviderConfig = {
        type: entry.config.type,
        name: entry.config.name,
        apiKey: entry.config.apiKey,
        baseUrl: entry.config.baseUrl,
        model: entry.config.model,
        timeout: entry.config.timeout,
        enabled: entry.config.enabled,
        ...entry.config.providerSpecific,
      };

      entry.instance = entry.factory(providerConfig);
    }

    return entry.instance;
  }

  /**
   * Check if provider exists
   *
   * @param name - Provider name
   * @returns True if provider exists
   */
  hasProvider(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * List all registered provider names
   *
   * @returns Array of provider names
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Clear all providers (useful for testing)
   */
  clear(): void {
    this.providers.clear();
  }
}

