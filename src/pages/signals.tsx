import { GlassPanel } from "@/components/GlassPanel";
import { AppLayout } from "@/components/layout/AppLayout";
import { TrafficLight } from "@/components/TrafficLight";
import { useTrafficSim } from "@/context/TrafficSimContext";
import { useLiveCongestionAnalytics } from "@/hooks/use-smartflow";
import { cn } from "@/lib/utils";
import { AlertTriangle, BarChart3, Clock, Settings2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis, YAxis } from "recharts";

export default function Signals() {
  const { state } = useTrafficSim();
  const { data: analytics } = useLiveCongestionAnalytics();

  // Transform simulation data to match signal display format
  const liveSignals = state.roads.map((road, index) => {
    // Unified density/congestion thresholds
    const density = road.detectionCount >= 15 ? 'high' : road.detectionCount >= 8 ? 'medium' : 'low';
    const congestion = Math.round((road.detectionCount / 20) * 100); // Normalize to 0-100% based on max 20 vehicles

    // Calculate cycle time (total time for complete signal cycle)
    const cycleTime = state.signalController.activeRoadIndex === index
      ? (state.signalController.phase === 'green' ? state.signalController.timeLeft + 3 : state.signalController.timeLeft)
      : road.signalTimeLeft;

    // Phase elapsed (time in current phase)
    const phaseElapsed = state.signalController.activeRoadIndex === index
      ? (state.signalController.phase === 'green' ? 25 - state.signalController.timeLeft : 3 - state.signalController.timeLeft)
      : 0;

    // Calculate queue length (vehicles waiting)
    const queueLength = road.vehicles.filter(v => !v.isOutgoing && v.progress < 0.85).length;

    return {
      id: road.id,
      road: road.label,
      signal: road.signal,
      vehicles: road.detectionCount,
      density,
      congestion,
      signalTimeLeft: road.signalTimeLeft,
      cycleTime: Math.round(cycleTime),
      phaseElapsed: Math.round(phaseElapsed),
      ambulanceDetected: road.ambulanceDetected,
      waitingTime: Math.round(road.waitingTime),
      queueLength,
      throughput: road.vehicleCount,
    };
  });

  // Calculate overall intersection metrics
  const totalVehicles = state.roads.reduce((sum, road) => sum + road.detectionCount, 0);
  const avgWaitTime = state.roads.reduce((sum, road) => sum + road.waitingTime, 0) / state.roads.length;
  const emergencyRoads = state.roads.filter(road => road.ambulanceDetected).length;
  const activeRoad = state.roads[state.signalController.activeRoadIndex];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">SIGNAL OPTIMIZATION</h1>
        <p className="text-muted-foreground font-mono text-sm">ADAPTIVE TRAFFIC LIGHT CONTROL SYSTEMS - LIVE CAMERA SYNC</p>
      </div>

      {/* Real-time Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <GlassPanel className="p-4">
          <div className="text-xs text-muted-foreground font-mono mb-1">TOTAL VEHICLES</div>
          <div className="text-2xl font-display font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            {totalVehicles}
          </div>
        </GlassPanel>

        <GlassPanel className="p-4">
          <div className="text-xs text-muted-foreground font-mono mb-1">AVG WAIT TIME</div>
          <div className="text-2xl font-display font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            {Math.round(avgWaitTime)}s
          </div>
        </GlassPanel>

        <GlassPanel className="p-4">
          <div className="text-xs text-muted-foreground font-mono mb-1">ACTIVE ROAD</div>
          <div className="text-2xl font-display font-bold flex items-center gap-2 text-success">
            <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
            {activeRoad?.label}
          </div>
        </GlassPanel>

        <GlassPanel className="p-4">
          <div className="text-xs text-muted-foreground font-mono mb-1">EMERGENCY ALERTS</div>
          <div className="text-2xl font-display font-bold flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            {emergencyRoads}
          </div>
        </GlassPanel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

        {/* Signal Control Table - Synced with Live Camera Feeds */}
        <GlassPanel className="xl:col-span-2 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-display font-semibold flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              LIVE INTERSECTION STATUS
              <span className="text-xs font-mono text-primary/80">(CAMERA SYNC)</span>
            </h2>
            <div className="text-xs font-mono px-2 py-1 bg-white/5 border border-white/10 rounded">
              AUTO-ADAPT: <span className="text-success text-glow-success">ON</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs font-mono text-muted-foreground border-b border-border">
                <tr>
                  <th className="pb-4 font-medium pl-2">ROAD</th>
                  <th className="pb-4 font-medium">LIGHT</th>
                  <th className="pb-4 font-medium">VEHICLES</th>
                  <th className="pb-4 font-medium">SIGNAL TIME</th>
                  <th className="pb-4 font-medium">WAIT TIME</th>
                  <th className="pb-4 font-medium">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {liveSignals.map((sig) => (
                  <tr key={sig.id} className={cn(
                    "border-b border-border/30 hover:bg-white/5 transition-colors",
                    sig.signal === 'green' && "bg-success/5"
                  )}>
                    <td className="py-5 pl-2">
                      <div className="font-medium text-white flex items-center gap-2">
                        {sig.road}
                        {sig.signal === 'green' && (
                          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        Throughput: {sig.throughput}v
                      </div>
                    </td>
                    <td className="py-5 pr-4">
                      <TrafficLight
                        phase={sig.signal}
                        size="xs"
                        horizontal
                        className="rounded-lg mr-2"
                      />
                    </td>
                    <td className="py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white font-mono font-bold">{sig.vehicles}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                          sig.congestion > 75 ? "bg-destructive/20 text-destructive border border-destructive/30" :
                          sig.congestion > 40 ? "bg-warning/20 text-warning border border-warning/30" :
                          "bg-success/20 text-success border border-success/30"
                        )}>
                          {sig.density}
                        </span>
                      </div>
                    </td>
                    <td className="py-5">
                      <div className="space-y-1">
                        <div className={cn(
                          "text-xs font-mono font-bold",
                          sig.signal === 'green' ? "text-success" :
                          sig.signal === 'yellow' ? "text-warning" : "text-destructive"
                        )}>
                          {sig.signal === 'green' ? 'TO RED' :
                           sig.signal === 'yellow' ? 'TO RED' : 'TO GREEN'}: {Math.round(sig.signalTimeLeft)}s
                        </div>
                        {sig.signal === 'green' && (
                          <div className="w-20 bg-black/50 rounded-full h-1 overflow-hidden border border-white/5">
                            <div
                              className="h-full bg-success transition-all"
                              style={{ width: `${(sig.phaseElapsed / sig.cycleTime) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-5">
                      <div className={cn(
                        "text-xs font-mono font-bold",
                        sig.waitingTime > 120 ? "text-destructive" :
                        sig.waitingTime > 60 ? "text-warning" : "text-muted-foreground"
                      )}>
                        {sig.waitingTime}s
                      </div>
                    </td>
                    <td className="py-5">
                      {sig.ambulanceDetected && (
                        <div className="px-2 py-0.5 rounded border border-destructive/50 bg-destructive/20 text-destructive text-[10px] font-mono font-bold flex items-center gap-1 w-[80%]">
                          <AlertTriangle className="w-3 h-3" />
                          EMERGENCY
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signal Controller Info */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">CONTROLLER MODE:</span>
                <span className="text-primary font-bold">ADAPTIVE</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">CURRENT PHASE:</span>
                <span className={cn(
                  "font-bold uppercase",
                  state.signalController.phase === 'green' ? "text-success" : "text-warning"
                )}>
                  {state.signalController.phase}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">PHASE TIME LEFT:</span>
                <span className="text-white font-bold">{Math.round(state.signalController.timeLeft)}s</span>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Congestion Bar Chart */}
        <GlassPanel className="p-6 flex flex-col">
          <h2 className="text-lg font-display font-semibold mb-6">CONGESTION INDEX</h2>
          <div className="flex-1 min-h-87.5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={liveSignals.map(sig => ({
                  road: sig.road,
                  congestion: sig.congestion,
                }))}
                layout="vertical"
                margin={{ top: 0, right: 20, left: -35, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 15" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  label={{
                    value: "Congestion Index (%)",
                    position: "insideBottomRight",
                    offset: -10,
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  dataKey="road"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  label={{
                    value: "Road",
                    angle: -90,
                    position: "insideLeft",
                    offset: -10,
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11,
                  }}
                  width={80}
                />
                <RechartsTooltip
                  cursor={{ fill: 'hsl(var(--white)/0.05)' }}
                  contentStyle={{
                    backgroundColor: 'rgba(15,23,42,0.95)',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontSize: 11 }}
                  formatter={(value) => `${value}% congestion`}
                />
                <Bar dataKey="congestion" radius={[0, 4, 4, 0]} animationDuration={500}>
                  {liveSignals.map((sig, index) => {
                    // Unified color thresholds matching Live Stats: >75% = high, >40% = medium
                    const color = sig.congestion > 75 ? 'hsl(var(--destructive))' :
                                  sig.congestion > 40 ? 'hsl(var(--warning))' : 'hsl(var(--success))';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Live Stats */}
          <div className="mt-4 pt-4 border-t border-border/30 space-y-2">
            <div className="text-[10px] font-mono text-muted-foreground">LIVE CAMERA METRICS</div>
            {liveSignals.map((sig) => (
              <div key={sig.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-mono">{sig.road}</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-mono font-bold",
                    sig.congestion > 75 ? "text-destructive" :
                    sig.congestion > 40 ? "text-warning" : "text-success"
                  )}>
                    {sig.congestion}%
                  </span>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    ({sig.vehicles} vehicles)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

      </div>
    </AppLayout>
  );
}
