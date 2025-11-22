# Configuration Guide

## Configuration File Location

Zulu Pilot uses `~/.zulu-pilotrc` (or `%USERPROFILE%\.zulu-pilotrc` on Windows) for configuration.

## Configuration Format

The configuration file uses JSON format:

```json
{
  "provider": "ollama",
  "model": "qwen2.5-coder",
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434",
      "model": "qwen2.5-coder"
    },
    "gemini": {
      "apiKey": "your-api-key",
      "model": "gemini-2.5-pro",
      "enableGoogleSearch": false
    },
    "openai": {
      "apiKey": "your-api-key",
      "baseUrl": "https://api.openai.com/v1",
      "model": "gpt-4"
    },
    "googleCloud": {
      "projectId": "your-project-id",
      "region": "us-west2",
      "model": "deepseek-ai/deepseek-v3.1-maas"
    }
  }
}
```

## Provider Configuration

### Ollama (Local)

```json
{
  "provider": "ollama",
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434",
      "model": "qwen2.5-coder"
    }
  }
}
```

**Options:**

- `baseUrl` (optional): Ollama server URL. Default: `http://localhost:11434`
- `model` (optional): Model name. Default: `qwen2.5-coder`

**Setup:**

1. Install Ollama: https://ollama.ai
2. Start Ollama: `ollama serve`
3. Pull a model: `ollama pull qwen2.5-coder`

### Gemini 2.5 Pro

```json
{
  "provider": "gemini",
  "providers": {
    "gemini": {
      "apiKey": "your-api-key",
      "model": "gemini-2.5-pro",
      "enableGoogleSearch": true
    }
  }
}
```

**Options:**

- `apiKey` (required): Gemini API key. Get from https://makersuite.google.com/app/apikey
- `model` (optional): Model name. Default: `gemini-2.5-pro`
- `enableGoogleSearch` (optional): Enable Google Search integration. Default: `false`
- `baseUrl` (optional): API endpoint. Default: `https://aiplatform.googleapis.com/v1`

**Configuration:**

- Endpoint: `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-pro:streamGenerateContent`
- Max Output Tokens: 65535
- Temperature: 0.4
- Top P: 0.95
- Thinking Config: Unlimited (thinkingBudget: -1)

**Environment Variable:**

```json
{
  "gemini": {
    "apiKey": "env:GEMINI_API_KEY"
  }
}
```

### OpenAI / DeepSeek / Groq

```json
{
  "provider": "openai",
  "providers": {
    "openai": {
      "apiKey": "your-api-key",
      "baseUrl": "https://api.openai.com/v1",
      "model": "gpt-4"
    }
  }
}
```

**Options:**

- `apiKey` (required): API key for the provider
- `baseUrl` (required): API endpoint URL
- `model` (required): Model name

**Examples:**

**OpenAI:**

```json
{
  "openai": {
    "apiKey": "sk-...",
    "baseUrl": "https://api.openai.com/v1",
    "model": "gpt-4"
  }
}
```

**DeepSeek:**

```json
{
  "openai": {
    "apiKey": "sk-...",
    "baseUrl": "https://api.deepseek.com/v1",
    "model": "deepseek-chat"
  }
}
```

**Groq:**

```json
{
  "openai": {
    "apiKey": "gsk_...",
    "baseUrl": "https://api.groq.com/openai/v1",
    "model": "llama-3.1-70b"
  }
}
```

### Google Cloud AI Platform

```json
{
  "provider": "googleCloud",
  "providers": {
    "googleCloud": {
      "projectId": "protean-tooling-476420-i8",
      "region": "us-west2",
      "model": "deepseek-ai/deepseek-v3.1-maas"
    }
  }
}
```

**Options:**

- `projectId` (required): Google Cloud project ID
- `region` (required): Region for the AI Platform endpoint
- `model` (required): Model identifier
- `endpoint` (optional): API endpoint version (`v1beta1` or `v1`). Auto-detected based on model.
- `maxTokens` (optional): Maximum tokens. Auto-configured based on model.
- `temperature` (optional): Temperature. Auto-configured based on model.
- `topP` (optional): Top-p sampling. Auto-configured based on model.

**Available Models:**

**DeepSeek V3.1:**

```json
{
  "googleCloud": {
    "projectId": "protean-tooling-476420-i8",
    "region": "us-west2",
    "model": "deepseek-ai/deepseek-v3.1-maas"
  }
}
```

- Region: `us-west2`
- Endpoint: `v1beta1`
- Max Tokens: 32768
- Temperature: 0.4
- Top P: 0.95

**Qwen Coder:**

```json
{
  "googleCloud": {
    "projectId": "protean-tooling-476420-i8",
    "region": "us-south1",
    "model": "qwen/qwen3-coder-480b-a35b-instruct-maas"
  }
}
```

- Region: `us-south1`
- Endpoint: `v1beta1`
- Max Tokens: 32768
- Temperature: 0.4
- Top P: 0.8

**DeepSeek R1 0528:**

```json
{
  "googleCloud": {
    "projectId": "protean-tooling-476420-i8",
    "region": "us-central1",
    "model": "deepseek-ai/deepseek-r1-0528-maas"
  }
}
```

- Region: `us-central1`
- Endpoint: `v1beta1`
- Max Tokens: 32768
- Temperature: 0.4
- Top P: 0.95

**Kimi K2:**

```json
{
  "googleCloud": {
    "projectId": "protean-tooling-476420-i8",
    "region": "global",
    "model": "moonshotai/kimi-k2-thinking-maas"
  }
}
```

- Region: `global`
- Endpoint: `v1`
- Max Tokens: 32768
- Temperature: 0.4
- Top P: 0.95

**GPT OSS 120B:**

```json
{
  "googleCloud": {
    "projectId": "protean-tooling-476420-i8",
    "region": "us-central1",
    "model": "openai/gpt-oss-120b-maas"
  }
}
```

- Region: `us-central1`
- Endpoint: `v1beta1`
- Max Tokens: 8192
- Temperature: 0.4
- Top P: 0.95

**Llama 3.1:**

```json
{
  "googleCloud": {
    "projectId": "protean-tooling-476420-i8",
    "region": "us-central1",
    "model": "meta/llama-3.1-405b-instruct-maas"
  }
}
```

- Region: `us-central1`
- Endpoint: `v1beta1`
- Max Tokens: 32768
- Temperature: 0.4
- Top P: 0.95

**Setup:**

1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install
2. Authenticate: `gcloud auth login`
3. Set project: `gcloud config set project protean-tooling-476420-i8`
4. Enable API: `gcloud services enable aiplatform.googleapis.com`

## Environment Variables

You can reference environment variables in the configuration using the `env:` prefix:

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

The configuration manager will automatically resolve `env:VAR_NAME` to `process.env.VAR_NAME`.

## Default Provider

Set the default provider using the `provider` field:

```json
{
  "provider": "ollama"
}
```

You can override the default provider using the `--provider` flag:

```bash
zulu-pilot chat --provider gemini "Hello"
```

## Model Selection

You can set a default model at the root level or per-provider:

```json
{
  "provider": "ollama",
  "model": "qwen2.5-coder",
  "providers": {
    "ollama": {
      "model": "qwen2.5-coder"
    },
    "gemini": {
      "model": "gemini-2.5-pro"
    }
  }
}
```

## Validation

The configuration is validated on load. Invalid configurations will show clear error messages:

```bash
$ zulu-pilot chat "Hello"
Error: Configuration "providers.gemini" field must be an object if provided.
```

## Configuration File Location

- **Linux/macOS**: `~/.zulu-pilotrc`
- **Windows**: `%USERPROFILE%\.zulu-pilotrc`

You can override the location using the `--config` flag:

```bash
zulu-pilot chat --config /path/to/config.json "Hello"
```

## Best Practices

1. **Use environment variables for secrets**: Never commit API keys to version control
2. **Keep configuration minimal**: Only configure providers you actually use
3. **Use provider-specific models**: Set models per-provider for better control
4. **Test configuration**: Verify your configuration works before committing

## Troubleshooting

### Configuration Not Found

If the configuration file doesn't exist, Zulu Pilot will use defaults:

- Provider: `ollama`
- Model: `qwen2.5-coder`
- Base URL: `http://localhost:11434`

### Invalid JSON

If the JSON is invalid, you'll see:

```
Error: Failed to parse configuration file: Unexpected token...
```

### Missing Required Fields

If required fields are missing:

```
Error: Configuration "providers.gemini.apiKey" is required.
```

### Environment Variable Not Set

If an environment variable referenced with `env:` is not set:

```
Error: Environment variable GEMINI_API_KEY is not set.
```
