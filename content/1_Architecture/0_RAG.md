Hello 

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

  %% RAG (Retrieval-Augmented Generation) overview

  subgraph I["Ingestion / Indexing (offline)"]
    S[Data sources<br/>PDF, web pages, notes, DB] --> L[Load & normalize]
    L --> C[Chunking<br/>split into passages]
    C --> E1[Embedding model]
    E1 --> VS[(Vector store<br/>embeddings + metadata)]
  end

  subgraph Q["Query / Answering (online)"]
    U[User question] --> P[Prompt + query preprocessing<br/>rewrite, filters]
    P --> E2[Embedding model]
    E2 --> R[Retriever<br/>similarity search + filters]
    VS --> R
    R --> K[Top-K contexts<br/>passages + citations]
    K --> B[Prompt builder<br/>instructions + context]
    B --> LLM[LLM]
    LLM --> A[Answer<br/>+ citations / sources]
  end

  %% Optional safeguards
  subgraph G["Guardrails (optional)"]
    H[Hallucination checks<br/>answer grounded in context]
    S2[Safety / PII redaction<br/>policy checks]
  end

  K -. optional .-> H
  A -. optional .-> H
  U -. optional .-> S2
  A -. optional .-> S2
  ```