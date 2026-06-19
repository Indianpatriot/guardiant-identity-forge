import { useState } from "react";
import { Sparkles, X, Send, Bot, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const suggestions = [
  "Why is John Smith risky?",
  "Explain the privilege escalation path",
  "What access should I revoke first?",
  "Generate exec summary for board",
];

interface Msg { role: "user" | "ai"; text: string; report?: boolean }

const sampleReports: Record<string, string> = {
  "Why is John Smith risky?":
    "**Incident Brief · INC-2041**\n\nJohn Smith (EMP-10240) was offboarded 45 days ago, yet retains AdministratorAccess in AWS IAM and an active Okta session.\n\n**Evidence**\n• AD account disabled · HR system reports termination\n• AWS console access in last 7d (us-east-1, us-west-2)\n• 3 long-lived API keys still valid\n• Okta MFA factor never removed\n\n**Risk Score** 96 / 100 — Critical\n\n**Recommended Action**\n1. Revoke all AWS IAM access keys (2 minutes)\n2. Disable Okta account, kill active sessions\n3. Rotate any secrets touched in the last 45d\n4. Open IR case and notify CISO",
  "Explain the privilege escalation path":
    "**Privilege Escalation Path**\n\nJohn Smith → Dev Team (AD group)\n  → Cloud Deployers (Azure AD)\n    → AWS:AdministratorAccess (via federated SSO)\n      → Production S3 Bucket (acme-prod-data)\n\nThree group memberships chain into full prod admin. Inheritance is invisible at the AD layer because the elevation happens in Azure AD role mapping.\n\n**Why this matters**: A single compromised AD credential grants Tier-0 production data access without crossing a single approval boundary.",
  "What access should I revoke first?":
    "**Prioritized Revocation Plan**\n\n1. **AWS IAM AdministratorAccess** — blast radius: prod data\n2. **Okta App Admin** — blast radius: SSO for 47 apps\n3. **Azure AD Subscription Contributor** — blast radius: cloud spend, infra\n4. **Salesforce Standard User** — low risk, batch tomorrow\n\nApply in order. Total time-to-contain: ≈ 4 minutes via automated playbook IG-Revoke-01.",
  "Generate exec summary for board":
    "**Executive Summary — Identity Risk Posture**\n\n• 5,243 identities monitored across 6 platforms\n• 42 critical-risk identities (down 17% MoM)\n• 17 orphaned accounts detected; 12 already remediated this week\n• Risk-reduction achieved: 43% over the quarter\n• Mean time to revoke: 6 minutes (target ≤ 15)\n\nPosture is **strong & improving**. Board-level KPI: Zero unauthorized prod access events in 90 days.",
};

export function AICopilot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "I'm your AI Security Analyst. I can investigate identities, explain escalation paths, and draft remediation plans. Ask me anything." },
  ]);
  const [input, setInput] = useState("");

  function send(text: string) {
    if (!text.trim()) return;
    const reply = sampleReports[text] ?? `**Analysis**\n\nBased on current telemetry across AD, Azure, AWS, Okta, Salesforce and ServiceNow — your query "${text}" maps to 3 active signals. Recommended next step: open the Identity Registry filtered by Critical risk and review the top 5 entries.`;
    setMsgs((m) => [...m, { role: "user", text }, { role: "ai", text: reply, report: true }]);
    setInput("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-[var(--gradient-primary)] px-5 py-3 text-sm font-semibold text-primary-foreground glow-primary hover:scale-105 transition-transform"
      >
        <Sparkles className="h-4 w-4" />
        AI Security Analyst
      </button>

      <div className={cn("fixed inset-0 z-40 transition-opacity", open ? "opacity-100" : "pointer-events-none opacity-0")}>
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <aside className={cn(
          "absolute right-0 top-0 h-full w-full max-w-md glass-strong border-l border-border/60 flex flex-col transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        )}>
          <header className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--gradient-primary)] glow-primary">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-display font-bold text-foreground">AI Security Analyst</div>
                <div className="text-[11px] uppercase tracking-wider text-success flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" /> Online · GPT-Sec v4
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-4">
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex gap-3 animate-fade-up", m.role === "user" && "flex-row-reverse")}>
                <div className={cn("h-7 w-7 shrink-0 rounded-lg grid place-items-center",
                  m.role === "ai" ? "bg-[var(--gradient-primary)]" : "bg-accent")}>
                  {m.role === "ai" ? <Shield className="h-3.5 w-3.5 text-primary-foreground" /> : <span className="text-[10px] font-bold">SA</span>}
                </div>
                <div className={cn(
                  "rounded-xl px-4 py-3 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed",
                  m.role === "ai" ? "glass text-foreground" : "bg-primary/15 border border-primary/30 text-foreground",
                )}>
                  {m.report && (
                    <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-primary">
                      <AlertTriangle className="h-3 w-3" /> Incident Report
                    </div>
                  )}
                  {m.text.split("\n").map((line, j) => {
                    if (line.startsWith("**") && line.endsWith("**")) {
                      return <div key={j} className="font-bold text-foreground mt-2 first:mt-0">{line.slice(2, -2)}</div>;
                    }
                    return <div key={j}>{line}</div>;
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-border/60">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full glass border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                  {s}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 rounded-xl glass border-border/60 px-3 py-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about identity risk…"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              />
              <button type="submit" className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground hover:scale-105 transition">
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
}
