# API Documentation

Complete API reference for Zulu Pilot packages and modules.

## Core Package (`@zulu-pilot/core`)

### Configuration

#### `UnifiedConfiguration`

Main configuration interface for Zulu Pilot.

```typescript
interface UnifiedConfiguration {
  defaultProvider: string;
  defaultModel?: string;
  providers: Record<string, ProviderConfiguration>;
  geminiCLI?: {
    mcpServers?: Record<string, MCPServerConfig>;
  };
}
```

#### `UnifiedConfigManager`

Manages unified configuration loading and saving.

```typescript
class UnifiedConfigManager {
  async loadConfig(): Promise<UnifiedConfiguration>;
  async saveConfig(config: UnifiedConfiguration): Promise<void>;
  getProviderConfig(providerName: string): ProviderConfiguration | undefined;
  setProviderConfig(providerName: string, config: ProviderConfiguration): void;
  getConfig(): UnifiedConfiguration;
}
```

**Usage**:
```typescript
import { UnifiedConfigManager } from '@zulu-pilot/core';

const manager = new UnifiedConfigManager();
const config = await manager.loadConfig();
```

### Context Management

#### `ContextManager`

Manages conversation context and file context.

```typescript
class ContextManager {
  addFileContext(filePath: string, content: string): void;
  removeFileContext(filePath: string): void;
  getContext(): Content[];
  clearContext(): void;
  checkTokenLimit(limit: number): TokenLimitStatus;
}
```

**Usage**:
```typescript
import { ContextManager } from '@zulu-pilot/core';

const contextManager = new ContextManager();
contextManager.addFileContext('src/main.ts', fileContent);
const context = contextManager.getContext();
```

#### `ContextFileLoader`

Loads custom context files from projects.

```typescript
class ContextFileLoader {
  constructor(config?: ContextFileLoaderConfig);
  async discoverContextFiles(startDir?: string, currentDepth?: number): Promise<LoadedContextFile[]>;
  async loadContext(): Promise<string>;
  async listContextFiles(): Promise<string[]>;
  hasRootContextFile(): Promise<boolean>;
}
```

**Usage**:
```typescript
import { ContextFileLoader } from '@zulu-pilot/core';

const loader = new ContextFileLoader({ baseDir: process.cwd() });
const context = await loader.loadContext();
```

### Conversation Management

#### `ConversationManager`

Manages conversation history and checkpoints.

```typescript
class ConversationManager {
  constructor(config: Config, getChatFn: () => GeminiChat);
  getHistory(curated?: boolean): Content[];
  addHistory(content: Content): void;
  setHistory(history: Content[]): void;
  clearHistory(): void;
  async loadCustomContext(): Promise<string>;
  async initializeWithContext(): Promise<void>;
}
```

### Checkpoint Management

#### `CheckpointManager`

Manages conversation checkpoints.

```typescript
class CheckpointManager {
  constructor(config?: CheckpointManagerConfig);
  async saveCheckpoint(checkpoint: ConversationCheckpoint): Promise<void>;
  async loadCheckpoint(checkpointId: string): Promise<ConversationCheckpoint | null>;
  async listCheckpoints(): Promise<Array<Pick<ConversationCheckpoint, ...>>>;
  async deleteCheckpoint(checkpointId: string): Promise<boolean>;
}
```

**Usage**:
```typescript
import { CheckpointManager, createConversationCheckpoint } from '@zulu-pilot/core';

const manager = new CheckpointManager();
const checkpoint = createConversationCheckpoint({
  name: 'My Checkpoint',
  history: conversationHistory,
});
await manager.saveCheckpoint(checkpoint);
```

## Adapter Package (`@zulu-pilot/adapter`)

### `GeminiCLIModelAdapter`

Adapter for integrating with Gemini CLI.

```typescript
class GeminiCLIModelAdapter {
  constructor(router: MultiProviderRouter, config: UnifiedConfiguration, contextManager?: ContextManager);
  async generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse>;
  async callTool(toolInvocation: ToolInvocation): Promise<ToolResult>;
  getRouter(): MultiProviderRouter;
}
```

### `MultiProviderRouter`

Routes requests to appropriate providers.

```typescript
class MultiProviderRouter {
  constructor(registry: ProviderRegistry, config: UnifiedConfiguration);
  async routeRequest(request: GenerateContentRequest): Promise<GenerateContentResponse>;
  getProvider(name: string): IProvider | undefined;
}
```

### `ProviderRegistry`

Registers and manages providers.

```typescript
class ProviderRegistry {
  registerProvider(name: string, config: ProviderConfiguration): void;
  registerFactory(type: string, factory: ProviderFactory): void;
  getProvider(name: string): IProvider | undefined;
  listProviders(): string[];
}
```

## CLI Package (`@zulu-pilot/cli`)

### Commands

#### `ChatCommand`

Main chat command implementation.

```typescript
class ChatCommand {
  constructor(config: Config);
  async run(options: ChatCommandOptions): Promise<void>;
  async switchProvider(providerName: string): Promise<void>;
  getContextManager(): ContextManager;
}
```

#### `OutputFormatter`

Formats output for different formats (text, json, stream-json).

```typescript
class OutputFormatter {
  constructor(config: OutputFormatterConfig);
  formatResponse(content: Content | Content[] | string, metadata?: {...}): string;
  getFormat(): OutputFormat;
  isJSONMode(): boolean;
}
```

**Usage**:
```typescript
import { OutputFormatter } from '@zulu-pilot/cli';

const formatter = new OutputFormatter({ format: 'json' });
const jsonOutput = formatter.formatResponse(response, {
  provider: 'gemini',
  model: 'gemini-pro',
});
```

## Tools

### `CodeEditTool`

Tool for proposing and applying code changes.

```typescript
class CodeEditTool implements Tool {
  readonly name = 'code_edit';
  async invoke(params: { response: string }): Promise<ToolResult>;
}
```

### `WebSearchTool`

Tool for performing web searches.

```typescript
class WebSearchTool implements Tool {
  readonly name = 'web_search';
  async invoke(params: { query: string }): Promise<ToolResult>;
}
```

## Types

### `ProviderConfiguration`

```typescript
interface ProviderConfiguration {
  type: string;
  name: string;
  enabled?: boolean;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  // ... provider-specific options
}
```

### `ConversationCheckpoint`

```typescript
interface ConversationCheckpoint {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  lastAccessedAt?: string;
  history: Content[];
  context?: {
    files?: string[];
    metadata?: Record<string, unknown>;
  };
  provider?: {
    providerName: string;
    modelName?: string;
  };
  workspaceRoot?: string;
}
```

### `ToolResult`

```typescript
interface ToolResult {
  output?: string;
  error?: {
    type: string;
    display: string;
    raw?: string;
  };
}
```

## Error Handling

### `ValidationError`

Thrown when validation fails.

```typescript
class ValidationError extends Error {
  constructor(message: string, field: string);
  field: string;
}
```

### `ConnectionError`

Thrown when connection to provider fails.

```typescript
class ConnectionError extends Error {
  constructor(message: string, provider: string);
  provider: string;
}
```

## Examples

### Basic Usage

```typescript
import { UnifiedConfigManager, ContextManager } from '@zulu-pilot/core';
import { GeminiCLIModelAdapter, MultiProviderRouter, ProviderRegistry } from '@zulu-pilot/adapter';

// Load configuration
const configManager = new UnifiedConfigManager();
const config = await configManager.loadConfig();

// Setup providers
const registry = new ProviderRegistry();
const router = new MultiProviderRouter(registry, config);

// Create adapter
const contextManager = new ContextManager();
const adapter = new GeminiCLIModelAdapter(router, config, contextManager);

// Generate content
const response = await adapter.generateContent({
  contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
});
```

### Custom Provider Registration

```typescript
import { ProviderRegistry } from '@zulu-pilot/adapter';

const registry = new ProviderRegistry();

registry.registerFactory('custom', (config) => {
  return new CustomProvider(config);
});

registry.registerProvider('my-provider', {
  type: 'custom',
  name: 'my-provider',
  apiKey: 'my-key',
});
```

## Environment Variables

- `ZULU_PILOT_HEADLESS`: Enable headless mode
- `ZULU_PILOT_OUTPUT_FORMAT`: Output format (text/json/stream-json)
- `ZULU_PILOT_PROVIDER`: Default provider
- `ZULU_PILOT_MODEL`: Default model

---

**Last Updated**: 2024
**Version**: 2.0.0

