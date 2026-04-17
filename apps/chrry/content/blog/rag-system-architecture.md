---
title: "RAG System Architecture: Advanced Retrieval-Augmented Generation"
excerpt: "Deep dive into Vex's sophisticated RAG implementation that combines document retrieval with conversation history for contextually aware AI responses."
date: "2025-08-29"
author: "Vex"
---

# RAG System Architecture: Advanced Retrieval-Augmented Generation

## Overview

Retrieval-Augmented Generation (RAG) enhances AI responses by retrieving relevant information from external sources before generating answers. Vex implements a sophisticated RAG system that combines document retrieval with conversation history analysis, creating contextually rich and accurate AI interactions.

## Core Components

### 1. Document RAG System

- **File Processing**: Automatic chunking and embedding of uploaded documents
- **Vector Search**: Semantic similarity matching for relevant content retrieval
- **Context Integration**: Seamless injection of retrieved content into AI prompts

### 2. Conversation History RAG

- **Message Indexing**: Past conversations stored and embedded for retrieval
- **Thread Context**: Maintains conversation continuity across sessions
- **Temporal Relevance**: Recent messages weighted higher in retrieval

### 3. Hybrid Retrieval

- **Multi-Source**: Combines document and conversation retrieval
- **Relevance Scoring**: Advanced ranking algorithms for optimal context selection
- **Dynamic Context**: Adapts retrieval strategy based on query type

## Technical Implementation

### Document Processing Pipeline

```typescript
// Document upload and processing
export const processDocument = async (file: File, threadId: string) => {
  // Extract text content
  const content = await extractTextContent(file);

  // Chunk document into manageable pieces
  const chunks = await chunkDocument(content, {
    maxChunkSize: 1000,
    overlapSize: 200,
    preserveStructure: true,
  });

  // Generate embeddings for each chunk
  const embeddings = await Promise.all(chunks.map((chunk) => generateEmbedding(chunk.content)));

  // Store in vector database
  await storeDocumentChunks({
    threadId,
    fileName: file.name,
    chunks: chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index],
      metadata: {
        fileName: file.name,
        chunkIndex: index,
        threadId,
      },
    })),
  });

  return { chunksProcessed: chunks.length };
};
```

### Vector Search Implementation

```typescript
// Semantic search for relevant content
export const searchRelevantContent = async (
  query: string,
  threadId: string,
  options: SearchOptions = {},
) => {
  const {
    maxResults = 5,
    includeDocuments = true,
    includeMessages = true,
    relevanceThreshold = 0.7,
  } = options;

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  const results = [];

  // Search document chunks
  if (includeDocuments) {
    const documentResults = await vectorSearch({
      embedding: queryEmbedding,
      collection: "document_chunks",
      filter: { threadId },
      limit: maxResults,
      threshold: relevanceThreshold,
    });
    results.push(...documentResults);
  }

  // Search conversation history
  if (includeMessages) {
    const messageResults = await vectorSearch({
      embedding: queryEmbedding,
      collection: "message_history",
      filter: { threadId },
      limit: maxResults,
      threshold: relevanceThreshold,
    });
    results.push(...messageResults);
  }

  // Rank and deduplicate results
  return rankResults(results, queryEmbedding);
};
```

### Context Integration

```typescript
// Integrate RAG results into AI prompt
export const buildContextualPrompt = async (
  userMessage: string,
  threadId: string,
  systemPrompt: string,
) => {
  // Retrieve relevant context
  const relevantContent = await searchRelevantContent(userMessage, threadId);

  // Build context sections
  const documentContext = relevantContent
    .filter((item) => item.type === "document")
    .map((item) => `[${item.fileName}]: ${item.content}`)
    .join("\n\n");

  const conversationContext = relevantContent
    .filter((item) => item.type === "message")
    .map((item) => `Previous: ${item.content}`)
    .join("\n");

  // Construct enhanced prompt
  const contextualPrompt = `
${systemPrompt}

## Relevant Documents
${documentContext}

## Conversation History
${conversationContext}

## Current Query
${userMessage}

Please provide a response that takes into account the relevant documents and conversation history above.
`;

  return contextualPrompt;
};
```

## Advanced Features

### Smart Chunking Strategy

```typescript
// Intelligent document chunking
export const chunkDocument = async (content: string, options: ChunkingOptions) => {
  const { maxChunkSize, overlapSize, preserveStructure } = options;

  // Detect document structure
  const structure = analyzeDocumentStructure(content);

  const chunks = [];

  if (preserveStructure && structure.hasHeadings) {
    // Chunk by sections while respecting headings
    chunks.push(...chunkByStructure(content, structure, maxChunkSize));
  } else {
    // Standard sliding window chunking
    chunks.push(...slidingWindowChunk(content, maxChunkSize, overlapSize));
  }

  // Add metadata to each chunk
  return chunks.map((chunk, index) => ({
    content: chunk,
    index,
    wordCount: chunk.split(" ").length,
    metadata: extractChunkMetadata(chunk, structure),
  }));
};
```

### Embedding Generation

```typescript
// Generate embeddings using OpenAI
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.substring(0, 8000), // Respect token limits
    encoding_format: "float",
  });

  return response.data[0].embedding;
};

// Batch embedding generation for efficiency
export const generateBatchEmbeddings = async (texts: string[]): Promise<number[][]> => {
  const batchSize = 100;
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: batch,
      encoding_format: "float",
    });

    embeddings.push(...response.data.map((item) => item.embedding));
  }

  return embeddings;
};
```

### Conversation History Integration

````typescript
// Index conversation messages for RAG
export const indexConversationMessage = async (message: Message, threadId: string) => {
  // Skip system messages and very short messages
  if (message.role === "system" || message.content.length < 50) {
    return;
  }

  // Generate embedding for message content
  const embedding = await generateEmbedding(message.content);

  // Store in message history index
  await storeMessageEmbedding({
    messageId: message.id,
    threadId,
    content: message.content,
    role: message.role,
    timestamp: message.createdAt,
    embedding,
    metadata: {
      wordCount: message.content.split(" ").length,
      hasCodeBlocks: message.content.includes("```"),
      hasLinks: message.content.includes("http"),
    },
  });
};

// Retrieve relevant conversation history
export const getRelevantHistory = async (
  query: string,
  threadId: string,
  maxResults: number = 3,
) => {
  const queryEmbedding = await generateEmbedding(query);

  const results = await vectorSearch({
    embedding: queryEmbedding,
    collection: "message_history",
    filter: { threadId },
    limit: maxResults * 2, // Get more to filter
    threshold: 0.6,
  });

  // Prioritize recent messages and diverse content
  return diversifyResults(results, maxResults);
};
````

## Database Schema

### Document Storage

```sql
-- Document chunks table
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY,
  thread_id UUID NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI embedding dimension
  word_count INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_thread_embedding (thread_id, embedding),
  INDEX idx_file_chunks (thread_id, file_name, chunk_index)
);

-- Document metadata table
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  thread_id UUID NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  total_chunks INTEGER,
  processing_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(thread_id, file_name)
);
```

### Message History Storage

```sql
-- Message embeddings table
CREATE TABLE message_embeddings (
  id UUID PRIMARY KEY,
  message_id UUID NOT NULL,
  thread_id UUID NOT NULL,
  content TEXT NOT NULL,
  role VARCHAR(20) NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_thread_embedding (thread_id, embedding),
  INDEX idx_message_thread (message_id, thread_id)
);
```

## Performance Optimizations

### Caching Strategy

```typescript
// LRU cache for embeddings
const embeddingCache = new LRUCache<string, number[]>({
  max: 10000,
  ttl: 1000 * 60 * 60, // 1 hour
});

// Cache embedding generation
export const getCachedEmbedding = async (text: string): Promise<number[]> => {
  const cacheKey = createHash("sha256").update(text).digest("hex");

  let embedding = embeddingCache.get(cacheKey);
  if (!embedding) {
    embedding = await generateEmbedding(text);
    embeddingCache.set(cacheKey, embedding);
  }

  return embedding;
};
```

### Batch Processing

```typescript
// Process multiple documents concurrently
export const processBatchDocuments = async (files: File[], threadId: string) => {
  const concurrencyLimit = 3;
  const results = [];

  for (let i = 0; i < files.length; i += concurrencyLimit) {
    const batch = files.slice(i, i + concurrencyLimit);

    const batchResults = await Promise.all(batch.map((file) => processDocument(file, threadId)));

    results.push(...batchResults);
  }

  return results;
};
```

## User Experience Integration

### Frontend Implementation

```typescript
// React component for RAG-enhanced chat
const RAGChat = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUpload = async (files: FileList) => {
    setIsProcessing(true)

    try {
      const uploadPromises = Array.from(files).map(file =>
        uploadAndProcessDocument(file, threadId)
      )

      const results = await Promise.all(uploadPromises)

      // Update document list
      const newDocs = results.map(result => ({
        name: result.fileName,
        chunks: result.chunksProcessed,
        status: 'processed'
      }))

      setDocuments(prev => [...prev, ...newDocs])

      toast.success(`Processed ${files.length} documents`)
    } catch (error) {
      toast.error('Failed to process documents')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="rag-chat">
      <DocumentUpload
        onUpload={handleFileUpload}
        isProcessing={isProcessing}
      />

      <DocumentList documents={documents} />

      <ChatInterface
        ragEnabled={documents.length > 0}
        threadId={threadId}
      />
    </div>
  )
}
```

### Document Upload Component

```typescript
const DocumentUpload = ({ onUpload, isProcessing }) => {
  const handleDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file =>
      ['application/pdf', 'text/plain', 'text/markdown'].includes(file.type)
    )

    if (validFiles.length !== acceptedFiles.length) {
      toast.warning('Some files were skipped (unsupported format)')
    }

    if (validFiles.length > 0) {
      onUpload(validFiles)
    }
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  return (
    <div
      {...getRootProps()}
      className={`upload-zone ${isDragActive ? 'active' : ''}`}
    >
      <input {...getInputProps()} />

      {isProcessing ? (
        <div className="processing">
          <Spinner />
          <span>Processing documents...</span>
        </div>
      ) : (
        <div className="upload-prompt">
          <FileText size={48} />
          <p>Drop documents here or click to upload</p>
          <small>Supports PDF, TXT, MD (max 10MB each)</small>
        </div>
      )}
    </div>
  )
}
```

## Quality Assurance

### Relevance Scoring

```typescript
// Advanced relevance scoring algorithm
export const scoreRelevance = (
  queryEmbedding: number[],
  resultEmbedding: number[],
  metadata: any,
): number => {
  // Base cosine similarity
  const cosineSimilarity = calculateCosineSimilarity(queryEmbedding, resultEmbedding);

  // Recency boost for conversation history
  let recencyBoost = 1;
  if (metadata.timestamp) {
    const hoursSinceCreation = (Date.now() - metadata.timestamp) / (1000 * 60 * 60);
    recencyBoost = Math.exp(-hoursSinceCreation / 24); // Decay over 24 hours
  }

  // Content type boost
  let contentBoost = 1;
  if (metadata.hasCodeBlocks) contentBoost *= 1.1;
  if (metadata.wordCount > 100) contentBoost *= 1.05;

  return cosineSimilarity * recencyBoost * contentBoost;
};
```

### Result Diversification

```typescript
// Ensure diverse and non-redundant results
export const diversifyResults = (results: SearchResult[], maxResults: number): SearchResult[] => {
  const diversified: SearchResult[] = [];
  const usedSources = new Set<string>();

  // Sort by relevance score
  const sortedResults = results.sort((a, b) => b.score - a.score);

  for (const result of sortedResults) {
    if (diversified.length >= maxResults) break;

    // Avoid too many results from same source
    const sourceKey = `${result.type}-${result.fileName || result.threadId}`;
    const sourceCount = Array.from(usedSources).filter((s) => s.startsWith(sourceKey)).length;

    if (sourceCount < 2) {
      // Max 2 results per source
      diversified.push(result);
      usedSources.add(`${sourceKey}-${diversified.length}`);
    }
  }

  return diversified;
};
```

## Monitoring and Analytics

### Performance Metrics

```typescript
// Track RAG system performance
export const trackRAGMetrics = {
  searchLatency: (duration: number) => {
    metrics.histogram("rag.search.latency", duration);
  },

  embeddingGeneration: (count: number, duration: number) => {
    metrics.histogram("rag.embedding.generation_time", duration);
    metrics.counter("rag.embedding.generated", count);
  },

  retrievalAccuracy: (queryType: string, relevantResults: number) => {
    metrics.histogram("rag.retrieval.relevant_results", relevantResults, {
      query_type: queryType,
    });
  },

  documentProcessing: (fileName: string, chunks: number, duration: number) => {
    metrics.histogram("rag.document.processing_time", duration);
    metrics.histogram("rag.document.chunks_generated", chunks);
  },
};
```

### Usage Analytics

```typescript
// Analyze RAG usage patterns
export const analyzeRAGUsage = async (threadId: string) => {
  const stats = await db.query(
    `
    SELECT 
      COUNT(*) as total_searches,
      AVG(array_length(results, 1)) as avg_results_per_search,
      COUNT(DISTINCT file_name) as unique_documents_accessed
    FROM rag_search_logs 
    WHERE thread_id = $1 
    AND created_at > NOW() - INTERVAL '30 days'
  `,
    [threadId],
  );

  return stats.rows[0];
};
```

## Best Practices

### 1. Content Preparation

- **Clean Text**: Remove formatting artifacts before embedding
- **Optimal Chunking**: Balance chunk size for context vs. precision
- **Metadata Enrichment**: Add relevant metadata for better filtering

### 2. Query Optimization

- **Query Expansion**: Enhance user queries with synonyms and context
- **Multi-Modal Search**: Combine keyword and semantic search
- **Relevance Tuning**: Continuously adjust scoring algorithms

### 3. Performance Optimization

- **Embedding Caching**: Cache frequently accessed embeddings
- **Batch Processing**: Process multiple documents concurrently
- **Index Optimization**: Use appropriate vector database indexes

### 4. Quality Control

- **Result Validation**: Implement relevance thresholds
- **Diversity Enforcement**: Avoid redundant results
- **Feedback Integration**: Learn from user interactions

## Security Considerations

### Data Privacy

- **Thread Isolation**: Ensure documents are only accessible within their thread
- **User Permissions**: Validate user access to thread resources
- **Data Encryption**: Encrypt sensitive document content

### Content Filtering

- **Malicious Content**: Scan uploaded documents for threats
- **PII Detection**: Identify and handle personally identifiable information
- **Content Moderation**: Filter inappropriate or harmful content

## Future Enhancements

### Advanced Features

- **Multi-Modal RAG**: Support for images and audio content
- **Real-Time Updates**: Live document synchronization
- **Collaborative RAG**: Shared knowledge bases across teams

### AI Improvements

- **Custom Embeddings**: Fine-tuned embeddings for domain-specific content
- **Hybrid Search**: Combine dense and sparse retrieval methods
- **Adaptive Chunking**: Dynamic chunk sizing based on content type

## Conclusion

Vex's RAG system represents a sophisticated approach to contextual AI interactions, combining document retrieval with conversation history analysis. The system's architecture enables accurate, relevant, and contextually aware responses while maintaining high performance and user experience standards.

The integration of multiple retrieval sources, advanced ranking algorithms, and intelligent caching creates a powerful foundation for knowledge-augmented AI conversations. This implementation serves as a blueprint for building production-ready RAG systems that scale with user needs and content complexity.
