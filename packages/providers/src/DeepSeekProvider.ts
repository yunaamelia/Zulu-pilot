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
 * Configuration for DeepSeekProvider.
 */
export interface DeepSeekProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
  axiosInstance?: AxiosInstance;
}

/**
 * T209: DeepSeek provider implementation.
 * Connects to DeepSeek API using OpenAI-compatible chat completions endpoint.
 */
export class DeepSeekProvider implements IModelProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly axiosInstance: AxiosInstance;
  private currentModel: string;

  constructor(config: DeepSeekProviderConfig = {}) {
    this.apiKey = config.apiKey ?? process.env.DEEPSEEK_API_KEY ?? '';
    if (!this.apiKey) {
      throw new ValidationError(
        'DeepSeek API key is required. Set DEEPSEEK_API_KEY environment variable or provide in config.',
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

    this.baseUrl = config.baseUrl ?? 'https://api.deepseek.com/v1';
    this.model = config.model ?? 'deepseek-chat';
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
   * List available models from DeepSeek API.
   *
   * @returns Promise resolving to array of available model names
   * @throws {ConnectionError} When cannot connect to DeepSeek API
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await this.axiosInstance.get('/models');
      const models = response.data?.data ?? [];
      return models.map((model: { id: string }) => model.id).filter(Boolean);
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
   * Stream response from DeepSeek.
   */
  async *streamResponse(
    prompt: string,
    context: FileContext[]
  ): AsyncGenerator<string, void, unknown> {
    try {
      const messages = this.buildMessages(prompt, context);

      const response = await this.axiosInstance.post(
        '/chat/completions',
        {
          model: this.currentModel,
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 4096,
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
              const content = parsed.choices?.[0]?.delta?.content;
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
   * Generate complete response from DeepSeek.
   */
  async generateResponse(prompt: string, context: FileContext[]): Promise<string> {
    try {
      const messages = this.buildMessages(prompt, context);

      const response = await this.axiosInstance.post('/chat/completions', {
        model: this.currentModel,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      });

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in response from DeepSeek');
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
        `Cannot connect to DeepSeek API: ${error.message}`,
        'deepseek'
      );
    }

    const status = error.response.status;
    const data = error.response.data as { error?: { message?: string; type?: string } };

    if (status === 429) {
      return new RateLimitError(
        `DeepSeek API rate limit exceeded: ${data?.error?.message ?? 'Too many requests'}`
      );
    }

    if (status === 401) {
      return new ValidationError(
        `DeepSeek API authentication failed: ${data?.error?.message ?? 'Invalid API key'}`,
        'apiKey'
      );
    }

    return new ConnectionError(
      `DeepSeek API error (${status}): ${data?.error?.message ?? error.message}`,
      'deepseek'
    );
  }
}

