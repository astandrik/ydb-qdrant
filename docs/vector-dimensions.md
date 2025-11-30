## Recommended Vector Dimensions

When creating a collection, you must specify the vector `size` matching your embedding model. Below are popular models with their dimensions and typical use cases.

### Commercial API Models

| Provider | Model | Dimensions | Use Cases |
|----------|-------|------------|-----------|
| **OpenAI** | `text-embedding-3-small` | 1536 (default, can reduce to 256-1536) | RAG, semantic search, general-purpose embeddings |
| **OpenAI** | `text-embedding-3-large` | 3072 (default, can reduce to 256, 512, 1024, 1536, 3072) | High-accuracy RAG, multilingual tasks |
| **OpenAI** | `text-embedding-ada-002` | 1536 | Legacy model, widely adopted |
| **OpenAI** (Legacy) | `text-search-curie-doc-001` | 4096 | Legacy GPT-3 model, deprecated |
| **OpenAI** (Legacy) | `text-search-davinci-doc-001` | 12288 | Legacy GPT-3 model, deprecated |
| **Cohere** | `embed-v4.0` | 256, 512, 1024, 1536 (default) | Multimodal (text + image), RAG, enterprise search |
| **Cohere** | `embed-english-v3.0` | 1024 | English text, semantic search, classification |
| **Cohere** | `embed-multilingual-v3.0` | 1024 | 100+ languages, long-document retrieval, clustering |
| **Google** | `gemini-embedding-001` | 3072 (configurable) | Multilingual, general-purpose, RAG |
| **Google** | `text-embedding-004` | 768 | General-purpose text embeddings |
| **Google** | `text-embedding-005` | 768 | Improved version of text-embedding-004 |
| **Google** | `text-multilingual-embedding-002` | 768 | Multilingual text embeddings |

### Open-Source Models (HuggingFace)

| Model | Dimensions | Use Cases |
|-------|------------|-----------|
| `sentence-transformers/all-MiniLM-L6-v2` | 384 | Fast semantic search, low-resource environments |
| `BAAI/bge-base-en-v1.5` | 768 | RAG, retrieval, English text |
| `BAAI/bge-large-en-v1.5` | 1024 | High-accuracy RAG, English text |
| `BAAI/bge-m3` | 1024 | Multilingual, dense/sparse/multi-vector |
| `intfloat/e5-base-v2` | 768 | General retrieval, English text |
| `intfloat/e5-large-v2` | 1024 | High-accuracy retrieval, English text |
| `intfloat/e5-mistral-7b-instruct` | 4096 | High-dimensional embeddings, advanced RAG |
| `nomic-ai/nomic-embed-text-v1` | 768 | General-purpose, open weights |

### Choosing Dimensions

- **Higher dimensions (1024-4096)**: Better semantic fidelity, higher storage/compute costs.
- **Lower dimensions (384-768)**: Faster queries, lower costs, suitable for many use cases.
- **Variable dimensions**: Some models (OpenAI v3, Cohere v4) allow dimension reduction with minimal accuracy loss.
- **Legacy models**: Older OpenAI GPT-3 models (Curie: 4096, Davinci: 12288) are deprecated but may still be in use.

### References

- OpenAI Embeddings Guide: https://platform.openai.com/docs/guides/embeddings
- Cohere Embed Models: https://docs.cohere.com/docs/cohere-embed
- Google Gemini Embeddings: https://ai.google.dev/gemini-api/docs/embeddings
- HuggingFace Sentence Transformers: https://huggingface.co/sentence-transformers


