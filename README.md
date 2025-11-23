# Zulu Pilot

A powerful CLI tool for interacting with multiple AI model providers through a unified interface. Built on top of Google's Gemini CLI framework, Zulu Pilot extends functionality with multi-provider support, context management, and advanced features for developers.

## Features

### 🎯 Core Features

- **Multi-Provider Support**: Seamlessly switch between different AI providers (Gemini, Ollama, OpenAI, and more)
- **Interactive Chat**: Rich, interactive chat interface with conversation history
- **Context Management**: Intelligent context loading from files and project structure
- **File Operations**: Read, write, and search files with AI assistance
- **Code Change Proposals**: AI can propose code changes with diff preview and approval workflow

### 🚀 Advanced Features

- **Conversation Checkpointing**: Save and resume conversations from checkpoints
- **Custom Context Files**: Project-specific context files (`.zulu-pilot-context.md`, `GEMINI.md`)
- **Headless Mode**: Run in non-interactive mode for scripting and automation
- **MCP Server Integration**: Integrate with Model Context Protocol servers
- **Google Search Integration**: Web search capabilities for AI conversations

### 📦 Provider Support

- **Google Gemini**: Native integration with Gemini CLI
- **Ollama**: Local model support via Ollama
- **OpenAI**: GPT models support
- **Custom Providers**: Extensible architecture for adding new providers

## Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Install from Source

```bash
git clone <repository-url>
cd zulu-pilot
npm install
npm run build
npm link  # Optional: link globally
```

## Quick Start

### Basic Usage

```bash
# Start interactive chat
zulu-pilot chat

# Use specific provider
zulu-pilot chat --provider ollama --model qwen2.5-coder

# Headless mode with prompt
zulu-pilot chat --headless --prompt "Explain this code" --output-format json

# Resume from checkpoint
zulu-pilot chat --resume checkpoint-id

# List available checkpoints
zulu-pilot checkpoint list

# Save current conversation as checkpoint
zulu-pilot checkpoint save "My Checkpoint"
```

### Provider Configuration

```bash
# List available providers
zulu-pilot provider list

# Add new provider
zulu-pilot provider add ollama \
  --type ollama \
  --base-url http://localhost:11434 \
  --model qwen2.5-coder

# Switch default provider
zulu-pilot provider set-default ollama
```

### Model Management

```bash
# List models for a provider
zulu-pilot model list --provider ollama

# Set model for provider
zulu-pilot model set --provider ollama --model qwen2.5-coder
```

### Context Management

Create a `.zulu-pilot-context.md` file in your project root:

```markdown
# Project Context

## Overview
This is a TypeScript project using React and Node.js.

## Architecture
- Backend: Express.js API
- Frontend: React with TypeScript
- Database: PostgreSQL

## Coding Standards
- Use TypeScript strict mode
- Follow ESLint rules
- Write tests for all features
```

The AI will automatically use this context in all conversations within the project.

## Architecture

Zulu Pilot is built with a modular architecture:

```
packages/
├── core/          # Core functionality (context, config, conversation)
├── adapter/       # Provider adapter layer
├── cli/           # CLI interface and commands
└── providers/     # Provider implementations
```

### Key Components

- **MultiProviderRouter**: Routes requests to appropriate providers
- **GeminiCLIModelAdapter**: Adapter for Gemini CLI integration
- **ContextManager**: Manages conversation context and file context
- **CheckpointManager**: Handles conversation checkpointing
- **ContextFileLoader**: Loads custom context files from projects

## Configuration

Configuration is stored in `~/.zulu-pilot/config.json`:

```json
{
  "defaultProvider": "gemini",
  "defaultModel": "gemini-pro",
  "providers": {
    "gemini": {
      "type": "gemini",
      "name": "gemini",
      "apiKey": "your-api-key"
    },
    "ollama": {
      "type": "ollama",
      "name": "ollama",
      "baseUrl": "http://localhost:11434",
      "model": "qwen2.5-coder"
    }
  }
}
```

### Environment Variables

For headless/automation mode:

```bash
export ZULU_PILOT_HEADLESS=true
export ZULU_PILOT_OUTPUT_FORMAT=json
export ZULU_PILOT_PROVIDER=ollama
export ZULU_PILOT_MODEL=qwen2.5-coder
```

## Commands

### Chat Commands

- `zulu-pilot chat` - Start interactive chat
- `zulu-pilot chat --provider <name>` - Use specific provider
- `zulu-pilot chat --headless --prompt "<text>"` - Headless mode
- `zulu-pilot chat --resume <checkpoint-id>` - Resume from checkpoint

### Provider Commands

- `zulu-pilot provider list` - List all providers
- `zulu-pilot provider add <name>` - Add new provider
- `zulu-pilot provider remove <name>` - Remove provider
- `zulu-pilot provider set-default <name>` - Set default provider

### Model Commands

- `zulu-pilot model list --provider <name>` - List models
- `zulu-pilot model set --provider <name> --model <model>` - Set model

### Checkpoint Commands

- `zulu-pilot checkpoint save <name>` - Save checkpoint
- `zulu-pilot checkpoint list` - List checkpoints
- `zulu-pilot checkpoint delete <id>` - Delete checkpoint

### Context Commands

- `zulu-pilot context add <file>` - Add file to context
- `zulu-pilot context list` - List context files
- `zulu-pilot context clear` - Clear context

### MCP Commands

- `zulu-pilot mcp add <name>` - Add MCP server
- `zulu-pilot mcp list` - List MCP servers
- `zulu-pilot mcp remove <name>` - Remove MCP server

## Development

### Project Structure

```
.
├── packages/
│   ├── core/              # Core functionality
│   ├── adapter/           # Provider adapters
│   ├── cli/               # CLI interface
│   └── providers/         # Provider implementations
├── tests/                 # Test suite
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # End-to-end tests
├── specs/                 # Specifications and planning
└── docs/                  # Documentation
```

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

### Building

```bash
# Build all packages
npm run build

# Watch mode
npm run build:watch
```

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

[License Type] - See LICENSE file for details

## Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)
- Discussions: [GitHub Discussions](https://github.com/your-repo/discussions)

## Roadmap

- [ ] Additional provider implementations
- [ ] Enhanced context management
- [ ] Performance optimizations
- [ ] Extended MCP server support
- [ ] Plugin system

## Acknowledgments

Built on top of Google's Gemini CLI framework with extensions for multi-provider support and enhanced developer experience.

