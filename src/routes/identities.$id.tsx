import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Mail, Building, User, Shield, Activity, AlertTriangle, CheckCircle2, KeyRound, Network as NetworkIcon, Fingerprint } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { RiskBadge, StatusBadge } from "@/components/badges";
import { getIdentity } from "@/lib/mock-data";

export const Route = createFileRoute("/identities/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Investigate ${params.id} · IdentityGuard AI` },
      { name: "description", content: "Cross-platform identity investigation, privilege analysis, and AI risk narrative." },
    ],
  }),
  loader: ({ params }) => {
    const identity = getIdentity(params.id);
    if (!identity) throw notFound();
    return { identity };
  },
  notFoundComponent: () => (
    <main className="flex-1 grid place-items-center p-8">
      <div className="text-center"><h2 className="text-xl font-bold">Identity not found</h2><Link to="/identities" className="text-primary text-sm">Back to registry</Link></div>
    </main>
  ),
  component: Investigate,
});

function Investigate() {
  const { identity: i } = Route.useLoaderData() as { identity: NonNullable<ReturnType<typeof getIdentity>> };
  const initials = i.name.split(" ").map((n) => n[0]).slice(0, 2).join("");

  return (
    <>
      <TopBar title="Identity Investigation" subtitle={`${i.name} · ${i.employeeId} · Cross-platform risk analysis`} />
      <main className="flex-1 px-4 md:px-8 py-6 space-y-6 scrollbar-thin overflow-y-auto">
        <Link to="/identities" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to registry
        </Link>

        {/* SUMMARY */}
        <section className="glass rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-6 items-start">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-[var(--gradient-primary)] font-display text-2xl font-bold text-primary-foreground glow-primary">
                {initials}
              </div>
              {i.employmentStatus === "Terminated" && (
                <span className="absolute -bottom-1 -right-1 rounded-full bg-critical px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-critical-foreground animate-pulse-glow">Terminated</span>
              )}
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">{i.name}</h2>
              <p className="text-sm text-muted-foreground">{i.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <RiskBadge category={i.riskCategory} score={i.riskScore} />
                <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">{i.employeeId}</span>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              { l: "Department", v: i.department, icon: Building },
              { l: "Manager", v: i.manager, icon: User },
              { l: "Employment", v: i.employmentStatus, icon: Fingerprint },
              { l: "Email", v: i.email, icon: Mail },
            ].map(({ l, v, icon: Ic }) => (
              <div key={l} className="min-w-0">
                <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"><Ic className="h-3 w-3" />{l}</dt>
                <dd className="mt-1 truncate font-semibold text-foreground">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="relative grid place-items-center rounded-2xl glass-strong w-32 h-32">
            <svg viewBox="0 0 100 100" className="absolute inset-0">
              <circle cx="50" cy="50" r="42" stroke="oklch(0.3 0.03 260)" strokeWidth="8" fill="none" />
              <circle
                cx="50" cy="50" r="42"
                stroke={i.riskScore >= 80 ? "oklch(0.64 0.25 22)" : i.riskScore >= 60 ? "oklch(0.78 0.16 75)" : "oklch(0.72 0.18 158)"}
                strokeWidth="8" fill="none" strokeLinecap="round"
                strokeDasharray={`${(i.riskScore / 100) * 264} 264`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="relative text-center">
              <div className="font-display text-3xl font-bold text-foreground tabular-nums">{i.riskScore}</div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Risk Score</div>
            </div>
          </div>
        </section>

        {/* PLATFORMS */}
        <section>
          <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Cross-Platform Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {i.platforms.map((p) => (
              <div key={p.platform} className="glass rounded-xl p-5 hover:border-primary/40 hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{p.platform}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">Last activity {p.lastActivity}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-4 space-y-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Assigned Roles</div>
                    <div className="flex flex-wrap gap-1">
                      {p.roles.map((r) => (
                        <span key={r} className="rounded-md bg-muted/60 border border-border/60 px-1.5 py-0.5 text-[11px] font-mono text-foreground">{r}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                    <span className="text-muted-foreground">MFA</span>
                    <span className={p.mfa ? "inline-flex items-center gap-1 text-success font-semibold" : "inline-flex items-center gap-1 text-critical font-semibold"}>
                      {p.mfa ? <><CheckCircle2 className="h-3 w-3" /> Enforced</> : <><AlertTriangle className="h-3 w-3" /> Missing</>}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PRIVILEGE INHERITANCE */}
        <section className="glass rounded-2xl p-6">
          <h3 className="font-display text-lg font-bold mb-1 flex items-center gap-2"><NetworkIcon className="h-4 w-4 text-secondary" /> Effective Privilege Analysis</h3>
          <p className="text-xs text-muted-foreground mb-5">Inheritance path showing how this identity accumulated effective privileges</p>
          <div className="flex flex-wrap items-center gap-2">
            {[i.name, "Dev Team (AD Group)", "Cloud Deployers (Azure)", "AWS AdministratorAccess", "Production S3 Bucket"].map((step, idx, arr) => (
              <div key={step} className="flex items-center gap-2 animate-fade-up" style={{ animationDelay: `${idx * 80}ms` }}>
                <div className={`rounded-xl px-4 py-2.5 border ${
                  idx === 0 ? "bg-[var(--gradient-primary)] border-primary text-primary-foreground font-semibold glow-primary" :
                  idx === arr.length - 1 ? "bg-critical/15 border-critical/40 text-critical font-semibold" :
                  "glass text-foreground"
                }`}>
                  <div className="text-[10px] uppercase tracking-wider opacity-70">
                    {idx === 0 ? "Identity" : idx === arr.length - 1 ? "Resource" : idx === 1 ? "Group" : idx === 2 ? "Group" : "Role"}
                  </div>
                  <div className="text-sm font-mono">{step}</div>
                </div>
                {idx < arr.length - 1 && (
                  <svg className="h-6 w-8 text-primary" viewBox="0 0 32 24" fill="none">
                    <path d="M0 12 H 28 M 22 6 L 28 12 L 22 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" className="animate-dash" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* AI NARRATIVE */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="glass-strong rounded-2xl p-6 xl:col-span-2 neon-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--gradient-primary)] glow-primary">
                  <Shield className="h-3.5 w-3.5 text-primary-foreground" />
                </span>
                AI Risk Narrative
              </h3>
              <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Generated · GPT-Sec v4</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{i.narrative}</p>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><Activity className="h-3 w-3" /> Evidence</div>
                <ul className="space-y-1.5 text-xs text-foreground/80">
                  {i.evidence.map((e) => <li key={e} className="flex gap-2"><span className="text-primary">•</span>{e}</li>)}
                </ul>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><KeyRound className="h-3 w-3" /> Remediation Steps</div>
                <ol className="space-y-1.5 text-xs text-foreground/80">
                  {i.remediation.map((r, idx) => (
                    <li key={r} className="flex gap-2">
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">{idx + 1}</span>
                      {r}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold mb-3">Executive Summary</h3>
            <p className="text-sm text-foreground/80 leading-relaxed">
              This identity's risk profile warrants <span className="font-semibold text-foreground">{i.riskCategory.toLowerCase()}</span> attention.
              Business impact spans {i.platforms.filter((p) => p.status === "Active").length} active platforms with
              {" "}<span className="font-semibold text-foreground">{i.privilege}</span> scope.
            </p>
            <div className="mt-4 space-y-2">
              {[
                { l: "Business Impact", v: i.riskScore >= 80 ? "Tier-0 production data exposure" : "Departmental access overreach" },
                { l: "Blast Radius", v: `${i.platforms.filter((p) => p.status === "Active").length} platforms · ~${i.platforms.filter((p) => p.status === "Active").length * 14} apps` },
                { l: "Time to Contain", v: "≤ 6 minutes (automated)" },
              ].map(({ l, v }) => (
                <div key={l} className="flex justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="font-semibold text-foreground text-right">{v}</span>
                </div>
              ))}
            </div>
            <button className="mt-5 w-full rounded-lg bg-[var(--gradient-primary)] py-2.5 text-sm font-semibold text-primary-foreground glow-primary hover:opacity-95">
              Execute Remediation Playbook
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
