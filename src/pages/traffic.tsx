import { CameraFeed } from "@/components/CameraFeed";
import { CityMap } from "@/components/CityMap";
import { GlassPanel } from "@/components/GlassPanel";
import { AppLayout } from "@/components/layout/AppLayout";
import { getTrafficDensityByCount, useLiveIntersections, useLiveLaneDensity, useLiveSimVehicles, useLiveTrafficHistory, useLiveVehicleCounts } from "@/hooks/use-smartflow";
import { cn, formatNumber } from "@/lib/utils";
import { Bike, Bus, CarFront, Map, Maximize2, Truck } from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function Traffic() {
  const [showExpandedMap, setShowExpandedMap] = useState(false);
  const { data: counts } = useLiveVehicleCounts();
  const { data: laneData } = useLiveLaneDensity();
  const { data: history } = useLiveTrafficHistory();
  const { data: mapData } = useLiveIntersections();
  const { data: simVehicles = [] } = useLiveSimVehicles();
  const simDensity = getTrafficDensityByCount(simVehicles.length);

  const densityClass =
    simDensity.level === "low"
      ? "bg-success/10 text-success border-success/30"
      : simDensity.level === "medium"
        ? "bg-warning/10 text-warning border-warning/30"
        : "bg-destructive/10 text-destructive border-destructive/30";

  const countCards = [
    { label: "CARS", value: counts?.cars || 0, icon: CarFront, color: "text-primary" },
    { label: "BUSES", value: counts?.buses || 0, icon: Bus, color: "text-warning" },
    { label: "TRUCKS", value: counts?.trucks || 0, icon: Truck, color: "text-destructive" },
    { label: "BIKES", value: counts?.bikes || 0, icon: Bike, color: "text-success" },
  ];

  return (
    <AppLayout>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">LIVE TRAFFIC</h1>
          <p className="text-muted-foreground font-mono text-sm">AI SURVEILLANCE & VEHICLE CLASSIFICATION</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full text-xs font-mono text-primary">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          AI VISION ACTIVE
        </div>
      </div>

      {/* Live SUMO Traffic Map - Full Width */}
      <GlassPanel className="p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-display font-semibold flex items-center gap-2">
            <Map className="w-4 h-4 text-primary" />
            LIVE TRAFFIC NETWORK
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted-foreground">
              VEHICLES: {simVehicles.length}
            </span>
            <span className={cn("text-[10px] font-mono px-2 py-1 rounded border", densityClass)}>
              {simDensity.label}
            </span>
            <button
              onClick={() => setShowExpandedMap(!showExpandedMap)}
              className="text-xs font-mono text-primary flex items-center hover:text-white transition-colors"
            >
              {showExpandedMap ? "COLLAPSE" : "EXPAND"}
              <Maximize2 className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>
        <div className={cn("transition-all duration-300", showExpandedMap ? "h-[800px]" : "h-[400px]")}>
          <div className="w-full h-full flex items-center justify-center">
            <CityMap
              intersections={mapData?.intersections || []}
              roads={mapData?.roads || []}
              vehicles={simVehicles}
            />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-4 text-xs font-mono">
          <div className="text-center">
            <div className="text-muted-foreground mb-1">INTERSECTIONS</div>
            <div className="text-lg font-display font-bold text-primary">{mapData?.intersections?.length || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground mb-1">ROAD SEGMENTS</div>
            <div className="text-lg font-display font-bold text-primary">{mapData?.roads?.length || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground mb-1">ACTIVE VEHICLES</div>
            <div className="text-lg font-display font-bold text-warning">{simVehicles.length}</div>
          </div>
        </div>
      </GlassPanel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Camera Feed & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <GlassPanel className="p-1">
            <CameraFeed
              name="NODE-ALPHA (DOWNTOWN)"
              density="medium"
              simulateMovement={true}
              fps={24}
              className="w-full aspect-video rounded-lg"
            />
          </GlassPanel>

          {/* Density Chart */}
          <GlassPanel className="p-6">
            <h2 className="text-lg font-display font-semibold mb-6 flex items-center gap-2">
              <LineChart className="w-4 h-4 text-primary" />
              THROUGHPUT ANALYSIS
            </h2>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(val) => String(val)}
                    tickLine={false}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="vehicles"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>
        </div>

        {/* Side Panels */}
        <div className="space-y-6">
          {/* Classification Stats */}
          <GlassPanel className="p-6">
            <h2 className="text-lg font-display font-semibold mb-6 text-white/90">VEHICLE CLASSIFICATION</h2>
            <div className="grid grid-cols-2 gap-4">
              {countCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="bg-black/40 border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Icon className={cn("w-6 h-6 mb-2", card.color)} />
                    <div className="text-2xl font-display font-bold">{formatNumber(card.value)}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-1">{card.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-sm font-mono text-muted-foreground">TOTAL DETECTED</span>
              <span className="text-xl font-display font-bold text-primary text-glow">{formatNumber(counts?.total || 0)}</span>
            </div>
          </GlassPanel>

          {/* Lane Density */}
          <GlassPanel className="p-6">
            <h2 className="text-lg font-display font-semibold mb-6 text-white/90">LANE DENSITY</h2>
            <div className="space-y-4">
              {(laneData?.lanes || []).map((lane) => {
                const getColors = (d: string) => {
                  if (d === 'high') return 'bg-destructive shadow-[0_0_10px_rgba(255,42,42,0.5)]';
                  if (d === 'medium') return 'bg-warning shadow-[0_0_10px_rgba(255,184,0,0.5)]';
                  return 'bg-success shadow-[0_0_10px_rgba(0,255,136,0.5)]';
                };
                const getWidth = (speed: number) => {
                   return Math.min(100, Math.max(10, (speed / 80) * 100)) + '%';
                };

                return (
                  <div key={lane.id}>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm font-medium">{lane.name}</span>
                      <span className="text-xs font-mono text-muted-foreground">{lane.speed} km/h</span>
                    </div>
                    <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-1000", getColors(lane.density))}
                        style={{ width: getWidth(lane.speed) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        </div>
      </div>
    </AppLayout>
  );
}
