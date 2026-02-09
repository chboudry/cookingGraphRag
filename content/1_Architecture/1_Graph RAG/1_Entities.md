# Graph RAG with Entities

After chunking, we extract **entities** and **relationships** from the text and store them in a graph. Retrieval can then use both embeddings (lexical) and the graph (structural).

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

  subgraph I["Ingestion / Indexing (offline)"]
    S[Data sources] --> L[Load & normalize]
    L --> C[Chunking]
    C --> E1[Embedding model]
    E1 --> VS[(Vector store)]
    C --> NER[Entity extraction<br/>NER / LLM]
    NER --> KG[(Knowledge graph<br/>entities + relations)]
  end

  subgraph Q["Query / Answering (online)"]
    U[User question] --> P[Prompt + preprocessing]
    P --> E2[Embedding model]
    E2 --> R[Retriever]
    VS --> R
    KG -.-> R
    R --> K[Top-K contexts]
    K --> B[Prompt builder]
    B --> LLM[LLM]
    LLM --> A[Answer + sources]
  end
```
---

### Database After Ingestion

After ingestion you have:

- **Chunks**: text passages + optional embedding reference and source metadata.
- **Entities**: nodes with an identifier, type (or label), name, and optional properties.
- **Relations**: directed edges between entities (type, source, target).
- **Chunk–entity links**: which chunks mention which entities (e.g. `MENTIONS`), so retrieval can go from text to graph and back.

The following class diagram summarizes the **conceptual model** of what is stored: three node types (**Document**, **Chunk**, **Entity**) and four relation types.

```mermaid
classDiagram
  class Document {
    +string id
    +string source
    +object metadata
  }

  class Chunk {
    +string id
    +string text
    +string embedding_ref
    +int position
  }

  class Entity {
    +string id
    +string type
    +string name
    +object properties
  }

  Chunk "*" --> "1" Document : PART_OF
  Chunk "1" --> "0..1" Chunk : NEXT
  Chunk "*" --> "*" Entity : HAS_ENTITY
  Entity "*" --> "*" Entity : RELATES_TO
```

- **Document**: source unit (file, URL, etc.); chunks are part of it via **PART_OF**.
- **Chunk**: unstructured passage; **PART_OF** a document, **NEXT** links to the following chunk in order, **HAS_ENTITY** links to entities mentioned in the chunk.
- **Entity**: structured node; **RELATES_TO** links entities to each other (e.g. Person—WORKS_AT—Organization). `type` and `properties` are constrained in a strict schema, open in a free schema.

---

## Retrieval flow (sequence)

At query time, the **user** sends a question; the **retriever** queries the **base** (vector store + graph), then the **LLM** produces an answer from the retrieved context.

```mermaid
sequenceDiagram
  participant User
  participant Retriever
  participant Base
  participant LLM

  User->>Retriever: Question
  Retriever->>Base: Search (embedding + graph query)
  Base-->>Retriever: Top-K chunks + entity neighborhoods
  Retriever->>LLM: Prompt (question + contexts)
  LLM-->>Retriever: Answer + citations
  Retriever-->>User: Answer + sources
```
