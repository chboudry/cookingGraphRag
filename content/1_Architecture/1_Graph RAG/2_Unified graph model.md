# Unified graph model

The **unified graph** is a single store that holds **both structured and unstructured data**, linked together so retrieval can use lexical search (over text/embeddings) and graph traversal (over entities and relations) in one place.

- **Structured data**: entities (typed nodes), relationships (typed edges), schema (e.g. Person, Organization, WORKS_AT).
- **Unstructured data**: text chunks (raw passages), optionally with embeddings attached to chunk nodes.
- **Links**: chunks are connected to entities they mention (e.g. `Chunk --MENTIONS--> Entity`); entities are connected to each other by relations. So the same graph contains passages and the knowledge graph, and we can traverse from a chunk to its entities or from an entity to its chunks.

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
  subgraph UNIFIED["Unified graph"]

    subgraph UNSTRUCTURED["Unstructured"]
      C1[Chunk 1<br/>text + embedding]
      C2[Chunk 2<br/>text + embedding]
      C3[Chunk 3<br/>text + embedding]
    end

    subgraph STRUCTURED["Structured"]
      E1[Entity: Person]
      E2[Entity: Org]
      E3[Entity: Concept]
      E1 -->|WORKS_AT| E2
      E2 -->|RELATES_TO| E3
      E1 -->|ABOUT| E3
    end

    C1 -->|MENTIONS| E1
    C1 -->|MENTIONS| E2
    C2 -->|MENTIONS| E2
    C2 -->|MENTIONS| E3
    C3 -->|MENTIONS| E1
  end
```

**Why both?**

| Data | Role |
|------|------|
| **Unstructured (chunks)** | Lexical / semantic search (vector similarity), full text for citations and context. |
| **Structured (entities + relations)** | Domain logic, multi-hop reasoning, entity-centric retrieval. |
| **Chunk–entity links** | From a retrieved chunk, follow to related entities; from a matched entity, gather all chunks that mention it. |

One graph, one store: structured and unstructured nodes plus the edges between them.
