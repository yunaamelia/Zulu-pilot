# Quickstart Guide: Zulu Pilot v2

**Feature**: 002-gemini-cli-rebuild  
**Date**: 2025-11-22

## Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 10.0.0 or higher (bundled with Node.js 18+)
- **Git**: For cloning and managing the repository
- **At least one AI provider**:
  - Ollama (local) - requires Ollama installed and running
  - OpenAI - requires API key
  - Google Cloud - requires service account credentials
  - Gemini API - requires API key

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/yunaamelia/Zulu-pilot.git
cd Zulu-pilot
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# This will install dependencies for all packages in the monorepo
```

### 3. Build All Packages

```bash
# Build all packages
npm run build

# Or build specific package
npm run build --workspace=@zulu-pilot/adapter
```

### 4. Verify Installation

```bash
# Run tests to verify everything works
npm test

# Check CLI is available
npx zulu-pilot --version
```

## Initial Configuration

### 1. Create Configuration File

Create `~/.zulu-pilotrc` (or `%USERPROFILE%\.zulu-pilotrc` on Windows):

```json
{
  "defaultProvider": "ollama",
  "defaultModel": "llama-3.1",
  "providers": {
    "ollama": {
      "type": "ollama",
      "name": "Ollama Local",
      "baseUrl": "http://localhost:11434",
      "model": "llama-3.1",
      "timeout": 30000,
      "enabled": true
    },
    "openai": {
      "type": "openai",
      "name": "OpenAI",
      "apiKey": "env:OPENAI_API_KEY",
      "baseUrl": "https://api.openai.com/v1",
      "model": "gpt-4",
      "timeout": 60000,
      "enabled": true
    }
  },
  "geminiCLI": {
    "tools": {
      "googleSearch": {
        "enabled": false
      }
    }
  }
}
```

### 2. Set Environment Variables

For cloud providers, set API keys in environment variables:

```bash
# OpenAI
export OPENAI_API_KEY="sk-..."

# Google Cloud (if using service account)
export GOOGLE_APPLICATION_CREDENTIALS="./path/to/credentials.json"

# Gemini API
export GEMINI_API_KEY="..."
```

Or create `.env` file in project root (not committed to git):

```env
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
```

### 3. Verify Configuration

```bash
# List configured providers
zulu-pilot provider --list

# Test provider connection
zulu-pilot chat --provider ollama --prompt "Hello, test connection"
```

## Basic Usage

### Interactive Chat

```bash
# Start interactive chat with default provider
zulu-pilot

# Start chat with specific provider
zulu-pilot --provider openai

# Start chat with specific model
zulu-pilot --provider ollama --model llama-3.1
```

### Add Files to Context

```bash
# Add single file
zulu-pilot add src/utils/helpers.ts

# Add multiple files
zulu-pilot add src/**/*.ts

# Add files with glob pattern
zulu-pilot add "src/**/*.{ts,tsx}"
```

### View Context

```bash
# List all files in context
zulu-pilot context

# Show context summary
zulu-pilot context --show
```

### Clear Context

```bash
# Clear all files from context
zulu-pilot clear
```

### Provider Management

```bash
# List all configured providers
zulu-pilot provider --list

# Set default provider
zulu-pilot provider --set openai

# Configure provider
zulu-pilot provider --config ollama
```

### Model Management

```bash
# List available models for default provider
zulu-pilot model --list

# List models for specific provider
zulu-pilot model --list --provider ollama

# Set default model
zulu-pilot model --set gpt-4 --provider openai
```

### Code Changes

```bash
# Request code changes (interactive)
zulu-pilot
# Then type: "add error handling to src/api/users.ts"
# Review diff and approve/reject

# In headless mode (non-interactive)
zulu-pilot --headless --prompt "add error handling to src/api/users.ts" --output-format json
```

### Checkpoints

```bash
# Save conversation checkpoint
zulu-pilot checkpoint --save my-session

# List all checkpoints
zulu-pilot checkpoint --list

# Resume from checkpoint
zulu-pilot --resume my-session

# Delete checkpoint
zulu-pilot checkpoint --delete my-session
```

## Development Workflow

### 1. Setup Development Environment

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run in watch mode (auto-rebuild on changes)
npm run dev
```

### 2. Run Tests

```bash
# Run all tests
npm test

# Run tests for specific package
npm test --workspace=@zulu-pilot/adapter

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### 3. Linting and Formatting

```bash
# Lint all packages
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### 4. Type Checking

```bash
# Type check all packages
npm run type-check

# Type check specific package
npm run type-check --workspace=@zulu-pilot/adapter
```

## Project Structure

```
zulu-pilot-v2/
├── packages/
│   ├── cli/              # CLI interface (fork from Gemini CLI)
│   ├── core/             # Core engine (fork from Gemini CLI)
│   ├── adapter/          # Custom model adapter layer
│   └── providers/        # Custom model providers
├── tests/                # Integration tests
└── scripts/              # Build & dev scripts
```

## Common Tasks

### Adding a New Provider

1. Create provider file in `packages/providers/src/`:

   ```typescript
   // packages/providers/src/NewProvider.ts
   import { IModelProvider } from './IModelProvider';

   export class NewProvider implements IModelProvider {
     // Implement interface methods
   }
   ```

2. Register provider in `ProviderRegistry`:

   ```typescript
   // packages/adapter/src/ProviderRegistry.ts
   registry.register('newProvider', new NewProvider(config), config);
   ```

3. Add provider type to configuration schema:

   ```json
   // contracts/configuration.schema.json
   "type": {
     "enum": [..., "newProvider"]
   }
   ```

4. Write tests:
   ```typescript
   // tests/unit/providers/NewProvider.test.ts
   describe('NewProvider', () => {
     // Test implementation
   });
   ```

### Modifying Gemini CLI Core

1. Make changes in `packages/core/`
2. Ensure changes maintain compatibility with Gemini CLI's expected interfaces
3. Test with all tools (file operations, Google Search, MCP servers)
4. Document breaking changes (if any)

### Updating from Gemini CLI Upstream

1. Pull latest from Gemini CLI:

   ```bash
   git subtree pull --prefix=packages/core https://github.com/google-gemini/gemini-cli.git main --squash
   ```

2. Resolve conflicts if any
3. Test all functionality
4. Update adapter if interface changes

## Troubleshooting

### Provider Connection Errors

**Error**: "Cannot connect to Ollama"

**Solution**:

```bash
# Check Ollama is running
ollama serve

# Or check OLLAMA_HOST environment variable
echo $OLLAMA_HOST
```

**Error**: "Invalid API key for OpenAI"

**Solution**:

```bash
# Check environment variable
echo $OPENAI_API_KEY

# Or update config
zulu-pilot config --set "providers.openai.apiKey=sk-..."
```

### Configuration Issues

**Error**: "Provider not found"

**Solution**:

```bash
# List configured providers
zulu-pilot provider --list

# Verify provider name matches config
cat ~/.zulu-pilotrc
```

### Build Issues

**Error**: "Cannot find module '@zulu-pilot/core'"

**Solution**:

```bash
# Rebuild all packages
npm run build

# Or install dependencies
npm install
```

## Next Steps

1. **Read the full specification**: [spec.md](./spec.md)
2. **Review the implementation plan**: [plan.md](./plan.md)
3. **Understand the data model**: [data-model.md](./data-model.md)
4. **Check contract interfaces**: [contracts/](./contracts/)
5. **Start development**: Follow the implementation phases in plan.md

## Getting Help

- **Documentation**: See `docs/` directory
- **Issues**: Create GitHub issue
- **Questions**: Check existing issues or create new one

## Examples

### Example 1: Basic Chat

```bash
# Start chat
zulu-pilot

# In chat, type:
> Explain what this codebase does

# AI will respond using default provider
```

### Example 2: Context-Aware Assistance

```bash
# Add files to context
zulu-pilot add src/**/*.ts

# Start chat
zulu-pilot

# Ask about codebase
> How does the adapter pattern work in this codebase?
```

### Example 3: Code Modification

```bash
# Start chat
zulu-pilot

# Request code change
> Add error handling to src/api/users.ts

# Review diff (shown in terminal)
# Approve: y
# Reject: n
```

### Example 4: Provider Switching

```bash
# Start with Ollama
zulu-pilot --provider ollama

# In chat, switch provider
> /switch-provider openai

# Continue conversation with OpenAI
```

### Example 5: Headless Mode

```bash
# Run in headless mode for automation
zulu-pilot --headless \
  --prompt "Review this code for security issues" \
  --output-format json \
  > review-results.json
```
