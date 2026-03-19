import type { SimRoadState } from "@/types/traffic-sim";
import { Ambulance, ArrowUp, Bike, Bus, Car } from "lucide-react";

interface IntersectionMapViewProps {
  roads: SimRoadState[];
  onLaneClick?: (laneIndex: number) => void;
}

const LANE_LABELS = ["North", "East", "South", "West"];

function getSignalColor(signal: string) {
  if (signal === "green") return "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]";
  if (signal === "yellow") return "bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]";
  return "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]";
}

function getVehicleIcon(type: string) {
  switch (type) {
    case "bike":
      return <Bike className="w-3 h-3" />;
    case "ambulance":
      return <Ambulance className="w-3 h-3" />;
    case "bus":
      return <Bus className="w-3 h-3" />;
    default:
      return <Car className="w-3 h-3" />;
  }
}

export function IntersectionMapView({ roads, onLaneClick }: IntersectionMapViewProps) {
  const handleLaneClick = (index: number) => {
    if (onLaneClick) {
      onLaneClick(index);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-cyan-300/25 bg-slate-950 p-6 shadow-[0_0_0_1px_rgba(12,74,110,0.4),0_18px_38px_rgba(2,6,23,0.62)]">
      {/* Header */}
      <div className="absolute left-6 top-6 z-20 rounded-md border border-cyan-300/20 bg-slate-900/90 px-4 py-2 font-mono text-sm text-slate-200 backdrop-blur-sm">
        <div className="font-semibold text-cyan-300">INTERSECTION MAP VIEW</div>
        <div className="mt-1 text-xs text-slate-400">Click on a lane to view details</div>
      </div>

      {/* Stats */}
      <div className="absolute right-6 top-6 z-20 rounded-md border border-emerald-300/20 bg-slate-900/90 px-4 py-2 font-mono text-xs text-slate-200 backdrop-blur-sm">
        <div className="text-emerald-300 font-semibold">Total Vehicles: {roads.reduce((sum, road) => sum + road.vehicles.length, 0)}</div>
        <div className="mt-1">Flow Rate: {roads.reduce((sum, road) => sum + road.vehicleCount, 0)}/min</div>
      </div>

      {/* Map Container */}
      <div className="relative h-full w-full flex items-center justify-center pt-16 pb-8">
        <div className="relative w-[600px] h-[600px]">
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-slate-800/80 border-2 border-cyan-400/40 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs text-cyan-300 font-mono">CENTER</div>
              <div className="w-4 h-4 rounded-full bg-cyan-400 mx-auto mt-1 animate-pulse" />
            </div>
          </div>

          {/* Roads and Lane Buttons */}
          {roads.map((road, index) => {
            const rotation = index * 90;
            const isNorthSouth = index % 2 === 0;
            const direction = LANE_LABELS[index];

            return (
              <div
                key={road.id}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                }}
              >
                {/* Road */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 bg-slate-700/60 border-x-2 border-slate-600/50"
                  style={{
                    width: isNorthSouth ? "80px" : "600px",
                    height: isNorthSouth ? "600px" : "80px",
                    marginTop: isNorthSouth ? "-300px" : "-40px",
                    marginLeft: isNorthSouth ? "-40px" : "-300px",
                  }}
                >
                  {/* Lane Divider */}
                  {isNorthSouth ? (
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-yellow-400/30" style={{ marginLeft: "-1px" }} />
                  ) : (
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-yellow-400/30" style={{ marginTop: "-1px" }} />
                  )}
                </div>

                {/* Lane Button */}
                <button
                  onClick={() => handleLaneClick(index)}
                  className="absolute top-1/2 left-1/2 group cursor-pointer"
                  style={{
                    transform: `translate(-50%, -50%) rotate(-${rotation}deg)`,
                    marginTop: isNorthSouth ? "-220px" : "0",
                    marginLeft: isNorthSouth ? "0" : "-220px",
                  }}
                >
                  <div className="relative">
                    {/* Lane Card */}
                    <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 border-2 border-cyan-400/40 rounded-lg px-6 py-4 min-w-[180px] transition-all duration-300 group-hover:border-cyan-300 group-hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] group-hover:scale-105">
                      {/* Direction Arrow */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-700 border-2 border-cyan-400/60 flex items-center justify-center">
                        <ArrowUp
                          className="w-4 h-4 text-cyan-300"
                          style={{
                            transform: `rotate(${rotation}deg)`,
                          }}
                        />
                      </div>

                      {/* Lane Info */}
                      <div className="text-center space-y-2 mt-2">
                        <div className="font-bold text-white text-sm">{direction} Lane</div>

                        {/* Signal Light */}
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getSignalColor(road.signal)}`} />
                          <span className="text-xs font-mono text-slate-300 uppercase">{road.signal}</span>
                        </div>

                        {/* Stats */}
                        <div className="space-y-1 text-xs font-mono">
                          <div className="flex items-center justify-between gap-4 px-2">
                            <span className="text-slate-400">Queue:</span>
                            <span className="text-white font-semibold">{road.vehicles.length}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 px-2">
                            <span className="text-slate-400">Entered:</span>
                            <span className="text-emerald-400 font-semibold">{road.vehicleCount}</span>
                          </div>
                        </div>

                        {/* Vehicle Types */}
                        {road.vehicles.length > 0 && (
                          <div className="flex items-center justify-center gap-1 pt-1 border-t border-slate-700">
                            {Array.from(new Set(road.vehicles.map(v => v.type))).slice(0, 4).map((type, idx) => (
                              <div key={idx} className="text-slate-400 p-1">
                                {getVehicleIcon(type)}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Ambulance Alert */}
                        {road.ambulanceDetected && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 animate-pulse flex items-center justify-center">
                            <Ambulance className="w-3 h-3 text-white" />
                          </div>
                        )}

                        {/* Click Indicator */}
                        <div className="text-[10px] text-cyan-400/60 group-hover:text-cyan-300 mt-2">
                          Click to view →
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Traffic Light */}
                <div
                  className="absolute top-1/2 left-1/2"
                  style={{
                    transform: `translate(-50%, -50%) rotate(-${rotation}deg)`,
                    marginTop: isNorthSouth ? "-100px" : "0",
                    marginLeft: isNorthSouth ? "50px" : "-100px",
                  }}
                >
                  <div className="bg-slate-900/80 border border-slate-700 rounded-lg px-2 py-3 flex flex-col gap-1.5">
                    <div className={`w-4 h-4 rounded-full ${road.signal === "red" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-red-950/50"}`} />
                    <div className={`w-4 h-4 rounded-full ${road.signal === "yellow" ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" : "bg-yellow-950/50"}`} />
                    <div className={`w-4 h-4 rounded-full ${road.signal === "green" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-green-950/50"}`} />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Crosswalks */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            {[0, 90, 180, 270].map((angle, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  transform: `rotate(${angle}deg)`,
                  marginTop: "-90px",
                  marginLeft: "-20px",
                }}
              >
                <div className="flex gap-1">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-1.5 h-8 bg-white/40 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-20 rounded-md border border-slate-600/40 bg-slate-900/90 px-4 py-3 font-mono text-xs backdrop-blur-sm">
        <div className="text-slate-300 font-semibold mb-2">Signal Status</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-400">Green - Go</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="text-slate-400">Yellow - Caution</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-400">Red - Stop</span>
          </div>
        </div>
      </div>
    </div>
  );
}
