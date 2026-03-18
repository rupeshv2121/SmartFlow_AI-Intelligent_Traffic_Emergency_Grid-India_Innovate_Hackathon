import { GlassPanel } from "@/components/GlassPanel";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLiveCongestionAnalytics, useLiveIntersections, useLiveSimVehicles } from "@/hooks/use-smartflow";
import { cn } from "@/lib/utils";
import { Database, Filter } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function Analytics() {
  const { data } = useLiveCongestionAnalytics();
  const { data: mapData } = useLiveIntersections();
  const { data: simVehicles = [] } = useLiveSimVehicles();

  return (
    <AppLayout>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">SYSTEM ANALYTICS</h1>
          <p className="text-muted-foreground font-mono text-sm">HISTORICAL DATA & TREND PREDICTION</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-md text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer">
          <Filter className="w-4 h-4" /> Filter Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <GlassPanel className="p-6">
          <h2 className="text-lg font-display font-semibold mb-6 text-white/90">HOURLY CONGESTION TREND</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.hourlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                />
                <Line type="monotone" dataKey="congestion" stroke="hsl(var(--warning))" strokeWidth={3} dot={{ fill: 'hsl(var(--warning))', r: 4 }} name="Congestion Index" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h2 className="text-lg font-display font-semibold mb-6 text-white/90">NODE COMPARISON</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="intersection" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  cursor={{ fill: 'hsl(var(--white)/0.05)' }}
                />
                <Bar dataKey="vehicles" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Vehicles/hr" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="p-6">
        <h2 className="text-lg font-display font-semibold mb-6 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          RAW NODE DATA EXPORT
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs font-mono text-muted-foreground border-b border-border">
              <tr>
                <th className="pb-3 font-medium">NODE NAME</th>
                <th className="pb-3 font-medium">CONGESTION IDX</th>
                <th className="pb-3 font-medium">VEHICLE COUNT</th>
                <th className="pb-3 font-medium">AVG SPEED</th>
                <th className="pb-3 font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data || []).map((node, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                  <td className="py-3 font-medium text-white/90">{node.intersection}</td>
                  <td className="py-3 font-mono">{node.congestion}</td>
                  <td className="py-3 font-mono text-primary">{node.vehicles}</td>
                  <td className="py-3 font-mono">{node.avgSpeed} km/h</td>
                  <td className="py-3">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-mono",
                      node.congestion > 80 ? "bg-destructive/20 text-destructive" :
                      node.congestion > 50 ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
                    )}>
                      {node.congestion > 80 ? 'CRITICAL' : node.congestion > 50 ? 'ELEVATED' : 'NOMINAL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </AppLayout>
  );
}
