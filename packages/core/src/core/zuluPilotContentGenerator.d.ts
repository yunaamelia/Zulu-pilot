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
import type { IModelAdapter, GenerateContentParams } from '@zulu-pilot/adapter';
import type { UserTierId } from '../code_assist/types.js';
/**
 * Zulu Pilot Content Generator
 *
 * Wraps GeminiCLIModelAdapter to implement ContentGenerator interface
 */
export declare class ZuluPilotContentGenerator implements ContentGenerator {
  private readonly adapter;
  readonly userTier?: UserTierId | undefined;
  constructor(adapter: IModelAdapter, userTier?: UserTierId | undefined);
  generateContent(request: GenerateContentParams): Promise<GeminiGenerateContentResponse>;
  /**
   * Convert adapter response to Gemini response format
   */
  private convertAdapterResponseToGemini;
  generateContentStream(
    request: GenerateContentParams
  ): Promise<AsyncGenerator<GeminiGenerateContentResponse>>;
  /**
   * Convert adapter stream to Gemini stream format
   */
  private convertAdapterStreamToGemini;
  countTokens(_request: CountTokensParameters): Promise<CountTokensResponse>;
  embedContent(_request: EmbedContentParameters): Promise<EmbedContentResponse>;
}
//# sourceMappingURL=zuluPilotContentGenerator.d.ts.map
