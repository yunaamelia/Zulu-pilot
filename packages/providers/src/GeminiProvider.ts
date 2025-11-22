import axios, { AxiosInstance, AxiosError } from 'axios';
import type { IModelProvider } from './IModelProvider.js';
import type { FileContext } from '@zulu-pilot/core';
import {
  ConnectionError,
  RateLimitError,
  getProviderTimeout,
  ValidationError,
} from './utils/errors.js';

/**
 * Configuration for GeminiProvider.
 */
export interface GeminiProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
  axiosInstance?: AxiosInstance;
}

/**
 * Gemini provider implementation.
 * Connects to Google Gemini API using their official API endpoint.
 */
export class GeminiProvider implements IModelProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly axiosInstance: AxiosInstance;
  private currentModel: string;

  constructor(config: GeminiProviderConfig = {}) {
    this.apiKey = config.apiKey ?? process.env.GEMINI_API_KEY ?? '';
    if (!this.apiKey) {
      throw new ValidationError(
        'Gemini API key is required. Set GEMINI_API_KEY environment variable or provide in config.',
        'apiKey'
      );
    }

    // Handle environment variable reference
    if (this.apiKey.startsWith('env:')) {
      const envVar = this.apiKey.slice(4);
      this.apiKey = process.env[envVar] ?? '';
      if (!this.apiKey) {
        throw new ValidationError(`Environment variable ${envVar} is not set.`, 'apiKey');
      }
    }

    this.baseUrl = config.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta';
    this.model = config.model ?? 'gemini-pro';
    this.currentModel = this.model;
    this.timeout = config.timeout ?? getProviderTimeout(false); // Remote provider

    this.axiosInstance =
      config.axiosInstance ??
      axios.create({
        baseURL: this.baseUrl,
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      });
  }

  /**
   * Get the current model name.
   */
  getModel(): string {
    return this.currentModel;
  }

  /**
   * Set the model to use.
   */
  setModel(model: string): void {
    this.currentModel = model;
  }

  /**
   * Stream response from Gemini API.
   */
  async *streamResponse(
    prompt: string,
    context: FileContext[]
  ): AsyncGenerator<string, void, unknown> {
    try {
      const contents = this.buildContents(prompt, context);

      const response = await this.axiosInstance.post(
        `/models/${this.currentModel}:streamGenerateContent?key=${this.apiKey}`,
        {
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        },
        {
          responseType: 'stream',
        }
      );

      // Parse streaming response
      const stream = response.data;
      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) {
            continue;
          }

          try {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              return;
            }

            const parsed = JSON.parse(data);
            const content = this.extractContent(parsed);
            if (content) {
              yield content;
            }
          } catch {
            // Ignore parse errors for malformed chunks
          }
        }
      }
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Generate complete response from Gemini API.
   */
  async generateResponse(prompt: string, context: FileContext[]): Promise<string> {
    try {
      const contents = this.buildContents(prompt, context);

      const response = await this.axiosInstance.post(
        `/models/${this.currentModel}:generateContent?key=${this.apiKey}`,
        {
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }
      );

      const content = this.extractContent(response.data);
      if (!content) {
        throw new Error('No content in response');
      }

      return content;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Build contents array for Gemini API.
   */
  private buildContents(
    prompt: string,
    context: FileContext[]
  ): Array<{
    role: string;
    parts: Array<{
      text: string;
    }>;
  }> {
    const contents: Array<{
      role: string;
      parts: Array<{ text: string }>;
    }> = [];

    // System prompt with code change format instructions
    const systemPrompt = `You are a coding assistant. When proposing code changes, use this format:

\`\`\`typescript:filename:path/to/file.ts
// Your code changes here
\`\`\`

For multiple files, use separate code blocks. Always include the file path after the language identifier.

${context.length > 0 ? `Here is the codebase context:\n\n${context.map((file) => `File: ${file.path}\n${file.content}`).join('\n\n')}` : ''}`;

    // Add system prompt as user message (Gemini doesn't support system role)
    contents.push({
      role: 'user',
      parts: [
        {
          text: systemPrompt,
        },
      ],
    });

    // Add user prompt
    contents.push({
      role: 'user',
      parts: [
        {
          text: prompt,
        },
      ],
    });

    return contents;
  }

  /**
   * Extract content from Gemini response.
   */
  private extractContent(data: unknown): string | null {
    try {
      if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if (obj.candidates && Array.isArray(obj.candidates) && obj.candidates.length > 0) {
          const candidate = obj.candidates[0] as Record<string, unknown>;
          if (candidate.content && typeof candidate.content === 'object') {
            const content = candidate.content as Record<string, unknown>;
            if (content.parts && Array.isArray(content.parts) && content.parts.length > 0) {
              const part = content.parts[0] as Record<string, unknown>;
              if (part.text && typeof part.text === 'string') {
                return part.text;
              }
            }
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Handle axios errors and convert to application errors.
   */
  private handleError(error: AxiosError): Error {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return new ConnectionError(
        `Failed to connect to Gemini API at ${this.baseUrl}`,
        'gemini',
        error
      );
    }

    if (error.response?.status === 401) {
      return new ValidationError(
        'Invalid API key. Please check your GEMINI_API_KEY.',
        'apiKey',
        error
      );
    }

    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after']
        ? parseInt(error.response.headers['retry-after'], 10)
        : undefined;
      const errorData = error.response.data as { error?: { message?: string } };
      return new RateLimitError(
        errorData?.error?.message ?? 'Rate limit exceeded',
        retryAfter,
        error
      );
    }

    if (error.response?.status === 404) {
      return new ValidationError(
        `Model "${this.currentModel}" not found or not available.`,
        'model',
        error
      );
    }

    const errorData = error.response?.data as { error?: { message?: string } };
    return new ConnectionError(
      errorData?.error?.message ?? error.message ?? 'Unknown error occurred',
      'gemini',
      error
    );
  }
}
