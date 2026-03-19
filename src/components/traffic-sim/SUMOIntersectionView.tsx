import type { SimRoadState } from "@/types/traffic-sim";

interface SUMOIntersectionViewProps {
  roads: SimRoadState[];
}

export function SUMOIntersectionView({ roads }: SUMOIntersectionViewProps) {
  const VIEW_W = 420;
  const VIEW_H = 300;
  const FRAME_PAD_X = 76;
  const FRAME_PAD_Y = 60;
  const CENTER_X = VIEW_W / 2;
  const CENTER_Y = VIEW_H / 2;
  const ROAD_HALF_WIDTH = 30;
  const HALF_INTERSECTION = 44;
  const APPROACH_START = 16;
  const STOP_LINE_Y = CENTER_Y - HALF_INTERSECTION;
   const VEHICLE_W = 10;
  const VEHICLE_H = 16;
  const STOP_PROGRESS = 0.85;
  const TURN_DELAY = 0.52;
  const TURN_RADIUS_FACTOR = 0.85;

  type TurnType = "left" | "straight" | "right";
  type LocalPose = { x: number; y: number; angleDeg: number };

  function vehicleColor(type: string) {
    if (type === "bus") return "#d97706";
    if (type === "bike") return "#374151";
    if (type === "ambulance") return "#f3f4f6";
    return "#4b5563";
  }

  function laneMagnitude(laneOffset: number) {
    return Math.abs(laneOffset) > 2 ? 18 : 10;
  }

  function rotatePoint(x: number, y: number, roadIndex: number) {
    const angle = (Math.PI / 2) * roadIndex;
    const dx = x - CENTER_X;
    const dy = y - CENTER_Y;
    return {
      x: CENTER_X + dx * Math.cos(angle) - dy * Math.sin(angle),
      y: CENTER_Y + dx * Math.sin(angle) + dy * Math.cos(angle),
    };
  }

  function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  function smoothStep(t: number) {
    const c = clamp(t, 0, 1);
    return c * c * (3 - 2 * c);
  }

  function headingFromVector(dx: number, dy: number) {
    return (Math.atan2(dy, dx) * 180) / Math.PI - 90;
  }

  function vehicleTurnType(vehicleId: string): TurnType {
    let hash = 0;
    for (let i = 0; i < vehicleId.length; i += 1) {
      hash = (hash * 31 + vehicleId.charCodeAt(i)) >>> 0;
    }

    const bucket = hash % 10;
    if (bucket <= 1) return "left";
    if (bucket <= 7) return "straight";
    return "right";
  }

  function quadBezierPoint(
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    t: number,
  ) {
    const u = 1 - t;
    return {
      x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    };
  }

  function quadBezierTangent(
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    t: number,
  ) {
    return {
      dx: 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
      dy: 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
    };
  }

  function incomingVehiclePose(progress: number, laneOffset: number, turnType: TurnType): LocalPose {
    const laneX = CENTER_X + laneOffset;
    const approachEndY = STOP_LINE_Y - 3;
    const t = clamp(progress, 0, 1);

    if (t <= STOP_PROGRESS) {
      const approachT = smoothStep(t / STOP_PROGRESS);
      const y = APPROACH_START + approachT * (approachEndY - APPROACH_START);
      return { x: laneX, y, angleDeg: 0 };
    }

    const insideRaw = clamp((t - STOP_PROGRESS) / (1 - STOP_PROGRESS), 0, 1);
    const insideT = smoothStep(insideRaw);

    if (turnType === "straight") {
      const y = lerp(approachEndY, VIEW_H - APPROACH_START, insideT);
      return { x: laneX, y, angleDeg: 0 };
    }

    if (turnType === "left") {
      const turnStartY = lerp(approachEndY, CENTER_Y + 8, TURN_DELAY);
      if (insideRaw < TURN_DELAY) {
        const preTurnT = smoothStep(insideRaw / TURN_DELAY);
        const y = lerp(approachEndY, turnStartY, preTurnT);
        return { x: laneX, y, angleDeg: 0 };
      }

      const turnT = smoothStep(clamp((insideRaw - TURN_DELAY) / (1 - TURN_DELAY), 0, 1));
      const pivotPhase = 0.55;
      const laneTargetY = CENTER_Y + laneOffset * 0.35;

      if (turnT < pivotPhase) {
        const t1 = smoothStep(turnT / pivotPhase);
        const y = lerp(turnStartY, laneTargetY, t1);
        const angleDeg = lerp(0, 90, t1);
        return { x: laneX, y, angleDeg };
      }

      const t2 = smoothStep((turnT - pivotPhase) / (1 - pivotPhase));
      const x = lerp(laneX, APPROACH_START - 8, t2);
      return { x, y: laneTargetY, angleDeg: 90 };
    }

    const turnStartY = lerp(approachEndY, CENTER_Y + 8, TURN_DELAY);
    if (insideRaw < TURN_DELAY) {
      const preTurnT = smoothStep(insideRaw / TURN_DELAY);
      const y = lerp(approachEndY, turnStartY, preTurnT);
      return { x: laneX, y, angleDeg: 0 };
    }

    const turnT = smoothStep(clamp((insideRaw - TURN_DELAY) / (1 - TURN_DELAY), 0, 1));
    const pivotPhase = 0.55;
    const laneTargetY = CENTER_Y - laneOffset * 0.35;

    if (turnT < pivotPhase) {
      const t1 = smoothStep(turnT / pivotPhase);
      const y = lerp(turnStartY, laneTargetY, t1);
      const angleDeg = lerp(0, -90, t1);
      return { x: laneX, y, angleDeg };
    }

    const t2 = smoothStep((turnT - pivotPhase) / (1 - pivotPhase));
    const x = lerp(laneX, VIEW_W - APPROACH_START + 8, t2);
    return { x, y: laneTargetY, angleDeg: -90 };
  }

  function outgoingVehiclePose(progress: number, laneOffset: number): LocalPose {
    const laneX = CENTER_X + laneOffset;
    const fromY = CENTER_Y - HALF_INTERSECTION + 4;
    const toY = APPROACH_START;
    const t = clamp(progress, 0, 1);
    const y = lerp(fromY, toY, t);
    return { x: laneX, y, angleDeg: 0 };
  }

  return (
    <div className="h-full rounded-lg border border-white/15 bg-black/35 p-4 flex flex-col">
      <div className="text-xs uppercase tracking-wide text-muted-foreground font-mono mb-3">
        Intersection Top View (Direction Check)
      </div>

      <div className="relative w-full flex-1 min-h-0 bg-gray-900 rounded-lg overflow-visible">
        <svg
          width="100%"
          height="100%"
          viewBox={`${-FRAME_PAD_X} ${-FRAME_PAD_Y} ${VIEW_W + FRAME_PAD_X * 2} ${VIEW_H + FRAME_PAD_Y * 2}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect width={VIEW_W} height={VIEW_H} fill="#4a7c4e" />

          {/* Base cross roads */}
          <rect x={CENTER_X - ROAD_HALF_WIDTH} y="0" width={ROAD_HALF_WIDTH * 2} height={VIEW_H} fill="#2a2a2a" />
          <rect x="0" y={CENTER_Y - ROAD_HALF_WIDTH} width={VIEW_W} height={ROAD_HALF_WIDTH * 2} fill="#2a2a2a" />

          {/* Intersection core */}
          <rect x={CENTER_X - HALF_INTERSECTION} y={CENTER_Y - HALF_INTERSECTION} width={HALF_INTERSECTION * 2} height={HALF_INTERSECTION * 2} fill="#1b1b1b" />

          {/* Center dividers */}
          <line x1={CENTER_X} y1="0" x2={CENTER_X} y2={VIEW_H} stroke="#ffd700" strokeWidth="2.4" strokeDasharray="8,8" />
          <line x1="0" y1={CENTER_Y} x2={VIEW_W} y2={CENTER_Y} stroke="#ffd700" strokeWidth="2.4" strokeDasharray="8,8" />

          {/* Junction check markers */}
          <line x1={CENTER_X - HALF_INTERSECTION - 8} y1={CENTER_Y - HALF_INTERSECTION} x2={CENTER_X + HALF_INTERSECTION + 8} y2={CENTER_Y - HALF_INTERSECTION} stroke="#e5e7eb" strokeWidth="2" strokeDasharray="5,5" />
          <line x1={CENTER_X - HALF_INTERSECTION - 8} y1={CENTER_Y + HALF_INTERSECTION} x2={CENTER_X + HALF_INTERSECTION + 8} y2={CENTER_Y + HALF_INTERSECTION} stroke="#e5e7eb" strokeWidth="2" strokeDasharray="5,5" />
          <line x1={CENTER_X - HALF_INTERSECTION} y1={CENTER_Y - HALF_INTERSECTION - 8} x2={CENTER_X - HALF_INTERSECTION} y2={CENTER_Y + HALF_INTERSECTION + 8} stroke="#e5e7eb" strokeWidth="2" strokeDasharray="5,5" />
          <line x1={CENTER_X + HALF_INTERSECTION} y1={CENTER_Y - HALF_INTERSECTION - 8} x2={CENTER_X + HALF_INTERSECTION} y2={CENTER_Y + HALF_INTERSECTION + 8} stroke="#e5e7eb" strokeWidth="2" strokeDasharray="5,5" />

          {Array.from({ length: 4 }).map((_, roadIndex) => {
            const road = roads[roadIndex];
            const signalColor = road?.signal === "red" ? "#ef4444" : road?.signal === "yellow" ? "#fbbf24" : road?.signal === "green" ? "#22c55e" : "#475569";

            return (
              <g key={`road-${roadIndex}`}>
                {/* Incoming stop line */}
                {(() => {
                  const p1 = rotatePoint(CENTER_X + 2, STOP_LINE_Y, roadIndex);
                  const p2 = rotatePoint(CENTER_X + ROAD_HALF_WIDTH, STOP_LINE_Y, roadIndex);
                  return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#ffffff" strokeWidth="2.5" />;
                })()}

                {/* Direction guides */}
                {(() => {
                  const a1 = rotatePoint(CENTER_X + 12, APPROACH_START + 2, roadIndex);
                  const a2 = rotatePoint(CENTER_X + 12, STOP_LINE_Y - 6, roadIndex);
                  const ap = rotatePoint(CENTER_X + 12, STOP_LINE_Y - 2, roadIndex);
                  const apL = rotatePoint(CENTER_X + 8, STOP_LINE_Y - 10, roadIndex);
                  const apR = rotatePoint(CENTER_X + 16, STOP_LINE_Y - 10, roadIndex);

                  const b1 = rotatePoint(CENTER_X - 12, STOP_LINE_Y + 8, roadIndex);
                  const b2 = rotatePoint(CENTER_X - 12, APPROACH_START + 8, roadIndex);
                  const bp = rotatePoint(CENTER_X - 12, APPROACH_START + 6, roadIndex);
                  const bpL = rotatePoint(CENTER_X - 8, APPROACH_START + 14, roadIndex);
                  const bpR = rotatePoint(CENTER_X - 16, APPROACH_START + 14, roadIndex);

                  return (
                    <>
                      <line x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y} stroke="#6db3ff" strokeWidth="2" strokeDasharray="4,4" />
                      <polygon points={`${ap.x},${ap.y} ${apL.x},${apL.y} ${apR.x},${apR.y}`} fill="#6db3ff" />

                      <line x1={b1.x} y1={b1.y} x2={b2.x} y2={b2.y} stroke="#ff9800" strokeWidth="2" strokeDasharray="4,4" />
                      <polygon points={`${bp.x},${bp.y} ${bpL.x},${bpL.y} ${bpR.x},${bpR.y}`} fill="#ff9800" />
                    </>
                  );
                })()}

                {/* Signal for incoming side */}
                {(() => {
                  const s = rotatePoint(CENTER_X + ROAD_HALF_WIDTH + 8, STOP_LINE_Y - 8, roadIndex);
                  return <circle cx={s.x} cy={s.y} r="5" fill={signalColor} />;
                })()}

                {(road?.vehicles ?? []).map((vehicle, idx) => {
                  const laneOffset = laneMagnitude(vehicle.laneOffset);
                  const turnType = vehicleTurnType(vehicle.id);
                  const localPose = vehicle.isOutgoing
                    ? outgoingVehiclePose(vehicle.progress, -laneOffset)
                    : incomingVehiclePose(vehicle.progress, laneOffset, turnType);

                  const p = rotatePoint(localPose.x, localPose.y, roadIndex);
                  const rotation = localPose.angleDeg + roadIndex * 90;

                  return (
                    <rect
                      key={`v-${roadIndex}-${idx}`}
                      x={p.x - VEHICLE_W / 2}
                      y={p.y - VEHICLE_H / 2}
                      width={VEHICLE_W}
                      height={VEHICLE_H}
                      fill={vehicleColor(vehicle.type)}
                      stroke={vehicle.type === "ambulance" ? "#dc2626" : "#666"}
                      strokeWidth="1"
                      rx="2"
                      transform={`rotate(${rotation} ${p.x} ${p.y})`}
                    />
                  );
                })}
              </g>
            );
          })}

          <text x={CENTER_X} y="16" fontSize="12" fill="#ffffff" textAnchor="middle" fontFamily="monospace">Lane 1</text>
          <text x={VIEW_W - 20} y={CENTER_Y + 4} fontSize="12" fill="#ffffff" textAnchor="middle" fontFamily="monospace">Lane 2</text>
          <text x={CENTER_X} y={VIEW_H - 8} fontSize="12" fill="#ffffff" textAnchor="middle" fontFamily="monospace">Lane 3</text>
          <text x="20" y={CENTER_Y + 4} fontSize="12" fill="#ffffff" textAnchor="middle" fontFamily="monospace">Lane 4</text>

          <rect x="10" y={VIEW_H - 22} width="10" height="10" fill="#6db3ff" rx="2" />
          <text x="26" y={VIEW_H - 13} fontSize="10" fill="#d1d5db" fontFamily="monospace">Incoming</text>
          <rect x="92" y={VIEW_H - 22} width="10" height="10" fill="#ff9800" rx="2" />
          <text x="108" y={VIEW_H - 13} fontSize="10" fill="#d1d5db" fontFamily="monospace">Outgoing</text>
        </svg>
      </div>
    </div>
  );
}
