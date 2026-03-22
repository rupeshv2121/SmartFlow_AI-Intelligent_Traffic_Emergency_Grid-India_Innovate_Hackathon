import { IntersectionWorld, type IntersectionCameraPose } from "@/components/traffic-sim/Intersection3DEnvironment";
import type { SignalState, SimRoadState } from "@/types/traffic-sim";
import { Canvas } from "@react-three/fiber";

interface DetectionObject {
  type: string;
  class_name?: string;
  bbox?: number[];
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  confidence?: number;
}

interface AlgorithmConfig {
  baseTime: number;
  factor: number;
  minGreen: number;
  maxGreen: number;
  w1: number;
  w2: number;
  waitScale: number;
  starvationThreshold: number;
  maxWait?: number;
}

interface TrafficCameraSceneProps {
  roads: SimRoadState[];
  cameraIndex: number;
  cameraLabel: string;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  showDetectionOverlay?: boolean;
  detectionOverlay?: {
    detections: Array<DetectionObject>;
    frameWidth: number;
    frameHeight: number;
  };
  ambulanceDetected?: boolean;
  algorithmConfig?: AlgorithmConfig;
}

const CAMERA_POSES: IntersectionCameraPose[] = [
  { position: [0, 24, -46], lookAt: [0, 1.4, 20] },    // Lane 1: approach from +Z, rear-follow view
  { position: [46, 24, 0], lookAt: [-20, 1.4, 0] },    // Lane 2: approach from +X, rear-follow view
  { position: [0, 24, 46], lookAt: [0, 1.4, -20] },    // Lane 3: approach from -Z, rear-follow view
  { position: [-46, 24, 0], lookAt: [20, 1.4, 0] },    // Lane 4: approach from -X, rear-follow view
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

export function TrafficCameraScene({
  roads,
  cameraIndex,
  cameraLabel,
  onCanvasReady,
  showDetectionOverlay = false,
  detectionOverlay,
  ambulanceDetected = false,
  algorithmConfig,
}: TrafficCameraSceneProps) {
  const focusRoad = roads[cameraIndex] ?? roads[0];
  const cameraPose = CAMERA_POSES[cameraIndex] ?? CAMERA_POSES[0];

  // All cameras show live traffic - no freezing
  const roadsForRender = roads;

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

      <div className="absolute bottom-3 left-3 right-3 z-30 flex flex-col gap-1.5 rounded-md border border-cyan-300/20 bg-slate-950/75 px-3 py-2 font-mono text-[11px] text-slate-200 backdrop-blur-sm">
        {/* Top Row: Lane Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">FEED</span>
            <span className="font-semibold tracking-wide text-white">{cameraLabel}</span>
            <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${signalBadgeClass(focusRoad.signal)}`}>
              {focusRoad.signal.toUpperCase()}
            </span>
            {ambulanceDetected && (
              <span className="px-2 py-0.5 rounded border border-red-500/60 bg-red-500/20 text-red-300 text-[10px] font-semibold">🚑 AMBULANCE</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <span>Vehicles {focusRoad.detectionCount}</span>
            <span
              className={
                focusRoad.signal === "red"
                  ? "text-red-300"
                  : focusRoad.signal === "green"
                    ? "text-green-300"
                    : "text-amber-300"
              }
            >
              {focusRoad.signal === "red"
                ? `To Green ${focusRoad.signalTimeLeft.toFixed(1)}s`
                : `To Red ${focusRoad.signalTimeLeft.toFixed(1)}s`}
            </span>
          </div>
        </div>

        {/* Bottom Row: Algorithm Data */}
        <div className="flex items-center justify-between text-[10px] border-t border-cyan-300/15 pt-1.5">
          <div className="flex items-center gap-3">
            {/* Priority Calculation */}
            <div className="flex items-center gap-1.5">
              <span className="text-cyan-400/80">PRIORITY:</span>
              <span className="text-cyan-300 font-bold">{(() => {
                const W1 = algorithmConfig?.w1 ?? 1.0;
                const W2 = algorithmConfig?.w2 ?? 1.0;
                const WAIT_SCALE = algorithmConfig?.waitScale ?? 0.1;
                const MAX_WAIT = algorithmConfig?.maxWait ?? 300;
                const scaledWait = Math.min(focusRoad.waitingTime, MAX_WAIT) * WAIT_SCALE;
                const priority = focusRoad.detectionCount * W1 + scaledWait * W2;
                return priority.toFixed(2);
              })()}</span>
            </div>

            {/* Waiting Time */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">WAIT:</span>
              <span className={
                focusRoad.waitingTime > 180
                  ? "text-red-400 font-bold animate-pulse"
                  : focusRoad.waitingTime > 60
                    ? "text-amber-400 font-bold"
                    : "text-slate-300 font-bold"
              }>{focusRoad.waitingTime.toFixed(1)}s</span>
            </div>

            {/* Green Time Calculation */}
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400/80">GREEN:</span>
              <span className="text-emerald-300 font-bold">{(() => {
                const baseTime = algorithmConfig?.baseTime ?? 10;
                const factor = algorithmConfig?.factor ?? 2.0;
                const minGreen = algorithmConfig?.minGreen ?? 10;
                const maxGreen = algorithmConfig?.maxGreen ?? 60;
                let greenTime = baseTime + (focusRoad.detectionCount * factor);
                greenTime = Math.max(minGreen, Math.min(maxGreen, greenTime));
                return greenTime.toFixed(1);
              })()}s</span>
            </div>
          </div>

          {/* Algorithm Config Display */}
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-800/50 border border-cyan-300/10">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[9px]">F:</span>
              <span className="text-cyan-400 font-mono text-[9px]">{algorithmConfig?.factor?.toFixed(1) ?? "2.0"}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[9px]">W₁:</span>
              <span className="text-orange-400 font-mono text-[9px]">{algorithmConfig?.w1?.toFixed(1) ?? "1.0"}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[9px]">W₂:</span>
              <span className="text-purple-400 font-mono text-[9px]">{algorithmConfig?.w2?.toFixed(1) ?? "1.0"}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[9px]">BT:</span>
              <span className="text-green-400 font-mono text-[9px]">{algorithmConfig?.baseTime?.toFixed(0) ?? "10"}</span>
            </div>
          </div>
        </div>

        {/* Algorithm Formula Explanation */}
        <div className="text-[8px] text-slate-500 border-t border-cyan-300/10 pt-1 mt-1">
          <div className="flex justify-between">
            <div>
              <span className="text-orange-300">P</span> = ({focusRoad.detectionCount} × <span className="text-orange-400">{algorithmConfig?.w1?.toFixed(1) ?? "1.0"}</span>) + ({(Math.min(focusRoad.waitingTime, algorithmConfig?.maxWait ?? 300) * (algorithmConfig?.waitScale ?? 0.1)).toFixed(1)} × <span className="text-purple-400">{algorithmConfig?.w2?.toFixed(1) ?? "1.0"}</span>)
            </div>
            <div>
              <span className="text-emerald-300">G</span> = {algorithmConfig?.baseTime ?? "10"} + ({focusRoad.detectionCount} × <span className="text-cyan-400">{algorithmConfig?.factor?.toFixed(1) ?? "2.0"}</span>)
            </div>
          </div>
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
          gl={{ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
          dpr={[0.75, 1]}
          camera={{ position: cameraPose.position, fov: 42 }}
          onCreated={(state) => {
            const canvas = state.gl.domElement as HTMLCanvasElement;
            onCanvasReady?.(canvas);
          }}
        >
          <Scene roads={roadsForRender} cameraPose={cameraPose} />
        </Canvas>

        {showDetectionOverlay &&
          detectionOverlay &&
          detectionOverlay.frameWidth > 0 &&
          detectionOverlay.frameHeight > 0 &&
          detectionOverlay.detections?.map((detection, idx) => {
            // Handle both bbox array and individual x1,y1,x2,y2 properties
            const bbox = detection.bbox || [detection.x1 || 0, detection.y1 || 0, detection.x2 || 0, detection.y2 || 0];
            const [x1, y1, x2, y2] = bbox;

            // Skip invalid bounding boxes
            if (!x1 && !y1 && !x2 && !y2) {
              return null;
            }

            const left = `${(x1 / detectionOverlay.frameWidth) * 100}%`;
            const top = `${(y1 / detectionOverlay.frameHeight) * 100}%`;
            const width = `${((x2 - x1) / detectionOverlay.frameWidth) * 100}%`;
            const height = `${((y2 - y1) / detectionOverlay.frameHeight) * 100}%`;
            const isEmergency = detection.type === "emergency" || detection.class_name === "emergency";

            return (
              <div
                key={`det-${cameraIndex}-${idx}-${x1}-${y1}-${x2}-${y2}`}
                className={`absolute z-20 pointer-events-none border-2 ${
                  isEmergency ? "border-red-500" : "border-green-500"
                }`}
                style={{ left, top, width, height }}
              />
            );
          })}

        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(148,163,184,0.07)_0px,rgba(148,163,184,0.07)_1px,transparent_1px,transparent_3px)]" />
        <div className="animate-scanline pointer-events-none absolute inset-0 bg-linear-to-b from-cyan-200/0 via-cyan-100/10 to-cyan-200/0" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(2,6,23,0.52)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(15,23,42,0.25)_0%,transparent_35%,transparent_65%,rgba(15,23,42,0.35)_100%)]" />
      </div>
    </div>
  );
}
