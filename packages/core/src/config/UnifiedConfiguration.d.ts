/**
 * Unified Configuration Types
 *
 * Configuration types for Zulu Pilot multi-provider support
 * @package @zulu-pilot/core
 */
/**
 * Provider Configuration
 *
 * Represents configuration for a single AI provider
 */
export interface ProviderConfiguration {
  type: 'ollama' | 'openai' | 'googleCloud' | 'gemini' | 'deepseek' | 'qwen';
  name: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
  enabled?: boolean;
  providerSpecific?: {
    projectId?: string;
    region?: string;
    credentialsPath?: string;
    endpoint?: string;
    [key: string]: unknown;
  };
}
/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  includeTools?: string[];
  excludeTools?: string[];
  enabled?: boolean;
}
/**
 * Unified Configuration
 *
 * Root configuration object that combines Gemini CLI config with custom provider configs
 */
export interface UnifiedConfiguration {
  defaultProvider: string;
  defaultModel?: string;
  providers: Record<string, ProviderConfiguration>;
  geminiCLI?: {
    mcpServers?: Record<string, MCPServerConfig>;
    tools?: {
      googleSearch?: {
        enabled: boolean;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  providerDefaults?: {
    ollama?: {
      baseUrl?: string;
      timeout?: number;
    };
    openai?: {
      baseUrl?: string;
      timeout?: number;
    };
    googleCloud?: {
      projectId?: string;
      region?: string;
    };
    [key: string]: unknown;
  };
}
//# sourceMappingURL=UnifiedConfiguration.d.ts.map
