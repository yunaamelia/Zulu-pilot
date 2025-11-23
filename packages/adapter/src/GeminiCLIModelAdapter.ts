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
   * Convert provider response to Gemini CLI format
   *
   * @param response - Provider response string
   * @returns Gemini CLI format response
   */
  private convertToGeminiFormat(response: string): GenerateContentResponse {
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
   * Generate content - implements Gemini CLI's expected interface
   *
   * @param params - Gemini CLI format parameters
   * @returns Promise resolving to Gemini CLI format response
   */
  async generateContent(params: GenerateContentParams): Promise<GenerateContentResponse> {
    const { prompt, context } = this.convertToProviderFormat(params.contents);
    const defaultProvider = this.config.defaultProvider;

    const provider = this.router.getProviderForModel(params.model, defaultProvider);
    const response = await provider.generateResponse(prompt, context);

    return this.convertToGeminiFormat(response);
  }

  /**
   * Stream generate content - implements Gemini CLI's expected interface
   *
   * @param params - Gemini CLI format parameters
   * @returns AsyncGenerator yielding Gemini CLI format responses
   */
  async *streamGenerateContent(
    params: GenerateContentParams
  ): AsyncGenerator<GenerateContentResponse, void, unknown> {
    const { prompt, context } = this.convertToProviderFormat(params.contents);
    const defaultProvider = this.config.defaultProvider;

    const provider = this.router.getProviderForModel(params.model, defaultProvider);
    let accumulatedText = '';

    for await (const token of provider.streamResponse(prompt, context)) {
      accumulatedText += token;
      yield this.convertToGeminiFormat(accumulatedText);
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
}
