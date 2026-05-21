import { useMemo } from "react";
import type { GraphNode } from "../lib/graph-build";

interface Props {
  focal: string;
  nodes: GraphNode[];
  onSelect?: (address: string) => void;
}

export function NetworkGraph({ focal, nodes, onSelect }: Props) {
  const top = nodes.filter((n) => !n.is_self).slice(0, 24);
  const maxTx = Math.max(1, ...top.map((n) => n.tx_count));

  const positioned = useMemo(() => {
    return top.map((n, i) => {
      const ring = i < 8 ? 0 : i < 18 ? 1 : 2;
      const ringRadius = [150, 230, 300][ring];
      const ringCount = [8, 10, 8][ring];
      const indexInRing = ring === 0 ? i : ring === 1 ? i - 8 : i - 18;
      const angle = (indexInRing / ringCount) * Math.PI * 2 - Math.PI / 2;
      return {
        node: n,
        x: 320 + Math.cos(angle) * ringRadius,
        y: 320 + Math.sin(angle) * ringRadius,
        r: 4 + (n.tx_count / maxTx) * 14,
      };
    });
  }, [top, maxTx]);

  const colorFor = (dir: GraphNode["direction"]) => {
    if (dir === "in") return "#485C11";
    if (dir === "out") return "#9B8564";
    return "#7D6A4F";
  };

  return (
    <svg viewBox="0 0 640 640" className="w-full h-auto block bg-kite-card rounded-2xl border border-kite-border">
      {positioned.map((p, i) => (
        <line
          key={`e${i}`}
          x1={320}
          y1={320}
          x2={p.x}
          y2={p.y}
          stroke="#E3D7C2"
          strokeOpacity={0.5}
          strokeWidth={Math.max(0.5, p.r / 8)}
        />
      ))}
      {positioned.map((p, i) => (
        <g
          key={`n${i}`}
          onClick={() => onSelect?.(p.node.address)}
          style={{ cursor: onSelect ? "pointer" : "default" }}
        >
          <circle
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={colorFor(p.node.direction)}
            opacity={0.85}
          >
            <title>
              {p.node.address}{"\n"}
              {p.node.tx_count} tx · {p.node.direction}
            </title>
          </circle>
        </g>
      ))}
      <circle cx={320} cy={320} r={22} fill="#1F1A14" />
      <text x={320} y={325} textAnchor="middle" fontSize={11} fill="#FEF8F0" fontFamily="ui-monospace,monospace">
        {focal.slice(2, 6)}…{focal.slice(-4)}
      </text>
    </svg>
  );
}
