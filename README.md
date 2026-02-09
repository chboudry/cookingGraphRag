# Documentation site

A documentation site hosted on GitHub Pages: Markdown pages, Mermaid diagrams (scalable), and a left sidebar menu. Black theme.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

1. Push the repo to GitHub.
2. **Settings → Pages → Build and deployment**: set **Source** to **GitHub Actions**.
3. The site will be at `https://<username>.github.io/cookingGraphRag/`.

To use another repo name, change `base` in `vite.config.ts` (e.g. `base: '/your-repo-name/'`).

## Adding pages

Add `.md` files in `src/content/`. They appear automatically in the sidebar. Use Mermaid in fenced code blocks:

````md
```mermaid
flowchart LR
    A --> B
```
````
