import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Filter, ArrowUpDown, ChevronRight } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { RiskBadge, StatusBadge, RiskScoreBar } from "@/components/badges";
import { identities, type RiskCategory } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/identities/")({
  head: () => ({
    meta: [
      { title: "Identity Registry · IdentityGuard AI" },
      { name: "description", content: "Search, filter and investigate every identity across your hybrid enterprise." },
    ],
  }),
  component: Registry,
});

const cats: (RiskCategory | "All")[] = ["All", "Critical", "High", "Medium", "Low"];

function Registry() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<RiskCategory | "All">("All");
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const filtered = useMemo(() => {
    let list = identities;
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((i) =>
        i.name.toLowerCase().includes(s) ||
        i.employeeId.toLowerCase().includes(s) ||
        i.department.toLowerCase().includes(s),
      );
    }
    if (cat !== "All") list = list.filter((i) => i.riskCategory === cat);
    list = [...list].sort((a, b) => sortDesc ? b.riskScore - a.riskScore : a.riskScore - b.riskScore);
    return list;
  }, [q, cat, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <TopBar title="Identity Risk Registry" subtitle={`${filtered.length.toLocaleString()} identities · search, filter, investigate`} />
      <main className="flex-1 px-4 md:px-8 py-6 space-y-4 scrollbar-thin overflow-y-auto">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl glass px-3 py-2 flex-1 min-w-[240px]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search by name, employee ID, or department…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl glass p-1">
            <Filter className="h-3.5 w-3.5 mx-2 text-muted-foreground" />
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => { setCat(c); setPage(1); }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  cat === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >{c}</button>
            ))}
          </div>
          <button onClick={() => setSortDesc((s) => !s)} className="inline-flex items-center gap-2 rounded-xl glass px-3 py-2 text-xs font-semibold text-foreground">
            <ArrowUpDown className="h-3.5 w-3.5" /> Risk {sortDesc ? "High → Low" : "Low → High"}
          </button>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Risk</th>
                  <th className="text-left px-4 py-3 font-semibold">Identity</th>
                  <th className="text-left px-4 py-3 font-semibold">Department</th>
                  <th className="text-left px-4 py-3 font-semibold">AD</th>
                  <th className="text-left px-4 py-3 font-semibold">Azure</th>
                  <th className="text-left px-4 py-3 font-semibold">AWS</th>
                  <th className="text-left px-4 py-3 font-semibold">Okta</th>
                  <th className="text-left px-4 py-3 font-semibold">Privilege</th>
                  <th className="text-left px-4 py-3 font-semibold">Last Login</th>
                  <th className="text-left px-4 py-3 font-semibold">Category</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id} className="border-t border-border/40 hover:bg-accent/40 transition-colors group">
                    <td className="px-4 py-3"><RiskScoreBar score={row.riskScore} /></td>
                    <td className="px-4 py-3">
                      <Link to="/identities/$id" params={{ id: row.id }} className="block">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{row.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">{row.employeeId}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground">{row.department}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.ad} /></td>
                    <td className="px-4 py-3"><StatusBadge status={row.azure} /></td>
                    <td className="px-4 py-3"><StatusBadge status={row.aws} /></td>
                    <td className="px-4 py-3"><StatusBadge status={row.okta} /></td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "rounded-md px-2 py-0.5 text-[11px] font-semibold border",
                        row.privilege === "Super Admin" && "bg-critical/15 text-critical border-critical/30",
                        row.privilege === "Admin" && "bg-warning/15 text-warning border-warning/30",
                        row.privilege === "Privileged" && "bg-secondary/15 text-secondary border-secondary/30",
                        row.privilege === "Standard" && "bg-muted text-muted-foreground border-border",
                      )}>{row.privilege}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{row.lastLogin}</td>
                    <td className="px-4 py-3"><RiskBadge category={row.riskCategory} /></td>
                    <td className="px-2">
                      <Link to="/identities/$id" params={{ id: row.id }} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-xs text-muted-foreground">
            <span>Page {page} of {totalPages} · showing {pageRows.length} of {filtered.length}</span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-border/60 px-3 py-1 text-foreground hover:bg-accent disabled:opacity-40">Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-border/60 px-3 py-1 text-foreground hover:bg-accent disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
