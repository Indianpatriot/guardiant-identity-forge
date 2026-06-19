import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/top-bar";
import { compliance } from "@/lib/mock-data";
import { CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance · IdentityGuard AI" },
      { name: "description", content: "Compliance posture across NIST, CIS, GDPR, ISO, SOX and HIPAA controls." },
    ],
  }),
  component: Compliance,
});

function Compliance() {
  const overall = Math.round(compliance.reduce((s, c) => s + c.score, 0) / compliance.length);

  return (
    <>
      <TopBar title="Compliance Posture" subtitle="Mapped to NIST, CIS, GDPR, ISO 27001, SOX, HIPAA" />
      <main className="flex-1 px-4 md:px-8 py-6 space-y-6 scrollbar-thin overflow-y-auto">
        <section className="glass-strong rounded-2xl p-8 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-center">
          <div className="relative grid place-items-center w-44 h-44">
            <svg viewBox="0 0 100 100" className="absolute inset-0">
              <circle cx="50" cy="50" r="44" stroke="oklch(0.3 0.03 260)" strokeWidth="6" fill="none" />
              <circle cx="50" cy="50" r="44" stroke="url(#cg)" strokeWidth="6" fill="none" strokeLinecap="round"
                strokeDasharray={`${(overall / 100) * 276} 276`} transform="rotate(-90 50 50)" />
              <defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="oklch(0.72 0.18 245)" /><stop offset="100%" stopColor="oklch(0.62 0.22 295)" /></linearGradient></defs>
            </svg>
            <div className="text-center relative">
              <div className="font-display text-5xl font-bold text-gradient">{overall}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Posture Score</div>
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Strong Compliance Posture</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              IdentityGuard AI continuously evaluates {compliance.length} controls across major frameworks.
              Current posture is <span className="text-foreground font-semibold">{overall}% compliant</span>, with
              {" "}<span className="text-warning font-semibold">{compliance.filter((c) => c.status === "Partial").length} partial</span> findings
              that require remediation.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="rounded-lg glass px-4 py-2"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Compliant</div><div className="text-success font-display text-xl font-bold">{compliance.filter((c) => c.status === "Compliant").length}</div></div>
              <div className="rounded-lg glass px-4 py-2"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Partial</div><div className="text-warning font-display text-xl font-bold">{compliance.filter((c) => c.status === "Partial").length}</div></div>
              <div className="rounded-lg glass px-4 py-2"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Frameworks</div><div className="text-primary font-display text-xl font-bold">6</div></div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {compliance.map((c) => (
            <div key={c.framework} className="glass rounded-xl p-5 hover:-translate-y-0.5 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{c.framework}</div>
                  <h4 className="font-display text-base font-bold text-foreground mt-0.5">{c.control}</h4>
                </div>
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  c.status === "Compliant" ? "bg-success/15 text-success border-success/30" : "bg-warning/15 text-warning border-warning/30",
                )}>
                  {c.status === "Compliant" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {c.status}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="relative flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className={cn("absolute inset-y-0 left-0 rounded-full",
                    c.score >= 85 ? "bg-success" : c.score >= 70 ? "bg-warning" : "bg-critical")}
                    style={{ width: `${c.score}%` }} />
                </div>
                <span className="font-mono font-bold text-foreground tabular-nums w-10 text-right">{c.score}%</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Mapped to {Math.floor(Math.random() * 5) + 3} identity controls
              </div>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
