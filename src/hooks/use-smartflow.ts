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
