import { GlassPanel } from "@/components/GlassPanel";
import { AppLayout } from "@/components/layout/AppLayout";
import { Intersection3DEnvironment } from "@/components/traffic-sim/Intersection3DEnvironment";
import { IntersectionDetailView } from "@/components/traffic-sim/IntersectionDetailView";
import { useTrafficSim } from "@/context/TrafficSimContext";
import { useLiveIntersections } from "@/hooks/use-smartflow";
import { SimRoadState } from "@/types/traffic-sim";
import { AlertTriangle, MapPinned, Radar } from "lucide-react";
import { useEffect } from "react";

interface Intersection3DEnvironmentProps {
  roads: SimRoadState[];
}

export default function Traffic() {
  const { data: mapData, isLoading } = useLiveIntersections();
  const { state, selectedIntersection, setIntersectionsFromApi, selectIntersection, backToMap } = useTrafficSim();

  useEffect(() => {
    if (mapData?.intersections?.length) {
      setIntersectionsFromApi(mapData.intersections);
    }
  }, [mapData, setIntersectionsFromApi]);

  const activeAmbulanceLanes = state.roads.filter((road) => road.ambulanceDetected).length;
  const totalEnteredVehicles = state.roads.reduce((sum, road) => sum + road.vehicleCount, 0);

  return (
    <AppLayout>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">LIVE TRAFFIC DASHBOARD</h1>
          <p className="text-muted-foreground font-mono text-sm">OSM-POWERED INTERSECTION MONITORING & 3D SIGNAL CONTROL</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full text-xs font-mono text-primary">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          REAL-TIME MONITORING ACTIVE
        </div>
      </div>

      {!selectedIntersection && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <GlassPanel className="p-4">
            <div className="text-xs text-muted-foreground font-mono mb-1">INTERSECTIONS ONLINE</div>
            <div className="text-2xl font-display font-bold flex items-center gap-2">
              <MapPinned className="w-5 h-5 text-primary" />
              {state.intersections.length}
            </div>
          </GlassPanel>
          <GlassPanel className="p-4">
            <div className="text-xs text-muted-foreground font-mono mb-1">TOTAL VEHICLES ENTERED</div>
            <div className="text-2xl font-display font-bold flex items-center gap-2">
              <Radar className="w-5 h-5 text-warning" />
              {totalEnteredVehicles}
            </div>
          </GlassPanel>
          <GlassPanel className="p-4">
            <div className="text-xs text-muted-foreground font-mono mb-1">ACTIVE EMERGENCY LANES</div>
            <div className="text-2xl font-display font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {activeAmbulanceLanes}
            </div>
          </GlassPanel>
        </div>
      )}

      <GlassPanel className="p-4 md:p-6">
        {!selectedIntersection ? (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-display font-bold">City Intersections Map</h2>
              <p className="text-sm text-muted-foreground font-mono">
                Hover to inspect intersection ID/name. Click a marker to open 4-way CCTV simulation.
              </p>
            </div>

            {isLoading && state.intersections.length === 0 ? (
              <div className="h-[560px] rounded-xl border border-white/10 bg-black/40 animate-pulse" />
            ) : (
              <Intersection3DEnvironment roads={state.roads} />
            )}
          </>
        ) : (
          <IntersectionDetailView intersection={selectedIntersection} roads={state.roads} onBack={backToMap} />
        )}
      </GlassPanel>
    </AppLayout>
  );
}
