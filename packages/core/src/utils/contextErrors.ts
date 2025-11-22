/**
 * Context-specific error classes
 * @package @zulu-pilot/core
 */

/**
 * Base error class for all application errors.
 */
export class AppError extends Error {
  readonly code: string;
  readonly cause?: Error;

  constructor(message: string, code: string, cause?: Error) {
    super(message);
    this.code = code;
    this.cause = cause;
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Error thrown when input validation fails.
 */
export class ValidationError extends AppError {
  readonly field?: string;

  constructor(message: string, field?: string, cause?: Error) {
    super(message, 'VALIDATION_ERROR', cause);
    this.field = field;
  }

  /**
   * Returns user-friendly error message.
   */
  getUserMessage(): string {
    if (this.field) {
      return `Validation error in ${this.field}: ${this.message}`;
    }
    return `Validation error: ${this.message}`;
  }
}
