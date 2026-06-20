import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/top-bar";
import { Target, Skull, Database, Cloud, ShieldAlert, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/attack-path")({
  head: () => ({
    meta: [
      { title: "Attack Path · IdentityGuard AI" },
      { name: "description", content: "Lateral movement, blast radius, and reachable resources across the identity graph." },
    ],
  }),
  component: AttackPath,
});

type Hop = { id: string; label: string; kind: "Identity" | "Group" | "Role" | "Cloud" | "Resource"; detail: string };

const paths: { id: string; name: string; severity: "Critical" | "High"; likelihood: number; impact: string; hops: Hop[] }[] = [
  {
    id: "AP-001",
    name: "Orphaned AD → AWS Prod S3",
    severity: "Critical",
    likelihood: 92,
    impact: "Tier-0 customer data exfiltration",
    hops: [
      { id: "h1", label: "John Smith", kind: "Identity", detail: "Terminated · AWS keys active" },
      { id: "h2", label: "Cloud-Deployers", kind: "Group", detail: "Azure AD · 8 members" },
      { id: "h3", label: "AWS:AdministratorAccess", kind: "Role", detail: "Tier-0 federated" },
      { id: "h4", label: "us-east-1 prod", kind: "Cloud", detail: "Account 4719-XXXX" },
      { id: "h5", label: "acme-prod-data", kind: "Resource", detail: "S3 · 42 TB PII" },
    ],
  },
  {
    id: "AP-002",
    name: "Dormant Admin → Customer DB",
    severity: "Critical",
    likelihood: 81,
    impact: "GDPR-scoped customer DB read/write",
    hops: [
      { id: "h1", label: "Priya Chen", kind: "Identity", detail: "Dormant 142d · re-activated" },
      { id: "h2", label: "Domain Admins", kind: "Group", detail: "AD · 6 members" },
      { id: "h3", label: "Azure:Contributor", kind: "Role", detail: "12 subscriptions" },
      { id: "h4", label: "prod-eu-vnet", kind: "Cloud", detail: "Azure SQL peering" },
      { id: "h5", label: "Customer DB", kind: "Resource", detail: "PII · 8.2 M rows" },
    ],
  },
  {
    id: "AP-003",
    name: "OAuth App → Okta Org",
    severity: "High",
    likelihood: 64,
    impact: "47 SaaS apps via SSO takeover",
    hops: [
      { id: "h1", label: "ETL-Pipeline (SA)", kind: "Identity", detail: "Service account · no MFA" },
      { id: "h2", label: "Integrations", kind: "Group", detail: "Okta · 14 members" },
      { id: "h3", label: "Okta:AppAdmin", kind: "Role", detail: "Org-wide manage" },
      { id: "h4", label: "Okta tenant", kind: "Cloud", detail: "acme.okta.com" },
      { id: "h5", label: "47 SaaS apps", kind: "Resource", detail: "SSO blast radius" },
    ],
  },
];

const kindColor: Record<Hop["kind"], string> = {
  Identity: "oklch(0.72 0.18 245)",
  Group: "oklch(0.62 0.22 295)",
  Role: "oklch(0.78 0.16 75)",
  Cloud: "oklch(0.85 0.22 195)",
  Resource: "oklch(0.64 0.25 22)",
};

const kindIcon: Record<Hop["kind"], typeof Target> = {
  Identity: Target, Group: ShieldAlert, Role: ShieldAlert, Cloud: Cloud, Resource: Database,
};

function AttackPath() {
  const [active, setActive] = useState(paths[0]);

  const blastResources = [
    { name: "acme-prod-data (S3)", type: "Storage", criticality: "Tier-0", records: "42 TB" },
    { name: "Customer DB", type: "Database", criticality: "Tier-0", records: "8.2 M rows" },
    { name: "Stripe production keys", type: "Secret", criticality: "Tier-0", records: "live" },
    { name: "GitHub acme-corp org", type: "SCM", criticality: "Tier-1", records: "1,204 repos" },
    { name: "Okta tenant", type: "IdP", criticality: "Tier-0", records: "47 apps" },
    { name: "Datadog production", type: "Telemetry", criticality: "Tier-1", records: "—" },
  ];

  return (
    <>
      <TopBar title="Attack Path Visualization" subtitle="Lateral movement, blast radius and reachable Tier-0 resources" />
      <main className="flex-1 px-4 md:px-8 py-6 space-y-6 scrollbar-thin overflow-y-auto">
        {/* Path picker */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {paths.map((p) => {
            const isActive = active.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActive(p)}
                className={`text-left glass rounded-2xl p-5 transition-all hover:-translate-y-0.5 ${isActive ? "neon-border" : "hover:border-primary/40"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{p.id}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    p.severity === "Critical" ? "border-critical/50 bg-critical/10 text-critical" : "border-warning/50 bg-warning/10 text-warning"
                  }`}>{p.severity}</span>
                </div>
                <h3 className="mt-2 font-display text-base font-bold text-foreground">{p.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{p.impact}</p>
                <div className="mt-3 flex items-center gap-3 text-[11px]">
                  <span className="text-muted-foreground">Likelihood</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                    <div className="h-full bg-[var(--gradient-primary)]" style={{ width: `${p.likelihood}%` }} />
                  </div>
                  <span className="font-mono font-semibold tabular-nums">{p.likelihood}%</span>
                </div>
              </button>
            );
          })}
        </section>

        {/* Active path canvas */}
        <section className="glass-strong rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <Skull className="h-4 w-4 text-critical" /> {active.name}
              </h3>
              <p className="text-xs text-muted-foreground">{active.hops.length}-hop kill chain · impact: {active.impact}</p>
            </div>
            <button className="rounded-lg bg-[var(--gradient-primary)] px-3 py-1.5 text-xs font-semibold text-primary-foreground glow-primary">
              Generate containment playbook
            </button>
          </div>

          <div className="relative overflow-x-auto scrollbar-thin">
            <div className="flex items-stretch gap-3 min-w-max pb-2">
              {active.hops.map((hop, idx) => {
                const Icon = kindIcon[hop.kind];
                const isLast = idx === active.hops.length - 1;
                return (
                  <div key={hop.id} className="flex items-center gap-3 animate-fade-up" style={{ animationDelay: `${idx * 80}ms` }}>
                    <div className="relative w-52 rounded-xl border border-border/60 bg-card/60 p-4 hover:border-primary/40 transition-all">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `${kindColor[hop.kind]}25`, color: kindColor[hop.kind] }}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{hop.kind}</span>
                        <span className="ml-auto rounded bg-muted/60 px-1.5 text-[10px] font-mono text-muted-foreground">{idx + 1}</span>
                      </div>
                      <div className="mt-2 font-semibold text-foreground text-sm font-mono">{hop.label}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{hop.detail}</div>
                      {isLast && (
                        <span className="absolute -top-2 -right-2 rounded-full bg-critical px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-critical-foreground animate-pulse-glow">Crown jewel</span>
                      )}
                    </div>
                    {!isLast && (
                      <svg className="h-6 w-10 text-critical shrink-0" viewBox="0 0 40 24" fill="none">
                        <path d="M0 12 H 34 M 28 6 L 34 12 L 28 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" className="animate-dash" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Blast radius */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="glass rounded-2xl p-6 xl:col-span-2">
            <h3 className="font-display text-lg font-bold mb-1 flex items-center gap-2">
              <Target className="h-4 w-4 text-critical" /> Blast Radius
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Reachable resources if this path is exploited end-to-end</p>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2 px-3">Resource</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-left py-2 px-3">Criticality</th>
                    <th className="text-left py-2 px-3">Scope</th>
                  </tr>
                </thead>
                <tbody>
                  {blastResources.map((r) => (
                    <tr key={r.name} className="border-b border-border/30 hover:bg-accent/40">
                      <td className="py-3 px-3 font-semibold text-foreground">{r.name}</td>
                      <td className="py-3 px-3 text-muted-foreground">{r.type}</td>
                      <td className="py-3 px-3">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          r.criticality === "Tier-0" ? "border-critical/50 bg-critical/10 text-critical" : "border-warning/50 bg-warning/10 text-warning"
                        }`}>{r.criticality}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-foreground">{r.records}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-6 neon-border">
            <h3 className="font-display text-lg font-bold mb-4">Containment Metrics</h3>
            <div className="space-y-3">
              {[
                { l: "Identities in path", v: "1" },
                { l: "Group hops", v: "1" },
                { l: "Cloud accounts touched", v: "3" },
                { l: "Tier-0 resources reachable", v: "4" },
                { l: "Estimated dwell time", v: "≤ 9 min" },
                { l: "Automated containment", v: "≤ 6 min" },
              ].map(({ l, v }) => (
                <div key={l} className="flex justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="font-semibold text-foreground font-mono tabular-nums">{v}</span>
                </div>
              ))}
            </div>
            <button className="mt-5 w-full rounded-lg bg-critical/15 border border-critical/40 py-2.5 text-sm font-semibold text-critical hover:bg-critical/25 transition-colors inline-flex items-center justify-center gap-2">
              Quarantine identity now <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
