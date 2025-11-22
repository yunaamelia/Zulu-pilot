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
  GenerateContentResponse,
  GenerateContentParameters,
  CountTokensParameters,
  EmbedContentResponse,
  EmbedContentParameters,
} from '@google/genai';
import type { ContentGenerator } from './contentGenerator.js';
import type {
  IModelAdapter,
  GenerateContentParams,
  GenerateContentResponse,
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
    public readonly userTier?: UserTierId,
  ) {}

  async generateContent(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse> {
    // Convert GenerateContentParameters to GenerateContentParams format
    const params = {
      model: request.model || 'ollama:qwen2.5-coder',
      contents: request.contents || [],
      tools: request.tools,
      generationConfig: request.config,
      safetySettings: request.safetySettings,
      systemInstruction: request.systemInstruction,
    };

    return this.adapter.generateContent(params);
  }

  async generateContentStream(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    // Convert GenerateContentParameters to GenerateContentParams format
    const params = {
      model: request.model || 'ollama:qwen2.5-coder',
      contents: request.contents || [],
      tools: request.tools,
      generationConfig: request.config,
      safetySettings: request.safetySettings,
      systemInstruction: request.systemInstruction,
    };

    // Return async generator directly
    return this.adapter.streamGenerateContent(params);
  }

  async countTokens(request: CountTokensParameters): Promise<CountTokensResponse> {
    // For now, return a basic response
    // TODO: Implement proper token counting if needed
    return {
      totalTokens: 0,
    };
  }

  async embedContent(
    request: EmbedContentParameters,
  ): Promise<EmbedContentResponse> {
    // For now, return a basic response
    // TODO: Implement embedding if needed
    throw new Error('Embedding not yet supported in Zulu Pilot adapter');
  }
}

