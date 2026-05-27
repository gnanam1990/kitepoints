import { useEffect, useMemo, useState } from "react";
import type { GraphNode } from "../lib/graph-build";

interface Props {
  focal: string;
  nodes: GraphNode[];
  onSelect?: (address: string) => void;
}

export function NetworkGraph({ focal, nodes, onSelect }: Props) {
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const top = useMemo(() => nodes.filter((n) => !n.is_self).slice(0, 24), [nodes]);
  const maxTx = Math.max(1, ...top.map((n) => n.tx_count));
  const animationKey = `${focal}:${top.map((n) => `${n.address}:${n.tx_count}`).join("|")}`;

  useEffect(() => {
    let raf = 0;
    const startedAt = performance.now();
    const duration = 1_800;

    const tick = (now: number) => {
      const next = Math.min(1, (now - startedAt) / duration);
      setProgress(next);
      if (next < 1) raf = requestAnimationFrame(tick);
    };

    setProgress(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animationKey]);

  const positioned = useMemo(() => {
    return top.map((node, index) => {
      const ring = index < 8 ? 0 : index < 18 ? 1 : 2;
      const ringRadius = [138, 220, 292][ring];
      const ringCount = [8, 10, 8][ring];
      const indexInRing = ring === 0 ? index : ring === 1 ? index - 8 : index - 18;
      const bias = seededUnit(node.address) * 0.42 - 0.21;
      const angle = (indexInRing / ringCount) * Math.PI * 2 - Math.PI / 2 + bias;

      return {
        node,
        angle,
        x: 320 + Math.cos(angle) * ringRadius,
        y: 320 + Math.sin(angle) * ringRadius,
        r: 7 + Math.sqrt(node.tx_count / maxTx) * 20,
      };
    });
  }, [top, maxTx]);

  const eased = easeOutBack(progress);

  const colorFor = (direction: GraphNode["direction"]) => {
    if (direction === "in") return "#485C11";
    if (direction === "out") return "#9B8564";
    return "#7D6A4F";
  };

  return (
    <svg
      viewBox="0 0 640 640"
      className="w-full h-auto block bg-kite-card rounded-2xl border border-kite-border overflow-hidden"
      aria-label="Animated Kite counterparty bubble graph"
    >
      <defs>
        <radialGradient id="kitepoints-bg" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#FEF8F0" />
          <stop offset="58%" stopColor="#FAF2E6" />
          <stop offset="100%" stopColor="#F1EBE0" />
        </radialGradient>
        <filter id="kitepoints-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0.282 0 0 0 0 0.361 0 0 0 0 0.067 0 0 0 0.32 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="640" height="640" fill="url(#kitepoints-bg)" />
      {[118, 206, 294].map((radius) => (
        <circle
          key={radius}
          cx={320}
          cy={320}
          r={radius}
          fill="none"
          stroke="#E3D7C2"
          strokeWidth="1"
          strokeDasharray="3 13"
          opacity="0.55"
        />
      ))}

      {positioned.map((position, index) => {
        const point = interpolateNode(position.x, position.y, position.angle, eased, index);
        const color = colorFor(position.node.direction);
        return (
          <g key={`edge-${position.node.address}`}>
            <GraphEdge
              x={point.x}
              y={point.y}
              width={Math.max(0.8, position.r / 8)}
            />
            <VolumeDots
              x={point.x}
              y={point.y}
              color={color}
              count={Math.max(2, Math.ceil((position.node.tx_count / maxTx) * 8))}
            />
          </g>
        );
      })}

      {positioned.map((position, index) => {
        const point = interpolateNode(position.x, position.y, position.angle, eased, index);
        return (
          <g key={`node-${position.node.address}`}>
            <GraphNodeBubble
              x={point.x}
              y={point.y}
              r={position.r}
              fill={colorFor(position.node.direction)}
              address={position.node.address}
              txCount={position.node.tx_count}
              direction={position.node.direction}
              dimmed={!!hovered && hovered !== position.node.address}
              hovered={hovered === position.node.address}
              onHover={setHovered}
              onSelect={onSelect}
            />
            {index < 6 && (
              <text
                x={point.x}
                y={point.y + position.r + 18}
                textAnchor="middle"
                fontSize={10}
                fill="#1F1A14"
                fillOpacity={0.55 * eased}
                fontFamily="ui-monospace,monospace"
                pointerEvents="none"
              >
                {position.node.address.slice(2, 6)}…{position.node.address.slice(-4)}
              </text>
            )}
          </g>
        );
      })}

      <g filter="url(#kitepoints-glow)">
        <circle className="kitepoints-center-halo" cx={320} cy={320} r={48} fill="#485C11" opacity={0.08} />
        <circle cx={320} cy={320} r={30} fill="#1F1A14" stroke="#9B8564" strokeWidth={3} />
        <circle className="kitepoints-center-dot" cx={320} cy={320} r={23} fill="#485C11" opacity={0.96} />
      </g>
      <text x={320} y={316} textAnchor="middle" fontSize={10} fill="#FEF8F0" fontFamily="ui-monospace,monospace">
        {focal.slice(2, 6)}…{focal.slice(-4)}
      </text>
      <text x={320} y={332} textAnchor="middle" fontSize={8} fill="#FEF8F0" fillOpacity={0.78} fontFamily="ui-monospace,monospace">
        focal
      </text>

      {top.length === 0 && (
        <text x={320} y={385} textAnchor="middle" fontSize={13} fill="#1F1A14" fillOpacity={0.55}>
          No counterparties found in the latest scan
        </text>
      )}
    </svg>
  );
}

function GraphEdge({ x, y, width }: { x: number; y: number; width: number }) {
  return (
    <line
      className="kitepoints-edge"
      x1={320}
      y1={320}
      x2={x}
      y2={y}
      stroke="#CDBB9C"
      strokeOpacity={0.68}
      strokeWidth={width}
    />
  );
}

function VolumeDots({
  x,
  y,
  color,
  count,
}: {
  x: number;
  y: number;
  color: string;
  count: number;
}) {
  return (
    <g pointerEvents="none">
      {Array.from({ length: Math.min(8, count) }).map((_, index, dots) => {
        const t = (index + 1) / (dots.length + 1);
        return (
          <circle
            key={index}
            className="kitepoints-flow-dot"
            cx={320 + (x - 320) * t}
            cy={320 + (y - 320) * t}
            r={2.5 + index * 0.18}
            fill={color}
            opacity={0.18}
            style={{ animationDelay: `${index * 140}ms` }}
          />
        );
      })}
    </g>
  );
}

function GraphNodeBubble({
  x,
  y,
  r,
  fill,
  address,
  txCount,
  direction,
  dimmed,
  hovered,
  onHover,
  onSelect,
}: {
  x: number;
  y: number;
  r: number;
  fill: string;
  address: string;
  txCount: number;
  direction: GraphNode["direction"];
  dimmed: boolean;
  hovered: boolean;
  onHover: (address: string | null) => void;
  onSelect?: (address: string) => void;
}) {
  return (
    <g
      className="kitepoints-node"
      onMouseEnter={() => onHover(address)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect?.(address)}
      style={{ cursor: onSelect ? "pointer" : "default" }}
      opacity={dimmed ? 0.32 : 1}
    >
      <circle cx={x} cy={y} r={r + 8} fill={fill} opacity={hovered ? 0.18 : 0.08} />
      <circle
        cx={x}
        cy={y}
        r={hovered ? r + 4 : r}
        fill={fill}
        stroke={hovered ? "#1F1A14" : "#FEF8F0"}
        strokeWidth={hovered ? 2.5 : 1.5}
        opacity={0.92}
      >
        <title>
          {address}{"\n"}
          {txCount} tx · {direction}
        </title>
      </circle>
      <circle cx={x - r * 0.28} cy={y - r * 0.28} r={Math.max(2, r * 0.24)} fill="#FEF8F0" opacity={0.32} />
    </g>
  );
}

function interpolateNode(x: number, y: number, angle: number, eased: number, index: number) {
  const wobble = Math.sin(eased * Math.PI) * (index % 2 === 0 ? 18 : -18);
  return {
    x: 320 + (x - 320) * eased + Math.cos(angle + eased * 2.2) * wobble,
    y: 320 + (y - 320) * eased + Math.sin(angle + eased * 2.2) * wobble,
  };
}

function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function seededUnit(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10_000) / 10_000;
}
