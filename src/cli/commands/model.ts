import { ConfigManager } from '../../core/config/ConfigManager.js';

/**
 * Available models for each provider.
 */
const AVAILABLE_MODELS: Record<string, string[]> = {
  ollama: ['qwen2.5-coder', 'llama3.2', 'mistral', 'codellama', 'deepseek-coder'],
  gemini: ['gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  googleCloud: [
    'deepseek-ai/deepseek-v3.1-maas',
    'qwen/qwen3-coder-480b-a35b-instruct-maas',
    'deepseek-ai/deepseek-r1-0528-maas',
    'moonshotai/kimi-k2-thinking-maas',
    'openai/gpt-oss-120b-maas',
    'meta/llama-3.1-405b-instruct-maas',
  ],
};

/**
 * Model command handler.
 */
export async function handleModelCommand(options: { list?: boolean; set?: string }): Promise<void> {
  const configManager = new ConfigManager();
  const config = await configManager.load();

  if (options.list) {
    // List available models
    console.log('Available models by provider:');
    console.log(`\n  Default: ${config.model ?? 'qwen2.5-coder'}`);

    // Show configured provider-specific models
    console.log('\n  Configured provider models:');
    if (config.providers) {
      for (const [providerName, providerConfig] of Object.entries(config.providers)) {
        if (providerConfig.model) {
          console.log(`    ${providerName}: ${providerConfig.model}`);
        }
      }
    }

    // Show all available models for each provider
    console.log('\n  All available models:');
    for (const [providerName, models] of Object.entries(AVAILABLE_MODELS)) {
      console.log(`\n    ${providerName}:`);
      for (const model of models) {
        const isConfigured =
          config.providers?.[providerName]?.model === model ? ' (configured)' : '';
        console.log(`      - ${model}${isConfigured}`);
      }
    }

    // Show Google Cloud model details
    console.log('\n  Google Cloud AI Platform models:');
    console.log('    DeepSeek V3.1: deepseek-ai/deepseek-v3.1-maas (us-west2)');
    console.log('    Qwen Coder: qwen/qwen3-coder-480b-a35b-instruct-maas (us-south1)');
    console.log('    DeepSeek R1: deepseek-ai/deepseek-r1-0528-maas (us-central1)');
    console.log('    Kimi K2: moonshotai/kimi-k2-thinking-maas (global)');
    console.log('    GPT OSS 120B: openai/gpt-oss-120b-maas (us-central1)');
    console.log('    Llama 3.1: meta/llama-3.1-405b-instruct-maas (us-central1)');
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
