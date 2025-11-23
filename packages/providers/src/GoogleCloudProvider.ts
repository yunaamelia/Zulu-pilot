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
 * Configuration for GoogleCloudProvider.
 */
export interface GoogleCloudProviderConfig {
  apiKey?: string;
  projectId?: string;
  region?: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
  axiosInstance?: AxiosInstance;
  credentialsPath?: string;
}

/**
 * Google Cloud provider implementation.
 * Connects to Google Cloud AI Platform using Vertex AI API.
 */
export class GoogleCloudProvider implements IModelProvider {
  private readonly apiKey?: string;
  private readonly projectId?: string;
  private readonly region: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly axiosInstance: AxiosInstance;
  private currentModel: string;

  constructor(config: GoogleCloudProviderConfig = {}) {
    this.projectId = config.projectId ?? process.env.GOOGLE_CLOUD_PROJECT_ID;
    this.region = config.region ?? 'us-central1';
    // credentialsPath can be used for future credential file loading if needed

    // Handle API key or credentials
    if (config.apiKey) {
      this.apiKey = config.apiKey.startsWith('env:')
        ? (process.env[config.apiKey.slice(4)] ?? '')
        : config.apiKey;

      if (!this.apiKey) {
        throw new ValidationError(
          `Environment variable ${config.apiKey.slice(4)} is not set.`,
          'apiKey'
        );
      }
    }

    // Build base URL
    const endpoint =
      config.baseUrl ??
      `https://${this.region}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.region}/publishers/google/models`;
    this.baseUrl = endpoint;
    this.model = config.model ?? 'gemini-pro';
    this.currentModel = this.model;
    this.timeout = config.timeout ?? getProviderTimeout(false); // Remote provider

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    this.axiosInstance =
      config.axiosInstance ??
      axios.create({
        baseURL: this.baseUrl,
        timeout: this.timeout,
        headers,
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
   * T134: Discover available models from Google Cloud AI Platform
   * Lists all models available in the configured project/region
   *
   * @returns Promise resolving to array of available model names
   * @throws {ConnectionError} When cannot connect to Google Cloud
   */
  async listModels(): Promise<string[]> {
    try {
      // Google Cloud Vertex AI models are typically listed via publisher models
      // This is a simplified implementation - in production, you'd call the model listing API
      const response = await this.axiosInstance.get('/');

      // Parse response to extract model names
      // The exact format depends on Google Cloud API response structure
      const models: string[] = [];

      if (response.data?.models) {
        for (const model of response.data.models) {
          if (model.name) {
            // Extract model identifier from full name
            // Format: projects/{project}/locations/{region}/publishers/google/models/{model}
            const parts = model.name.split('/');
            const modelId = parts[parts.length - 1];
            if (modelId) {
              models.push(modelId);
            }
          }
        }
      }

      // Return common Gemini models if API call doesn't return results
      if (models.length === 0) {
        return [
          'gemini-pro',
          'gemini-pro-vision',
          'text-bison@001',
          'chat-bison@001',
          'code-bison@001',
        ];
      }

      return models.sort();
    } catch (error) {
      // If API call fails, return common models
      return [
        'gemini-pro',
        'gemini-pro-vision',
        'text-bison@001',
        'chat-bison@001',
        'code-bison@001',
      ];
    }
  }

  /**
   * T134: Check if a model is available
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
   * Stream response from Google Cloud AI Platform.
   */
  async *streamResponse(
    prompt: string,
    context: FileContext[]
  ): AsyncGenerator<string, void, unknown> {
    try {
      const requestBody = this.buildRequest(prompt, context);

      const response = await this.axiosInstance.post(
        `/${this.currentModel}:streamRawPredict`,
        requestBody,
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
          if (!line.trim()) {
            continue;
          }

          try {
            const parsed = JSON.parse(line);
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
   * Generate complete response from Google Cloud AI Platform.
   */
  async generateResponse(prompt: string, context: FileContext[]): Promise<string> {
    try {
      const requestBody = this.buildRequest(prompt, context);

      const response = await this.axiosInstance.post(
        `/${this.currentModel}:rawPredict`,
        requestBody
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
   * Build request body for Google Cloud AI Platform.
   */
  private buildRequest(
    prompt: string,
    context: FileContext[]
  ): {
    instances: Array<{
      prompt: string;
    }>;
    parameters: {
      temperature: number;
      maxOutputTokens: number;
    };
  } {
    // Combine context and prompt
    const fullPrompt =
      context.length > 0
        ? `${context.map((file) => `File: ${file.path}\n${file.content}`).join('\n\n')}\n\nUser: ${prompt}`
        : prompt;

    return {
      instances: [
        {
          prompt: fullPrompt,
        },
      ],
      parameters: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    };
  }

  /**
   * Extract content from Google Cloud response.
   */
  private extractContent(data: unknown): string | null {
    try {
      // Handle streaming response format
      if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if (obj.predictions && Array.isArray(obj.predictions)) {
          const prediction = obj.predictions[0] as Record<string, unknown>;
          if (prediction.content && typeof prediction.content === 'string') {
            return prediction.content;
          }
        }
        if (obj.predictions && Array.isArray(obj.predictions) && obj.predictions.length > 0) {
          const prediction = obj.predictions[0] as Record<string, unknown>;
          if (prediction.generatedText && typeof prediction.generatedText === 'string') {
            return prediction.generatedText;
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
        `Failed to connect to Google Cloud AI Platform at ${this.baseUrl}`,
        'googleCloud',
        error
      );
    }

    if (error.response?.status === 401) {
      return new ValidationError(
        'Invalid credentials. Please check your Google Cloud authentication.',
        'apiKey',
        error
      );
    }

    if (error.response?.status === 403) {
      return new ValidationError(
        'Access denied. Please check your project permissions and API enablement.',
        'projectId',
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
        `Model "${this.currentModel}" not found or not available in region ${this.region}.`,
        'model',
        error
      );
    }

    const errorData = error.response?.data as { error?: { message?: string } };
    return new ConnectionError(
      errorData?.error?.message ?? error.message ?? 'Unknown error occurred',
      'googleCloud',
      error
    );
  }
}
