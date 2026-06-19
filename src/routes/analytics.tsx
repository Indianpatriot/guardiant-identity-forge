import { createFileRoute } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, Legend } from "recharts";
import { TopBar } from "@/components/top-bar";
import { adminConcentration, privilegeTrend, platformHeatmap } from "@/lib/mock-data";
import { TrendingUp } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Privilege Analytics · IdentityGuard AI" },
      { name: "description", content: "Advanced privilege analytics across departments, platforms and time." },
    ],
  }),
  component: Analytics,
});

const tt = { background: "oklch(0.18 0.025 264)", border: "1px solid oklch(0.32 0.03 260 / 0.6)", borderRadius: 8, fontSize: 12 };

function Analytics() {
  const spread = platformHeatmap.map((p) => ({
    platform: p.platform.replace("Active Directory", "AD").replace("Azure AD", "Azure"),
    risk: p.critical * 4 + p.high * 2 + p.medium,
  }));

  return (
    <>
      <TopBar title="Privilege Analytics" subtitle="Admin concentration, dormant heatmaps, and privilege velocity" />
      <main className="flex-1 px-4 md:px-8 py-6 space-y-6 scrollbar-thin overflow-y-auto">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold mb-1">Admin Concentration by Department</h3>
            <p className="text-xs text-muted-foreground mb-4">Privileged + admin accounts per business unit</p>
            <div className="h-72">
              <ResponsiveContainer><BarChart data={adminConcentration}>
                <CartesianGrid stroke="oklch(0.3 0.03 260 / 0.3)" strokeDasharray="3 3" />
                <XAxis dataKey="department" stroke="oklch(0.65 0.02 256)" fontSize={11} />
                <YAxis stroke="oklch(0.65 0.02 256)" fontSize={11} />
                <Tooltip contentStyle={tt} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="admins" fill="oklch(0.72 0.18 245)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="dormant" fill="oklch(0.78 0.16 75)" radius={[6, 6, 0, 0]} />
              </BarChart></ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold mb-1">Cross-Platform Access Spread</h3>
            <p className="text-xs text-muted-foreground mb-4">Weighted risk index per connected platform</p>
            <div className="h-72">
              <ResponsiveContainer><RadarChart data={spread}>
                <PolarGrid stroke="oklch(0.3 0.03 260 / 0.5)" />
                <PolarAngleAxis dataKey="platform" stroke="oklch(0.75 0.02 256)" fontSize={11} />
                <PolarRadiusAxis stroke="oklch(0.45 0.03 256)" fontSize={9} />
                <Radar name="Risk Index" dataKey="risk" stroke="oklch(0.62 0.22 295)" fill="oklch(0.62 0.22 295)" fillOpacity={0.4} />
                <Tooltip contentStyle={tt} />
              </RadarChart></ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 xl:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display text-lg font-bold">Privilege Growth Velocity</h3>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-success"><TrendingUp className="h-3 w-3" /> +12% privileged accounts YoY</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">12-month trend · privileged, admin and dormant identities</p>
            <div className="h-80">
              <ResponsiveContainer><LineChart data={privilegeTrend}>
                <CartesianGrid stroke="oklch(0.3 0.03 260 / 0.3)" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="oklch(0.65 0.02 256)" fontSize={11} />
                <YAxis stroke="oklch(0.65 0.02 256)" fontSize={11} />
                <Tooltip contentStyle={tt} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="privileged" stroke="oklch(0.72 0.18 245)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="admins" stroke="oklch(0.62 0.22 295)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="dormant" stroke="oklch(0.78 0.16 75)" strokeWidth={2.5} dot={false} strokeDasharray="4 4" />
              </LineChart></ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 xl:col-span-2">
            <h3 className="font-display text-lg font-bold mb-1">Dormant Privilege Heatmap</h3>
            <p className="text-xs text-muted-foreground mb-4">Last-activity buckets vs platform · darker = more dormant privilege</p>
            <div className="grid grid-cols-[140px_repeat(6,1fr)] gap-1.5 text-[10px]">
              <div />
              {["<7d","7–30d","30–60d","60–90d","90–180d","180d+"].map((b) => <div key={b} className="text-center text-muted-foreground uppercase tracking-wider py-1">{b}</div>)}
              {platformHeatmap.map((p, ri) => (
                <div key={p.platform} className="contents">
                  <div className="text-muted-foreground py-2 font-semibold">{p.platform}</div>
                  {Array.from({ length: 6 }).map((_, ci) => {
                    const v = ((ri * 7 + ci * 11) % 100);
                    const intensity = v / 100;
                    return (
                      <div key={ci} className="h-10 rounded-md grid place-items-center font-mono text-foreground"
                        style={{ background: `oklch(${0.22 + (1 - intensity) * 0.1} ${0.05 + intensity * 0.2} ${280 - intensity * 50} / ${0.4 + intensity * 0.6})`, border: `1px solid oklch(0.4 0.05 260 / ${intensity})` }}>
                        {v}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
