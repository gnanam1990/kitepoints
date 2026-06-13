# KitePoints

> A read-only counterparty graph for any address on Kite — see which wallets and contracts an address transacts with, in which direction, and how often.

> **KitePoints is not a token.** No rewards, no airdrops, no points to claim. It is a visualization of on-chain activity, derived entirely from public chain data.

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6.svg?logo=typescript&logoColor=white)

## Overview

KitePoints is a single-page web app that renders a counterparty graph for any Kite address. Given a `0x…` address, it fetches that address's transactions from the public KiteScan explorer API (a Blockscout v2 endpoint), aggregates the other parties involved, and draws them as a network graph around the focal address. It is purely a read-only visualization tool — there is no ledger, no scoring you can earn, and no points to claim.

## Features

- **Counterparty graph** — an SVG network graph with the focal address at the center and its top counterparties around it; node radius scales with transaction count.
- **Direction encoding** — counterparties are colored by direction relative to the focal address: inbound (focal received), outbound (focal sent), or both.
- **Top counterparties list** — ranks counterparties by raw transaction count and links each one out to KiteScan.
- **Click-to-pivot** — click any counterparty node or list row to re-center the graph on that address; the URL updates to `/<address>`.
- **Address search** — paste any valid `0x` address into the header to load its graph.
- **Client-side caching** — built graphs are cached in `localStorage` with a 15-minute TTL to avoid refetching.
- **Progressive loading** — the graph paginates the explorer API within a page/time budget and renders partial results as they arrive.

### Preview / not yet implemented

- **Trust score** — a placeholder panel (labelled preview) describing a score based on counterparty overlap and diversity. Not calibrated and not wired to live data.
- **"Agents like this" / similarity** — a `jaccardSimilarity` helper exists in `src/lib/graph-build.ts` but is not surfaced in the UI.
- **Token transfers** — only native transactions are walked. ERC-20 / token-transfer aggregation is not implemented.

## Tech stack

- **Vite 6** — build tool and dev server
- **React 19** + **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **lucide-react** — icons
- Custom SVG network graph (no charting library / no D3 dependency)
- Data fetched client-side from the KiteScan Blockscout v2 API

## Getting started

### Prerequisites

- Node.js 18+ (recommended 20+) and npm

### Installation

```bash
npm install
```

### Configuration

No configuration or environment variables are required. The explorer API base URL (`https://kitescan.ai/api/v2`) is set in `src/lib/kitescan-api.ts`. There is no `.env` file and no API key.

### Running

```bash
npm run dev       # start the dev server on http://localhost:3000
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # type-check with tsc --noEmit
```

## Usage

- Open the app and a sample address loads by default.
- Visit `/<0x…>` directly (e.g. `/0xabc…`) to load the graph for a specific address.
- Use the header search box to look up any valid `0x` address.
- In the graph: the center node is the focal address; surrounding nodes are its top counterparties. Click a node or a list row to pivot the graph to that address.

## Project structure

```
src/
  App.tsx                      # root component: routing-by-URL, graph state, caching
  main.tsx                     # React entry point
  index.css                    # Tailwind + theme
  lib/
    kitescan-api.ts            # KiteScan / Blockscout v2 fetch client (with timeout)
    graph-build.ts             # transaction aggregation -> counterparty graph; jaccard helper
  components/
    site-header.tsx            # logo + address search
    site-footer.tsx
    network-graph.tsx          # SVG counterparty graph
    counterparty-list.tsx      # ranked list with KiteScan links
    address-display.tsx
    kite-logo.tsx
    preview-badge.tsx
public/brand/                  # brand assets / favicon
index.html                     # SPA entry; vercel.json rewrites all routes here
```

## Status

Working SPA, suitable for deployment as a static site (configured for Vercel via `vercel.json` SPA rewrites). The core counterparty graph, search, pivoting, and caching are implemented and functional. The trust score is a non-functional preview placeholder, the similarity helper is not surfaced in the UI, and only native transactions are aggregated (no token transfers). All data is read live from the public KiteScan API; there is no backend in this repo.

## License

MIT. See [LICENSE](LICENSE).
