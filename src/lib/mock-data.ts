// Mock data for IdentityGuard AI
export type RiskCategory = "Critical" | "High" | "Medium" | "Low";
export type PlatformStatus = "Active" | "Disabled" | "Suspended" | "Not Provisioned";

export interface PlatformAccount {
  platform: string;
  status: PlatformStatus;
  roles: string[];
  lastActivity: string;
  mfa: boolean;
}

export interface Identity {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  manager: string;
  title: string;
  employmentStatus: "Active" | "Terminated" | "On Leave";
  riskScore: number;
  riskCategory: RiskCategory;
  privilege: "Standard" | "Privileged" | "Admin" | "Super Admin";
  lastLogin: string;
  ad: PlatformStatus;
  azure: PlatformStatus;
  aws: PlatformStatus;
  okta: PlatformStatus;
  salesforce: PlatformStatus;
  servicenow: PlatformStatus;
  platforms: PlatformAccount[];
  narrative: string;
  evidence: string[];
  remediation: string[];
}

const firstNames = ["John","Sarah","Michael","Priya","David","Aisha","Carlos","Emma","Liam","Yuki","Ahmed","Sofia","Marcus","Zara","Ethan","Olivia","Noah","Maya","Ravi","Hannah","Lucas","Chen","Diego","Aria","Ivan","Nora","Owen","Layla","Felix","Iris"];
const lastNames = ["Smith","Patel","Garcia","Chen","Johnson","Khan","Rodriguez","Lee","Brown","Davis","Müller","Tanaka","Singh","Williams","Martinez","Anderson","Kim","Hassan","Cohen","Nguyen","O'Brien","Schwartz","Rossi","Dubois","Volkov","Costa"];
const depts = ["Engineering","Finance","Security","Sales","Marketing","HR","Legal","Operations","Customer Success","Product","Data Science","IT"];
const managers = ["Anna Reeves","Tom Whitaker","Lila Park","Marco Vega","Jenna Ross","Kai Tanaka","Renee Voss"];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }

function statusFor(seed: number, terminated: boolean, idx: number): PlatformStatus {
  if (terminated) {
    // gap detection: some platforms still active
    const r = (seed * 7 + idx * 13) % 10;
    if (r < 4) return "Active";
    if (r < 7) return "Disabled";
    return "Suspended";
  }
  const r = (seed + idx * 3) % 10;
  if (r < 7) return "Active";
  if (r < 8) return "Disabled";
  if (r < 9) return "Suspended";
  return "Not Provisioned";
}

export const identities: Identity[] = Array.from({ length: 48 }).map((_, i) => {
  const name = `${pick(firstNames, i)} ${pick(lastNames, i * 3 + 1)}`;
  const terminated = i % 9 === 0;
  const risk = terminated ? 88 + (i % 12) : Math.max(8, Math.min(98, ((i * 17 + 23) % 100)));
  const cat: RiskCategory = risk >= 80 ? "Critical" : risk >= 60 ? "High" : risk >= 35 ? "Medium" : "Low";
  const priv = risk >= 85 ? "Super Admin" : risk >= 65 ? "Admin" : risk >= 40 ? "Privileged" : "Standard";
  const dept = pick(depts, i + 2);

  const platforms: PlatformAccount[] = [
    { platform: "Active Directory", status: statusFor(i, terminated, 0), roles: ["Domain Users","Engineering-RW"], lastActivity: `${(i % 30) + 1}d ago`, mfa: i % 3 !== 0 },
    { platform: "Azure AD", status: statusFor(i, terminated, 1), roles: ["Global Reader","Subscription Contributor"], lastActivity: `${(i % 20) + 2}d ago`, mfa: i % 2 === 0 },
    { platform: "AWS IAM", status: statusFor(i, terminated, 2), roles: priv === "Super Admin" ? ["AdministratorAccess","S3FullAccess"] : ["PowerUserAccess"], lastActivity: `${(i % 14) + 1}d ago`, mfa: i % 4 !== 0 },
    { platform: "Okta", status: statusFor(i, terminated, 3), roles: ["SSO User","App Admin"], lastActivity: `${(i % 10) + 1}d ago`, mfa: true },
    { platform: "Salesforce", status: statusFor(i, terminated, 4), roles: ["Standard User"], lastActivity: `${(i % 25) + 5}d ago`, mfa: i % 2 === 1 },
    { platform: "ServiceNow", status: statusFor(i, terminated, 5), roles: ["ITIL","Approver"], lastActivity: `${(i % 18) + 3}d ago`, mfa: i % 3 === 0 },
  ];

  return {
    id: `idn-${1000 + i}`,
    employeeId: `EMP-${10240 + i}`,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]/g, ".")}@acme-corp.com`,
    department: dept,
    manager: pick(managers, i),
    title: pick(["Senior Engineer","Director","Analyst","VP","Principal","Manager","Architect"], i),
    employmentStatus: terminated ? "Terminated" : (i % 17 === 0 ? "On Leave" : "Active"),
    riskScore: risk,
    riskCategory: cat,
    privilege: priv,
    lastLogin: terminated ? `${45 + (i % 30)}d ago` : `${(i % 9) + 1}h ago`,
    ad: platforms[0].status,
    azure: platforms[1].status,
    aws: platforms[2].status,
    okta: platforms[3].status,
    salesforce: platforms[4].status,
    servicenow: platforms[5].status,
    platforms,
    narrative: terminated
      ? `${name} was offboarded ${45 + (i % 30)} days ago, yet retains active credentials in AWS IAM and Okta with administrative scope. This represents a textbook orphaned-account scenario with high potential for credential abuse or insider data exfiltration.`
      : `${name} holds elevated privileges across ${platforms.filter(p => p.status === "Active").length} platforms with inconsistent MFA enforcement. Privilege growth velocity is ${Math.floor(risk / 10)}× the department average, indicating role-creep risk.`,
    evidence: [
      `Last interactive login: ${terminated ? `${45 + (i % 30)} days ago` : `${(i % 9) + 1} hours ago`}`,
      `Active sessions detected in ${platforms.filter(p => p.status === "Active").length} platforms`,
      `${platforms.filter(p => !p.mfa).length} platforms without MFA enforcement`,
      `Privilege escalation event detected ${(i % 30) + 3} days ago`,
    ],
    remediation: terminated
      ? ["Immediately revoke AWS IAM access keys", "Disable Okta account and rotate API tokens", "Audit S3 access logs for last 90 days", "Notify SOC and trigger IR-001 playbook"]
      : ["Enforce MFA across all platforms", "Right-size IAM role to least-privilege", "Schedule quarterly access review", "Add to privileged access monitoring tier"],
  };
});

export const kpis = {
  total: 5243,
  groups: 500,
  serviceAccounts: 100,
  auditEvents: 2000,
  highRisk: 42,
  orphaned: 17,
  dormantAdmins: 28,
  incidents: 50,
  riskReduction: 43,
};

export const riskDistribution = [
  { name: "Critical", value: 42, color: "var(--critical)" },
  { name: "High", value: 156, color: "var(--warning)" },
  { name: "Medium", value: 892, color: "var(--info)" },
  { name: "Low", value: 4153, color: "var(--success)" },
];

export const platformHeatmap = [
  { platform: "Active Directory", critical: 8, high: 22, medium: 140, low: 980 },
  { platform: "Azure AD", critical: 6, high: 31, medium: 198, low: 1240 },
  { platform: "AWS IAM", critical: 14, high: 38, medium: 87, low: 412 },
  { platform: "Okta", critical: 5, high: 24, medium: 211, low: 1580 },
  { platform: "Salesforce", critical: 3, high: 18, medium: 142, low: 920 },
  { platform: "ServiceNow", critical: 4, high: 12, medium: 96, low: 780 },
];

export const privilegeTrend = Array.from({ length: 12 }).map((_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  privileged: 180 + Math.round(Math.sin(i / 2) * 30 + i * 8),
  admins: 60 + Math.round(Math.cos(i / 3) * 12 + i * 2),
  dormant: 12 + Math.round(Math.sin(i) * 5 + i),
}));

export const adminConcentration = depts.slice(0, 8).map((d, i) => ({
  department: d,
  admins: 4 + ((i * 7) % 22),
  dormant: 1 + ((i * 3) % 6),
}));

export const incidents = [
  {
    id: "INC-2041", severity: "Critical" as const, title: "Terminated employee retains AWS admin access",
    user: "John Smith", time: "2h ago",
    detail: "Employee terminated 45 days ago. AD disabled, but AWS AdministratorAccess and Okta remain active.",
    action: "Immediately revoke cloud access and rotate keys.",
  },
  {
    id: "INC-2040", severity: "Critical" as const, title: "Privilege escalation in production",
    user: "Sarah Patel", time: "5h ago",
    detail: "User added to 'Cloud-Admins' group outside change window. No approval ticket found.",
    action: "Revert group membership, open IR case.",
  },
  {
    id: "INC-2039", severity: "High" as const, title: "MFA disabled on privileged account",
    user: "Michael Garcia", time: "9h ago",
    detail: "MFA factor removed from Azure AD account with Global Admin role.",
    action: "Re-enforce MFA and review session tokens.",
  },
  {
    id: "INC-2038", severity: "High" as const, title: "Dormant admin reactivated",
    user: "Priya Chen", time: "1d ago",
    detail: "Account inactive for 142 days suddenly logged in from new geography.",
    action: "Force password reset and verify identity.",
  },
  {
    id: "INC-2037", severity: "Medium" as const, title: "Unusual API token creation",
    user: "David Khan", time: "1d ago",
    detail: "5 new long-lived API tokens created in Okta within 10 minutes.",
    action: "Review tokens, revoke unused ones.",
  },
];

export const alerts = [
  { time: "09:42", type: "Privilege", text: "User added to Admin group: Sarah Patel", severity: "high" },
  { time: "09:18", type: "Cloud", text: "AWS role granted: AdministratorAccess to ETL-Pipeline", severity: "critical" },
  { time: "08:55", type: "Token", text: "New long-lived API token created in Okta", severity: "medium" },
  { time: "08:33", type: "Auth", text: "MFA disabled on Azure AD account", severity: "high" },
  { time: "07:50", type: "Dormant", text: "Dormant account activated after 142d (Priya Chen)", severity: "high" },
  { time: "06:14", type: "Access", text: "Cross-region access from unusual geo (Singapore)", severity: "medium" },
  { time: "05:02", type: "Group", text: "Service account added to Domain Admins", severity: "critical" },
  { time: "04:21", type: "Login", text: "Failed admin login spike: 38 attempts in 4 min", severity: "high" },
];

export const compliance = [
  { framework: "NIST AC-2", control: "Account Management", score: 92, status: "Compliant" },
  { framework: "NIST AC-6", control: "Least Privilege", score: 74, status: "Partial" },
  { framework: "CIS Control 5", control: "Account Management", score: 88, status: "Compliant" },
  { framework: "CIS Control 6", control: "Access Control Management", score: 71, status: "Partial" },
  { framework: "GDPR Art. 32", control: "Security of Processing", score: 86, status: "Compliant" },
  { framework: "ISO 27001 A.9", control: "Access Control", score: 81, status: "Compliant" },
  { framework: "SOX ITGC", control: "Logical Access", score: 79, status: "Partial" },
  { framework: "HIPAA §164.308", control: "Workforce Security", score: 90, status: "Compliant" },
];

export function getIdentity(id: string) {
  return identities.find(i => i.id === id);
}

export function statusTone(s: PlatformStatus): "success" | "critical" | "warning" | "muted" {
  if (s === "Active") return "success";
  if (s === "Disabled") return "muted";
  if (s === "Suspended") return "warning";
  return "muted";
}
