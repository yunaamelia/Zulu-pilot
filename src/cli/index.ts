import { Command } from 'commander';
import { validateProviderName } from '../utils/validators.js';
import { ValidationError } from '../utils/errors.js';

const program = new Command();

/**
 * Main CLI entry point.
 */
async function main(): Promise<void> {
  program
    .name('zulu-pilot')
    .description('CLI coding assistant with multi-provider AI model support')
    .version('0.1.0')
    .option(
      '--provider <provider>',
      'Override default provider (ollama, gemini, openai, googleCloud)'
    )
    .option('--config <path>', 'Path to configuration file', '~/.zulu-pilotrc');

  // Chat command (placeholder - will be implemented in Phase 3)
  program
    .command('chat')
    .description('Start interactive chat with AI model')
    .argument('[prompt]', 'Initial prompt (optional)')
    .action(async (prompt?: string) => {
      const opts = program.opts();
      const provider = opts.provider;

      // Validate provider if provided
      if (provider) {
        try {
          validateProviderName(provider);
        } catch (error) {
          if (error instanceof ValidationError) {
            console.error(`Error: ${error.getUserMessage()}`);
            process.exit(1);
          }
          throw error;
        }
      }

      console.log('Chat command - coming in Phase 3');
      if (provider) {
        console.log(`Using provider: ${provider}`);
      }
      if (prompt) {
        console.log(`Prompt: ${prompt}`);
      }
    });

  // Model command (placeholder - will be implemented in Phase 3)
  program
    .command('model')
    .description('List or change AI models')
    .option('-l, --list', 'List available models')
    .option('-s, --set <model>', 'Set default model')
    .action(async (options) => {
      console.log('Model command - coming in Phase 3');
      if (options.list) {
        console.log('Available models will be listed here');
      }
      if (options.set) {
        console.log(`Setting model to: ${options.set}`);
      }
    });

  // Parse command line arguments
  await program.parseAsync(process.argv);

  // If no command provided, show help
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

// Run CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
