import axios, { AxiosInstance, AxiosError } from 'axios';
import type { IModelProvider } from './IModelProvider.js';
import type { FileContext } from '@zulu-pilot/core';
import { ConnectionError, RateLimitError, getProviderTimeout } from './utils/errors.js';

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
   * T132: Discover available models from Ollama instance
   * Lists all models installed on the local Ollama instance
   *
   * @returns Promise resolving to array of available model names
   * @throws {ConnectionError} When cannot connect to Ollama
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await this.axiosInstance.get('/api/tags');

      const models = response.data?.models ?? [];
      return models.map((model: { name: string }) => model.name).filter(Boolean);
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * T132: Check if a model is available
   *
   * @param modelName - Model name to check
   * @returns Promise resolving to true if model is available
   */
  async hasModel(modelName: string): Promise<boolean> {
    try {
      const models = await this.listModels();
      return models.includes(modelName);
    } catch {
      return false;
    }
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
          if (!line.startsWith('data: ')) {
            continue;
          }

          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            return;
          }

          const parsedContent = this.parseStreamChunk(data);
          if (parsedContent) {
            yield parsedContent;
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
   * Parse a single stream chunk and extract content.
   *
   * @param data - Raw chunk data from stream
   * @returns Content string if found, null otherwise
   */
  private parseStreamChunk(data: string): string | null {
    try {
      const parsed = JSON.parse(data);
      const content = parsed.choices?.[0]?.delta?.content;
      return content ?? null;
    } catch {
      // Ignore parse errors for malformed chunks
      return null;
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
