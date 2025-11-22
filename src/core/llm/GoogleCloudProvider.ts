import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { IModelProvider } from './IModelProvider.js';
import type { FileContext } from '../context/FileContext.js';
import { ConnectionError, RateLimitError } from '../../utils/errors.js';

const execAsync = promisify(exec);

/**
 * Model configuration mapping for Google Cloud AI Platform models.
 */
interface ModelConfig {
  endpoint: 'v1beta1' | 'v1';
  maxTokens: number;
  temperature: number;
  topP: number;
}

/**
 * Model configuration presets.
 */
const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'deepseek-ai/deepseek-v3.1-maas': {
    endpoint: 'v1beta1',
    maxTokens: 32768,
    temperature: 0.4,
    topP: 0.95,
  },
  'qwen/qwen3-coder-480b-a35b-instruct-maas': {
    endpoint: 'v1beta1',
    maxTokens: 32768,
    temperature: 0.4,
    topP: 0.8,
  },
  'deepseek-ai/deepseek-r1-0528-maas': {
    endpoint: 'v1beta1',
    maxTokens: 32768,
    temperature: 0.4,
    topP: 0.95,
  },
  'moonshotai/kimi-k2-thinking-maas': {
    endpoint: 'v1',
    maxTokens: 32768,
    temperature: 0.4,
    topP: 0.95,
  },
  'openai/gpt-oss-120b-maas': {
    endpoint: 'v1beta1',
    maxTokens: 8192,
    temperature: 0.4,
    topP: 0.95,
  },
  'meta/llama-3.1-405b-instruct-maas': {
    endpoint: 'v1beta1',
    maxTokens: 32768,
    temperature: 0.4,
    topP: 0.95,
  },
};

/**
 * Configuration for GoogleCloudProvider.
 */
export interface GoogleCloudProviderConfig {
  projectId: string;
  region: string;
  model: string;
  endpoint?: 'v1beta1' | 'v1';
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  getAccessToken?: () => Promise<string>;
  axiosInstance?: AxiosInstance;
}

/**
 * Google Cloud AI Platform provider implementation.
 * Supports various models via OpenAI-compatible endpoints.
 */
export class GoogleCloudProvider implements IModelProvider {
  private readonly projectId: string;
  private readonly region: string;
  private readonly model: string;
  private readonly endpoint: 'v1beta1' | 'v1';
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly topP: number;
  private readonly getAccessToken: () => Promise<string>;
  private readonly axiosInstance: AxiosInstance;

  constructor(config: GoogleCloudProviderConfig) {
    this.projectId = config.projectId;
    this.region = config.region;
    this.model = config.model;

    // Get model-specific config or use provided/ defaults
    const modelConfig = MODEL_CONFIGS[config.model] ?? {
      endpoint: 'v1beta1' as const,
      maxTokens: 32768,
      temperature: 0.4,
      topP: 0.95,
    };

    this.endpoint = config.endpoint ?? modelConfig.endpoint;
    this.maxTokens = config.maxTokens ?? modelConfig.maxTokens;
    this.temperature = config.temperature ?? modelConfig.temperature;
    this.topP = config.topP ?? modelConfig.topP;

    this.getAccessToken =
      config.getAccessToken ??
      (async (): Promise<string> => {
        // Default: use gcloud auth print-access-token
        try {
          const { stdout } = await execAsync('gcloud auth print-access-token');
          return stdout.trim();
        } catch (error) {
          throw new ConnectionError(
            `Failed to get access token: ${error instanceof Error ? error.message : String(error)}. Please run 'gcloud auth login' first.`,
            'googleCloud'
          );
        }
      });

    // Build base URL based on endpoint version
    const baseURL = `https://aiplatform.googleapis.com/${this.endpoint}/projects/${this.projectId}/locations/${this.region}/endpoints/openapi`;

    this.axiosInstance =
      config.axiosInstance ??
      axios.create({
        baseURL,
      });
  }

  /**
   * Stream response from Google Cloud AI Platform.
   */
  async *streamResponse(
    prompt: string,
    context: FileContext[]
  ): AsyncGenerator<string, void, unknown> {
    const url = '/chat/completions';
    const requestBody = this.buildRequest(prompt, context, true);

    try {
      const token = await this.getAccessToken();
      const response = await this.axiosInstance.post(url, requestBody, {
        responseType: 'stream',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let buffer = '';
      for await (const chunk of response.data) {
        buffer += chunk.toString();
        const result = this.parseStreamBuffer(buffer);
        buffer = result.remainingBuffer;
        for (const token of result.tokens) {
          yield token;
        }
        if (result.done) {
          return;
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate complete response from Google Cloud AI Platform.
   */
  async generateResponse(prompt: string, context: FileContext[]): Promise<string> {
    const url = '/chat/completions';
    const requestBody = this.buildRequest(prompt, context, false);

    try {
      const token = await this.getAccessToken();
      const response = await this.axiosInstance.post(url, requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const choices = response.data.choices;
      if (!choices || choices.length === 0) {
        throw new ConnectionError('No response from Google Cloud AI Platform', 'googleCloud');
      }

      const content = choices[0].message?.content;
      if (!content) {
        throw new ConnectionError('Empty response from Google Cloud AI Platform', 'googleCloud');
      }

      return content;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Build OpenAI-compatible API request body.
   */
  private buildRequest(prompt: string, context: FileContext[], stream: boolean): unknown {
    const messages: Array<{ role: string; content: string | unknown[] }> = [];

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
    // For Kimi K2, content should be a string, not an array
    messages.push({
      role: 'user',
      content: prompt,
    });

    return {
      model: this.model,
      messages,
      stream,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      top_p: this.topP,
    };
  }

  /**
   * Parse stream buffer and extract tokens.
   */
  private parseStreamBuffer(buffer: string): {
    tokens: string[];
    remainingBuffer: string;
    done: boolean;
  } {
    const lines = buffer.split('\n');
    const remainingBuffer = lines.pop() ?? '';
    const tokens: string[] = [];
    let done = false;

    for (const line of lines) {
      if (line.trim() === '' || !line.startsWith('data: ')) {
        continue;
      }

      const data = line.slice(6).trim();
      if (data === '[DONE]') {
        done = true;
        return { tokens, remainingBuffer: '', done };
      }

      const content = this.extractContentFromData(data);
      if (content) {
        tokens.push(content);
      }
    }

    return { tokens, remainingBuffer, done };
  }

  /**
   * Extract content from SSE data line.
   */
  private extractContentFromData(data: string): string | null {
    try {
      const parsed = JSON.parse(data);
      return parsed.choices?.[0]?.delta?.content ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Handle errors from Google Cloud AI Platform API.
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      return this.handleAxiosError(error);
    }
    if (error instanceof ConnectionError || error instanceof RateLimitError) {
      return error;
    }
    return new ConnectionError(
      `Failed to connect to Google Cloud AI Platform: ${error instanceof Error ? error.message : String(error)}`,
      'googleCloud'
    );
  }

  /**
   * Handle Axios errors.
   */
  private handleAxiosError(error: AxiosError): Error {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      return new ConnectionError('Invalid credentials or authentication failed', 'googleCloud');
    }
    if (status === 429) {
      const retryAfterHeader =
        error.response?.headers['retry-after'] || error.response?.headers['Retry-After'];
      const retryAfter = retryAfterHeader ? parseInt(String(retryAfterHeader), 10) : undefined;
      return new RateLimitError('Rate limit exceeded', retryAfter);
    }
    if (status === 404) {
      return new ConnectionError('Model or endpoint not found', 'googleCloud');
    }
    return new ConnectionError(
      `Google Cloud AI Platform error: ${status} ${error.response?.statusText ?? 'Unknown error'}`,
      'googleCloud'
    );
  }
}
