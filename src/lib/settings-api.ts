// Settings API client functions
import { customFetch } from "./api-client/custom-fetch";

export interface SystemSettings {
  aiModel: {
    architecture: "yolov8" | "yolov5" | "efficientdet";
    confidenceThreshold: number;
    processingInterval: number;
  };
  alerts: {
    congestionThreshold: number;
    lowSpeedThreshold: number;
    emergencyVehicleSensitivity: number;
    emailNotifications: boolean;
  };
  trafficControl: {
    adaptiveSignalTiming: boolean;
    maxGreenTime: number;
    minGreenTime: number;
    emergencyOverride: boolean;
    algorithm: {
      baseTime: number;
      factor: number;
      w1: number;
      w2: number;
      waitScale: number;
      starvationThreshold: number;
      maxWait: number;
    };
  };
  display: {
    refreshInterval: number;
    theme: "dark" | "light";
    showPredictions: boolean;
    autoExport: boolean;
  };
  lastUpdated: string;
  updatedBy: string;
}

export interface SettingsResponse {
  success: boolean;
  data: SystemSettings;
  message?: string;
  timestamp: string;
}

export interface SettingsUpdateRequest {
  aiModel?: Partial<SystemSettings["aiModel"]>;
  alerts?: Partial<SystemSettings["alerts"]>;
  trafficControl?: Partial<SystemSettings["trafficControl"]>;
  display?: Partial<SystemSettings["display"]>;
}

// Get all system settings
export async function getSystemSettings(): Promise<SettingsResponse> {
  return await customFetch("/api/settings");
}

// Update system settings
export async function updateSystemSettings(
  settings: SettingsUpdateRequest,
): Promise<SettingsResponse> {
  return await customFetch("/api/settings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  });
}

// Get AI model settings
export async function getAISettings(): Promise<{
  success: boolean;
  data: SystemSettings["aiModel"];
  timestamp: string;
}> {
  return await customFetch("/api/settings/ai");
}

// Get alert settings
export async function getAlertSettings(): Promise<{
  success: boolean;
  data: SystemSettings["alerts"];
  timestamp: string;
}> {
  return await customFetch("/api/settings/alerts");
}

// Get traffic control settings
export async function getTrafficSettings(): Promise<{
  success: boolean;
  data: SystemSettings["trafficControl"];
  timestamp: string;
}> {
  return await customFetch("/api/settings/traffic");
}

// Get display settings
export async function getDisplaySettings(): Promise<{
  success: boolean;
  data: SystemSettings["display"];
  timestamp: string;
}> {
  return await customFetch("/api/settings/display");
}

// Reset settings to defaults
export async function resetSettings(): Promise<SettingsResponse> {
  return await customFetch("/api/settings/reset", {
    method: "POST",
  });
}

// Update AI confidence threshold
export async function updateConfidenceThreshold(
  confidenceThreshold: number,
): Promise<{
  success: boolean;
  data: SystemSettings["aiModel"];
  message: string;
  timestamp: string;
}> {
  return await customFetch("/api/settings/ai/confidence", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ confidenceThreshold }),
  });
}
