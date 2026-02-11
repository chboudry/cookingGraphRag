# Entity recognition

*Also called **NER** (Named Entity Recognition) or **Entity Extraction**.*

A central choice is **how** you extract entities and relations (LLM, classic NER, rules, hybrid) and **what schema** the graph follows (free, strict, or hybrid). **LLM-based extraction is the most widely used approach on the market**, so we explain it first—including schema options—then present other methods and when they are a better fit.

---

## LLM-based extraction (most common)

LLM-based entity extraction (e.g. “extract entities and relations from this text”) is the dominant approach in many RAG and Graph RAG setups. You typically combine it with a **schema** (free, strict, or hybrid) that defines or constrains entity types and relation types.

### When LLM + schema works well

LLM + schema is a strong fit for:

- **Complex domains** where rule-based or fixed-taxonomy NER is hard to maintain.
- **Broad taxonomies** with many entity and relation types.
- **Fine-grained semantic extraction** (implicit relations, nuanced types).
- **Multi-domain data** where a single, flexible extractor is preferable to many domain-specific models.
- **Zero training**: no labeled data or model training required.

**Example use cases:** complex business entities, implicit relations, contextual normalization.

- **Advantage:** flexibility; one prompt can adapt to many document types.
- **Drawbacks:** cost (tokens), variability across runs, and possible **hallucinations** (invented entities or relations).

### Schema options (with LLM extraction)

The graph can follow a **free**, **strict**, or **hybrid** schema. These options apply when you use an LLM (or any extractor) to populate the graph.

#### Free schema

- **No fixed taxonomy**: entity “type” is a string from the extractor (or a generic “Entity”); relation types are open or inferred.
- Attributes are often key-value or free-form (e.g. a `properties` map).
- **Pros:** quick to add new sources, adapts to heterogeneous data, no schema migration.
- **Cons:** queries are less predictable; you may need more post-processing or heuristics at retrieval time.

Use when exploring, prototyping, or when sources and domain evolve often.

#### Strict schema

- **Fixed entity types** (e.g. `Person`, `Organization`, `Concept`, `Document`) and **fixed relation types** (e.g. `WORKS_AT`, `MENTIONS`, `RELATES_TO`).
- Attributes per type are defined (e.g. `Person` has `name`, `role`); ingestion validates and normalizes against this schema.
- **Pros:** consistent queries, reliable multi-hop reasoning, easier analytics and tooling.
- **Cons:** less flexible; new document kinds or domains may require schema changes.

Use when the domain is well understood and you want stable, typed graph queries and reasoning.

#### Hybrid schema

- **Core types and relations are fixed** (e.g. a small set of entity and relation types), but **extra attributes or new types** can be allowed under rules (e.g. optional `properties` map, or new types registered and validated at ingest).
- **Pros:** stable queries on the core graph, with room to extend for new sources or attributes without full schema migration.
- **Cons:** you need clear rules for what is strict vs. extensible, and possibly validation for extensions.

Use when you want a stable core for reasoning and tooling while still accommodating evolving or heterogeneous sources.

### Best practice: structured extraction (JSON schema + validation)

When you do use an LLM for extraction, **constrain the output** instead of relying on a free-form “extract entities from this text” prompt:

- **Constrain** output with a **JSON schema** (entity/relation types, required fields, cardinality).
- Apply **strict validation** and **post-processing** (normalization, deduplication).

This reduces hallucinations and type errors compared to unconstrained LLM extraction and makes the graph easier to consume downstream.

### Pro tips (LLM extraction)

- An LLM does **not** extract all available information in a single pass; multiple passes (e.g. gleanings) improve coverage but are token-intensive.
- Using a cheaper model for extraction helps keep cost low while often retaining good accuracy.

---

## The downside of “LLM + schema” alone

Relying only on an LLM for extraction has well-known risks:

- It can **hallucinate** entities or relations that are not in the text.
- It can **force** an entity into a type that does not fit.
- It can **miss** simple, frequent occurrences (e.g. dates, IDs) that rule-based or classic NER would catch.
- It can **ignore** cardinality or schema constraints (e.g. one value expected, multiple produced).

For **production Graph RAG**, the LLM should **not** be the only extraction mechanism. Combining it with NER, rules, or entity linking (see below) yields more robust pipelines.

---

## Other methods

Depending on your domain, data, and constraints, other techniques can be **better** than LLM-only extraction.

### A) Classic supervised NER (spaCy, Flair, fine-tuned Transformers)

**Best when:**

- Entity types are **stable** and well defined.
- The **domain is well defined** (e.g. biomedical, legal, product names).
- You need **throughput and low latency** (no LLM call per chunk).

**Advantages:** faster, more deterministic, cheaper, no hallucination.

**Limitation:** less flexible; may require **training** (or a pre-trained model) for a specific domain.

### B) NER + rules (hybrid)

Combining NER with rules is very effective in practice:

- **Regex** for emails, IDs, product codes.
- **Business dictionaries** and **gazetteers**.
- **Syntactic patterns** (e.g. “X works at Y”).

Often **rules + NER > LLM alone** for well-scoped, repetitive patterns.

**Particularly useful for:** ERP/CRM, finance, supply chain, fraud detection.

### C) Entity linking + vectorized dictionary

Instead of asking an LLM to identify types from scratch:

1. Extract **candidate spans** with a lightweight model (or rules).
2. **Match** them by **embedding similarity** to a known catalog.
3. **Map** spans to canonical entities (e.g. product IDs, customer IDs).

**Very robust for:** product catalogs, known customers, fixed sets of entities.

---


## Reference

- [Language Models as Knowledge Bases? (arXiv)](https://arxiv.org/pdf/1812.09449)
