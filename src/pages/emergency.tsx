import { CityMap } from "@/components/CityMap";
import { GlassPanel } from "@/components/GlassPanel";
import { AppLayout } from "@/components/layout/AppLayout";
import { TrafficLight } from "@/components/TrafficLight";
import { getTrafficDensityByCount, useLiveActiveCorridor, useLiveEmergencyEvents, useLiveIntersections, useLiveSimVehicles } from "@/hooks/use-smartflow";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Ambulance, CheckCircle2, ShieldAlert } from "lucide-react";

export default function Emergency() {
  const { data: corridor } = useLiveActiveCorridor();
  const { data: events } = useLiveEmergencyEvents();
  const { data: mapData } = useLiveIntersections();
  const { data: simVehicles = [] } = useLiveSimVehicles();
  const simDensity = getTrafficDensityByCount(simVehicles.length);

  const densityClass =
    simDensity.level === "low"
      ? "bg-success/10 text-success border-success/30"
      : simDensity.level === "medium"
        ? "bg-warning/10 text-warning border-warning/30"
        : "bg-destructive/10 text-destructive border-destructive/30";

  const isActive = corridor?.active;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">EMERGENCY CORRIDOR</h1>
        <p className="text-muted-foreground font-mono text-sm">PREEMPTIVE ROUTE CLEARING SYSTEM</p>
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-6 bg-destructive/10 border-2 border-destructive shadow-[0_0_20px_rgba(255,42,42,0.3)] rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive text-white rounded-full animate-pulse">
                <Ambulance className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-destructive text-glow-danger">EMERGENCY VEHICLE DETECTED</h2>
                <p className="text-sm font-mono text-white/80">Activating Priority Green Corridor - Target: Hospital Sector</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-destructive/80 mb-1">ETA TO DESTINATION</div>
              <div className="text-2xl font-mono font-bold text-white">
                {corridor?.estimatedClearTime ? `${Math.floor(corridor.estimatedClearTime / 60)}m ${corridor.estimatedClearTime % 60}s` : '--'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Route Map */}
        <GlassPanel glowColor={isActive ? "success" : "none"} className="p-6 relative overflow-hidden">
          {isActive && (
             <div className="absolute top-0 right-0 bg-success text-success-foreground font-mono text-xs px-3 py-1 rounded-bl-lg z-10 animate-pulse">
               CORRIDOR ACTIVE
             </div>
          )}
          <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            ROUTE TRACKING
          </h2>
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-[11px] font-mono text-muted-foreground">
              LIVE VEHICLES: {simVehicles.length}
            </span>
            <span className={cn("text-[10px] font-mono px-2 py-1 rounded border", densityClass)}>
              DENSITY: {simDensity.label}
            </span>
          </div>
          <div className="w-full flex justify-center">
            <CityMap 
              intersections={mapData?.intersections || []}
              roads={mapData?.roads || []}
              activeRoute={isActive ? corridor?.route : []}
              vehicles={simVehicles}
            />
          </div>
        </GlassPanel>

        <div className="space-y-6">
          {/* Status Panel */}
          <GlassPanel className="p-6">
            <h2 className="text-lg font-display font-semibold mb-6 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              SIGNAL PREEMPTION STATUS
            </h2>
            
            {isActive ? (
              <div className="space-y-4">
                {(corridor?.signals || []).map((sig, i) => (
                  <div key={sig.signalId} className="flex items-center justify-between p-3 bg-black/40 border border-white/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-mono text-xs border border-primary/40">
                        {i + 1}
                      </div>
                      <span className="font-medium text-white/90">{sig.intersection}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "text-xs font-mono",
                        sig.status === 'green' ? "text-success text-glow-success" : "text-muted-foreground"
                      )}>
                        {sig.status === 'green' ? 'CLEARED' : 'PREPARING'}
                      </span>
                      <TrafficLight phase={sig.status} size="sm" horizontal />
                    </div>
                  </div>
                ))}
                
                <button className="w-full mt-4 py-3 bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/50 rounded-lg font-mono text-sm transition-colors cursor-pointer">
                  ABORT CORRIDOR
                </button>
              </div>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg">
                <CheckCircle2 className="w-8 h-8 mb-2 text-success opacity-50" />
                <p className="font-mono text-sm">NO ACTIVE EMERGENCIES</p>
                <button className="mt-4 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded font-mono text-xs cursor-pointer transition-colors">
                  TEST SIMULATION
                </button>
              </div>
            )}
          </GlassPanel>

          {/* Recent History */}
          <GlassPanel className="p-6">
            <h2 className="text-lg font-display font-semibold mb-4 text-white/90">RECENT LOGS</h2>
            <div className="space-y-3">
              {(events?.events || []).slice(0,3).map(ev => (
                <div key={ev.id} className="text-sm flex justify-between items-center pb-3 border-b border-white/5 last:border-0 last:pb-0">
                  <div>
                    <div className="font-medium text-white/80">{ev.type}</div>
                    <div className="text-xs text-muted-foreground font-mono">{format(new Date(ev.timestamp), "HH:mm")} • {ev.route}</div>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono bg-white/5 px-2 py-1 rounded">
                    {ev.duration}s
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </AppLayout>
  );
}
