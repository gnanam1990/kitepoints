import { useEffect, useState } from "react";
import { ExternalLink, Info } from "lucide-react";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import { NetworkGraph } from "./components/network-graph";
import { CounterpartyList } from "./components/counterparty-list";
import { PreviewBadge } from "./components/preview-badge";
import { buildGraph, type CounterpartyGraph } from "./lib/graph-build";

const SAMPLE = "0xe1844c5D63a9543023008D332Bd3d2e6f1FE1043";

export default function App() {
  const [address, setAddress] = useState<string>(() => {
    const fromUrl = window.location.pathname.match(/^\/(0x[a-fA-F0-9]{40})/)?.[1];
    return fromUrl ?? SAMPLE;
  });
  const [graph, setGraph] = useState<CounterpartyGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    buildGraph(address)
      .then(setGraph)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    window.history.replaceState(null, "", `/${address}`);
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

        {loading && (
          <div className="rounded-xl border border-kite-border bg-kite-card p-6 text-sm font-mono text-kite-fg/60">
            Aggregating transactions from KiteScan…
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-kite-destructive/40 bg-kite-destructive/5 p-6 text-sm font-mono text-kite-destructive">
            {error}
          </div>
        )}
        {!loading && !error && graph && (
          <div className="grid lg:grid-cols-[1.4fr,1fr] gap-6">
            <div className="space-y-3">
              <NetworkGraph focal={graph.focal} nodes={graph.nodes} onSelect={setAddress} />
              <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-kite-fg/55">
                <Legend color="#485C11" label="Inbound" />
                <Legend color="#9B8564" label="Outbound" />
                <Legend color="#7D6A4F" label="Both" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-kite-fg">Top counterparties</h2>
                <span className="text-xs font-mono text-kite-fg/55">
                  {graph.nodes.length - 1} unique · {graph.total_txs} txs scanned
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
