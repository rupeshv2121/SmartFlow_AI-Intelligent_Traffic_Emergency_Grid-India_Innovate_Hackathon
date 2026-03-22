import type { Intersection } from "@/lib/api-client";
import { getSystemSettings } from "@/lib/settings-api";
import type {
  SignalControllerState,
  SignalState,
  SimIntersection,
  SimRoadState,
  SimVehicle,
  TrafficSimState,
  VehicleType,
} from "@/types/traffic-sim";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";

interface AlgorithmConfig {
  baseTime: number;
  factor: number;
  minGreen: number;
  maxGreen: number;
  w1: number;
  w2: number;
  waitScale: number;
  starvationThreshold: number;
  maxWait: number;
  emergencyOverride: boolean;
}

interface TrafficSimContextValue {
  state: TrafficSimState;
  selectedIntersection: SimIntersection | null;
  setIntersectionsFromApi: (intersections: Intersection[]) => void;
  updateLaneDetectionCount: (laneIndex: number, count: number) => void;
  updateLaneEmergencyDetected: (laneIndex: number, detected: boolean) => void;
  selectIntersection: (intersectionId: string) => void;
  backToMap: () => void;
  algorithmConfig: AlgorithmConfig;
}

interface RoadTransfer {
  targetRoadIndex: number;
  vehicle: SimVehicle;
}

interface RoadUpdateResult {
  road: SimRoadState;
  transfers: RoadTransfer[];
}

interface DynamicMetricsState {
  prevQueueLength: number;
  variationEma: number;
}

const GREEN_DURATION = 25;
const YELLOW_DURATION = 3;
const ENHANCED_BASE_TIME = 10;
const ENHANCED_FACTOR = 2.0;
const ENHANCED_MIN_GREEN = 10;
const ENHANCED_MAX_GREEN = 60;
const ENHANCED_W1 = 1.0;
const ENHANCED_W2 = 1.0;
const ENHANCED_WAIT_SCALE = 0.1;
const ENHANCED_MAX_WAIT = 300;
const ENHANCED_STARVATION_THRESHOLD = 180;
const ENABLE_ROAD_TRANSFERS = false;
const OUTGOING_ENTRY_ZONE = 0.12;
const OUTGOING_ENTRY_SPEED_FACTOR = 0.72;
const OUTGOING_CRUISE_SPEED_FACTOR = 0.78;
const TURNING_SPEED_FACTOR_GREEN = 1.0;
const TURNING_SPEED_FACTOR_NON_GREEN = 0.7;
const OUTGOING_TRANSFER_TRIGGER_PROGRESS = 0.995;

const DEFAULT_ALGORITHM_CONFIG: AlgorithmConfig = {
  baseTime: ENHANCED_BASE_TIME,
  factor: ENHANCED_FACTOR,
  minGreen: ENHANCED_MIN_GREEN,
  maxGreen: ENHANCED_MAX_GREEN,
  w1: ENHANCED_W1,
  w2: ENHANCED_W2,
  waitScale: ENHANCED_WAIT_SCALE,
  starvationThreshold: ENHANCED_STARVATION_THRESHOLD,
  maxWait: ENHANCED_MAX_WAIT,
  emergencyOverride: true,
};

// Critical positions (progress is 0 to 1, where 1 is fully through)
const STOP_LINE = 0.85;  // Where vehicles must stop (z = -1.8 in world coords)
const DETECTION_ZONE = 0.62; // Where we count vehicles as "entered"

const INCOMING_LANES = [1, 3];
const OUTGOING_LANES = [-3, -1];

const VEHICLE_CONFIG: Record<VehicleType, { speed: number; length: number; width: number }> = {
  car: { speed: 0.082, length: 1.9, width: 1 },
  bus: { speed: 0.062, length: 2.8, width: 1.2 },
  bike: { speed: 0.102, length: 1.2, width: 0.6 },
  ambulance: { speed: 0.124, length: 2, width: 1 },
};

const DENSITY_SPAWN_RATE = {
  low: 0.08,
  medium: 0.14,
  high: 0.22,
};

const SPAWN_ENTRY_PROGRESS = 0.01;
const SPAWN_BLOCK_PROGRESS = 0.2;
const SPAWN_MIN_HEADWAY = 0.16;
const INCOMING_MIN_GAP = 0.1;
const OUTGOING_MIN_GAP = 0.18;

const LANE_POSITIONS = [-3, -1, 1, 3];

function nearestLaneCenter(offset: number) {
  let nearest = LANE_POSITIONS[0];
  let best = Number.POSITIVE_INFINITY;
  for (const lane of LANE_POSITIONS) {
    const d = Math.abs(offset - lane);
    if (d < best) {
      best = d;
      nearest = lane;
    }
  }
  return nearest;
}

function isSpawnLaneBlocked(vehicles: SimVehicle[], laneCenter: number) {
  return vehicles.some(
    (vehicle) =>
      !vehicle.isOutgoing &&
      Math.abs(nearestLaneCenter(vehicle.laneOffset) - laneCenter) < 0.6 &&
      vehicle.progress <= SPAWN_BLOCK_PROGRESS,
  );
}

const TrafficSimContext = createContext<TrafficSimContextValue | null>(null);

function randomVehicleType(): VehicleType {
  const n = Math.random();
  if (n < 0.001) return "ambulance";
  if (n < 0.80) return "bus";
  if (n < 0.10) return "bike";
  return "car";
}

function createVehicle(): SimVehicle {
  const type = randomVehicleType();
  const cfg = VEHICLE_CONFIG[type];
  const baseLane = LANE_POSITIONS[Math.floor(Math.random() * LANE_POSITIONS.length)] ?? 1;
  return {
    id: `${type}-${Math.random().toString(16).slice(2)}`,
    type,
    progress: 0,
    enteredZone: false,
    speed: cfg.speed,
    length: cfg.length,
    width: cfg.width,
    laneOffset: baseLane + (Math.random() - 0.5) * 0.18,
    isOutgoing: false,
  };
}

function createVehicleInLane(laneCenter: number, isOutgoing = false): SimVehicle {
  const vehicle = createVehicle();
  vehicle.laneOffset = laneCenter + (Math.random() - 0.5) * 0.12;
  vehicle.isOutgoing = isOutgoing;
  return vehicle;
}

function createSeedVehicles(count: number): SimVehicle[] {
  const vehicles: SimVehicle[] = [];
  const laneCounts = new Map<number, number>();

  const incomingCount = count;

  for (let i = 0; i < incomingCount; i += 1) {
    const laneCenter = INCOMING_LANES[i % INCOMING_LANES.length] ?? 1;
    const vehicle = createVehicleInLane(laneCenter, false);
    const laneIndex = laneCounts.get(laneCenter) ?? 0;
    laneCounts.set(laneCenter, laneIndex + 1);

    // Seed with queue-like spacing so vehicles start one behind another in each lane.
    const progress = Math.min(0.8, SPAWN_ENTRY_PROGRESS + laneIndex * 0.18 + Math.random() * 0.015);
    vehicle.progress = progress;
    vehicle.enteredZone = progress >= DETECTION_ZONE;
    vehicles.push(vehicle);
  }

  return vehicles;
}

function createSignalController(): SignalControllerState {
  return {
    activeRoadIndex: 0,
    phase: "green",
    timeLeft: GREEN_DURATION,
  };
}

function createRoads(): SimRoadState[] {
  return ["Lane 1", "Lane 2", "Lane 3", "Lane 4"].map((label, index) => {
    const vehicles = createSeedVehicles(6 + Math.floor(Math.random() * 3));
    return {
      id: `road-${index + 1}`,
      label,
      signal: index === 0 ? "green" : "red",
      signalTimeLeft: index === 0 ? GREEN_DURATION : 0,
      vehicles,
      vehicleCount: 0,
      detectionCount: vehicles.filter((v) => !v.isOutgoing).length,
      waitingTime: index === 0 ? 0 : 5,
      ambulanceDetected: false,
    };
  });
}

function areAlgorithmConfigsEqual(a: AlgorithmConfig, b: AlgorithmConfig) {
  return (
    a.baseTime === b.baseTime &&
    a.factor === b.factor &&
    a.minGreen === b.minGreen &&
    a.maxGreen === b.maxGreen &&
    a.w1 === b.w1 &&
    a.w2 === b.w2 &&
    a.waitScale === b.waitScale &&
    a.starvationThreshold === b.starvationThreshold &&
    a.maxWait === b.maxWait &&
    a.emergencyOverride === b.emergencyOverride
  );
}

function deriveDynamicAlgorithmConfig(
  baseConfig: AlgorithmConfig,
  roads: SimRoadState[],
  metricsStateRef: MutableRefObject<DynamicMetricsState>,
): AlgorithmConfig {
  const queueLength = roads.reduce((sum, road) => sum + road.detectionCount, 0);
  const waitingTimes = roads.map((road) => road.waitingTime);
  const avgWaitingTime = waitingTimes.length > 0
    ? waitingTimes.reduce((sum, wait) => sum + wait, 0) / waitingTimes.length
    : 0;
  const maxWaitingTime = waitingTimes.length > 0 ? Math.max(...waitingTimes) : 0;

  const previousQueue = metricsStateRef.current.prevQueueLength;
  const instantaneousVariation = previousQueue > 0
    ? Math.abs(queueLength - previousQueue) / (previousQueue + 1)
    : 0;

  const trafficVariation = metricsStateRef.current.variationEma * 0.7 + instantaneousVariation * 0.3;
  metricsStateRef.current.prevQueueLength = queueLength;
  metricsStateRef.current.variationEma = trafficVariation;

  // Dynamic weights based on runtime conditions.
  let w1 = 1.5;
  let w2 = 1;

  // Case 2: Some roads waiting too long -> prioritize waiting.
  if (avgWaitingTime >= 45 || maxWaitingTime >= Math.min(180, baseConfig.starvationThreshold)) {
    w1 = 1;
    w2 = 2;
  }
  // Case 1: Heavy traffic not clearing fast -> prioritize density.
  else if (queueLength >= 24 || trafficVariation >= 0.35) {
    w1 = 2;
    w2 = 1;
  }

  // Dynamic green-time factor based on queue and traffic stability.
  let factor = 2;
  if (queueLength >= 28 || avgWaitingTime >= 40 || maxWaitingTime >= 120) {
    factor = 3;
  } else if (queueLength <= 8 && avgWaitingTime < 20 && trafficVariation < 0.2) {
    factor = 1;
  }

  return {
    ...baseConfig,
    w1,
    w2,
    factor,
  };
}

function getEmergencyRoadIndex(roads: SimRoadState[], preferredRoadIndex: number | null) {
  if (
    preferredRoadIndex !== null &&
    preferredRoadIndex >= 0 &&
    preferredRoadIndex < roads.length &&
    roads[preferredRoadIndex]?.ambulanceDetected
  ) {
    return preferredRoadIndex;
  }

  return roads.findIndex((road) => road.ambulanceDetected);
}

function createEmergencyOverrideController(
  controller: SignalControllerState,
  roads: SimRoadState[],
  emergencyRoadIndex: number,
  config: AlgorithmConfig,
): SignalControllerState {
  const emergencyDetectionCount = roads[emergencyRoadIndex]?.detectionCount ?? 0;
  const emergencyGreenTime = computeGreenDurationByDetections(emergencyDetectionCount, config);

  if (controller.activeRoadIndex === emergencyRoadIndex && controller.phase === "green") {
    return {
      ...controller,
      timeLeft: Math.max(controller.timeLeft, emergencyGreenTime),
    };
  }

  return {
    activeRoadIndex: emergencyRoadIndex,
    phase: "green",
    timeLeft: emergencyGreenTime,
  };
}

function computePriority(road: SimRoadState, config: AlgorithmConfig) {
  const scaledWait = Math.min(road.waitingTime, config.maxWait) * config.waitScale;
  return road.detectionCount * config.w1 + scaledWait * config.w2;
}

function selectNextLaneEnhanced(roads: SimRoadState[], currentActiveIndex: number, config: AlgorithmConfig) {
  const starvingCandidates = roads
    .map((road, index) => ({ road, index }))
    .filter(({ road }) => road.detectionCount > 0 && road.waitingTime >= config.starvationThreshold);

  if (starvingCandidates.length > 0) {
    return starvingCandidates.reduce((max, item) => (item.road.waitingTime > max.road.waitingTime ? item : max)).index;
  }

  const withTraffic = roads
    .map((road, index) => ({ road, index, priority: computePriority(road, config) }))
    .filter(({ road }) => road.detectionCount > 0);

  if (withTraffic.length === 0) {
    return (currentActiveIndex + 1) % roads.length;
  }

  return withTraffic.reduce((max, item) => (item.priority > max.priority ? item : max)).index;
}

function computeGreenDurationByDetections(detectionCount: number, config: AlgorithmConfig) {
  const dynamic = config.baseTime + detectionCount * config.factor;
  return Math.max(config.minGreen, Math.min(config.maxGreen, Math.round(dynamic)));
}

function estimateTimeUntilGreen(targetRoadIndex: number, controller: SignalControllerState, roads: SimRoadState[], config: AlgorithmConfig) {
  if (controller.activeRoadIndex === targetRoadIndex && controller.phase === "green") {
    return 0;
  }

  let elapsed = 0;
  let simController: SignalControllerState = { ...controller };
  let simRoads = roads.map((road) => ({ ...road }));

  // Small bounded simulation horizon is enough for 4-lane intersection.
  const maxTransitions = roads.length * 8;

  for (let step = 0; step < maxTransitions; step += 1) {
    if (simController.activeRoadIndex === targetRoadIndex && simController.phase === "green") {
      return elapsed;
    }

    if (simController.phase === "green") {
      const dt = simController.timeLeft + YELLOW_DURATION;
      elapsed += dt;

      simRoads = simRoads.map((road, index) => {
        if (index === simController.activeRoadIndex) {
          return { ...road, waitingTime: 0 };
        }
        return { ...road, waitingTime: Math.min(config.maxWait, road.waitingTime + dt) };
      });

      const nextRoadIndex = selectNextLaneEnhanced(simRoads, simController.activeRoadIndex, config);
      const nextGreenDuration = computeGreenDurationByDetections(simRoads[nextRoadIndex]?.detectionCount ?? 0, config);
      simController = {
        activeRoadIndex: nextRoadIndex,
        phase: "green",
        timeLeft: nextGreenDuration,
      };
      continue;
    }

    // If current phase is yellow, finish yellow then select next green.
    elapsed += simController.timeLeft;
    simRoads = simRoads.map((road, index) => {
      if (index === simController.activeRoadIndex) {
        return { ...road, waitingTime: 0 };
      }
      return { ...road, waitingTime: Math.min(config.maxWait, road.waitingTime + simController.timeLeft) };
    });

    const nextRoadIndex = selectNextLaneEnhanced(simRoads, simController.activeRoadIndex, config);
    const nextGreenDuration = computeGreenDurationByDetections(simRoads[nextRoadIndex]?.detectionCount ?? 0, config);
    simController = {
      activeRoadIndex: nextRoadIndex,
      phase: "green",
      timeLeft: nextGreenDuration,
    };
  }

  return elapsed;
}

function applySignalController(roads: SimRoadState[], controller: SignalControllerState, config: AlgorithmConfig): SimRoadState[] {
  return roads.map((road, index) => {
    const isActiveRoad = index === controller.activeRoadIndex;

    // CRITICAL: ONLY ONE ROAD can have green/yellow at a time
    // ALL other roads MUST be red - NO EXCEPTIONS
    let signal: SignalState;
    if (isActiveRoad) {
      // Active road: green or yellow based on phase
      signal = controller.phase === "green" ? "green" : "yellow";
    } else {
      // ALL other roads: ALWAYS RED
      signal = "red";
    }

    return {
      ...road,
      signal,
      signalTimeLeft: isActiveRoad
        ? controller.phase === "green"
          ? controller.timeLeft + YELLOW_DURATION
          : controller.timeLeft
        : estimateTimeUntilGreen(index, controller, roads, config),
    };
  });
}

function tickSignalController(controller: SignalControllerState, dt: number, laneCount: number): SignalControllerState {
  let timeLeft = controller.timeLeft - dt;

  // If time is not up, just count down
  if (timeLeft > 0) {
    return { ...controller, timeLeft };
  }

  // Time is up - transition phase
  if (controller.phase === "green") {
    // Green -> Yellow
    return {
      ...controller,
      phase: "yellow",
      timeLeft: YELLOW_DURATION,
    };
  }

  // Yellow -> Next road gets green
  const nextRoadIndex = (controller.activeRoadIndex + 1) % laneCount;
  return {
    activeRoadIndex: nextRoadIndex,
    phase: "green",
    timeLeft: GREEN_DURATION,
  };
}

function tickSignalControllerEnhanced(controller: SignalControllerState, dt: number, roads: SimRoadState[], config: AlgorithmConfig): SignalControllerState {
  const timeLeft = controller.timeLeft - dt;

  if (timeLeft > 0) {
    return { ...controller, timeLeft };
  }

  if (controller.phase === "green") {
    return {
      ...controller,
      phase: "yellow",
      timeLeft: YELLOW_DURATION,
    };
  }

  const nextRoadIndex = selectNextLaneEnhanced(roads, controller.activeRoadIndex, config);
  const nextGreenDuration = computeGreenDurationByDetections(roads[nextRoadIndex]?.detectionCount ?? 0, config);

  return {
    activeRoadIndex: nextRoadIndex,
    phase: "green",
    timeLeft: nextGreenDuration,
  };
}

function toSimIntersections(intersections: Intersection[]): SimIntersection[] {
  return intersections.map((intersection) => ({
    id: intersection.id,
    name: intersection.name,
    density: intersection.density,
    x: intersection.x,
    y: intersection.y,
    vehicles: intersection.vehicles,
  }));
}

function headwayJitter(vehicleId: string) {
  void vehicleId;
  return 0;
}

function vehicleTurnBucket(vehicleId: string) {
  let hash = 0;
  for (let i = 0; i < vehicleId.length; i += 1) {
    hash = (hash * 31 + vehicleId.charCodeAt(i)) >>> 0;
  }
  return hash % 10;
}

function selectOutgoingLane(vehicleId: string) {
  const bucket = vehicleTurnBucket(vehicleId);
  const laneCenter = OUTGOING_LANES[bucket % OUTGOING_LANES.length] ?? -1;
  return laneCenter + ((bucket % 5) - 2) * 0.02;
}

function transferStartProgress(vehicleId: string, overflowProgress: number) {
  const bucket = vehicleTurnBucket(vehicleId);
  // Continue from near outgoing lane entry after completing the turn.
  const baseProgress = bucket >= 8 ? 0.12 : 0.1;
  return Math.min(0.24, baseProgress + overflowProgress * 0.45);
}

function outgoingSpeedFactor(progress: number) {
  // Maintain near-constant speed after crossing; spacing logic still governs safety.
  if (progress <= OUTGOING_ENTRY_ZONE) return OUTGOING_ENTRY_SPEED_FACTOR;
  return OUTGOING_CRUISE_SPEED_FACTOR;
}

function routeTargetRoadIndex(sourceRoadIndex: number, vehicleId: string, laneCount: number) {
  const bucket = vehicleTurnBucket(vehicleId);
  // 0-1 left turn, 2-7 straight, 8-9 right turn.
  if (bucket <= 1) return (sourceRoadIndex + laneCount - 1) % laneCount;
  if (bucket <= 7) return (sourceRoadIndex + 2) % laneCount;
  return (sourceRoadIndex + 1) % laneCount;
}

function updateRoad(
  road: SimRoadState,
  roadIndex: number,
  laneCount: number,
  dt: number,
  density: SimIntersection["density"],
): RoadUpdateResult {
  const signal = road.signal;
  const spawnHeadwayByDensity: Record<SimIntersection["density"], number> = {
    low: 0.34,
    medium: 0.24,
    high: 0.18,
  };
  const spawnHeadway = spawnHeadwayByDensity[density];
  let vehicles = [...road.vehicles];
  const transfers: RoadTransfer[] = [];

  // Track vehicles entering the detection zone
  let enteredNow = 0;
  const markEntered = (vehicle: SimVehicle) => {
    if (!vehicle.enteredZone && vehicle.progress >= DETECTION_ZONE) {
      vehicle.enteredZone = true;
      enteredNow += 1;
    }
  };

  // Deterministic sequential spawning for incoming vehicles ONLY.
  // Vehicles are injected when lane entry headway permits, which avoids bursty/batch movement.
  for (const lane of INCOMING_LANES) {
    const nearestInLane = vehicles
      .filter((v) => !v.isOutgoing && Math.abs(nearestLaneCenter(v.laneOffset) - lane) < 0.6)
      .reduce<number>((min, v) => Math.min(min, v.progress), Number.POSITIVE_INFINITY);

    if (
      !isSpawnLaneBlocked(vehicles, lane) &&
      (!Number.isFinite(nearestInLane) || nearestInLane >= SPAWN_ENTRY_PROGRESS + spawnHeadway)
    ) {
      const newVehicle = createVehicleInLane(lane, false);
      newVehicle.progress = SPAWN_ENTRY_PROGRESS;
      vehicles.push(newVehicle);
    }
  }

  // Outgoing vehicles: NO spawning - only created from incoming transfers

  const incomingVehicles = vehicles.filter((v) => !v.isOutgoing);
  const outgoingVehicles = vehicles.filter((v) => v.isOutgoing);

  // Process incoming traffic (signal-controlled)
  const incomingLaneBuckets = new Map<number, SimVehicle[]>();
  for (const vehicle of incomingVehicles) {
    const lane = nearestLaneCenter(vehicle.laneOffset);
    const bucket = incomingLaneBuckets.get(lane) || [];
    bucket.push(vehicle);
    incomingLaneBuckets.set(lane, bucket);
  }

  for (const laneVehicles of incomingLaneBuckets.values()) {
    if (laneVehicles.length === 0) continue;

    laneVehicles.sort((a, b) => b.progress - a.progress);
    let vehicleAheadPosition = Infinity;

    for (const vehicle of laneVehicles) {
      const safeGap = INCOMING_MIN_GAP + vehicle.length * 0.01 + headwayJitter(vehicle.id);

      let targetSpeed = 0;
      let maxAllowedProgress = 1.0;
      const distToStop = STOP_LINE - vehicle.progress;

      if (signal === "green") {
        targetSpeed = vehicle.speed * TURNING_SPEED_FACTOR_GREEN;
      } else if (signal === "yellow") {
        targetSpeed = vehicle.speed * 0.8;
        if (distToStop > 0.02) maxAllowedProgress = STOP_LINE;
      } else {
        if (vehicle.progress >= STOP_LINE) {
          targetSpeed = vehicle.speed * TURNING_SPEED_FACTOR_NON_GREEN;
        } else {
          targetSpeed = vehicle.speed * 0.42;
          maxAllowedProgress = STOP_LINE - 0.02;
        }
      }

      let newProgress = vehicle.progress + targetSpeed * dt;
      if (vehicleAheadPosition !== Infinity) {
        newProgress = Math.min(newProgress, vehicleAheadPosition - safeGap);

        // If overlap already exists (spawn/transfer artifacts), resolve immediately.
        if (vehicle.progress > vehicleAheadPosition - safeGap) {
          vehicle.progress = Math.max(0, vehicleAheadPosition - safeGap);
        }
      }
      newProgress = Math.min(newProgress, maxAllowedProgress);
      vehicle.progress = Math.max(0, newProgress);
      vehicleAheadPosition = vehicle.progress;
      markEntered(vehicle);
    }
  }

  // Process outgoing traffic (free-flow away from intersection)
  const outgoingLaneBuckets = new Map<number, SimVehicle[]>();
  for (const vehicle of outgoingVehicles) {
    const lane = nearestLaneCenter(vehicle.laneOffset);
    const bucket = outgoingLaneBuckets.get(lane) || [];
    bucket.push(vehicle);
    outgoingLaneBuckets.set(lane, bucket);
  }

  for (const laneVehicles of outgoingLaneBuckets.values()) {
    if (laneVehicles.length === 0) continue;

    laneVehicles.sort((a, b) => b.progress - a.progress);
    let vehicleAheadPosition = Infinity;

    for (const vehicle of laneVehicles) {
      const safeGap = OUTGOING_MIN_GAP + vehicle.length * 0.008 + headwayJitter(vehicle.id);
      const speedFactor = outgoingSpeedFactor(vehicle.progress);
      let newProgress = vehicle.progress + vehicle.speed * speedFactor * dt;

      if (vehicleAheadPosition !== Infinity) {
        newProgress = Math.min(newProgress, vehicleAheadPosition - safeGap);

        // If overlap already exists, pull back behind the leader to restore spacing.
        if (vehicle.progress > vehicleAheadPosition - safeGap) {
          vehicle.progress = Math.max(0, vehicleAheadPosition - safeGap);
        }
      }

      vehicle.progress = Math.max(0, Math.min(newProgress, 1.0));
      vehicleAheadPosition = vehicle.progress;
    }
  }

  const retainedIncoming: SimVehicle[] = [];
  for (const vehicle of incomingVehicles) {
    // One-pass traversal: once a vehicle has fully crossed, remove it from this local model.
    if (vehicle.progress >= 1.0) {
      continue;
    }

    if (ENABLE_ROAD_TRANSFERS && vehicle.progress >= OUTGOING_TRANSFER_TRIGGER_PROGRESS) {
      const overflowProgress = Math.max(0, vehicle.progress - OUTGOING_TRANSFER_TRIGGER_PROGRESS);
      const transferred: SimVehicle = {
        ...vehicle,
        isOutgoing: true,
        progress: transferStartProgress(vehicle.id, overflowProgress),
        enteredZone: false,
        laneOffset: selectOutgoingLane(vehicle.id),
      };

      transfers.push({
        targetRoadIndex: routeTargetRoadIndex(roadIndex, vehicle.id, laneCount),
        vehicle: transferred,
      });
      continue;
    }
    retainedIncoming.push(vehicle);
  }

  const retainedOutgoing = outgoingVehicles.filter((v) => v.progress < 1.0);
  const finalVehicles = [...retainedIncoming, ...retainedOutgoing];

  return {
    road: {
      ...road,
      vehicles: finalVehicles,
      vehicleCount: road.vehicleCount + enteredNow,
      detectionCount: road.detectionCount,
      ambulanceDetected: road.ambulanceDetected,
    },
    transfers,
  };
}

function applyRoadTransfers(roads: SimRoadState[], transfers: RoadTransfer[]): SimRoadState[] {
  if (transfers.length === 0) return roads;

  const nextRoads = roads.map((road) => ({ ...road, vehicles: [...road.vehicles] }));

  for (const transfer of transfers) {
    const targetRoad = nextRoads[transfer.targetRoadIndex];
    if (!targetRoad) continue;

    const preferredLane = nearestLaneCenter(transfer.vehicle.laneOffset);
    const fallbackLane = preferredLane === OUTGOING_LANES[0] ? OUTGOING_LANES[1] : OUTGOING_LANES[0];
    const candidateLanes = [preferredLane, fallbackLane].filter((lane): lane is number => typeof lane === "number");

    let bestLane = preferredLane;
    let bestProgress = 0.01;

    for (const lane of candidateLanes) {
      const sameLaneOutgoing = targetRoad.vehicles.filter(
        (vehicle) => vehicle.isOutgoing && Math.abs(vehicle.laneOffset - lane) < 0.62,
      );

      const safeGap = SPAWN_MIN_HEADWAY + transfer.vehicle.length * 0.02;
      const nearestStartProgress = sameLaneOutgoing.length > 0
        ? Math.min(...sameLaneOutgoing.map((vehicle) => vehicle.progress))
        : Number.POSITIVE_INFINITY;

      const candidateProgress = Number.isFinite(nearestStartProgress)
        ? Math.max(SPAWN_ENTRY_PROGRESS, Math.min(transfer.vehicle.progress, nearestStartProgress - safeGap))
        : transfer.vehicle.progress;

      if (candidateProgress > bestProgress) {
        bestProgress = candidateProgress;
        bestLane = lane;
      }
    }

    // Never drop transfers. If this lane is saturated, keep the transfer close to
    // its computed continuation point instead of snapping to lane entry.
    if (bestProgress <= SPAWN_ENTRY_PROGRESS + SPAWN_MIN_HEADWAY * 0.8) {
      bestProgress = transfer.vehicle.progress;
    }

    targetRoad.vehicles.push({
      ...transfer.vehicle,
      progress: bestProgress,
      laneOffset: bestLane + (Math.random() - 0.5) * 0.05,
    });
  }

  return nextRoads.map((road) => ({
    ...road,
    ambulanceDetected: road.ambulanceDetected,
  }));
}

export function TrafficSimProvider({ children }: { children: ReactNode }) {
  const [algorithmConfig, setAlgorithmConfig] = useState<AlgorithmConfig>(DEFAULT_ALGORITHM_CONFIG);
  const settingsAlgorithmConfigRef = useRef<AlgorithmConfig>(DEFAULT_ALGORITHM_CONFIG);
  const emergencyPriorityLaneRef = useRef<number | null>(null);
  const dynamicMetricsRef = useRef<DynamicMetricsState>({
    prevQueueLength: 0,
    variationEma: 0,
  });
  const initialController = createSignalController();
  const [state, setState] = useState<TrafficSimState>({
    intersections: [],
    selectedIntersectionId: null,
    roads: applySignalController(createRoads(), initialController, DEFAULT_ALGORITHM_CONFIG),
    signalController: initialController,
  });

  useEffect(() => {
    let cancelled = false;

    const syncAlgorithmConfig = async () => {
      try {
        const response = await getSystemSettings();
        if (!response.success || cancelled) {
          return;
        }

        const traffic = response.data.trafficControl;
        const algo = traffic.algorithm;
        const nextConfig: AlgorithmConfig = {
          baseTime: algo.baseTime,
          factor: algo.factor,
          minGreen: traffic.minGreenTime,
          maxGreen: traffic.maxGreenTime,
          w1: algo.w1,
          w2: algo.w2,
          waitScale: algo.waitScale,
          starvationThreshold: algo.starvationThreshold,
          maxWait: algo.maxWait,
          emergencyOverride: traffic.emergencyOverride,
        };

        settingsAlgorithmConfigRef.current = nextConfig;
        setAlgorithmConfig((prev) => (areAlgorithmConfigsEqual(prev, nextConfig) ? prev : nextConfig));
      } catch {
        // Keep current config if settings API call fails.
      }
    };

    void syncAlgorithmConfig();
    const timer = window.setInterval(() => {
      void syncAlgorithmConfig();
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const setIntersectionsFromApi = useCallback((intersections: Intersection[]) => {
    setState((prev) => ({
      ...prev,
      intersections: toSimIntersections(intersections),
    }));
  }, []);

  const updateLaneDetectionCount = useCallback((laneIndex: number, count: number) => {
    setState((prev) => ({
      ...prev,
      roads: prev.roads.map((road, index) => {
        if (index !== laneIndex) return road;
        return {
          ...road,
          detectionCount: Math.max(0, count),
        };
      }),
    }));
  }, []);

  const updateLaneEmergencyDetected = useCallback((laneIndex: number, detected: boolean) => {
    if (detected) {
      emergencyPriorityLaneRef.current = laneIndex;
    } else if (emergencyPriorityLaneRef.current === laneIndex) {
      emergencyPriorityLaneRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      roads: prev.roads.map((road, index) => {
        if (index !== laneIndex) return road;
        return {
          ...road,
          ambulanceDetected: detected,
        };
      }),
    }));
  }, []);

  const selectIntersection = useCallback((intersectionId: string) => {
    setState((prev) => {
      // DON'T reset roads/controller - just change the selected ID
      // The simulation continues running in the background
      return {
        ...prev,
        selectedIntersectionId: intersectionId,
      };
    });
  }, []);

  const backToMap = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedIntersectionId: null,
    }));
  }, []);

  const selectedIntersection = useMemo(() => {
    if (!state.selectedIntersectionId) return null;

    // Try to find the intersection from API data
    const foundIntersection = state.intersections.find(
      (intersection) => intersection.id === state.selectedIntersectionId
    );

    if (foundIntersection) return foundIntersection;

    // Create a fallback intersection for simulation-generated IDs
    const intersectionNames: Record<string, string> = {
      'main-intersection': 'Main Intersection',
      'intersection-east-1': 'East Intersection 1',
      'intersection-west-1': 'West Intersection 1',
      'intersection-north-1': 'North Intersection 1',
      'intersection-south-1': 'South Intersection 1',
    };

    return {
      id: state.selectedIntersectionId,
      name: intersectionNames[state.selectedIntersectionId] || state.selectedIntersectionId,
      density: 'medium' as const,
      x: 0,
      y: 0,
      vehicles: 0,
    };
  }, [state.intersections, state.selectedIntersectionId]);

  // ============================================================================
  // CONTINUOUS SIMULATION - Runs for ALL intersections, always
  // ============================================================================
  useEffect(() => {
    let rafId = 0;
    let last = performance.now();
    let accumulator = 0;
    const fixedStep = 1 / 60;
    const maxSubSteps = 3;

    const animate = (now: number) => {
      const frameDt = Math.min(0.2, (now - last) / 1000);
      last = now;
      accumulator += frameDt;

      const availableSteps = Math.floor(accumulator / fixedStep);
      const steps = Math.min(maxSubSteps, availableSteps);
      if (steps > 0) {
        let frameConfig: AlgorithmConfig | null = null;
        setState((prev) => {
          let next = prev;
          for (let i = 0; i < steps; i += 1) {
            const baseConfig = settingsAlgorithmConfigRef.current;
            const emergencyRoadIndex = baseConfig.emergencyOverride
              ? getEmergencyRoadIndex(next.roads, emergencyPriorityLaneRef.current)
              : -1;

            // Emergency mode: pause normal adaptive lane algorithm and force ambulance corridor.
            const cfg = emergencyRoadIndex >= 0
              ? baseConfig
              : deriveDynamicAlgorithmConfig(baseConfig, next.roads, dynamicMetricsRef);

            frameConfig = cfg;
            const currentSelected = next.intersections.find((item) => item.id === next.selectedIntersectionId);
            const roadsWithWait = next.roads.map((road, index) => {
              const isActive = index === next.signalController.activeRoadIndex;
              if (isActive && next.signalController.phase === "green") {
                return { ...road, waitingTime: 0 };
              }
              return { ...road, waitingTime: Math.min(cfg.maxWait, road.waitingTime + fixedStep) };
            });

            const nextController = emergencyRoadIndex >= 0
              ? createEmergencyOverrideController(next.signalController, roadsWithWait, emergencyRoadIndex, cfg)
              : tickSignalControllerEnhanced(next.signalController, fixedStep, roadsWithWait, cfg);
            const roadsWithSignals = applySignalController(roadsWithWait, nextController, cfg);
            const density = currentSelected?.density || "medium";

            const laneCount = roadsWithSignals.length || 4;
            const roadUpdates = roadsWithSignals.map((road, index) => updateRoad(road, index, laneCount, fixedStep, density));
            const updatedRoads = roadUpdates.map((result) => result.road);
            const transfers = roadUpdates.flatMap((result) => result.transfers);

            next = {
              ...next,
              signalController: nextController,
              roads: applyRoadTransfers(updatedRoads, transfers),
            };
          }
          return next;
        });

        const resolvedFrameConfig = frameConfig;
        if (resolvedFrameConfig) {
          setAlgorithmConfig((prev) =>
            areAlgorithmConfigsEqual(prev, resolvedFrameConfig) ? prev : resolvedFrameConfig,
          );
        }

        accumulator -= steps * fixedStep;
      }

      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(rafId);
  }, []); // No dependencies - runs continuously

  const value = useMemo<TrafficSimContextValue>(
    () => ({
      state,
      selectedIntersection,
      setIntersectionsFromApi,
      updateLaneDetectionCount,
      updateLaneEmergencyDetected,
      selectIntersection,
      backToMap,
      algorithmConfig,
    }),
    [state, selectedIntersection, setIntersectionsFromApi, updateLaneDetectionCount, updateLaneEmergencyDetected, selectIntersection, backToMap, algorithmConfig],
  );

  return <TrafficSimContext.Provider value={value}>{children}</TrafficSimContext.Provider>;
}

export function useTrafficSim() {
  const context = useContext(TrafficSimContext);
  if (!context) {
    throw new Error("useTrafficSim must be used inside TrafficSimProvider");
  }
  return context;
}
