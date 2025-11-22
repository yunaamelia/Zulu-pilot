# Zulu Pilot Usage Examples

## Basic Chat

### Local Model (Ollama)

```bash
# Start Ollama
ollama serve

# Pull a model
ollama pull qwen2.5-coder

# Chat with local model
zulu-pilot chat "How do I sort an array in TypeScript?"
```

### Remote Model (Gemini)

```bash
# Configure in ~/.zulu-pilotrc
{
  "provider": "gemini",
  "gemini": {
    "apiKey": "your-api-key"
  }
}

# Chat with Gemini
zulu-pilot chat "Explain async/await in JavaScript"
```

## Context-Aware Assistance

### Adding Files to Context

```bash
# Add a single file
zulu-pilot add src/utils.ts

# Add multiple files with glob pattern
zulu-pilot add src/**/*.ts

# View current context
zulu-pilot context

# Clear context
zulu-pilot clear --yes
```

### Asking Questions About Code

```bash
# Add files to context
zulu-pilot add src/components/Button.tsx

# Ask about the code
zulu-pilot chat "What does the Button component do?"
```

## Provider Switching

### Using Command Flag

```bash
# Use Ollama
zulu-pilot chat --provider ollama "Hello"

# Switch to Gemini
zulu-pilot chat --provider gemini "Hello"

# Switch to OpenAI
zulu-pilot chat --provider openai "Hello"
```

### Configuration-Based

```json
{
  "provider": "ollama",
  "ollama": {
    "model": "qwen2.5-coder"
  },
  "gemini": {
    "apiKey": "env:GEMINI_API_KEY"
  },
  "openai": {
    "apiKey": "env:OPENAI_API_KEY",
    "baseUrl": "https://api.openai.com/v1",
    "model": "gpt-4"
  }
}
```

## Agentic File Modification

### Proposing Code Changes

```bash
# Ask AI to modify code
zulu-pilot chat "Add error handling to the calculate function in src/math.ts"

# AI will:
# 1. Show a diff of proposed changes
# 2. Ask for approval (y/n)
# 3. Apply changes if approved
# 4. Create backup in .zulu-pilot-backups/
```

### Example Interaction

```
$ zulu-pilot chat "Add JSDoc comments to the add function"

[AI streams response...]

--- Proposed change for src/utils.ts ---
@@ -1,3 +1,7 @@
+/**
+ * Adds two numbers together.
+ * @param a - First number
+ * @param b - Second number
+ * @returns Sum of a and b
+ */
 export function add(a: number, b: number) {
   return a + b;
 }

Apply this change? (y/n): y
✓ Change applied successfully
```

## Google Cloud AI Platform

### Setup

```bash
# Authenticate with gcloud
gcloud auth login

# Configure in ~/.zulu-pilotrc
{
  "provider": "googleCloud",
  "googleCloud": {
    "projectId": "your-project-id",
    "region": "us-west2",
    "model": "deepseek-ai/deepseek-v3.1-maas"
  }
}

# Use Google Cloud model
zulu-pilot chat "Hello"
```

### Available Models

- `deepseek-ai/deepseek-v3.1-maas`
- `qwen/qwen3-coder-480b-a35b-instruct-maas`
- `deepseek-ai/deepseek-r1-0528-maas`
- `moonshotai/kimi-k2-thinking-maas`
- `openai/gpt-oss-120b-maas`
- `meta/llama-3.1-405b-instruct-maas`

## Error Handling

### Connection Errors

```bash
# If Ollama is not running
$ zulu-pilot chat "Hello"
Error: Failed to connect to Ollama. Please ensure:
1. Ollama is running locally (http://localhost:11434)
2. The model is installed (e.g., ollama pull qwen2.5-coder)
3. Your network connection is active
```

### Rate Limit Errors

```bash
# If rate limit exceeded
Error: Rate limit exceeded. Retry after 60 seconds.

To resolve:
1. Wait for the retry period before making another request
2. Consider upgrading your API plan for higher rate limits
3. Reduce request frequency or batch requests
4. Check your API usage dashboard for current limits
```

## Advanced Usage

### Environment Variables

```json
{
  "gemini": {
    "apiKey": "env:GEMINI_API_KEY"
  },
  "openai": {
    "apiKey": "env:OPENAI_API_KEY"
  }
}
```

### Custom Base URLs

```json
{
  "openai": {
    "apiKey": "your-key",
    "baseUrl": "https://api.deepseek.com/v1",
    "model": "deepseek-chat"
  }
}
```

### Token Management

```bash
# Check context size
zulu-pilot context

# Output shows:
# 📁 Context Files:
#   src/utils.ts
#     Modified: 1/27/2025
#     Tokens: 150
# Total tokens: 150

# Warning if approaching limit
⚠ Token usage: 85% (27,200/32,000). Consider removing some files.
```

## Integration Examples

### Programmatic Usage

```typescript
import { OllamaProvider } from 'zulu-pilot';
import { createFileContext } from 'zulu-pilot';

const provider = new OllamaProvider({ model: 'qwen2.5-coder' });
const context = [createFileContext('src/utils.ts', 'export function add(a, b) { return a + b; }')];

// Stream response
for await (const token of provider.streamResponse('Explain this function', context)) {
  process.stdout.write(token);
}

// Or get complete response
const response = await provider.generateResponse('Explain this function', context);
console.log(response);
```

### Batch Processing

```typescript
import { GeminiProvider } from 'zulu-pilot';

const provider = new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY! });
const prompts = ['What is TypeScript?', 'What is JavaScript?', 'Compare them'];

for (const prompt of prompts) {
  const response = await provider.generateResponse(prompt, []);
  console.log(`Q: ${prompt}\nA: ${response}\n`);
}
```

