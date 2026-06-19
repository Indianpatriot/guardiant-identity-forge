import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/top-bar";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
      { title: "Identity Graph · IdentityGuard AI" },
      { name: "description", content: "Network visualization of users, groups, roles, permissions and resources." },
    ],
  }),
  component: Graph,
});

interface Node { id: string; label: string; type: "user" | "group" | "role" | "permission" | "resource"; x: number; y: number; meta: string; }
interface Edge { from: string; to: string; }

const nodes: Node[] = [
  { id: "u1", label: "John Smith", type: "user", x: 100, y: 280, meta: "EMP-10240 · Critical risk" },
  { id: "u2", label: "Sarah Patel", type: "user", x: 100, y: 380, meta: "EMP-10245 · High risk" },
  { id: "u3", label: "Priya Chen", type: "user", x: 100, y: 180, meta: "EMP-10251 · Critical risk" },
  { id: "g1", label: "Dev Team", type: "group", x: 320, y: 250, meta: "AD Group · 24 members" },
  { id: "g2", label: "Cloud Deployers", type: "group", x: 320, y: 350, meta: "Azure AD · 8 members" },
  { id: "g3", label: "Domain Admins", type: "group", x: 320, y: 150, meta: "AD Group · 6 members" },
  { id: "r1", label: "AWS:AdminAccess", type: "role", x: 560, y: 200, meta: "AWS IAM · Tier 0" },
  { id: "r2", label: "Okta:AppAdmin", type: "role", x: 560, y: 320, meta: "Okta · 47 apps" },
  { id: "r3", label: "Azure:Contributor", type: "role", x: 560, y: 420, meta: "Azure · 12 subs" },
  { id: "p1", label: "s3:*", type: "permission", x: 780, y: 180, meta: "Wildcard S3" },
  { id: "p2", label: "iam:CreateAccessKey", type: "permission", x: 780, y: 280, meta: "Key creation" },
  { id: "p3", label: "okta:Manage", type: "permission", x: 780, y: 380, meta: "Org-wide" },
  { id: "res1", label: "Prod S3 Bucket", type: "resource", x: 980, y: 220, meta: "acme-prod-data · 42TB" },
  { id: "res2", label: "Customer DB", type: "resource", x: 980, y: 360, meta: "PII · GDPR scope" },
];

const edges: Edge[] = [
  { from: "u1", to: "g1" }, { from: "u1", to: "g2" }, { from: "u2", to: "g2" }, { from: "u3", to: "g3" },
  { from: "g1", to: "r2" }, { from: "g2", to: "r1" }, { from: "g2", to: "r3" }, { from: "g3", to: "r1" },
  { from: "r1", to: "p1" }, { from: "r1", to: "p2" }, { from: "r2", to: "p3" }, { from: "r3", to: "p2" },
  { from: "p1", to: "res1" }, { from: "p2", to: "res2" }, { from: "p3", to: "res2" },
];

const typeColor = {
  user: "oklch(0.72 0.18 245)",
  group: "oklch(0.62 0.22 295)",
  role: "oklch(0.78 0.16 75)",
  permission: "oklch(0.85 0.22 195)",
  resource: "oklch(0.64 0.25 22)",
};

function Graph() {
  const [hover, setHover] = useState<Node | null>(null);
  const [zoom, setZoom] = useState(1);

  return (
    <>
      <TopBar title="Identity Graph Intelligence" subtitle="Interactive network of users, groups, roles, permissions and resources" />
      <main className="flex-1 px-4 md:px-8 py-6 space-y-4 scrollbar-thin overflow-y-auto">
        <div className="flex flex-wrap items-center gap-3">
          {(["user","group","role","permission","resource"] as const).map((t) => (
            <span key={t} className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: typeColor[t], boxShadow: `0 0 8px ${typeColor[t]}` }} />
              <span className="capitalize text-muted-foreground">{t}</span>
            </span>
          ))}
          <div className="ml-auto flex items-center gap-1 rounded-lg glass p-1">
            <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-accent"><ZoomOut className="h-3.5 w-3.5" /></button>
            <span className="px-2 text-xs font-mono">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-accent"><ZoomIn className="h-3.5 w-3.5" /></button>
            <button onClick={() => setZoom(1)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-accent"><Maximize2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        <div className="relative glass-strong rounded-2xl overflow-hidden" style={{ height: 600 }}>
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: "linear-gradient(oklch(0.4 0.04 260 / 0.2) 1px, transparent 1px), linear-gradient(90deg, oklch(0.4 0.04 260 / 0.2) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
          <svg viewBox="0 0 1100 600" className="absolute inset-0 w-full h-full" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
            <defs>
              <filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="oklch(0.55 0.06 260)" /></marker>
            </defs>
            {edges.map((e, i) => {
              const a = nodes.find((n) => n.id === e.from)!;
              const b = nodes.find((n) => n.id === e.to)!;
              const active = hover && (hover.id === a.id || hover.id === b.id);
              return (
                <line
                  key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={active ? "oklch(0.72 0.18 245)" : "oklch(0.45 0.05 260 / 0.5)"}
                  strokeWidth={active ? 2 : 1}
                  strokeDasharray="4 4"
                  className={active ? "animate-dash" : ""}
                  markerEnd="url(#arrow)"
                />
              );
            })}
            {nodes.map((n) => {
              const isHover = hover?.id === n.id;
              return (
                <g key={n.id} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
                  <circle cx={n.x} cy={n.y} r={isHover ? 18 : 14} fill={typeColor[n.type]} opacity={0.25} filter="url(#glow)" />
                  <circle cx={n.x} cy={n.y} r={isHover ? 10 : 8} fill={typeColor[n.type]} stroke="oklch(0.16 0.025 264)" strokeWidth={2} />
                  <text x={n.x} y={n.y + 26} textAnchor="middle" fill="oklch(0.92 0.01 256)" fontSize={11} fontWeight={600} fontFamily="Inter">{n.label}</text>
                </g>
              );
            })}
          </svg>

          {hover && (
            <div className="absolute top-4 right-4 glass-strong rounded-xl p-4 max-w-xs animate-fade-up">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{hover.type}</div>
              <div className="font-display text-base font-bold text-foreground">{hover.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{hover.meta}</div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
