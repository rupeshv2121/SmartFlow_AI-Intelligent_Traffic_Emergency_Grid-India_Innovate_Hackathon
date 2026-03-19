import { ArrowLeft, AlertTriangle } from "lucide-react";
import type { SimRoadState } from "@/types/traffic-sim";
import { TrafficCameraScene } from "@/components/traffic-sim/TrafficCameraScene";

interface LaneDetailViewProps {
  roads: SimRoadState[];
  laneIndex: number;
  onBack: () => void;
}

const LANE_LABELS = ["North", "East", "South", "West"];

export function LaneDetailView({ roads, laneIndex, onBack }: LaneDetailViewProps) {
  const lane = roads[laneIndex];
  const laneName = LANE_LABELS[laneIndex];

  if (!lane) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Lane not found</p>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md border border-white/20 bg-black/35 hover:bg-black/50 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Map
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-white/20 bg-black/35 hover:bg-black/50 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Map
        </button>

        <div className="text-right">
          <div className="text-xl font-display font-bold">{laneName} Lane Details</div>
          <div className="text-xs font-mono text-muted-foreground">Lane #{laneIndex + 1}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 items-start">
        {/* Camera Feed */}
        <div className="space-y-4">
          <div className="h-[400px] md:h-[500px] lg:h-[600px]">
            <TrafficCameraScene roads={roads} cameraIndex={laneIndex} cameraLabel={`${laneName} Lane`} />
          </div>

          {/* Vehicle Queue */}
          <div className="rounded-lg border border-white/15 bg-black/35 p-4">
            <h3 className="text-sm font-mono font-semibold text-white mb-3">Vehicle Queue ({lane.vehicles.length})</h3>
            {lane.vehicles.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono">No vehicles in queue</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {lane.vehicles.slice(0, 20).map((vehicle, idx) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">#{idx + 1}</span>
                      <span className="text-white uppercase">{vehicle.type}</span>
                      {vehicle.type === "ambulance" && (
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">Progress: {Math.round(vehicle.progress * 100)}%</span>
                      <span className="text-slate-400">Lane: {vehicle.laneOffset > 0 ? "Right" : "Left"}</span>
                    </div>
                  </div>
                ))}
                {lane.vehicles.length > 20 && (
                  <p className="text-xs text-slate-500 text-center py-2">
                    + {lane.vehicles.length - 20} more vehicles
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lane Stats */}
        <div className="rounded-lg border border-white/15 bg-black/35 p-4 space-y-4 xl:sticky xl:top-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-mono">Lane Summary</div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm font-mono">
                <span className="text-white/70">Signal Status:</span>
                <span
                  className={`font-semibold uppercase ${
                    lane.signal === "green"
                      ? "text-green-400"
                      : lane.signal === "yellow"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {lane.signal}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-mono">
                <span className="text-white/70">Queue Length:</span>
                <span className="text-white font-semibold">{lane.vehicles.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-mono">
                <span className="text-white/70">Vehicles Entered:</span>
                <span className="text-emerald-400 font-semibold">{lane.vehicleCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-mono">
                <span className="text-white/70">Emergency Vehicle:</span>
                <span className={lane.ambulanceDetected ? "text-red-400 font-semibold" : "text-white/70"}>
                  {lane.ambulanceDetected ? "DETECTED" : "None"}
                </span>
              </div>
            </div>
          </div>

          {/* Emergency Alert */}
          {lane.ambulanceDetected && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3">
              <div className="flex items-center gap-2 text-red-400 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-mono font-semibold uppercase">Emergency Alert</span>
              </div>
              <p className="text-xs text-red-300/80 font-mono">
                Ambulance detected in lane. Priority signal activated.
              </p>
            </div>
          )}

          {/* Vehicle Type Distribution */}
          <div className="border-t border-white/10 pt-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-mono mb-2">
              Vehicle Types
            </div>
            {lane.vehicles.length > 0 ? (
              <div className="space-y-1.5">
                {Object.entries(
                  lane.vehicles.reduce((acc, v) => {
                    acc[v.type] = (acc[v.type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-white/80 uppercase">{type}:</span>
                    <span className="text-cyan-400 font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground font-mono">No vehicles</p>
            )}
          </div>

          {/* Lane Info */}
          <div className="border-t border-white/10 pt-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-mono mb-2">
              Lane Configuration
            </div>
            <div className="space-y-1.5 text-xs font-mono text-white/70">
              <div>Direction: {laneName}</div>
              <div>Lane ID: {lane.id}</div>
              <div>Index: {laneIndex}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
