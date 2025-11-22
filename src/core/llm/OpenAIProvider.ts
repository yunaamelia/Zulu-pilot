import axios, { type AxiosInstance } from 'axios';
import type { IModelProvider } from './IModelProvider.js';
import type { FileContext } from '../context/FileContext.js';
import { ConnectionError, RateLimitError } from '../../utils/errors.js';

/**
 * Configuration for OpenAIProvider.
 */
export interface OpenAIProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  axiosInstance?: AxiosInstance;
}

/**
 * OpenAI-compatible API provider implementation.
 * Supports OpenAI, DeepSeek, Groq, and Google Cloud AI Platform.
 */
export class OpenAIProvider implements IModelProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly axiosInstance: AxiosInstance;

  constructor(config: OpenAIProviderConfig) {
    this.apiKey = config.apiKey;
    // Normalize baseUrl (remove trailing slash)
    this.baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
    this.model = config.model;
    this.axiosInstance = config.axiosInstance ?? axios.create({ baseURL: this.baseUrl });
  }

  /**
   * Stream response from OpenAI-compatible API.
   */
  async *streamResponse(
    prompt: string,
    context: FileContext[]
  ): AsyncGenerator<string, void, unknown> {
    const url = '/chat/completions';
    const requestBody = this.buildRequest(prompt, context, true);

    try {
      const response = await this.axiosInstance.post(url, requestBody, {
        responseType: 'stream',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      let buffer = '';
      for await (const chunk of response.data) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.trim() === '' || !line.startsWith('data: ')) {
            continue;
          }

          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new ConnectionError('Invalid API key or authentication failed', 'openai');
        }
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          throw new RateLimitError(
            'Rate limit exceeded',
            retryAfter ? parseInt(String(retryAfter), 10) : undefined
          );
        }
        if (error.response?.status === 404) {
          throw new ConnectionError('Model not found', 'openai');
        }
        throw new ConnectionError(
          `API error: ${error.response?.status} ${error.response?.statusText}`,
          'openai'
        );
      }
      if (error instanceof ConnectionError || error instanceof RateLimitError) {
        throw error;
      }
      throw new ConnectionError(
        `Failed to connect to API: ${error instanceof Error ? error.message : String(error)}`,
        'openai'
      );
    }
  }

  /**
   * Generate complete response from OpenAI-compatible API.
   */
  async generateResponse(prompt: string, context: FileContext[]): Promise<string> {
    const url = '/chat/completions';
    const requestBody = this.buildRequest(prompt, context, false);

    try {
      const response = await this.axiosInstance.post(url, requestBody, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const choices = response.data.choices;
      if (!choices || choices.length === 0) {
        throw new ConnectionError('No response from API', 'openai');
      }

      const content = choices[0].message?.content;
      if (!content) {
        throw new ConnectionError('Empty response from API', 'openai');
      }

      return content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new ConnectionError('Invalid API key or authentication failed', 'openai');
        }
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          throw new RateLimitError(
            'Rate limit exceeded',
            retryAfter ? parseInt(String(retryAfter), 10) : undefined
          );
        }
        if (error.response?.status === 404) {
          throw new ConnectionError('Model not found', 'openai');
        }
        throw new ConnectionError(
          `API error: ${error.response?.status} ${error.response?.statusText}`,
          'openai'
        );
      }
      if (error instanceof ConnectionError || error instanceof RateLimitError) {
        throw error;
      }
      throw new ConnectionError(
        `Failed to connect to API: ${error instanceof Error ? error.message : String(error)}`,
        'openai'
      );
    }
  }

  /**
   * Build OpenAI-compatible API request body.
   */
  private buildRequest(prompt: string, context: FileContext[], stream: boolean): unknown {
    const messages: Array<{ role: string; content: string }> = [];

    // System prompt with code change format instructions
    const systemPrompt = `You are a coding assistant. When proposing code changes, use this format:

\`\`\`typescript:filename:path/to/file.ts
// Your code changes here
\`\`\`

For multiple files, use separate code blocks. Always include the file path after the language identifier.

${context.length > 0 ? `Here is the codebase context:\n\n${context.map((file) => `File: ${file.path}\n${file.content}`).join('\n\n')}` : ''}`;

    messages.push({
      role: 'system',
      content: systemPrompt,
    });

    // Add user prompt
    messages.push({
      role: 'user',
      content: prompt,
    });

    return {
      model: this.model,
      messages,
      stream,
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 0.95,
    };
  }
}
