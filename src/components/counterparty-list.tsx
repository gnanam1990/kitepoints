import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, ExternalLink } from "lucide-react";
import type { GraphNode } from "../lib/graph-build";

export function CounterpartyList({
  nodes,
  onSelect,
}: {
  nodes: GraphNode[];
  onSelect: (address: string) => void;
}) {
  const items = nodes.filter((n) => !n.is_self);
  if (!items.length) {
    return <p className="text-sm font-mono text-kite-fg/55">No counterparties found.</p>;
  }
  return (
    <ul className="divide-y divide-kite-border rounded-xl border border-kite-border bg-kite-card overflow-hidden">
      {items.slice(0, 30).map((n) => (
        <li key={n.address} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <button
            onClick={() => onSelect(n.address)}
            className="font-mono text-xs text-kite-fg/80 hover:text-kite-fg truncate min-w-0"
          >
            {n.address.slice(0, 10)}…{n.address.slice(-6)}
          </button>
          <div className="flex items-center gap-3 shrink-0">
            <Direction direction={n.direction} />
            <span className="text-sm font-mono font-bold text-kite-fg w-12 text-right">
              {n.tx_count}
            </span>
            <a
              href={`https://kitescan.ai/address/${n.address}`}
              target="_blank"
              rel="noreferrer"
              className="text-kite-fg/45 hover:text-kite-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Direction({ direction }: { direction: GraphNode["direction"] }) {
  if (direction === "in") return <ArrowDownLeft className="w-3.5 h-3.5 text-kite-accent" title="received from" />;
  if (direction === "out") return <ArrowUpRight className="w-3.5 h-3.5 text-kite-primary" title="sent to" />;
  return <ArrowLeftRight className="w-3.5 h-3.5 text-kite-fg/55" title="bidirectional" />;
}
