import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { IModelProvider } from './IModelProvider.js';
import type { FileContext } from '../context/FileContext.js';
import { ConnectionError, RateLimitError } from '../../utils/errors.js';
import { GoogleCloudAuth, type GoogleCloudAuthOptions } from '../auth/GoogleCloudAuth.js';

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
    endpoint: 'v1', // Updated: uses v1 endpoint with region-specific URL
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
    endpoint: 'v1', // Updated: uses v1 endpoint with region-specific URL (us-central1-aiplatform.googleapis.com)
    maxTokens: 32138, // Updated per user config
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
    endpoint: 'v1', // Updated: uses v1 endpoint with global region
    maxTokens: 8192,
    temperature: 0.4,
    topP: 0.95,
  },
  'meta/llama-3.1-405b-instruct-maas': {
    endpoint: 'v1beta1',
    maxTokens: 4096, // Updated per vertex-config.md
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
  /**
   * Custom function to get access token.
   * If not provided, will use GoogleCloudAuth with credentialsPath or default to gcloud CLI.
   */
  getAccessToken?: () => Promise<string>;
  /**
   * Path to service account credentials JSON file.
   * If provided, will be used instead of gcloud CLI.
   * Example: './request.json' or absolute path.
   */
  credentialsPath?: string;
  /**
   * Service account credentials object.
   * If provided, will be used directly instead of reading from file.
   */
  credentials?: GoogleCloudAuthOptions['credentials'];
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

    // Setup authentication
    if (config.getAccessToken) {
      // Use custom getAccessToken function if provided
      this.getAccessToken = config.getAccessToken;
    } else if (config.credentialsPath || config.credentials) {
      // Use service account credentials from file or object
      const auth = new GoogleCloudAuth({
        credentialsPath: config.credentialsPath,
        credentials: config.credentials,
      });
      this.getAccessToken = async (): Promise<string> => {
        try {
          return await auth.getAccessToken();
        } catch (error) {
          throw new ConnectionError(
            `Failed to authenticate with service account: ${error instanceof Error ? error.message : String(error)}`,
            'googleCloud'
          );
        }
      };
    } else {
      // Default: use gcloud auth print-access-token
      this.getAccessToken = async (): Promise<string> => {
        try {
          const { stdout } = await execAsync('gcloud auth print-access-token');
          return stdout.trim();
        } catch (error) {
          throw new ConnectionError(
            `Failed to get access token: ${error instanceof Error ? error.message : String(error)}. ` +
              `Please run 'gcloud auth login' first, or provide credentialsPath/credentials in config.`,
            'googleCloud'
          );
        }
      };
    }

    // Build base URL based on endpoint version
    // Format per vertex-config.md:
    // Build base URL with support for region-specific endpoints
    // For some models (e.g., DeepSeek V3.1), use region-specific endpoint:
    // https://{REGION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{REGION}/endpoints/openapi
    // For others, use global endpoint:
    // https://aiplatform.googleapis.com/{endpoint}/projects/{PROJECT_ID}/locations/{REGION}/endpoints/openapi

    // Check if this model uses region-specific endpoint
    const useRegionSpecificEndpoint =
      this.model === 'deepseek-ai/deepseek-v3.1-maas' ||
      this.model === 'deepseek-ai/deepseek-r1-0528-maas' ||
      this.model === 'intfloat/multilingual-e5-large-instruct-maas';

    const baseURL = useRegionSpecificEndpoint
      ? `https://${this.region}-aiplatform.googleapis.com/${this.endpoint}/projects/${this.projectId}/locations/${this.region}/endpoints/openapi`
      : `https://aiplatform.googleapis.com/${this.endpoint}/projects/${this.projectId}/locations/${this.region}/endpoints/openapi`;

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

      // Log request details in debug mode
      if (process.env.DEBUG || process.env.ZULU_PILOT_DEBUG) {
        console.error(`[DEBUG] Request URL: ${this.axiosInstance.defaults.baseURL}${url}`);
        console.error(
          `[DEBUG] Model: ${this.model}, Region: ${this.region}, Endpoint: ${this.endpoint}`
        );
      }

      const response = await this.axiosInstance.post(url, requestBody, {
        responseType: 'stream',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let buffer = '';
      let hasData = false;
      let firstChunk = true;

      try {
        for await (const chunk of response.data) {
          const chunkStr = chunk.toString();
          hasData = true;

          // On first chunk, check for immediate errors
          if (firstChunk) {
            firstChunk = false;
            // Check for common error patterns in first chunk
            if (
              chunkStr.includes('"error"') ||
              chunkStr.includes('"code"') ||
              chunkStr.includes('404') ||
              chunkStr.includes('not found')
            ) {
              // Try to extract error message
              try {
                const errorMatch = chunkStr.match(/data:\s*({[^}]*"error"[^}]*})/);
                if (errorMatch) {
                  const errorData = JSON.parse(errorMatch[1]);
                  throw new ConnectionError(
                    `API Error: ${errorData.error?.message || errorData.message || 'Model or endpoint not found'}`,
                    'googleCloud'
                  );
                }
              } catch {
                // If parsing fails, check for common error strings
                if (chunkStr.includes('404') || chunkStr.includes('not found')) {
                  throw new ConnectionError(
                    `Model or endpoint not found. Please verify:\n` +
                      `1. Model "${this.model}" is available in region "${this.region}"\n` +
                      `2. Endpoint "${this.endpoint}" is correct for this model\n` +
                      `3. API aiplatform.googleapis.com is enabled\n` +
                      `4. You have access to this model in project "${this.projectId}"`,
                    'googleCloud'
                  );
                }
              }
            }
          }

          buffer += chunkStr;

          const result = this.parseStreamBuffer(buffer);
          buffer = result.remainingBuffer;
          for (const token of result.tokens) {
            yield token;
          }
          if (result.done) {
            return;
          }
        }

        // If we got response but no valid data, might be an error
        if (!hasData || buffer.length === 0) {
          throw new ConnectionError(
            `No response data received. Model "${this.model}" may not be available in region "${this.region}"`,
            'googleCloud'
          );
        }
      } catch (streamError) {
        // If it's already a ConnectionError, re-throw
        if (streamError instanceof ConnectionError) {
          throw streamError;
        }
        // Otherwise, wrap in handleError
        throw this.handleError(streamError);
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
   * Supports different content formats based on model requirements.
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
    // All models now use content as string (not array)
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
    const responseData = error.response?.data;

    // Try to extract more detailed error message
    let errorMessage = 'Unknown error';
    if (responseData) {
      try {
        // Handle stream response data (might be a stream object)
        if (
          typeof responseData === 'object' &&
          responseData !== null &&
          !Array.isArray(responseData)
        ) {
          // If it's a stream object, try to get readable error info
          if ('readable' in responseData || '_readableState' in responseData) {
            errorMessage = 'Stream error - model or endpoint may not be available';
          } else {
            const errorObj = responseData as Record<string, unknown>;
            errorMessage =
              (errorObj.error as { message?: string })?.message ||
              (errorObj.message as string) ||
              JSON.stringify(errorObj).substring(0, 200);
          }
        } else if (typeof responseData === 'string') {
          try {
            const errorObj = JSON.parse(responseData);
            errorMessage =
              errorObj.error?.message || errorObj.message || responseData.substring(0, 200);
          } catch {
            errorMessage = responseData.substring(0, 200);
          }
        } else {
          errorMessage = String(responseData).substring(0, 200);
        }
      } catch {
        errorMessage = String(responseData).substring(0, 200);
      }
    }

    if (status === 401 || status === 403) {
      return new ConnectionError(
        `Invalid credentials or authentication failed: ${errorMessage}`,
        'googleCloud'
      );
    }
    if (status === 429) {
      const retryAfterHeader =
        error.response?.headers['retry-after'] || error.response?.headers['Retry-After'];
      const retryAfter = retryAfterHeader ? parseInt(String(retryAfterHeader), 10) : undefined;
      return new RateLimitError('Rate limit exceeded', retryAfter);
    }
    if (status === 404) {
      return new ConnectionError(
        `Model or endpoint not found. Details: ${errorMessage}. Please verify:\n` +
          `1. Model "${this.model}" is available in region "${this.region}"\n` +
          `2. Endpoint "${this.endpoint}" is correct for this model\n` +
          `3. API aiplatform.googleapis.com is enabled\n` +
          `4. You have access to this model in project "${this.projectId}"`,
        'googleCloud'
      );
    }
    return new ConnectionError(
      `Google Cloud AI Platform error (${status}): ${errorMessage}`,
      'googleCloud'
    );
  }
}
