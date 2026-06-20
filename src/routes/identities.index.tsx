import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, Filter, ArrowUpDown, ChevronRight } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { RiskBadge, StatusBadge, RiskScoreBar } from "@/components/badges";
import { type RiskCategory } from "@/lib/mock-data";
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

interface RiskLedgerRecord {
  employee_id: string;
  full_name: string;
  department: string;
  employment_status: string;
  risk_score: number;
  risk_tier: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  risk_analysis_narrative: string;
}

interface JoinedIdentity {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  status: string;
  riskScore: number;
  riskCategory: RiskCategory;
}

const cats: (RiskCategory | "All")[] = ["All", "Critical", "High", "Medium", "Low"];

function Registry() {
  const [identitiesList, setIdentitiesList] = useState<JoinedIdentity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<RiskCategory | "All">("All");
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    async function loadAndJoinRegistryData() {
      try {
        const [employeesResponse, ledgerResponse] = await Promise.all([
          fetch("/data/employees.json"),
          fetch("/data/identity_risk_ledger.json"),
        ]);

        if (employeesResponse.ok && ledgerResponse.ok) {
          const employeesData: EmployeeRecord[] = await employeesResponse.json();
          const ledgerData: RiskLedgerRecord[] = await ledgerResponse.json();

          const ledgerMap = new Map<string, RiskLedgerRecord>(
            ledgerData.map((item) => [item.employee_id, item])
          );

          const joinedData: JoinedIdentity[] = employeesData.map((emp) => {
            const riskInfo = ledgerMap.get(emp.employee_id);
            
            const rawTier = (riskInfo?.risk_tier || "LOW").toUpperCase();
            let formattedTier: RiskCategory = "Low";
            if (rawTier === "CRITICAL") formattedTier = "Critical";
            else if (rawTier === "HIGH") formattedTier = "High";
            else if (rawTier === "MEDIUM") formattedTier = "Medium";

            return {
              id: emp.employee_id,
              employeeId: emp.employee_id,
              name: emp.full_name,
              department: emp.department,
              status: emp.employment_status,
              riskScore: riskInfo ? riskInfo.risk_score : 0,
              riskCategory: formattedTier,
            };
          });

          setIdentitiesList(joinedData);
        }
      } catch (error) {
        console.error("System engine failed to resolve hybrid runtime identity maps:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAndJoinRegistryData();
  }, []);

  const filtered = useMemo(() => {
    let list = identitiesList;
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
  }, [identitiesList, q, cat, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <TopBar title="Identity Risk Registry" subtitle={`${filtered.length.toLocaleString()} identities · search, filter, investigate`} />
      <main className="flex-1 px-4 md:px-8 py-6 space-y-4 scrollbar-thin overflow-y-auto">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl glass px-3 py-2 flex-1 min-w-60">
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
                  <th className="text-left px-4 py-3 font-semibold">Risk Score</th>
                  <th className="text-left px-4 py-3 font-semibold">Employee Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Department</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Risk Tier</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center text-xs font-mono py-8 text-muted-foreground">
                      PARSING HYBRID CORE REGISTRY FILES...
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr key={row.id} className="border-t border-border/40 hover:bg-accent/40 transition-colors group">
                      <td className="px-4 py-3"><RiskScoreBar score={row.riskScore} /></td>
                      <td className="px-4 py-3">
                        <Link to="/identities/$id" params={{ id: row.id }} className="block">
                          <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{row.name}</div>
                          <div className="text-[11px] font-mono text-muted-foreground">{row.employeeId}</div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-foreground">{row.department}</td>
                      {/* Fixed: Capitalized "Active" and "Disabled" to perfectly align with badges.tsx types */}
                      <td className="px-4 py-3"><StatusBadge status={row.status === "Active" ? "Active" : "Disabled"} /></td>
                      <td className="px-4 py-3"><RiskBadge category={row.riskCategory} /></td>
                      <td className="px-2">
                        <Link to="/identities/$id" params={{ id: row.id }} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary">
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
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