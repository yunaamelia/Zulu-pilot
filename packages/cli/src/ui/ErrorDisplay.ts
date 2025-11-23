/**
 * Error Display Component
 * T123: Implement error display in CLI with actionable guidance
 *
 * Provides user-friendly error display with actionable guidance
 * @package @zulu-pilot/cli
 */

import {
  ConnectionError,
  RateLimitError,
  ValidationError,
  ModelNotFoundError,
  InvalidApiKeyError,
  AppError,
} from '@zulu-pilot/core';

/**
 * Error Display Options
 */
export interface ErrorDisplayOptions {
  /** Whether to show verbose error details */
  verbose?: boolean;
  /** Whether to show stack trace */
  showStack?: boolean;
  /** Custom prefix for error messages */
  prefix?: string;
}

/**
 * Error Display Component
 * Displays errors in a user-friendly format with actionable guidance
 */
export class ErrorDisplay {
  /**
   * Display error with user-friendly message
   *
   * @param error - Error to display
   * @param options - Display options
   * @returns User-friendly error message string
   */
  static displayError(error: unknown, options: ErrorDisplayOptions = {}): string {
    const { verbose = false, showStack = false, prefix = 'Error:' } = options;

    // Handle custom error types
    if (error instanceof ConnectionError) {
      return this.displayConnectionError(error, { verbose, prefix });
    }

    if (error instanceof RateLimitError) {
      return this.displayRateLimitError(error, { verbose, prefix });
    }

    if (error instanceof ValidationError) {
      return this.displayValidationError(error, { verbose, prefix });
    }

    if (error instanceof ModelNotFoundError) {
      return this.displayModelNotFoundError(error, { verbose, prefix });
    }

    if (error instanceof InvalidApiKeyError) {
      return this.displayInvalidApiKeyError(error, { verbose, prefix });
    }

    if (error instanceof AppError) {
      return this.displayAppError(error, { verbose, prefix });
    }

    // Handle generic Error
    if (error instanceof Error) {
      return this.displayGenericError(error, { verbose, showStack, prefix });
    }

    // Handle unknown error types
    return this.displayUnknownError(error, { prefix });
  }

  /**
   * Display connection error with provider-specific guidance
   */
  private static displayConnectionError(
    error: ConnectionError,
    options: { verbose: boolean; prefix: string }
  ): string {
    const { verbose, prefix } = options;
    let message = `\n${prefix} ${error.getUserMessage()}\n`;

    if (verbose && error.cause) {
      message += `\nTechnical details: ${error.cause.message}\n`;
      if (error.cause.stack) {
        message += `\nStack trace:\n${error.cause.stack}\n`;
      }
    }

    return message;
  }

  /**
   * Display rate limit error with retry guidance
   */
  private static displayRateLimitError(
    error: RateLimitError,
    options: { verbose: boolean; prefix: string }
  ): string {
    const { verbose, prefix } = options;
    let message = `\n${prefix} ${error.getUserMessage()}\n`;

    if (verbose && error.cause) {
      message += `\nTechnical details: ${error.cause.message}\n`;
    }

    if (error.retryAfter) {
      message += `\n⏱️  You can retry after ${error.retryAfter} seconds.\n`;
    }

    return message;
  }

  /**
   * Display validation error with field-specific guidance
   */
  private static displayValidationError(
    error: ValidationError,
    options: { verbose: boolean; prefix: string }
  ): string {
    const { verbose, prefix } = options;
    let message = `\n${prefix} ${error.getUserMessage()}\n`;

    if (verbose && error.cause) {
      message += `\nTechnical details: ${error.cause.message}\n`;
    }

    return message;
  }

  /**
   * Display model not found error with model listing guidance
   */
  private static displayModelNotFoundError(
    error: ModelNotFoundError,
    options: { verbose: boolean; prefix: string }
  ): string {
    const { verbose, prefix } = options;
    let message = `\n${prefix} ${error.getUserMessage()}\n`;

    if (verbose && error.cause) {
      message += `\nTechnical details: ${error.cause.message}\n`;
    }

    return message;
  }

  /**
   * Display invalid API key error with provider-specific setup guidance
   */
  private static displayInvalidApiKeyError(
    error: InvalidApiKeyError,
    options: { verbose: boolean; prefix: string }
  ): string {
    const { verbose, prefix } = options;
    let message = `\n${prefix} ${error.getUserMessage()}\n`;

    if (verbose && error.cause) {
      message += `\nTechnical details: ${error.cause.message}\n`;
    }

    return message;
  }

  /**
   * Display generic AppError
   */
  private static displayAppError(
    error: AppError,
    options: { verbose: boolean; prefix: string }
  ): string {
    const { verbose, prefix } = options;
    let message = `\n${prefix} ${error.message}\n`;

    if (verbose && error.cause) {
      message += `\nCause: ${error.cause.message}\n`;
      if (error.cause.stack) {
        message += `\nStack trace:\n${error.cause.stack}\n`;
      }
    }

    return message;
  }

  /**
   * Display generic Error
   */
  private static displayGenericError(
    error: Error,
    options: { verbose: boolean; showStack: boolean; prefix: string }
  ): string {
    const { verbose, showStack, prefix } = options;
    let message = `\n${prefix} ${error.message}\n`;

    if (verbose || showStack) {
      if (error.stack) {
        message += `\nStack trace:\n${error.stack}\n`;
      }
    }

    return message;
  }

  /**
   * Display unknown error type
   */
  private static displayUnknownError(
    error: unknown,
    options: { prefix: string }
  ): string {
    const { prefix } = options;
    const errorString = String(error);
    return `\n${prefix} Unexpected error: ${errorString}\n`;
  }

  /**
   * Format error for console output with colors (if available)
   *
   * @param error - Error to format
   * @param options - Display options
   * @returns Formatted error string
   */
  static formatError(error: unknown, options: ErrorDisplayOptions = {}): string {
    // Check if we're in a TTY that supports colors
    const supportsColors = process.stdout.isTTY;

    let message = this.displayError(error, options);

    // Add color formatting if supported
    if (supportsColors) {
      // Red color for errors
      const red = '\x1b[31m';
      const reset = '\x1b[0m';
      message = message.replace(/Error:/g, `${red}Error:${reset}`);
    }

    return message;
  }

  /**
   * Print error to console
   *
   * @param error - Error to print
   * @param options - Display options
   */
  static printError(error: unknown, options: ErrorDisplayOptions = {}): void {
    const message = this.formatError(error, options);
    console.error(message);
  }
}

