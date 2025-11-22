/**
 * Chat Command
 *
 * CLI command for interactive chat with custom model providers
 * T054-T056, T062-T063: Chat command with adapter integration and provider/model selection
 *
 * @package @zulu-pilot/cli
 */

import type { CommandModule, Argv } from 'yargs';
import type { Config } from '@google/gemini-cli-core';
import { GeminiCLIModelAdapter } from '@zulu-pilot/adapter';
import { MultiProviderRouter } from '@zulu-pilot/adapter';
import { ProviderRegistry } from '@zulu-pilot/adapter';
import { UnifiedConfigManager } from '@zulu-pilot/core';
import { OllamaProvider } from '@zulu-pilot/providers';
/**
 * Chat command options interface
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
 * ChatCommand class
 *
 * Handles interactive chat with custom model providers
 * T054: Create ChatCommand class
 */
export class ChatCommand {
  private config: Config;
  private adapter: GeminiCLIModelAdapter | null = null;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Initialize adapter with provider registry and router
   * T056: Integrate adapter with Gemini CLI core
   */
  private async initializeAdapter(
    providerName?: string,
    modelName?: string
  ): Promise<void> {
    // Load unified configuration
    const configManager = new UnifiedConfigManager();
    const unifiedConfig = await configManager.loadConfig();

    // Override provider/model if specified
    if (providerName) {
      unifiedConfig.defaultProvider = providerName;
    }
    if (modelName) {
      unifiedConfig.defaultModel = modelName;
    }

    // Initialize provider registry
    const registry = new ProviderRegistry();

    // Register factory for Ollama provider type
    registry.registerFactory('ollama', (config: any) => {
      return new OllamaProvider({
        baseUrl: config.baseUrl || 'http://localhost:11434',
        model: config.model || 'qwen2.5-coder',
        timeout: config.timeout || 30000,
      });
    });

    // Register providers from config
    for (const [name, providerConfig] of Object.entries(unifiedConfig.providers)) {
      if (providerConfig.enabled !== false) {
        registry.registerProvider(name, providerConfig);
      }
    }

    // Initialize router (needs both registry and config)
    const router = new MultiProviderRouter(registry, unifiedConfig);

    // Create adapter (needs both router and config)
    this.adapter = new GeminiCLIModelAdapter(router, unifiedConfig);

    // Wire up adapter to config's content generator
    // This ensures the adapter is used instead of the default GoogleGenAI
    this.config.setZuluPilotAdapter(this.adapter);
    
    // Refresh auth to initialize content generator with adapter
    const authType = this.config.getContentGeneratorConfig()?.authType;
    if (authType) {
      await this.config.refreshAuth(authType);
    }
  }

  /**
   * T055: Implement interactive chat loop
   * T062: Add provider selection
   * T063: Add model selection
   */
  async run(options: ChatCommandOptions): Promise<void> {
    try {
      // Initialize adapter with provider/model selection
      await this.initializeAdapter(options.provider, options.model);

      if (options.headless) {
        // Non-interactive mode
        await this.runNonInteractive(options);
      } else {
        // Interactive mode - delegate to existing Gemini CLI UI
        // The existing UI will handle the interactive chat
        // We just ensure the adapter is initialized
        console.log('Starting interactive chat...');
        console.log(`Provider: ${options.provider || 'default'}`);
        console.log(`Model: ${options.model || 'default'}`);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      throw error;
    }
  }

  /**
   * Run non-interactive chat
   */
  private async runNonInteractive(options: ChatCommandOptions): Promise<void> {
    if (!options.prompt) {
      throw new Error('Prompt required for non-interactive mode');
    }

    // For non-interactive mode, we would use the adapter directly
    // This is a placeholder - actual implementation would use the adapter
    console.log('Non-interactive chat mode');
    console.log('Prompt:', options.prompt);
  }

  /**
   * Get the adapter instance
   */
  getAdapter(): GeminiCLIModelAdapter | null {
    return this.adapter;
  }
}

/**
 * Yargs command definition for chat
 */
export const chatCommand: CommandModule = {
  command: 'chat',
  describe: 'Start interactive chat with custom model providers',
  builder: (yargs: Argv): Argv =>
    yargs
      .option('provider', {
        alias: 'p',
        type: 'string',
        description: 'Provider to use (e.g., ollama, openai)',
      })
      .option('model', {
        alias: 'm',
        type: 'string',
        description: 'Model to use (e.g., qwen2.5-coder, gpt-4)',
      })
      .option('prompt', {
        type: 'string',
        description: 'Initial prompt (for non-interactive mode)',
      })
      .option('headless', {
        type: 'boolean',
        default: false,
        description: 'Run in headless/non-interactive mode',
      })
      .option('output-format', {
        type: 'string',
        choices: ['text', 'json', 'stream-json'],
        default: 'text',
        description: 'Output format',
      })
      .option('resume', {
        type: 'string',
        description: 'Resume chat from checkpoint',
      }),
  handler: async (argv) => {
    // This will be called by the CLI when 'chat' command is invoked
    // For now, it's a placeholder - actual integration will happen in the main CLI entry point
    console.log('Chat command invoked with options:', argv);
  },
};

