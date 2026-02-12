# Entity linking

Aliases : Entity matching, 

## 1. Definition

**Entity linking** is the task of linking an extracted entity to a **canonical entity** in a knowledge base.
This is especially used within unified graph rag where you mix rdbms data and unstructured ones.

### Entity linking vs entity resolution

| | Entity linking | Entity resolution |
|---|-------------------|----------------|
| **Goal** | Map mentions or graph nodes to **canonical IDs** in an **external** (or internal) KB. | Merge duplicate nodes so each real-world entity is represented **once** in **your** graph. |
| **Output** | Each node (or mention) gets a link to a canonical entity ID (e.g. `wikidata_id`, `product_id`). | Fewer, merged nodes in the graph. |
| **Typical use** | Aligning your graph with a reference taxonomy, catalog, or master data. | De-duplication when the same entity appears under different names in your corpus. |

The two can be **combined**: first link extracted entities to a KB where possible (entity linking); then run resolution on the rest to merge duplicates that have no canonical ID (entity resolution).

## 2. When entity linking helps

- **Product or asset catalogs**: map text mentions to product IDs, SKUs, or asset IDs.
- **Customers or parties**: link to a master customer or organization registry.
- **Reference knowledge**: link persons, places, or concepts to Wikidata, DBpedia, or a domain ontology for consistent typing and enrichment.
- **Compliance and reporting**: use canonical IDs (e.g. legal entity identifiers) so queries and analytics are stable across sources.

## 3. How it is done

1. **Candidate generation**: for each mention or extracted entity, get a shortlist of possible KB entities (e.g. by string match, alias tables, or vector similarity over KB labels/descriptions).
2. **Disambiguation**: choose the best candidate (scoring, rules, or an LLM when context is needed).
3. **NIL handling**: decide when the mention refers to no KB entity (new or unknown entity) and optionally create a local node without a link.

Techniques include **embedding similarity** (mention + context vs KB entity descriptions), **rules and dictionaries** (aliases, codes), and **LLM-based disambiguation** for ambiguous cases. When you have a **known catalog** (products, customers), entity linking is often more robust than pure resolution because the target set is fixed and you can validate links against the KB.

In a Graph RAG pipeline, entity linking can run **before** or **after** entity resolution: before, if you want to normalize to a KB first and then resolve remaining duplicates; after, if you first merge duplicates and then attach canonical IDs to the merged nodes.


## 4. References and further reading

https://arxiv.org/pdf/2010.11075