# Relation extraction

**Relation extraction** identifies **relationships** between entities in text (e.g. *X works at Y*, *A mentions B*, *document D discusses concept C*). Together with entity recognition, it builds the edges of the knowledge graph. As with entities, **LLM-based extraction with a schema is the most widely used approach on the market**, so we describe it first; other methods (supervised RE, rules, open IE) remain relevant when you need speed, determinism, or a fixed relation taxonomy.

---

## LLM-based relation extraction (most common)

In many RAG and Graph RAG pipelines, **relations are extracted by an LLM** in the same pass as entities or in a dedicated pass. You give the model a **schema** that defines allowed relation types (and optionally entity types) and ask it to output **(subject, relation, object)** triples from the text.

### How it works with a schema

- **Strict schema**: you define a fixed set of relation types (e.g. `WORKS_AT`, `MENTIONS`, `RELATES_TO`, `PART_OF`) and optionally entity types. The prompt (or a structured-call layer) constrains the LLM to choose from these types, so the graph stays consistent and queryable.
- **Free or hybrid schema**: relation types can be open (any string from the LLM) or a mix of core types plus optional extensions. This suits exploration or multi-domain data but may require more normalization and validation.

As with entity recognition, **constraining the output** (e.g. via a JSON schema with required fields and cardinality) reduces hallucinations and malformed triples. You can either (1) extract entities and relations in one LLM call, or (2) run entity recognition first and then a second LLM call that takes entity spans and asks “what relations hold between these entities?”—the latter often improves precision when entities are already anchored.

### When LLM + schema works well

- **Complex or implicit relations** that are hard to capture with pattern-based or supervised RE (e.g. “X is influenced by Y”, “A is a key factor in B”).
- **Broad or evolving relation taxonomies** where you prefer not to train a new model for each type.
- **Zero training**: no relation-annotated data required; the schema is enough to steer the LLM.

**Drawbacks:** cost (tokens), variability across runs, and risk of invented or wrong relations. For production, combining the LLM with entity resolution, validation, and optionally rules or supervised RE for high-value relation types is recommended.

---

## Other approaches

- **Supervised relation extraction**: train a model (e.g. on relation-annotated corpora) to classify relation type between two marked entities. Best when relation types are stable and you have (or can create) labeled data; typically faster and more deterministic than LLM.
- **Rule-based and pattern-based**: regex, dependency patterns, or templates (e.g. “X works at Y” → `WORKS_AT(X,Y)`). Very effective for narrow, well-defined relation types (e.g. in ERP, CRM, or regulatory texts).
- **Open information extraction (Open IE)**: extract triples without a fixed schema; relation labels come from the text. Useful for discovery and prototyping; the graph is noisier and less uniform than with a schema.

Choosing a strategy follows the same logic as for entities: use **LLM + schema** for flexibility and complex semantics; add **rules or supervised RE** where you need reliability and throughput; use **Open IE** only when you explicitly want an open-ended graph.