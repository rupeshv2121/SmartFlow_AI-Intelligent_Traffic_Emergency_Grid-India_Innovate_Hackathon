import { GlassPanel } from "@/components/GlassPanel";
import { AppLayout } from "@/components/layout/AppLayout";
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

// Persistent storage keys
const CHART_STORAGE_KEY = 'traffic-density-history';
const AMBULANCE_TRACKING_KEY = 'ambulance-tracking-history';

// Helper to turn internal vehicle IDs into pseudo real-world number plates
function formatVehicleNumber(id: string): string {
  // Example format: MH 12 AB 1234
  const clean = id.replace(/[^a-zA-Z0-9]/g, "");
  if (!clean) return "MH 00 AA 0000";

  const letters = clean.replace(/[^a-zA-Z]/g, "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  const digits = clean.replace(/[^0-9]/g, "0123456789");

  const pickChar = (source: string, index: number, fallback: string) =>
    source.length ? source[index % source.length].toUpperCase() : fallback;

  const pickDigit = (source: string, index: number, fallback: string) =>
    source.length ? source.charAt(index % source.length) : fallback;

  const s1 = pickChar(letters, 0, "M");
  const s2 = pickChar(letters, 3, "H");
  const d1 = pickDigit(digits, 1, "0");
  const d2 = pickDigit(digits, 2, "1");
  const a1 = pickChar(letters, 5, "A");
  const a2 = pickChar(letters, 7, "B");
  const n1 = pickDigit(digits, 4, "0");
  const n2 = pickDigit(digits, 6, "0");
  const n3 = pickDigit(digits, 8, "0");
  const n4 = pickDigit(digits, 10, "0");

  return `${s1}${s2} ${d1}${d2} ${a1}${a2} ${n1}${n2}${n3}${n4}`;
}

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
    road: string;
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
            road: val.road,
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
    const currentAmbulances = new Map<string, { road: string; progress: number }>();
    state.roads.forEach((road, roadIndex) => {
      road.vehicles.forEach(vehicle => {
        if (vehicle.type === 'ambulance') {
          currentAmbulances.set(vehicle.id, {
            road: road.label,
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
            road: ambulanceData.road,
          });
        } else {
          // Update existing ambulance
          const existing = newHistory.get(ambulanceId)!;
          newHistory.set(ambulanceId, {
            ...existing,
            lastSeen: now,
            road: ambulanceData.road,
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
  const congestedRoads = state.roads.filter(road => road.detectionCount >= 8).length;
  const emergencyAlerts = state.roads.filter(road => road.ambulanceDetected).length;
  const activeIntersections = state.intersections.length || 4; // Default to 4 if no intersections loaded


  // Transform ambulance history to display format
  const ambulanceEvents = Array.from(ambulanceHistory.entries())
    .map(([vehicleId, data]) => ({
      id: vehicleId,
      vehicleId: formatVehicleNumber(vehicleId),
      timestamp: new Date(data.firstSeen).toISOString(),
      route: data.completed ? 'Cleared intersection' : `Active in ${data.road}`,
      status: data.completed ? 'completed' : 'pending',
      duration: Math.round((data.lastSeen - data.firstSeen) / 1000),
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <AppLayout>
      {/* Hero Section with Gradient Background */}
      <div className="mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/30 p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-success animate-pulse shadow-lg shadow-success/50"></div>
            <span className="text-xs font-mono text-success font-bold tracking-wider">SYSTEM ONLINE</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground mb-3 tracking-tight">
            TRAFFIC COMMAND CENTER
          </h1>
          <p className="text-muted-foreground font-mono text-sm tracking-wide">
            Real-time monitoring and adaptive signal control
          </p>
        </div>
      </div>

      {/* Enhanced Stats Row with Mini Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <GlassPanel className="p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300" glowColor="primary">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <Car className="w-7 h-7" />
              </div>
              <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-success/10 text-success border border-success/20 font-bold">
                LIVE
              </span>
            </div>
            <div>
              <h3 className="text-muted-foreground text-xs font-medium tracking-wider mb-2 uppercase font-display">
                Total Vehicles
              </h3>
              <p className="text-4xl font-bold font-display text-glow text-foreground mb-3 tracking-tight">
                {formatNumber(totalVehicles)}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/50 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((totalVehicles / 40) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-primary font-mono font-bold">{Math.round((totalVehicles / 40) * 100)}%</span>
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300" glowColor="success">
          <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-success/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-success/10 text-success group-hover:bg-success/20 transition-colors">
                <MapPin className="w-7 h-7" />
              </div>
              <div className="flex flex-col items-end gap-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={cn("w-1 h-1 rounded-full", i < activeIntersections ? "bg-success animate-pulse" : "bg-muted")}></div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-muted-foreground text-xs font-medium tracking-wider mb-2 uppercase font-display">
                Active Nodes
              </h3>
              <p className="text-4xl font-bold font-display text-glow-success text-foreground mb-1 tracking-tight">
                {activeIntersections}
              </p>
              <p className="text-xs text-success font-mono">All systems operational</p>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300" glowColor={congestedRoads > 2 ? "warning" : "none"}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-warning/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-warning/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className={cn(
                "p-3 rounded-xl transition-colors",
                congestedRoads > 2 ? "bg-warning/10 text-warning group-hover:bg-warning/20" : "bg-muted/10 text-muted-foreground group-hover:bg-muted/20"
              )}>
                <Activity className="w-7 h-7" />
              </div>
              {congestedRoads > 0 && (
                <span className={cn(
                  "text-xs font-mono px-3 py-1.5 rounded-full border font-bold",
                  congestedRoads > 2 ? "bg-warning/10 text-warning border-warning/20 animate-pulse" : "bg-muted/10 text-muted-foreground border-muted/20"
                )}>
                  {congestedRoads}/4
                </span>
              )}
            </div>
            <div>
              <h3 className="text-muted-foreground text-xs font-medium tracking-wider mb-2 uppercase font-display">
                Congested Roads
              </h3>
              <p className={cn(
                "text-4xl font-bold font-display mb-3 tracking-tight",
                congestedRoads > 2 ? "text-warning text-glow-warning" : "text-foreground"
              )}>
                {congestedRoads}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {state.roads.map((road, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-10 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-semibold transition-all",
                      road.detectionCount >= 8
                        ? "bg-warning/40 border-warning/60 border-2 text-warning shadow-[0_6px_16px_rgba(255,159,67,0.12)] animate-pulse"
                        : "bg-muted/40 border-muted/50 border text-muted-foreground"
                    )}
                    title={`Road ${i + 1} — ${road.detectionCount} detections`}
                  >
                    <span>{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300" glowColor={emergencyAlerts > 0 ? "destructive" : "none"}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-destructive/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className={cn(
                "p-3 rounded-xl transition-colors",
                emergencyAlerts > 0 ? "bg-destructive/10 text-destructive group-hover:bg-destructive/20 animate-pulse" : "bg-muted/10 text-muted-foreground group-hover:bg-muted/20"
              )}>
                <AlertTriangle className={cn("w-7 h-7", emergencyAlerts > 0 && "animate-bounce")} />
              </div>
              {emergencyAlerts > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-destructive animate-ping"></div>
                  <div className="w-2 h-2 rounded-full bg-destructive absolute"></div>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-muted-foreground text-xs font-medium tracking-wider mb-2 uppercase font-display">
                Emergency Alerts
              </h3>
              <p className={cn(
                "text-4xl font-bold font-display mb-1 tracking-tight",
                emergencyAlerts > 0 ? "text-destructive text-glow-danger" : "text-foreground"
              )}>
                {emergencyAlerts}
              </p>
              <p className={cn(
                "text-xs font-mono",
                emergencyAlerts > 0 ? "text-destructive font-bold" : "text-muted-foreground"
              )}>
                {emergencyAlerts > 0 ? "PRIORITY CORRIDOR ACTIVE" : "No active emergencies"}
              </p>
            </div>
          </div>
        </GlassPanel>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        {/* Main Chart - Recent 10 Data Points Only */}
        {/* <GlassPanel className="lg:col-span-2 p-6 flex flex-col">
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
        </GlassPanel> */}

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

      {/* Enhanced Road Status Grid */}
      <GlassPanel className="p-8 mb-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-display font-bold mb-2 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              INTERSECTION STATUS
            </h2>
            <p className="text-xs text-muted-foreground font-mono">
              Real-time traffic monitoring with adaptive signal control
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <span className="text-xs font-mono text-success">LIVE</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {state.roads.map((road, index) => {
            // Calculate priority using the same formula from TrafficSimContext
            const ENHANCED_W1 = 1.0;
            const ENHANCED_W2 = 1.0;
            const ENHANCED_WAIT_SCALE = 0.1;
            const ENHANCED_MAX_WAIT = 300;

            const scaledWait = Math.min(road.waitingTime, ENHANCED_MAX_WAIT) * ENHANCED_WAIT_SCALE;
            const priority = road.detectionCount * ENHANCED_W1 + scaledWait * ENHANCED_W2;
            const congestionLevel = Math.min((road.detectionCount / 12) * 100, 100);

            return (
              <GlassPanel
                key={road.id}
                className={cn(
                  "p-5 relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
                  road.signal === 'green' && "border-success/40 shadow-success/10",
                  road.signal === 'yellow' && "border-warning/40 shadow-warning/10",
                  road.signal === 'red' && "border-destructive/30 shadow-destructive/5"
                )}
                glowColor={road.ambulanceDetected ? "destructive" : road.signal === 'green' ? "success" : "none"}
              >
                {/* Background gradient based on signal */}
                <div className={cn(
                  "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-all",
                  road.signal === 'green' && "bg-success/10",
                  road.signal === 'yellow' && "bg-warning/10",
                  road.signal === 'red' && "bg-destructive/5"
                )}></div>

                {/* Emergency Alert Banner */}
                {road.ambulanceDetected && (
                  <div className="absolute top-0 left-0 right-0 bg-destructive/20 border-b border-destructive/30 px-3 py-1 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-destructive animate-pulse" />
                    <span className="text-xs font-mono font-bold text-destructive">EMERGENCY VEHICLE</span>
                  </div>
                )}

                <div className={cn("relative z-10", road.ambulanceDetected && "mt-7")}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-bold font-display text-lg border-2 transition-all",
                        road.signal === 'green' && "bg-success/10 border-success/30 text-success",
                        road.signal === 'yellow' && "bg-warning/10 border-warning/30 text-warning",
                        road.signal === 'red' && "bg-destructive/10 border-destructive/20 text-destructive/70"
                      )}>
                        {road.label.split(' ')[1]}
                      </div>
                      <div>
                        <h3 className="text-sm font-mono font-bold text-white">{road.label}</h3>
                        <p className="text-xs text-muted-foreground font-mono">ID: {road.id}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-4 h-4 rounded-full shadow-lg transition-all",
                      road.signal === 'green' && "bg-success animate-pulse shadow-success/50",
                      road.signal === 'yellow' && "bg-warning animate-pulse shadow-warning/50",
                      road.signal === 'red' && "bg-destructive shadow-destructive/30"
                    )} />
                  </div>

                  {/* Congestion Gauge */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono text-muted-foreground">Traffic Density</span>
                      <span className={cn(
                        "text-xs font-mono font-bold",
                        congestionLevel > 66 ? "text-destructive" :
                        congestionLevel > 33 ? "text-warning" :
                        "text-success"
                      )}>
                        {congestionLevel.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          congestionLevel > 66 ? "bg-gradient-to-r from-destructive to-destructive/50" :
                          congestionLevel > 33 ? "bg-gradient-to-r from-warning to-warning/50" :
                          "bg-gradient-to-r from-success to-success/50"
                        )}
                        style={{ width: `${congestionLevel}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 gap-3 mb-4">
                    <div className="bg-card/50 rounded-lg p-3 border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Car className="w-3 h-3 text-primary" />
                        <span className="text-xs text-muted-foreground font-mono">Vehicles</span>
                      </div>
                      <p className="text-2xl font-bold font-display text-primary">{road.detectionCount}</p>
                    </div>
                    {/* <div className="bg-card/50 rounded-lg p-3 border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-3 h-3 text-cyan-400" />
                        <span className="text-xs text-muted-foreground font-mono">Queue</span>
                      </div>
                      <p className="text-2xl font-bold font-display text-cyan-400">
                        {road.vehicles.filter(v => !v.isOutgoing && v.progress < 0.85).length}
                      </p>
                    </div> */}
                  </div>

                  {/* Priority and Wait Time */}
                  <div className="space-y-2 pb-3 border-b border-border/30 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-primary/70 font-mono">Priority Score</span>
                      <span className="text-sm font-bold font-mono text-primary">{priority.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground font-mono">Wait Time</span>
                      <span className={cn(
                        "text-sm font-bold font-mono",
                        road.waitingTime > 180 ? "text-destructive animate-pulse" :
                        road.waitingTime > 60 ? "text-warning" :
                        "text-cyan-400"
                      )}>
                        {road.waitingTime.toFixed(0)}s
                      </span>
                    </div>
                  </div>

                  {/* Signal Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono">Signal</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className={cn("w-2 h-2 rounded-full", road.signal === 'red' ? "bg-destructive" : "bg-muted/30")}></div>
                        <div className={cn("w-2 h-2 rounded-full", road.signal === 'yellow' ? "bg-warning" : "bg-muted/30")}></div>
                        <div className={cn("w-2 h-2 rounded-full", road.signal === 'green' ? "bg-success" : "bg-muted/30")}></div>
                      </div>
                      <span className={cn(
                        "text-xs font-bold uppercase font-mono px-2 py-0.5 rounded",
                        road.signal === 'green' && "text-success bg-success/10",
                        road.signal === 'yellow' && "text-warning bg-warning/10",
                        road.signal === 'red' && "text-destructive/70 bg-destructive/5"
                      )}>
                        {road.signal}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>

        {/* Algorithm Info Card */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-6 border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-display font-bold text-primary mb-2">ADAPTIVE SIGNAL ALGORITHM</h3>
              <p className="text-xs font-bold font-mono mb-3">
                Priority = (Vehicle Count × 1.0) + (Wait Time × 0.1)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span className="text-muted-foreground">Real-time density analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive"></div>
                  <span className="text-muted-foreground">Emergency priority +1000</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning"></div>
                  <span className="text-muted-foreground">Starvation prevention at 180s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Enhanced Ambulance Tracking Section */}
      <GlassPanel className="p-8" glowColor={emergencyAlerts > 0 ? "destructive" : "none"}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-display font-bold mb-2 flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg transition-all",
                emergencyAlerts > 0 ? "bg-destructive/10 animate-pulse" : "bg-muted/10"
              )}>
                <AlertTriangle className={cn(
                  "w-5 h-5",
                  emergencyAlerts > 0 ? "text-destructive" : "text-muted-foreground"
                )} />
              </div>
              EMERGENCY VEHICLE TRACKING
            </h2>
            <p className="text-xs text-muted-foreground font-mono">
              Real-time ambulance detection and priority corridor monitoring
            </p>
          </div>
          {emergencyAlerts > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-destructive animate-ping"></div>
                <div className="w-2 h-2 rounded-full bg-destructive absolute"></div>
              </div>
              <span className="text-sm font-mono font-bold text-destructive">
                {emergencyAlerts} ACTIVE CORRIDOR{emergencyAlerts > 1 ? 'S' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-destructive/10 to-transparent rounded-xl p-5 border border-destructive/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-muted-foreground uppercase">Active Now</span>
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse"></div>
            </div>
            <p className="text-3xl font-bold font-display text-destructive">
              {ambulanceEvents.filter(e => e.status === 'pending').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-success/10 to-transparent rounded-xl p-5 border border-success/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-muted-foreground uppercase">Completed Today</span>
              <div className="w-2 h-2 rounded-full bg-success"></div>
            </div>
            <p className="text-3xl font-bold font-display text-success">
              {ambulanceEvents.filter(e => e.status === 'completed').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-primary/10 to-transparent rounded-xl p-5 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-muted-foreground uppercase">Avg. Duration</span>
              <Zap className="w-3 h-3 text-primary" />
            </div>
            <p className="text-3xl font-bold font-display text-primary">
              {ambulanceEvents.length > 0
                ? Math.round(ambulanceEvents.reduce((sum, e) => sum + e.duration, 0) / ambulanceEvents.length)
                : 0}s
            </p>
          </div>
        </div>

        {/* Enhanced Table */}
        <div className="overflow-hidden rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead className="bg-card/50 border-b border-border">
              <tr>
                <th className="px-4 py-4 text-left">
                  <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Timestamp</span>
                </th>
                <th className="px-4 py-4 text-left">
                  <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Vehicle ID</span>
                </th>
                <th className="px-4 py-4 text-left">
                  <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Route Status</span>
                </th>
                <th className="px-4 py-4 text-left">
                  <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Status</span>
                </th>
                <th className="px-4 py-4 text-right">
                  <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Duration</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {ambulanceEvents.length > 0 ? (
                ambulanceEvents.slice(0, 5).map((ev, idx) => (
                  <tr
                    key={ev.id}
                    className={cn(
                      "transition-all hover:bg-card/30",
                      ev.status === "pending" && "bg-destructive/5"
                    )}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          idx === 0 ? "bg-primary animate-pulse" : "bg-muted"
                        )}></div>
                        <span className="font-mono text-muted-foreground text-xs">
                          {format(new Date(ev.timestamp), "HH:mm:ss")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-destructive/10 border border-destructive/20">
                          <Car className="w-3 h-3 text-destructive" />
                        </div>
                        <span className="font-mono font-bold text-destructive text-sm">
                          {ev.vehicleId}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-primary" />
                        <span className="text-white font-mono text-sm">{ev.route}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border",
                        ev.status === "pending"
                          ? "bg-warning/10 text-warning border-warning/20 animate-pulse"
                          : "bg-success/10 text-success border-success/20"
                      )}>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          ev.status === "pending" ? "bg-warning" : "bg-success"
                        )}></div>
                        {ev.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Zap className="w-3 h-3 text-cyan-400" />
                        <span className="font-mono text-cyan-400 font-bold">{ev.duration}s</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12">
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                      <div className="p-4 rounded-full bg-muted/10 border border-muted/20">
                        <AlertTriangle className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-muted-foreground font-mono text-sm font-bold mb-1">
                          NO EMERGENCY ACTIVITY
                        </p>
                        <p className="text-muted-foreground/60 font-mono text-xs">
                          System monitoring for emergency vehicles
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Additional Info */}
        {ambulanceEvents.length > 5 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground font-mono">
            Last 5 events shown. Total today: {ambulanceEvents.length}
            </p>
          </div>
        )}
      </GlassPanel>
    </AppLayout>
  );
}
