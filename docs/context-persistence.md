# Context Persistence Behavior

## Overview

When switching between AI model providers during a conversation, the file context (loaded via `/add` command) persists across provider switches. This ensures continuity and allows users to switch providers without losing their loaded codebase context.

## Behavior

### Context Persistence

- **Context is global**: The `ContextManager` instance is shared across all provider instances
- **Context survives provider switches**: When switching from `ollama` to `gemini` (or any other provider), all loaded files remain in context
- **Context is cleared explicitly**: Context is only cleared when the user runs `/clear` command

### Implementation Details

1. **Global Context Manager**: A single `ContextManager` instance is created in `src/cli/index.ts` and shared via `setContextManager()` / `getContextManager()`

2. **Provider Independence**: All providers (`OllamaProvider`, `GeminiProvider`, etc.) receive the same `FileContext[]` array when calling `streamResponse()` or `generateResponse()`

3. **Context Format**: Each provider formats the context according to its API requirements:
   - **Ollama/OpenAI**: Context is included as a system message
   - **Gemini**: Context is included in the prompt structure (format TBD)

### Example Flow

```bash
# User loads files
zulu-pilot add src/**/*.ts

# User chats with Ollama (context included)
zulu-pilot chat "explain this code" --provider ollama

# User switches to Gemini (same context included)
zulu-pilot chat "refactor this" --provider gemini

# Context persists until explicitly cleared
zulu-pilot clear
```

## Benefits

- **Seamless provider switching**: Users can compare responses from different models on the same codebase
- **No context loss**: Switching providers doesn't require re-loading files
- **Consistent experience**: Context management is independent of provider choice

## Future Enhancements

- **Provider-specific context limits**: Different providers may have different token limits
- **Context optimization**: Automatically trim context when switching to providers with smaller context windows
- **Context history**: Track which files were loaded when, for debugging

