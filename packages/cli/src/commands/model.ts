/**
 * Model Command
 *
 * CLI command for managing models per provider
 * T129-T131: Model configuration per provider (list, set)
 *
 * @package @zulu-pilot/cli
 */

import type { CommandModule, Argv } from 'yargs';
import { UnifiedConfigManager, MultiProviderRouter, ProviderRegistry } from '@zulu-pilot/core';
import { green, yellow, red, bold, cyan } from 'chalk';
import { ConnectionError, ValidationError } from '@zulu-pilot/core';

/**
 * Model command options interface
 */
export interface ModelCommandOptions {
  provider?: string;
  outputFormat?: 'table' | 'list' | 'json';
  verbose?: boolean;
}

/**
 * ModelCommand class
 *
 * Handles model management commands per provider
 * T129: Enhance ModelCommand class
 */
export class ModelCommand {
  private configManager: UnifiedConfigManager;
  private router: MultiProviderRouter;
  private registry: ProviderRegistry;

  constructor(
    configManager?: UnifiedConfigManager,
    router?: MultiProviderRouter,
    registry?: ProviderRegistry
  ) {
    this.configManager = configManager ?? new UnifiedConfigManager();
    // Initialize router and registry if not provided
    // This will be done lazily when needed
    this.router = router ?? (null as unknown as MultiProviderRouter);
    this.registry = registry ?? (null as unknown as ProviderRegistry);
  }

  /**
   * T130: Implement model list functionality per provider
   * List all available models for a provider or all providers
   */
  async list(options: ModelCommandOptions): Promise<void> {
    const { provider, outputFormat = 'table', verbose = false } = options;
    const config = await this.configManager.loadConfig();

    if (provider) {
      // List models for specific provider
      await this.listProviderModels(provider, outputFormat, verbose);
    } else {
      // List models for all providers
      await this.listAllProviderModels(outputFormat, verbose);
    }
  }

  /**
   * List models for a specific provider
   */
  private async listProviderModels(
    providerName: string,
    outputFormat: string,
    verbose: boolean
  ): Promise<void> {
    try {
      const config = await this.configManager.loadConfig();
      const providerConfig = config.providers?.[providerName];

      if (!providerConfig) {
        console.log(red(`Provider "${providerName}" is not configured.`));
        console.log(yellow('Use `zulu-pilot provider config <name>` to configure providers.'));
        return;
      }

      // Get provider instance to discover models
      if (!this.router || !this.registry) {
        // Initialize router and registry if needed
        const { MultiProviderRouter, ProviderRegistry } = await import('@zulu-pilot/adapter');
        this.registry = new ProviderRegistry();
        this.router = new MultiProviderRouter(this.registry, config);
      }

      const provider = this.router.getProviderForModel(`${providerName}:dummy`, providerName);

      console.log(bold(green(`\nAvailable models for ${providerName}:`)));

      // Try to discover models from provider
      if (provider.listModels) {
        try {
          const models = await provider.listModels();
          const currentModel = provider.getModel?.() ?? providerConfig.model;

          if (outputFormat === 'json') {
            console.log(
              JSON.stringify(
                {
                  provider: providerName,
                  currentModel,
                  models,
                },
                null,
                2
              )
            );
          } else {
            console.log(bold(cyan(`Current model: ${currentModel || 'none'}`)));
            console.log(bold(cyan(`\nAvailable models (${models.length}):`)));

            for (const model of models) {
              const isCurrent = model === currentModel ? ' (current)' : '';
              console.log(`  - ${model}${isCurrent}`);
            }
          }
        } catch (error) {
          if (error instanceof ConnectionError) {
            console.log(yellow(`Cannot connect to ${providerName} to discover models.`));
            if (verbose) {
              console.log(red(`Error: ${error.message}`));
            }
            // Fallback to configured models
            this.listConfiguredModels(providerName, providerConfig);
          } else {
            throw error;
          }
        }
      } else {
        // Provider doesn't support model discovery - list configured models
        this.listConfiguredModels(providerName, providerConfig);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(red(`Error listing models: ${error.message}`));
      } else {
        console.error(red('Unknown error occurred while listing models.'));
      }
      if (verbose && error instanceof Error && error.stack) {
        console.error(error.stack);
      }
    }
  }

  /**
   * List models for all providers
   */
  private async listAllProviderModels(
    outputFormat: string,
    verbose: boolean
  ): Promise<void> {
    const config = await this.configManager.loadConfig();
    const providers = config.providers || {};

    if (Object.keys(providers).length === 0) {
      console.log(
        yellow(
          'No providers configured. Use `zulu-pilot provider config <name>` to configure providers.'
        )
      );
      return;
    }

    console.log(bold(green('\nAvailable models by provider:')));
    console.log(bold(cyan(`Default provider: ${config.defaultProvider || 'none'}`)));

    if (outputFormat === 'json') {
      const result: Record<string, unknown> = {};
      for (const [providerName] of Object.entries(providers)) {
        await this.listProviderModels(providerName, outputFormat, verbose);
      }
      return;
    }

    // List models for each provider
    for (const [providerName] of Object.entries(providers)) {
      await this.listProviderModels(providerName, 'list', verbose);
      console.log(''); // Empty line between providers
    }
  }

  /**
   * List configured models when discovery is not available
   */
  private listConfiguredModels(
    providerName: string,
    providerConfig: { model?: string }
  ): void {
    if (providerConfig.model) {
      console.log(bold(cyan(`Current model: ${providerConfig.model}`)));
      console.log(yellow('Model discovery not available. Showing configured model only.'));
    } else {
      console.log(yellow('No model configured for this provider.'));
    }
  }

  /**
   * T131: Implement model set functionality per provider
   * Set the model for a specific provider
   */
  async set(
    providerName: string,
    modelName: string,
    options: ModelCommandOptions
  ): Promise<void> {
    const { verbose = false } = options;

    try {
      const config = await this.configManager.loadConfig();
      const providerConfig = config.providers?.[providerName];

      if (!providerConfig) {
        throw new ValidationError(
          `Provider "${providerName}" is not configured. Use 'zulu-pilot provider config ${providerName}' to configure it.`,
          'provider'
        );
      }

      // Validate model if provider supports model discovery
      if (!this.router || !this.registry) {
        const { MultiProviderRouter, ProviderRegistry } = await import('@zulu-pilot/adapter');
        this.registry = new ProviderRegistry();
        this.router = new MultiProviderRouter(this.registry, config);
      }

      const provider = this.router.getProviderForModel(`${providerName}:${modelName}`, providerName);

      // Check if model is available if provider supports discovery
      if (provider.hasModel && provider.listModels) {
        try {
          const hasModel = await provider.hasModel(modelName);
          if (!hasModel) {
            const models = await provider.listModels();
            throw new ValidationError(
              `Model "${modelName}" is not available for provider "${providerName}".\n` +
                `Available models: ${models.slice(0, 5).join(', ')}${
                  models.length > 5 ? '...' : ''
                }`,
              'model'
            );
          }
        } catch (error) {
          if (error instanceof ValidationError) {
            throw error;
          }
          // If model discovery fails, continue with setting the model anyway
          if (verbose) {
            console.log(
              yellow(
                `Warning: Could not verify model availability. Setting model anyway: ${error instanceof Error ? error.message : 'Unknown error'}`
              )
            );
          }
        }
      }

      // Update model in configuration
      if (!config.providers) {
        config.providers = {};
      }
      if (!config.providers[providerName]) {
        config.providers[providerName] = {};
      }
      config.providers[providerName].model = modelName;

      // Set model on provider instance if it supports it
      if (provider.setModel) {
        provider.setModel(modelName);
      }

      // Save configuration
      await this.configManager.saveConfig(config);

      console.log(green(`Model "${modelName}" set for provider "${providerName}".`));
    } catch (error) {
      if (error instanceof ValidationError) {
        console.error(red(`Validation error: ${error.message}`));
      } else if (error instanceof Error) {
        console.error(red(`Error setting model: ${error.message}`));
      } else {
        console.error(red('Unknown error occurred while setting model.'));
      }
      if (verbose && error instanceof Error && error.stack) {
        console.error(error.stack);
      }
      throw error;
    }
  }

  /**
   * Show current model configuration
   */
  async current(options: ModelCommandOptions): Promise<void> {
    const { provider, outputFormat = 'table' } = options;
    const config = await this.configManager.loadConfig();

    if (provider) {
      // Show current model for specific provider
      const providerConfig = config.providers?.[provider];
      const currentModel = providerConfig?.model ?? 'none';

      if (outputFormat === 'json') {
        console.log(
          JSON.stringify(
            {
              provider,
              model: currentModel,
            },
            null,
            2
          )
        );
      } else {
        console.log(bold(green(`Current model for ${provider}: ${currentModel}`)));
      }
    } else {
      // Show current models for all providers
      const providers = config.providers || {};

      if (outputFormat === 'json') {
        const result: Record<string, string> = {};
        for (const [providerName, providerConfig] of Object.entries(providers)) {
          result[providerName] = providerConfig.model || 'none';
        }
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(bold(green('\nCurrent models by provider:')));
        console.log(bold(cyan(`Default provider: ${config.defaultProvider || 'none'}\n`)));

        for (const [providerName, providerConfig] of Object.entries(providers)) {
          const isDefault = providerName === config.defaultProvider ? ' (default)' : '';
          const model = providerConfig.model || 'none';
          console.log(`  ${providerName}${isDefault}: ${model}`);
        }
      }
    }
  }
}

/**
 * Model command handler for yargs
 */
export const modelCommand: CommandModule = {
  command: 'model',
  describe: 'Manage models per provider (list, set, current)',
  builder: (yargs: Argv) => {
    return yargs
      .option('list', {
        alias: 'l',
        type: 'boolean',
        description: 'List available models',
        conflicts: ['set', 'current'],
      })
      .option('set', {
        alias: 's',
        type: 'string',
        description: 'Set model for provider',
        conflicts: ['list', 'current'],
      })
      .option('current', {
        alias: 'c',
        type: 'boolean',
        description: 'Show current model configuration',
        conflicts: ['list', 'set'],
      })
      .option('provider', {
        alias: 'p',
        type: 'string',
        description: 'Provider name (for list/set/current)',
      })
      .option('output-format', {
        alias: 'f',
        type: 'string',
        choices: ['table', 'list', 'json'],
        default: 'table',
        description: 'Output format',
      })
      .option('verbose', {
        alias: 'v',
        type: 'boolean',
        default: false,
        description: 'Verbose output',
      })
      .check((argv) => {
        if (!argv.list && !argv.set && !argv.current) {
          // Default to 'current' if no action specified
          return true;
        }
        return true;
      });
  },
  handler: async (argv) => {
    const command = new ModelCommand();
    const options: ModelCommandOptions = {
      provider: argv.provider as string | undefined,
      outputFormat: argv.outputFormat as 'table' | 'list' | 'json' | undefined,
      verbose: argv.verbose as boolean | undefined,
    };

    try {
      if (argv.list) {
        await command.list(options);
      } else if (argv.set) {
        const provider = options.provider;
        if (!provider) {
          console.error(red('Provider name is required when setting a model. Use --provider <name>.'));
          process.exit(1);
        }
        await command.set(provider, argv.set as string, options);
      } else {
        // Default to 'current'
        await command.current(options);
      }
    } catch (error) {
      console.error(red('Error executing model command.'));
      if (options.verbose && error instanceof Error && error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  },
};

