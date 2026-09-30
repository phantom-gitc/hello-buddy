# Retrieval-Augmented Generation (RAG) Architecture

## 1. RAG Pipeline

```text
Document / Resume
       ↓
Cloudinary (Permanent File Storage)
       ↓
PDF Text Extraction (pdf-parse)
       ↓
Text Sanitization & Normalization
       ↓
Sliding Window Chunking (250 tokens / 40 overlap)
       ↓
Embedding Generation (1536-dim vector via OpenAI / local fallback)
       ↓
Qdrant Vector Database
```

## 2. Multi-Tenant User Isolation

In Qdrant, all vector points store a metadata payload:

```json
{
  "userId": "66f7f2b1d70a...",
  "sourceType": "resume",
  "sourceId": "66f7f2c8...",
  "chunkIndex": 0,
  "text": "..."
}
```

Every vector query requires a strict filter:
```javascript
{
  must: [
    { key: "userId", match: { value: currentUserId } }
  ]
}
```
This guarantees zero possibility of cross-user data leakage.
