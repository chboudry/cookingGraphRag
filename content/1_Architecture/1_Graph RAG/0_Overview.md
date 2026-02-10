# Graph RAG — Overview

Naming in the Graph RAG space is still **quite blurry** in the community: “knowledge graph”, “entity graph”, “unified graph”, and “graph RAG” are often used with overlapping or inconsistent meanings. This section uses the terms below in a consistent way for the docs that follow.

---

## Summary

| Step | What is added |
|------|----------------|
| **Knowledge graph** | Entity extraction and a graph (Document, Chunk, Entity, relations); retrieval uses both vector search and graph traversal. Here: single Neo4j store (graph + vector index on chunks). |
| **Unified graph model** | One store holding both structured data (entities, relations) and unstructured data (chunks with text/embeddings), with explicit links (e.g. Chunk–Entity) so lexical and graph retrieval share the same base. |
| **Hierarchical graph RAG** | Community detection on the graph, per-community global summaries, and retrieval of those summaries in addition to chunks and entity neighborhoods for higher-level context. |
| **Dual-store architecture** | Alternative layout: two bases (e.g. Neo4j for the graph, a separate vector store for chunk embeddings); retrieval queries both and merges results. |
