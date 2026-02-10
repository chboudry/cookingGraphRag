# Unified graph model

This page illustrates the unified graph with a **pharmaceutical use case**: a base of **drug compositions** (medications, active ingredients, forms) in an RDBMS, and **research documents** (papers, monographs). The graph unifies both so retrieval can combine structured drug data and unstructured literature.

---

## What “structured” means here

The term **structured data** is ambiguous. In data engineering it usually refers to **relational (RDBMS) data** (tables, rows, keys). In knowledge graphs and GenAI it often means **semantically structured** data—entities and relationships—as opposed to raw text. Here we use *structured* in the first sense: data that already lives in a database (e.g. drug compositions, ingredients), which we ingest into the graph as **business entities** and relations.

---

## Definition

**Unified graph model** means a **single store** that holds:

- **Relational data** ingested from RDBMS: e.g. medications, active ingredients, pharmaceutical forms, compositions—mapped into the graph as business entities and typed relationships.
- **Unstructured documents**: e.g. research papers, clinical documents—chunked into passages (chunks) with optional embeddings.

Everything lives in one **semantic graph**, with **explicit links** between chunks and business entities (e.g. a chunk from a paper mentions a drug that also exists as a Medication node from the DB). Retrieval can then combine vector search over chunks, graph traversal over entities and relations, and follow links from chunks to entities or the reverse.

---

## Conceptual view (pharma example)

RDBMS (drug database) is often imported **before** research documents so that entities extracted from chunks can be resolved to existing medications and ingredients. The diagram shows: (1) nodes from RDBMS with labels **Medication**, **ActiveIngredient**, **PharmaceuticalForm**; (2) chunks from research docs and **entities extracted from chunks**; (3) a relation from those extracted entities to the RDBMS-derived nodes.

```mermaid
%%{init:{
  'theme':'base',
  'themeVariables':{
    'primaryColor':'#008CC2',
    'textColor':'#000000',
    'lineColor':'#006494'
  }
}}%%
flowchart TB
  subgraph SOURCES["Sources"]
    RDB[(RDBMS /<br/>drug compositions)]
    DOC[Research documents<br/>papers, monographs]
  end

  subgraph UNIFIED["Unified graph (one store)"]

    subgraph RDB_NODES["From RDBMS: business entities + relations"]
      M[Medication]
      A[ActiveIngredient]
      F[PharmaceuticalForm]
      M -->|CONTAINS| A
      M -->|HAS_FORM| F
      A -->|IN_FORM| F
    end

    subgraph CHUNKS["From docs: chunks"]
      C1[Chunk 1<br/>text + embedding]
      C2[Chunk 2<br/>text + embedding]
      C3[Chunk 3<br/>text + embedding]
    end

    subgraph EXTRACTED["From chunks: extracted entities"]
      Ex1[Entity: medication mention]
      Ex2[Entity: ingredient mention]
      Ex3[Entity: form mention]
    end

    C1 -->|MENTIONS| Ex1
    C1 -->|MENTIONS| Ex2
    C2 -->|MENTIONS| Ex2
    C2 -->|MENTIONS| Ex3
    C3 -->|MENTIONS| Ex1

    Ex1 -->|RESOLVES_TO| M
    Ex2 -->|RESOLVES_TO| A
    Ex3 -->|RESOLVES_TO| F
  end

  RDB --> RDB_NODES
  DOC --> CHUNKS
  CHUNKS --> EXTRACTED
```

- **From RDBMS**: **Medication**, **ActiveIngredient**, **PharmaceuticalForm** and relations (e.g. CONTAINS, HAS_FORM, IN_FORM).
- **From documents**: **chunks** (research text + optional embeddings).
- **From chunks**: **entities extracted** from text (medication/ingredient/form mentions).
- **Chunk → MENTIONS → extracted entity** then **RESOLVES_TO → Medication | ActiveIngredient | PharmaceuticalForm**: so retrieval can join literature context and drug data.

---

## Why unify?

| Data | Role |
|------|------|
| **Unstructured (chunks)** | Lexical / semantic search over research text, full passages for citations and context. |
| **Relational → entities + relations** | Drug compositions, multi-hop reasoning (e.g. medication → ingredients → forms), alignment with the drug database. |
| **Chunk–entity links** | From a retrieved chunk, follow to related medications/ingredients; from a matched medication, gather all chunks that mention it. |

One graph, one store: drug data (as entities/relations), research chunks, and explicit links between them.

---

## Ingestion (sequence diagram)

Ingestion runs with the drug RDBMS loaded first, then research documents; entities extracted from chunks are resolved to Medication, ActiveIngredient, PharmaceuticalForm.

```mermaid
sequenceDiagram
  participant Pipeline
  participant RDBMS
  participant Documents
  participant Embedding
  participant NER
  participant Graph

  opt RDBMS first
    Pipeline->>RDBMS: Read schema + drug compositions
    RDBMS-->>Pipeline: Medication, ActiveIngredient, Form rows
    Pipeline->>Graph: Write business entities + relations
  end

  Pipeline->>Documents: Load & chunk research docs
  Documents-->>Pipeline: Chunks
  Pipeline->>Graph: Write chunks

  Pipeline->>Embedding: Embed chunks
  Embedding-->>Pipeline: Vectors
  Pipeline->>Graph: Attach embeddings to chunks

  Pipeline->>NER: Extract entities from chunk text (drug, ingredient, form)
  NER-->>Pipeline: Entity mentions per chunk
  Pipeline->>Graph: Write extracted entities + MENTIONS

  Pipeline->>Graph: Resolve entities (RESOLVES_TO Medication, ActiveIngredient, PharmaceuticalForm)
  Graph-->>Pipeline: Graph ready
```

- **RDBMS first (opt)**: load drug compositions into the graph as Medication, ActiveIngredient, PharmaceuticalForm and relations.
- **Documents**: load and chunk research papers; write chunks into the graph.
- **Embedding** / **NER** / **Resolve**: same as before, with pharma entity types.

---

## Retrieval

Two retrieval strategies can be used (alone or combined): **embedding-first** (cosine similarity on chunks then graph expand) and **text2cypher** (natural language → Cypher on the RDBMS-shaped schema, then expand to bring back related entities and chunks). Both feed a single context to the LLM.

### 1. Embedding-first retrieval

The user question is converted into an embedding; we run **cosine similarity** over chunk embeddings to get top-K chunks, then **expand** on the graph (follow MENTIONS and RESOLVES_TO to reach Medication, ActiveIngredient, etc.) and add those nodes (and optionally neighboring chunks) to the context.

```mermaid
sequenceDiagram
  participant User
  participant Retriever
  participant Embedding
  participant Graph
  participant LLM

  User->>Retriever: Question (e.g. interactions with drug X)
  Retriever->>Embedding: Encode question
  Embedding-->>Retriever: Query vector
  Retriever->>Graph: Cosine similarity on chunk embeddings (top-K)
  Graph-->>Retriever: Top-K chunks
  Retriever->>Graph: Expand from chunks (MENTIONS → extracted entity → RESOLVES_TO → Medication, ActiveIngredient, …)
  Graph-->>Retriever: Neighboring graph nodes (and optionally chunks)
  Retriever->>Retriever: Build context (chunks + graph nodes)
  Retriever->>LLM: Prompt (question + context)
  LLM-->>User: Answer + sources
```

- **Cosine similarity** selects the most relevant research chunks.
- **Expand** pulls in related medications, ingredients, and forms (and optionally more chunks) so the LLM sees both text and structured drug data.

### 2. Text2Cypher retrieval

A **text2cypher** agent turns the natural-language question into a Cypher query that **matches the RDBMS-derived schema** (Medication, ActiveIngredient, PharmaceuticalForm). The query is run on the graph; we then **expand** from the matched nodes (e.g. follow relations to other entities and to chunks that MENTION them) and add the result to the context for the LLM.

```mermaid
sequenceDiagram
  participant User
  participant Retriever
  participant Text2Cypher
  participant Graph
  participant LLM

  User->>Retriever: Question (e.g. which medications contain ingredient Y?)
  Retriever->>Text2Cypher: Question + schema (Medication, ActiveIngredient, …)
  Text2Cypher-->>Retriever: Cypher query
  Retriever->>Graph: Execute Cypher (match on Medication, ActiveIngredient, …)
  Graph-->>Retriever: Matched RDBMS-shaped nodes
  Retriever->>Graph: Expand (relations to other entities, MENTIONS to chunks from research docs)
  Graph-->>Retriever: Expanded subgraph (entities + chunks)
  Retriever->>Retriever: Build context (graph results + chunks)
  Retriever->>LLM: Prompt (question + context)
  LLM-->>User: Answer + sources
```

- **Text2Cypher** aligns the question with the drug DB schema and produces Cypher that targets Medication, ActiveIngredient, PharmaceuticalForm (and their relations).
- **Expand** brings back related entities and **chunks from research documents** linked via MENTIONS, so the LLM gets both structured composition data and relevant literature in the same context.


Neo4j has a full example able to achieve this : https://github.com/neo4j-field/pubmed-knowledge-graph-generation 