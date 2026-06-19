import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertOctagon, Clock, ShieldOff, ArrowRight } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { incidents, identities } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/badges";

export const Route = createFileRoute("/incidents")({
  head: () => ({
    meta: [
      { title: "Incident Center · IdentityGuard AI" },
      { name: "description", content: "Active identity security incidents and offboarding gap detection." },
    ],
  }),
  component: Incidents,
});

function Incidents() {
  const sevColor = (s: string) =>
    s === "Critical" ? "border-critical/50 bg-critical/10 text-critical" :
    s === "High" ? "border-warning/50 bg-warning/10 text-warning" :
    "border-info/50 bg-info/10 text-info";

  const gaps = identities.filter((i) => i.employmentStatus === "Terminated").slice(0, 6);

  return (
    <>
      <TopBar title="Incident Center" subtitle={`${incidents.length} active incidents · live triage`} />
      <main className="flex-1 px-4 md:px-8 py-6 space-y-6 scrollbar-thin overflow-y-auto">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {incidents.map((inc) => (
            <article key={inc.id} className={cn("glass rounded-2xl p-5 border-l-4 hover:-translate-y-0.5 transition-all",
              inc.severity === "Critical" && "border-l-critical glow-critical",
              inc.severity === "High" && "border-l-warning",
              inc.severity === "Medium" && "border-l-info",
            )}>
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span className="font-mono">{inc.id}</span>
                    <span>·</span>
                    <Clock className="h-3 w-3" /> {inc.time}
                  </div>
                  <h3 className="mt-1 font-display text-base font-bold text-foreground">{inc.title}</h3>
                </div>
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", sevColor(inc.severity))}>
                  {inc.severity}
                </span>
              </header>
              <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{inc.detail}</p>
              <div className="mt-4 rounded-lg bg-muted/40 border border-border/60 px-3 py-2 text-xs">
                <span className="font-semibold text-foreground">Recommended action: </span>
                <span className="text-muted-foreground">{inc.action}</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <span className="h-6 w-6 grid place-items-center rounded-full bg-[var(--gradient-primary)] text-[10px] font-bold text-primary-foreground">
                    {inc.user.split(" ").map((s) => s[0]).join("")}
                  </span>
                  {inc.user}
                </span>
                <button className="inline-flex items-center gap-1 font-semibold text-primary hover:gap-2 transition-all">
                  Open playbook <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </article>
          ))}
        </section>

        <section className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold flex items-center gap-2"><ShieldOff className="h-4 w-4 text-critical" /> Offboarding Gap Detection</h3>
              <p className="text-xs text-muted-foreground">Identities disabled in one platform but active elsewhere</p>
            </div>
            <span className="rounded-full bg-critical/15 text-critical border border-critical/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider animate-pulse-glow">
              {gaps.length} Critical
            </span>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th className="text-left py-2 px-3">Identity</th>
                  <th className="text-left py-2 px-3">AD</th>
                  <th className="text-left py-2 px-3">Azure</th>
                  <th className="text-left py-2 px-3">AWS</th>
                  <th className="text-left py-2 px-3">Okta</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="px-3" />
                </tr>
              </thead>
              <tbody>
                {gaps.map((g) => (
                  <tr key={g.id} className="border-b border-border/30 hover:bg-accent/40">
                    <td className="py-3 px-3">
                      <Link to="/identities/$id" params={{ id: g.id }} className="font-semibold text-foreground hover:text-primary">{g.name}</Link>
                      <div className="text-[11px] font-mono text-muted-foreground">{g.employeeId} · offboarded {g.lastLogin}</div>
                    </td>
                    <td className="py-3 px-3"><StatusBadge status={g.ad} /></td>
                    <td className="py-3 px-3"><StatusBadge status={g.azure} /></td>
                    <td className="py-3 px-3"><StatusBadge status={g.aws} /></td>
                    <td className="py-3 px-3"><StatusBadge status={g.okta} /></td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-critical/15 text-critical border border-critical/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        <AlertOctagon className="h-3 w-3" /> Critical
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link to="/identities/$id" params={{ id: g.id }} className="text-xs font-semibold text-primary hover:underline">Investigate</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
