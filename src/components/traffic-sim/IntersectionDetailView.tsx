import { SUMOIntersectionView } from "@/components/traffic-sim/SUMOIntersectionView";
import { TrafficCameraScene } from "@/components/traffic-sim/TrafficCameraScene";
import { useTrafficSim } from "@/context/TrafficSimContext";
import type { SimIntersection, SimRoadState } from "@/types/traffic-sim";
import { ArrowLeft, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface IntersectionDetailViewProps {
  intersection: SimIntersection;
  roads: SimRoadState[];
  onBack: () => void;
  mlDetectionApiUrl?: string;
}

export function IntersectionDetailView({ intersection, roads, onBack, mlDetectionApiUrl = "http://localhost:8000" }: IntersectionDetailViewProps) {
  const emergencyActive = roads.some((road) => road.ambulanceDetected);
  const { updateLaneDetectionCount } = useTrafficSim();
  const [enableMLDetection, setEnableMLDetection] = useState(false);
  const [detectionCounts, setDetectionCounts] = useState<Map<number, number>>(new Map());
  const [boxedFrames, setBoxedFrames] = useState<Map<number, string>>(new Map());
  const [apiStatus, setApiStatus] = useState<"idle" | "checking" | "connected" | "error">("idle");
  const [requestCount, setRequestCount] = useState(0);
  const [lastPollTime, setLastPollTime] = useState<string>("-");
  const canvasRefsMap = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const processingRef = useRef<boolean>(false);
  const frameCounterRef = useRef<Map<number, number>>(new Map());
  const FRAME_SKIP = 8; // Process every 4th frame (75% reduction in inference calls)

  // Fetch detections from all cameras
  useEffect(() => {
    if (!enableMLDetection) {
      canvasRefsMap.current.clear();
      frameCounterRef.current.clear();
      setDetectionCounts(new Map());
      setBoxedFrames(new Map());
      setApiStatus("idle");
      setRequestCount(0);
      setLastPollTime("-");
      return;
    }

    const checkApiHealth = async () => {
      setApiStatus("checking");
      try {
        const response = await fetch(`${mlDetectionApiUrl}/health`);
        if (!response.ok) {
          setApiStatus("error");
          return;
        }
        setApiStatus("connected");
      } catch {
        setApiStatus("error");
      }
    };

    void checkApiHealth();

    const interval = setInterval(async () => {
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        const promises: Promise<void>[] = [];

        canvasRefsMap.current.forEach((canvas, cameraIndex) => {
          if (!canvas) return;

          // Increment frame counter for this camera
          const currentCount = frameCounterRef.current.get(cameraIndex) ?? 0;
          frameCounterRef.current.set(cameraIndex, currentCount + 1);

          // Only process detection if this is a frame we should process (every FRAME_SKIP frames)
          if (currentCount % FRAME_SKIP !== 0) {
            return; // Skip this frame, continue rendering last known good frame
          }

          const promise = (async () => {
            try {
              const imageData = canvas.toDataURL("image/jpeg", 0.7);
              const base64String = imageData.split(",")[1];

              const response = await fetch(`${mlDetectionApiUrl}/detect-annotated`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: base64String }),
              });

              if (!response.ok) return;

              const result = await response.json();
              if (result.success && Array.isArray(result.detections)) {
                setApiStatus("connected");
                setRequestCount((prev) => prev + 1);
                setLastPollTime(new Date().toLocaleTimeString("en-IN", { hour12: false }));

                setDetectionCounts((prev) => {
                  const newMap = new Map(prev);
                  const frameCount = result.detection_count ?? 0;
                  newMap.set(cameraIndex, frameCount);
                  updateLaneDetectionCount(cameraIndex, frameCount);
                  return newMap;
                });

                if (typeof result.annotated_image === "string" && result.annotated_image.length > 0) {
                  setBoxedFrames((prev) => {
                    const newMap = new Map(prev);
                    newMap.set(cameraIndex, `data:image/jpeg;base64,${result.annotated_image}`);
                    return newMap;
                  });
                }
              }
            } catch (e) {
              setApiStatus("error");
            }
          })();

          promises.push(promise);
        });

        await Promise.allSettled(promises);
      } finally {
        processingRef.current = false;
      }
    }, 350);

    return () => {
      clearInterval(interval);
      processingRef.current = false;
    };
  }, [enableMLDetection, mlDetectionApiUrl, updateLaneDetectionCount]);
  // const totalQueueVehicles = roads.reduce((sum, road) => sum + road.vehicles.length, 0);
  // const totalEnteredVehicles = roads.reduce((sum, road) => sum + road.vehicleCount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-white/20 bg-black/35 hover:bg-black/50 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back To City Map
        </button>

        <div className="text-right flex items-center gap-4">
          <div>
            <div className="text-xl font-display font-bold">{intersection.name}</div>
            <div className="text-xs font-mono text-muted-foreground">Intersection ID: {intersection.id}</div>
          </div>
          <button
            onClick={() => setEnableMLDetection(!enableMLDetection)}
            className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border font-medium text-sm transition-all ${
              enableMLDetection
                ? "border-purple-500/50 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                : "border-white/20 bg-black/35 text-slate-400 hover:bg-black/50"
            }`}
          >
            <Zap className="w-4 h-4" />
            {enableMLDetection ? "AI Detection ON" : "Enable AI Detection"}
          </button>
          {enableMLDetection && (
            <div
              className={`rounded px-2 py-1 text-[11px] font-mono border ${
                apiStatus === "connected"
                  ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
                  : apiStatus === "checking"
                    ? "text-amber-200 border-amber-500/40 bg-amber-500/10"
                    : "text-rose-200 border-rose-500/40 bg-rose-500/10"
              }`}
            >
              {apiStatus === "connected" ? "AI API: CONNECTED" : apiStatus === "checking" ? "AI API: CHECKING" : "AI API: ERROR"}
            </div>
          )}
        </div>
      </div>

      {/* Top Info Bar: AI Polls and Last Poll */}
      {enableMLDetection && (
        <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 px-4 py-3 text-[11px] font-mono text-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex gap-2">
                <span>AI Polls</span>
                <span className="text-purple-300 font-bold">{requestCount}</span>
              </div>
              <div className="flex gap-2">
                <span>Last Poll</span>
                <span className="text-purple-300 font-bold">{lastPollTime}</span>
              </div>
              <div className="flex gap-2">
                <span>API Status</span>
                <span className={apiStatus === "connected" ? "text-emerald-300 font-bold" : apiStatus === "checking" ? "text-amber-200 font-bold" : "text-rose-200 font-bold"}>
                  {apiStatus === "connected" ? "CONNECTED" : apiStatus === "checking" ? "CHECKING" : "ERROR"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* CCTV Camera Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roads.map((road, index) => (
            <div key={`camera-${road.id}`} className="h-75 relative">
              <div className="absolute inset-0 z-0">
                <TrafficCameraScene
                  roads={roads}
                  cameraIndex={index}
                  cameraLabel={`Lane ${index + 1}`}
                  showDetectionOverlay={enableMLDetection}
                  boxedFrameSrc={boxedFrames.get(index)}
                  ambulanceDetected={road.ambulanceDetected}
                  onCanvasReady={(canvas) => {
                    canvasRefsMap.current.set(index, canvas);
                  }}
                />
              </div>

              {enableMLDetection && (
                <div className="absolute top-2 right-2 z-20 rounded border border-cyan-400/40 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-mono text-cyan-100 pointer-events-none">
                  AI LIVE
                </div>
              )}
            </div>
          ))}
        </div>

        {/* SUMO-style 2D intersection overview */}
        <div className="h-85 md:h-107.5 lg:h-135 xl:h-155 2xl:h-175">
          <SUMOIntersectionView roads={roads} />
        </div>
      </div>
    </div>
  );
}