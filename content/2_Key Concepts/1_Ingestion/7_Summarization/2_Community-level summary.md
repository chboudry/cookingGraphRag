# Community-level summary

A **community-level summary** is a short, human-readable description of a **cluster of entities** (a community) in the knowledge graph. It supports global retrieval, semantic routing, and high-level exploration.

---

## 1. Natural associations (detection ↔ summary type)

In theory, the two layers are independent: community detection = how you partition the graph; community summarization = how you describe each partition. You can run Leiden and then choose multi-document, structural, or representative summary for the same communities. In practice, the way communities are built influences which summary type fits best. These pairings work well:

| Community method | Nature of the community | Best summary types | Why |
|------------------|--------------------------|--------------------|-----|
| **Modularity-based (Leiden / Louvain)** | Cohesive, often topic-like, locally dense | **Multi-document** (best), **Topical**, optionally **Representative** | Communities are topic-like; narrative or thematic summary fits well. |
| **WCC (Weakly Connected Components)** | Strict connected components; often network-oriented (fraud, AML) | **Structural** (best), **Representative** | Meaning comes from **structure**, not necessarily from text. |
| **kNN-based clustering** (embedding graph) | Semantic clusters based on content similarity | **Topical** (best), **Multi-document** | Semantic coherence; little explicit relational structure. |
| **Domain-based partitioning** | Business or logical segmentation | **Representative**, **template-based** summary | Segments are defined by domain; list key actors or use fixed templates. |

**What to avoid**

- **WCC + purely topical summary** — You lose the structural signal; the summary does not reflect why the component is interesting (connectivity, fraud pattern, etc.).
- **kNN clustering + deep structural summary** — There is little relational signal; the “graph” is similarity-based, so a structure-focused summary has little to describe.

---

## 2. How to build communities (community detection)

**Community detection** is the step that **partitions the graph** into clusters (communities). The choice of algorithm shapes the nature of the clusters and, in practice, which kind of summary will work best.

| Method | Use when | Typical use |
|--------|----------|-------------|
| **A. Leiden / Louvain** (modularity-based) | Dense graph; cohesive, high-modularity clusters; hierarchical GraphRAG | Most common today (e.g. Microsoft GraphRAG); topic-like clusters |
| **B. WCC** (Weakly Connected Components) | Strict connected components; sparse graph; hard structural boundaries | Fraud, AML, network security |
| **C. Label Propagation (LPA)** | Very large graphs; fast approximate clustering | Lower compute; less stable than Leiden |
| **D. kNN graph + clustering** | Embeddings; no strong structural relations; similarity graph | Semantic GraphRAG variants |
| **E. Domain-driven partitioning** | Business rules; partition by type, time, region | No algorithm; domain-defined segments |

### A. Leiden / Louvain (modularity-based clustering)

**Most common today** in GraphRAG-style systems (e.g. **Microsoft GraphRAG** uses hierarchical community detection that is modularity-based, Louvain-like).

**Use when:**

- The graph is **dense**.
- You want **cohesive, high-modularity** clusters.
- You aim for **hierarchical GraphRAG** (multiple levels of communities).

**Why it is popular:** Scales well, produces meaningful topic-like clusters, and works well for text-derived knowledge graphs.

---

### B. Weakly Connected Components (WCC)

**Use when:**

- You want **strict connected components** (every node in a component is reachable from every other, ignoring edge direction).
- The graph is **sparse**.
- You care about **hard structural boundaries** (e.g. disconnected subgraphs).

**Why it differs:** No optimization objective; it only finds connected subgraphs. More common in **fraud**, **AML**, and **network security** where connectivity itself is the main structure.

---

### C. Label Propagation (LPA)

**Use when:**

- Graphs are **very large**.
- You need **fast approximate** clustering.
- You can accept **less stability** than Leiden in exchange for lower compute.

---

### D. kNN graph + clustering

**Use when:**

- You start from **embeddings** (e.g. entity or chunk vectors).
- There are **no strong structural relations**; similarity is the main signal.
- You build a **similarity graph** (kNN edges) and then cluster that graph.

More common in **semantic GraphRAG** variants where the “graph” is induced from vector similarity rather than extracted relations.

---

### E. Domain-driven partitioning

**Use when:**

- Communities are **defined by business rules**, not only by algorithms.
- You partition by **entity type**, **time window**, **region**, or other domain logic.

No algorithmic clustering; the partition is given by the domain model.

---

## 3. The four summary types (overview)

| Order | Approach | Dominant signal | Typical use |
|-------|----------|-----------------|-------------|
| 1 | **Multi-document** (text-driven) | Text chunks, citations, document passages | Microsoft GraphRAG, most open-source implementations, many enterprise PoCs |
| 2 | **Topical** | Embeddings, keywords, global theme | Semantic routing, community-level vector index, quick overview |
| 3 | **Representative** | A few representative entities | Dashboards, reporting, actor-focused summary |
| 4 | **Structural** | Relations, centrality, graph motifs | Fraud, networks, IT, AML; explicability and pattern detection |

**Why multi-document dominates:** LLMs are strong at long-form synthesis; teams are text-first; implementation is cheap and requires little graph expertise. The downside is higher sensitivity to noise and extraction errors.

### A. Multi-document

**Goal:** Produce a **global narrative synthesis** of all document content attached to the community. *What do all the documents linked to this community say?*

**Signals:** All chunks linked to the community’s entities; document citations and narrative context.

**Typical method:** Collect chunks → filter/rank the most informative → send passages to the LLM → generate a multi-source narrative summary.

**Output:** A longer narrative summary, close to an abstract.

**Usage:** Document-style search, knowledge synthesis, exploratory analysis.

### B. Topical

**Goal:** Capture the **dominant topic** of the community. *What is this cluster about?*

**Signals:** Embeddings of linked chunks, centroid embedding, dominant keywords (e.g. TF-IDF), most frequent entity types.

**Typical method:** Collect linked chunks → compute centroid or dominant terms → give LLM 10–20 representative sentences or a keyword list → generate a short summary.

**Output:** e.g. *“This community focuses on anti-money laundering investigations related to cross-border transactions and shell companies.”*

**Usage:** Semantic routing, community-level vector index, quick overview.

### C. Representative-based

**Goal:** Summarize via a **small set of representative entities**. *Who best embodies this community?*

**Signals:** Top-K entities by centrality, frequency, or proximity to centroid embedding.

**Typical method:** Select 5–10 representative entities → retrieve their entity profile summaries → build a summary from these profiles (LLM or template).

**Output:** e.g. *“This cluster includes major suppliers (ABC Corp, Delta Ltd), key logistics partners, and regional distributors operating across Europe.”*

**Usage:** Dashboards, executive reporting, actor-oriented summary.

### D. Structural

**Goal:** Explain the **relational structure** of the community. *How are entities connected?*

**Signals:** High local PageRank entities, dominant relation types, recurring motifs, density/modularity.

**Typical method:** Run PageRank in the community → extract top central entities and dominant relation types → detect recurring patterns → give LLM structure description → generate structure-focused summary.

**Output:** e.g. *“This community is structured around a central account connected to multiple shell entities via layered transactions, suggesting a hub-and-spoke fraud pattern.”*

**Usage:** Fraud detection, organisation analysis, explicability, pattern detection.
