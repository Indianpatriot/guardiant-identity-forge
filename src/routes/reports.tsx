import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/top-bar";
import { FileBarChart, FileText, FileSpreadsheet, Download } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports · IdentityGuard AI" },
      { name: "description", content: "Generate executive, audit, compliance, and risk register reports." },
    ],
  }),
  component: Reports,
});

const reports = [
  { name: "Executive Summary", desc: "Board-ready posture overview with KPIs, trends, and top risks", icon: FileBarChart, period: "Q4 2025" },
  { name: "Audit Report", desc: "Detailed identity changes, privilege grants, and access reviews", icon: FileText, period: "Last 90 days" },
  { name: "Compliance Review", desc: "NIST, CIS, GDPR, ISO mapped controls with evidence", icon: FileBarChart, period: "Continuous" },
  { name: "Risk Register", desc: "Full identity risk inventory with scores, narratives, and remediation", icon: FileSpreadsheet, period: "Current" },
  { name: "Offboarding Audit", desc: "Terminated employees vs platform deprovisioning gaps", icon: FileText, period: "Last 6 months" },
  { name: "Privileged Access Review", desc: "All admin & superuser activity with anomaly flagging", icon: FileBarChart, period: "Monthly" },
];

const recent = [
  { name: "Q3 Executive Summary", date: "Oct 12, 2025", format: "PDF", size: "2.4 MB" },
  { name: "September Audit Report", date: "Oct 03, 2025", format: "PDF", size: "8.1 MB" },
  { name: "Risk Register Snapshot", date: "Sep 28, 2025", format: "Excel", size: "1.2 MB" },
  { name: "GDPR Compliance Review", date: "Sep 15, 2025", format: "PDF", size: "3.7 MB" },
];

function Reports() {
  return (
    <>
      <TopBar title="Reports & Exports" subtitle="Generate downloadable executive, audit and compliance reports" />
      <main className="flex-1 px-4 md:px-8 py-6 space-y-6 scrollbar-thin overflow-y-auto">
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reports.map((r) => {
            const Icon = r.icon;
            return (
              <article key={r.name} className="glass rounded-2xl p-5 hover:-translate-y-0.5 hover:glow-primary transition-all">
                <div className="flex items-start justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--gradient-primary)] glow-primary">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{r.period}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-foreground">{r.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                <div className="mt-5 flex items-center gap-2">
                  <button className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"><Download className="h-3 w-3" /> PDF</button>
                  <button className="rounded-lg glass border-border/60 px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent">CSV</button>
                  <button className="rounded-lg glass border-border/60 px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent">Excel</button>
                </div>
              </article>
            );
          })}
        </section>

        <section className="glass rounded-2xl p-6">
          <h3 className="font-display text-lg font-bold mb-4">Recently Generated</h3>
          <div className="divide-y divide-border/40">
            {recent.map((r) => (
              <div key={r.name} className="flex items-center gap-4 py-3 hover:bg-accent/30 -mx-2 px-2 rounded-lg transition-colors">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted/60">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground">{r.date} · {r.format} · {r.size}</div>
                </div>
                <button className="inline-flex items-center gap-1.5 rounded-lg glass px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent">
                  <Download className="h-3 w-3" /> Download
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
