/**
 * Gemini Converter
 *
 * Converts between Gemini CLI format and Google Gemini API format
 * T103: Implement request/response conversion for Gemini
 *
 * @package @zulu-pilot/adapter
 */

import type {
  GenerateContentParams,
  GenerateContentResponse,
  Content,
  Part,
  GenerationConfig,
  SafetySetting,
} from '../interfaces/IModelAdapter.js';
import type { FileContext } from '@zulu-pilot/core';

/**
 * Google Gemini API Request Format
 */
export interface GeminiRequest {
  contents: Array<{
    role: string;
    parts: Array<{
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
      fileData?: {
        mimeType: string;
        fileUri: string;
      };
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    candidateCount?: number;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
  systemInstruction?: {
    parts: Array<{
      text: string;
    }>;
  };
}

/**
 * Google Gemini API Response Format
 */
export interface GeminiResponse {
  candidates?: Array<{
    content: {
      role: string;
      parts: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

/**
 * Gemini Converter
 *
 * Handles conversion between Gemini CLI format and Google Gemini API format
 * Note: Gemini API format is very similar to Gemini CLI format, so conversion is mostly pass-through
 */
export class GeminiConverter {
  /**
   * Convert Gemini CLI GenerateContentParams to Gemini API request format
   *
   * @param params - Gemini CLI format parameters
   * @param context - Array of file contexts
   * @returns Gemini API request format
   */
  convertToProviderFormat(
    params: GenerateContentParams,
    context: FileContext[] = []
  ): GeminiRequest {
    // Start with contents from params (they're already in Gemini format)
    const contents: GeminiRequest['contents'] = [];

    // Build system instruction with context
    const systemParts: string[] = [];

    if (params.systemInstruction) {
      systemParts.push(params.systemInstruction);
    }

    // Add context to system instruction
    if (context.length > 0) {
      const contextText = context.map((file) => `File: ${file.path}\n${file.content}`).join('\n\n');
      systemParts.push(`\n\nCodebase Context:\n${contextText}`);
    }

    // Convert contents
    for (const content of params.contents) {
      const parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
        fileData?: {
          mimeType: string;
          fileUri: string;
        };
      }> = [];

      for (const part of content.parts) {
        if (part.text) {
          parts.push({
            text: part.text,
          });
        } else if (part.inlineData) {
          parts.push({
            inlineData: {
              mimeType: part.inlineData.mimeType,
              data: part.inlineData.data,
            },
          });
        } else if (part.fileData) {
          parts.push({
            fileData: {
              mimeType: part.fileData.mimeType,
              fileUri: part.fileData.fileUri,
            },
          });
        }
      }

      if (parts.length > 0) {
        contents.push({
          role: content.role ?? 'user',
          parts,
        });
      }
    }

    // Build request
    const request: GeminiRequest = {
      contents,
    };

    // Add system instruction if present
    if (systemParts.length > 0) {
      request.systemInstruction = {
        parts: [
          {
            text: systemParts.join('\n'),
          },
        ],
      };
    }

    // Convert generation config
    if (params.generationConfig) {
      const config: GenerationConfig = params.generationConfig;
      request.generationConfig = {
        temperature: config.temperature,
        topP: config.topP,
        topK: config.topK,
        maxOutputTokens: config.maxOutputTokens,
        candidateCount: config.candidateCount,
      };
    }

    // Convert safety settings
    if (params.safetySettings && params.safetySettings.length > 0) {
      request.safetySettings = params.safetySettings.map((setting: SafetySetting) => ({
        category: setting.category,
        threshold: setting.threshold,
      }));
    }

    return request;
  }

  /**
   * Convert Gemini API response to Gemini CLI GenerateContentResponse format
   *
   * @param response - Gemini API response
   * @returns Gemini CLI format response
   */
  convertToGeminiFormat(response: GeminiResponse | string): GenerateContentResponse {
    // Handle string response (already converted)
    if (typeof response === 'string') {
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

    // Convert candidates to content
    const content: Content[] = [];
    const candidates = response.candidates ?? [];

    for (const candidate of candidates) {
      const parts: Part[] = [];

      for (const part of candidate.content.parts) {
        if (part.text) {
          parts.push({
            text: part.text,
          });
        }
      }

      if (parts.length > 0) {
        content.push({
          role: candidate.content.role as 'user' | 'model',
          parts,
        });
      }
    }

    const result: GenerateContentResponse = {
      content,
      candidates: candidates.map((candidate) => ({
        content: {
          role: candidate.content.role as 'user' | 'model',
          parts: candidate.content.parts.map((part) => ({
            text: part.text ?? '',
          })),
        },
        finishReason: candidate.finishReason,
        safetyRatings: candidate.safetyRatings?.map((rating) => ({
          category: rating.category,
          probability: rating.probability,
        })),
      })),
    };

    // Add usage metadata if available
    if (response.usageMetadata) {
      result.usageMetadata = {
        promptTokenCount: response.usageMetadata.promptTokenCount,
        candidatesTokenCount: response.usageMetadata.candidatesTokenCount,
        totalTokenCount: response.usageMetadata.totalTokenCount,
      };
    }

    return result;
  }

  /**
   * Extract model name from model identifier
   * Handles "provider:model" format
   *
   * @param modelId - Model identifier (e.g., "gemini:gemini-pro" or "gemini-pro")
   * @returns Model name (e.g., "gemini-pro")
   */
  extractModelName(modelId: string): string {
    if (modelId.includes(':')) {
      const parts = modelId.split(':');
      return parts[parts.length - 1];
    }
    return modelId;
  }

  /**
   * Convert streaming chunk from Gemini API to Gemini CLI format
   *
   * @param chunk - Gemini API streaming chunk
   * @param accumulatedText - Accumulated text so far
   * @returns Gemini CLI format response
   */
  convertStreamChunkToGeminiFormat(
    chunk: GeminiResponse,
    accumulatedText: string
  ): GenerateContentResponse {
    // Extract new text from chunk
    const candidate = chunk.candidates?.[0];
    const newPart = candidate?.content.parts?.[0];
    const newText = newPart?.text ?? '';

    const updatedText = accumulatedText + newText;

    return {
      content: [
        {
          role: 'model',
          parts: [
            {
              text: updatedText,
            },
          ],
        },
      ],
      candidates: chunk.candidates?.map((c) => ({
        content: {
          role: c.content.role as 'user' | 'model',
          parts: c.content.parts.map((p) => ({
            text: p.text ?? '',
          })),
        },
        finishReason: c.finishReason,
        safetyRatings: c.safetyRatings?.map((r) => ({
          category: r.category,
          probability: r.probability,
        })),
      })),
    };
  }
}
