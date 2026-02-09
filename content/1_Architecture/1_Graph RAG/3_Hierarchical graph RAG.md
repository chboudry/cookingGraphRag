We add a **community** layer: the graph is clustered into communities (e.g. by connectivity), each community gets a **global summary** (LLM or aggregation). At query time, we can retrieve not only chunks and entity neighborhoods but also **community summaries** for high-level context.

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

  subgraph I["Ingestion (offline)"]
    C[Chunking] --> E1[Embedding]
    E1 --> VS[(Vector store)]
    C --> NER[Entity extraction]
    NER --> KG[(Knowledge graph)]
    KG --> CC[Community detection<br/>clustering]
    CC --> CS[Community summaries<br/>global summary per cluster]
    CS --> SS[(Summary store)]
  end

  subgraph Q["Query (online)"]
    U[User question] --> P[Preprocessing]
    P --> E2[Embedding]
    E2 --> VL[Vector retriever]
    P --> GE[Entity mapping]
    GE --> GR[Graph retriever]
    GE --> CR[Community retriever<br/>relevant summaries]
    VS --> VL
    KG --> GR
    SS --> CR
    VL --> M[Merge & rank]
    GR --> M
    CR --> M
    M --> K[Contexts<br/>chunks + graph + summaries]
    K --> B[Prompt builder]
    B --> LLM[LLM]
    LLM --> A[Answer]
  end
```