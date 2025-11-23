/**
 * Base error class for all application errors.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when connection to a model provider fails.
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

    if (this.provider === 'googleCloud') {
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
   * Returns user-friendly error message.
   */
  getUserMessage(): string {
    const fieldInfo = this.field ? ` (field: ${this.field})` : '';
    let suggestion = '';

    if (this.field === 'filePath') {
      suggestion =
        '\n\nSuggestions:\n- Use relative paths from the project root\n- Ensure the file exists and is readable\n- Check for typos in the file path';
    } else if (this.field === 'apiKey') {
      suggestion =
        '\n\nSuggestions:\n- Check your API key format\n- Verify the key is not expired\n- Use env:VAR_NAME format for environment variables';
    }

    return `Validation failed${fieldInfo}: ${this.message}${suggestion}`;
  }
}

/**
 * Network timeout configuration.
 */
export const NETWORK_TIMEOUTS = {
  /** Timeout for local providers (Ollama) in milliseconds */
  LOCAL: 5000,
  /** Timeout for remote providers in milliseconds */
  REMOTE: 30000,
} as const;

/**
 * Gets the appropriate timeout for a provider.
 *
 * @param isLocal - Whether the provider is local (default: false)
 * @returns Timeout in milliseconds
 */
export function getProviderTimeout(isLocal: boolean = false): number {
  return isLocal ? NETWORK_TIMEOUTS.LOCAL : NETWORK_TIMEOUTS.REMOTE;
}
