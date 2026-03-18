import { GlassPanel } from "@/components/GlassPanel";
import { AppLayout } from "@/components/layout/AppLayout";
import { TrafficLight } from "@/components/TrafficLight";
import { useLiveCongestionAnalytics, useLiveIntersections, useLiveSignalTiming, useLiveSimVehicles } from "@/hooks/use-smartflow";
import { cn } from "@/lib/utils";
import { Settings2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from "recharts";

export default function Signals() {
  const { data: signals } = useLiveSignalTiming();
  const { data: analytics } = useLiveCongestionAnalytics();
  const { data: mapData } = useLiveIntersections();
  const { data: simVehicles = [] } = useLiveSimVehicles();

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">SIGNAL OPTIMIZATION</h1>
        <p className="text-muted-foreground font-mono text-sm">ADAPTIVE TRAFFIC LIGHT CONTROL SYSTEMS</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        
        {/* Signal Control Table */}
        <GlassPanel className="xl:col-span-2 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-display font-semibold flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              LIVE INTERSECTION STATUS
            </h2>
            <div className="text-xs font-mono px-2 py-1 bg-white/5 border border-white/10 rounded">
              AUTO-ADAPT: <span className="text-success text-glow-success">ON</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs font-mono text-muted-foreground border-b border-border">
                <tr>
                  <th className="pb-4 font-medium pl-2">NODE</th>
                  <th className="pb-4 font-medium">LIGHT</th>
                  <th className="pb-4 font-medium">LOAD</th>
                  <th className="pb-4 font-medium">GREEN TIME</th>
                  <th className="pb-4 font-medium text-right pr-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(signals?.signals || []).map((sig) => (
                  <tr key={sig.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                    <td className="py-4 pl-2">
                      <div className="font-medium text-white">{sig.intersection}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">ID: {sig.id}</div>
                    </td>
                    <td className="py-4">
                      <TrafficLight phase={sig.currentPhase} size="sm" horizontal />
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                          sig.density === 'high' ? "bg-destructive/20 text-destructive border border-destructive/30" :
                          sig.density === 'medium' ? "bg-warning/20 text-warning border border-warning/30" :
                          "bg-success/20 text-success border border-success/30"
                        )}>
                          {sig.density}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">{sig.vehicles}v</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="w-24 bg-black/50 rounded-full h-1.5 overflow-hidden border border-white/5 relative">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(sig.phaseElapsed / sig.cycleTime) * 100}%` }}
                        />
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-1">
                        {sig.phaseElapsed}s / {sig.cycleTime}s
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <button className="text-xs font-mono bg-white/5 hover:bg-primary/20 text-white hover:text-primary border border-white/10 hover:border-primary/50 transition-all px-3 py-1.5 rounded cursor-pointer">
                        OVERRIDE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>

        {/* Congestion Bar Chart */}
        <GlassPanel className="p-6 flex flex-col">
          <h2 className="text-lg font-display font-semibold mb-6">CONGESTION INDEX</h2>
          <div className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.data || []} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="intersection" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  width={80}
                />
                <RechartsTooltip 
                  cursor={{ fill: 'hsl(var(--white)/0.05)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                />
                <Bar dataKey="congestion" radius={[0, 4, 4, 0]} animationDuration={500}>
                  {(analytics?.data || []).map((entry, index) => {
                    const color = entry.congestion > 80 ? 'hsl(var(--destructive))' : 
                                  entry.congestion > 50 ? 'hsl(var(--warning))' : 'hsl(var(--success))';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

      </div>
    </AppLayout>
  );
}
