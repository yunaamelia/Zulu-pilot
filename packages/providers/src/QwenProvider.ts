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
 * Configuration for QwenProvider.
 */
export interface QwenProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
  axiosInstance?: AxiosInstance;
}

/**
 * T210: Qwen provider implementation.
 * Connects to Qwen (Alibaba Cloud) API using OpenAI-compatible chat completions endpoint.
 */
export class QwenProvider implements IModelProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly axiosInstance: AxiosInstance;
  private currentModel: string;

  constructor(config: QwenProviderConfig = {}) {
    this.apiKey = config.apiKey ?? process.env.QWEN_API_KEY ?? '';
    if (!this.apiKey) {
      throw new ValidationError(
        'Qwen API key is required. Set QWEN_API_KEY environment variable or provide in config.',
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

    this.baseUrl = config.baseUrl ?? 'https://dashscope.aliyuncs.com/api/v1';
    this.model = config.model ?? 'qwen-turbo';
    this.currentModel = this.model;
    this.timeout = config.timeout ?? getProviderTimeout(false); // Remote provider

    this.axiosInstance =
      config.axiosInstance ??
      axios.create({
        baseURL: this.baseUrl,
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-DashScope-SSE': 'enable', // Enable SSE for streaming
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
   * List available models from Qwen API.
   *
   * @returns Promise resolving to array of available model names
   * @throws {ConnectionError} When cannot connect to Qwen API
   */
  async listModels(): Promise<string[]> {
    try {
      // Qwen API may not have a models endpoint, return common models
      return [
        'qwen-turbo',
        'qwen-plus',
        'qwen-max',
        'qwen-max-longcontext',
      ];
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Check if a model is available.
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
   * Stream response from Qwen.
   */
  async *streamResponse(
    prompt: string,
    context: FileContext[]
  ): AsyncGenerator<string, void, unknown> {
    try {
      const messages = this.buildMessages(prompt, context);

      const response = await this.axiosInstance.post(
        '/services/aigc/text-generation/generation',
        {
          model: this.currentModel,
          input: {
            messages,
          },
          parameters: {
            temperature: 0.7,
            max_tokens: 4096,
            incremental_output: true, // Enable streaming
          },
        },
        {
          responseType: 'stream',
        }
      );

      // Parse SSE stream
      const stream = response.data;
      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.startsWith(':')) {
            continue;
          }

          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.output?.choices?.[0]?.message?.content;
              if (content) {
                yield content;
              }
            } catch {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Generate complete response from Qwen.
   */
  async generateResponse(prompt: string, context: FileContext[]): Promise<string> {
    try {
      const messages = this.buildMessages(prompt, context);

      const response = await this.axiosInstance.post(
        '/services/aigc/text-generation/generation',
        {
          model: this.currentModel,
          input: {
            messages,
          },
          parameters: {
            temperature: 0.7,
            max_tokens: 4096,
          },
        }
      );

      const content = response.data?.output?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response from Qwen');
      }

      return content;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Build messages array from prompt and context.
   */
  private buildMessages(prompt: string, context: FileContext[]): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    // Add context files as system messages
    if (context.length > 0) {
      const contextContent = context
        .map((file) => `--- File: ${file.path} ---\n${file.content}\n--- End of ${file.path} ---`)
        .join('\n\n');
      messages.push({
        role: 'system',
        content: `You have access to the following files:\n\n${contextContent}`,
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
   * Handle API errors and convert to appropriate error types.
   */
  private handleError(error: AxiosError): Error {
    if (!error.response) {
      return new ConnectionError(
        `Cannot connect to Qwen API: ${error.message}`,
        'qwen'
      );
    }

    const status = error.response.status;
    const data = error.response.data as { error?: { message?: string; code?: string } };

    if (status === 429) {
      return new RateLimitError(
        `Qwen API rate limit exceeded: ${data?.error?.message ?? 'Too many requests'}`
      );
    }

    if (status === 401 || status === 403) {
      return new ValidationError(
        `Qwen API authentication failed: ${data?.error?.message ?? 'Invalid API key'}`,
        'apiKey'
      );
    }

    return new ConnectionError(
      `Qwen API error (${status}): ${data?.error?.message ?? error.message}`,
      'qwen'
    );
  }
}

