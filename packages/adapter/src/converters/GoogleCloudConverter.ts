/**
 * Google Cloud Converter
 *
 * Converts between Gemini CLI format and Google Cloud Vertex AI format
 * T102: Implement request/response conversion for Google Cloud
 *
 * @package @zulu-pilot/adapter
 */

import type {
  GenerateContentParams,
  GenerateContentResponse,
  GenerationConfig,
} from '../interfaces/IModelAdapter.js';
import type { FileContext } from '@zulu-pilot/core';

/**
 * Google Cloud Vertex AI Request Format
 */
export interface GoogleCloudRequest {
  instances: Array<{
    prompt: string;
  }>;
  parameters: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

/**
 * Google Cloud Vertex AI Response Format
 */
export interface GoogleCloudResponse {
  predictions?: Array<{
    content?: string;
    generatedText?: string;
    safetyAttributes?: unknown;
  }>;
  metadata?: {
    tokenCount?: {
      promptTokens?: number;
      candidatesTokens?: number;
      totalTokens?: number;
    };
  };
}

/**
 * Google Cloud Converter
 *
 * Handles conversion between Gemini CLI format and Google Cloud Vertex AI format
 */
export class GoogleCloudConverter {
  /**
   * Convert Gemini CLI GenerateContentParams to Google Cloud request format
   *
   * @param params - Gemini CLI format parameters
   * @param context - Array of file contexts
   * @returns Google Cloud API request format
   */
  convertToProviderFormat(
    params: GenerateContentParams,
    context: FileContext[] = []
  ): GoogleCloudRequest {
    // Extract prompt from contents
    const promptParts: string[] = [];
    const systemParts: string[] = [];

    for (const content of params.contents) {
      for (const part of content.parts) {
        if (part.text) {
          if (content.role === 'user') {
            promptParts.push(part.text);
          }
        }
      }
    }

    // Add system instruction
    if (params.systemInstruction) {
      systemParts.push(params.systemInstruction);
    }

    // Build full prompt
    const promptSections: string[] = [];

    // Add context
    if (context.length > 0) {
      const contextText = context.map((file) => `File: ${file.path}\n${file.content}`).join('\n\n');
      promptSections.push(contextText);
    }

    // Add system instruction
    if (systemParts.length > 0) {
      promptSections.push(systemParts.join('\n'));
    }

    // Add user prompt
    const userPrompt = promptParts.join('\n');
    if (userPrompt) {
      if (promptSections.length > 0) {
        promptSections.push(`\n\nUser: ${userPrompt}`);
      } else {
        promptSections.push(userPrompt);
      }
    }

    const fullPrompt = promptSections.join('\n\n');

    // Convert generation config
    const config: GenerationConfig = params.generationConfig ?? {};
    const temperature = config.temperature ?? 0.7;
    const maxOutputTokens = config.maxOutputTokens ?? 4096;
    const topP = config.topP;
    const topK = config.topK;

    const parameters: GoogleCloudRequest['parameters'] = {
      temperature,
      maxOutputTokens,
    };

    if (topP !== undefined) {
      parameters.topP = topP;
    }

    if (topK !== undefined) {
      parameters.topK = topK;
    }

    return {
      instances: [
        {
          prompt: fullPrompt,
        },
      ],
      parameters,
    };
  }

  /**
   * Convert Google Cloud response to Gemini CLI GenerateContentResponse format
   *
   * @param response - Google Cloud API response
   * @returns Gemini CLI format response
   */
  convertToGeminiFormat(response: GoogleCloudResponse | string): GenerateContentResponse {
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

    // Extract content from Google Cloud response
    const prediction = response.predictions?.[0];
    const content = prediction?.content ?? prediction?.generatedText ?? '';

    const result: GenerateContentResponse = {
      content: [
        {
          role: 'model',
          parts: [
            {
              text: content,
            },
          ],
        },
      ],
    };

    // Add usage metadata if available
    if (response.metadata?.tokenCount) {
      result.usageMetadata = {
        promptTokenCount: response.metadata.tokenCount.promptTokens,
        candidatesTokenCount: response.metadata.tokenCount.candidatesTokens,
        totalTokenCount: response.metadata.tokenCount.totalTokens,
      };
    }

    return result;
  }

  /**
   * Extract model name from model identifier
   * Handles "provider:model" format
   *
   * @param modelId - Model identifier (e.g., "googlecloud:gemini-pro" or "gemini-pro")
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
   * Extract content from streaming chunk
   *
   * @param chunk - Google Cloud streaming chunk
   * @param accumulatedText - Accumulated text so far
   * @returns Gemini CLI format response
   */
  convertStreamChunkToGeminiFormat(
    chunk: GoogleCloudResponse | string,
    accumulatedText: string
  ): GenerateContentResponse {
    let newText = accumulatedText;

    if (typeof chunk === 'string') {
      newText = accumulatedText + chunk;
    } else {
      const prediction = chunk.predictions?.[0];
      const content = prediction?.content ?? prediction?.generatedText ?? '';
      newText = accumulatedText + content;
    }

    return {
      content: [
        {
          role: 'model',
          parts: [
            {
              text: newText,
            },
          ],
        },
      ],
    };
  }
}
