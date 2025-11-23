/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

interface GaxiosError {
  response?: {
    data?: unknown;
  };
}

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  try {
    return String(error);
  } catch {
    return 'Failed to get error details';
  }
}

export class FatalError extends Error {
  constructor(
    message: string,
    readonly exitCode: number
  ) {
    super(message);
  }
}

export class FatalAuthenticationError extends FatalError {
  constructor(message: string) {
    super(message, 41);
  }
}
export class FatalInputError extends FatalError {
  constructor(message: string) {
    super(message, 42);
  }
}
export class FatalSandboxError extends FatalError {
  constructor(message: string) {
    super(message, 44);
  }
}
export class FatalConfigError extends FatalError {
  constructor(message: string) {
    super(message, 52);
  }
}
export class FatalTurnLimitedError extends FatalError {
  constructor(message: string) {
    super(message, 53);
  }
}
export class FatalToolExecutionError extends FatalError {
  constructor(message: string) {
    super(message, 54);
  }
}
export class FatalCancellationError extends FatalError {
  constructor(message: string) {
    super(message, 130); // Standard exit code for SIGINT
  }
}

export class CanceledError extends Error {
  constructor(message = 'The operation was canceled.') {
    super(message);
    this.name = 'CanceledError';
  }
}

export class ForbiddenError extends Error {}
export class UnauthorizedError extends Error {}
export class BadRequestError extends Error {}

interface ResponseData {
  error?: {
    code?: number;
    message?: string;
  };
}

export function toFriendlyError(error: unknown): unknown {
  if (error && typeof error === 'object' && 'response' in error) {
    const gaxiosError = error as GaxiosError;
    const data = parseResponseData(gaxiosError);
    if (data.error && data.error.message && data.error.code) {
      switch (data.error.code) {
        case 400:
          return new BadRequestError(data.error.message);
        case 401:
          return new UnauthorizedError(data.error.message);
        case 403:
          // It's import to pass the message here since it might
          // explain the cause like "the cloud project you're
          // using doesn't have code assist enabled".
          return new ForbiddenError(data.error.message);
        default:
      }
    }
  }
  return error;
}

function parseResponseData(error: GaxiosError): ResponseData {
  // Inexplicably, Gaxios sometimes doesn't JSONify the response data.
  if (typeof error.response?.data === 'string') {
    return JSON.parse(error.response?.data) as ResponseData;
  }
  return error.response?.data as ResponseData;
}

/**
 * Base error class for all application errors with user-friendly messages.
 * T117: Port error types from current Zulu Pilot
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Error thrown when connection to a model provider fails.
 * T118: Implement ConnectionError with user-friendly messages
 */
export class ConnectionError extends AppError {
  constructor(
    message: string,
    public readonly provider: string,
    cause?: Error
  ) {
    super(message, 'CONNECTION_ERROR', cause);
  }

  /**
   * Returns user-friendly error message with actionable guidance.
   */
  getUserMessage(): string {
    if (this.provider === 'ollama') {
      return `Failed to connect to Ollama. Please ensure:
1. Ollama is running locally (http://localhost:11434)
   - Check: curl http://localhost:11434/api/tags
   - Start: ollama serve (if not running)
2. The model is installed (e.g., ollama pull qwen2.5-coder)
   - List models: ollama list
   - Pull model: ollama pull <model-name>
3. Your network connection is active
   - Verify localhost is accessible

Error: ${this.message}`;
    }

    if (this.provider === 'gemini') {
      return `Failed to connect to Gemini. Please check:
1. Your API key is valid and set in ~/.zulu-pilotrc
   - Get key: https://makersuite.google.com/app/apikey
2. Your internet connection is active
3. API endpoint is accessible (aiplatform.googleapis.com)
4. Firewall settings allow HTTPS connections

Error: ${this.message}`;
    }

    if (this.provider === 'openai') {
      return `Failed to connect to OpenAI. Please check:
1. Your API key is valid and set in ~/.zulu-pilotrc
   - Get key: https://platform.openai.com/api-keys
2. Your internet connection is active
3. API endpoint is accessible (api.openai.com)
4. Firewall settings allow HTTPS connections
5. Check your account quota and billing status

Error: ${this.message}`;
    }

    if (this.provider === 'googleCloud' || this.provider === 'googlecloud') {
      return `Failed to connect to Google Cloud AI Platform. Please check:
1. gcloud CLI is installed and authenticated
   - Install: https://cloud.google.com/sdk/docs/install
   - Auth: gcloud auth login
   - Verify: gcloud auth print-access-token
2. Project ID and region are correctly configured
3. API is enabled: gcloud services enable aiplatform.googleapis.com
4. Your internet connection is active

Error: ${this.message}`;
    }

    return `Failed to connect to ${this.provider}. Please check:
1. Your internet connection
2. API endpoint is accessible
3. Firewall settings
4. API credentials are valid

Error: ${this.message}`;
  }
}

/**
 * Error thrown when API rate limit is exceeded.
 * T119: Implement RateLimitError with retry guidance
 */
export class RateLimitError extends AppError {
  constructor(
    message: string,
    public readonly retryAfter?: number,
    cause?: Error
  ) {
    super(message, 'RATE_LIMIT_ERROR', cause);
  }

  /**
   * Returns user-friendly error message with retry guidance.
   */
  getUserMessage(): string {
    const retryInfo = this.retryAfter
      ? ` Retry after ${this.retryAfter} seconds.`
      : ' Please retry in a few moments.';
    return `Rate limit exceeded.${retryInfo}

To resolve:
1. Wait for the retry period before making another request
2. Consider upgrading your API plan for higher rate limits
3. Reduce request frequency or batch requests
4. Check your API usage dashboard for current limits
5. Implement exponential backoff: ${RateLimitError.calculateBackoff(0)}ms, ${RateLimitError.calculateBackoff(1)}ms, ${RateLimitError.calculateBackoff(2)}ms...

Error: ${this.message}`;
  }

  /**
   * Calculates exponential backoff delay for retry.
   *
   * @param attempt - Current retry attempt (0-indexed)
   * @param baseDelay - Base delay in milliseconds (default: 1000)
   * @param maxDelay - Maximum delay in milliseconds (default: 30000)
   * @returns Delay in milliseconds
   */
  static calculateBackoff(
    attempt: number,
    baseDelay: number = 1000,
    maxDelay: number = 30000
  ): number {
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    return delay;
  }
}

/**
 * Error thrown when input validation fails.
 * T120: Implement ValidationError with actionable guidance
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field?: string,
    cause?: Error
  ) {
    super(message, 'VALIDATION_ERROR', cause);
  }

  /**
   * Returns user-friendly error message with actionable guidance.
   */
  getUserMessage(): string {
    const fieldInfo = this.field ? ` (field: ${this.field})` : '';
    let suggestion = '';

    if (this.field === 'filePath') {
      suggestion =
        '\n\nSuggestions:\n- Use relative paths from the project root\n- Ensure the file exists and is readable\n- Check for typos in the file path\n- Avoid using directory traversal (../)\n- Use quotes around paths with spaces';
    } else if (this.field === 'apiKey') {
      suggestion =
        '\n\nSuggestions:\n- Check your API key format (should be a string)\n- Verify the key is not expired\n- Use env:VAR_NAME format for environment variables (e.g., env:OPENAI_API_KEY)\n- Ensure the environment variable is set if using env: prefix\n- Check ~/.zulu-pilotrc configuration file';
    } else if (this.field === 'model') {
      suggestion =
        '\n\nSuggestions:\n- Verify the model name is correct\n- Check provider-specific model naming (e.g., gpt-4, gemini-pro)\n- Use format provider:model (e.g., openai:gpt-4)\n- List available models: zulu-pilot model list';
    } else if (this.field === 'provider') {
      suggestion =
        '\n\nSuggestions:\n- Verify provider name is valid (ollama, openai, gemini, googlecloud)\n- Check provider configuration in ~/.zulu-pilotrc\n- List available providers: zulu-pilot provider list';
    } else if (this.field === 'baseUrl') {
      suggestion =
        '\n\nSuggestions:\n- Use a valid URL format (http:// or https://)\n- Ensure the URL is accessible\n- Check for typos in the URL\n- Verify port numbers if specified';
    } else if (this.field === 'timeout') {
      suggestion =
        '\n\nSuggestions:\n- Timeout should be a positive number (milliseconds)\n- Recommended: 5000ms for local, 30000ms for remote\n- Check your network connection if timeouts occur frequently';
    } else if (this.field) {
      suggestion = `\n\nSuggestions:\n- Verify the ${this.field} value is correct\n- Check documentation for valid values\n- Ensure the value matches the expected format`;
    }

    return `Validation failed${fieldInfo}: ${this.message}${suggestion}`;
  }
}

/**
 * Error thrown when a model is not found.
 */
export class ModelNotFoundError extends AppError {
  constructor(
    message: string,
    public readonly modelName?: string,
    public readonly provider?: string,
    cause?: Error
  ) {
    super(message, 'MODEL_NOT_FOUND', cause);
  }

  /**
   * Returns user-friendly error message with actionable guidance.
   */
  getUserMessage(): string {
    const modelInfo = this.modelName ? `Model "${this.modelName}"` : 'Model';
    const providerInfo = this.provider ? ` on provider "${this.provider}"` : '';
    return `${modelInfo} not found${providerInfo}.

To resolve:
1. Verify the model name is correct
2. Check provider-specific model naming conventions
3. List available models: zulu-pilot model list --provider ${this.provider ?? 'all'}
4. For Ollama: Ensure the model is installed (ollama pull <model-name>)
5. For OpenAI/Gemini: Verify the model is available in your account/region

Error: ${this.message}`;
  }
}

/**
 * Error thrown when API key is invalid or missing.
 */
export class InvalidApiKeyError extends AppError {
  constructor(
    message: string,
    public readonly provider?: string,
    cause?: Error
  ) {
    super(message, 'INVALID_API_KEY', cause);
  }

  /**
   * Returns user-friendly error message with actionable guidance.
   */
  getUserMessage(): string {
    const providerInfo = this.provider ? ` for ${this.provider}` : '';
    let guidance = '';

    if (this.provider === 'openai') {
      guidance =
        '\n\nTo fix:\n1. Get your API key: https://platform.openai.com/api-keys\n2. Add to ~/.zulu-pilotrc:\n   [providers.openai]\n   apiKey = "sk-..."\n3. Or use environment variable: env:OPENAI_API_KEY';
    } else if (this.provider === 'gemini') {
      guidance =
        '\n\nTo fix:\n1. Get your API key: https://makersuite.google.com/app/apikey\n2. Add to ~/.zulu-pilotrc:\n   [providers.gemini]\n   apiKey = "..."\n3. Or use environment variable: env:GEMINI_API_KEY';
    } else if (this.provider === 'googlecloud' || this.provider === 'googleCloud') {
      guidance =
        '\n\nTo fix:\n1. Authenticate with gcloud: gcloud auth login\n2. Set project: gcloud config set project YOUR_PROJECT_ID\n3. Enable API: gcloud services enable aiplatform.googleapis.com\n4. Or provide API key in ~/.zulu-pilotrc';
    } else {
      guidance =
        '\n\nTo fix:\n1. Check ~/.zulu-pilotrc configuration\n2. Verify API key format is correct\n3. Ensure API key is not expired\n4. Use env:VAR_NAME format for environment variables';
    }

    return `Invalid or missing API key${providerInfo}: ${this.message}${guidance}`;
  }
}
