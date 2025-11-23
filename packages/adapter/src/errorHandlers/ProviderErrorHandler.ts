/**
 * Provider Error Handler
 * T124: Add provider-specific error messages in packages/adapter/src/errorHandlers/ProviderErrorHandler.ts
 *
 * Provides provider-specific error handling and message formatting
 * @package @zulu-pilot/adapter
 */

import type { AxiosError } from 'axios';
import {
  ConnectionError,
  RateLimitError,
  ValidationError,
  ModelNotFoundError,
  InvalidApiKeyError,
  AppError,
} from '@zulu-pilot/core';

/**
 * Provider-specific error context
 */
export interface ProviderErrorContext {
  provider: string;
  model?: string;
  baseUrl?: string;
  statusCode?: number;
}

/**
 * Provider Error Handler
 * Handles provider-specific error conversion and message formatting
 */
export class ProviderErrorHandler {
  /**
   * Handle Axios error and convert to application error
   *
   * @param error - Axios error
   * @param context - Provider context
   * @returns Application error with user-friendly message
   */
  static handleAxiosError(
    error: AxiosError,
    context: ProviderErrorContext
  ): AppError {
    const { provider, model, baseUrl, statusCode } = context;

    // Connection errors
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNABORTED'
    ) {
      return new ConnectionError(
        `Failed to connect to ${provider}${baseUrl ? ` at ${baseUrl}` : ''}`,
        provider,
        error
      );
    }

    // HTTP status code errors
    if (error.response) {
      const status = statusCode ?? error.response.status;
      const responseData = error.response.data as {
        error?: {
          message?: string;
          code?: string;
          type?: string;
        };
      };

      const errorMessage =
        responseData?.error?.message ?? error.message ?? 'Unknown error';

      // 401 Unauthorized - Invalid API key
      if (status === 401) {
        return new InvalidApiKeyError(
          `Authentication failed: ${errorMessage}`,
          provider,
          error
        );
      }

      // 403 Forbidden - API key valid but no permission
      if (status === 403) {
        return new ValidationError(
          `Access forbidden: ${errorMessage}. Check your API key permissions.`,
          'apiKey',
          error
        );
      }

      // 404 Not Found - Model not found
      if (status === 404) {
        if (model) {
          return new ModelNotFoundError(
            `Model "${model}" not found: ${errorMessage}`,
            model,
            provider,
            error
          );
        }
        return new ValidationError(
          `Resource not found: ${errorMessage}`,
          undefined,
          error
        );
      }

      // 429 Too Many Requests - Rate limit
      if (status === 429) {
        const retryAfterHeader = error.response.headers['retry-after'];
        const retryAfter = retryAfterHeader
          ? parseInt(retryAfterHeader, 10)
          : undefined;

        return new RateLimitError(errorMessage, retryAfter, error);
      }

      // 400 Bad Request - Validation error
      if (status === 400) {
        return new ValidationError(errorMessage, undefined, error);
      }

      // 500-599 Server errors
      if (status >= 500 && status < 600) {
        return new ConnectionError(
          `Server error from ${provider}: ${errorMessage}`,
          provider,
          error
        );
      }
    }

    // Network errors without response
    if (error.request && !error.response) {
      return new ConnectionError(
        `Network error connecting to ${provider}: ${error.message}`,
        provider,
        error
      );
    }

    // Default: wrap as ConnectionError
    return new ConnectionError(
      `Error from ${provider}: ${error.message}`,
      provider,
      error
    );
  }

  /**
   * Handle generic error and convert to application error
   *
   * @param error - Generic error
   * @param context - Provider context
   * @returns Application error with user-friendly message
   */
  static handleError(
    error: unknown,
    context: ProviderErrorContext
  ): AppError {
    // If already an AppError, return as-is
    if (
      error instanceof ConnectionError ||
      error instanceof RateLimitError ||
      error instanceof ValidationError ||
      error instanceof ModelNotFoundError ||
      error instanceof InvalidApiKeyError ||
      error instanceof AppError
    ) {
      return error;
    }

    // Handle Axios errors
    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error, context);
    }

    // Handle generic Error
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Connection errors
      if (
        message.includes('connection') ||
        message.includes('timeout') ||
        message.includes('network')
      ) {
        return new ConnectionError(error.message, context.provider, error);
      }

      // Rate limit errors
      if (message.includes('rate limit') || message.includes('429')) {
        return new RateLimitError(error.message, undefined, error);
      }

      // Model not found errors
      if (message.includes('model') && message.includes('not found')) {
        return new ModelNotFoundError(
          error.message,
          context.model,
          context.provider,
          error
        );
      }

      // API key errors
      if (
        message.includes('api key') ||
        message.includes('authentication') ||
        message.includes('401')
      ) {
        return new InvalidApiKeyError(error.message, context.provider, error);
      }

      // Default: ConnectionError
      return new ConnectionError(error.message, context.provider, error);
    }

    // Unknown error type
    return new ConnectionError(
      `Unexpected error from ${context.provider}: ${String(error)}`,
      context.provider
    );
  }

  /**
   * Check if error is Axios error
   */
  private static isAxiosError(error: unknown): error is AxiosError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'isAxiosError' in error &&
      (error as { isAxiosError?: boolean }).isAxiosError === true
    );
  }

  /**
   * Get provider-specific error message with actionable guidance
   *
   * @param error - Application error
   * @param context - Provider context
   * @returns User-friendly error message
   */
  static getUserMessage(error: AppError, context: ProviderErrorContext): string {
    // If error has getUserMessage method, use it
    if (
      error instanceof ConnectionError ||
      error instanceof RateLimitError ||
      error instanceof ValidationError ||
      error instanceof ModelNotFoundError ||
      error instanceof InvalidApiKeyError
    ) {
      return error.getUserMessage();
    }

    // Default message
    return `${error.message} (Provider: ${context.provider})`;
  }
}

