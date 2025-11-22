import axios, { AxiosInstance, AxiosError } from 'axios';
import type { IModelProvider } from './IModelProvider.js';
import type { FileContext } from '../context/FileContext.js';
import { ConnectionError, RateLimitError, getProviderTimeout } from '../../utils/errors.js';

/**
 * Configuration for OllamaProvider.
 */
export interface OllamaProviderConfig {
  baseUrl?: string;
  model?: string;
  timeout?: number;
  axiosInstance?: AxiosInstance;
}

/**
 * Ollama provider implementation.
 * Connects to local Ollama instance using OpenAI-compatible API.
 */
export class OllamaProvider implements IModelProvider {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly axiosInstance: AxiosInstance;

  constructor(config: OllamaProviderConfig = {}) {
    this.baseUrl = config.baseUrl ?? 'http://localhost:11434';
    this.model = config.model ?? 'qwen2.5-coder';
    this.timeout = config.timeout ?? getProviderTimeout(true); // Local provider

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
   * Get the configured model name.
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Stream response from Ollama.
   */
  async *streamResponse(
    prompt: string,
    context: FileContext[]
  ): AsyncGenerator<string, void, unknown> {
    try {
      const messages = this.buildMessages(prompt, context);

      const response = await this.axiosInstance.post(
        '/v1/chat/completions',
        {
          model: this.model,
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 4096,
        },
        {
          responseType: 'stream',
        }
      );

      // Parse Server-Sent Events stream
      const stream = response.data;
      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
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
              // Ignore parse errors for malformed chunks
            }
          }
        }
      }
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Generate complete response from Ollama.
   */
  async generateResponse(prompt: string, context: FileContext[]): Promise<string> {
    try {
      const messages = this.buildMessages(prompt, context);

      const response = await this.axiosInstance.post('/v1/chat/completions', {
        model: this.model,
        messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 4096,
      });

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response');
      }

      return content;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Build messages array from prompt and context.
   */
  private buildMessages(
    prompt: string,
    context: FileContext[]
  ): Array<{
    role: string;
    content: string;
  }> {
    const messages: Array<{ role: string; content: string }> = [];

    // Add context files as system message if present
    if (context.length > 0) {
      const contextText = context.map((file) => `File: ${file.path}\n${file.content}`).join('\n\n');
      messages.push({
        role: 'system',
        content: `You are a coding assistant. Here is the codebase context:\n\n${contextText}`,
      });
    }

    // Add user prompt
    messages.push({
      role: 'user',
      content: prompt,
    });

    return messages;
  }

  /**
   * Handle axios errors and convert to application errors.
   */
  private handleError(error: AxiosError): Error {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return new ConnectionError(`Failed to connect to Ollama at ${this.baseUrl}`, 'ollama', error);
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
      return new ConnectionError(
        `Model "${this.model}" not found. Please ensure the model is installed: ollama pull ${this.model}`,
        'ollama',
        error
      );
    }

    return new ConnectionError(error.message ?? 'Unknown error occurred', 'ollama', error);
  }
}
