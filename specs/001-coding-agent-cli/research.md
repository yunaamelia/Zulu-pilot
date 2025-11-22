# Research: Coding Agent CLI Technical Decisions

**Created**: 2025-01-27  
**Purpose**: Document technical decisions and resolve NEEDS CLARIFICATION items from plan.md

## HTTP Client Library

**Decision**: Use `axios` for HTTP requests

**Rationale**:

- Mature, widely-adopted library with excellent TypeScript support
- Built-in request/response interceptors for authentication and error handling
- Automatic JSON parsing and request/response transformation
- Better error handling than native fetch (throws errors for HTTP error status codes)
- Supports streaming responses (important for real-time AI responses)
- Extensive ecosystem and community support
- Works well with mocking in tests (jest-axios-mock)

**Alternatives Considered**:

- `node-fetch`: Closer to web standards, but requires polyfills, less feature-rich
- Native `fetch` (Node.js 18+): Good for simple cases, but lacks advanced features like interceptors
- `got`: Lightweight alternative, but less popular and fewer examples

**Implementation Notes**:

- Use axios with streaming support for real-time responses
- Configure timeout settings (5s for local, 30s for remote)
- Implement retry logic for transient network errors

## CLI Framework

**Decision**: Use `commander.js` for CLI interface

**Rationale**:

- Simple, declarative API that's easy to learn and maintain
- Excellent TypeScript support with type definitions
- Built-in help generation and command organization
- Supports subcommands (useful for `/add`, `/clear`, `/context` commands)
- Widely used in popular CLI tools (Vue CLI, Create React App)
- Good documentation and examples
- Lightweight dependency footprint

**Alternatives Considered**:

- `yargs`: More powerful but more complex, better for complex argument parsing
- `inquirer`: Better for interactive prompts, but we need command-based interface
- `oclif`: Full-featured but heavyweight, overkill for our needs

**Implementation Notes**:

- Use commander for main command structure
- Use `inquirer` or `readline` for interactive prompts (file change approval)
- Structure: `zulu-pilot chat`, `zulu-pilot add <file>`, `zulu-pilot clear`, etc.

## Token Estimation

**Decision**: Use simple character-based estimation with configurable tokens-per-character ratio

**Rationale**:

- Most accurate tokenizers (tiktoken, gpt-tokenizer) are model-specific and add complexity
- Character-based estimation is fast and sufficient for warning users about context limits
- Can be calibrated per model (different models have different tokenization)
- Simple implementation: `estimatedTokens = (charCount / charsPerToken) * safetyMargin`
- Default: ~4 characters per token (conservative estimate for English code)

**Alternatives Considered**:

- `tiktoken`: Most accurate but requires model-specific encoding, adds dependency
- `gpt-tokenizer`: Accurate but JavaScript implementation can be slow for large files
- Exact tokenization: Too slow for real-time context management

**Implementation Notes**:

- Start with conservative estimate (4 chars/token)
- Allow configuration per model in config file
- Warn when context exceeds 80% of model's context window
- Provide guidance on which files to remove if limit exceeded

## Streaming Response Handling

**Decision**: Use Node.js Readable streams with axios streaming support

**Rationale**:

- Axios supports streaming via `responseType: 'stream'`
- Node.js streams provide efficient memory usage for large responses
- Real-time output to stdout as tokens arrive
- Can handle backpressure naturally
- Compatible with all providers (Ollama, OpenAI, Gemini)

**Implementation Notes**:

- Use `responseType: 'stream'` in axios config
- Pipe stream to stdout with proper encoding
- Handle stream errors gracefully
- Support cancellation (Ctrl+C) during streaming

## Configuration File Format

**Decision**: Use JSON format for configuration file (`~/.zulu-pilotrc`)

**Rationale**:

- Simple, human-readable format
- Native JSON parsing in Node.js (no extra dependencies)
- Easy to validate and edit
- Standard format for CLI tools
- Can be extended with comments via JSONC if needed later

**Configuration Structure**:

```json
{
  "provider": "ollama",
  "model": "qwen2.5-coder",
  "ollama": {
    "baseUrl": "http://localhost:11434"
  },
  "openai": {
    "apiKey": "env:OPENAI_API_KEY",
    "baseUrl": "https://api.openai.com/v1"
  },
  "gemini": {
    "apiKey": "env:GEMINI_API_KEY"
  },
  "googleCloud": {
    "projectId": "protean-tooling-476420-i8",
    "region": "us-west2"
  }
}
```

## Error Handling Strategy

**Decision**: Custom error classes with user-friendly messages

**Rationale**:

- Type-safe error handling in TypeScript
- Clear error messages for users (no technical stack traces)
- Actionable guidance (e.g., "Ollama not running, start with: ollama serve")
- Categorization: ConnectionError, RateLimitError, ValidationError, etc.

**Implementation Notes**:

- Create error classes extending Error
- Map HTTP status codes to user-friendly messages
- Provide resolution steps in error messages
- Log technical details for debugging (not shown to users)

## File Safety (Backup/Version Control)

**Decision**: Create `.backup` directory with timestamped backups before applying changes

**Rationale**:

- Simple, doesn't require git to be initialized
- Works in all scenarios (with or without version control)
- Easy to restore if needed
- Timestamped backups allow multiple undo levels

**Implementation Notes**:

- Create `.zulu-pilot-backups/` directory in project root
- Backup format: `{filename}.{timestamp}.backup`
- Show backup location in approval prompt
- Option to restore from backup if change causes issues

## Code Change Parsing

**Decision**: Parse markdown code blocks with filename annotations

**Format**:

````markdown
```filename:path/to/file.ts
// code content
```
````

````

**Rationale**:
- Simple format that most models can follow with proper prompting
- Easy to parse with regex
- Supports multiple files in single response
- Clear file targeting

**Implementation Notes**:
- Use regex to extract code blocks with filename annotations
- Validate file paths (prevent directory traversal)
- Handle malformed blocks gracefully (show error, don't crash)
- Support both `filename:` and `file:` prefixes

## Model Provider Interface Design

**Decision**: AsyncGenerator for streaming, Promise for non-streaming

**Rationale**:
- AsyncGenerator provides natural streaming API
- Can be consumed with `for await` loops
- Supports cancellation via generator.return()
- Consistent interface across all providers

**Interface**:
```typescript
interface IModelProvider {
  streamResponse(prompt: string, context: FileContext[]): AsyncGenerator<string>;
  generateResponse(prompt: string, context: FileContext[]): Promise<string>;
}
````

## Google Cloud AI Platform Integration

**Decision**: Support Google Cloud AI Platform models via OpenAI-compatible endpoint

**Rationale**:

- User provided specific configurations for multiple models (DeepSeek, Qwen, Gemini, etc.)
- All use OpenAI-compatible chat completions endpoint
- Can reuse OpenAIProvider with different base URLs and authentication
- Supports gcloud auth token for authentication

**Implementation Notes**:

- Create `GoogleCloudProvider` extending base provider pattern
- Use `gcloud auth print-access-token` for authentication
- Support different regions and project IDs per model
- Handle model-specific configurations (temperature, top_p, etc.)

## Testing Strategy

**Decision**: Jest with ts-jest, axios-mock-adapter for HTTP mocking

**Rationale**:

- Jest is industry standard for TypeScript/Node.js
- ts-jest provides seamless TypeScript support
- axios-mock-adapter makes HTTP mocking straightforward
- Good coverage reporting tools
- Fast test execution

**Implementation Notes**:

- Mock HTTP requests in unit tests
- Use temporary directories for file system tests
- Test streaming with mock streams
- Contract tests verify API compatibility

## Summary

All NEEDS CLARIFICATION items resolved:

- ✅ HTTP client: axios
- ✅ CLI framework: commander.js
- ✅ Token estimation: Character-based with configurable ratio
- ✅ Streaming: Node.js streams with axios
- ✅ Config format: JSON
- ✅ Error handling: Custom error classes
- ✅ File safety: Timestamped backups
- ✅ Code parsing: Markdown code blocks with filename annotations
