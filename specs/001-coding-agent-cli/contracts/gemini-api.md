# Gemini API Contract

**Provider**: Google Gemini  
**Base URL**: `https://aiplatform.googleapis.com/v1`  
**Protocol**: Google Gemini API (different from OpenAI format)

## Endpoint

```
POST /publishers/google/models/{MODEL_ID}:streamGenerateContent?key={API_KEY}
```

**Models**:

- `gemini-2.5-pro`
- `gemini-1.5-pro`
- Other Gemini models

## Request Format

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "How do I sort an array in TypeScript?"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.4,
    "maxOutputTokens": 65535,
    "topP": 0.95,
    "thinkingConfig": {
      "thinkingBudget": -1
    }
  },
  "safetySettings": [
    {
      "category": "HARM_CATEGORY_HATE_SPEECH",
      "threshold": "OFF"
    },
    {
      "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
      "threshold": "OFF"
    },
    {
      "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      "threshold": "OFF"
    },
    {
      "category": "HARM_CATEGORY_HARASSMENT",
      "threshold": "OFF"
    }
  ],
  "tools": [
    {
      "googleSearch": {}
    }
  ]
}
```

## Response Format (Streaming)

**Content-Type**: `application/json` (streaming JSON)

**Response Format**:

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Response chunk 1"
          }
        ],
        "role": "model"
      },
      "finishReason": null,
      "index": 0,
      "safetyRatings": []
    }
  ]
}
```

**Subsequent chunks**:

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Response chunk 2"
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0
    }
  ]
}
```

## Response Format (Non-Streaming)

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Full response text here"
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0,
      "safetyRatings": []
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 10,
    "candidatesTokenCount": 20,
    "totalTokenCount": 30
  }
}
```

## Error Responses

**Invalid API Key**:

- Status: 401
- Body: `{"error": {"code": 401, "message": "API key not valid", "status": "UNAUTHENTICATED"}}`

**Rate Limit Exceeded**:

- Status: 429
- Body: `{"error": {"code": 429, "message": "Resource has been exhausted", "status": "RESOURCE_EXHAUSTED"}}`

**Model Not Found**:

- Status: 404
- Body: `{"error": {"code": 404, "message": "Model not found", "status": "NOT_FOUND"}}`

**Quota Exceeded**:

- Status: 429
- Body: `{"error": {"code": 429, "message": "Quota exceeded", "status": "RESOURCE_EXHAUSTED"}}`

## Authentication

**Method 1**: API Key in query parameter

- URL: `?key={API_KEY}`

**Method 2**: OAuth2 Bearer token

- Header: `Authorization: Bearer {ACCESS_TOKEN}`

## Special Features

**Google Search Integration**:

- Can include `"tools": [{"googleSearch": {}}]` in request
- Model can use web search for current information

**Thinking Config**:

- `thinkingBudget: -1` enables unlimited thinking tokens
- Useful for complex reasoning tasks

## Contract Tests Required

1. ✅ Successful streaming response
2. ✅ Successful non-streaming response
3. ✅ Invalid API key error
4. ✅ Rate limit error
5. ✅ Model not found error
6. ✅ Quota exceeded error
7. ✅ Network timeout handling
8. ✅ Stream cancellation
9. ✅ Multiple messages in conversation
10. ✅ Token usage reporting
11. ✅ Safety settings application
12. ✅ Google Search tool integration
