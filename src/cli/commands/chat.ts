import { ConfigManager } from '../../core/config/ConfigManager.js';
import { OllamaProvider } from '../../core/llm/OllamaProvider.js';
import { StreamHandler } from '../ui/stream.js';
import { ConnectionError } from '../../utils/errors.js';
import { validateProviderName } from '../../utils/validators.js';
import { getContextManager } from './add.js';

/**
 * Chat command handler.
 */
export async function handleChatCommand(prompt?: string, providerOverride?: string): Promise<void> {
  const configManager = new ConfigManager();
  const config = await configManager.load();

  // Determine provider
  const providerName = providerOverride ?? config.provider;

  // Validate provider
  try {
    validateProviderName(providerName);
  } catch {
    console.error(`Error: Invalid provider "${providerName}"`);
    process.exit(1);
  }

  // For Phase 3, only support Ollama
  if (providerName !== 'ollama') {
    console.error(
      `Error: Provider "${providerName}" not yet implemented. Only "ollama" is supported in Phase 3.`
    );
    process.exit(1);
  }

  // Get provider config
  const providerConfig = await configManager.getProviderConfig('ollama');
  const model = providerConfig?.model ?? config.model ?? 'qwen2.5-coder';

  // Initialize provider
  const provider = new OllamaProvider({
    baseUrl: providerConfig?.baseUrl as string | undefined,
    model,
  });

  // Get prompt from user if not provided
  const userPrompt = prompt;
  if (!userPrompt) {
    // For Phase 3, simple prompt input
    // In future phases, this will be interactive
    console.error('Error: Prompt is required. Usage: zulu-pilot chat "your question"');
    process.exit(1);
  }

  // Get context from context manager
  const contextManager = getContextManager();
  const context = contextManager.getContext();

  // Check token limit and warn if approaching
  const warning = contextManager.checkTokenLimit(32000); // Default 32k limit
  if (warning) {
    console.warn(`⚠ ${warning}`);
  }

  // Stream response with context
  const streamHandler = new StreamHandler();
  try {
    await streamHandler.streamToStdout(provider.streamResponse(userPrompt, context));
  } catch (error) {
    if (error instanceof ConnectionError) {
      console.error(`\nError: ${error.getUserMessage()}`);
      process.exit(1);
    }
    throw error;
  }
}
