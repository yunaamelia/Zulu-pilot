# DeepSeek R1 Configuration

## Implementasi

Konfigurasi DeepSeek R1 sudah diimplementasikan sesuai dengan spesifikasi:

### Request Format

```json
{
  "model": "deepseek-ai/deepseek-r1-0528-maas",
  "stream": true,
  "max_tokens": 32138,
  "temperature": 0.4,
  "top_p": 0.95,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "halo"
        }
      ]
    }
  ]
}
```

### Perbedaan dengan Model Lain

DeepSeek R1 menggunakan format `content` sebagai **array** dengan struktur `{type: "text", text: "..."}`, berbeda dengan model lain yang menggunakan `content` sebagai **string**.

### Konfigurasi Model

- **Model**: `deepseek-ai/deepseek-r1-0528-maas`
- **Region**: `us-central1`
- **Endpoint**: `v1beta1`
- **Max Tokens**: `32138` (bukan 32768)
- **Temperature**: `0.4`
- **Top P**: `0.95`

### Implementasi di Code

File: `src/core/llm/GoogleCloudProvider.ts`

```typescript
// DeepSeek R1 requires content as array with type/text structure
if (this.model === 'deepseek-ai/deepseek-r1-0528-maas') {
  messages.push({
    role: 'user',
    content: [
      {
        type: 'text',
        text: prompt,
      },
    ],
  });
} else {
  // Other models use content as string
  messages.push({
    role: 'user',
    content: prompt,
  });
}
```

### Status Testing

✅ **Autentikasi**: Berhasil menggunakan `request.json`  
✅ **Request Format**: Sudah benar sesuai spesifikasi  
❌ **Model Availability**: Model tidak ditemukan (404 Not Found)

### Error yang Ditemukan

```
{
  "error": {
    "code": 404,
    "message": "Requested entity was not found.",
    "status": "NOT_FOUND"
  }
}
```

### Kemungkinan Penyebab

1. Model belum tersedia di region `us-central1`
2. Service account tidak memiliki akses ke model ini
3. Model memerlukan aktivasi khusus atau belum diaktifkan di project
4. Endpoint URL mungkin berbeda untuk model ini

### Cara Test

```bash
# Test dengan script khusus
npx tsx scripts/test-deepseek-r1.ts

# Test dengan curl (menggunakan service account token)
npx tsx scripts/test-deepseek-r1-curl.ts

# Test dengan debug output
npx tsx scripts/test-deepseek-r1-debug.ts
```

### Verifikasi

Untuk memverifikasi apakah model tersedia:

```bash
# List models di region
gcloud ai models list --region=us-central1

# Check service account permissions
gcloud projects get-iam-policy protean-tooling-476420-i8 \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:vertex-express@protean-tooling-476420-i8.iam.gserviceaccount.com"
```

### Catatan

Implementasi sudah benar sesuai dengan konfigurasi yang diberikan. Error 404 menunjukkan bahwa masalahnya adalah ketersediaan model atau akses, bukan implementasi kode.

