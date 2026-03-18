import { useQuery } from "@tanstack/react-query";
import {
  useGetActiveEmergencyCorridor,
  useGetCityHeatmap,
  useGetCongestionAnalytics,
  useGetDashboardStats,
  useGetEmergencyEvents,
  useGetIntersections,
  useGetIntersectionVideo,
  useGetLaneDensity,
  useGetSignalTiming,
  useGetTrafficDensity,
  useGetTrafficDensityHistory,
  useGetVehicleCounts,
} from "@workspace/api-client-react";

// Global refetch interval for live dashboard simulation (3 seconds)
const LIVE_INTERVAL = 3000;
const LIVE_VEHICLE_INTERVAL = 2000; // Increased from 1000ms to reduce re-renders
const MAP_PADDING = 8;
const MAP_SIZE = 100;

type RawSimVehicle = {
  id: string | number;
  x: number;
  y: number;
};

export type LiveMapVehicle = {
  id: string;
  x: number;
  y: number;
  rawX: number;
  rawY: number;
};

export type SimTrafficDensity = {
  level: "low" | "medium" | "high";
  label: "Low (Green)" | "Medium (Yellow)" | "High (Red)";
};

export function getTrafficDensityByCount(count: number): SimTrafficDensity {
  if (count < 50) {
    return { level: "low", label: "Low (Green)" };
  }

  if (count <= 100) {
    return { level: "medium", label: "Medium (Yellow)" };
  }

  return { level: "high", label: "High (Red)" };
}

function isRawSimVehicle(value: unknown): value is RawSimVehicle {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RawSimVehicle>;

  return (
    (typeof candidate.id === "string" || typeof candidate.id === "number") &&
    typeof candidate.x === "number" &&
    typeof candidate.y === "number"
  );
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) {
    return MAP_SIZE / 2;
  }

  const drawable = MAP_SIZE - MAP_PADDING * 2;
  return MAP_PADDING + ((value - min) / (max - min)) * drawable;
}

function normalizeVehiclesForMap(vehicles: RawSimVehicle[]): LiveMapVehicle[] {
  if (vehicles.length === 0) {
    return [];
  }

  const xValues = vehicles.map((vehicle) => vehicle.x);
  const yValues = vehicles.map((vehicle) => vehicle.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  return vehicles.map((vehicle) => ({
    id: String(vehicle.id),
    x: normalize(vehicle.x, minX, maxX),
    // Invert Y to map SUMO Cartesian coordinates into SVG coordinates.
    y: MAP_SIZE - normalize(vehicle.y, minY, maxY),
    rawX: vehicle.x,
    rawY: vehicle.y,
  }));
}

export function useLiveDashboardStats() {
  return useGetDashboardStats({
    query: { refetchInterval: LIVE_INTERVAL },
  });
}

export function useLiveTrafficHistory() {
  return useGetTrafficDensityHistory({
    query: { refetchInterval: LIVE_INTERVAL },
  });
}

export function useLiveHeatmap() {
  return useGetCityHeatmap({
    query: { refetchInterval: LIVE_INTERVAL },
  });
}

export function useLiveEmergencyEvents() {
  return useGetEmergencyEvents({
    query: { refetchInterval: LIVE_INTERVAL },
  });
}

export function useLiveVehicleCounts() {
  return useGetVehicleCounts({
    query: { refetchInterval: LIVE_INTERVAL },
  });
}

export function useLiveTrafficDensity() {
  return useGetTrafficDensity({
    query: { refetchInterval: LIVE_INTERVAL },
  });
}

export function useLiveLaneDensity() {
  return useGetLaneDensity({
    query: { refetchInterval: LIVE_INTERVAL },
  });
}

export function useLiveSignalTiming() {
  return useGetSignalTiming({
    query: { refetchInterval: LIVE_INTERVAL },
  });
}

export function useLiveCongestionAnalytics() {
  return useGetCongestionAnalytics({
    query: { refetchInterval: LIVE_INTERVAL },
  });
}

export function useLiveActiveCorridor() {
  return useGetActiveEmergencyCorridor({
    query: { refetchInterval: LIVE_INTERVAL },
  });
}

export function useLiveIntersections() {
  return useGetIntersections({
    query: { refetchInterval: LIVE_INTERVAL },
  });
}

export function useLiveIntersectionVideo(intersectionId: string | null) {
  return useGetIntersectionVideo(intersectionId || "", {
    query: {
      enabled: !!intersectionId,
      refetchInterval: 1000,
    },
  });
}

export function useLiveSimVehicles() {
  return useQuery<LiveMapVehicle[]>({
    queryKey: ["live-sim-vehicles"],
    refetchInterval: LIVE_VEHICLE_INTERVAL,
    initialData: [],
    queryFn: async () => {
      try {
        const response = await fetch("/vehicles");

        if (!response.ok) {
          throw new Error(`Vehicles endpoint error: ${response.status}`);
        }

        const body: unknown = await response.json();
        if (!Array.isArray(body)) {
          return [];
        }

        const vehicles = body.filter(isRawSimVehicle);
        return normalizeVehiclesForMap(vehicles);
      } catch (error) {
        console.warn("Failed to fetch live SUMO vehicles", error);
        return [];
      }
    },
  });
}
