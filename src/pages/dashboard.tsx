import { GlassPanel } from "@/components/GlassPanel";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/StatCard";
import { useTrafficSim } from "@/context/TrafficSimContext";
import {
    useLiveDashboardStats,
    useLiveEmergencyEvents,
    useLiveIntersections,
    useLiveTrafficHistory
} from "@/hooks/use-smartflow";
import { cn, formatNumber } from "@/lib/utils";
import { format } from "date-fns";
import {
    Activity,
    AlertTriangle,
    Car,
    MapPin,
    Zap
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Persistent storage keys
const CHART_STORAGE_KEY = 'traffic-density-history';
const AMBULANCE_TRACKING_KEY = 'ambulance-tracking-history';

export default function Dashboard() {
  const { data: stats } = useLiveDashboardStats();
  const { data: history } = useLiveTrafficHistory();
  const { data: mapData } = useLiveIntersections();
  const { data: emergency } = useLiveEmergencyEvents();
  const { state } = useTrafficSim();

  // Load initial data from sessionStorage to persist across navigation
  const [densityHistory, setDensityHistory] = useState<Array<{ time: string; vehicles: number }>>(() => {
    try {
      const stored = sessionStorage.getItem(CHART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Track ambulances that have passed through (persistent)
  const [ambulanceHistory, setAmbulanceHistory] = useState<Map<string, {
    firstSeen: number;
    lastSeen: number;
    completed: boolean;
    lane: string;
  }>>(() => {
    try {
      const stored = sessionStorage.getItem(AMBULANCE_TRACKING_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert back to Map
        return new Map(Object.entries(parsed).map(([key, val]: [string, any]) => [
          key,
          {
            firstSeen: val.firstSeen,
            lastSeen: val.lastSeen,
            completed: val.completed,
            lane: val.lane,
          }
        ]));
      }
    } catch {
      // ignore
    }
    return new Map();
  });

  const lastUpdateTime = useRef<number>(0);
  const [, forceUpdate] = useState(0); // Force re-render for reactive updates

  // Update ambulance history and chart data
  useEffect(() => {
    const now = Date.now();
    // Update every 1 second for better ambulance tracking
    if (now - lastUpdateTime.current < 1000) return;

    lastUpdateTime.current = now;
    const totalVehicles = state.roads.reduce((sum, road) => sum + road.detectionCount, 0);
    const timeStr = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Update chart only every 2 seconds to avoid overload
    if (now % 2000 < 1000) {
      setDensityHistory(prev => {
        const newData = [...prev, { time: timeStr, vehicles: totalVehicles }];
        const sliced = newData.slice(-10);

        try {
          sessionStorage.setItem(CHART_STORAGE_KEY, JSON.stringify(sliced));
        } catch (e) {
          console.error('Failed to save chart data:', e);
        }

        return sliced;
      });
    }

    // Track ambulances directly from simulation
    const currentAmbulances = new Map<string, { lane: string; progress: number }>();
    state.roads.forEach((road, roadIndex) => {
      road.vehicles.forEach(vehicle => {
        if (vehicle.type === 'ambulance') {
          currentAmbulances.set(vehicle.id, {
            lane: road.label,
            progress: vehicle.progress,
          });
        }
      });
    });

    // Update ambulance history
    setAmbulanceHistory(prevHistory => {
      const newHistory = new Map(prevHistory);
      const now = Date.now();

      // Track all currently visible ambulances
      currentAmbulances.forEach((ambulanceData, ambulanceId) => {
        if (!newHistory.has(ambulanceId)) {
          // New ambulance detected
          newHistory.set(ambulanceId, {
            firstSeen: now,
            lastSeen: now,
            completed: false,
            lane: ambulanceData.lane,
          });
        } else {
          // Update existing ambulance
          const existing = newHistory.get(ambulanceId)!;
          newHistory.set(ambulanceId, {
            ...existing,
            lastSeen: now,
            lane: ambulanceData.lane,
            completed: false, // Still active
          });
        }
      });

      // Mark ambulances as completed if they haven't been seen for 3 seconds
      newHistory.forEach((ambulance, ambulanceId) => {
        if (!ambulance.completed && now - ambulance.lastSeen > 3000) {
          const existing = newHistory.get(ambulanceId)!;
          newHistory.set(ambulanceId, {
            ...existing,
            completed: true,
          });
        }
      });

      // Persist to sessionStorage
      try {
        const plainObj = Object.fromEntries(newHistory);
        sessionStorage.setItem(AMBULANCE_TRACKING_KEY, JSON.stringify(plainObj));
      } catch (e) {
        console.error('Failed to save ambulance history:', e);
      }

      return newHistory;
    });

    // Force re-render to update stats
    forceUpdate(prev => prev + 1);
  }, [state.roads]);

  // Calculate live stats from TrafficSimContext - recalculated on every render
  const totalVehicles = state.roads.reduce((sum, road) => sum + road.detectionCount, 0);
  const congestedLanes = state.roads.filter(road => road.detectionCount >= 8).length;
  const emergencyAlerts = state.roads.filter(road => road.ambulanceDetected).length;
  const activeIntersections = state.intersections.length || 4; // Default to 4 if no intersections loaded


  // Transform ambulance history to display format
  const ambulanceEvents = Array.from(ambulanceHistory.entries())
    .map(([vehicleId, data]) => ({
      id: vehicleId,
      vehicleId: vehicleId.substring(10), // Show shortened ID
      timestamp: new Date(data.firstSeen).toISOString(),
      route: data.completed ? 'Cleared intersection' : `🚨 Active in ${data.lane}`,
      status: data.completed ? 'completed' : 'pending',
      duration: Math.round((data.lastSeen - data.firstSeen) / 1000),
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">COMMAND CENTER</h1>
        <p className="text-muted-foreground font-mono text-sm">REAL-TIME CITY TRAFFIC OVERVIEW - SYNCED WITH LIVE CAMERA FEEDS</p>
      </div>

      {/* Stats Row - Synced with Live Camera Feeds */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          key={`total-${totalVehicles}`}
          title="Total Vehicles"
          value={formatNumber(totalVehicles)}
          icon={<Car className="w-6 h-6" />}
          trend={{ value: "LIVE", isPositive: true }}
          glow="primary"
        />
        <StatCard
          key={`nodes-${activeIntersections}`}
          title="Active Nodes"
          value={activeIntersections}
          icon={<MapPin className="w-6 h-6" />}
          glow="success"
        />
        <StatCard
          key={`congested-${congestedLanes}`}
          title="Congested Lanes"
          value={congestedLanes}
          icon={<Activity className="w-6 h-6" />}
          trend={{ value: congestedLanes > 0 ? `${congestedLanes}/4` : "0", isPositive: false }}
          glow={congestedLanes > 2 ? "warning" : "none"}
        />
        <StatCard
          key={`emergency-${emergencyAlerts}`}
          title="Emergency Alerts"
          value={emergencyAlerts}
          icon={<AlertTriangle className="w-6 h-6" />}
          glow={emergencyAlerts > 0 ? "destructive" : "none"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        {/* Main Chart - Recent 10 Data Points Only */}
        <GlassPanel className="lg:col-span-2 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                NETWORK DENSITY TREND
                <span className="text-xs font-mono text-primary/80">(LIVE - Recent 30 Min)</span>
              </h2>
              <p className="text-xs text-muted-foreground font-mono mt-1">Vehicles detected across all camera feeds (1-min intervals)</p>
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              Data Points: {densityHistory.length}/30
            </div>
          </div>
          <div className="flex-1 min-h-100">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={densityHistory} margin={{ top: 10, right: 10, left: -20, bottom: 50 }}>
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
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(0, Math.floor(densityHistory.length / 6) - 1)}
                  angle={-0}
                  textAnchor="middle"
                  height={30}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }}
                  formatter={(value: number) => [`${value} vehicles`, 'Detected']}
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

        {/* Live Map Preview
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
        </GlassPanel> */}
      </div>

      {/* Lane Status Summary - Synced with Camera Feeds */}
      <GlassPanel className="p-6 mb-8">
        <h2 className="text-lg font-display font-semibold mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          LIVE LANE STATUS - ALGORITHM VERIFICATION
          <span className="text-xs font-mono text-primary/80">(Camera Feed Sync + Priority Calculation)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {state.roads.map((road, index) => {
            // Calculate priority using the same formula from TrafficSimContext
            const ENHANCED_W1 = 1.0;
            const ENHANCED_W2 = 1.0;
            const ENHANCED_WAIT_SCALE = 0.1;
            const ENHANCED_MAX_WAIT = 300;

            const scaledWait = Math.min(road.waitingTime, ENHANCED_MAX_WAIT) * ENHANCED_WAIT_SCALE;
            const priority = road.detectionCount * ENHANCED_W1 + scaledWait * ENHANCED_W2;

            return (
              <div
                key={road.id}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  road.signal === 'green' ? "border-success/50 bg-success/5" :
                  road.signal === 'yellow' ? "border-warning/50 bg-warning/5" :
                  "border-destructive/50 bg-destructive/5"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono font-bold text-white">{road.label}</span>
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    road.signal === 'green' ? "bg-success animate-pulse" :
                    road.signal === 'yellow' ? "bg-warning animate-pulse" :
                    "bg-destructive"
                  )} />
                </div>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicles:</span>
                    <span className="text-white font-bold">{road.detectionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Queue:</span>
                    <span className="text-white">{road.vehicles.filter(v => !v.isOutgoing && v.progress < 0.85).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Signal:</span>
                    <span className={cn(
                      "font-bold uppercase",
                      road.signal === 'green' ? "text-success" :
                      road.signal === 'yellow' ? "text-warning" :
                      "text-destructive"
                    )}>{road.signal}</span>
                  </div>

                  {/* NEW: Priority Value */}
                  <div className="flex justify-between items-center pt-1 mt-1 border-t border-primary/20">
                    <span className="text-primary/90">Priority:</span>
                    <span className="text-primary font-bold">{priority.toFixed(2)}</span>
                  </div>

                  {/* NEW: Waiting Time */}
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-400/80">Wait Time:</span>
                    <span className={cn(
                      "font-bold",
                      road.waitingTime > 180 ? "text-destructive animate-pulse" :
                      road.waitingTime > 60 ? "text-warning" :
                      "text-cyan-400"
                    )}>{road.waitingTime.toFixed(1)}s</span>
                  </div>

                  {road.ambulanceDetected && (
                    <div className="pt-1 mt-1 border-t border-destructive/30">
                      <span className="text-destructive font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        AMBULANCE
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Algorithm Explanation */}
        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="text-xs font-mono text-primary/90">
            <strong className="text-primary">Algorithm:</strong> Priority = (Vehicles × 1.0) + (Wait Time × 0.1)
            <br />
            <span className="text-muted-foreground">
              Higher priority = selected next for green signal. Emergency vehicles get +1000 boost. Starvation prevention at 180s.
            </span>
          </div>
        </div>
      </GlassPanel>

      {/* Ambulance Events Log - Only Showing Lane-to-Lane Movement */}
      <GlassPanel className="p-6">
        <h2 className="text-lg font-display font-semibold mb-6 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          AMBULANCE TRACKING
          <span className="text-xs font-mono text-primary/80">(Live Lane Movement)</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs font-mono text-muted-foreground border-b border-border">
              <tr>
                <th className="pb-3 font-medium">TIMESTAMP</th>
                <th className="pb-3 font-medium">VEHICLE ID</th>
                <th className="pb-3 font-medium">LANE MOVEMENT</th>
                <th className="pb-3 font-medium">STATUS</th>
                <th className="pb-3 font-medium">DURATION</th>
              </tr>
            </thead>
            <tbody>
              {ambulanceEvents.length > 0 ? (
                ambulanceEvents.slice(0, 5).map((ev) => (
                  <tr key={ev.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                    <td className="py-3 font-mono text-muted-foreground">{format(new Date(ev.timestamp), "HH:mm:ss")}</td>
                    <td className="py-3 font-medium text-destructive">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        {ev.vehicleId}
                      </div>
                    </td>
                    <td className="py-3 text-white font-mono">{ev.route}</td>
                    <td className="py-3">
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-mono border font-bold",
                        ev.status === "pending" ? "bg-warning/10 text-warning border-warning/20 animate-pulse" :
                        ev.status === "completed" ? "bg-success/10 text-success border-success/20" :
                        "bg-muted/50 text-muted-foreground border-border"
                      )}>
                        {ev.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-muted-foreground">{ev.duration}s</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground font-mono text-sm">
                    NO AMBULANCE ACTIVITY
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {ambulanceEvents.length === 0 && (emergency?.events?.length || 0) > 0 && (
            <div className="mt-4 text-xs text-muted-foreground font-mono text-center">
              {(emergency?.events || []).length} other events (filtered for ambulances only)
            </div>
          )}
        </div>
      </GlassPanel>
    </AppLayout>
  );
}
