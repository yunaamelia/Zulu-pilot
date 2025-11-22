import path from 'node:path';
import { ValidationError } from './errors.js';

/**
 * Validates a file path to prevent directory traversal attacks.
 *
 * @param filePath - File path to validate
 * @param baseDir - Base directory (default: current working directory)
 * @returns Normalized absolute path
 * @throws {ValidationError} If path is invalid or outside base directory
 */
export function validateFilePath(filePath: string, baseDir: string = process.cwd()): string {
  if (!filePath || typeof filePath !== 'string') {
    throw new ValidationError('File path must be a non-empty string', 'filePath');
  }

  // Resolve to absolute path
  const absolutePath = path.isAbsolute(filePath)
    ? path.normalize(filePath)
    : path.resolve(baseDir, filePath);

  // Normalize base directory
  const normalizedBase = path.resolve(baseDir);

  // Check if path is within base directory
  if (!absolutePath.startsWith(normalizedBase)) {
    throw new ValidationError(
      `File path "${filePath}" is outside the allowed directory`,
      'filePath'
    );
  }

  // Check for directory traversal patterns
  if (filePath.includes('..')) {
    const normalized = path.normalize(filePath);
    if (normalized.includes('..')) {
      throw new ValidationError(
        `File path "${filePath}" contains invalid directory traversal`,
        'filePath'
      );
    }
  }

  return absolutePath;
}

/**
 * Provider configuration structure.
 */
export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  projectId?: string;
  region?: string;
  [key: string]: unknown;
}

/**
 * Main configuration structure.
 */
export interface Configuration {
  provider: string;
  model?: string;
  providers?: Record<string, ProviderConfig>;
  tokenEstimation?: {
    charsPerToken?: number;
    safetyMargin?: number;
  };
}

/**
 * Validates provider name.
 *
 * @param provider - Provider name to validate
 * @returns Validated provider name
 * @throws {ValidationError} If provider name is invalid
 */
export function validateProviderName(provider: string): string {
  const validProviders = ['ollama', 'gemini', 'openai', 'googleCloud', 'googleClaude'];
  if (!validProviders.includes(provider)) {
    throw new ValidationError(
      `Invalid provider "${provider}". Must be one of: ${validProviders.join(', ')}`,
      'provider'
    );
  }
  return provider;
}

/**
 * Validates API key format or environment variable reference.
 *
 * @param apiKey - API key or env:VAR_NAME format
 * @returns Validated API key
 * @throws {ValidationError} If API key format is invalid
 */
export function validateApiKey(apiKey: string): string {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new ValidationError('API key must be a non-empty string', 'apiKey');
  }

  // Allow environment variable references
  if (apiKey.startsWith('env:')) {
    const envVar = apiKey.slice(4);
    if (!envVar || !/^[A-Z_][A-Z0-9_]*$/.test(envVar)) {
      throw new ValidationError(
        `Invalid environment variable reference: "${apiKey}". Must be env:VAR_NAME format`,
        'apiKey'
      );
    }
    return apiKey;
  }

  // Basic validation for actual API keys (at least 10 characters)
  if (apiKey.length < 10) {
    throw new ValidationError('API key appears to be too short (minimum 10 characters)', 'apiKey');
  }

  return apiKey;
}

/**
 * Validates base URL format.
 *
 * @param baseUrl - Base URL to validate
 * @returns Validated base URL
 * @throws {ValidationError} If URL format is invalid
 */
export function validateBaseUrl(baseUrl: string): string {
  if (!baseUrl || typeof baseUrl !== 'string') {
    throw new ValidationError('Base URL must be a non-empty string', 'baseUrl');
  }

  try {
    const url = new URL(baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new ValidationError(`Base URL must use HTTP or HTTPS protocol: ${baseUrl}`, 'baseUrl');
    }
    return baseUrl;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(`Invalid base URL format: ${baseUrl}`, 'baseUrl', error as Error);
  }
}

/**
 * Validates configuration structure.
 *
 * @param config - Configuration object to validate
 * @returns Validated configuration
 * @throws {ValidationError} If configuration is invalid
 */
export function validateConfiguration(config: unknown): Configuration {
  if (!config || typeof config !== 'object') {
    throw new ValidationError('Configuration must be an object', 'configuration');
  }

  const cfg = config as Record<string, unknown>;

  // Validate provider
  if (!cfg.provider || typeof cfg.provider !== 'string') {
    throw new ValidationError('Configuration must have a "provider" field (string)', 'provider');
  }
  validateProviderName(cfg.provider);

  // Validate model (optional)
  if (cfg.model !== undefined && typeof cfg.model !== 'string') {
    throw new ValidationError('Configuration "model" field must be a string if provided', 'model');
  }

  // Validate providers object (optional)
  if (cfg.providers !== undefined) {
    if (typeof cfg.providers !== 'object' || Array.isArray(cfg.providers)) {
      throw new ValidationError(
        'Configuration "providers" field must be an object if provided',
        'providers'
      );
    }

    // Validate each provider config
    const providers = cfg.providers as Record<string, unknown>;
    for (const [providerName, providerConfig] of Object.entries(providers)) {
      if (!providerConfig || typeof providerConfig !== 'object') {
        throw new ValidationError(
          `Provider config for "${providerName}" must be an object`,
          `providers.${providerName}`
        );
      }

      const pc = providerConfig as ProviderConfig;

      // Validate API key if present
      if (pc.apiKey !== undefined) {
        validateApiKey(pc.apiKey);
      }

      // Validate base URL if present
      if (pc.baseUrl !== undefined) {
        validateBaseUrl(pc.baseUrl);
      }
    }
  }

  return config as Configuration;
}
