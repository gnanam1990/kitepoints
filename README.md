# KitePoints

> **KitePoints is not a token.** No rewards, no airdrops, no points to claim. It's a visualization of who an address transacts with on Kite Mainnet, derived from public chain data.

A counterparty graph for any Kite address — see the top wallets/contracts an agent has interacted with, in which direction, how often.

## Stack

- Vite 6 + React 19 + TypeScript
- Tailwind v4 (warm Kite palette)
- Custom SVG network graph (no D3 dep)
- Client-side data fetched from `kitescan.ai/api/v2`

## Usage

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

Visit `/<0x…>` to see the graph for a given address. Click any counterparty node or list row to pivot to that address.

## What you see

- **Center node** — the focal address
- **Surrounding nodes** — top 24 counterparties, radius scales with transaction count
- **Color** — direction relative to focal: olive (inbound), sand (outbound), brown (both)
- **Counterparty list** ranks by raw tx count and links out to KiteScan

## What's PREVIEW

- **Trust score** — calibrated metric using counterparty overlap with established agents
- **"Agents like this"** — Jaccard-similarity counterparty discovery (helper wired up in `lib/graph-build.ts`)
- ERC-20 / token-transfer aggregation — v0.1 walks native txs only

## License

MIT
