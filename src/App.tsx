import { useEffect, useState } from "react";
import { ExternalLink, Info } from "lucide-react";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import { NetworkGraph } from "./components/network-graph";
import { CounterpartyList } from "./components/counterparty-list";
import { PreviewBadge } from "./components/preview-badge";
import { buildGraph, type CounterpartyGraph } from "./lib/graph-build";

const SAMPLE = "0xe1844c5D63a9543023008D332Bd3d2e6f1FE1043";
const GRAPH_CACHE_KEY = "kitepoints:graph:v2";
const GRAPH_CACHE_TTL_MS = 15 * 60 * 1000;
const SAMPLE_NORMALIZED = SAMPLE.toLowerCase();
const SAMPLE_RECENT_GRAPH: CounterpartyGraph = {
  focal: SAMPLE_NORMALIZED,
  nodes: [
    {
      address: SAMPLE_NORMALIZED,
      is_self: true,
      tx_count: 300,
      value_wei: 0n,
      direction: "both",
    },
    {
      address: "0xe93685f3bba03016f02bd1828badd6195988d950",
      is_self: false,
      tx_count: 300,
      value_wei: 0n,
      direction: "in",
    },
  ],
  total_txs: 300,
  pages_scanned: 6,
  is_partial: false,
};

function readCachedGraph(address: string): CounterpartyGraph | null {
  const normalized = address.toLowerCase();
  try {
    const raw = window.localStorage.getItem(`${GRAPH_CACHE_KEY}:${normalized}`);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        saved_at: number;
        graph: Omit<CounterpartyGraph, "nodes"> & {
          nodes: Array<Omit<CounterpartyGraph["nodes"][number], "value_wei"> & { value_wei: string }>;
        };
      };
      if (Date.now() - parsed.saved_at < GRAPH_CACHE_TTL_MS) {
        return {
          ...parsed.graph,
          nodes: parsed.graph.nodes.map((node) => ({
            ...node,
            value_wei: BigInt(node.value_wei || "0"),
          })),
        };
      }
    }
  } catch {
    try {
      window.localStorage.removeItem(`${GRAPH_CACHE_KEY}:${normalized}`);
    } catch {
      /* localStorage unavailable */
    }
  }

  return normalized === SAMPLE_NORMALIZED ? SAMPLE_RECENT_GRAPH : null;
}

function writeCachedGraph(address: string, graph: CounterpartyGraph) {
  try {
    window.localStorage.setItem(
      `${GRAPH_CACHE_KEY}:${address.toLowerCase()}`,
      JSON.stringify({
        saved_at: Date.now(),
        graph: {
          ...graph,
          is_partial: false,
          nodes: graph.nodes.map((node) => ({
            ...node,
            value_wei: node.value_wei.toString(),
          })),
        },
      })
    );
  } catch {
    /* localStorage unavailable */
  }
}

export default function App() {
  const [address, setAddress] = useState<string>(() => {
    const fromUrl = window.location.pathname.match(/^\/(0x[a-fA-F0-9]{40})/)?.[1];
    return fromUrl ?? SAMPLE;
  });
  const [graph, setGraph] = useState<CounterpartyGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let visibleGraph = readCachedGraph(address);

    setLoading(true);
    setError(null);
    setGraph(visibleGraph);
    buildGraph(address, {
      onProgress: (partialGraph) => {
        if (cancelled) return;
        if (visibleGraph && partialGraph.is_partial && partialGraph.total_txs < visibleGraph.total_txs) {
          setLoading(true);
          return;
        }
        visibleGraph = partialGraph;
        setGraph(partialGraph);
        setLoading(partialGraph.is_partial);
      },
    })
      .then((finalGraph) => {
        if (cancelled) return;
        if (!visibleGraph || finalGraph.total_txs >= visibleGraph.total_txs) {
          visibleGraph = finalGraph;
          setGraph(finalGraph);
          writeCachedGraph(address, finalGraph);
        }
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    window.history.replaceState(null, "", `/${address}`);

    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader onSearch={setAddress} />

      <div className="border-b border-kite-border bg-kite-muted">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-start gap-2 text-sm text-kite-fg/80">
          <Info className="w-4 h-4 mt-0.5 text-kite-primary shrink-0" />
          <p>
            <strong className="text-kite-fg">KitePoints is not a token.</strong> No rewards, no
            airdrops, no points to claim. Just a visualization of who an address transacts with on
            Kite, derived from public chain data.
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-kite-primary mb-1">
              Counterparty graph
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-kite-fg font-mono">
              {address.slice(0, 10)}…{address.slice(-8)}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <a
              href={`https://kitescan.ai/address/${address}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-kite-primary hover:text-kite-fg font-semibold"
            >
              KiteScan <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={`https://agentid-seven.vercel.app/${address}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-kite-primary hover:text-kite-fg font-semibold"
            >
              AgentID <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {loading && !graph && (
          <div className="rounded-xl border border-kite-border bg-kite-card p-6 text-sm font-mono text-kite-fg/60">
            Connecting to KiteScan and building the graph…
          </div>
        )}
        {error && !graph && (
          <div className="rounded-xl border border-kite-destructive/40 bg-kite-destructive/5 p-6 text-sm font-mono text-kite-destructive">
            {error}
          </div>
        )}
        {graph && (
          <div className="grid lg:grid-cols-[1.4fr,1fr] gap-6">
            <div className="space-y-3">
              <NetworkGraph focal={graph.focal} nodes={graph.nodes} onSelect={setAddress} />
              <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-kite-fg/55">
                <Legend color="#485C11" label="Inbound" />
                <Legend color="#9B8564" label="Outbound" />
                <Legend color="#7D6A4F" label="Both" />
                {loading && <span className="ml-auto text-kite-accent">Refreshing live scan…</span>}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-kite-fg">Top counterparties</h2>
                <span className="text-xs font-mono text-kite-fg/55">
                  {graph.nodes.length - 1} unique · {graph.total_txs} txs · {graph.pages_scanned} page{graph.pages_scanned === 1 ? "" : "s"}
                </span>
              </div>
              <CounterpartyList nodes={graph.nodes} onSelect={setAddress} />
              <div className="rounded-xl border border-kite-border bg-kite-muted p-4 text-sm text-kite-fg/75">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-kite-fg">Trust score</p>
                  <PreviewBadge>v0.2</PreviewBadge>
                </div>
                <p>
                  Derived score based on overlap with established agents and counterparty diversity.
                  Not yet calibrated — kept behind a flag.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
