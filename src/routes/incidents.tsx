import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { 
  AlertOctagon, Clock, ShieldOff, ArrowRight, RefreshCw,
  UserMinus, ArrowUpRight, ShieldAlert, KeyRound, Cpu, Network 
} from "lucide-react";
import { TopBar } from "@/components/top-bar";
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

interface RawIncident {
  incident_id: string;
  employee_id: string;
  severity: string;
  incident_type: string;
  description: string;
}

interface RiskLedgerRecord {
  employee_id: string;
  full_name: string;
  department: string;
  employment_status: string;
  risk_score: number;
  risk_tier: string;
  risk_analysis_narrative: string;
}

interface AccountStatusRecord {
  employee_id: string;
  account_status: string;
}

interface UIIncident {
  id: string;
  time: string;
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  detail: string;
  action: string;
  user: string;
  employeeId: string;
}

interface UIGap {
  id: string;
  name: string;
  employeeId: string;
  lastLogin: string;
  ad: "Active" | "Disabled";
  azure: "Active" | "Disabled";
  aws: "Active" | "Disabled";
  okta: "Active" | "Disabled";
}

function Incidents() {
  const [uiIncidents, setUiIncidents] = useState<UIIncident[]>([]);
  const [uiGaps, setUiGaps] = useState<UIGap[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchAndCorrelateIncidents() {
      try {
        const [incidentsRes, ledgerRes, adRes, awsRes, oktaRes] = await Promise.all([
          fetch("/data/incidents.json"),
          fetch("/data/identity_risk_ledger.json"),
          fetch("/data/active_directory_accounts.json"),
          fetch("/data/aws_iam_accounts.json"),
          fetch("/data/okta_accounts.json"),
        ]);

        if (incidentsRes.ok && ledgerRes.ok && adRes.ok && awsRes.ok && oktaRes.ok) {
          const rawIncidents: RawIncident[] = await incidentsRes.json();
          const ledgerData: RiskLedgerRecord[] = await ledgerRes.json();
          const adData: AccountStatusRecord[] = await adRes.json();
          const awsData: AccountStatusRecord[] = await awsRes.json();
          const oktaData: AccountStatusRecord[] = await oktaRes.json();

          const userMap = new Map<string, RiskLedgerRecord>(ledgerData.map(u => [u.employee_id, u]));
          const adMap = new Map<string, string>(adData.map(a => [a.employee_id, a.account_status]));
          const awsMap = new Map<string, string>(awsData.map(a => [a.employee_id, a.account_status]));
          const oktaMap = new Map<string, string>(oktaData.map(a => [a.employee_id, a.account_status]));

          const processedIncidents: UIIncident[] = rawIncidents.map((inc, index) => {
            const userProfile = userMap.get(inc.employee_id);
            const rawSev = inc.severity.toUpperCase();
            
            let formattedSeverity: "Critical" | "High" | "Medium" | "Low" = "Low";
            if (rawSev === "CRITICAL") formattedSeverity = "Critical";
            else if (rawSev === "HIGH") formattedSeverity = "High";
            else if (rawSev === "MEDIUM") formattedSeverity = "Medium";

            let recommendedAction = "Isolate account context, execute key rotation, and audit active network routes.";
            if (inc.incident_type.includes("Offboarding")) {
              recommendedAction = "Revoke AWS access keys immediately and tear down linked active Okta authentication tokens.";
            } else if (inc.incident_type.includes("Escalation")) {
              recommendedAction = "Isolate the Active Directory account and pull the explicit mapping out of the parent entity.";
            } else if (inc.incident_type.includes("Token") || inc.incident_type.includes("Abuse")) {
              recommendedAction = "Flag token fingerprint as leaked. Invalidate active OIDC sessions and force MFA validation.";
            } else if (inc.incident_type.includes("Dormant") || inc.incident_type.includes("Admin")) {
              recommendedAction = "Deprovision administrative rights and enforce continuous access evaluation policies.";
            }

            return {
              id: inc.incident_id,
              time: `${index * 4 + 3}m ago`,
              title: inc.incident_type || "Unknown Anomaly Signature",
              severity: formattedSeverity,
              detail: inc.description,
              action: recommendedAction,
              user: userProfile ? userProfile.full_name : `User ${inc.employee_id}`,
              employeeId: inc.employee_id,
            };
          });

          const detectedGaps: UIGap[] = ledgerData
            .filter((u) => u.employment_status === "Terminated" && u.risk_analysis_narrative.includes("Offboarding Gap"))
            .map((u) => {
              const adStatus = adMap.get(u.employee_id) || "Disabled";
              const awsStatus = awsMap.get(u.employee_id) || "Disabled";
              const oktaStatus = oktaMap.get(u.employee_id) || "Disabled";

              return {
                id: u.employee_id,
                name: u.full_name,
                employeeId: u.employee_id,
                lastLogin: "45 days ago",
                ad: (adStatus === "Enabled" || adStatus === "Active") ? "Active" : "Disabled",
                azure: "Disabled", 
                aws: (awsStatus === "Enabled" || awsStatus === "Active") ? "Active" : "Disabled",
                okta: (oktaStatus === "Enabled" || oktaStatus === "Active") ? "Active" : "Disabled",
              };
            });

          setUiIncidents(processedIncidents);
          setUiGaps(detectedGaps.slice(0, 6));
        }
      } catch (error) {
        console.error("Incident correlation engine encountered a runtime telemetry fault:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAndCorrelateIncidents();
  }, []);

  // Interleaving/Mixing Presentation Algorithm grouped into strict keyword buckets
  const mixedIncidents = useMemo(() => {
    if (!uiIncidents.length) return [];

    const buckets: { [key: string]: UIIncident[] } = {
      offboarding: [],
      privilege: [],
      token: [],
      dormant: [],
      service: [],
      other: []
    };

    uiIncidents.forEach((inc) => {
      const t = inc.title.toLowerCase();
      if (t.includes("offboarding") || t.includes("gap")) buckets.offboarding.push(inc);
      else if (t.includes("escalation") || t.includes("over-privileged") || t.includes("case")) buckets.privilege.push(inc);
      else if (t.includes("token") || t.includes("abuse") || t.includes("credential")) buckets.token.push(inc);
      else if (t.includes("dormant")) buckets.dormant.push(inc);
      else if (t.includes("service")) buckets.service.push(inc);
      else buckets.other.push(inc);
    });

    const mixedList: UIIncident[] = [];
    const maxLen = Math.max(
      buckets.offboarding.length,
      buckets.privilege.length,
      buckets.token.length,
      buckets.dormant.length,
      buckets.service.length,
      buckets.other.length
    );

    // Round-robin execution to alternate card types on screen
    for (let i = 0; i < maxLen; i++) {
      if (buckets.offboarding[i]) mixedList.push(buckets.offboarding[i]);
      if (buckets.privilege[i]) mixedList.push(buckets.privilege[i]);
      if (buckets.token[i]) mixedList.push(buckets.token[i]);
      if (buckets.dormant[i]) mixedList.push(buckets.dormant[i]);
      if (buckets.service[i]) mixedList.push(buckets.service[i]);
      if (buckets.other[i]) mixedList.push(buckets.other[i]);
    }

    return mixedList.slice(0, 16); 
  }, [uiIncidents]);

  const threatDistribution = useMemo(() => {
    const summary = {
      "Offboarding Gap": 0,
      "Privilege Escalation": 0,
      "Token Abuse": 0,
      "Dormant Admin": 0,
      "Service Account Abuse": 0,
    };

    uiIncidents.forEach((inc) => {
      if (inc.title.includes("Offboarding")) summary["Offboarding Gap"]++;
      else if (inc.title.includes("Escalation") || inc.title.includes("Over-privileged")) summary["Privilege Escalation"]++;
      else if (inc.title.includes("Token") || inc.title.includes("Abuse") || inc.title.includes("Credential")) summary["Token Abuse"]++;
      else if (inc.title.includes("Dormant")) summary["Dormant Admin"]++;
      else if (inc.title.includes("Service")) summary["Service Account Abuse"]++;
    });

    return summary;
  }, [uiIncidents]);

  const getThreatIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("offboarding")) return UserMinus;
    if (t.includes("escalation") || t.includes("over-privileged")) return ArrowUpRight;
    if (t.includes("identity")) return ShieldAlert;
    if (t.includes("token") || t.includes("abuse") || t.includes("credential")) return KeyRound;
    if (t.includes("dormant")) return Clock;
    if (t.includes("service")) return Cpu;
    return AlertOctagon;
  };

  const sevColor = (s: "Critical" | "High" | "Medium" | "Low") => {
    switch (s) {
      case "Critical":
        return "border-red-500/50 bg-red-500/10 text-red-400";
      case "High":
        return "border-orange-500/50 bg-orange-500/10 text-orange-400";
      case "Medium":
        return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
      case "Low":
      default:
        return "border-blue-500/50 bg-blue-500/10 text-blue-400";
    }
  };

  return (
    <>
      <TopBar 
        title="Incident Center" 
        subtitle={isLoading ? "Syncing active compromises..." : `${uiIncidents.length} active threats identified across identity surface`} 
      />
      <main className="flex-1 px-4 md:px-8 py-6 space-y-6 scrollbar-thin overflow-y-auto">
        
        {/* THREAT DISTRIBUTION MATRIX */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(threatDistribution).map(([label, count]) => {
            const IconComponent = getThreatIcon(label);
            return (
              <div key={label} className="glass rounded-xl px-4 py-3 flex items-center justify-between border border-border/40 bg-card/10">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block truncate max-w-[140px]">{label}</span>
                  <span className="font-display font-bold text-lg text-foreground tabular-nums">{isLoading ? "..." : count}</span>
                </div>
                <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                  <IconComponent className="h-4 w-4 text-primary" />
                </div>
              </div>
            );
          })}
        </section>

        {/* INTERLEAVED GRID DISPLAY */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-2 text-center text-xs font-mono py-12 text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              ORCHESTRATING SECURITY CONTEXT MATRIX TELEMETRY...
            </div>
          ) : (
            mixedIncidents.map((inc) => {
              const ThreatIcon = getThreatIcon(inc.title);
              return (
                <article key={inc.id} className={cn("glass rounded-2xl p-5 border-l-4 hover:-translate-y-0.5 transition-all",
                  inc.severity === "Critical" && "border-l-red-500 glow-critical",
                  inc.severity === "High" && "border-l-orange-500",
                  inc.severity === "Medium" && "border-l-yellow-500",
                  inc.severity === "Low" && "border-l-blue-500",
                )}>
                  <header className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <span className="font-mono bg-muted/60 px-1.5 py-0.5 rounded text-foreground">{inc.id}</span>
                        <span>·</span>
                        <Clock className="h-3 w-3" /> {inc.time}
                      </div>
                      <h3 className="mt-2 font-display text-base font-bold text-foreground flex items-center gap-2">
                        <ThreatIcon className="h-4 w-4 text-primary shrink-0" />
                        {inc.title}
                      </h3>
                    </div>
                    <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0", sevColor(inc.severity))}>
                      {inc.severity}
                    </span>
                  </header>
                  <p className="mt-3 text-sm text-foreground/80 leading-relaxed font-sans">{inc.detail}</p>
                  <div className="mt-4 rounded-lg bg-muted/40 border border-border/60 px-3 py-2 text-xs">
                    <span className="font-semibold text-foreground">Recommended playbook action: </span>
                    <span className="text-muted-foreground">{inc.action}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <span className="h-6 w-6 grid place-items-center rounded-full bg-[var(--gradient-primary)] text-[10px] font-bold text-primary-foreground">
                        {inc.user.split(" ").map((s) => s[0]).join("")}
                      </span>
                      {inc.user}
                    </span>
                    <Link to="/identities/$id" params={{ id: inc.employeeId }} className="inline-flex items-center gap-1 font-semibold text-primary hover:gap-2 transition-all">
                      Open playbook <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* OFFBOARDING GAP RUNTIME VIEW */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <ShieldOff className="h-4 w-4 text-critical" /> Offboarding Gap Detection
              </h3>
              <p className="text-xs text-muted-foreground">Identities disabled in one platform but active elsewhere</p>
            </div>
            <span className="rounded-full bg-critical/15 text-critical border border-critical/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider animate-pulse-glow">
              {isLoading ? "..." : `${uiGaps.length} Critical`}
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
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center text-xs font-mono py-6 text-muted-foreground">
                      COMPILING LATEST HYBRID GAP ENTITIES...
                    </td>
                  </tr>
                ) : (
                  uiGaps.map((g) => (
                    <tr key={g.id} className="border-b border-border/30 hover:bg-accent/40">
                      <td className="py-3 px-3">
                        <Link to="/identities/$id" params={{ id: g.id }} className="font-semibold text-foreground hover:text-primary">
                          {g.name}
                        </Link>
                        <div className="text-[11px] font-mono text-muted-foreground">{g.employeeId} · offboarded 45 days ago</div>
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
                        <Link to="/identities/$id" params={{ id: g.id }} className="text-xs font-semibold text-primary hover:underline">
                          Investigate
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}