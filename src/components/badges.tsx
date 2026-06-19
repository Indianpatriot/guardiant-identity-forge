import { cn } from "@/lib/utils";
import type { PlatformStatus, RiskCategory } from "@/lib/mock-data";

export function RiskBadge({ category, score }: { category: RiskCategory; score?: number }) {
  const map: Record<RiskCategory, string> = {
    Critical: "bg-critical/15 text-critical border-critical/40",
    High: "bg-warning/15 text-warning border-warning/40",
    Medium: "bg-info/15 text-info border-info/30",
    Low: "bg-success/15 text-success border-success/30",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold", map[category])}>
      {category === "Critical" && <span className="h-1.5 w-1.5 rounded-full bg-critical animate-pulse-glow" />}
      {category}
      {score !== undefined && <span className="font-mono opacity-70">· {score}</span>}
    </span>
  );
}

export function StatusBadge({ status }: { status: PlatformStatus }) {
  const map: Record<PlatformStatus, string> = {
    Active: "bg-success/12 text-success border-success/30",
    Disabled: "bg-muted text-muted-foreground border-border",
    Suspended: "bg-warning/15 text-warning border-warning/30",
    "Not Provisioned": "bg-muted/40 text-muted-foreground border-border/60",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", map[status])}>
      <span className={cn("h-1 w-1 rounded-full",
        status === "Active" && "bg-success",
        status === "Disabled" && "bg-muted-foreground",
        status === "Suspended" && "bg-warning",
        status === "Not Provisioned" && "bg-muted-foreground/60",
      )} />
      {status}
    </span>
  );
}

export function RiskScoreBar({ score }: { score: number }) {
  const tone = score >= 80 ? "bg-critical" : score >= 60 ? "bg-warning" : score >= 35 ? "bg-info" : "bg-success";
  return (
    <div className="flex items-center gap-2 w-28">
      <span className="font-mono text-xs font-bold tabular-nums text-foreground w-6">{score}</span>
      <div className="relative h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div className={cn("absolute inset-y-0 left-0 rounded-full transition-all", tone)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
