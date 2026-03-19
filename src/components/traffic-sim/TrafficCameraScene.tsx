import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import type { SignalState, SimRoadState } from "@/types/traffic-sim";
import { IntersectionWorld, type IntersectionCameraPose } from "@/components/traffic-sim/Intersection3DEnvironment";

interface TrafficCameraSceneProps {
  roads: SimRoadState[];
  cameraIndex: number;
  cameraLabel: string;
}

const CAMERA_POSES: IntersectionCameraPose[] = [
  { position: [0, 26, 46], lookAt: [0, 1.4, -8] },
  { position: [-46, 24, 0], lookAt: [8, 1.4, 0] },
  { position: [0, 26, -46], lookAt: [0, 1.4, 8] },
  { position: [46, 24, 0], lookAt: [-8, 1.4, 0] },
];

function lampClass(lamp: SignalState, current: SignalState) {
  if (lamp === "red") {
    return current === lamp
      ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]"
      : "bg-red-950/70 border border-red-900/60";
  }
  if (lamp === "yellow") {
    return current === lamp
      ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]"
      : "bg-amber-900/65 border border-amber-800/60";
  }
  return current === lamp
    ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.9)]"
    : "bg-green-950/70 border border-green-900/60";
}

function signalBadgeClass(signal: SignalState) {
  if (signal === "green") {
    return "text-emerald-300 border-emerald-400/40 bg-emerald-500/15";
  }
  if (signal === "yellow") {
    return "text-amber-200 border-amber-300/40 bg-amber-500/15";
  }
  return "text-rose-200 border-rose-300/40 bg-rose-500/15";
}

function Scene({ roads, cameraPose }: { roads: SimRoadState[]; cameraPose: IntersectionCameraPose }) {
  return <IntersectionWorld roads={roads} cameraPose={cameraPose} />;
}

export function TrafficCameraScene({ roads, cameraIndex, cameraLabel }: TrafficCameraSceneProps) {
  const focusRoad = roads[cameraIndex] ?? roads[0];
  const cameraPose = CAMERA_POSES[cameraIndex] ?? CAMERA_POSES[0];
  const frozenRoadsRef = useRef<SimRoadState[]>(roads);

  useEffect(() => {
    // Only the active green feed keeps animating; other camera feeds stay visually paused.
    if (focusRoad?.signal === "green") {
      frozenRoadsRef.current = roads;
    }
  }, [focusRoad?.signal, roads]);

  const roadsForRender = focusRoad?.signal === "green" ? roads : frozenRoadsRef.current;
  const timestamp = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  if (!focusRoad) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-cyan-300/25 bg-slate-950 p-2 shadow-[0_0_0_1px_rgba(12,74,110,0.4),0_18px_38px_rgba(2,6,23,0.62)]" />
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-cyan-300/25 bg-slate-950 p-2 shadow-[0_0_0_1px_rgba(12,74,110,0.4),0_18px_38px_rgba(2,6,23,0.62)]">
      <div className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full border border-zinc-500/60 bg-zinc-800" />
      <div className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-zinc-500/60 bg-zinc-800" />
      <div className="absolute bottom-2 left-2 h-2.5 w-2.5 rounded-full border border-zinc-500/60 bg-zinc-800" />
      <div className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full border border-zinc-500/60 bg-zinc-800" />

      <div className="absolute left-3 right-3 top-3 z-30 flex items-center justify-between rounded-md border border-cyan-300/20 bg-slate-900/75 px-3 py-1.5 font-mono text-[11px] tracking-wide text-slate-200 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
          <span className="text-red-200">REC</span>
          <span className="text-slate-400">|</span>
          <span className="text-cyan-200">CTRL-CAM-{cameraIndex + 1}</span>
        </div>
        <span className="text-slate-300">{timestamp}</span>
      </div>

      <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between rounded-md border border-cyan-300/20 bg-slate-950/75 px-3 py-2 font-mono text-[11px] text-slate-200 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">FEED</span>
          <span className="font-semibold tracking-wide text-white">{cameraLabel}</span>
          <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${signalBadgeClass(focusRoad.signal)}`}>
            {focusRoad.signal.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <span>Queue {focusRoad.vehicles.length}</span>
          <span>Entered {focusRoad.vehicleCount}</span>
        </div>
      </div>

      <div className="absolute left-4 top-14 z-30 w-14.5 rounded-md border border-zinc-500/45 bg-zinc-900/80 p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <div className="flex flex-col items-center gap-1.5">
          <div className={`h-8 w-8 rounded-full ${lampClass("red", focusRoad.signal)}`} />
          <div className={`h-8 w-8 rounded-full ${lampClass("yellow", focusRoad.signal)}`} />
          <div className={`h-8 w-8 rounded-full ${lampClass("green", focusRoad.signal)}`} />
        </div>
      </div>

      <div className="relative h-full w-full overflow-hidden rounded-lg border border-cyan-200/20 bg-black">
        <Canvas
          shadows={false}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          dpr={[0.75, 1]}
          camera={{ position: cameraPose.position, fov: 34 }}
        >
          <Scene roads={roadsForRender} cameraPose={cameraPose} />
        </Canvas>

        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(148,163,184,0.07)_0px,rgba(148,163,184,0.07)_1px,transparent_1px,transparent_3px)]" />
        <div className="animate-scanline pointer-events-none absolute inset-0 bg-linear-to-b from-cyan-200/0 via-cyan-100/10 to-cyan-200/0" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(2,6,23,0.52)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(15,23,42,0.25)_0%,transparent_35%,transparent_65%,rgba(15,23,42,0.35)_100%)]" />
      </div>
    </div>
  );
}
