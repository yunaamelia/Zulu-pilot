# Architecture Documentation

This document describes the architecture of Zulu Pilot, a multi-provider AI CLI tool built on Google's Gemini CLI framework.

## Overview

Zulu Pilot extends the Gemini CLI framework with:
- Multi-provider support (Gemini, Ollama, OpenAI, etc.)
- Enhanced context management
- Conversation checkpointing
- Custom context files
- Headless mode for automation

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Layer                             │
│  (Commands: chat, provider, model, checkpoint, context)     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Adapter Layer                             │
│  (GeminiCLIModelAdapter, MultiProviderRouter)               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Provider Layer                              │
│  (ProviderRegistry, ProviderFactory, IProvider)             │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Core Layer                                │
│  (Config, Context, Conversation, Checkpoint)                │
└─────────────────────────────────────────────────────────────┘
```

## Package Structure

```
packages/
├── core/              # Core functionality
│   ├── config/        # Configuration management
│   ├── context/       # Context management
│   ├── conversation/  # Conversation management
│   ├── checkpoint/    # Checkpoint management
│   └── parser/        # Code change parsing
├── adapter/           # Provider adapter layer
│   ├── GeminiCLIModelAdapter.ts
│   ├── MultiProviderRouter.ts
│   └── ProviderRegistry.ts
├── cli/               # CLI interface
│   ├── commands/      # Command implementations
│   ├── ui/            # UI components
│   └── utils/         # CLI utilities
└── providers/         # Provider implementations
    ├── OllamaProvider.ts
    └── ...
```

## Core Components

### 1. Configuration Management

**UnifiedConfigManager**: Manages unified configuration for all providers.

```typescript
UnifiedConfigManager
├── loadConfig() → UnifiedConfiguration
├── saveConfig(config)
├── getProviderConfig(name) → ProviderConfiguration
└── mergeEnvironmentVariables(config) → UnifiedConfiguration
```

**Configuration Storage**: `~/.zulu-pilot/config.json`

**Features**:
- Environment variable overrides
- Provider-specific configurations
- Default provider/model selection

### 2. Context Management

**ContextManager**: Manages conversation context and file context.

```typescript
ContextManager
├── addFileContext(filePath, content)
├── removeFileContext(filePath)
├── getContext() → Content[]
├── clearContext()
└── checkTokenLimit(limit) → TokenLimitStatus
```

**ContextFileLoader**: Loads custom context files from projects.

```typescript
ContextFileLoader
├── discoverContextFiles() → LoadedContextFile[]
├── loadContext() → string
└── listContextFiles() → string[]
```

**Supported Context Files**:
- `.zulu-pilot-context.md`
- `ZULU-PILOT.md`
- `GEMINI.md`

### 3. Provider System

**ProviderRegistry**: Registers and manages providers.

```typescript
ProviderRegistry
├── registerProvider(name, config)
├── registerFactory(type, factory)
├── getProvider(name) → IProvider
└── listProviders() → string[]
```

**MultiProviderRouter**: Routes requests to appropriate providers.

```typescript
MultiProviderRouter
├── routeRequest(request) → Response
├── getProvider(name) → IProvider
└── getDefaultProvider() → IProvider
```

**Provider Interface**:
```typescript
interface IProvider {
  generateContent(request): Promise<Response>;
  // Provider-specific methods
}
```

### 4. Adapter Layer

**GeminiCLIModelAdapter**: Adapter that integrates with Gemini CLI framework.

```typescript
GeminiCLIModelAdapter
├── generateContent(request) → Response
├── callTool(invocation) → ToolResult
└── getRouter() → MultiProviderRouter
```

**Integration Points**:
- Replaces default Gemini client
- Routes through MultiProviderRouter
- Manages context through ContextManager

### 5. Conversation Management

**ConversationManager**: Manages conversation history.

```typescript
ConversationManager
├── getHistory(curated?) → Content[]
├── addHistory(content)
├── setHistory(history)
├── clearHistory()
└── loadCustomContext() → string
```

**CheckpointManager**: Manages conversation checkpoints.

```typescript
CheckpointManager
├── saveCheckpoint(checkpoint)
├── loadCheckpoint(id) → Checkpoint
├── listCheckpoints() → Checkpoint[]
└── deleteCheckpoint(id)
```

**Checkpoint Storage**: `~/.zulu-pilot/checkpoints/`

### 6. Tools System

Tools extend AI capabilities:

- **CodeEditTool**: Proposes and applies code changes
- **WebSearchTool**: Performs web searches
- **FileSearchTool**: Searches files in workspace

**Tool Interface**:
```typescript
interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema;
  invoke(params): Promise<ToolResult>;
}
```

## Data Flow

### Interactive Chat Flow

```
User Input
    ↓
ChatCommand.run()
    ↓
GeminiCLIModelAdapter.generateContent()
    ↓
MultiProviderRouter.routeRequest()
    ↓
Provider.generateContent()
    ↓
Response
    ↓
ContextManager.addHistory()
    ↓
Display to User
```

### Context Loading Flow

```
ChatCommand.initialize()
    ↓
ConversationManager.loadCustomContext()
    ↓
ContextFileLoader.loadContext()
    ↓
Discover context files (root + subdirectories)
    ↓
Merge contexts (priority: subdirectory > root)
    ↓
Inject as system message
```

### Checkpoint Save Flow

```
User: checkpoint save "name"
    ↓
CheckpointCommand.handleSave()
    ↓
createConversationCheckpoint()
    ↓
CheckpointManager.saveCheckpoint()
    ↓
Save to ~/.zulu-pilot/checkpoints/{id}.json
```

## Design Patterns

### 1. Adapter Pattern

**GeminiCLIModelAdapter** adapts the multi-provider system to Gemini CLI's expected interface.

### 2. Factory Pattern

**ProviderFactory** creates provider instances based on type.

### 3. Strategy Pattern

Different providers implement the same **IProvider** interface with different strategies.

### 4. Registry Pattern

**ProviderRegistry** maintains a registry of available providers.

### 5. Router Pattern

**MultiProviderRouter** routes requests to the appropriate provider.

## Extension Points

### Adding a New Provider

1. Implement `IProvider` interface
2. Register factory in `ProviderRegistry`
3. Add provider configuration to `UnifiedConfiguration`

### Adding a New Tool

1. Implement `Tool` interface
2. Register in `ToolRegistry`
3. Tools are automatically available to AI

### Adding a New Command

1. Create command class implementing `CommandModule`
2. Export from `packages/cli/src/commands/index.ts`
3. Register in main CLI entry point

## Performance Considerations

### Caching

- Provider instances cached in `ProviderRegistry`
- Context file content cached during session
- Checkpoint metadata cached on load

### Optimization Opportunities

1. **Adapter conversion**: Batch convert requests/responses
2. **Context loading**: Lazy load context files
3. **Streaming**: Support streaming responses
4. **Token estimation**: Cache token estimates

## Security Considerations

### Configuration Security

- API keys stored in user config directory
- Environment variables override file config
- No secrets in logs or error messages

### File Operations

- Validate file paths to prevent directory traversal
- Check file permissions before reading/writing
- Backup files before modifications

### Provider Communication

- HTTPS for all external provider APIs
- Timeout handling for provider requests
- Error handling without exposing sensitive data

## Testing Strategy

### Unit Tests

- Individual components tested in isolation
- Mock dependencies for external services
- Target: 90%+ code coverage

### Integration Tests

- Test component interactions
- Test with real providers (mocked when needed)
- Test configuration loading/saving

### E2E Tests

- Test full workflows
- Test CLI commands
- Test user scenarios

## Future Enhancements

1. **Plugin System**: Allow third-party extensions
2. **Streaming Support**: Real-time response streaming
3. **Performance Monitoring**: Track and optimize performance
4. **Multi-language Support**: Support for different languages
5. **Distributed Mode**: Support for distributed provider instances

---

**Last Updated**: 2024
**Version**: 2.0.0

