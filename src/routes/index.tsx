import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, ShieldAlert, UserX, UserCog, AlertOctagon, TrendingDown, ArrowRight, Activity, Zap, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, Legend } from "recharts";
import { TopBar } from "@/components/top-bar";
import { KpiCard } from "@/components/kpi-card";
import { RiskBadge, RiskScoreBar } from "@/components/badges";

// Keep static layout items from your mock library, replacing identity assets with live variables
import { platformHeatmap, alerts, privilegeTrend } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · IdentityGuard AI" },
      { name: "description", content: "Real-time identity risk posture across your hybrid enterprise." },
    ],
  }),
  component: Overview,
});

// TypeScript interfaces matching your backend script architecture
interface IdentityRiskRecord {
  employee_id: string;
  full_name: string;
  department: string;
  employment_status: string;
  risk_score: number;
  risk_tier: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  risk_analysis_narrative: string;
}

const COLORS = ["oklch(0.64 0.25 22)", "oklch(0.78 0.16 75)", "oklch(0.74 0.16 220)", "oklch(0.72 0.18 158)"];

function Overview() {
  const [ledgerData, setLedgerData] = useState<IdentityRiskRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch live analytical data from public/data runtime sandbox
  useEffect(() => {
    async function loadTelemetryData() {
      try {
        const response = await fetch("/data/identity_risk_ledger.json");
        if (response.ok) {
          const data = await response.json();
          setLedgerData(data);
        }
      } catch (error) {
        console.error("Failed to sync identity engine metrics files:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadTelemetryData();
  }, []);

  // Compute Live Metrics dynamically from loaded array objects
  const calculatedMetrics = useMemo(() => {
    let total = 0;
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    let orphaned = 0;
    let dormantAdmins = 0;

    ledgerData.forEach((item) => {
      total++;
      const tier = item.risk_tier.toUpperCase();
      if (tier === "CRITICAL") critical++;
      if (tier === "HIGH") high++;
      if (tier === "MEDIUM") medium++;
      if (tier === "LOW") low++;

      // Detect specific offboarding signatures inside ledger strings
      if (item.employment_status === "Terminated" && item.risk_analysis_narrative.includes("Offboarding Gap")) {
        orphaned++;
      }
      // Count instances containing structural dormancy triggers
      if (item.risk_analysis_narrative.includes("Dormant")) {
        dormantAdmins++;
      }
    });

    return {
      total,
      highRisk: critical + high,
      orphaned,
      dormantAdmins,
      incidents: critical,
      riskReduction: 43, // Core operational baseline
      distribution: [
        { name: "Critical", value: critical },
        { name: "High", value: high },
        { name: "Medium", value: medium },
        { name: "Low", value: low },
      ],
    };
  }, [ledgerData]);

  // Extract top 6 critical risk identities derived dynamically from user array
  const topRisks = useMemo(() => {
    return [...ledgerData]
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 6)
      .map((item) => {
        // Map backend uppercase strings (e.g., "CRITICAL") to Title Case ("Critical") to satisfy RiskCategory type requirements
        const rawTier = item.risk_tier.toUpperCase();
        let formattedCategory: any = "Low";
        
        if (rawTier === "CRITICAL") formattedCategory = "Critical";
        else if (rawTier === "HIGH") formattedCategory = "High";
        else if (rawTier === "MEDIUM") formattedCategory = "Medium";

        return {
          id: item.employee_id,
          name: item.full_name,
          riskCategory: formattedCategory,
          department: item.department,
          privilege: item.risk_analysis_narrative.split("|")[0]?.trim() || "Normal Context",
          riskScore: item.risk_score,
        };
      });
  }, [ledgerData]);

  return (
    <>
      <TopBar title="Enterprise Risk Overview" subtitle="Unified identity intelligence across Active Directory, Azure AD, AWS, Okta, Salesforce, ServiceNow" />
      <main className="flex-1 px-4 md:px-8 py-6 space-y-6 scrollbar-thin overflow-y-auto">
        
        {/* SCALE STRIP */}
        <section className="glass rounded-2xl px-5 py-3 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs">
          {[
            { l: "Identities", v: isLoading ? "..." : calculatedMetrics.total.toLocaleString() },
            { l: "Groups", v: "142" },
            { l: "Service Accounts", v: "4" },
            { l: "Audit Events (24h)", v: "2,000" },
            { l: "Connected Platforms", v: "6" },
          ].map((s) => (
            <div key={s.l} className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</span>
              <span className="font-display font-bold text-foreground tabular-nums">{s.v}</span>
            </div>
          ))}
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-success">
            {isLoading ? (
              <RefreshCw className="w-3 h-3 animate-spin text-success" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
            )}
            {isLoading ? "Syncing Engine..." : "All connectors healthy"}
          </span>
        </section>

        {/* KPI BAR */}
        <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="Total Identities" value={calculatedMetrics.total} icon={Users} trend={4} />
          <KpiCard label="High Risk" value={calculatedMetrics.highRisk} icon={ShieldAlert} tone="critical" badge="Critical" trend={-12} />
          <KpiCard label="Orphaned Accounts" value={calculatedMetrics.orphaned} icon={UserX} tone="critical" badge="Action Required" />
          <KpiCard label="Dormant Admins" value={calculatedMetrics.dormantAdmins} icon={UserCog} tone="warning" />
          <KpiCard label="Active Incidents" value={calculatedMetrics.incidents} icon={AlertOctagon} tone="warning" trend={-8} />
          <KpiCard label="Risk Reduction" value={calculatedMetrics.riskReduction} suffix="%" icon={TrendingDown} tone="success" trend={43} badge="QoQ" />
        </section>

        {/* CHARTS ROW */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* RISK DISTRIBUTION GRAPH WRAPPER */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold">Risk Distribution</h3>
                <p className="text-xs text-muted-foreground">{calculatedMetrics.total} identities classified by composite risk</p>
              </div>
              <span className="rounded-md px-2 py-1 text-[10px] font-semibold bg-primary/15 text-primary border border-primary/30">REAL-TIME</span>
            </div>
            
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={calculatedMetrics.distribution} dataKey="value" innerRadius={64} outerRadius={96} paddingAngle={3} stroke="none">
                    {calculatedMetrics.distribution.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "oklch(0.18 0.025 264)", border: "1px solid oklch(0.32 0.03 260 / 0.6)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="text-center">
                  <div className="font-display text-3xl font-bold text-foreground tabular-nums">
                    {isLoading ? "..." : calculatedMetrics.total.toLocaleString()}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Identities</div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {calculatedMetrics.distribution.map((r, i) => {
                const percentage = calculatedMetrics.total > 0 
                  ? Math.round((r.value / calculatedMetrics.total) * 100) 
                  : 0;

                return (
                  <div key={r.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i] }} />
                    <span className="text-muted-foreground">{r.name}</span>
                    <span className="ml-auto font-mono font-semibold text-foreground">
                      {isLoading ? "..." : `${r.value.toLocaleString()} (${percentage}%)`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PLATFORM HEATMAP */}
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

        {/* TOP RISKS GALLERY */}
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
            {isLoading ? (
              <div className="col-span-3 text-center text-xs font-mono text-muted-foreground py-8">
                COMPILING CRYPTOGRAPHIC DISCREPANCY ARRAYS...
              </div>
            ) : (
              topRisks.map((i) => (
                <Link
                  key={i.id}
                  to="/identities/$id"
                  params={{ id: i.id }}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3 hover:border-primary/40 hover:bg-card/80 transition-all"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-(--gradient-primary) text-xs font-bold text-primary-foreground">
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
              ))
            )}
          </div>
        </section>
      </main>
    </>
  );
}