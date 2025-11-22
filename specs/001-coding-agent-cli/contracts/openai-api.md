# OpenAI-Compatible API Contract

**Providers**: OpenAI, DeepSeek, Groq, Google Cloud AI Platform (OpenAI-compatible endpoint)  
**Base URLs**:

- OpenAI: `https://api.openai.com/v1`
- DeepSeek: `https://api.deepseek.com/v1`
- Groq: `https://api.groq.com/openai/v1`
- Google Cloud: `https://aiplatform.googleapis.com/v1beta1/projects/{PROJECT_ID}/locations/{REGION}/endpoints/openapi/chat/completions`

**Protocol**: OpenAI Chat Completions API

## Endpoint

```
POST /chat/completions
```

## Request Format

```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful coding assistant."
    },
    {
      "role": "user",
      "content": "How do I sort an array in TypeScript?"
    }
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 4096,
  "top_p": 0.95
}
```

## Response Format (Streaming)

**Content-Type**: `text/event-stream`

**Event Format**:

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1694268190,"model":"gpt-4","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1694268190,"model":"gpt-4","choices":[{"index":0,"delta":{"content":" world"},"finish_reason":null}]}

data: [DONE]
```

## Response Format (Non-Streaming)

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1694268190,
  "model": "gpt-4",
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

**Invalid API Key**:

- Status: 401
- Body: `{"error": {"message": "Invalid API key", "type": "invalid_request_error"}}`

**Rate Limit Exceeded**:

- Status: 429
- Body: `{"error": {"message": "Rate limit exceeded", "type": "rate_limit_error"}}`
- Headers: `Retry-After: 60`

**Model Not Found**:

- Status: 404
- Body: `{"error": {"message": "The model 'xyz' does not exist", "type": "invalid_request_error"}}`

**Insufficient Quota**:

- Status: 429
- Body: `{"error": {"message": "You exceeded your current quota", "type": "insufficient_quota"}}`

## Authentication

**OpenAI/DeepSeek/Groq**:

- Header: `Authorization: Bearer {API_KEY}`

**Google Cloud AI Platform**:

- Header: `Authorization: Bearer $(gcloud auth print-access-token)`
- Requires `gcloud` CLI to be authenticated

## Google Cloud Specific Configuration

**Models Supported** (from user requirements):

- `deepseek-ai/deepseek-v3.1-maas`
- `qwen/qwen3-coder-480b-a35b-instruct-maas`
- `deepseek-ai/deepseek-r1-0528-maas`
- `openai/gpt-oss-120b-maas`
- `meta/llama-3.1-405b-instruct-maas`
- `moonshotai/kimi-k2-thinking-maas`

**Request Format** (Google Cloud):

```json
{
  "model": "deepseek-ai/deepseek-v3.1-maas",
  "stream": true,
  "max_tokens": 32768,
  "temperature": 0.4,
  "top_p": 0.95,
  "messages": [
    {
      "role": "user",
      "content": "Your prompt here"
    }
  ]
}
```

## Contract Tests Required

1. ✅ Successful streaming response
2. ✅ Successful non-streaming response
3. ✅ Invalid API key error
4. ✅ Rate limit error with retry-after header
5. ✅ Model not found error
6. ✅ Insufficient quota error
7. ✅ Network timeout handling
8. ✅ Stream cancellation
9. ✅ Multiple messages with system prompt
10. ✅ Token usage reporting
