import { ConfigManager } from '../../core/config/ConfigManager.js';

/**
 * Model command handler.
 */
export async function handleModelCommand(options: { list?: boolean; set?: string }): Promise<void> {
  const configManager = new ConfigManager();
  const config = await configManager.load();

  if (options.list) {
    // List available models
    console.log('Available models:');
    console.log(`  Default: ${config.model ?? 'qwen2.5-coder'}`);
    console.log('\nProvider-specific models:');
    if (config.providers) {
      for (const [providerName, providerConfig] of Object.entries(config.providers)) {
        if (providerConfig.model) {
          console.log(`  ${providerName}: ${providerConfig.model}`);
        }
      }
    }
  } else if (options.set) {
    // Set default model
    config.model = options.set;
    await configManager.save(config);
    console.log(`Default model set to: ${options.set}`);
  } else {
    // Show current model
    console.log(`Current default model: ${config.model ?? 'qwen2.5-coder'}`);
  }
}
