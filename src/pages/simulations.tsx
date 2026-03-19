import { AppLayout } from "@/components/layout/AppLayout";
import { GlassPanel } from "@/components/GlassPanel";
import { Boxes, ExternalLink } from "lucide-react";
import { useState } from "react";

export default function Simulations() {
  const [isLoading, setIsLoading] = useState(true);
  const simulationUrl = import.meta.env.VITE_SIMULATIONS_URL || "http://localhost:8081";
  const simulationPort = new URL(simulationUrl).port || "80";

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">TRAFFIC SIMULATIONS</h1>
        <p className="text-muted-foreground font-mono text-sm">3D GREEN CORRIDOR EMERGENCY ROUTING SIMULATOR</p>
      </div>

      <GlassPanel className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Boxes className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold">GREEN CORRIDOR SIMULATOR</h2>
              <p className="text-xs text-muted-foreground font-mono mt-1">Interactive 3D emergency vehicle routing demonstration</p>
            </div>
          </div>
          <a
            href={simulationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-primary flex items-center gap-1 hover:text-white transition-colors"
          >
            OPEN IN NEW TAB <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="bg-black/20 border border-white/10 rounded-lg overflow-hidden relative" style={{ height: "calc(100vh - 280px)" }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-mono text-muted-foreground">Loading simulation...</p>
                <p className="text-xs font-mono text-muted-foreground/60 mt-2">Make sure green-corridor-sim is running on port {simulationPort}</p>
              </div>
            </div>
          )}
          <iframe
            src={simulationUrl}
            className="w-full h-full"
            title="Green Corridor Simulation"
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            style={{ border: "none" }}
            allow="accelerometer; gyroscope"
          />
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground font-mono">
          <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
          <p>
            <span className="text-primary">TIP:</span> Use your mouse to orbit the camera. Click "DISPATCH AMBULANCE" to test the emergency corridor system.
          </p>
        </div>
      </GlassPanel>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassPanel className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <h3 className="font-display font-semibold text-sm">FEATURES</h3>
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground font-mono">
            <li>• Real-time traffic light control</li>
            <li>• Emergency vehicle detection</li>
            <li>• Automated corridor clearing</li>
            <li>• Civilian vehicle AI behavior</li>
          </ul>
        </GlassPanel>

        <GlassPanel className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <h3 className="font-display font-semibold text-sm">CONTROLS</h3>
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground font-mono">
            <li>• Left click + drag: Rotate camera</li>
            <li>• Scroll wheel: Zoom in/out</li>
            <li>• Right click + drag: Pan view</li>
            <li>• Dispatch button: Start simulation</li>
          </ul>
        </GlassPanel>

        <GlassPanel className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <h3 className="font-display font-semibold text-sm">STATUS</h3>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Simulation Server:</span>
              <span className={isLoading ? "text-warning" : "text-success"}>
                {isLoading ? "CONNECTING..." : "ONLINE"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Port:</span>
              <span className="text-white/80">{simulationPort}</span>
            </div>
          </div>
        </GlassPanel>
      </div>
    </AppLayout>
  );
}
