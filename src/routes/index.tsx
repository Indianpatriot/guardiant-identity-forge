import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, ShieldAlert, UserX, UserCog, AlertOctagon, TrendingDown, ArrowRight, Activity, Zap } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, Legend } from "recharts";
import { TopBar } from "@/components/top-bar";
import { KpiCard } from "@/components/kpi-card";
import { RiskBadge, RiskScoreBar } from "@/components/badges";
import { kpis, riskDistribution, platformHeatmap, identities, alerts, privilegeTrend } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · IdentityGuard AI" },
      { name: "description", content: "Real-time identity risk posture across your hybrid enterprise." },
    ],
  }),
  component: Overview,
});

const COLORS = ["oklch(0.64 0.25 22)", "oklch(0.78 0.16 75)", "oklch(0.74 0.16 220)", "oklch(0.72 0.18 158)"];

function Overview() {
  const topRisks = [...identities].sort((a, b) => b.riskScore - a.riskScore).slice(0, 6);

  return (
    <>
      <TopBar title="Enterprise Risk Overview" subtitle="Unified identity intelligence across Active Directory, Azure AD, AWS, Okta, Salesforce, ServiceNow" />
      <main className="flex-1 px-4 md:px-8 py-6 space-y-6 scrollbar-thin overflow-y-auto">
        {/* KPI BAR */}
        <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="Total Identities" value={kpis.total} icon={Users} trend={4} />
          <KpiCard label="High Risk" value={kpis.highRisk} icon={ShieldAlert} tone="critical" badge="Critical" trend={-12} />
          <KpiCard label="Orphaned Accounts" value={kpis.orphaned} icon={UserX} tone="critical" badge="Action Required" />
          <KpiCard label="Dormant Admins" value={kpis.dormantAdmins} icon={UserCog} tone="warning" />
          <KpiCard label="Active Incidents" value={kpis.incidents} icon={AlertOctagon} tone="warning" trend={-8} />
          <KpiCard label="Risk Reduction" value={kpis.riskReduction} suffix="%" icon={TrendingDown} tone="success" trend={43} badge="QoQ" />
        </section>

        {/* CHARTS ROW */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold">Risk Distribution</h3>
                <p className="text-xs text-muted-foreground">5,243 identities classified by composite risk</p>
              </div>
              <span className="rounded-md px-2 py-1 text-[10px] font-semibold bg-primary/15 text-primary border border-primary/30">REAL-TIME</span>
            </div>
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskDistribution} dataKey="value" innerRadius={64} outerRadius={96} paddingAngle={3} stroke="none">
                    {riskDistribution.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "oklch(0.18 0.025 264)", border: "1px solid oklch(0.32 0.03 260 / 0.6)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="text-center">
                  <div className="font-display text-3xl font-bold text-foreground tabular-nums">{kpis.total.toLocaleString()}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Identities</div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {riskDistribution.map((r, i) => (
                <div key={r.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i] }} />
                  <span className="text-muted-foreground">{r.name}</span>
                  <span className="ml-auto font-mono font-semibold text-foreground">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6 xl:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold">Platform Risk Heatmap</h3>
                <p className="text-xs text-muted-foreground">Risk concentration across connected platforms</p>
              </div>
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformHeatmap} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid stroke="oklch(0.3 0.03 260 / 0.3)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="oklch(0.65 0.02 256)" fontSize={11} />
                  <YAxis dataKey="platform" type="category" stroke="oklch(0.65 0.02 256)" fontSize={11} width={120} />
                  <Tooltip cursor={{ fill: "oklch(0.3 0.04 260 / 0.2)" }} contentStyle={{ background: "oklch(0.18 0.025 264)", border: "1px solid oklch(0.32 0.03 260 / 0.6)", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="critical" stackId="a" fill="oklch(0.64 0.25 22)" radius={[0, 0, 0, 4]} />
                  <Bar dataKey="high" stackId="a" fill="oklch(0.78 0.16 75)" />
                  <Bar dataKey="medium" stackId="a" fill="oklch(0.74 0.16 220)" />
                  <Bar dataKey="low" stackId="a" fill="oklch(0.72 0.18 158)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* TREND + ALERTS */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="glass rounded-2xl p-6 xl:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold">Privilege Growth Trend</h3>
                <p className="text-xs text-muted-foreground">12-month telemetry · privileged accounts vs admins vs dormant</p>
              </div>
              <Activity className="h-4 w-4 text-secondary" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={privilegeTrend}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.72 0.18 245)" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="oklch(0.72 0.18 245)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.62 0.22 295)" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="oklch(0.62 0.22 295)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.78 0.16 75)" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="oklch(0.78 0.16 75)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(0.3 0.03 260 / 0.3)" strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="oklch(0.65 0.02 256)" fontSize={11} />
                  <YAxis stroke="oklch(0.65 0.02 256)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "oklch(0.18 0.025 264)", border: "1px solid oklch(0.32 0.03 260 / 0.6)", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="privileged" stroke="oklch(0.72 0.18 245)" strokeWidth={2} fill="url(#g1)" />
                  <Area type="monotone" dataKey="admins" stroke="oklch(0.62 0.22 295)" strokeWidth={2} fill="url(#g2)" />
                  <Area type="monotone" dataKey="dormant" stroke="oklch(0.78 0.16 75)" strokeWidth={2} fill="url(#g3)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold">Alert Timeline</h3>
                <p className="text-xs text-muted-foreground">Last 12 hours · live</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" /> Streaming
              </span>
            </div>
            <ul className="space-y-3 relative">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-border/60" />
              {alerts.map((a, i) => (
                <li key={i} className="relative pl-9 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className={`absolute left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-background ${
                    a.severity === "critical" ? "bg-critical glow-critical" : a.severity === "high" ? "bg-warning" : "bg-info"
                  }`} />
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span className="font-mono">{a.time}</span>
                    <span>·</span>
                    <span className="font-semibold text-foreground">{a.type}</span>
                  </div>
                  <p className="text-xs text-foreground mt-0.5 leading-snug">{a.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* TOP RISKS */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold">Top Identity Risks</h3>
              <p className="text-xs text-muted-foreground">Highest composite risk scores across hybrid identity surface</p>
            </div>
            <Link to="/identities" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:gap-2 transition-all">
              View full registry <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {topRisks.map((i) => (
              <Link
                key={i.id}
                to="/identities/$id"
                params={{ id: i.id }}
                className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3 hover:border-primary/40 hover:bg-card/80 transition-all"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--gradient-primary)] text-xs font-bold text-primary-foreground">
                  {i.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">{i.name}</span>
                    <RiskBadge category={i.riskCategory} />
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground truncate">{i.department} · {i.privilege}</div>
                  <div className="mt-1.5"><RiskScoreBar score={i.riskScore} /></div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
