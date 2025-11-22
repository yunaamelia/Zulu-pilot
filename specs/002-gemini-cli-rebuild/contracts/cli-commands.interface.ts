/**
 * CLI Command Interfaces Contract
 *
 * Defines the structure for CLI commands and their options.
 *
 * @package @zulu-pilot/cli
 */

/**
 * Provider command options
 */
export interface ProviderCommandOptions {
  list?: boolean;
  set?: string;
  config?: string;
  show?: boolean;
}

/**
 * Model command options
 */
export interface ModelCommandOptions {
  list?: boolean;
  set?: string;
  provider?: string;
  show?: boolean;
}

/**
 * Add command options
 */
export interface AddCommandOptions {
  files: string[]; // File paths or glob patterns
  recursive?: boolean;
}

/**
 * Context command options
 */
export interface ContextCommandOptions {
  list?: boolean;
  clear?: boolean;
  show?: boolean;
}

/**
 * Chat command options
 */
export interface ChatCommandOptions {
  provider?: string;
  model?: string;
  prompt?: string;
  resume?: string;
  outputFormat?: 'text' | 'json' | 'stream-json';
  headless?: boolean;
}

/**
 * Config command options
 */
export interface ConfigCommandOptions {
  set?: string; // "key=value" format
  get?: string; // Key to get
  list?: boolean;
  reset?: boolean;
}

/**
 * Checkpoint command options
 */
export interface CheckpointCommandOptions {
  save?: string; // Checkpoint name
  list?: boolean;
  delete?: string; // Checkpoint ID
  show?: string; // Checkpoint ID
}

/**
 * CLI command result interface
 */
export interface CommandResult {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: Error;
}
