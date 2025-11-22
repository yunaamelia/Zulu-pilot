import axios, { type AxiosInstance } from 'axios';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { IModelProvider } from './IModelProvider.js';
import type { FileContext } from '../context/FileContext.js';
import { ConnectionError, RateLimitError } from '../../utils/errors.js';

const execAsync = promisify(exec);

/**
 * Configuration for GoogleCloudProvider.
 */
export interface GoogleCloudProviderConfig {
  projectId: string;
  region: string;
  model: string;
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
  private readonly getAccessToken: () => Promise<string>;
  private readonly axiosInstance: AxiosInstance;

  constructor(config: GoogleCloudProviderConfig) {
    this.projectId = config.projectId;
    this.region = config.region;
    this.model = config.model;
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
    this.axiosInstance =
      config.axiosInstance ??
      axios.create({
        baseURL: `https://aiplatform.googleapis.com/v1beta1/projects/${this.projectId}/locations/${this.region}/endpoints/openapi`,
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
      temperature: 0.4,
      max_tokens: 32768,
      top_p: 0.95,
    };
  }

  /**
   * Handle errors from Google Cloud AI Platform API.
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return new ConnectionError('Invalid credentials or authentication failed', 'googleCloud');
      }
      if (error.response?.status === 429) {
        const retryAfterHeader =
          error.response.headers['retry-after'] || error.response.headers['Retry-After'];
        const retryAfter = retryAfterHeader ? parseInt(String(retryAfterHeader), 10) : undefined;
        return new RateLimitError('Rate limit exceeded', retryAfter);
      }
      if (error.response?.status === 404) {
        return new ConnectionError('Model or endpoint not found', 'googleCloud');
      }
      return new ConnectionError(
        `Google Cloud AI Platform error: ${error.response?.status} ${error.response?.statusText}`,
        'googleCloud'
      );
    }
    if (error instanceof ConnectionError || error instanceof RateLimitError) {
      return error;
    }
    return new ConnectionError(
      `Failed to connect to Google Cloud AI Platform: ${error instanceof Error ? error.message : String(error)}`,
      'googleCloud'
    );
  }
}
