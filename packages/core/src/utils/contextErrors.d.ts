/**
 * Context-specific error classes
 * @package @zulu-pilot/core
 */
/**
 * Base error class for all application errors.
 */
export declare class AppError extends Error {
  readonly code: string;
  readonly cause?: Error;
  constructor(message: string, code: string, cause?: Error);
}
/**
 * Error thrown when input validation fails.
 */
export declare class ValidationError extends AppError {
  readonly field?: string;
  constructor(message: string, field?: string, cause?: Error);
  /**
   * Returns user-friendly error message.
   */
  getUserMessage(): string;
}
//# sourceMappingURL=contextErrors.d.ts.map
