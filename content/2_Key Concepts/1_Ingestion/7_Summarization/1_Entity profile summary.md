# Entity profile summary

## 1. Definition

An **entity profile summary** is a compact, stable textual description of an entity (Person, Company, Product, Project, etc.) built from:

- **Attributes** (properties stored on the node),
- **Relations** (neighbouring nodes and facts),
- And often **textual mentions** (chunks) that describe the entity.

---

## 2. Why it matters in Graph RAG

A good entity profile supports several downstream steps:

| Use | Role |
|-----|------|
| **Retrieval** | Vector index on `Entity.description` gives a stronger signal than raw triples or scattered chunks. |
| **Grounding** | Provides the LLM with one canonical summary instead of dozens of inconsistent chunks. |
| **Community summarization** | Community summaries often rely on “central” entities and their descriptions. |
| **Entity resolution / linking** | The profile acts as a semantic representation to compare or choose among candidates (often combined with other signals). |

Without entity profiles, retrieval and reasoning tend to rely on raw triples or many small text snippets, which are noisier and harder to rank.

---

## 3. Typical inputs

You can build an entity profile from three families of signals:

### A) Structured facts (graph)

- **Attributes**: `name`, `country`, `industry`, IDs, etc.
- **Relations**: e.g. `(Customer)-[:PURCHASED]->(Product)` and other relation types.
- **Metrics / features**: centrality, mention frequency, dates, etc.

### B) Accumulated descriptions

Many pipelines (including GraphRAG) collect **multiple descriptions** produced during extraction (e.g. one sentence per occurrence), then **summarize** that list into a single description per entity or relation.

### C) Linked text units (chunks)

- Chunks that **mention** the entity (e.g. via a `MENTIONS` link).
- **Definitional** passages (e.g. first mention in a doc, “About” section).

Combining A, B, and C gives the model both structured context and natural language evidence.

---

## 4. Recommended output format

These fields are stored as **properties on the entity node** in the graph. 
You may also use the following pattern (:Entity)-[:HAS_PROFILE]->(:EntityProfile {...}) if you want to manage versionning.
A good entity profile summary usually includes:

| Field | Purpose | Typical use |
|-------|---------|-------------|
| **Aliases** | Alternative names (spellings, abbreviations). | **Entity linking**: match mentions to canonical entities. |
| **Type** | Company, Person, Product, etc. | Typing and filtering. |
| **Description** | 1–3 sentences, stable and indexable. | **Vector search**: embed and index for similarity retrieval. |
| **Key facts** | 3–10 bullet points maximum. | **Grounding**: provide the LLM with concrete facts when generating answers. |
| **Temporal scope** | When relevant (e.g. “2020–2023”). | Filtering and context. |
| **Provenance** | Main sources (e.g. document or chunk IDs). | Traceability and citations. |

**Important:** Keep the output **stable and reusable** (not query-dependent) if you intend to index it for retrieval. Query-specific refinements can be done later (e.g. at retrieval time) on top of this canonical profile.

---

## 5. Main families of techniques

| Workflow | Description |
|----------|-------------|
| **LLM only** | Send the entity’s raw signals (list of descriptions, triples, chunks) to an LLM and ask for a single summary. Simple; works when volume per entity is small. Example: **Microsoft GraphRAG** (Entity & Relationship Summarization). |
| **Signal filtering + LLM** | First perform a structured **signal collection and selection** step, then pass only the most salient signals to the LLM for verbalization. The reduced fact pack is turned into a stable profile. Better control over token budget, salience, and noise in large or heterogeneous graphs. Research examples: **NEST**, **ENT-DESC**.<br><br>Three signals and typical graph/ranking methods:<br>• **Strong attributes** — canonical name, type, IDs, sector, country, role; node properties only.<br>• **Top relations** — select by frequency, type, direction, recency, or structural importance: **degree**, **local centrality**, or **PageRank** in the entity’s neighbourhood.<br>• **Top-K definitional chunks** — traverse **entity–chunk edges** (e.g. MENTIONS / HAS_ENTITY) for candidates, then rank by **embedding similarity** to the entity name, information density, or TF-IDF. |

---

## 6. Common pitfalls

| Pitfall | Consequence | Mitigation |
|---------|-------------|------------|
| **Profiles too long** | Weaker vector index, wasted context window. | Enforce a token or fact budget; summarize again if needed. |
| **Generic profiles** (e.g. Wikipedia-style) | Loss of specificity; internal facts disappear. | Prefer facts and relations from your graph and chunks over generic phrasing. |
| **Mixing record-level and canonical entity** | Confusion for entity resolution and community detection. | One profile per **canonical** entity; resolve duplicates before or during summarization. |
| **Hallucinations** | False facts in the profile. | Use “facts-only + citations”; validate that every claim can be traced to a source. |

---

## 7. Evaluating quality

You can evaluate entity profiles **indirectly** via:

- **Retrieval quality**: precision/recall of retrieved contexts when using the profile in retrieval.
- **Faithfulness**: whether downstream answers are supported by the profile and source context.

**RAGAS-style metrics** (faithfulness, context precision/recall, answer relevance) are a practical baseline for the overall RAG pipeline.

For the **entity profile itself**:

- **Coverage** of key attributes (recall over a reference set of facts).
- **Factual error rate** (manual or LLM-as-judge over a sample).
- **Ablation**: retrieval quality with vs without entity profile embeddings.

---

## 8. References and further reading

| Link / reference | Topic |
|------------------|--------|
| [Microsoft GraphRAG — Dataflow](https://microsoft.github.io/graphrag/index/default_dataflow) | Entity & Relationship Summarization (pipeline), phases 1–6, Text Embedding. |
| [From Local to Global: A Graph RAG Approach (arXiv)](https://arxiv.org/pdf/2404.16130) | GraphRAG paper: local → global retrieval, role of summaries. |
| [NEST — Neural Entity Summarization (IJCAI 2020)](https://www.ijcai.org/proceedings/2020/0228.pdf) | Entity summarization at scale: joint encoding, weak supervision, selection and diversification. |
| [ENT-DESC — Entity Description Generation (arXiv 2020)](https://arxiv.org/pdf/2004.14813) | Entity description generation from a rich knowledge graph; multi-graph encoding and aggregation. |
