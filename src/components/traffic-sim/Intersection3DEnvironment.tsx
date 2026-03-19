import { RealisticAmbulance } from "@/components/vehicles/RealisticAmbulance";
import { RealisticAuto } from "@/components/vehicles/RealisticAuto";
import { RealisticBike } from "@/components/vehicles/RealisticBike";
import { RealisticCar } from "@/components/vehicles/RealisticCar";
import type { SignalState, SimRoadState, SimVehicle, VehicleType } from "@/types/traffic-sim";
import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";

interface Intersection3DEnvironmentProps {
  roads: SimRoadState[];
}

export interface IntersectionCameraPose {
  position: [number, number, number];
  lookAt: [number, number, number];
}

export const INTERSECTION_CAMERA_POSES: IntersectionCameraPose[] = [
  { position: [42, 30, 42], lookAt: [0, 1.8, 0] },
  { position: [0, 26, -46], lookAt: [0, 1.4, -8] },
  { position: [46, 24, 0], lookAt: [8, 1.4, 0] },
  { position: [0, 26, 46], lookAt: [0, 1.4, 8] },
  { position: [-46, 24, 0], lookAt: [-8, 1.4, 0] },
];

const STOP_PROGRESS = 0.85;
const TURN_DELAY = 0.52;

const VEHICLE_STYLE: Record<
  VehicleType,
  {
    bodyColor: string;
    roofColor: string;
    accentColor: string;
    bodyScale: [number, number, number];
    roofScale: [number, number, number];
    roofOffset: [number, number, number];
    accentScale: [number, number, number];
    accentOffset: [number, number, number];
    windowScale: [number, number, number];
    windowOffset: [number, number, number];
    wheelRadius: number;
    wheelWidth: number;
    wheelX: number;
    wheelFrontZ: number;
    wheelRearZ: number;
  }
> = {
  car: {
    bodyColor: "#4b5563",
    roofColor: "#6b7280",
    accentColor: "#d1d5db",
    bodyScale: [1.04, 0.46, 1.02],
    roofScale: [0.66, 0.24, 0.56],
    roofOffset: [0, 0.34, -0.05],
    accentScale: [0.76, 0.03, 0.13],
    accentOffset: [0, 0.21, 0.46],
    windowScale: [0.5, 0.14, 0.35],
    windowOffset: [0, 0.39, -0.04],
    wheelRadius: 0.16,
    wheelWidth: 0.08,
    wheelX: 0.48,
    wheelFrontZ: 0.43,
    wheelRearZ: -0.38,
  },
  bus: {
    bodyColor: "#d97706",
    roofColor: "#92400e",
    accentColor: "#111827",
    bodyScale: [1.18, 0.62, 1.26],
    roofScale: [0.9, 0.2, 1.02],
    roofOffset: [0, 0.4, 0],
    accentScale: [0.9, 0.04, 0.24],
    accentOffset: [0, 0.22, 0.5],
    windowScale: [0.74, 0.14, 0.75],
    windowOffset: [0, 0.46, 0],
    wheelRadius: 0.2,
    wheelWidth: 0.1,
    wheelX: 0.56,
    wheelFrontZ: 0.56,
    wheelRearZ: -0.52,
  },
  bike: {
    bodyColor: "#374151",
    roofColor: "#1f2937",
    accentColor: "#a3e635",
    bodyScale: [0.48, 0.2, 0.72],
    roofScale: [0.2, 0.18, 0.15],
    roofOffset: [0, 0.25, -0.05],
    accentScale: [0.22, 0.04, 0.3],
    accentOffset: [0, 0.12, 0.18],
    windowScale: [0.01, 0.01, 0.01],
    windowOffset: [0, 0, 0],
    wheelRadius: 0.17,
    wheelWidth: 0.06,
    wheelX: 0.28,
    wheelFrontZ: 0.45,
    wheelRearZ: -0.45,
  },
  ambulance: {
    bodyColor: "#f3f4f6",
    roofColor: "#ffffff",
    accentColor: "#dc2626",
    bodyScale: [1.02, 0.56, 1.05],
    roofScale: [0.72, 0.24, 0.6],
    roofOffset: [0, 0.37, -0.02],
    accentScale: [0.96, 0.07, 0.14],
    accentOffset: [0, 0.52, 0.08],
    windowScale: [0.52, 0.14, 0.4],
    windowOffset: [0, 0.4, -0.04],
    wheelRadius: 0.17,
    wheelWidth: 0.09,
    wheelX: 0.5,
    wheelFrontZ: 0.45,
    wheelRearZ: -0.42,
  },
};

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

function lerpAngle(a: number, b: number, t: number) {
  let delta = b - a;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return a + delta * t;
}

function quadBezierPoint(
  p0: { x: number; z: number },
  p1: { x: number; z: number },
  p2: { x: number; z: number },
  t: number,
) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    z: u * u * p0.z + 2 * u * t * p1.z + t * t * p2.z,
  };
}

function quadBezierTangent(
  p0: { x: number; z: number },
  p1: { x: number; z: number },
  p2: { x: number; z: number },
  t: number,
) {
  return {
    dx: 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
    dz: 2 * (1 - t) * (p1.z - p0.z) + 2 * t * (p2.z - p1.z),
  };
}

function headingFromXZ(dx: number, dz: number) {
  return Math.atan2(dx, dz);
}

function vehicleTurnBucket(vehicleId: string) {
  let hash = 0;
  for (let i = 0; i < vehicleId.length; i += 1) {
    hash = (hash * 31 + vehicleId.charCodeAt(i)) >>> 0;
  }
  return hash % 10;
}

function vehicleTurnType(vehicleId: string): "left" | "straight" | "right" {
  const bucket = vehicleTurnBucket(vehicleId);
  if (bucket <= 1) return "left";
  if (bucket <= 7) return "straight";
  return "right";
}

interface VehiclePose {
  x: number;
  z: number;
  yaw: number;
}

function rotateXZ(x: number, z: number, angle: number) {
  return {
    x: x * Math.cos(angle) - z * Math.sin(angle),
    z: x * Math.sin(angle) + z * Math.cos(angle),
  };
}

function getLocalVehiclePose(vehicle: SimVehicle): VehiclePose {
  const laneMagnitude = Math.abs(vehicle.laneOffset) > 2 ? 5 : 3;

  if (vehicle.isOutgoing) {
    return {
      x: laneMagnitude,
      z: lerp(-8, 72, clamp(vehicle.progress, 0, 1)),
      yaw: 0,
    };
  }

  const x = -laneMagnitude;
  const approachStartZ = -68;
  // Keep the queue stopped near boundary edge instead of inside junction core.
  const approachEndZ = -12.6;
  const t = clamp(vehicle.progress, 0, 1);

  if (t <= STOP_PROGRESS) {
    return {
      x,
      z: lerp(approachStartZ, approachEndZ, smoothStep(t / STOP_PROGRESS)),
      yaw: 0,
    };
  }

  const insideRaw = clamp((t - STOP_PROGRESS) / (1 - STOP_PROGRESS), 0, 1);
  const insideT = smoothStep(insideRaw);
  const turnType = vehicleTurnType(vehicle.id);

  if (turnType === "straight") {
    return { x, z: lerp(approachEndZ, 52, insideT), yaw: 0 };
  }

  const turnStartZ = lerp(approachEndZ, -9.6, TURN_DELAY);

  if (insideRaw < TURN_DELAY) {
    return {
      x,
      z: lerp(approachEndZ, turnStartZ, smoothStep(insideRaw / TURN_DELAY)),
      yaw: 0,
    };
  }

  const turnT = smoothStep(clamp((insideRaw - TURN_DELAY) / (1 - TURN_DELAY), 0, 1));
  const laneTargetZ = laneMagnitude * 0.9;
  const targetYaw = turnType === "left" ? Math.PI / 2 : -Math.PI / 2;
  const targetX = turnType === "left" ? -56 : 56;
  const pivotZ = turnType === "left" ? laneTargetZ : -laneTargetZ;
  const pivotPhase = 0.55;

  if (turnT < pivotPhase) {
    const t1 = smoothStep(turnT / pivotPhase);
    const z1 = lerp(turnStartZ, pivotZ, t1);
    const yaw1 = lerpAngle(0, targetYaw, t1);
    return { x, z: z1, yaw: yaw1 };
  }

  const t2 = smoothStep((turnT - pivotPhase) / (1 - pivotPhase));
  const x2 = lerp(x, targetX, t2);
  return { x: x2, z: pivotZ, yaw: targetYaw };
}

function signalColor(current: SignalState, lamp: SignalState) {
  if (current === lamp) {
    if (lamp === "red") return "#ef4444";
    if (lamp === "yellow") return "#fbbf24";
    return "#22c55e";
  }
  return "#2f2f2f";
}

function CameraRig({ pose }: { pose: IntersectionCameraPose }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(pose.position[0], pose.position[1], pose.position[2]);
    camera.lookAt(pose.lookAt[0], pose.lookAt[1], pose.lookAt[2]);
    camera.updateProjectionMatrix();
  }, [camera, pose]);

  return null;
}

function VehicleMesh({ vehicle, simplified = false }: { vehicle: SimVehicle; simplified?: boolean }) {
  // Map vehicle types to realistic 3D models
  const vehicleType = vehicle.type as VehicleType;

  // Calculate scale based on vehicle dimensions
  const scaleMultiplier = simplified ? 0.8 : 1.0;
  const baseScale = Math.min(vehicle.width, vehicle.length) * scaleMultiplier;

  // Generate color variety for cars and bikes
  const carColors = [0x3366AA, 0xCC3333, 0x22AA55, 0xFF9900, 0x9933CC, 0x00CCCC,
                     0xFF6B9D, 0x4B5563, 0x1E3A8A, 0x991B1B, 0x065F46, 0x7C2D12];
  const bikeColors = [0xFF4500, 0x000000, 0x0000FF, 0xFF1493, 0x32CD32, 0xFFD700];

  // Use vehicle ID to consistently assign colors
  const colorIndex = parseInt(vehicle.id.slice(-2), 16);
  const carColor = carColors[colorIndex % carColors.length];
  const bikeColor = bikeColors[colorIndex % bikeColors.length];

  // Render the appropriate realistic vehicle based on type
  switch (vehicleType) {
    case "car":
      return (
        <RealisticCar
          position={[0, -0.38, 0]}
          color={carColor}
          scale={baseScale * 1.2}
          animated={!simplified}
        />
      );

    case "bike":
      return (
        <RealisticBike
          position={[0, -0.38, 0]}
          color={bikeColor}
          scale={baseScale * 1.0}
          animated={!simplified}
        />
      );

    case "ambulance":
      return (
        <RealisticAmbulance
          position={[0, -0.38, 0]}
          scale={baseScale * 1.2}
          animated={!simplified}
        />
      );

    case "bus":
      // Map bus type to auto-rickshaw
      return (
        <RealisticAuto
          position={[0, -0.38, 0]}
          scale={baseScale * 1.1}
          animated={!simplified}
        />
      );

    default:
      // Fallback to car if type is unknown
      return (
        <RealisticCar
          position={[0, -0.38, 0]}
          color={carColor}
          scale={baseScale * 1.2}
          animated={!simplified}
        />
      );
  }
}

function SignalHead({ signal, rotationY = 0 }: { signal: SignalState; rotationY?: number }) {
  const red = signalColor(signal, "red");
  const yellow = signalColor(signal, "yellow");
  const green = signalColor(signal, "green");

  return (
    <group rotation={[0, rotationY, 0]}>
      <mesh position={[0, 3.2, 0]}>
        <boxGeometry args={[0.5, 6.4, 0.5]} />
        <meshStandardMaterial color="#121212" metalness={0.55} roughness={0.4} />
      </mesh>
      <mesh position={[0, 6.45, 0.3]}>
        <boxGeometry args={[1.6, 2.5, 0.8]} />
        <meshStandardMaterial color="#030303" metalness={0.45} roughness={0.35} />
      </mesh>

      <mesh position={[0, 7.2, 0.66]}>
        <sphereGeometry args={[0.28, 20, 20]} />
        <meshStandardMaterial color={red} emissive={red} emissiveIntensity={signal === "red" ? 1.25 : 0.08} toneMapped={false} />
      </mesh>
      <mesh position={[0, 6.45, 0.66]}>
        <sphereGeometry args={[0.28, 20, 20]} />
        <meshStandardMaterial color={yellow} emissive={yellow} emissiveIntensity={signal === "yellow" ? 1.25 : 0.08} toneMapped={false} />
      </mesh>
      <mesh position={[0, 5.7, 0.66]}>
        <sphereGeometry args={[0.28, 20, 20]} />
        <meshStandardMaterial color={green} emissive={green} emissiveIntensity={signal === "green" ? 1.35 : 0.08} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Crosswalk({ rotationY = 0 }: { rotationY?: number }) {
  const stripes = Array.from({ length: 6 }, (_, i) => -5 + i * 1.8);

  return (
    <group rotation={[0, rotationY, 0]}>
      {stripes.map((x) => (
        <mesh key={`cw-${x}`} position={[x, 0.11, -8.6]}>
          <boxGeometry args={[1, 0.02, 3.1]} />
          <meshStandardMaterial color="#f4f5f7" emissive="#d8dde5" emissiveIntensity={0.24} />
        </mesh>
      ))}
    </group>
  );
}

function LaneMarks({ rotationY = 0 }: { rotationY?: number }) {
  const segments = Array.from({ length: 22 }, (_, i) => -58 + i * 5.2);

  return (
    <group rotation={[0, rotationY, 0]}>
      {segments.map((z) => (
        <mesh key={`lane-r-${z}`} position={[3.7, 0.1, z]}>
          <boxGeometry args={[0.3, 0.02, 2.7]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      {segments.map((z) => (
        <mesh key={`lane-l-${z}`} position={[-3.7, 0.1, z]}>
          <boxGeometry args={[0.3, 0.02, 2.7]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}

function Buildings() {
  const blocks: Array<{ x: number; z: number; w: number; h: number; d: number; color: string }> = [
    { x: -37, z: -36, w: 14, h: 22, d: 12, color: "#60758a" },
    { x: -16, z: -40, w: 12, h: 28, d: 11, color: "#7f8ea1" },
    { x: 16, z: -38, w: 11, h: 26, d: 10, color: "#8c7ca7" },
    { x: 35, z: -32, w: 16, h: 24, d: 12, color: "#70859a" },
    { x: -35, z: 36, w: 15, h: 18, d: 12, color: "#6f7990" },
    { x: -12, z: 38, w: 10, h: 24, d: 10, color: "#8e846e" },
    { x: 13, z: 40, w: 14, h: 20, d: 12, color: "#6f8b66" },
    { x: 36, z: 34, w: 12, h: 27, d: 11, color: "#7d8a94" },
  ];

  return (
    <>
      {blocks.map((block, index) => (
        <mesh key={`building-${index}`} position={[block.x, block.h / 2, block.z]}>
          <boxGeometry args={[block.w, block.h, block.d]} />
          <meshStandardMaterial color={block.color} roughness={0.86} metalness={0.08} />
        </mesh>
      ))}
    </>
  );
}

function Vehicles({ roads }: { roads: SimRoadState[] }) {
  const totalQueued = roads.reduce((sum, road) => sum + road.vehicles.length, 0);
  const useSimplifiedVehicles = totalQueued > 220;

  return (
    <>
      {roads.map((road, roadIndex) => {
        const roadAngle = roadIndex * (Math.PI / 2);
        return road.vehicles.map((vehicle) => {
          const local = getLocalVehiclePose(vehicle);
          const world = rotateXZ(local.x, local.z, roadAngle);

          return (
            <group
              key={vehicle.id}
              position={[world.x, 0.38, world.z]}
              rotation={[0, local.yaw + roadAngle, 0]}
            >
              <VehicleMesh vehicle={vehicle} simplified={useSimplifiedVehicles} />
            </group>
          );
        });
      })}
    </>
  );
}

function SignalHeads({ roads }: { roads: SimRoadState[] }) {
  return (
    <>
      {roads.map((road, roadIndex) => {
        const roadAngle = roadIndex * (Math.PI / 2);
        // Exactly one signal per approach, placed on the roadside shoulder.
        const sidePole = rotateXZ(13.2, -10.8, roadAngle);

        // Point each signal toward its own incoming lane traffic.
        const incomingViewPoint = rotateXZ(3, -30, roadAngle);
        const faceDx = incomingViewPoint.x - sidePole.x;
        const faceDz = incomingViewPoint.z - sidePole.z;
        const signalYaw = headingFromXZ(faceDx, faceDz);

        return (
          <group key={`sig-${road.id}`}>
            <group position={[sidePole.x, 0, sidePole.z]}>
              <SignalHead signal={road.signal} rotationY={signalYaw} />
            </group>
          </group>
        );
      })}
    </>
  );
}

export function IntersectionWorld({ roads, cameraPose = INTERSECTION_CAMERA_POSES[0] }: { roads: SimRoadState[]; cameraPose?: IntersectionCameraPose }) {
  return (
    <>
      <color attach="background" args={["#93a6b8"]} />

      <ambientLight intensity={1.05} />
      <directionalLight position={[26, 36, 16]} intensity={1.55} />
      <directionalLight position={[-18, 24, -22]} intensity={0.72} color="#d0e6ff" />
      <CameraRig pose={cameraPose} />

      <mesh position={[0, -0.25, 0]} receiveShadow>
        <boxGeometry args={[170, 0.3, 170]} />
        <meshStandardMaterial color="#2f7a35" roughness={0.95} />
      </mesh>

      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[18, 0.18, 140]} />
        <meshStandardMaterial color="#2e3440" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[140, 0.18, 18]} />
        <meshStandardMaterial color="#2e3440" roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[18, 0.12, 18]} />
        <meshStandardMaterial color="#242a33" roughness={0.9} />
      </mesh>

      {/* Strong center reference so orientation is always obvious. */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.18, 24]} />
        <meshStandardMaterial color="#e5e7eb" emissive="#d1d5db" emissiveIntensity={0.18} />
      </mesh>

      {Array.from({ length: 4 }).map((_, i) => {
        const rotationY = i * (Math.PI / 2);
        return <Crosswalk key={`cross-${i}`} rotationY={rotationY} />;
      })}

      {Array.from({ length: 4 }).map((_, i) => {
        const rotationY = i * (Math.PI / 2);
        return <LaneMarks key={`lane-${i}`} rotationY={rotationY} />;
      })}

      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.45, 0.03, 138]} />
        <meshStandardMaterial color="#f8d34c" emissive="#f8d34c" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[138, 0.03, 0.45]} />
        <meshStandardMaterial color="#f8d34c" emissive="#f8d34c" emissiveIntensity={0.2} />
      </mesh>

      <Buildings />
      <SignalHeads roads={roads} />
      <Vehicles roads={roads} />

      <Environment preset="city" />
    </>
  );
}

export function Intersection3DEnvironment({ roads }: Intersection3DEnvironmentProps) {
  const totalVehicles = roads.reduce((sum, road) => sum + road.vehicles.length, 0);
  const flowRate = roads.reduce((sum, road) => sum + road.vehicleCount, 0);
  const defaultPose = INTERSECTION_CAMERA_POSES[0];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-cyan-300/25 bg-slate-950 p-3 shadow-[0_0_0_1px_rgba(12,74,110,0.4),0_18px_38px_rgba(2,6,23,0.62)]">
      <div className="absolute left-3 top-3 z-20 rounded-md border border-emerald-300/25 bg-slate-900/78 px-3 py-2 font-mono text-[11px] text-slate-200 backdrop-blur-sm">
        <div className="font-semibold text-emerald-300">SYSTEM_READY</div>
        <div className="mt-1">FLOW_RATE: {flowRate}/MIN</div>
        <div>LIVE_QUEUE: {totalVehicles}</div>
        <div>MODE: NORMAL</div>
      </div>

      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-md border border-cyan-300/20 bg-slate-950/78 px-3 py-2 font-mono text-[11px] text-slate-200 backdrop-blur-sm">
        <span className="text-cyan-200">INTERSECTION_ALPHA</span>
        <span className="text-slate-500">|</span>
        <span>Vehicles {totalVehicles}</span>
      </div>

      <div className="relative h-full w-full overflow-hidden rounded-lg border border-cyan-200/25 bg-black">
        <Canvas
          shadows={false}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          dpr={[0.75, 1.2]}
          camera={{ position: defaultPose.position, fov: 40 }}
        >
          <IntersectionWorld roads={roads} cameraPose={defaultPose} />
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            enablePan={false}
            enableZoom={false}
            minDistance={55}
            maxDistance={55}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2.35}
            minAzimuthAngle={-Math.PI / 2.8}
            maxAzimuthAngle={Math.PI / 2.8}
            rotateSpeed={0.55}
            target={[0, 2, 0]}
          />
        </Canvas>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_56%,rgba(2,6,23,0.42)_100%)]" />
      </div>
    </div>
  );
}
