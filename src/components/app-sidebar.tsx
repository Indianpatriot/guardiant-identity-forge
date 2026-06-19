import { Link, useRouterState } from "@tanstack/react-router";
import { Shield, LayoutDashboard, Users, AlertTriangle, Activity, FileBarChart, ShieldCheck, Network, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/identities", label: "Identity Registry", icon: Users },
  { to: "/incidents", label: "Incident Center", icon: AlertTriangle },
  { to: "/graph", label: "Identity Graph", icon: Network },
  { to: "/analytics", label: "Privilege Analytics", icon: Activity },
  { to: "/compliance", label: "Compliance", icon: ShieldCheck },
  { to: "/reports", label: "Reports", icon: FileBarChart },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-[var(--gradient-primary)] glow-primary">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <div className="font-display text-sm font-bold tracking-tight text-sidebar-foreground">IdentityGuard <span className="text-gradient">AI</span></div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Identity Intelligence</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 scrollbar-thin overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Operations</div>
        {nav.map((item) => {
          const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-foreground neon-border"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <Icon className={cn("h-4 w-4 transition-colors", active && "text-primary")} />
              <span className="font-medium">{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary glow-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl glass p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          AI Copilot
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
          Ask the AI Security Analyst about any identity, incident, or remediation step.
        </p>
      </div>
    </aside>
  );
}
