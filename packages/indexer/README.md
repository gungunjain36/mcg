## Envio Greeter Template

*Please refer to the [documentation website](https://docs.envio.dev) for a thorough guide on all [Envio](https://envio.dev) indexer features*

### Run

```bash
pnpm dev
```

Visit http://localhost:8080 to see the GraphQL Playground, local password is `testing`.

### Generate files from `config.yaml` or `schema.graphql`

```bash
pnpm codegen
```

### Pre-requisites

- [Node.js (use v18 or newer)](https://nodejs.org/en/download/current)
- [pnpm (use v8 or newer)](https://pnpm.io/installation)
- [Docker desktop](https://www.docker.com/products/docker-desktop/)



    cd /mnt/d/mcg-fun/packages/indexer
    TUI_OFF=true pnpm dev
    ```
  - If you change `schema.graphql` or `config.yaml`: run `pnpm codegen`.
  - If you change TypeScript: run `pnpm tsc --noEmit`.

- If you want persistent aliasing, add this to `packages/indexer/tsconfig.json` later:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "generated": ["./generated"],
      "generated/*": ["./generated/*"]
    }
  },
  "include": ["src", "test", "generated"]
}
```

- Docs: `https://docs.envio.dev/docs/HyperIndex-LLM/hyperindex-complete`