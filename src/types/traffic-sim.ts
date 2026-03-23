export type VehicleType = "car" | "auto" | "bike" | "ambulance";

export type SignalState = "red" | "yellow" | "green";
export type SignalControllerPhase = "green" | "yellow";

export interface SimIntersection {
  id: string;
  name: string;
  density: "low" | "medium" | "high";
  x: number;
  y: number;
  vehicles: number;
}

export interface SimVehicle {
  id: string;
  type: VehicleType;
  progress: number;
  enteredZone: boolean;
  speed: number;
  length: number;
  width: number;
  laneOffset: number;
  isOutgoing: boolean;
}

export interface SimRoadState {
  id: string;
  label: string;
  signal: SignalState;
  signalTimeLeft: number;
  vehicles: SimVehicle[];
  vehicleCount: number;
  detectionCount: number;
  waitingTime: number;
  ambulanceDetected: boolean;
}

export interface SignalControllerState {
  activeRoadIndex: number;
  phase: SignalControllerPhase;
  timeLeft: number;
}

export interface TrafficSimState {
  intersections: SimIntersection[];
  selectedIntersectionId: string | null;
  roads: SimRoadState[];
  signalController: SignalControllerState;
}
