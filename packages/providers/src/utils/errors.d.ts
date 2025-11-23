/**
 * Base error class for all application errors.
 */
export declare class AppError extends Error {
    readonly code: string;
    readonly cause?: Error | undefined;
    constructor(message: string, code: string, cause?: Error | undefined);
}
/**
 * Error thrown when connection to a model provider fails.
 */
export declare class ConnectionError extends AppError {
    readonly provider: string;
    constructor(message: string, provider: string, cause?: Error);
    /**
     * Returns user-friendly error message with actionable guidance.
     */
    getUserMessage(): string;
}
/**
 * Error thrown when API rate limit is exceeded.
 */
export declare class RateLimitError extends AppError {
    readonly retryAfter?: number | undefined;
    constructor(message: string, retryAfter?: number | undefined, cause?: Error);
    /**
     * Returns user-friendly error message with retry guidance.
     */
    getUserMessage(): string;
    /**
     * Calculates exponential backoff delay for retry.
     *
     * @param attempt - Current retry attempt (0-indexed)
     * @param baseDelay - Base delay in milliseconds (default: 1000)
     * @param maxDelay - Maximum delay in milliseconds (default: 30000)
     * @returns Delay in milliseconds
     */
    static calculateBackoff(attempt: number, baseDelay?: number, maxDelay?: number): number;
}
/**
 * Error thrown when input validation fails.
 */
export declare class ValidationError extends AppError {
    readonly field?: string | undefined;
    constructor(message: string, field?: string | undefined, cause?: Error);
    /**
     * Returns user-friendly error message.
     */
    getUserMessage(): string;
}
/**
 * Network timeout configuration.
 */
export declare const NETWORK_TIMEOUTS: {
    /** Timeout for local providers (Ollama) in milliseconds */
    readonly LOCAL: 5000;
    /** Timeout for remote providers in milliseconds */
    readonly REMOTE: 30000;
};
/**
 * Gets the appropriate timeout for a provider.
 *
 * @param isLocal - Whether the provider is local (default: false)
 * @returns Timeout in milliseconds
 */
export declare function getProviderTimeout(isLocal?: boolean): number;
//# sourceMappingURL=errors.d.ts.map