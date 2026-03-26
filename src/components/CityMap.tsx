import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLiveIntersectionVideo } from "@/hooks/use-smartflow";
import type { Intersection, Road } from "@/lib/api-client";
import { motion } from "framer-motion";
import { useState } from "react";
import { CameraFeed } from "./CameraFeed";
import { GlassPanel } from "./GlassPanel";

interface CityMapProps {
  intersections: Intersection[];
  roads: Road[];
  activeRoute?: string[]; // Array of intersection IDs
}

export function CityMap({ intersections = [], roads = [], activeRoute = [] }: CityMapProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const { data: videoData } = useLiveIntersectionVideo(selectedNode);

  const getDensityColor = (density: string, isActive: boolean = false) => {
    if (isActive) return "var(--success)"; // Green corridor
    switch (density) {
      case 'high': return "var(--destructive)";
      case 'medium': return "var(--warning)";
      case 'low': return "var(--primary)";
      default: return "var(--muted-foreground)";
    }
  };

  return (
    <>
      <div className="relative w-full aspect-square md:aspect-video rounded-xl overflow-hidden bg-black/40">
        {/* Background Grid */}
        <div className="absolute inset-0" 
             style={{ 
               backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
               backgroundSize: '5% 5%' 
             }} 
        />
        
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          {/* Render Roads */}
          {roads.map((road, i) => {
            const from = intersections.find(n => n.id === road.from);
            const to = intersections.find(n => n.id === road.to);
            if (!from || !to) return null;
            
            const isEmergencyRoute = activeRoute.includes(from.id) && activeRoute.includes(to.id);
            const color = getDensityColor(road.density, isEmergencyRoute);

            return (
              <g key={`road-${i}`}>
                <line 
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y} 
                  stroke={color} 
                  strokeWidth={isEmergencyRoute ? 1.5 : 0.5} 
                  strokeOpacity={0.6}
                  className="transition-all duration-500"
                />
                {isEmergencyRoute && (
                  <motion.line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={color}
                    strokeWidth={2}
                    initial={{ pathLength: 0, opacity: 0.8 }}
                    animate={{ pathLength: 1, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </g>
            );
          })}

          {/* Render Intersections */}
          {intersections.map((node) => {
            const isEmergencyNode = activeRoute.includes(node.id);
            const color = getDensityColor(node.density, isEmergencyNode);
            
            return (
              <g 
                key={node.id} 
                className="cursor-pointer group"
                onClick={() => setSelectedNode(node.id)}
                style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
              >
                {/* Glow behind node */}
                <circle r={3} fill={color} opacity={0.2} className="group-hover:opacity-40 transition-opacity" />
                
                {/* Node core */}
                <circle 
                  r={1.5} 
                  fill={color} 
                  className="transition-all duration-300"
                  style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                />
                
                {/* Pulsing ring for high density or emergency */}
                {(node.density === 'high' || isEmergencyNode) && (
                  <motion.circle
                    r={1.5}
                    fill="none"
                    stroke={color}
                    strokeWidth={0.5}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}

                {/* Hover label */}
                <text 
                  x={3} y={-3} 
                  className="text-[3px] font-mono fill-white/80 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <Dialog open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
        <DialogContent className="sm:max-w-175 bg-background border-primary/20 p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="font-display tracking-widest text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              LIVE FEED: {videoData?.intersectionName || 'Connecting...'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            {videoData ? (
              <CameraFeed 
                name={videoData.intersectionName}
                density={videoData.density}
                objects={videoData.detectedObjects}
                fps={videoData.fps}
                className="aspect-video w-full rounded-md border border-white/10"
              />
            ) : (
              <div className="aspect-video w-full bg-black/50 flex items-center justify-center text-muted-foreground font-mono text-sm border border-white/5 rounded-md">
                ESTABLISHING SECURE CONNECTION...
              </div>
            )}
            
            {videoData && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                <GlassPanel className="p-3 text-center">
                  <div className="text-xs text-muted-foreground font-mono mb-1">TOTAL VEHICLES</div>
                  <div className="text-xl font-display font-bold text-foreground">{videoData.vehicles}</div>
                </GlassPanel>
                <GlassPanel className="p-3 text-center">
                  <div className="text-xs text-muted-foreground font-mono mb-1">DENSITY</div>
                  <div className="text-xl font-display font-bold text-foreground uppercase">{videoData.density}</div>
                </GlassPanel>
                <GlassPanel className="p-3 text-center">
                  <div className="text-xs text-muted-foreground font-mono mb-1">RESOLUTION</div>
                  <div className="text-xl font-display font-bold text-foreground">{videoData.resolution}</div>
                </GlassPanel>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
