/**
 * Context-specific error classes
 * @package @zulu-pilot/core
 */
/**
 * Base error class for all application errors.
 */
export class AppError extends Error {
  code;
  cause;
  constructor(message, code, cause) {
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
  field;
  constructor(message, field, cause) {
    super(message, 'VALIDATION_ERROR', cause);
    this.field = field;
  }
  /**
   * Returns user-friendly error message.
   */
  getUserMessage() {
    if (this.field) {
      return `Validation error in ${this.field}: ${this.message}`;
    }
    return `Validation error: ${this.message}`;
  }
}
//# sourceMappingURL=contextErrors.js.map
