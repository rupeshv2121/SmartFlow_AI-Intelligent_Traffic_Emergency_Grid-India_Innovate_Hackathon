import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { GlassPanel } from "./GlassPanel";

export interface DetectedObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface CameraFeedProps {
  name: string;
  density: "low" | "medium" | "high";
  objects?: DetectedObject[];
  fps?: number;
  className?: string;
  simulateMovement?: boolean;
  priority?: number;
  waitingTime?: number;
  vehicleCount?: number;
}

export function CameraFeed({
  name,
  density,
  objects = [],
  fps = 30,
  className,
  simulateMovement = false,
  priority,
  waitingTime,
  vehicleCount
}: CameraFeedProps) {
  // If objects are provided via API, use them. 
  // Otherwise, if simulateMovement is true, generate random local ones.
  const [localObjects, setLocalObjects] = useState<DetectedObject[]>([]);

  useEffect(() => {
    if (!simulateMovement || objects.length > 0) return;

    const interval = setInterval(() => {
      setLocalObjects(prev => {
        // Move existing
        let next = prev.map(obj => ({
          ...obj,
          y: obj.y + (obj.type === 'Car' ? 2 : 1),
          x: obj.x + (Math.random() - 0.5) * 2
        })).filter(obj => obj.y < 100);

        // Add new occasionally
        if (Math.random() > 0.7 && next.length < 8) {
          next.push({
            id: Math.random().toString(),
            type: Math.random() > 0.8 ? 'Bus' : Math.random() > 0.6 ? 'Truck' : 'Car',
            x: 20 + Math.random() * 60,
            y: 0,
            width: 10 + Math.random() * 10,
            height: 15 + Math.random() * 15,
            confidence: 0.85 + Math.random() * 0.14
          });
        }
        return next;
      });
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [simulateMovement, objects, fps]);

  const displayObjects = objects.length > 0 ? objects : localObjects;

  const getObjectColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'car': return 'border-primary text-primary bg-primary/10';
      case 'bus': return 'border-warning text-warning bg-warning/10';
      case 'truck': return 'border-destructive text-destructive bg-destructive/10';
      case 'bike': return 'border-success text-success bg-success/10';
      default: return 'border-white text-white bg-white/10';
    }
  };

  const densityColor = {
    low: "text-success",
    medium: "text-warning",
    high: "text-destructive text-glow-danger"
  };

  return (
    <GlassPanel className={cn("relative overflow-hidden group border-white/5", className)}>
      {/* Simulated Camera Background */}
      <div className="absolute inset-0 bg-black/80" />
      
      {/* Perspective Grid for road feeling */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.2) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          transform: 'perspective(500px) rotateX(60deg) scale(2) translateY(-20%)',
          transformOrigin: 'top center'
        }}
      />
      
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-1 bg-primary/30 shadow-[0_0_10px_rgba(0,255,255,0.5)] animate-scanline absolute top-0 left-0" />
      </div>

      {/* Bounding Boxes */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence>
          {displayObjects.map((obj) => {
            const colorClasses = getObjectColor(obj.type);
            return (
              <motion.div
                key={obj.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  left: `${obj.x}%`, 
                  top: `${obj.y}%`,
                  width: `${obj.width}%`,
                  height: `${obj.height}%`
                }}
                exit={{ opacity: 0 }}
                transition={{ type: "tween", ease: "linear", duration: 1/fps }}
                className={cn("absolute border-2 rounded-sm shadow-[0_0_10px_currentColor]", colorClasses)}
              >
                <div className="absolute -top-5 left-0 bg-background/80 px-1 py-0.5 text-[8px] font-mono whitespace-nowrap rounded border border-inherit border-b-0 backdrop-blur-md">
                  {obj.type} {(obj.confidence * 100).toFixed(0)}%
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Overlay UI */}
      <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start bg-linear-to-b from-black/80 to-transparent pointer-events-none">
        <div>
          <div className="font-display font-semibold text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            {name}
          </div>
          <div className="text-xs font-mono text-white/70 flex gap-3 mt-1">
            <span>REC •</span>
            <span>{fps} FPS</span>
            <span className={densityColor[density]}>DENSITY: {density.toUpperCase()}</span>
          </div>

          {/* Algorithm Data - Priority & Waiting Time */}
          {(priority !== undefined || waitingTime !== undefined) && (
            <div className="mt-2 space-y-1">
              {priority !== undefined && (
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-primary/80">PRIORITY:</span>
                  <span className="text-primary font-bold">{priority.toFixed(2)}</span>
                </div>
              )}
              {waitingTime !== undefined && (
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-cyan-400/80">WAIT:</span>
                  <span className={cn(
                    "font-bold",
                    waitingTime > 180 ? "text-destructive animate-pulse" :
                    waitingTime > 60 ? "text-warning" :
                    "text-cyan-400"
                  )}>{waitingTime.toFixed(1)}s</span>
                </div>
              )}
              {vehicleCount !== undefined && (
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-white/70">VEHICLES:</span>
                  <span className="text-white font-bold">{vehicleCount}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded border border-primary/30 backdrop-blur-md">
          AI ACTIVE
        </div>
      </div>
      
      {/* Reticle corners */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary/50 pointer-events-none" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary/50 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary/50 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary/50 pointer-events-none" />
    </GlassPanel>
  );
}
