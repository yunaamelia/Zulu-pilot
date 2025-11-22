/**
 * Zulu Pilot Content Generator
 *
 * Adapter wrapper that implements ContentGenerator interface
 * using GeminiCLIModelAdapter for multi-provider support
 *
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  CountTokensResponse,
  GenerateContentResponse as GeminiGenerateContentResponse,
  CountTokensParameters,
  EmbedContentResponse,
  EmbedContentParameters,
} from '@google/genai';
import type { ContentGenerator } from './contentGenerator.js';
import type {
  IModelAdapter,
  GenerateContentParams,
  GenerateContentResponse as AdapterGenerateContentResponse,
} from '@zulu-pilot/adapter';
import type { UserTierId } from '../code_assist/types.js';

/**
 * Zulu Pilot Content Generator
 *
 * Wraps GeminiCLIModelAdapter to implement ContentGenerator interface
 */
export class ZuluPilotContentGenerator implements ContentGenerator {
  constructor(
    private readonly adapter: IModelAdapter,
    public readonly userTier?: UserTierId
  ) {}

  async generateContent(request: GenerateContentParams): Promise<GeminiGenerateContentResponse> {
    // Get adapter response and convert to Gemini format
    const adapterResponse = await this.adapter.generateContent(request);

    // Convert adapter response to Gemini format
    // The adapter response format should be compatible, but we need to ensure proper conversion
    return this.convertAdapterResponseToGemini(adapterResponse);
  }

  /**
   * Convert adapter response to Gemini response format
   */
  private convertAdapterResponseToGemini(
    adapterResponse: AdapterGenerateContentResponse
  ): GeminiGenerateContentResponse {
    // The adapter response format is compatible with Gemini format
    // Both use similar structure, so we can return it as-is with proper casting
    // If needed, we can do more detailed conversion here
    return adapterResponse as unknown as GeminiGenerateContentResponse;
  }

  async generateContentStream(
    request: GenerateContentParams
  ): Promise<AsyncGenerator<GeminiGenerateContentResponse>> {
    // Get adapter stream and convert each response
    const adapterStream = this.adapter.streamGenerateContent(request);

    // Convert each streamed response to Gemini format
    return this.convertAdapterStreamToGemini(adapterStream);
  }

  /**
   * Convert adapter stream to Gemini stream format
   */
  private async *convertAdapterStreamToGemini(
    adapterStream: AsyncGenerator<AdapterGenerateContentResponse>
  ): AsyncGenerator<GeminiGenerateContentResponse> {
    for await (const adapterResponse of adapterStream) {
      yield this.convertAdapterResponseToGemini(adapterResponse);
    }
  }

  async countTokens(_request: CountTokensParameters): Promise<CountTokensResponse> {
    // For now, return a basic response
    // TODO: Implement proper token counting if needed
    return {
      totalTokens: 0,
    };
  }

  async embedContent(_request: EmbedContentParameters): Promise<EmbedContentResponse> {
    // For now, return a basic response
    // TODO: Implement embedding if needed
    throw new Error('Embedding not yet supported in Zulu Pilot adapter');
  }
}
