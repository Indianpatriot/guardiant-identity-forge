import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  trend?: number;
  icon: LucideIcon;
  tone?: "default" | "critical" | "warning" | "success";
  badge?: string;
}

function useCounter(target: number, duration = 1400) {
  const [v, setV] = useState(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    let raf = 0;
    const step = (t: number) => {
      if (start.current === null) start.current = t;
      const p = Math.min(1, (t - start.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

export function KpiCard({ label, value, suffix, trend, icon: Icon, tone = "default", badge }: KpiCardProps) {
  const v = useCounter(value);
  const toneRing = {
    default: "from-primary/30 to-secondary/20",
    critical: "from-critical/40 to-critical/10",
    warning: "from-warning/40 to-warning/10",
    success: "from-success/40 to-success/10",
  }[tone];

  const toneText = {
    default: "text-primary",
    critical: "text-critical",
    warning: "text-warning",
    success: "text-success",
  }[tone];

  return (
    <div className="relative group glass rounded-xl p-5 overflow-hidden transition-all hover:-translate-y-0.5 hover:glow-primary">
      <div className={cn("absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl opacity-50 bg-gradient-to-br", toneRing)} />
      <div className="relative flex items-start justify-between">
        <div className={cn("grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br border border-border/60", toneRing)}>
          <Icon className={cn("h-5 w-5", toneText)} />
        </div>
        {badge && (
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border",
            tone === "critical" && "bg-critical/15 text-critical border-critical/30 animate-pulse-glow",
            tone === "warning" && "bg-warning/15 text-warning border-warning/30",
            tone === "success" && "bg-success/15 text-success border-success/30",
            tone === "default" && "bg-primary/15 text-primary border-primary/30",
          )}>{badge}</span>
        )}
      </div>
      <div className="mt-5">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground tabular-nums">
          {v.toLocaleString()}{suffix}
        </div>
        {typeof trend === "number" && (
          <div className={cn("mt-2 inline-flex items-center gap-1 text-xs font-medium", trend >= 0 ? "text-success" : "text-critical")}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}% vs last 30d
          </div>
        )}
      </div>
    </div>
  );
}
