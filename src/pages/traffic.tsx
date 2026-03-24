import { GlassPanel } from "@/components/GlassPanel";
import { AppLayout } from "@/components/layout/AppLayout";
import { IntersectionDetailView } from "@/components/traffic-sim/IntersectionDetailView";
import { useTrafficSim } from "@/context/TrafficSimContext";
import { useLiveIntersections } from "@/hooks/use-smartflow";
import { SimRoadState } from "@/types/traffic-sim";
import { AlertTriangle, ExternalLink, MapPinned, Radar } from "lucide-react";
import { useEffect, useState } from "react";

interface Intersection3DEnvironmentProps {
  roads: SimRoadState[];
}

export default function Traffic() {
  const { data: mapData, isLoading } = useLiveIntersections();
  const { state, selectedIntersection, setIntersectionsFromApi, selectIntersection, backToMap } = useTrafficSim();
  const [isSimLoading, setIsSimLoading] = useState(true);
  const simulationUrl = import.meta.env.VITE_SIMULATIONS_URL || "http://localhost:8081";
  const aiApiUrl = import.meta.env.VITE_AI_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (mapData?.intersections?.length) {
      setIntersectionsFromApi(mapData.intersections);
    }
  }, [mapData, setIntersectionsFromApi]);

  // Listen for intersection selection from the simulation iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify message is from our simulation
      if (event.data?.type === 'INTERSECTION_SELECTED' && event.data?.intersectionId) {
        selectIntersection(event.data.intersectionId);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectIntersection]);

  const activeAmbulanceRoads = state.roads.filter((road) => road.ambulanceDetected).length;
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
            <div className="text-xs text-muted-foreground font-mono mb-1">ACTIVE EMERGENCY ROADS</div>
            <div className="text-2xl font-display font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {activeAmbulanceRoads}
            </div>
          </GlassPanel>
        </div>
      )}

      <GlassPanel className="p-4 md:p-6">
        {!selectedIntersection ? (
          <>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-bold">Live Traffic Intersection</h2>
                <p className="text-sm text-muted-foreground font-mono">
                  Click on the red floating markers at intersections to view 4-way dashcam feeds. Interactive 3D emergency vehicle routing with real-time traffic light control.
                </p>
              </div>
              <a
                href={simulationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-primary flex items-center gap-1 hover:text-white transition-colors whitespace-nowrap"
              >
                OPEN IN NEW TAB <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-black/20 border border-white/10 rounded-lg overflow-hidden relative" style={{ height: "560px" }}>
              {isSimLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-mono text-muted-foreground">Loading simulation...</p>
                  </div>
                </div>
              )}
              <iframe
                src={simulationUrl}
                className="w-full h-full"
                title="Live Traffic Intersection"
                onLoad={() => setIsSimLoading(false)}
                onError={() => setIsSimLoading(false)}
                style={{ border: "none" }}
                allow="accelerometer; gyroscope"
              />
            </div>
          </>
        ) : (
          <IntersectionDetailView
            intersection={selectedIntersection}
            roads={state.roads}
            onBack={backToMap}
            mlDetectionApiUrl={aiApiUrl}
          />
        )}
      </GlassPanel>
    </AppLayout>
  );
}