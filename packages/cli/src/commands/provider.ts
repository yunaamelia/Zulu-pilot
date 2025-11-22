/**
 * Provider Command
 *
 * CLI command for managing AI providers
 * T104-T107: Provider management commands (list, set, config)
 *
 * @package @zulu-pilot/cli
 */

import type { CommandModule, Argv } from 'yargs';
import { UnifiedConfigManager } from '@zulu-pilot/core';
import type { ProviderConfiguration } from '@zulu-pilot/core';
import { green, yellow, red, bold, cyan } from 'chalk';

/**
 * Provider command options interface
 */
export interface ProviderCommandOptions {
  name?: string;
  outputFormat?: 'table' | 'list' | 'json';
  verbose?: boolean;
}

/**
 * ProviderCommand class
 *
 * Handles provider management commands
 * T104: Create ProviderCommand class
 */
export class ProviderCommand {
  private configManager: UnifiedConfigManager;

  constructor(configManager?: UnifiedConfigManager) {
    this.configManager = configManager ?? new UnifiedConfigManager();
  }

  /**
   * T105: Implement provider list functionality
   * List all configured providers with their status
   */
  async list(options: ProviderCommandOptions): Promise<void> {
    const { outputFormat = 'table', verbose = false } = options;
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

    console.log(bold(green('\nConfigured Providers:')));

    switch (outputFormat) {
      case 'json':
        console.log(JSON.stringify(providers, null, 2));
        break;
      case 'list':
        this.displayAsList(providers, config.defaultProvider, verbose);
        break;
      case 'table':
      default:
        this.displayAsTable(providers, config.defaultProvider, verbose);
        break;
    }

    console.log(bold(green(`\nDefault Provider: ${config.defaultProvider || 'none'}`)));
  }

  /**
   * T106: Implement provider set functionality
   * Switch the default provider
   */
  async set(providerName: string, _options: ProviderCommandOptions): Promise<void> {
    const config = await this.configManager.loadConfig();
    const providers = config.providers || {};

    if (!providers[providerName]) {
      console.log(red(`Provider "${providerName}" not found.`));
      console.log(yellow('\nAvailable providers:'));
      Object.keys(providers).forEach((name) => {
        console.log(`  - ${name}`);
      });
      process.exit(1);
    }

    const provider = providers[providerName];
    if (!provider.enabled) {
      console.log(red(`Provider "${providerName}" is disabled.`));
      console.log(
        yellow(`Enable it first with: zulu-pilot provider config ${providerName} --enable`)
      );
      process.exit(1);
    }

    // Update default provider
    config.defaultProvider = providerName;
    await this.configManager.saveConfig(config);

    console.log(green(bold(`\nDefault provider set to: ${providerName}`)));
    console.log(`  Type: ${provider.type}`);
    console.log(`  Model: ${provider.model || 'default'}`);
  }

  /**
   * T107: Implement provider config functionality
   * Show or manage provider configuration
   */
  async config(providerName: string, options: ProviderCommandOptions): Promise<void> {
    const config = await this.configManager.loadConfig();
    const providers = config.providers || {};

    if (!providerName) {
      // List all providers if no name provided
      await this.list(options);
      return;
    }

    if (!providers[providerName]) {
      console.log(red(`Provider "${providerName}" not found.`));
      console.log(yellow('\nTo create a new provider configuration:'));
      console.log(`  zulu-pilot provider config ${providerName} --type <type> --api-key <key>`);
      process.exit(1);
    }

    const provider = providers[providerName];

    console.log(bold(green(`\nProvider Configuration: ${providerName}`)));
    console.log(bold(cyan(`Type: ${provider.type}`)));
    console.log(`Name: ${provider.name || providerName}`);
    console.log(`Enabled: ${provider.enabled !== false ? 'yes' : 'no'}`);

    if (provider.model) {
      console.log(`Model: ${provider.model}`);
    }

    if (provider.baseUrl) {
      console.log(`Base URL: ${provider.baseUrl}`);
    }

    if (provider.apiKey) {
      // Mask API key for security
      const maskedKey = provider.apiKey.startsWith('env:')
        ? provider.apiKey
        : provider.apiKey.length > 8
          ? `${provider.apiKey.substring(0, 4)}...${provider.apiKey.substring(provider.apiKey.length - 4)}`
          : '***';
      console.log(`API Key: ${maskedKey}`);
    }

    if (provider.timeout) {
      console.log(`Timeout: ${provider.timeout}ms`);
    }

    if (provider.providerSpecific && Object.keys(provider.providerSpecific).length > 0) {
      console.log(bold(cyan('\nProvider-Specific Configuration:')));
      Object.entries(provider.providerSpecific).forEach(([key, value]) => {
        console.log(`  ${key}: ${String(value)}`);
      });
    }

    if (config.defaultProvider === providerName) {
      console.log(bold(green('\n✓ This is the default provider')));
    }
  }

  /**
   * Display providers as a table
   */
  private displayAsTable(
    providers: Record<string, ProviderConfiguration>,
    defaultProvider: string,
    verbose?: boolean
  ): void {
    const headers = ['Name', 'Type', 'Status', 'Model'];
    if (verbose) {
      headers.push('Base URL', 'Enabled');
    }

    const rows = Object.entries(providers).map(([name, provider]) => {
      const isDefault = name === defaultProvider;
      const status =
        provider.enabled !== false ? (isDefault ? green('default') : 'enabled') : red('disabled');
      const row = [
        isDefault ? bold(name) : name,
        provider.type,
        status,
        provider.model || 'default',
      ];

      if (verbose) {
        row.push(provider.baseUrl || 'default');
        row.push(provider.enabled !== false ? 'yes' : 'no');
      }

      return row;
    });

    // Simple table formatting
    const columnWidths = headers.map((header, i) =>
      Math.max(header.length, ...rows.map((row) => (row[i]?.toString() || '').length))
    );

    const separator = columnWidths.map((w) => '-'.repeat(w)).join(' | ');
    const headerRow = headers.map((header, i) => bold(header.padEnd(columnWidths[i]))).join(' | ');

    console.log(cyan(headerRow));
    console.log(cyan(separator));
    rows.forEach((row) => {
      console.log(row.map((cell, i) => String(cell || '').padEnd(columnWidths[i])).join(' | '));
    });
  }

  /**
   * Display providers as a list
   */
  private displayAsList(
    providers: Record<string, ProviderConfiguration>,
    defaultProvider: string,
    verbose?: boolean
  ): void {
    Object.entries(providers).forEach(([name, provider]) => {
      const isDefault = name === defaultProvider;
      console.log(cyan(`${isDefault ? '→' : ' '} ${isDefault ? bold(name) : name}`));
      if (verbose) {
        console.log(`  Type: ${provider.type}`);
        console.log(`  Model: ${provider.model || 'default'}`);
        console.log(`  Status: ${provider.enabled !== false ? 'enabled' : 'disabled'}`);
        if (provider.baseUrl) {
          console.log(`  Base URL: ${provider.baseUrl}`);
        }
      }
    });
  }
}
/**
 * Yargs command definition for provider
 */
export const providerCommand: CommandModule = {
  command: 'provider <action> [name]',
  describe: 'Manage AI providers (list, set, config)',
  builder: (yargs: Argv): Argv =>
    yargs
      .positional('action', {
        describe: 'Action to perform (list, set, config)',
        type: 'string',
        choices: ['list', 'set', 'config'],
        demandOption: true,
      })
      .positional('name', {
        describe: 'Provider name (required for set/config actions)',
        type: 'string',
      })
      .option('output-format', {
        alias: 'o',
        type: 'string',
        choices: ['table', 'list', 'json'],
        default: 'table',
        description: 'Output format for provider list',
      })
      .option('verbose', {
        alias: 'v',
        type: 'boolean',
        default: false,
        description: 'Show more details',
      }),
  handler: async (argv) => {
    const command = new ProviderCommand();
    const action = argv.action as string;
    const name = argv.name as string | undefined;
    const options = argv as unknown as ProviderCommandOptions;

    switch (action) {
      case 'list':
        await command.list(options);
        break;
      case 'set':
        if (!name) {
          console.error(red('Provider name is required for "set" action.'));
          process.exit(1);
        }
        await command.set(name, options);
        break;
      case 'config':
        await command.config(name || '', options);
        break;
      default:
        console.error(red(`Unknown action: ${action}`));
        process.exit(1);
    }
  },
};
