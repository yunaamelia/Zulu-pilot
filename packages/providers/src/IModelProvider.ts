/**
 * Model Provider Interface
 *
 * All custom model providers MUST implement this interface.
 * This contract ensures compatibility with the adapter layer.
 *
 * @package @zulu-pilot/providers
 */

import type { FileContext } from '@zulu-pilot/core';

/**
 * Interface that all model providers must implement
 */
export interface IModelProvider {
  /**
   * Stream response tokens from the model
   *
   * @param prompt - User prompt/message
   * @param context - Array of file contexts to include
   * @returns AsyncGenerator yielding response tokens as strings
   *
   * @throws {ConnectionError} When cannot connect to provider
   * @throws {RateLimitError} When rate limit exceeded
   * @throws {ValidationError} When prompt/context invalid
   */
  streamResponse(prompt: string, context: FileContext[]): AsyncGenerator<string, void, unknown>;

  /**
   * Generate complete response from the model
   *
   * @param prompt - User prompt/message
   * @param context - Array of file contexts to include
   * @returns Promise resolving to complete response string
   *
   * @throws {ConnectionError} When cannot connect to provider
   * @throws {RateLimitError} When rate limit exceeded
   * @throws {ValidationError} When prompt/context invalid
   */
  generateResponse(prompt: string, context: FileContext[]): Promise<string>;

  /**
   * Set the model to use (optional - only if provider supports model switching)
   *
   * @param model - Model identifier
   * @throws {ValidationError} When model not available
   */
  setModel?(model: string): void;

  /**
   * Get the current model identifier (optional)
   *
   * @returns Current model identifier or undefined
   */
  getModel?(): string | undefined;

  /**
   * T132-T134: Discover available models from the provider
   * Lists all models available via the provider API
   *
   * @returns Promise resolving to array of available model names
   * @throws {ConnectionError} When cannot connect to provider
   */
  listModels?(): Promise<string[]>;

  /**
   * Check if a model is available
   *
   * @param modelName - Model name to check
   * @returns Promise resolving to true if model is available
   */
  hasModel?(modelName: string): Promise<boolean>;
}

/**
 * Provider configuration interface
 */
export interface ProviderConfig {
  type: string;
  name: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
  enabled?: boolean;
  [key: string]: unknown; // Allow provider-specific config
}

/**
 * Provider factory function type
 */
export type ProviderFactory = (config: ProviderConfig) => IModelProvider;

