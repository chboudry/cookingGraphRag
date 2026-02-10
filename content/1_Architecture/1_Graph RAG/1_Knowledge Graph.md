# Graph RAG with Entities

After chunking, we extract **entities** and **relationships** from the text and store everything in **Neo4j**: the graph (Document, Chunk, Entity, relations) and the chunk embeddings (vector index in Neo4j). Retrieval uses both vector similarity search and graph traversal in the same base.

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
    C --> NER[Entity extraction<br/>NER / LLM]
  end

  subgraph N4J["Neo4j"]
    direction TB
    V[(Vector index<br/>chunk embeddings)]
    G[(Graph<br/>Doc, Chunk, Entity, relations)]
  end

  E1 --> V
  NER --> G

  subgraph Q["Query / Answering (online)"]
    U[User question] --> P[Prompt + preprocessing]
    P --> E2[Embedding model]
    E2 --> R[Retriever]
    V --> R
    G --> R
    R --> K[Top-K contexts]
    K --> B[Prompt builder]
    B --> LLM[LLM]
    LLM --> A[Answer + sources]
  end
```
---

### Database After Ingestion

Everything lives in **Neo4j**:

- **Chunks**: nodes with text, position, and **embedding** (stored in a Neo4j vector index for similarity search).
- **Documents** and **Entities**: nodes with identifiers, types, and properties.
- **Relations**: PART_OF, NEXT, HAS_ENTITY, RELATES_TO (graph edges in Neo4j).
- **Vector index**: on chunk embeddings, so semantic search and graph queries run in the same store.

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
    +vector embedding
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
- **Chunk**: unstructured passage; **PART_OF** a document, **NEXT** for order, **HAS_ENTITY** to entities; `embedding` is stored in Neo4j and indexed for vector search.
- **Entity**: structured node; **RELATES_TO** links entities to each other (e.g. Person—WORKS_AT—Organization). `type` and `properties` are constrained in a strict schema, open in a free schema.

---

## Retrieval flow (sequence)

At query time the **retriever** queries **Neo4j** only: vector search on the chunk index and graph queries (entity neighborhoods). The LLM then gets the merged context.

```mermaid
sequenceDiagram
  participant User
  participant Retriever
  participant Neo4j
  participant LLM

  User->>Retriever: Question
  Retriever->>Neo4j: Vector search (chunk embeddings)
  Retriever->>Neo4j: Graph query (entity neighborhoods)
  Neo4j-->>Retriever: Top-K chunks + subgraph
  Retriever->>LLM: Prompt (question + contexts)
  LLM-->>Retriever: Answer + citations
  Retriever-->>User: Answer + sources
```
