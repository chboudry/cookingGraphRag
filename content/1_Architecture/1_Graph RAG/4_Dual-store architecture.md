# Dual-store architecture (Neo4j + vector store)

Alternative to a unified graph: **two separate bases** — **Neo4j** for the knowledge graph (Document, Chunk, Entity, relations) and a **vector store** for chunk embeddings. Ingestion writes to both; retrieval queries both and merges results before the LLM.

---

## Architecture overview

```mermaid
%%{init:{
  'theme':'base',
  'themeVariables':{
    'primaryColor':'#008CC2',
    'textColor':'#000000',
    'lineColor':'#006494'
  }
}}%%
flowchart LR

  subgraph I["Ingestion (offline)"]
    S[Data sources] --> L[Load & normalize]
    L --> C[Chunking]
    C --> E1[Embedding model]
    E1 --> VS
    C --> NER[Entity extraction]
    NER --> N4J
  end

  subgraph STORES["Stores"]
    VS[(Vector store<br/>chunk embeddings)]
    N4J[(Neo4j<br/>graph: Doc, Chunk, Entity)]
  end

  subgraph Q["Query (online)"]
    U[User question] --> P[Preprocessing]
    P --> E2[Embedding model]
    E2 --> VR[Vector retriever]
    P --> GR[Graph retriever]
    VS --> VR
    N4J --> GR
    VR --> M[Merge & rank]
    GR --> M
    M --> K[Contexts]
    K --> B[Prompt builder]
    B --> LLM[LLM]
    LLM --> A[Answer]
  end
```

- **Vector store**: chunk text + embeddings; no graph. Use for similarity search (e.g. top-K chunks by embedding).
- **Neo4j**: Document, Chunk, Entity nodes and PART_OF, NEXT, HAS_ENTITY, RELATES_TO. Use for entity resolution, neighborhood expansion, and structural queries.
- **Ingestion**: chunking and embedding → vector store; chunking + entity extraction → Neo4j (with chunk–entity links). Chunk identifiers can be shared so the retriever can join results (e.g. same chunk from vector search and from graph).
- **Retrieval**: run vector search and graph queries (optionally in parallel), then merge and rank before building the prompt.

---

## Retrieval flow (dual-store)

At query time the **retriever** calls **both** the vector store and Neo4j, then merges the results and sends a single context to the LLM.

```mermaid
sequenceDiagram
  participant User
  participant Retriever
  participant VectorStore
  participant Neo4j
  participant LLM

  User->>Retriever: Question

  par Query both stores
    Retriever->>Retriever: Embed query
    Retriever->>VectorStore: Similarity search (top-K chunks)
    VectorStore-->>Retriever: Chunks + scores
    Retriever->>Retriever: Map query to entities
    Retriever->>Neo4j: Graph query (entity neighborhoods, paths)
    Neo4j-->>Retriever: Subgraph / chunks via HAS_ENTITY
  end

  Retriever->>Retriever: Merge & rank (chunks + graph context)
  Retriever->>LLM: Prompt (question + merged contexts)
  LLM-->>Retriever: Answer + citations
  Retriever-->>User: Answer + sources
```

- **Vector store**: returns top-K chunks by semantic similarity; no graph.
- **Neo4j**: returns entity neighborhoods (and optionally chunks linked via HAS_ENTITY) for the resolved query entities.
- **Merge**: deduplicate by chunk ID if the same chunk comes from both stores; rank by score and relevance; then build one context string for the LLM.
- **LLM**: receives a single prompt (question + merged contexts) and returns the answer; the retriever adds sources (chunk/doc references).

This flow keeps graph and vectors separate while still supporting hybrid retrieval (lexical + structural) and a single answer path through the LLM.
