 # Entity Extraction

 *Can also be called NER (named entity recognition)
 
 A central choice is whether the graph follows a **free schema**, a **strict schema** or an hybrid one.

### Free schema

- **No fixed taxonomy**: entity "type" can be a string from the extractor (or generic "Entity"); relation types are open or inferred.
- Attributes are often key-value or free-form (e.g. a `properties` map).
- **Pros**: quick to add new sources, adapts to heterogeneous data, no schema migration.
- **Cons**: queries are less predictable; you may need more post-processing or heuristics at retrieval time.

Use when exploring, prototyping, or when sources and domain evolve often.


### Strict schema

- **Fixed entity types** (e.g. `Person`, `Organization`, `Concept`, `Document`) and **fixed relation types** (e.g. `WORKS_AT`, `MENTIONS`, `RELATES_TO`).
- Attributes per type are defined (e.g. `Person` has `name`, `role`); ingestion validates and normalizes against this schema.
- **Pros**: consistent queries, reliable multi-hop reasoning, easier analytics and tooling.
- **Cons**: less flexible; new document kinds or domains may require schema changes.

Use when the domain is well understood and you want stable, typed graph queries and reasoning.

### Hybrid schema

- **Core types and relations are fixed** (e.g. a small set of entity and relation types), but **extra attributes or new types** can be allowed under rules (e.g. optional `properties` map, or new types registered and validated at ingest).
- **Pros**: stable queries on the core graph, with room to extend for new sources or attributes without full schema migration.
- **Cons**: you need clear rules for what is strict vs. extensible, and possibly validation for extensions.

Use when you want a stable core for reasoning and tooling while still accommodating evolving or heterogeneous sources.


## Pro Tips 

 - A LLM doesn’t extract all the available information in a single extraction pass.
 - Multiple passes are token-intensive, so a cheaper model helps to keep the cost low.