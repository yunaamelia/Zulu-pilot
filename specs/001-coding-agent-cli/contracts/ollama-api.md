# Ollama API Contract

**Provider**: Ollama (Local)  
**Base URL**: `http://localhost:11434` (default)  
**Protocol**: OpenAI-compatible Chat Completions API

## Endpoint

```
POST /v1/chat/completions
```

## Request Format

```json
{
  "model": "qwen2.5-coder",
  "messages": [
    {
      "role": "user",
      "content": "How do I sort an array in TypeScript?"
    }
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 4096
}
```

## Response Format (Streaming)

**Content-Type**: `text/event-stream`

**Event Format**:

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1694268190,"model":"qwen2.5-coder","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1694268190,"model":"qwen2.5-coder","choices":[{"index":0,"delta":{"content":" world"},"finish_reason":null}]}

data: [DONE]
```

## Response Format (Non-Streaming)

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1694268190,
  "model": "qwen2.5-coder",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Full response text here"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

## Error Responses

**Connection Refused** (Ollama not running):

- Status: Connection error
- Message: "ECONNREFUSED" or "connect ECONNREFUSED 127.0.0.1:11434"

**Model Not Found**:

- Status: 404
- Body: `{"error": {"message": "model 'xyz' not found"}}`

**Rate Limit** (if configured):

- Status: 429
- Body: `{"error": {"message": "rate limit exceeded"}}`

## Authentication

None required for local Ollama instance.

## Contract Tests Required

1. ✅ Successful streaming response
2. ✅ Successful non-streaming response
3. ✅ Connection refused when Ollama not running
4. ✅ Model not found error
5. ✅ Invalid request format
6. ✅ Stream cancellation
7. ✅ Multiple messages in context
8. ✅ Token usage reporting
