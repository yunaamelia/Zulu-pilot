/**
 * Multi-Provider Router
 *
 * Routes requests to the correct provider based on model ID
 * @package @zulu-pilot/adapter
 */

import type { IModelProvider } from '@zulu-pilot/providers';
import { ProviderRegistry } from './ProviderRegistry.js';
import type { UnifiedConfiguration } from '@zulu-pilot/core';

/**
 * Parsed model ID
 */
interface ParsedModelId {
  provider: string;
  model: string;
}

/**
 * Multi-Provider Router
 *
 * Routes requests to the correct provider based on model ID format
 */
export class MultiProviderRouter {
  private readonly registry: ProviderRegistry;
  private readonly config: UnifiedConfiguration;
  private currentProvider: string | null = null;

  constructor(registry: ProviderRegistry, config: UnifiedConfiguration) {
    this.registry = registry;
    this.config = config;
  }

  /**
   * Get default provider from config
   */
  getDefaultProvider(): string {
    return this.config.defaultProvider;
  }

  /**
   * Parse model ID (format: "model" or "provider:model")
   *
   * @param modelId - Model identifier
   * @param defaultProvider - Default provider name if not specified
   * @returns Parsed model ID with provider and model
   */
  parseModelId(modelId: string, defaultProvider: string): ParsedModelId {
    if (modelId.includes(':')) {
      const [provider, ...modelParts] = modelId.split(':');
      return {
        provider: provider.trim(),
        model: modelParts.join(':').trim(),
      };
    }

    // No provider specified, use default
    return {
      provider: defaultProvider,
      model: modelId.trim(),
    };
  }

  /**
   * Get provider for model ID
   *
   * @param modelId - Model identifier (format: "model" or "provider:model")
   * @param defaultProvider - Default provider name
   * @returns Provider instance
   * @throws {Error} If provider not found
   */
  getProviderForModel(modelId: string, defaultProvider: string): IModelProvider {
    const parsed = this.parseModelId(modelId, defaultProvider);

    if (!this.registry.hasProvider(parsed.provider)) {
      throw new Error(`Provider "${parsed.provider}" not found`);
    }

    const provider = this.registry.getProvider(parsed.provider);

    // Set model if provider supports it
    if (parsed.model && provider.setModel) {
      provider.setModel(parsed.model);
    }

    return provider;
  }

  /**
   * Switch to a different provider
   *
   * @param providerName - Provider name to switch to
   * @throws {Error} If provider not found
   */
  switchProvider(providerName: string): void {
    if (!this.registry.hasProvider(providerName)) {
      throw new Error(`Provider "${providerName}" not found`);
    }

    // Verify provider is enabled
    this.registry.getProvider(providerName);
    this.currentProvider = providerName;
  }

  /**
   * Get current provider name
   *
   * @returns Current provider name or null
   */
  getCurrentProvider(): string | null {
    return this.currentProvider;
  }
}
