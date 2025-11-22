# IModelProvider API Documentation

## Overview

`IModelProvider` is the core interface for all AI model providers in Zulu Pilot. It provides a unified API for interacting with different LLM providers (Ollama, Gemini, OpenAI, Google Cloud AI Platform) while abstracting away provider-specific implementation details.

## Interface

```typescript
export interface IModelProvider {
  streamResponse(prompt: string, context: FileContext[]): AsyncGenerator<string, void, unknown>;
  generateResponse(prompt: string, context: FileContext[]): Promise<string>;
}
```

## Methods

### `streamResponse`

Streams a response from the AI model in real-time, yielding tokens as they are generated.

**Parameters:**
- `prompt` (string): The user's prompt or question
- `context` (FileContext[]): Array of file contexts to include in the conversation for code-aware assistance

**Returns:**
- `AsyncGenerator<string, void, unknown>`: An async generator that yields response tokens one at a time

**Throws:**
- `ConnectionError`: If connection to the model provider fails
- `RateLimitError`: If API rate limit is exceeded

**Example:**
```typescript
const provider = new OllamaProvider({ model: 'qwen2.5-coder' });
const context = [createFileContext('src/utils.ts', 'export function add(a: number, b: number) { return a + b; }')];

for await (const token of provider.streamResponse('Explain this function', context)) {
  process.stdout.write(token);
}
```

### `generateResponse`

Generates a complete response from the AI model and returns it as a single string.

**Parameters:**
- `prompt` (string): The user's prompt or question
- `context` (FileContext[]): Array of file contexts to include in the conversation

**Returns:**
- `Promise<string>`: Promise resolving to the complete response text

**Throws:**
- `ConnectionError`: If connection to the model provider fails
- `RateLimitError`: If API rate limit is exceeded

**Example:**
```typescript
const provider = new GeminiProvider({ apiKey: 'your-api-key' });
const response = await provider.generateResponse('What is TypeScript?', []);
console.log(response);
```

## Implementations

### OllamaProvider

Local model provider for Ollama instances.

**Configuration:**
```typescript
{
  baseUrl?: string;  // Default: 'http://localhost:11434'
  model?: string;    // Default: 'qwen2.5-coder'
}
```

**Example:**
```typescript
const provider = new OllamaProvider({
  baseUrl: 'http://localhost:11434',
  model: 'qwen2.5-coder'
});
```

### GeminiProvider

Google Gemini API provider.

**Configuration:**
```typescript
{
  apiKey: string;
  baseUrl?: string;  // Default: 'https://generativelanguage.googleapis.com/v1beta'
  model?: string;    // Default: 'gemini-2.5-pro'
  enableGoogleSearch?: boolean;  // Default: false
}
```

**Example:**
```typescript
const provider = new GeminiProvider({
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-2.5-pro',
  enableGoogleSearch: true
});
```

### OpenAIProvider

OpenAI-compatible API provider (supports OpenAI, DeepSeek, Groq).

**Configuration:**
```typescript
{
  apiKey: string;
  baseUrl: string;   // e.g., 'https://api.openai.com/v1' or 'https://api.deepseek.com/v1'
  model: string;      // e.g., 'gpt-4', 'deepseek-chat', 'llama-3.1-70b'
}
```

**Example:**
```typescript
const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4'
});
```

### GoogleCloudProvider

Google Cloud AI Platform provider (supports DeepSeek, Qwen, Gemini, Kimi, GPT OSS, Llama via AI Platform).

**Configuration:**
```typescript
{
  projectId: string;
  region: string;
  model: string;  // e.g., 'deepseek-ai/deepseek-v3.1-maas'
}
```

**Example:**
```typescript
const provider = new GoogleCloudProvider({
  projectId: 'your-project-id',
  region: 'us-west2',
  model: 'deepseek-ai/deepseek-v3.1-maas'
});
```

**Note:** Requires `gcloud` CLI to be installed and authenticated. The provider automatically uses `gcloud auth print-access-token` for authentication.

## File Context

File contexts allow the AI to understand your codebase when answering questions or proposing changes.

**FileContext Structure:**
```typescript
interface FileContext {
  path: string;
  content: string;
  lastModified: Date;
  size?: number;
  estimatedTokens?: number;
}
```

**Creating File Context:**
```typescript
import { createFileContext } from '../context/FileContext.js';

const context = createFileContext(
  'src/utils.ts',
  'export function add(a: number, b: number) { return a + b; }'
);
```

## Error Handling

### ConnectionError

Thrown when connection to the model provider fails.

```typescript
try {
  await provider.generateResponse('Hello', []);
} catch (error) {
  if (error instanceof ConnectionError) {
    console.error(error.getUserMessage());
    // Provides actionable guidance based on provider type
  }
}
```

### RateLimitError

Thrown when API rate limit is exceeded.

```typescript
try {
  await provider.generateResponse('Hello', []);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error(error.getUserMessage());
    const backoffDelay = RateLimitError.calculateBackoff(attempt);
    await new Promise(resolve => setTimeout(resolve, backoffDelay));
  }
}
```

## Best Practices

1. **Use streaming for interactive experiences**: `streamResponse` provides real-time feedback to users
2. **Use generateResponse for batch processing**: When you need the complete response before proceeding
3. **Include file context for code questions**: Always pass relevant file contexts when asking about code
4. **Handle errors gracefully**: Always catch and handle `ConnectionError` and `RateLimitError`
5. **Respect rate limits**: Use exponential backoff when retrying after rate limit errors

## Performance Considerations

- **Streaming**: Use `streamResponse` for better perceived performance in interactive CLI applications
- **Context size**: Keep file contexts reasonable (< 32k tokens total) to avoid exceeding model context windows
- **Connection pooling**: Providers use axios instances internally; reuse provider instances when possible
- **Timeout handling**: Providers have configurable timeouts (5s local, 30s remote by default)

