import axios, { type AxiosInstance } from 'axios';
import type { IModelProvider } from './IModelProvider.js';
import type { FileContext } from '../context/FileContext.js';
import { ConnectionError, RateLimitError } from '../../utils/errors.js';

/**
 * Configuration for GeminiProvider.
 */
export interface GeminiProviderConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  enableGoogleSearch?: boolean;
  axiosInstance?: AxiosInstance;
}

/**
 * Gemini API provider implementation.
 */
export class GeminiProvider implements IModelProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly enableGoogleSearch: boolean;
  private readonly axiosInstance: AxiosInstance;

  constructor(config: GeminiProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'gemini-2.5-pro';
    this.baseUrl = config.baseUrl ?? 'https://aiplatform.googleapis.com/v1';
    this.enableGoogleSearch = config.enableGoogleSearch ?? false;
    this.axiosInstance = config.axiosInstance ?? axios.create();
  }

  /**
   * Stream response from Gemini API.
   */
  async *streamResponse(
    prompt: string,
    context: FileContext[]
  ): AsyncGenerator<string, void, unknown> {
    const url = `${this.baseUrl}/publishers/google/models/${this.model}:streamGenerateContent?key=${this.apiKey}`;
    const requestBody = this.buildRequest(prompt, context);

    try {
      const response = await this.axiosInstance.post(url, requestBody, {
        responseType: 'stream',
      });

      for await (const chunk of response.data) {
        const text = chunk.toString();
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;

          try {
            const parsed = JSON.parse(line);
            const textContent = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textContent) {
              yield textContent;
            }

            // Check if finished
            if (parsed.candidates?.[0]?.finishReason === 'STOP') {
              return;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new ConnectionError('Invalid API key or authentication failed', 'gemini');
        }
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          throw new RateLimitError(
            'Rate limit exceeded',
            retryAfter ? parseInt(String(retryAfter), 10) : undefined
          );
        }
        if (error.response?.status === 404) {
          throw new ConnectionError('Model not found', 'gemini');
        }
        throw new ConnectionError(
          `Gemini API error: ${error.response?.status} ${error.response?.statusText}`,
          'gemini'
        );
      }
      if (error instanceof ConnectionError || error instanceof RateLimitError) {
        throw error;
      }
      throw new ConnectionError(
        `Failed to connect to Gemini API: ${error instanceof Error ? error.message : String(error)}`,
        'gemini'
      );
    }
  }

  /**
   * Generate complete response from Gemini API.
   */
  async generateResponse(prompt: string, context: FileContext[]): Promise<string> {
    const url = `${this.baseUrl}/publishers/google/models/${this.model}:streamGenerateContent?key=${this.apiKey}`;
    const requestBody = this.buildRequest(prompt, context);

    try {
      const response = await this.axiosInstance.post(url, requestBody);

      const candidates = response.data.candidates;
      if (!candidates || candidates.length === 0) {
        throw new ConnectionError('No response from Gemini API', 'gemini');
      }

      const parts = candidates[0].content?.parts;
      if (!parts || parts.length === 0) {
        throw new ConnectionError('Empty response from Gemini API', 'gemini');
      }

      return parts.map((part: { text?: string }) => part.text ?? '').join('');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new ConnectionError('Invalid API key or authentication failed', 'gemini');
        }
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          throw new RateLimitError(
            'Rate limit exceeded',
            retryAfter ? parseInt(String(retryAfter), 10) : undefined
          );
        }
        if (error.response?.status === 404) {
          throw new ConnectionError('Model not found', 'gemini');
        }
        throw new ConnectionError(
          `Gemini API error: ${error.response?.status} ${error.response?.statusText}`,
          'gemini'
        );
      }
      if (error instanceof ConnectionError || error instanceof RateLimitError) {
        throw error;
      }
      throw new ConnectionError(
        `Failed to connect to Gemini API: ${error instanceof Error ? error.message : String(error)}`,
        'gemini'
      );
    }
  }

  /**
   * Build Gemini API request body.
   */
  private buildRequest(prompt: string, context: FileContext[]): unknown {
    // Build contents array
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add context if present
    if (context.length > 0) {
      const contextText = context.map((file) => `File: ${file.path}\n${file.content}`).join('\n\n');
      contents.push({
        role: 'user',
        parts: [
          {
            text: `You are a coding assistant. When proposing code changes, use this format:\n\n\`\`\`typescript:filename:path/to/file.ts\n// Your code changes here\n\`\`\`\n\nFor multiple files, use separate code blocks. Always include the file path after the language identifier.\n\nHere is the codebase context:\n\n${contextText}\n\nUser question: ${prompt}`,
          },
        ],
      });
    } else {
      contents.push({
        role: 'user',
        parts: [
          {
            text: `You are a coding assistant. When proposing code changes, use this format:\n\n\`\`\`typescript:filename:path/to/file.ts\n// Your code changes here\n\`\`\`\n\nFor multiple files, use separate code blocks. Always include the file path after the language identifier.\n\n${prompt}`,
          },
        ],
      });
    }

    const requestBody: {
      contents: unknown[];
      generationConfig: {
        temperature: number;
        maxOutputTokens: number;
        topP: number;
        thinkingConfig?: { thinkingBudget: number };
      };
      safetySettings: Array<{
        category: string;
        threshold: string;
      }>;
      tools?: Array<{ googleSearch: Record<string, never> }>;
    } = {
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 65535,
        topP: 0.95,
        thinkingConfig: {
          thinkingBudget: -1,
        },
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'OFF',
        },
      ],
    };

    if (this.enableGoogleSearch) {
      requestBody.tools = [{ googleSearch: {} }];
    }

    return requestBody;
  }
}
