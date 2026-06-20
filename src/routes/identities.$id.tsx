import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Mail, Building, User, Shield, Activity, AlertTriangle, CheckCircle2, KeyRound, Network as NetworkIcon, Fingerprint, RefreshCw, Sparkles, ShieldAlert } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { RiskBadge, StatusBadge } from "@/components/badges";
import { type RiskCategory } from "@/lib/mock-data";

export const Route = createFileRoute("/identities/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Investigate ${params.id} · IdentityGuard AI` },
      { name: "description", content: "Cross-platform identity investigation, privilege analysis, and AI risk narrative." },
    ],
  }),
  component: Investigate,
});

// Define core structural TypeScript interfaces for all telemetry streams
interface EmployeeRecord {
  employee_id: string;
  full_name: string;
  department: string;
  designation: string;
  manager_id: string;
  employment_type: string;
  employment_status: string;
  joining_date: string;
  termination_date: string;
}

interface MappingRecord {
  employee_id: string;
  ad_account: string;
  aws_account: string;
  okta_account: string;
}

interface ADRecord {
  employee_id: string;
  ad_username: string;
  account_status: string;
  last_login_days: number;
  mfa_enabled: string | boolean;
  groups: string;
}

interface AWSRecord {
  employee_id: string;
  aws_user: string;
  account_status: string;
  roles: string;
  policies: string;
  last_activity_days: number;
}

interface OktaRecord {
  employee_id: string;
  okta_login: string;
  account_status: string;
  mfa_enabled: string | boolean;
  assigned_apps: string;
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

interface DetailedIdentityProfile {
  id: string;
  employeeId: string;
  name: string;
  title: string;
  department: string;
  manager: string;
  employmentStatus: string;
  employmentContext: string; // Dynamic text tracking lifecycle length
  email: string;
  riskScore: number;
  riskCategory: RiskCategory;
  privilege: string;
  narrative: string;
  evidence: string[];
  remediation: string[];
  platforms: {
    platform: string;
    lastActivity: string;
    status: "Active" | "Disabled";
    roles: string[];
    mfa: boolean;
  }[];
  riskBreakdown: { label: string; score: number }[];
  blastRadius: {
    connectedPlatforms: number;
    adminRoles: number;
    sensitiveResources: string;
    potentialImpact: string;
  };
}

function Investigate() {
  const { id } = Route.useParams(); // Acquire target employee parametric token from router context
  const [profile, setProfile] = useState<DetailedIdentityProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function assembleIdentityIntelligence() {
      try {
        setIsLoading(true);
        const [empRes, mapRes, adRes, awsRes, oktaRes, ledgerRes] = await Promise.all([
          fetch("/data/employees.json"),
          fetch("/data/identity_mapping.json"),
          fetch("/data/active_directory_accounts.json"),
          fetch("/data/aws_iam_accounts.json"),
          fetch("/data/okta_accounts.json"),
          fetch("/data/identity_risk_ledger.json"),
        ]);

        if (empRes.ok && mapRes.ok && adRes.ok && awsRes.ok && oktaRes.ok && ledgerRes.ok) {
          const employees: EmployeeRecord[] = await empRes.json();
          const mappings: MappingRecord[] = await mapRes.json();
          const adAccounts: ADRecord[] = await adRes.json();
          const awsAccounts: AWSRecord[] = await awsRes.json();
          const oktaAccounts: OktaRecord[] = await oktaRes.json();
          const ledgerRecords: RiskLedgerRecord[] = await ledgerRes.json();

          // Locate specific matching records inside matching tables
          const emp = employees.find(e => e.employee_id === id);
          if (!emp) {
            setProfile(null);
            return;
          }

          const mapping = mappings.find(m => m.employee_id === id);
          const ad = adAccounts.find(a => a.employee_id === id);
          const aws = awsAccounts.find(a => a.employee_id === id);
          const okta = oktaAccounts.find(o => o.employee_id === id);
          const ledger = ledgerRecords.find(l => l.employee_id === id);

          // Determine generalized TitleCase Risk Tiers
          const rawTier = (ledger?.risk_tier || "LOW").toUpperCase();
          let formattedCategory: RiskCategory = "Low";
          if (rawTier === "CRITICAL") formattedCategory = "Critical";
          else if (rawTier === "HIGH") formattedCategory = "High";
          else if (rawTier === "MEDIUM") formattedCategory = "Medium";

          // Calculate composite structural privilege levels
          const hasAdminAccess = 
            (ad?.groups && ad.groups.includes("Admin")) || 
            (aws?.policies && aws.policies.includes("Admin")) ||
            (ledger?.risk_analysis_narrative.toLowerCase().includes("administrator"));
          const levelOfPrivilege = hasAdminAccess ? "Super Admin" : "Standard";

          // Assemble modular cross-platform arrays dynamically
          const integratedPlatforms: DetailedIdentityProfile["platforms"] = [];

          if (ad && mapping?.ad_account) {
            integratedPlatforms.push({
              platform: "Active Directory",
              lastActivity: `${ad.last_login_days} days ago`,
              status: ad.account_status === "Enabled" ? "Active" : "Disabled",
              roles: ad.groups ? ad.groups.split(";") : ["Domain Users"],
              mfa: ad.mfa_enabled === "True" || ad.mfa_enabled === true,
            });
          }

          if (aws && mapping?.aws_account) {
            const compositeAWSRoles = [
              ...(aws.roles ? aws.roles.split(";") : []),
              ...(aws.policies ? aws.policies.split(";") : [])
            ];
            integratedPlatforms.push({
              platform: "AWS IAM",
              lastActivity: `${aws.last_activity_days} days ago`,
              status: aws.account_status === "Active" ? "Active" : "Disabled",
              roles: compositeAWSRoles,
              mfa: true,
            });
          }

          if (okta && mapping?.okta_account) {
            integratedPlatforms.push({
              platform: "Okta SaaS Gateway",
              lastActivity: "Active Session",
              status: okta.account_status === "Active" ? "Active" : "Disabled",
              roles: okta.assigned_apps ? okta.assigned_apps.split(";") : [],
              mfa: okta.mfa_enabled === "True" || okta.mfa_enabled === true,
            });
          }

          // Generate dynamic lists derived from pre-compiled risk metrics text
          const rawEvidence = ledger ? ledger.risk_analysis_narrative.split("|") : ["Profile baseline verified normal."];
          
          let dynamicRemediation = [
            "Maintain current standard identity logging reviews.",
            "Verify MFA status profiles periodically."
          ];
          
          if (ledger?.risk_analysis_narrative.includes("Offboarding Gap")) {
            dynamicRemediation = [
              "Revoke target AWS IAM assumed-role federated tokens instantly.",
              "Deactivate primary OIDC web tokens inside the Okta directory.",
              "Purge Active Directory nested parameters and shift target object to Quarantine OU."
            ];
          } else if (ledger?.risk_analysis_narrative.includes("administrator")) {
            dynamicRemediation = [
              "Enforce conditional group membership lease boundaries.",
              "Audit hidden nested inheritance chains across DevOps groups."
            ];
          }

          // Calculate Dynamic Employment Lifecycle context string
          const calculateLifecycleDays = (start: string, end?: string) => {
            const startDate = new Date(start);
            const baselineDate = end ? new Date(end) : new Date("2026-06-20"); // 2026 hackathon simulation core timeline point
            const diffTime = Math.abs(baselineDate.getTime() - startDate.getTime());
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          };

          let employmentContextString = emp.employment_status;
          if (emp.employment_status === "Terminated" && emp.termination_date) {
            const days = calculateLifecycleDays(emp.termination_date);
            employmentContextString = `Terminated ${days} days ago`;
          } else if (emp.joining_date) {
            const days = calculateLifecycleDays(emp.joining_date);
            employmentContextString = `Active for ${days} days`;
          }

          // Evaluate Suggested Risk Matrix weights dynamically from target metrics
          const computedBreakdown: { label: string; score: number }[] = [];
          const isTerminated = emp.employment_status === "Terminated";
          const holdsActiveChannels = integratedPlatforms.some(p => p.status === "Active");

          if (isTerminated && holdsActiveChannels) {
            computedBreakdown.push({ label: "Terminated Employee with Active Access", score: 40 });
          }
          if (hasAdminAccess) {
            computedBreakdown.push({ label: "AWS AdministratorAccess Privilege Policy", score: 30 });
          }
          if (isTerminated && okta && okta.account_status === "Active") {
            computedBreakdown.push({ label: "Active Okta Session Post-Termination", score: 20 });
          }

          let platformCount = 0;
          if (mapping?.ad_account) platformCount++;
          if (mapping?.aws_account) platformCount++;
          if (mapping?.okta_account) platformCount++;

          if (platformCount >= 3) {
            computedBreakdown.push({ label: "Multi-Platform Identity Sprawl (AD + AWS + Okta)", score: 10 });
          }
          if (ledger?.risk_analysis_narrative.toLowerCase().includes("dormant")) {
            computedBreakdown.push({ label: "Dormant Administrator Presence Check", score: 10 });
          }
          if (ledger?.risk_analysis_narrative.toLowerCase().includes("token") || ledger?.risk_analysis_narrative.toLowerCase().includes("abuse")) {
            computedBreakdown.push({ label: "Token/Credential Abuse Signatures", score: 15 });
          }

          // Compute Blast Radius metrics indicators
          const totalAdminRolesCount = hasAdminAccess ? 2 : 0;
          const resourceFocus = hasAdminAccess ? "Production S3 Core & EC2 Fleet" : "Standard Corporate Domain Directory";
          const potentialThreatImpact = ledger && ledger.risk_score >= 80 
            ? "Critical Systemic Multi-Cloud Environment Takeover" 
            : "Internal Lateral Access Movement Expansion";

          setProfile({
            id: emp.employee_id,
            employeeId: emp.employee_id,
            name: emp.full_name,
            title: emp.designation,
            department: emp.department,
            manager: emp.manager_id !== emp.employee_id ? emp.manager_id : "Security Core",
            employmentStatus: emp.employment_status,
            employmentContext: employmentContextString,
            email: `${emp.full_name.toLowerCase().replace(/\s+/g, ".")}@enterprise.com`,
            riskScore: ledger ? ledger.risk_score : 10,
            riskCategory: formattedCategory,
            privilege: levelOfPrivilege,
            narrative: ledger ? ledger.risk_analysis_narrative : "No anomalous multi-platform sprawl footprints found.",
            evidence: rawEvidence.map(e => e.trim()),
            remediation: dynamicRemediation,
            platforms: integratedPlatforms,
            riskBreakdown: computedBreakdown,
            blastRadius: {
              connectedPlatforms: platformCount,
              adminRoles: totalAdminRolesCount,
              sensitiveResources: resourceFocus,
              potentialImpact: potentialThreatImpact
            }
          });
        }
      } catch (err) {
        console.error("Failed to construct cross-platform profile dossier:", err);
      } finally {
        setIsLoading(false);
      }
    }

    assembleIdentityIntelligence();
  }, [id]);

  const initials = useMemo(() => {
    if (!profile?.name) return "ID";
    return profile.name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  }, [profile]);

  if (isLoading) {
    return (
      <main className="flex-1 grid place-items-center bg-slate-950 min-h-screen text-slate-400 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          RESOLVING CROSS-PLATFORM SYSTEM ENTITY SNAPSHOTS...
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex-1 grid place-items-center p-8 bg-slate-950 min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Target Identity Mapping Node Not Found</h2>
          <Link to="/identities" className="text-primary text-sm hover:underline">Return to Registry Hub</Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <TopBar title="Identity Investigation" subtitle={`${profile.name} · ${profile.employeeId} · Cross-platform risk analysis`} />
      <main className="flex-1 px-4 md:px-8 py-6 space-y-6 scrollbar-thin overflow-y-auto">
        <Link to="/identities" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to registry
        </Link>

        {/* SUMMARY SECTION */}
        <section className="glass rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-6 items-start">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-(--gradient-primary) font-display text-2xl font-bold text-primary-foreground glow-primary">
                {initials}
              </div>
              {profile.employmentStatus === "Terminated" && (
                <span className="absolute -bottom-1 -right-1 rounded-full bg-critical px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-critical-foreground animate-pulse-glow">Terminated</span>
              )}
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">{profile.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <RiskBadge category={profile.riskCategory} score={profile.riskScore} />
                <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">{profile.employeeId}</span>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              { l: "Department", v: profile.department, icon: Building },
              { l: "Manager ID", v: profile.manager, icon: User },
              // Updated: Displays localized dynamic lifecycle metrics text cleanly
              { l: "Employment", v: profile.employmentContext, icon: Fingerprint },
              { l: "Email Target", v: profile.email, icon: Mail },
            ].map(({ l, v, icon: Ic }) => (
              <div key={l} className="min-w-0">
                <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"><Ic className="h-3 w-3" />{l}</dt>
                <dd className="mt-1 truncate font-semibold text-foreground">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="relative grid place-items-center rounded-2xl glass-strong w-32 h-32 mx-auto lg:mx-0">
            <svg viewBox="0 0 100 100" className="absolute inset-0">
              <circle cx="50" cy="50" r="42" stroke="oklch(0.3 0.03 260)" strokeWidth="8" fill="none" />
              <circle
                cx="50" cy="50" r="42"
                stroke={profile.riskScore >= 80 ? "oklch(0.64 0.25 22)" : profile.riskScore >= 50 ? "oklch(0.78 0.16 75)" : "oklch(0.72 0.18 158)"}
                strokeWidth="8" fill="none" strokeLinecap="round"
                strokeDasharray={`${(profile.riskScore / 100) * 264} 264`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="relative text-center">
              <div className="font-display text-3xl font-bold text-foreground tabular-nums">{profile.riskScore}</div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Risk Score</div>
            </div>
          </div>
        </section>

        {/* INTEGRATED ACCESS CHANNELS */}
        <section>
          <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Cross-Platform Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {profile.platforms.map((p) => (
              <div key={p.platform} className="glass rounded-xl p-5 hover:border-primary/40 hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{p.platform}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">Status Log: {p.lastActivity}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-4 space-y-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Entitlements / Scope</div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto scrollbar-none">
                      {p.roles.map((r) => (
                        <span key={r} className="rounded-md bg-muted/60 border border-border/60 px-1.5 py-0.5 text-[10px] font-mono text-foreground truncate max-w-50">{r}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                    <span className="text-muted-foreground">MFA Enforcement</span>
                    <span className={p.mfa ? "inline-flex items-center gap-1 text-success font-semibold" : "inline-flex items-center gap-1 text-critical font-semibold"}>
                      {p.mfa ? <><CheckCircle2 className="h-3 w-3" /> Enforced</> : <><AlertTriangle className="h-3 w-3" /> Missing</>}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* INHERITANCE PATHWAYS */}
        <section className="glass rounded-2xl p-6">
          <h3 className="font-display text-lg font-bold mb-1 flex items-center gap-2"><NetworkIcon className="h-4 w-4 text-secondary" /> Effective Privilege Analysis</h3>
          <p className="text-xs text-muted-foreground mb-5">Inheritance path showing how this identity accumulated effective privileges</p>
          <div className="flex flex-wrap items-center gap-2">
            {[profile.name, "Dev Team (AD Group)", "Cloud Deployers (Azure)", "AWS AdministratorAccess", "Production Data S3 Core"].map((step, idx, arr) => (
              <div key={step} className="flex items-center gap-2 animate-fade-up" style={{ animationDelay: `${idx * 80}ms` }}>
                <div className={`rounded-xl px-4 py-2.5 border ${
                  idx === 0 ? "bg-(--gradient-primary) border-primary text-primary-foreground font-semibold glow-primary" :
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

        {/* NEW MATRIX SECTION: RISK BREAKDOWN & IDENTITY BLAST HORIZON */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* RISK BREAKDOWN LEDGER */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2 text-white">
              <Activity className="h-4 w-4 text-primary" /> Risk Score Breakdown
            </h3>
            <div className="space-y-2.5 font-mono text-xs">
              {profile.riskBreakdown.length === 0 ? (
                <div className="text-slate-500 italic py-4">No high-severity dynamic risk deltas identified.</div>
              ) : (
                profile.riskBreakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-red-400 font-bold">+{item.score}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between items-center pt-2 text-sm font-bold text-white">
                <span>Total Composite Risk Score</span>
                <span className="text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20">
                  = {profile.riskScore}
                </span>
              </div>
            </div>
          </div>

          {/* IDENTITY BLAST HORIZON */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2 text-white">
              <ShieldAlert className="h-4 w-4 text-orange-400" /> Identity Blast Radius
            </h3>
            <div className="space-y-3 text-xs">
              {[
                { l: "Connected Platforms", v: profile.blastRadius.connectedPlatforms, c: "text-white font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded" },
                { l: "Admin Roles Identified", v: profile.blastRadius.adminRoles, c: "text-white font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded" },
                { l: "Sensitive Target Resources", v: profile.blastRadius.sensitiveResources, c: "text-slate-200 font-semibold" },
                { l: "Potential Systemic Impact", v: profile.blastRadius.potentialImpact, c: profile.riskScore >= 80 ? "text-red-400 font-bold" : "text-yellow-400 font-medium" },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-4 border-b border-slate-800 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-muted-foreground font-medium">{item.l}:</span>
                  <span className={item.c}>{item.v}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI POSTURE TRIAGE SUMMARY */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 auto-rows-max">
          <div className="glass-strong rounded-2xl p-6 xl:col-span-2 neon-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-(--gradient-primary) glow-primary">
                  <Shield className="h-3.5 w-3.5 text-primary-foreground" />
                </span>
                AI Risk Narrative
              </h3>
              <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Generated · Puter / Gemini Core</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90 font-mono bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 mb-4">{profile.narrative}</p>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><Activity className="h-3 w-3" /> Evidence Vectors</div>
                <ul className="space-y-1.5 text-xs text-foreground/80">
                  {profile.evidence.map((e) => <li key={e} className="flex gap-2"><span className="text-primary">•</span>{e}</li>)}
                </ul>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><KeyRound className="h-3 w-3" /> Programmatic Playbooks</div>
                <ol className="space-y-1.5 text-xs text-foreground/80">
                  {profile.remediation.map((r, idx) => (
                    <li key={r} className="flex gap-2">
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">{idx + 1}</span>
                      {r}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 flex flex-col h-full">
            <h3 className="font-display text-lg font-bold mb-3">Executive Impact Summary</h3>
            <p className="text-sm text-foreground/80 leading-relaxed">
              This identity's multi-platform posture warrants <span className="font-semibold text-foreground">{profile.riskCategory.toLowerCase()}</span> priority review.
              Operational presence spans {profile.platforms.length} cloud/on-premises accounts with
              {" "}<span className="font-semibold text-foreground">{profile.privilege}</span> access level definitions.
            </p>
            <div className="mt-4 space-y-2 flex-1">
              {[
                { l: "Blast Boundary", v: profile.riskScore >= 80 ? "Critical Systemic Infrastructure Takeover" : "Standard Corporate Environment Access" },
                { l: "Target Spread", v: `${profile.platforms.length} Active System Connections` },
                { l: "Isolation Metric", v: "Zero-Delay (Automated via Webhooks)" },
              ].map(({ l, v }) => (
                <div key={l} className="flex flex-col justify-between gap-1 rounded-lg bg-muted/30 px-3 py-2 text-xs">
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider">{l}</span>
                  <span className="font-semibold text-foreground font-mono">{v}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => alert(`Opening AI Security Analyst for user: ${profile.employeeId}`)} 
              className="mt-6 w-auto rounded-full bg-blue-500 py-2.5 px-6 text-sm font-semibold text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 min-h-10 ml-auto shadow-lg shadow-blue-500/50"
            >
              <Sparkles className="h-4 w-4" />
              Open Issue
            </button>
          </div>
        </section>
      </main>
    </>
  );
}