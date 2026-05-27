import { getAddressTransactions } from "./kitescan-api";

export interface GraphNode {
  address: string;
  is_self: boolean;
  /** Number of txs this counterparty has with the focal address. */
  tx_count: number;
  /** Sum of native value (wei) in txs to/from focal address. */
  value_wei: bigint;
  /** Direction relative to focal: 'in' = focal received, 'out' = focal sent, 'both' = both. */
  direction: "in" | "out" | "both";
}

export interface CounterpartyGraph {
  focal: string;
  nodes: GraphNode[];
  total_txs: number;
  pages_scanned: number;
  is_partial: boolean;
}

interface BuildGraphOptions {
  maxPages?: number;
  targetCounterparties?: number;
  timeBudgetMs?: number;
  onProgress?: (graph: CounterpartyGraph) => void;
}

const DEFAULT_MAX_PAGES = 6;
const DEFAULT_TARGET_COUNTERPARTIES = 24;
const DEFAULT_TIME_BUDGET_MS = 10_000;

export async function buildGraph(
  address: string,
  options: BuildGraphOptions = {}
): Promise<CounterpartyGraph> {
  const focal = address.toLowerCase();
  const counters = new Map<string, GraphNode>();
  let cursor: Record<string, unknown> | null = null;
  let total = 0;
  let pagesScanned = 0;
  const startedAt = performance.now();
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  const targetCounterparties = options.targetCounterparties ?? DEFAULT_TARGET_COUNTERPARTIES;
  const timeBudgetMs = options.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS;

  const toGraph = (isPartial: boolean): CounterpartyGraph => ({
    focal,
    nodes: [
      { address: focal, is_self: true, tx_count: total, value_wei: 0n, direction: "both" },
      ...[...counters.values()].sort((a, b) => b.tx_count - a.tx_count),
    ],
    total_txs: total,
    pages_scanned: pagesScanned,
    is_partial: isPartial,
  });

  for (let page = 0; page < maxPages; page++) {
    const res = await getAddressTransactions(address, cursor);
    pagesScanned = page + 1;

    for (const tx of res.items) {
      if (tx.status === "error") continue;
      total++;
      const from = tx.from?.hash?.toLowerCase();
      const to = tx.to?.hash?.toLowerCase();
      if (!from || !to) continue;
      const other = from === focal ? to : to === focal ? from : null;
      if (!other || other === focal) continue;
      const dir: "in" | "out" = to === focal ? "in" : "out";

      const existing = counters.get(other);
      const value = (() => {
        try {
          return BigInt((tx as { value?: string }).value ?? "0");
        } catch {
          return 0n;
        }
      })();

      if (!existing) {
        counters.set(other, {
          address: other,
          is_self: false,
          tx_count: 1,
          value_wei: value,
          direction: dir,
        });
      } else {
        existing.tx_count++;
        existing.value_wei += value;
        if (existing.direction !== dir) existing.direction = "both";
      }
    }

    const hasMorePages = !!res.next_page_params;
    const shouldKeepScanning =
      hasMorePages &&
      counters.size < targetCounterparties &&
      performance.now() - startedAt < timeBudgetMs &&
      page < maxPages - 1;

    options.onProgress?.(toGraph(shouldKeepScanning));

    if (!shouldKeepScanning) break;
    cursor = res.next_page_params;
  }

  return toGraph(false);
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersect = 0;
  for (const x of a) if (b.has(x)) intersect++;
  return intersect / (a.size + b.size - intersect);
}
