import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Mail, Building, User, Shield, Activity, AlertTriangle, CheckCircle2, KeyRound, Network as NetworkIcon, Fingerprint, RefreshCw, Sparkles, ShieldAlert, Clock, TrendingUp, Lock, AlertCircle, LogOut, Zap, Skull, XCircle, GitCompareArrows, ListChecks, Crosshair, ScrollText } from "lucide-react";
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

type ZombieSeverity = "Critical" | "High" | "Medium";

interface ZombieEvidenceItem {
  label: string;
  detail: string;
  isFlag: boolean; // true = "✗" failing/risky condition, false = "✓" passing/safe condition
}

interface ZombieAccountAssessment {
  isZombie: boolean;
  severity: ZombieSeverity;
  triggerCount: number; // how many of the 3 OR-conditions fired (AWS active / Okta active / Admin privilege)
  hrTerminated: boolean;
  adDisabled: boolean;
  awsActive: boolean;
  oktaActive: boolean;
  hasAdminPrivilege: boolean;
  daysSinceTermination: number | null;
  evidence: ZombieEvidenceItem[];
  remediation: string[];
}

type ConsistencyVerdict = "Fully Consistent" | "Partial Mismatch" | "Critical Lifecycle Drift";

interface PlatformStatusRow {
  system: string;
  status: string;
  isExpectedState: boolean; // true = aligned with HR lifecycle expectation, false = mismatch
}

interface ConsistencyAnalysis {
  verdict: ConsistencyVerdict;
  consistencyScore: number; // 0-100, derived from mismatch count
  mismatchCount: number;
  comparisonRows: PlatformStatusRow[];
  findings: string[];
  impactStatement: string;
  remediation: string[];
}

type RemediationPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface PriorityAction {
  priority: RemediationPriority;
  label: string;
}

interface RemediationTimelinePhase {
  phase: string;
  actions: string[];
}

interface RemediationCenterData {
  priorityActions: PriorityAction[];
  currentRiskScore: number;
  projectedRiskScore: number;
  riskReductionPercent: number;
  timeline: RemediationTimelinePhase[];
  businessImpactBefore: string[];
  businessImpactAfter: string[];
}

// ===== FEATURE 1: MITRE ATT&CK Mapping =====
type MitreSeverity = "Critical" | "High" | "Medium" | "Low";

interface MitreTechnique {
  techniqueId: string;
  techniqueName: string;
  description: string;
  triggeredBy: string; // which detected finding produced this mapping, shown for traceability
  severity: MitreSeverity;
}

// ===== FEATURE 2: Compliance Impact Assessment =====
type ComplianceStatus = "Compliant" | "At Risk" | "Non-Compliant";

interface ComplianceControlRow {
  framework: string;
  control: string;
  controlName: string;
  status: ComplianceStatus;
  riskImpact: string;
}

interface ComplianceAssessment {
  overallPosture: ComplianceStatus;
  rows: ComplianceControlRow[];
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
  zombieAccount: ZombieAccountAssessment;
  consistencyAnalysis: ConsistencyAnalysis;
  remediationCenter: RemediationCenterData;
  mitreTechniques: MitreTechnique[];
  complianceAssessment: ComplianceAssessment;
}

interface TimelineEvent {
  daysAgo: number;
  label: string;
  description: string;
  severity: "normal" | "warning" | "critical" | "escalation";
  icon: React.ReactNode;
}

// Helper function to calculate days from a date
const calculateDaysAgo = (dateString: string): number => {
  const targetDate = new Date(dateString);
  const baselineDate = new Date("2026-06-20");
  const diffTime = Math.abs(baselineDate.getTime() - targetDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Computes the Zombie Account assessment from raw cross-platform identity attributes.
 *
 * Definition:
 *   Zombie Account = HR Status is Terminated
 *                     AND (AWS Account Active OR Okta Account Active OR Admin Privileges Present)
 *
 * Severity is derived dynamically from how many risk conditions are simultaneously true,
 * plus whether admin privileges are part of the mix (admin = automatic floor of High).
 */
const computeZombieAccountAssessment = (
  employmentStatus: string,
  adAccount: ADRecord | undefined,
  awsAccount: AWSRecord | undefined,
  oktaAccount: OktaRecord | undefined,
  hasAdminAccess: boolean,
  terminationDate: string | undefined
): ZombieAccountAssessment => {
  const hrTerminated = employmentStatus === "Terminated";
  const adDisabled = adAccount ? adAccount.account_status !== "Enabled" : true;
  const awsActive = !!awsAccount && awsAccount.account_status === "Active";
  const oktaActive = !!oktaAccount && oktaAccount.account_status === "Active";
  const hasAdminPrivilege = hasAdminAccess;

  const triggers = [awsActive, oktaActive, hasAdminPrivilege].filter(Boolean).length;
  const isZombie = hrTerminated && triggers > 0;

  const daysSinceTermination = hrTerminated && terminationDate ? calculateDaysAgo(terminationDate) : null;

  // Severity logic:
  // - Critical: terminated + admin privileges still present + at least one active channel (full takeover risk)
  // - High: terminated + 2+ active risk conditions, or admin privileges alone present
  // - Medium: terminated + exactly 1 active (non-admin) channel
  let severity: ZombieSeverity = "Medium";
  if (isZombie) {
    if (hasAdminPrivilege && (awsActive || oktaActive)) {
      severity = "Critical";
    } else if (hasAdminPrivilege || triggers >= 2) {
      severity = "High";
    } else {
      severity = "Medium";
    }
  }

  const evidence: ZombieEvidenceItem[] = [
    {
      label: "HR Status",
      detail: hrTerminated ? "Terminated" : employmentStatus,
      isFlag: hrTerminated,
    },
    {
      label: "Active Directory",
      detail: adDisabled ? "Disabled" : "Active",
      isFlag: !adDisabled,
    },
    {
      label: "AWS IAM",
      detail: awsActive ? "Active" : "Disabled / Inactive",
      isFlag: awsActive,
    },
    {
      label: "Okta Session",
      detail: oktaActive ? "Active" : "Disabled / Inactive",
      isFlag: oktaActive,
    },
    {
      label: "Administrator Privileges",
      detail: hasAdminPrivilege ? "Present" : "None detected",
      isFlag: hasAdminPrivilege,
    },
  ];

  const remediation: string[] = [];
  if (awsActive) remediation.push("Disable AWS IAM account immediately");
  if (oktaActive) remediation.push("Revoke active Okta sessions and OIDC tokens");
  if (hasAdminPrivilege) remediation.push("Rotate associated credentials and access keys");
  if (triggers >= 1) remediation.push("Audit inherited and nested privileges across all platforms");
  if (!adDisabled) remediation.push("Disable Active Directory account and move to Quarantine OU");
  if (remediation.length === 0) remediation.push("Continue standard offboarding verification checks");

  return {
    isZombie,
    severity,
    triggerCount: triggers,
    hrTerminated,
    adDisabled,
    awsActive,
    oktaActive,
    hasAdminPrivilege,
    daysSinceTermination,
    evidence,
    remediation,
  };
};

/**
 * Computes the Cross-Platform Identity Consistency Analysis from raw cross-platform attributes.
 *
 * Expectation model:
 *   If HR Status = Terminated, every connected platform (AD, AWS, Okta) is EXPECTED to be Disabled/Inactive.
 *   If HR Status = Active, platforms are expected to be Enabled/Active (no offboarding expectation applies).
 *
 * A "mismatch" is any connected platform whose actual state diverges from the expected state.
 * Score model (per spec): All aligned = 100%, 1 mismatch = 75%, 2 mismatches = 50%, 3 mismatches = 25%.
 * 4+ possible mismatches (future platforms) floor at 0%.
 */
const computeConsistencyAnalysis = (
  employmentStatus: string,
  adAccount: ADRecord | undefined,
  awsAccount: AWSRecord | undefined,
  oktaAccount: OktaRecord | undefined,
  mapping: MappingRecord | undefined
): ConsistencyAnalysis => {
  const hrTerminated = employmentStatus === "Terminated";

  const comparisonRows: PlatformStatusRow[] = [
    {
      system: "HR System",
      status: employmentStatus,
      isExpectedState: true, // HR is always the source of truth
    },
  ];

  let mismatchCount = 0;

  if (mapping?.ad_account && adAccount) {
    const adEnabled = adAccount.account_status === "Enabled";
    const expected = hrTerminated ? !adEnabled : adEnabled;
    if (!expected) mismatchCount++;
    comparisonRows.push({
      system: "Active Directory",
      status: adEnabled ? "Active" : "Disabled",
      isExpectedState: expected,
    });
  }

  if (mapping?.aws_account && awsAccount) {
    const awsEnabled = awsAccount.account_status === "Active";
    const expected = hrTerminated ? !awsEnabled : awsEnabled;
    if (!expected) mismatchCount++;
    comparisonRows.push({
      system: "AWS IAM",
      status: awsEnabled ? "Active" : "Disabled",
      isExpectedState: expected,
    });
  }

  if (mapping?.okta_account && oktaAccount) {
    const oktaEnabled = oktaAccount.account_status === "Active";
    const expected = hrTerminated ? !oktaEnabled : oktaEnabled;
    if (!expected) mismatchCount++;
    comparisonRows.push({
      system: "Okta",
      status: oktaEnabled ? "Active" : "Disabled",
      isExpectedState: expected,
    });
  }

  // Score model: 100 / 75 / 50 / 25, floored at 0 for 4+ mismatches
  const scoreTable = [100, 75, 50, 25];
  const consistencyScore = mismatchCount < scoreTable.length ? scoreTable[mismatchCount] : 0;

  let verdict: ConsistencyVerdict = "Fully Consistent";
  if (mismatchCount >= 2) verdict = "Critical Lifecycle Drift";
  else if (mismatchCount === 1) verdict = "Partial Mismatch";

  // Build findings dynamically from each row's outcome
  const findings: string[] = [];
  if (hrTerminated) {
    const adRow = comparisonRows.find(r => r.system === "Active Directory");
    if (adRow) {
      findings.push(
        adRow.isExpectedState
          ? "Employee termination was successfully propagated to Active Directory."
          : "Active Directory account remains enabled despite employee termination."
      );
    }
    const awsRow = comparisonRows.find(r => r.system === "AWS IAM");
    if (awsRow) {
      findings.push(
        awsRow.isExpectedState
          ? "AWS IAM access was correctly revoked following termination."
          : "AWS IAM access remains active."
      );
    }
    const oktaRow = comparisonRows.find(r => r.system === "Okta");
    if (oktaRow) {
      findings.push(
        oktaRow.isExpectedState
          ? "Okta access was correctly revoked following termination."
          : "Okta access remains active."
      );
    }
    findings.push(
      mismatchCount > 0
        ? "Lifecycle synchronization failure detected."
        : "Lifecycle synchronization completed successfully across all connected platforms."
    );
  } else {
    findings.push("Employee is currently active; no offboarding propagation is expected.");
    if (mismatchCount > 0) {
      findings.push("One or more connected platforms show an unexpected disabled state for an active employee.");
    } else {
      findings.push("All connected platforms reflect the expected active state.");
    }
  }

  const impactStatement = hrTerminated && mismatchCount > 0
    ? "Terminated users may retain access to cloud resources and enterprise applications. This creates a privilege abuse and unauthorized access risk."
    : hrTerminated
      ? "Offboarding was propagated correctly across all systems, minimizing residual access risk."
      : "Identity state is consistent with active employment status across connected platforms.";

  const remediation: string[] = [];
  if (hrTerminated) {
    const awsRow = comparisonRows.find(r => r.system === "AWS IAM");
    const oktaRow = comparisonRows.find(r => r.system === "Okta");
    const adRow = comparisonRows.find(r => r.system === "Active Directory");
    if (awsRow && !awsRow.isExpectedState) remediation.push("Disable AWS IAM account");
    if (oktaRow && !oktaRow.isExpectedState) remediation.push("Revoke Okta sessions");
    if (adRow && !adRow.isExpectedState) remediation.push("Disable Active Directory account");
    if (mismatchCount > 0) remediation.push("Audit access inheritance");
    remediation.push("Verify offboarding workflows");
  } else {
    remediation.push("Verify offboarding workflows are correctly scoped to terminated employees only");
  }

  return {
    verdict,
    consistencyScore,
    mismatchCount,
    comparisonRows,
    findings,
    impactStatement,
    remediation,
  };
};

/**
 * Builds the Executive Remediation Center dataset from attributes already derived
 * elsewhere on the page (zombie assessment, consistency analysis, risk score, privilege).
 * Everything here is computed, not hardcoded — priority actions, projected risk score,
 * and the before/after business impact lists all react to the underlying identity data.
 */
const computeRemediationCenterData = (
  riskScore: number,
  zombie: ZombieAccountAssessment,
  consistency: ConsistencyAnalysis,
  hasAdminAccess: boolean,
  isTerminated: boolean
): RemediationCenterData => {
  // --- Priority Actions: derived from which conditions are actually active ---
  const priorityActions: PriorityAction[] = [];

  if (zombie.awsActive) {
    priorityActions.push({ priority: "CRITICAL", label: "Disable AWS IAM Account" });
  }
  if (zombie.oktaActive) {
    priorityActions.push({ priority: "HIGH", label: "Revoke Okta Sessions" });
  }
  if (hasAdminAccess) {
    priorityActions.push({ priority: "HIGH", label: "Remove AdministratorAccess Policy" });
  }
  if (consistency.mismatchCount > 0 || zombie.triggerCount > 0) {
    priorityActions.push({ priority: "MEDIUM", label: "Audit Group Inheritance" });
  }
  if (isTerminated && zombie.adDisabled && priorityActions.length === 0) {
    // AD already disabled correctly and nothing else flagged — lower-priority verification step
    priorityActions.push({ priority: "LOW", label: "Verify Offboarding Workflow Completion" });
  }
  if (priorityActions.length === 0) {
    priorityActions.push({ priority: "LOW", label: "Maintain Standard Access Review Cadence" });
  }

  // --- Estimated Risk Reduction ---
  // Each resolved finding reduces score proportionally to its contribution; floor at a residual baseline.
  let projectedReduction = 0;
  if (zombie.awsActive) projectedReduction += 35;
  if (zombie.oktaActive) projectedReduction += 20;
  if (hasAdminAccess) projectedReduction += 25;
  if (consistency.mismatchCount > 0) projectedReduction += 10 * Math.min(consistency.mismatchCount, 2);

  const residualBaselineScore = 10; // floor representing routine identity hygiene risk that always remains
  const projectedRiskScore = Math.max(residualBaselineScore, riskScore - projectedReduction);
  const riskReductionPercent = riskScore > 0
    ? Math.round(((riskScore - projectedRiskScore) / riskScore) * 100)
    : 0;

  // --- Remediation Timeline: phases populated based on which actions are relevant ---
  const timeline: RemediationTimelinePhase[] = [];

  const immediateActions: string[] = [];
  if (zombie.awsActive) immediateActions.push("Disable AWS Access");
  if (hasAdminAccess) immediateActions.push("Suspend Administrator Privileges");
  if (immediateActions.length > 0) timeline.push({ phase: "Immediate (0-1 hour)", actions: immediateActions });

  const sameDayActions: string[] = [];
  if (zombie.oktaActive) sameDayActions.push("Revoke Sessions");
  if (isTerminated) sameDayActions.push("Confirm HR Offboarding Record");
  if (sameDayActions.length > 0) timeline.push({ phase: "Same Day", actions: sameDayActions });

  const next24hActions: string[] = [];
  if (consistency.mismatchCount > 0 || zombie.triggerCount > 0) next24hActions.push("Audit Group Memberships");
  next24hActions.push("Notify Identity & Access Management Owner");
  timeline.push({ phase: "24 Hours", actions: next24hActions });

  const sevenDayActions: string[] = ["Review IAM Policies"];
  if (hasAdminAccess) sevenDayActions.push("Validate Least-Privilege Role Assignments");
  timeline.push({ phase: "7 Days", actions: sevenDayActions });

  // --- Business Impact: Before / After ---
  const businessImpactBefore: string[] = [];
  if (hasAdminAccess) businessImpactBefore.push("Production Data Exposure");
  if (zombie.triggerCount > 0 || hasAdminAccess) businessImpactBefore.push("Privilege Escalation Risk");
  if (zombie.isZombie) businessImpactBefore.push("Unauthorized Access Risk");
  if (consistency.mismatchCount > 0) businessImpactBefore.push("Compliance & Audit Gap");
  if (businessImpactBefore.length === 0) businessImpactBefore.push("Standard Residual Identity Risk");

  const businessImpactAfter: string[] = [];
  if (zombie.awsActive || zombie.oktaActive) businessImpactAfter.push("Identity Fully Contained");
  if (zombie.triggerCount > 0 || hasAdminAccess) businessImpactAfter.push("Access Revoked");
  if (consistency.mismatchCount > 0) businessImpactAfter.push("Compliance Restored");
  if (businessImpactAfter.length === 0) businessImpactAfter.push("Posture Maintained");

  return {
    priorityActions,
    currentRiskScore: riskScore,
    projectedRiskScore,
    riskReductionPercent,
    timeline,
    businessImpactBefore,
    businessImpactAfter,
  };
};

/**
 * FEATURE 1: Maps detected identity findings to MITRE ATT&CK techniques.
 * Each technique is only included if the underlying finding that justifies it is actually
 * present on this identity (driven by the Zombie Account and Consistency assessments).
 */
const computeMitreTechniques = (
  zombie: ZombieAccountAssessment,
  consistency: ConsistencyAnalysis,
  hasAdminAccess: boolean,
  isTerminated: boolean
): MitreTechnique[] => {
  const techniques: MitreTechnique[] = [];

  // Offboarding Gap -> T1078 Valid Accounts
  if (isTerminated && (zombie.awsActive || zombie.oktaActive || !consistency.comparisonRows.every(r => r.isExpectedState))) {
    techniques.push({
      techniqueId: "T1078",
      techniqueName: "Valid Accounts",
      description: "Adversaries may use legitimate credentials to maintain access.",
      triggeredBy: "Offboarding Gap",
      severity: zombie.severity === "Critical" ? "Critical" : "High",
    });
  }

  // Privilege Escalation / lingering admin rights -> T1098 Account Manipulation
  if (hasAdminAccess && (isTerminated || zombie.triggerCount > 0)) {
    techniques.push({
      techniqueId: "T1098",
      techniqueName: "Account Manipulation",
      description: "Adversaries may manipulate accounts to maintain access to victim systems.",
      triggeredBy: "Privilege Escalation",
      severity: "Critical",
    });
  }

  // Active sessions persisting post-termination -> T1136 Create Account / persistence pathway
  if (isTerminated && (zombie.awsActive || zombie.oktaActive)) {
    techniques.push({
      techniqueId: "T1136",
      techniqueName: "Create Account",
      description: "Adversaries may create accounts to maintain access to victim systems.",
      triggeredBy: "Unauthorized Access Persistence",
      severity: "High",
    });
  }

  // Cross-platform privilege sprawl / inconsistent group memberships -> T1069 Permission Groups Discovery
  if (consistency.mismatchCount >= 2 || zombie.triggerCount >= 2) {
    techniques.push({
      techniqueId: "T1069",
      techniqueName: "Permission Groups Discovery",
      description: "Adversaries may attempt to discover group and permission settings to identify exploitable access paths.",
      triggeredBy: "Cross-Platform Access Risk",
      severity: "Medium",
    });
  }

  // No findings at all -> baseline, low-severity informational entry
  if (techniques.length === 0) {
    techniques.push({
      techniqueId: "T1078",
      techniqueName: "Valid Accounts",
      description: "Adversaries may use legitimate credentials to maintain access. No active misuse indicators detected for this identity.",
      triggeredBy: "Baseline Monitoring",
      severity: "Low",
    });
  }

  return techniques;
};

/**
 * FEATURE 2: Maps detected identity risk onto NIST SP 800-53, ISO 27001, and GDPR controls.
 * Status per control is derived from the same underlying conditions already computed elsewhere,
 * so the compliance view never disagrees with the rest of the page.
 */
const computeComplianceAssessment = (
  zombie: ZombieAccountAssessment,
  consistency: ConsistencyAnalysis,
  hasAdminAccess: boolean,
  isTerminated: boolean
): ComplianceAssessment => {
  const rows: ComplianceControlRow[] = [];

  // NIST AC-2: Account Management — violated if a terminated identity still has active access
  const ac2Violated = isTerminated && (zombie.awsActive || zombie.oktaActive || !zombie.adDisabled);
  rows.push({
    framework: "NIST SP 800-53",
    control: "AC-2",
    controlName: "Account Management",
    status: ac2Violated ? "Non-Compliant" : "Compliant",
    riskImpact: ac2Violated
      ? "Terminated account not deprovisioned within policy window."
      : "Account lifecycle managed within policy.",
  });

  // NIST AC-6: Least Privilege — violated if admin access is present and unjustified by active employment need
  const ac6Violated = hasAdminAccess && (isTerminated || zombie.triggerCount > 0);
  rows.push({
    framework: "NIST SP 800-53",
    control: "AC-6",
    controlName: "Least Privilege",
    status: ac6Violated ? "Non-Compliant" : (hasAdminAccess ? "At Risk" : "Compliant"),
    riskImpact: ac6Violated
      ? "Administrator-level privileges retained without active business justification."
      : hasAdminAccess
        ? "Administrator-level privileges present; periodic justification review recommended."
        : "Access scoped to standard privilege levels.",
  });

  // ISO 27001 A.5.18: Access Rights — at risk if any cross-platform mismatch exists
  const isoAtRisk = consistency.mismatchCount > 0;
  rows.push({
    framework: "ISO 27001",
    control: "A.5.18",
    controlName: "Access Rights",
    status: isoAtRisk ? (consistency.mismatchCount >= 2 ? "Non-Compliant" : "At Risk") : "Compliant",
    riskImpact: isoAtRisk
      ? "Access rights are not consistently provisioned, modified, and removed across systems."
      : "Access rights are consistently aligned across HR, AD, AWS, and Okta.",
  });

  // GDPR Article 32: Security of Processing — exposure exists if a zombie account can reach sensitive resources
  const gdprExposed = zombie.isZombie && hasAdminAccess;
  rows.push({
    framework: "GDPR",
    control: "Article 32",
    controlName: "Security of Processing",
    status: gdprExposed ? "Non-Compliant" : (zombie.isZombie ? "At Risk" : "Compliant"),
    riskImpact: gdprExposed
      ? "Unauthorized standing access to systems likely processing personal data."
      : zombie.isZombie
        ? "Residual access exists; personal data exposure risk should be reviewed."
        : "No indication of inappropriate access to systems processing personal data.",
  });

  // Overall posture: worst status wins
  const hasNonCompliant = rows.some(r => r.status === "Non-Compliant");
  const hasAtRisk = rows.some(r => r.status === "At Risk");
  const overallPosture: ComplianceStatus = hasNonCompliant ? "Non-Compliant" : hasAtRisk ? "At Risk" : "Compliant";

  return { overallPosture, rows };
};

const generateTimelineEvents = (profile: DetailedIdentityProfile, empTerminationDate?: string, adLastLoginDays?: number, awsLastActivityDays?: number): TimelineEvent[] => {
  const events: TimelineEvent[] = [];

  // Event 1: Termination event (if terminated)
  if (profile.employmentStatus === "Terminated" && empTerminationDate) {
    const daysAgo = calculateDaysAgo(empTerminationDate);
    events.push({
      daysAgo,
      label: "Employee Terminated",
      description: `${profile.name} employment contract ended`,
      severity: "critical",
      icon: <LogOut className="h-5 w-5" />,
    });
  }

  // Event 2: AD Account disabled (if applicable and user is terminated)
  if (profile.employmentStatus === "Terminated" && adLastLoginDays !== undefined) {
    const adDisableDays = Math.max(empTerminationDate ? calculateDaysAgo(empTerminationDate) - 3 : 0, 0);
    events.push({
      daysAgo: adDisableDays,
      label: "Active Directory Account Disabled",
      description: "AD account marked as disabled in directory services",
      severity: "normal",
      icon: <Lock className="h-5 w-5" />,
    });
  }

  // Event 3: AWS Access remains active (if user has admin access)
  if (profile.privilege === "Super Admin" && awsLastActivityDays !== undefined) {
    const awsActiveDays = Math.max(empTerminationDate ? calculateDaysAgo(empTerminationDate) - 7 : 7, 0);
    events.push({
      daysAgo: awsActiveDays,
      label: "AWS AdministratorAccess Still Active",
      description: "AWS console access detected despite employment termination",
      severity: "warning",
      icon: <AlertCircle className="h-5 w-5" />,
    });
  }

  // Event 4: Okta session active
  if (profile.platforms.some(p => p.platform === "Okta SaaS Gateway" && p.status === "Active")) {
    const oktaDays = Math.max(empTerminationDate ? calculateDaysAgo(empTerminationDate) - 12 : 12, 0);
    events.push({
      daysAgo: oktaDays,
      label: "Okta Session Remained Active",
      description: "Active Okta authentication session still present",
      severity: "warning",
      icon: <AlertCircle className="h-5 w-5" />,
    });
  }

  // Event 5: Multi-platform privilege mismatch
  if (profile.blastRadius.connectedPlatforms >= 2) {
    const mismatchDays = Math.max(empTerminationDate ? calculateDaysAgo(empTerminationDate) - 20 : 20, 0);
    events.push({
      daysAgo: mismatchDays,
      label: "Cross-Platform Privilege Mismatch Detected",
      description: "Inconsistent access controls across AD, AWS, and Okta platforms",
      severity: "warning",
      icon: <NetworkIcon className="h-5 w-5" />,
    });
  }

  // Event 6: Risk escalation event
  events.push({
    daysAgo: 0,
    label: `Risk Score Escalated to ${profile.riskScore}`,
    description: `Identity classified as ${profile.riskCategory} risk tier`,
    severity: profile.riskScore >= 80 ? "critical" : "warning",
    icon: <TrendingUp className="h-5 w-5" />,
  });

  // Sort events by daysAgo (descending - most recent first)
  return events.sort((a, b) => b.daysAgo - a.daysAgo);
};

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

          // Compute the Zombie Account assessment from raw cross-platform attributes
          const zombieAssessment = computeZombieAccountAssessment(
            emp.employment_status,
            ad,
            aws,
            okta,
            !!hasAdminAccess,
            emp.termination_date
          );

          // Compute the Cross-Platform Identity Consistency Analysis
          const consistencyAnalysis = computeConsistencyAnalysis(
            emp.employment_status,
            ad,
            aws,
            okta,
            mapping
          );

          // Compute the Executive Remediation Center dataset
          const remediationCenterData = computeRemediationCenterData(
            ledger ? ledger.risk_score : 10,
            zombieAssessment,
            consistencyAnalysis,
            !!hasAdminAccess,
            emp.employment_status === "Terminated"
          );

          // FEATURE 1: Compute MITRE ATT&CK technique mappings
          const mitreTechniques = computeMitreTechniques(
            zombieAssessment,
            consistencyAnalysis,
            !!hasAdminAccess,
            emp.employment_status === "Terminated"
          );

          // FEATURE 2: Compute Compliance Impact Assessment
          const complianceAssessment = computeComplianceAssessment(
            zombieAssessment,
            consistencyAnalysis,
            !!hasAdminAccess,
            emp.employment_status === "Terminated"
          );

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
            },
            zombieAccount: zombieAssessment,
            consistencyAnalysis: consistencyAnalysis,
            remediationCenter: remediationCenterData,
            mitreTechniques: mitreTechniques,
            complianceAssessment: complianceAssessment,
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

  const timelineEvents = useMemo(() => {
    if (!profile) return [];
    
    const baselineDate = new Date("2026-06-20");
    let empTermDate: string | undefined;
    
    // Calculate a termination date if terminated
    if (profile.employmentStatus === "Terminated") {
      const daysAgo = parseInt(profile.employmentContext.match(/\d+/)?.[0] || "0");
      const termDate = new Date(baselineDate);
      termDate.setDate(termDate.getDate() - daysAgo);
      empTermDate = termDate.toISOString().split('T')[0];
    }

    return generateTimelineEvents(profile, empTermDate);
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

  const zombie = profile.zombieAccount;

  // Severity-driven visual tokens for the Zombie Account banner/card
  const zombieSeverityStyles: Record<ZombieSeverity, { border: string; glow: string; badgeBg: string; badgeText: string; iconBg: string }> = {
    Critical: {
      border: "border-red-500/50",
      glow: "shadow-[0_0_40px_-8px_rgba(239,68,68,0.45)]",
      badgeBg: "bg-red-500/20 border-red-500/40",
      badgeText: "text-red-400",
      iconBg: "bg-red-500/20 text-red-400",
    },
    High: {
      border: "border-orange-500/50",
      glow: "shadow-[0_0_40px_-8px_rgba(249,115,22,0.4)]",
      badgeBg: "bg-orange-500/20 border-orange-500/40",
      badgeText: "text-orange-400",
      iconBg: "bg-orange-500/20 text-orange-400",
    },
    Medium: {
      border: "border-yellow-500/50",
      glow: "shadow-[0_0_30px_-8px_rgba(234,179,8,0.35)]",
      badgeBg: "bg-yellow-500/20 border-yellow-500/40",
      badgeText: "text-yellow-400",
      iconBg: "bg-yellow-500/20 text-yellow-400",
    },
  };
  const zStyle = zombieSeverityStyles[zombie.severity];

  const consistency = profile.consistencyAnalysis;

  // Verdict-driven visual tokens for the Consistency Analysis card
  const consistencyVerdictStyles: Record<ConsistencyVerdict, { badgeBg: string; badgeText: string; icon: string; ring: string }> = {
    "Fully Consistent": {
      badgeBg: "bg-success/15 border-success/40",
      badgeText: "text-success",
      icon: "✅",
      ring: "oklch(0.72 0.18 158)",
    },
    "Partial Mismatch": {
      badgeBg: "bg-yellow-500/15 border-yellow-500/40",
      badgeText: "text-yellow-400",
      icon: "⚠️",
      ring: "oklch(0.78 0.16 75)",
    },
    "Critical Lifecycle Drift": {
      badgeBg: "bg-red-500/15 border-red-500/40",
      badgeText: "text-red-400",
      icon: "🚨",
      ring: "oklch(0.64 0.25 22)",
    },
  };
  const cStyle = consistencyVerdictStyles[consistency.verdict];

  const remediationCenter = profile.remediationCenter;

  // Priority badge styling for the Executive Remediation Center's Priority Actions list
  const priorityStyles: Record<RemediationPriority, { badge: string }> = {
    CRITICAL: { badge: "bg-red-500/20 border-red-500/40 text-red-400" },
    HIGH: { badge: "bg-orange-500/20 border-orange-500/40 text-orange-400" },
    MEDIUM: { badge: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" },
    LOW: { badge: "bg-slate-700/40 border-slate-600/50 text-slate-300" },
  };

  const mitreTechniques = profile.mitreTechniques;
  const compliance = profile.complianceAssessment;

  // Severity badge styling for the MITRE ATT&CK Coverage card
  const mitreSeverityStyles: Record<MitreSeverity, { badge: string }> = {
    Critical: { badge: "bg-red-500/20 border-red-500/40 text-red-400" },
    High: { badge: "bg-orange-500/20 border-orange-500/40 text-orange-400" },
    Medium: { badge: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" },
    Low: { badge: "bg-slate-700/40 border-slate-600/50 text-slate-300" },
  };

  // Status styling for the Compliance Impact Assessment card
  const complianceStatusStyles: Record<ComplianceStatus, { badge: string; dot: string; ring: string }> = {
    "Compliant": { badge: "bg-success/15 border-success/40 text-success", dot: "bg-success", ring: "oklch(0.72 0.18 158)" },
    "At Risk": { badge: "bg-yellow-500/15 border-yellow-500/40 text-yellow-400", dot: "bg-yellow-400", ring: "oklch(0.78 0.16 75)" },
    "Non-Compliant": { badge: "bg-red-500/15 border-red-500/40 text-red-400", dot: "bg-red-400", ring: "oklch(0.64 0.25 22)" },
  };
  const overallComplianceStyle = complianceStatusStyles[compliance.overallPosture];

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

        {/* ZOMBIE ACCOUNT DETECTION — high-visibility card, only renders when the condition is true */}
        {zombie.isZombie && (
          <section className={`relative overflow-hidden rounded-2xl border-2 ${zStyle.border} ${zStyle.glow} bg-slate-950/80 backdrop-blur-sm`}>
            {/* subtle animated background pulse */}
            <div className="absolute inset-0 bg-linear-to-br from-red-500/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative p-6">
              {/* Banner row */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${zStyle.iconBg} border ${zStyle.border} animate-pulse-glow`}>
                    <Skull className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-white">
                        🚨 ZOMBIE ACCOUNT DETECTED
                      </h3>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${zStyle.badgeBg} ${zStyle.badgeText}`}>
                        {zombie.severity} Severity
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">
                      Terminated employee retains active cloud privileges and identity access
                      {zombie.daysSinceTermination !== null ? ` — terminated ${zombie.daysSinceTermination} days ago.` : "."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Evidence */}
                <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" /> Evidence
                  </div>
                  <ul className="space-y-2 text-xs font-mono">
                    {zombie.evidence.map((item) => (
                      <li key={item.label} className="flex items-center gap-2">
                        {item.isFlag ? (
                          <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                        )}
                        <span className="text-slate-300">{item.label}:</span>
                        <span className={item.isFlag ? "text-red-400 font-semibold" : "text-success font-semibold"}>{item.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Why this matters */}
                <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Why This Matters
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">
                    This employee left the organization
                    {zombie.daysSinceTermination !== null ? ` ${zombie.daysSinceTermination} days ago` : ""} but still maintains
                    active access to {[
                      zombie.awsActive && "cloud infrastructure",
                      zombie.oktaActive && "enterprise applications",
                      zombie.hasAdminPrivilege && "administrator-level controls",
                    ].filter(Boolean).join(", ") || "enterprise systems"}.
                    This creates a significant risk of unauthorized access, privilege abuse, and data exposure.
                  </p>
                </div>
              </div>

              {/* Recommended actions */}
              <div className="mt-5 rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" /> Recommended Actions
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  {zombie.remediation.map((action) => (
                    <li key={action} className="flex items-start gap-2 text-slate-300">
                      <Zap className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

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

        {/* CROSS-PLATFORM IDENTITY CONSISTENCY ANALYSIS */}
        <section className="glass rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <GitCompareArrows className="h-4 w-4 text-primary" /> Cross-Platform Identity Consistency Analysis
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Detects lifecycle mismatches between HR offboarding status and downstream identity systems</p>
            </div>
            <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${cStyle.badgeBg} ${cStyle.badgeText}`}>
              <span>{cStyle.icon}</span> {consistency.verdict}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
            {/* Platform comparison table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800/80">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-900/60 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2.5 font-semibold">System</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Alignment</th>
                  </tr>
                </thead>
                <tbody>
                  {consistency.comparisonRows.map((row) => (
                    <tr key={row.system} className="border-t border-slate-800/60">
                      <td className="px-4 py-2.5 font-semibold text-foreground">{row.system}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-300">{row.status}</td>
                      <td className="px-4 py-2.5">
                        {row.isExpectedState ? (
                          <span className="inline-flex items-center gap-1 text-success font-semibold"><CheckCircle2 className="h-3 w-3" /> Aligned</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-400 font-semibold"><XCircle className="h-3 w-3" /> Mismatch</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Consistency score gauge */}
            <div className="relative grid place-items-center rounded-2xl glass-strong w-32 h-32 mx-auto lg:mx-0 shrink-0">
              <svg viewBox="0 0 100 100" className="absolute inset-0">
                <circle cx="50" cy="50" r="42" stroke="oklch(0.3 0.03 260)" strokeWidth="8" fill="none" />
                <circle
                  cx="50" cy="50" r="42"
                  stroke={cStyle.ring}
                  strokeWidth="8" fill="none" strokeLinecap="round"
                  strokeDasharray={`${(consistency.consistencyScore / 100) * 264} 264`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="relative text-center">
                <div className="font-display text-2xl font-bold text-foreground tabular-nums">{consistency.consistencyScore}%</div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Consistency</div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Findings */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5" /> Findings
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {consistency.findings.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-primary">•</span>{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Impact */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Impact
              </div>
              <p className="text-xs leading-relaxed text-slate-300">{consistency.impactStatement}</p>
            </div>
          </div>

          {/* Remediation */}
          <div className="mt-5 rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" /> Recommended Remediation
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              {consistency.remediation.map((action) => (
                <li key={action} className="flex items-start gap-2 text-slate-300">
                  <Zap className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* MITRE ATT&CK COVERAGE */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-primary" /> MITRE ATT&amp;CK Coverage
            </h3>
            <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              {mitreTechniques.length} technique{mitreTechniques.length === 1 ? "" : "s"} mapped
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Detected identity threats mapped to industry-standard adversary techniques</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mitreTechniques.map((t) => (
              <div key={t.techniqueId} className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/15 border border-primary/30 px-2 py-0.5 text-[11px] font-mono font-bold text-primary">
                      {t.techniqueId}
                    </span>
                    <span className="font-semibold text-sm text-foreground">{t.techniqueName}</span>
                  </div>
                  <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${mitreSeverityStyles[t.severity].badge}`}>
                    {t.severity}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300 mb-2">{t.description}</p>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Triggered by: <span className="text-slate-400 font-medium normal-case">{t.triggeredBy}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COMPLIANCE IMPACT ASSESSMENT */}
        <section className="glass rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-primary" /> Compliance Impact Assessment
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Regulatory and framework exposure derived from this identity's risk posture</p>
            </div>
            <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${overallComplianceStyle.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${overallComplianceStyle.dot}`} />
              Overall Posture: {compliance.overallPosture}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-900/60 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 font-semibold">Framework</th>
                  <th className="px-4 py-2.5 font-semibold">Control</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold">Risk Impact</th>
                </tr>
              </thead>
              <tbody>
                {compliance.rows.map((row) => {
                  const rowStyle = complianceStatusStyles[row.status];
                  return (
                    <tr key={`${row.framework}-${row.control}`} className="border-t border-slate-800/60">
                      <td className="px-4 py-2.5 font-medium text-slate-300">{row.framework}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono font-semibold text-foreground">{row.control}</span>
                        <span className="block text-[10px] text-muted-foreground">{row.controlName}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold ${rowStyle.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${rowStyle.dot}`} />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">{row.riskImpact}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* IDENTITY LIFECYCLE TIMELINE */}
        {profile && (
          <section className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold mb-1 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Identity Lifecycle Timeline
            </h3>
            <p className="text-xs text-muted-foreground mb-6">Complete sequence of events that escalated this identity's risk profile</p>

            <div className="relative space-y-4">
              {/* Timeline vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-linear-to-b from-primary via-yellow-500 to-red-500" />

              {/* Timeline events */}
              {timelineEvents.map((event, idx) => {
                const severityColors = {
                  normal: "border-l-4 border-success bg-success/5",
                  warning: "border-l-4 border-yellow-500 bg-yellow-500/5",
                  critical: "border-l-4 border-red-500 bg-red-500/5",
                  escalation: "border-l-4 border-purple-500 bg-purple-500/5",
                };

                const iconColors = {
                  normal: "bg-success/20 text-success",
                  warning: "bg-yellow-500/20 text-yellow-400",
                  critical: "bg-red-500/20 text-red-400",
                  escalation: "bg-purple-500/20 text-purple-400",
                };

                return (
                  <div key={idx} className="relative pl-16 pb-2">
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-1 w-12 h-12 rounded-full flex items-center justify-center ${iconColors[event.severity]} border-4 border-slate-950`}>
                      {event.icon}
                    </div>

                    {/* Timeline card */}
                    <div className={`rounded-lg p-4 ${severityColors[event.severity]}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-mono font-semibold text-primary uppercase">
                              {event.daysAgo === 0 ? "Today" : `${event.daysAgo} days ago`}
                            </span>
                          </div>
                          <h4 className="font-semibold text-foreground mb-1">{event.label}</h4>
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* AI POSTURE TRIAGE SUMMARY */}
        <section className="grid grid-cols-1 gap-6 auto-rows-max">
          <div className="glass-strong rounded-2xl p-6 neon-border">
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
        </section>

        {/* EXECUTIVE REMEDIATION CENTER */}
        <section className="glass-strong rounded-2xl p-6 border border-primary/30">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-(--gradient-primary) glow-primary">
                  <Zap className="h-3.5 w-3.5 text-primary-foreground" />
                </span>
                Executive Remediation Center
              </h3>
              <p className="text-xs text-muted-foreground mt-1 ml-9">Detect + Respond — actionable remediation guidance for this identity</p>
            </div>
            <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              Response Ready
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-6">
            {/* LEFT COLUMN: Priority Actions + Timeline */}
            <div className="space-y-5">
              {/* Priority Actions */}
              <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5" /> Priority Actions
                </div>
                <ul className="space-y-2">
                  {remediationCenter.priorityActions.map((action) => (
                    <li key={action.label} className="flex items-center gap-2.5 text-xs">
                      <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${priorityStyles[action.priority].badge}`}>
                        {action.priority}
                      </span>
                      <span className="text-slate-200 font-medium">{action.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Remediation Timeline */}
              <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Remediation Timeline
                </div>
                <div className="space-y-3">
                  {remediationCenter.timeline.map((phase) => (
                    <div key={phase.phase} className="flex gap-3">
                      <div className="shrink-0 w-28 text-[10px] font-mono font-semibold text-primary pt-0.5">{phase.phase}</div>
                      <ul className="flex-1 space-y-1 border-l border-slate-800 pl-3">
                        {phase.actions.map((a) => (
                          <li key={a} className="text-xs text-slate-300 flex gap-1.5">
                            <span className="text-primary">›</span>{a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Risk Reduction + Business Impact + Buttons */}
            <div className="space-y-5">
              {/* Estimated Risk Reduction */}
              <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> Estimated Risk Reduction
                </div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-400">Current Risk Score</span>
                  <span className="font-mono font-bold text-red-400">{remediationCenter.currentRiskScore}</span>
                </div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-slate-400">After Remediation</span>
                  <span className="font-mono font-bold text-success">{remediationCenter.projectedRiskScore}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                  <div
                    className="h-full bg-linear-to-r from-success to-primary rounded-full"
                    style={{ width: `${remediationCenter.riskReductionPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Risk Reduction</span>
                  <span className="text-sm font-display font-bold text-success">{remediationCenter.riskReductionPercent}%</span>
                </div>
              </div>

              {/* Business Impact: Before / After */}
              <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" /> Business Impact Reduction
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-2">Before</div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {remediationCenter.businessImpactBefore.map((b) => (
                        <li key={b} className="flex gap-1.5"><XCircle className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-success font-semibold mb-2">After</div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {remediationCenter.businessImpactAfter.map((a) => (
                        <li key={a} className="flex gap-1.5"><CheckCircle2 className="h-3 w-3 text-success shrink-0 mt-0.5" />{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => alert(`SOC Ticket generated for ${profile.employeeId} (${profile.name}). Severity: ${profile.riskCategory}.`)}
                  className="rounded-lg bg-primary/15 border border-primary/40 py-2.5 px-3 text-xs font-semibold text-primary hover:bg-primary/25 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Activity className="h-3.5 w-3.5" /> Generate SOC Ticket
                </button>
                <button
                  onClick={() => alert(`Incident report exported for ${profile.employeeId}.`)}
                  className="rounded-lg bg-slate-800/60 border border-slate-700 py-2.5 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Export Incident Report
                </button>
                <button
                  onClick={() => alert(`Remediation plan downloaded for ${profile.employeeId}.`)}
                  className="rounded-lg bg-slate-800/60 border border-slate-700 py-2.5 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="h-3.5 w-3.5" /> Download Remediation Plan
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* AI SECURITY ANALYST */}
        <section className="glass-strong rounded-2xl p-6 border border-primary/30">
          <div className="flex items-center gap-3 mb-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-(--gradient-primary) glow-primary">
              <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
            </span>
            <h3 className="font-display text-lg font-bold text-foreground">AI Security Analyst</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Ask the AI analyst to generate executive summaries, incident reports, remediation plans, compliance findings, and investigation guidance.
          </p>
          <button
            type="button"
            onClick={() => alert("AI Analyst integration coming soon")}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-sky-400 px-6 text-lg font-bold text-white shadow-[0_0_32px_-4px_rgba(56,189,248,0.65)] transition-colors hover:bg-sky-300"
            style={{ height: "56px" }}
          >
            <Sparkles className="h-5 w-5" />
            Generate with AI Analyst
          </button>
        </section>

        {/* EXECUTIVE IMPACT SUMMARY */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 auto-rows-max">
          <div className="glass rounded-2xl p-6 flex flex-col h-full xl:col-start-3">
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
          </div>
        </section>
      </main>
    </>
  );
}