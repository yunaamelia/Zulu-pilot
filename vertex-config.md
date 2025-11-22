Berikut adalah versi dokumen yang telah dirapikan tanpa bagian Claude:

---

# Contoh API Call untuk Berbagai Model AI

## Daftar Isi
1. [DeepSeek V3.1](#deepseek-v31)  
2. [Qwen Coder](#qwen-coder)  
3. [Gemini 2.5 Pro](#gemini-25-pro)  
4. [DeepSeek R1 0528](#deepseek-r1-0528)  
5. [Kimi K2](#kimi-k2)  
6. [GPT OSS 120B](#gpt-oss-120b)  
7. [Llama 3.1](#llama-31)  
8. [Catatan Penting](#catatan-penting)

---

## DeepSeek V3.1

### Konfigurasi
```bash
cat << EOF > request.json
{
  "model": "deepseek-ai/deepseek-v3.1-maas",
  "stream": true,
  "max_tokens": 32768,
  "temperature": 0.4,
  "top_p": 0.95,
  "messages": [
    {
      "role": "user",
      "content": []
    }
  ]
}
EOF

ENDPOINT="aiplatform.googleapis.com"
REGION="us-west2"
PROJECT_ID="protean-tooling-476420-i8"

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://$ENDPOINT/v1beta1/projects/$PROJECT_ID/locations/$REGION/endpoints/openapi/chat/completions" \
  -d '@request.json'
```

---

## Qwen Coder

### Konfigurasi
```bash
cat << EOF > request.json
{
  "model": "qwen/qwen3-coder-480b-a35b-instruct-maas",
  "stream": true,
  "max_tokens": 32768,
  "temperature": 0.4,
  "top_p": 0.8,
  "messages": [
    {
      "role": "user",
      "content": []
    }
  ]
}
EOF

ENDPOINT="aiplatform.googleapis.com"
REGION="us-south1"
PROJECT_ID="protean-tooling-476420-i8"

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://$ENDPOINT/v1beta1/projects/$PROJECT_ID/locations/$REGION/endpoints/openapi/chat/completions" \
  -d '@request.json'
```

---

## Gemini 2.5 Pro

### Konfigurasi
```bash
cat << EOF > request.json
{
  "contents": [
    {
      "role": "user",
      "parts": []
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
EOF

API_KEY="<YOUR_API_KEY>"
API_ENDPOINT="aiplatform.googleapis.com"
MODEL_ID="gemini-2.5-pro"
GENERATE_CONTENT_API="streamGenerateContent"

curl \
  -X POST \
  -H "Content-Type: application/json" \
  "https://$API_ENDPOINT/v1/publishers/google/models/$MODEL_ID:$GENERATE_CONTENT_API?key=$API_KEY" \
  -d '@request.json'
```

---

## DeepSeek R1 0528

### Konfigurasi
```bash
cat << EOF > request.json
{
  "model": "deepseek-ai/deepseek-r1-0528-maas",
  "stream": true,
  "max_tokens": 32768,
  "temperature": 0.4,
  "top_p": 0.95,
  "messages": [
    {
      "role": "user",
      "content": []
    }
  ]
}
EOF

ENDPOINT="aiplatform.googleapis.com"
REGION="us-central1"
PROJECT_ID="protean-tooling-476420-i8"

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://$ENDPOINT/v1beta1/projects/$PROJECT_ID/locations/$REGION/endpoints/openapi/chat/completions" \
  -d '@request.json'
```

---

## Kimi K2

### Konfigurasi
```bash
ENDPOINT="aiplatform.googleapis.com"
REGION="global"
PROJECT_ID="YOUR_PROJECT_ID"
```

### Request
```bash
curl \
  -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  "https://$ENDPOINT/v1/projects/$PROJECT_ID/locations/$REGION/endpoints/openapi/chat/completions" \
  -d '{
    "model": "moonshotai/kimi-k2-thinking-maas",
    "stream": true,
    "messages": [
      {
        "role": "user",
        "content": "Summer travel plan to Paris"
      }
    ]
  }'
```

---

## GPT OSS 120B

### Konfigurasi
```bash
cat << EOF > request.json
{
  "model": "openai/gpt-oss-120b-maas",
  "stream": true,
  "max_tokens": 8192,
  "temperature": 0.4,
  "top_p": 0.95,
  "messages": [
    {
      "role": "user",
      "content": []
    }
  ]
}
EOF

ENDPOINT="aiplatform.googleapis.com"
REGION="us-central1"
PROJECT_ID="protean-tooling-476420-i8"

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://$ENDPOINT/v1beta1/projects/$PROJECT_ID/locations/$REGION/endpoints/openapi/chat/completions" \
  -d '@request.json'
```

---

## Llama 3.1

### Konfigurasi
```bash
cat << EOF > request.json
{
  "model": "meta/llama-3.1-405b-instruct-maas",
  "stream": true,
  "max_tokens": 4096,
  "temperature": 0.4,
  "top_p": 0.95,
  "messages": [
    {
      "role": "user",
      "content": []
    }
  ]
}
EOF

ENDPOINT="aiplatform.googleapis.com"
REGION="us-central1"
PROJECT_ID="protean-tooling-476420-i8"

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://$ENDPOINT/v1beta1/projects/$PROJECT_ID/locations/$REGION/endpoints/openapi/chat/completions" \
  -d '@request.json'
```

---

## Catatan Penting

### Placeholder yang Perlu Diganti:
- `YOUR_PROJECT_ID` → Ganti dengan Project ID GCP Anda

### Autentikasi:
- Pastikan Anda sudah login ke gcloud CLI
- Pastikan Anda memiliki akses ke model-model tersebut
- Verifikasi bahwa project ID sudah diatur dengan benar

### Tips:
1. Gunakan `gcloud auth login` untuk autentikasi awal
2. Gunakan `gcloud config set project YOUR_PROJECT_ID` untuk mengatur project default
3. Pastikan API Vertex AI sudah diaktifkan di project Anda

---
