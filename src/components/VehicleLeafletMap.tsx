import { cn } from "@/lib/utils";
import L from "leaflet";
import "leaflet.heat";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";

const LeafletMapContainer: any = MapContainer;
const LeafletTileLayer: any = TileLayer;
const LeafletCircleMarker: any = CircleMarker;
const LeafletTooltip: any = Tooltip;

type RawVehicle = {
  id: string | number;
  lat?: number;
  lng?: number;
  x?: number;
  y?: number;
};

type VehicleMarker = {
  id: string;
  lat: number;
  lng: number;
};

type RawTrafficLight = {
  id: string;
  state: string;
  lat: number;
  lng: number;
};

type TrafficLightMarker = {
  id: string;
  state: string;
  lat: number;
  lng: number;
};

type CongestionLevel = "low" | "medium" | "high";

type SignalState = "GREEN" | "YELLOW" | "RED";

type SignalPlan = {
  green: number;
  yellow: number;
  red: number;
};

type HeatPoint = [number, number, number];

type VehiclesApiPayload =
  | RawVehicle[]
  | {
      total?: number;
      count?: number;
      vehicles?: RawVehicle[];
      lights?: RawTrafficLight[];
    };

interface VehicleLeafletMapProps {
  className?: string;
  endpoint?: string;
  pollIntervalMs?: number;
  maxVehicles?: number;
  center?: [number, number];
  zoom?: number;
}

const DEFAULT_CENTER: [number, number] = [28.6139, 77.209]; // Delhi

function getCongestionLevel(totalVehicles: number): CongestionLevel {
  if (totalVehicles < 50) {
    return "low";
  }

  if (totalVehicles <= 100) {
    return "medium";
  }

  return "high";
}

function getSignalPlan(totalVehicles: number): SignalPlan {
  if (totalVehicles > 100) {
    return { green: 70, yellow: 6, red: 35 };
  }

  if (totalVehicles >= 50) {
    return { green: 55, yellow: 5, red: 40 };
  }

  return { green: 40, yellow: 4, red: 45 };
}

function getNextSignalState(current: SignalState): SignalState {
  if (current === "GREEN") {
    return "YELLOW";
  }

  if (current === "YELLOW") {
    return "RED";
  }

  return "GREEN";
}

function getSignalDuration(state: SignalState, plan: SignalPlan): number {
  if (state === "GREEN") {
    return plan.green;
  }

  if (state === "YELLOW") {
    return plan.yellow;
  }

  return plan.red;
}

function getSignalStateClass(state: SignalState): string {
  if (state === "GREEN") {
    return "text-success";
  }

  if (state === "YELLOW") {
    return "text-warning";
  }

  return "text-destructive";
}

function TrafficHeatLayer({ points, enabled }: { points: HeatPoint[]; enabled: boolean }) {
  const map = useMap();
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!enabled || points.length === 0) {
      return;
    }

    const layer = (L as any).heatLayer(points, {
      radius: 28,
      blur: 20,
      maxZoom: 17,
      minOpacity: 0.35,
      gradient: {
        0.2: "#22c55e",
        0.5: "#facc15",
        0.8: "#ef4444",
      },
    });

    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [enabled, map, points]);

  return null;
}

function AutoFocusTraffic({ markers, enabled }: { markers: VehicleMarker[]; enabled: boolean }) {
  const map = useMap();
  const hasInitialFocusRef = useRef(false);

  useEffect(() => {
    if (!enabled || markers.length === 0) {
      return;
    }

    const bounds = (L as any).latLngBounds(
      markers.map((marker) => [marker.lat, marker.lng]),
    );
    if (!bounds.isValid()) {
      return;
    }

    if (!hasInitialFocusRef.current) {
      map.fitBounds(bounds.pad(0.3), {
        animate: true,
        duration: 0.7,
        maxZoom: 16,
      });
      hasInitialFocusRef.current = true;
      return;
    }

    map.panTo(bounds.getCenter(), {
      animate: true,
      duration: 0.4,
    });
  }, [enabled, map, markers]);

  return null;
}

function FocusSelectedVehicle({ markers, selectedId }: { markers: VehicleMarker[]; selectedId: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const selectedMarker = markers.find((marker) => marker.id === selectedId);
    if (!selectedMarker) {
      return;
    }

    map.flyTo([selectedMarker.lat, selectedMarker.lng], Math.max(map.getZoom(), 16), {
      animate: true,
      duration: 0.8,
    });
  }, [map, markers, selectedId]);

  return null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRawVehicle(value: unknown): value is RawVehicle {
  if (!value || typeof value !== "object") {
    return false;
  }

  const vehicle = value as Partial<RawVehicle>;
  const hasGeo = isFiniteNumber(vehicle.lat) && isFiniteNumber(vehicle.lng);
  const hasCartesian = isFiniteNumber(vehicle.x) && isFiniteNumber(vehicle.y);

  return (
    (typeof vehicle.id === "string" || typeof vehicle.id === "number") &&
    (hasGeo || hasCartesian)
  );
}

function isRawTrafficLight(value: unknown): value is RawTrafficLight {
  if (!value || typeof value !== "object") {
    return false;
  }

  const light = value as Partial<RawTrafficLight>;

  return (
    typeof light.id === "string" &&
    typeof light.state === "string" &&
    isFiniteNumber(light.lat) &&
    isFiniteNumber(light.lng)
  );
}

function extractVehicles(payload: VehiclesApiPayload): RawVehicle[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRawVehicle);
  }

  if (payload && Array.isArray(payload.vehicles)) {
    return payload.vehicles.filter(isRawVehicle);
  }

  return [];
}

function extractTrafficLights(payload: VehiclesApiPayload): RawTrafficLight[] {
  if (!Array.isArray(payload) && Array.isArray(payload.lights)) {
    return payload.lights.filter(isRawTrafficLight);
  }

  return [];
}

function extractTotalCount(payload: VehiclesApiPayload, fallbackCount: number): number {
  if (!Array.isArray(payload)) {
    if (isFiniteNumber(payload.total)) {
      return payload.total;
    }

    if (isFiniteNumber(payload.count)) {
      return payload.count;
    }
  }

  return fallbackCount;
}

function toMarkers(
  vehicles: RawVehicle[],
  center: [number, number],
  maxVehicles: number,
): VehicleMarker[] {
  const limitedVehicles = vehicles.slice(0, maxVehicles);

  if (limitedVehicles.length === 0) {
    return [];
  }

  const cartesianVehicles = limitedVehicles.filter(
    (vehicle) => isFiniteNumber(vehicle.x) && isFiniteNumber(vehicle.y),
  );

  // SUMO usually sends Cartesian coordinates; project them into a small viewport around Delhi.
  const xValues = cartesianVehicles.map((vehicle) => vehicle.x as number);
  const yValues = cartesianVehicles.map((vehicle) => vehicle.y as number);
  const minX = xValues.length > 0 ? Math.min(...xValues) : 0;
  const maxX = xValues.length > 0 ? Math.max(...xValues) : 0;
  const minY = yValues.length > 0 ? Math.min(...yValues) : 0;
  const maxY = yValues.length > 0 ? Math.max(...yValues) : 0;

  const latSpan = 0.12;
  const lngSpan = 0.18;

  return limitedVehicles.flatMap((vehicle) => {
    if (isFiniteNumber(vehicle.lat) && isFiniteNumber(vehicle.lng)) {
      return [{ id: String(vehicle.id), lat: vehicle.lat, lng: vehicle.lng }];
    }

    if (isFiniteNumber(vehicle.x) && isFiniteNumber(vehicle.y)) {
      const normalizedX = maxX === minX ? 0.5 : (vehicle.x - minX) / (maxX - minX);
      const normalizedY = maxY === minY ? 0.5 : (vehicle.y - minY) / (maxY - minY);

      return [
        {
          id: String(vehicle.id),
          lat: center[0] + (0.5 - normalizedY) * latSpan,
          lng: center[1] + (normalizedX - 0.5) * lngSpan,
        },
      ];
    }

    return [];
  });
}

function toTrafficLightMarkers(lights: RawTrafficLight[]): TrafficLightMarker[] {
  return lights.map((light) => ({
    id: light.id,
    state: light.state,
    lat: light.lat,
    lng: light.lng,
  }));
}

function getTrafficLightColor(state: string): { stroke: string; fill: string; label: string } {
  if (/[rR]/.test(state)) {
    return { stroke: "#b91c1c", fill: "#ef4444", label: "RED" };
  }

  if (/[yY]/.test(state)) {
    return { stroke: "#b45309", fill: "#facc15", label: "YELLOW" };
  }

  if (/[gG]/.test(state)) {
    return { stroke: "#166534", fill: "#22c55e", label: "GREEN" };
  }

  return { stroke: "#475569", fill: "#94a3b8", label: "UNKNOWN" };
}

export function VehicleLeafletMap({
  className,
  endpoint = "/api/vehicles",
  pollIntervalMs = 2000,
  maxVehicles = 20,
  center = DEFAULT_CENTER,
  zoom = 14,
}: VehicleLeafletMapProps) {
  const [markers, setMarkers] = useState<VehicleMarker[]>([]);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("--");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [autoFocusEnabled, setAutoFocusEnabled] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [trafficLights, setTrafficLights] = useState<TrafficLightMarker[]>([]);
  const [signalState, setSignalState] = useState<SignalState>("GREEN");
  const [signalSecondsLeft, setSignalSecondsLeft] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentMarkersRef = useRef<VehicleMarker[]>([]);

  const congestionLevel = useMemo(
    () => getCongestionLevel(totalVehicles),
    [totalVehicles],
  );

  const signalPlan = useMemo(
    () => getSignalPlan(totalVehicles),
    [totalVehicles],
  );

  const currentSignalDuration = useMemo(
    () => getSignalDuration(signalState, signalPlan),
    [signalPlan, signalState],
  );

  const markerStyle = useMemo(() => {
    if (congestionLevel === "low") {
      return {
        stroke: "#16a34a",
        fill: "#22c55e",
      };
    }

    if (congestionLevel === "medium") {
      return {
        stroke: "#d97706",
        fill: "#facc15",
      };
    }

    return {
      stroke: "#dc2626",
      fill: "#ef4444",
    };
  }, [congestionLevel]);

  const heatPoints = useMemo<HeatPoint[]>(() => {
    const intensity =
      congestionLevel === "high"
        ? 1
        : congestionLevel === "medium"
          ? 0.7
          : 0.45;

    return markers.map((marker) => [marker.lat, marker.lng, intensity]);
  }, [congestionLevel, markers]);

  const animateMarkers = useCallback((nextMarkers: VehicleMarker[]) => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (nextMarkers.length === 0) {
      currentMarkersRef.current = [];
      setMarkers([]);
      return;
    }

    const startMarkers = currentMarkersRef.current;
    if (startMarkers.length === 0) {
      currentMarkersRef.current = nextMarkers;
      setMarkers(nextMarkers);
      return;
    }

    const startById = new Map(startMarkers.map((marker) => [marker.id, marker]));
    const animationDurationMs = 900;
    const startedAt = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startedAt) / animationDurationMs, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const frameMarkers = nextMarkers.map((targetMarker) => {
        const startMarker = startById.get(targetMarker.id) ?? targetMarker;

        return {
          id: targetMarker.id,
          lat: startMarker.lat + (targetMarker.lat - startMarker.lat) * easedProgress,
          lng: startMarker.lng + (targetMarker.lng - startMarker.lng) * easedProgress,
        };
      });

      currentMarkersRef.current = frameMarkers;
      setMarkers(frameMarkers);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        animationFrameRef.current = null;
        currentMarkersRef.current = nextMarkers;
        setMarkers(nextMarkers);
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    if (signalSecondsLeft <= 0 || signalSecondsLeft > currentSignalDuration) {
      setSignalSecondsLeft(currentSignalDuration);
    }
  }, [currentSignalDuration, signalSecondsLeft]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSignalSecondsLeft((previousSeconds) => {
        if (previousSeconds > 1) {
          return previousSeconds - 1;
        }

        setSignalState((current) => getNextSignalState(current));
        return 0;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchVehicles = async () => {
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(endpoint, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Vehicles endpoint error: ${response.status}`);
        }

        const payload = (await response.json()) as VehiclesApiPayload;
        const vehicles = extractVehicles(payload);
        const lights = extractTrafficLights(payload);
        const nextMarkers = toMarkers(vehicles, center, maxVehicles);
        const nextLights = toTrafficLightMarkers(lights);
        const total = extractTotalCount(payload, vehicles.length);

        if (!isMounted) {
          return;
        }

        requestAnimationFrame(() => {
          if (!isMounted) {
            return;
          }

          animateMarkers(nextMarkers);
          setTrafficLights(nextLights);
          setTotalVehicles(total);
          setIsLoading(false);
          setError(null);
          setLastUpdated(new Date().toLocaleTimeString());
        });
      } catch (fetchError: unknown) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        if (!isMounted) {
          return;
        }

        setIsLoading(false);
        setError("Unable to fetch live vehicle data");
      }
    };

    void fetchVehicles();
    const intervalId = window.setInterval(() => {
      void fetchVehicles();
    }, pollIntervalMs);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      abortRef.current?.abort();

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [animateMarkers, center, endpoint, maxVehicles, pollIntervalMs]);

  return (
    <div
      className={cn(
        "relative h-105 w-full overflow-hidden rounded-xl border border-white/10",
        className,
      )}
    >
      <LeafletMapContainer
        center={center}
        zoom={zoom}
        preferCanvas={true}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <LeafletTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <TrafficHeatLayer points={heatPoints} enabled={showHeatmap} />
        <AutoFocusTraffic markers={markers} enabled={autoFocusEnabled && !selectedVehicleId} />
        <FocusSelectedVehicle markers={markers} selectedId={selectedVehicleId} />

        {trafficLights.map((light) => {
          const lightStyle = getTrafficLightColor(light.state);

          return (
            <LeafletCircleMarker
              key={`tls-${light.id}`}
              center={[light.lat, light.lng]}
              radius={7}
              pathOptions={{
                color: lightStyle.stroke,
                fillColor: lightStyle.fill,
                fillOpacity: 0.95,
                weight: 2,
              }}
            >
              <LeafletTooltip direction="top" offset={[0, -2]}>
                SIGNAL {light.id} | {lightStyle.label} | {light.state}
              </LeafletTooltip>
            </LeafletCircleMarker>
          );
        })}

        {markers.map((vehicle) => (
          <LeafletCircleMarker
            key={vehicle.id}
            center={[vehicle.lat, vehicle.lng]}
            radius={5}
            eventHandlers={{
              click: () => {
                setSelectedVehicleId(vehicle.id);
              },
            }}
            pathOptions={{
              color: markerStyle.stroke,
              fillColor: markerStyle.fill,
              fillOpacity: 0.82,
              weight: 1,
            }}
          >
            <LeafletTooltip direction="top" offset={[0, -2]}>
              {vehicle.id} | {congestionLevel.toUpperCase()}
            </LeafletTooltip>
          </LeafletCircleMarker>
        ))}
      </LeafletMapContainer>

      <div className="pointer-events-auto absolute right-3 top-3 flex items-center gap-2 rounded-md border border-white/20 bg-black/70 px-3 py-2 font-mono text-[11px] text-white/90 backdrop-blur-sm">
        <button
          type="button"
          className="rounded border border-white/20 px-2 py-1 text-[10px] hover:bg-white/10"
          onClick={() => setShowHeatmap((previous) => !previous)}
        >
          Heatmap: {showHeatmap ? "ON" : "OFF"}
        </button>
        <button
          type="button"
          className="rounded border border-white/20 px-2 py-1 text-[10px] hover:bg-white/10"
          onClick={() => setAutoFocusEnabled((previous) => !previous)}
        >
          Focus: {autoFocusEnabled ? "AUTO" : "OFF"}
        </button>
        {selectedVehicleId && (
          <button
            type="button"
            className="rounded border border-white/20 px-2 py-1 text-[10px] hover:bg-white/10"
            onClick={() => setSelectedVehicleId(null)}
          >
            Clear Selection
          </button>
        )}
      </div>

      <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-white/20 bg-black/70 px-3 py-2 font-mono text-[11px] text-white/90 backdrop-blur-sm">
        <div>Total Vehicles: {totalVehicles}</div>
        <div>Traffic Lights: {trafficLights.length}</div>
        <div>Rendered: {markers.length} / {maxVehicles}</div>
        <div>
          Congestion:
          <span
            className={cn(
              "ml-1 font-semibold uppercase",
              congestionLevel === "low"
                ? "text-success"
                : congestionLevel === "medium"
                  ? "text-warning"
                  : "text-destructive",
            )}
          >
            {congestionLevel}
          </span>
        </div>
        <div>
          Signal:
          <span className={cn("ml-1 font-semibold", getSignalStateClass(signalState))}>
            {signalState}
          </span>
          <span className="ml-1">({signalSecondsLeft}s)</span>
        </div>
        <div>
          Durations G/Y/R: {signalPlan.green}s / {signalPlan.yellow}s / {signalPlan.red}s
        </div>
        <div>Selected Focus: {selectedVehicleId ?? "AUTO CLUSTER"}</div>
        <div>Avg Speed: -- km/h</div>
        <div>Updated: {lastUpdated}</div>
      </div>

      {isLoading && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 mx-auto w-fit rounded-md border border-primary/30 bg-black/60 px-3 py-1 font-mono text-xs text-primary">
          Loading live vehicles...
        </div>
      )}

      {error && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 mx-auto w-fit rounded-md border border-destructive/40 bg-black/70 px-3 py-1 font-mono text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
