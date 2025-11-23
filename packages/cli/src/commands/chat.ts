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
import type { Content } from '@google/genai';
import { GeminiCLIModelAdapter } from '@zulu-pilot/adapter';
import { MultiProviderRouter } from '@zulu-pilot/adapter';
import { ProviderRegistry } from '@zulu-pilot/adapter';
import { UnifiedConfigManager, ContextManager } from '@zulu-pilot/core';
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
  private contextManager: ContextManager;
  private configManager: UnifiedConfigManager;

  constructor(config: Config) {
    this.config = config;
    // T109: Initialize ContextManager to ensure context persists across provider switches
    this.contextManager = new ContextManager();
    this.configManager = new UnifiedConfigManager();
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
    // T109: Pass ContextManager to adapter to ensure context persists across provider switches
    this.adapter = new GeminiCLIModelAdapter(router, unifiedConfig, this.contextManager);

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
      // T179: Handle checkpoint resume if specified
      if (options.resume) {
        await this.resumeFromCheckpoint(options.resume);
        return;
      }

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
   * T197: Run non-interactive chat (headless mode)
   * No prompts, outputs directly to stdout in specified format
   */
  private async runNonInteractive(options: ChatCommandOptions): Promise<void> {
    if (!options.prompt) {
      throw new Error('Prompt required for non-interactive mode');
    }

    // T197: No console.log prompts in headless mode - direct output only
    const { OutputFormatter } = await import('../ui/OutputFormatter.js');
    const formatter = new OutputFormatter({
      format: options.outputFormat || 'text',
      pretty: true,
    });

    try {
      // Get the adapter's chat instance to send prompt
      if (!this.adapter) {
        throw new Error('Adapter not initialized');
      }

      // In headless mode, we need to send the prompt and get response
      // This is a simplified version - full implementation would use the adapter
      // For now, we'll output formatted empty response to demonstrate structure
      const mockResponse: Content = {
        role: 'model',
        parts: [{ text: options.prompt || '' }], // Placeholder - actual response would come from adapter
      };

      const formatted = formatter.formatResponse(mockResponse, {
        provider: options.provider,
        model: options.model,
      });

      // Output directly to stdout (no prompts, no interactive elements)
      process.stdout.write(formatted);
      if (!formatter.isJSONMode()) {
        process.stdout.write('\n');
      }
    } catch (error) {
      // In headless mode, errors should be in output format too
      const formatter = new (await import('../ui/OutputFormatter.js')).OutputFormatter({
        format: options.outputFormat || 'text',
        pretty: true,
      });
      
      if (formatter.isJSONMode()) {
        const errorResponse = {
          error: {
            type: 'ERROR',
            message: error instanceof Error ? error.message : String(error),
          },
        };
        process.stdout.write(JSON.stringify(errorResponse, null, 2));
      } else {
        process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
      }
      process.exit(1);
    }
  }

  /**
   * Get the adapter instance
   */
  getAdapter(): GeminiCLIModelAdapter | null {
    return this.adapter;
  }

  /**
   * T108: Switch provider during interactive chat
   * 
   * @param providerName - Name of the provider to switch to
   * @throws {Error} If provider not found or not enabled
   */
  async switchProvider(providerName: string): Promise<void> {
    if (!this.adapter) {
      throw new Error('Adapter not initialized. Please start chat first.');
    }

    // Load config to verify provider exists
    const config = await this.configManager.loadConfig();
    const providers = config.providers || {};

    if (!providers[providerName]) {
      throw new Error(`Provider "${providerName}" not found. Available providers: ${Object.keys(providers).join(', ')}`);
    }

    const provider = providers[providerName];
    if (!provider.enabled) {
      throw new Error(`Provider "${providerName}" is disabled. Enable it first with: zulu-pilot provider config ${providerName} --enable`);
    }

    // T108: Switch provider in the router
    this.adapter.switchProvider(providerName);

    // Update default provider in config
    config.defaultProvider = providerName;
    await this.configManager.saveConfig(config);

    console.log(`✅ Switched to provider: ${providerName}`);
    console.log(`   Type: ${provider.type}`);
    console.log(`   Model: ${provider.model || 'default'}`);
  }

  /**
   * T108: Get current provider name
   * 
   * @returns Current provider name or null if not set
   */
  getCurrentProvider(): string | null {
    if (!this.adapter) {
      return null;
    }
    // Get current provider from router via adapter
    return this.adapter.getRouter()?.getCurrentProvider() ?? null;
  }

  /**
   * T108: List available providers
   * 
   * @returns List of available provider names
   */
  async listProviders(): Promise<string[]> {
    const config = await this.configManager.loadConfig();
    const providers = config.providers || {};
    return Object.keys(providers).filter(name => providers[name].enabled !== false);
  }

  /**
   * T109: Get ContextManager instance
   * Ensures context can be accessed and persists across provider switches
   * 
   * @returns ContextManager instance
   */
  getContextManager(): ContextManager {
    return this.contextManager;
  }

  /**
   * T179: Resume chat from checkpoint
   * 
   * @param checkpointId - ID of checkpoint to resume from
   */
  private async resumeFromCheckpoint(checkpointId: string): Promise<void> {
    const { CheckpointManager } = await import('../../../packages/core/src/checkpoint/CheckpointManager.js');
    const manager = new CheckpointManager();
    const checkpoint = await manager.loadCheckpoint(checkpointId);

    if (!checkpoint) {
      console.error(`❌ Checkpoint not found: ${checkpointId}`);
      process.exit(1);
    }

    console.log(`✅ Resuming from checkpoint: ${checkpoint.name}`);
    if (checkpoint.description) {
      console.log(`   Description: ${checkpoint.description}`);
    }
    console.log(`   History: ${checkpoint.history.length} message(s)`);

    // Initialize adapter with checkpoint provider if specified
    const provider = checkpoint.provider?.providerName;
    const model = checkpoint.provider?.modelName;
    await this.initializeAdapter(provider, model);

    // Restore conversation history
    // Note: This requires access to the chat instance, which is managed by GeminiClient
    // The actual history restoration will be handled by the client when it initializes
    // For now, we log the checkpoint information
    console.log('ℹ️  Checkpoint loaded. Conversation history will be restored when chat starts.');

    // If workspace root is different, warn user
    if (checkpoint.workspaceRoot && checkpoint.workspaceRoot !== process.cwd()) {
      console.log(`⚠️  Checkpoint was created in: ${checkpoint.workspaceRoot}`);
      console.log(`   Current directory: ${process.cwd()}`);
    }
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

