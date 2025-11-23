/**
 * Gemini CLI Model Adapter
 *
 * Adapts custom model providers to Gemini CLI's expected interface
 * @package @zulu-pilot/adapter
 */

import type {
  IModelAdapter,
  GenerateContentParams,
  GenerateContentResponse,
} from './interfaces/IModelAdapter.js';
import type { IModelProvider, FileContext } from '@zulu-pilot/providers';
import { MultiProviderRouter } from './MultiProviderRouter.js';
import type { UnifiedConfiguration } from '@zulu-pilot/core';
import type { ContextManager } from '@zulu-pilot/core';
import {
  ConnectionError,
  RateLimitError,
  ValidationError,
  ModelNotFoundError,
  InvalidApiKeyError,
  AppError,
} from '@zulu-pilot/core';

/**
 * Gemini CLI Model Adapter
 *
 * Converts between Gemini CLI format and provider format
 */
export class GeminiCLIModelAdapter implements IModelAdapter {
  private readonly router: MultiProviderRouter;
  private readonly config: UnifiedConfiguration;
  private contextManager?: ContextManager;

  constructor(
    router: MultiProviderRouter,
    config: UnifiedConfiguration,
    contextManager?: ContextManager
  ) {
    this.router = router;
    this.config = config;
    this.contextManager = contextManager;
  }

  /**
   * T091: Integrate context with adapter for prompt generation
   * Convert Gemini CLI contents to provider prompt and file context
   * Merges context from ContextManager with any file references in the prompt
   *
   * @param contents - Gemini CLI format contents
   * @returns Object with prompt and file contexts
   */
  private convertToProviderFormat(contents: GenerateContentParams['contents']): {
    prompt: string;
    context: FileContext[];
  } {
    // T091: Get context from ContextManager if available
    const contextManagerContext: FileContext[] = this.contextManager
      ? this.contextManager.getContext()
      : [];

    const context: FileContext[] = [...contextManagerContext];
    const promptParts: string[] = [];

    for (const content of contents) {
      for (const part of content.parts) {
        if (part.text) {
          promptParts.push(part.text);
        }
        if (part.fileData) {
          // File context would need to be loaded from fileUri
          // For now, we'll include it as a note in the prompt
          promptParts.push(`[File: ${part.fileData.fileUri}]`);
        }
      }
    }

    // T091: If context is available, prepend context information to prompt
    let prompt = promptParts.join('\n');
    if (context.length > 0) {
      const contextInfo = context.map((file) => {
        const path = file.path;
        const content = file.content;
        return `--- File: ${path} ---\n${content}\n--- End of ${path} ---`;
      });
      prompt = `--- Context Files (${context.length} files) ---\n${contextInfo.join('\n\n')}\n--- End of Context Files ---\n\n${prompt}`;
    }

    return {
      prompt,
      context,
    };
  }

  /**
   * T205: Optimized response conversion - reuse object structure where possible
   * Convert provider response to Gemini CLI format
   *
   * @param response - Provider response string
   * @returns Gemini CLI format response
   */
  private convertToGeminiFormat(response: string): GenerateContentResponse {
    // T205: Direct object creation is already optimal for this case
    // Reusing structure wouldn't help since responses are different each time
    return {
      content: [
        {
          role: 'model',
          parts: [
            {
              text: response,
            },
          ],
        },
      ],
    };
  }

  /**
   * T121: Handle errors from provider and convert to user-friendly messages
   * Wraps provider errors and ensures they have actionable guidance
   *
   * @param error - Error from provider
   * @param providerName - Name of the provider that threw the error
   * @param modelId - Model identifier that was requested
   * @returns Error with user-friendly message
   */
  private handleProviderError(
    error: unknown,
    providerName: string,
    modelId: string
  ): Error {
    // If error is already one of our custom errors, return it as-is
    if (
      error instanceof ConnectionError ||
      error instanceof RateLimitError ||
      error instanceof ValidationError ||
      error instanceof ModelNotFoundError ||
      error instanceof InvalidApiKeyError ||
      error instanceof AppError
    ) {
      return error;
    }

    // If error is a plain Error, try to wrap it appropriately
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Connection errors
      if (
        message.includes('connection') ||
        message.includes('timeout') ||
        message.includes('econnrefused') ||
        message.includes('etimedout') ||
        message.includes('network')
      ) {
        return new ConnectionError(error.message, providerName, error);
      }

      // Rate limit errors
      if (
        message.includes('rate limit') ||
        message.includes('429') ||
        message.includes('too many requests')
      ) {
        return new RateLimitError(error.message, undefined, error);
      }

      // Model not found errors
      if (
        message.includes('model') &&
        (message.includes('not found') || message.includes('404'))
      ) {
        return new ModelNotFoundError(error.message, modelId, providerName, error);
      }

      // API key errors
      if (
        message.includes('api key') ||
        message.includes('authentication') ||
        message.includes('401') ||
        message.includes('unauthorized')
      ) {
        return new InvalidApiKeyError(error.message, providerName, error);
      }

      // Validation errors
      if (
        message.includes('validation') ||
        message.includes('invalid') ||
        message.includes('400')
      ) {
        return new ValidationError(error.message, undefined, error);
      }

      // Default: wrap as ConnectionError for unknown errors
      return new ConnectionError(
        `Provider error: ${error.message}`,
        providerName,
        error
      );
    }

    // Unknown error type - wrap as generic error
    return new ConnectionError(
      `Unexpected error from ${providerName}: ${String(error)}`,
      providerName
    );
  }

  /**
   * Generate content - implements Gemini CLI's expected interface
   * T121: Implement error handling in adapter layer
   *
   * @param params - Gemini CLI format parameters
   * @returns Promise resolving to Gemini CLI format response
   * @throws {ConnectionError} When connection to provider fails
   * @throws {RateLimitError} When rate limit is exceeded
   * @throws {ValidationError} When input validation fails
   * @throws {ModelNotFoundError} When model is not found
   * @throws {InvalidApiKeyError} When API key is invalid
   */
  async generateContent(params: GenerateContentParams): Promise<GenerateContentResponse> {
    try {
      const { prompt, context } = this.convertToProviderFormat(params.contents);
      const defaultProvider = this.config.defaultProvider;

      const provider = this.router.getProviderForModel(params.model, defaultProvider);

      const response = await provider.generateResponse(prompt, context);

      return this.convertToGeminiFormat(response);
    } catch (error) {
      const defaultProvider = this.config.defaultProvider;
      const providerName = this.router.parseModelId(params.model, defaultProvider).provider;
      throw this.handleProviderError(error, providerName, params.model);
    }
  }

  /**
   * Stream generate content - implements Gemini CLI's expected interface
   * T121: Implement error handling in adapter layer
   *
   * @param params - Gemini CLI format parameters
   * @returns AsyncGenerator yielding Gemini CLI format responses
   * @throws {ConnectionError} When connection to provider fails
   * @throws {RateLimitError} When rate limit is exceeded
   * @throws {ValidationError} When input validation fails
   * @throws {ModelNotFoundError} When model is not found
   * @throws {InvalidApiKeyError} When API key is invalid
   */
  async *streamGenerateContent(
    params: GenerateContentParams
  ): AsyncGenerator<GenerateContentResponse, void, unknown> {
    try {
      const { prompt, context } = this.convertToProviderFormat(params.contents);
      const defaultProvider = this.config.defaultProvider;

      const provider = this.router.getProviderForModel(params.model, defaultProvider);

      let accumulatedText = '';

      try {
        for await (const token of provider.streamResponse(prompt, context)) {
          accumulatedText += token;
          yield this.convertToGeminiFormat(accumulatedText);
        }
      } catch (error) {
        // Handle errors during streaming
        const defaultProvider = this.config.defaultProvider;
        const providerName = this.router.parseModelId(params.model, defaultProvider).provider;
        throw this.handleProviderError(error, providerName, params.model);
      }
    } catch (error) {
      const defaultProvider = this.config.defaultProvider;
      const providerName = this.router.parseModelId(params.model, defaultProvider).provider;
      throw this.handleProviderError(error, providerName, params.model);
    }
  }

  /**
   * Get provider for model ID
   *
   * @param modelId - Model identifier
   * @returns Provider instance
   */
  getProviderForModel(modelId: string): IModelProvider {
    const defaultProvider = this.config.defaultProvider;
    return this.router.getProviderForModel(modelId, defaultProvider);
  }

  /**
   * Switch provider
   *
   * @param providerName - Provider name to switch to
   */
  switchProvider(providerName: string): void {
    this.router.switchProvider(providerName);
  }

  /**
   * T137: Implement model switching in adapter
   * Switch the model for a specific provider
   *
   * @param providerName - Provider name
   * @param modelName - Model name to switch to
   * @throws {ValidationError} When provider not found or model not available
   */
  async switchModel(providerName: string, modelName: string): Promise<void> {
    const modelId = `${providerName}:${modelName}`;

    try {
      // Get provider instance
      const provider = this.router.getProviderForModel(modelId, providerName);

      // Check if model is available if provider supports discovery
      if (provider.hasModel) {
        const isAvailable = await provider.hasModel(modelName);
        if (!isAvailable && provider.listModels) {
          const availableModels = await provider.listModels();
          throw new ValidationError(
            `Model "${modelName}" is not available for provider "${providerName}". ` +
              `Available models: ${availableModels.slice(0, 5).join(', ')}${
                availableModels.length > 5 ? '...' : ''
              }`,
            'model'
          );
        }
      }

      // Set model on provider if it supports it
      if (provider.setModel) {
        provider.setModel(modelName);
      } else {
        throw new ValidationError(
          `Provider "${providerName}" does not support model switching.`,
          'provider'
        );
      }

      // Update configuration
      if (!this.config.providers) {
        this.config.providers = {};
      }
      if (!this.config.providers[providerName]) {
        // Provider config should exist if provider is registered
        // Get the type from the router's registry or throw error
        throw new ValidationError(
          `Provider configuration not found for "${providerName}". Provider must be configured first.`,
          'provider'
        );
      }
      // Update model property while preserving existing config
      this.config.providers[providerName] = {
        ...this.config.providers[providerName],
        model: modelName,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw this.handleProviderError(error as Error, providerName, modelName);
    }
  }

  /**
   * T091: Set ContextManager for this adapter
   * This allows the adapter to use context added via CLI commands
   *
   * @param contextManager - ContextManager instance
   */
  setContextManager(contextManager: ContextManager): void {
    this.contextManager = contextManager;
  }

  /**
   * Get ContextManager instance
   *
   * @returns ContextManager instance or undefined
   */
  getContextManager(): ContextManager | undefined {
    return this.contextManager;
  }

  /**
   * Get MultiProviderRouter instance
   *
   * @returns Router instance
   */
  getRouter(): MultiProviderRouter {
    return this.router;
  }

  /**
   * T141: Check if the current provider supports Google Search
   * T143: Implement graceful degradation for providers without Google Search
   * Only Gemini providers (gemini, googleCloud) support Google Search by default
   *
   * @returns true if current provider supports Google Search
   */
  supportsGoogleSearch(): boolean {
    const defaultProvider = this.config.defaultProvider;
    const providerConfig = this.config.providers?.[defaultProvider];

    if (!providerConfig) {
      return false;
    }

    // Check if allowAllProviders is enabled in Google Search config
    const googleSearchConfig = this.config.googleSearch;
    if (googleSearchConfig?.allowAllProviders) {
      return true;
    }

    // Only Gemini providers support Google Search by default
    const geminiProviders = ['gemini', 'googleCloud'];
    return geminiProviders.includes(providerConfig.type);
  }

  /**
   * T141: Get the current provider name
   *
   * @returns Current provider name
   */
  getCurrentProvider(): string {
    return this.config.defaultProvider;
  }
}
