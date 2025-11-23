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
   * T207: Provider instance caching with lazy initialization
   * Get provider instance (lazy initialization with caching)
   *
   * @param name - Provider name
   * @returns Provider instance (cached after first creation)
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

    // T207: Cached lazy initialization - instance is created once and reused
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

      // T207: Create and cache instance
      entry.instance = entry.factory(providerConfig);
    }

    // T207: Return cached instance
    return entry.instance;
  }

  /**
   * T207: Clear provider instance cache (useful for testing or reinitialization)
   * 
   * @param name - Provider name (optional, clears all if not provided)
   */
  clearCache(name?: string): void {
    if (name) {
      const entry = this.providers.get(name);
      if (entry) {
        entry.instance = null;
      }
    } else {
      // Clear all provider instances
      for (const entry of this.providers.values()) {
        entry.instance = null;
      }
    }
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
