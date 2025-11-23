/**
 * OpenAI Converter
 *
 * Converts between Gemini CLI format and OpenAI API format
 * T101: Implement request/response conversion for OpenAI
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
 * OpenAI API Request Format
 */
export interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * OpenAI API Response Format
 */
export interface OpenAIResponse {
  choices?: Array<{
    message?: {
      role: string;
      content: string;
    };
    delta?: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/**
 * OpenAI Converter
 *
 * Handles conversion between Gemini CLI format and OpenAI API format
 */
export class OpenAIConverter {
  /**
   * Convert Gemini CLI GenerateContentParams to OpenAI request format
   *
   * @param params - Gemini CLI format parameters
   * @param context - Array of file contexts
   * @returns OpenAI API request format
   */
  convertToProviderFormat(
    params: GenerateContentParams,
    context: FileContext[] = []
  ): OpenAIRequest {
    // Extract prompt from contents
    const promptParts: string[] = [];

    for (const content of params.contents) {
      for (const part of content.parts) {
        if (part.text) {
          if (content.role === 'user') {
            promptParts.push(part.text);
          } else if (content.role === 'model') {
            // Model responses become assistant messages
            // This is for conversation history
          }
        }
      }
    }

    // Build messages array
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // Add system instruction
    const systemPromptParts: string[] = [];
    if (params.systemInstruction) {
      systemPromptParts.push(params.systemInstruction);
    }

    // Add context to system prompt
    if (context.length > 0) {
      const contextText = context.map((file) => `File: ${file.path}\n${file.content}`).join('\n\n');
      systemPromptParts.push(`\n\nCodebase Context:\n${contextText}`);
    }

    if (systemPromptParts.length > 0) {
      messages.push({
        role: 'system',
        content: systemPromptParts.join('\n'),
      });
    }

    // Add user prompt
    const userPrompt = promptParts.join('\n');
    if (userPrompt) {
      messages.push({
        role: 'user',
        content: userPrompt,
      });
    }

    // Convert generation config
    const config: GenerationConfig = params.generationConfig ?? {};
    const temperature = config.temperature ?? 0.7;
    const maxTokens = config.maxOutputTokens ?? 4096;

    return {
      model: this.extractModelName(params.model),
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false, // Set explicitly based on usage
    };
  }

  /**
   * Convert OpenAI response to Gemini CLI GenerateContentResponse format
   *
   * @param response - OpenAI API response
   * @returns Gemini CLI format response
   */
  convertToGeminiFormat(response: OpenAIResponse | string): GenerateContentResponse {
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

    // Extract content from OpenAI response
    const content = response.choices?.[0]?.message?.content ?? '';
    const finishReason = response.choices?.[0]?.finish_reason;

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
    if (response.usage) {
      result.usageMetadata = {
        promptTokenCount: response.usage.prompt_tokens,
        candidatesTokenCount: response.usage.completion_tokens,
        totalTokenCount: response.usage.total_tokens,
      };
    }

    // Add finish reason if available
    if (finishReason) {
      result.candidates = [
        {
          content: result.content[0],
          finishReason,
        },
      ];
    }

    return result;
  }

  /**
   * Extract model name from model identifier
   * Handles "provider:model" format
   *
   * @param modelId - Model identifier (e.g., "openai:gpt-4" or "gpt-4")
   * @returns Model name (e.g., "gpt-4")
   */
  private extractModelName(modelId: string): string {
    if (modelId.includes(':')) {
      const parts = modelId.split(':');
      return parts[parts.length - 1];
    }
    return modelId;
  }

  /**
   * Convert streaming chunk from OpenAI to Gemini CLI format
   *
   * @param chunk - OpenAI streaming chunk
   * @param accumulatedText - Accumulated text so far
   * @returns Gemini CLI format response
   */
  convertStreamChunkToGeminiFormat(
    chunk: OpenAIResponse,
    accumulatedText: string
  ): GenerateContentResponse {
    const delta = chunk.choices?.[0]?.delta;
    const content = delta?.content ?? '';

    const newText = accumulatedText + content;

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
