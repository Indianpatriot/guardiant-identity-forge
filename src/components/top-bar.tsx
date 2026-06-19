import { Bell, Search, Command } from "lucide-react";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border/60 bg-background/60 px-4 md:px-8 py-4 backdrop-blur-xl">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
          Live Telemetry · Streaming
        </div>
        <h1 className="mt-1 truncate font-display text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="hidden lg:flex items-center gap-2 rounded-lg glass px-3 py-2 w-80 text-sm text-muted-foreground">
        <Search className="h-4 w-4" />
        <span className="flex-1">Search identities, incidents, controls…</span>
        <kbd className="inline-flex items-center gap-0.5 rounded border border-border/70 bg-background/50 px-1.5 py-0.5 text-[10px] font-mono"><Command className="h-3 w-3" />K</kbd>
      </div>

      <button className="relative grid h-9 w-9 place-items-center rounded-lg glass hover:bg-accent transition-colors">
        <Bell className="h-4 w-4 text-foreground" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-critical glow-critical" />
      </button>

      <div className="flex items-center gap-3 rounded-lg glass px-3 py-1.5">
        <div className="h-8 w-8 rounded-full bg-[var(--gradient-primary)] grid place-items-center text-xs font-bold text-primary-foreground">SA</div>
        <div className="hidden sm:block">
          <div className="text-xs font-semibold text-foreground">SecOps Admin</div>
          <div className="text-[10px] text-muted-foreground">acme-corp.com</div>
        </div>
      </div>
    </header>
  );
}
