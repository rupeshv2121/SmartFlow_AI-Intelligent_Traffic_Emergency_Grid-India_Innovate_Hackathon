import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/StatCard";
import { GlassPanel } from "@/components/GlassPanel";
import { CityMap } from "@/components/CityMap";
import { 
  Car, 
  MapPin, 
  AlertTriangle, 
  Activity,
  ArrowUpRight,
  Zap
} from "lucide-react";
import { formatNumber, cn } from "@/lib/utils";
import { 
  useLiveDashboardStats, 
  useLiveTrafficHistory, 
  useLiveIntersections,
  useLiveEmergencyEvents 
} from "@/hooks/use-smartflow";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats } = useLiveDashboardStats();
  const { data: history } = useLiveTrafficHistory();
  const { data: mapData } = useLiveIntersections();
  const { data: emergency } = useLiveEmergencyEvents();

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">COMMAND CENTER</h1>
        <p className="text-muted-foreground font-mono text-sm">REAL-TIME CITY TRAFFIC OVERVIEW</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Vehicles" 
          value={formatNumber(stats?.totalVehicles || 0)}
          icon={<Car className="w-6 h-6" />}
          trend={{ value: "12%", isPositive: true }}
          glow="primary"
        />
        <StatCard 
          title="Active Nodes" 
          value={stats?.activeIntersections || 0}
          icon={<MapPin className="w-6 h-6" />}
          glow="secondary"
        />
        <StatCard 
          title="Congested Lanes" 
          value={stats?.congestedLanes || 0}
          icon={<Activity className="w-6 h-6" />}
          trend={{ value: "4%", isPositive: false }}
          glow={(stats?.congestedLanes || 0) > 10 ? "warning" : "none"}
        />
        <StatCard 
          title="Emergency Alerts" 
          value={stats?.emergencyAlerts || 0}
          icon={<AlertTriangle className="w-6 h-6" />}
          glow={(stats?.emergencyAlerts || 0) > 0 ? "destructive" : "none"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Chart */}
        <GlassPanel className="lg:col-span-2 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                NETWORK DENSITY TREND
              </h2>
              <p className="text-xs text-muted-foreground font-mono mt-1">Vehicles per minute across all sectors</p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history?.data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickFormatter={(val) => String(val)}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="vehicles" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorVehicles)" 
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* Live Map Preview */}
        <GlassPanel className="p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-display font-semibold">CITY GRID</h2>
            <button className="text-xs font-mono text-primary flex items-center hover:text-white transition-colors cursor-pointer">
              EXPAND <ArrowUpRight className="w-3 h-3 ml-1" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {mapData ? (
              <CityMap intersections={mapData.intersections} roads={mapData.roads} />
            ) : (
              <div className="animate-pulse w-full aspect-square bg-white/5 rounded-xl border border-white/10" />
            )}
          </div>
        </GlassPanel>
      </div>

      {/* Events Log */}
      <GlassPanel className="p-6">
        <h2 className="text-lg font-display font-semibold mb-6 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          ACTIVE EVENTS LOG
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs font-mono text-muted-foreground border-b border-border">
              <tr>
                <th className="pb-3 font-medium">TIMESTAMP</th>
                <th className="pb-3 font-medium">TYPE</th>
                <th className="pb-3 font-medium">SECTOR / ROUTE</th>
                <th className="pb-3 font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {(emergency?.events || []).slice(0, 5).map((ev) => (
                <tr key={ev.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                  <td className="py-3 font-mono text-muted-foreground">{format(new Date(ev.timestamp), "HH:mm:ss")}</td>
                  <td className="py-3 font-medium">{ev.type}</td>
                  <td className="py-3 text-muted-foreground">{ev.route}</td>
                  <td className="py-3">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-mono border",
                      ev.status === "active" ? "bg-destructive/10 text-destructive border-destructive/20" :
                      ev.status === "completed" ? "bg-success/10 text-success border-success/20" :
                      "bg-muted/50 text-muted-foreground border-border"
                    )}>
                      {ev.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!emergency?.events || emergency.events.length === 0) && (
             <div className="py-8 text-center text-muted-foreground font-mono text-sm">NO ACTIVE EVENTS</div>
          )}
        </div>
      </GlassPanel>
    </AppLayout>
  );
}
