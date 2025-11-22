# Test All Models Script

Script untuk menguji chat pada semua model yang terdaftar di Zulu Pilot.

## Cara Menggunakan

```bash
# Build project terlebih dahulu
npm run build

# Jalankan test semua model
node scripts/test-all-models.ts
```

## Model yang Ditest

### Ollama Models (5 models)
- qwen2.5-coder
- llama3.2
- mistral
- codellama
- deepseek-coder

**Requirements**: Ollama service harus berjalan di `http://localhost:11434`

### Gemini Models (3 models)
- gemini-2.5-pro
- gemini-1.5-pro
- gemini-1.5-flash

**Requirements**: API key harus dikonfigurasi di `~/.zulu-pilotrc`

### OpenAI Models (3 models)
- gpt-4
- gpt-4-turbo
- gpt-3.5-turbo

**Requirements**: API key harus dikonfigurasi di `~/.zulu-pilotrc`

### Google Cloud AI Platform Models (6 models)
- deepseek-ai/deepseek-v3.1-maas (us-west2)
- qwen/qwen3-coder-480b-a35b-instruct-maas (us-south1)
- deepseek-ai/deepseek-r1-0528-maas (us-central1)
- moonshotai/kimi-k2-thinking-maas (global)
- openai/gpt-oss-120b-maas (us-central1)
- meta/llama-3.1-405b-instruct-maas (us-central1)

**Requirements**: 
- `gcloud` CLI harus terinstall dan ter-authenticate
- Project ID dan region harus dikonfigurasi
- API `aiplatform.googleapis.com` harus di-enable

## Output

Script akan menampilkan:
- Status untuk setiap model: PASS, FAIL, atau SKIP
- Summary dengan jumlah passed/failed/skipped
- Detailed results dengan alasan skip/fail

## Contoh Output

```
Test Summary
============================================================
Passed: 3
Failed: 3
Skipped: 11

Detailed Results:
SKIP: ollama/qwen2.5-coder - Ollama service not running
SKIP: gemini/gemini-2.5-pro - gemini API key not configured
PASS: googleCloud/qwen/qwen3-coder-480b-a35b-instruct-maas
FAIL: googleCloud/deepseek-ai/deepseek-v3.1-maas - Model or endpoint not found
```

## Troubleshooting

### Ollama tidak running
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start service
ollama serve

# Pull model
ollama pull qwen2.5-coder
```

### API key tidak dikonfigurasi
Edit `~/.zulu-pilotrc` dan tambahkan API key:
```json
{
  "providers": {
    "gemini": {
      "apiKey": "your-api-key"
    },
    "openai": {
      "apiKey": "your-api-key"
    }
  }
}
```

### Google Cloud tidak ter-authenticate
```bash
# Login
gcloud auth login

# Set project
gcloud config set project your-project-id

# Enable API
gcloud services enable aiplatform.googleapis.com

# Verify
gcloud auth print-access-token
```

