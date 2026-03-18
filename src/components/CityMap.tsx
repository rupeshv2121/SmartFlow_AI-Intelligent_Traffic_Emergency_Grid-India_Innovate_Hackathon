import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { LiveMapVehicle } from "@/hooks/use-smartflow";
import { useLiveIntersectionVideo } from "@/hooks/use-smartflow";
import type { Intersection, Road } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { memo, useCallback, useRef, useState } from "react";
import { CameraFeed } from "./CameraFeed";
import { GlassPanel } from "./GlassPanel";

interface CityMapProps {
  intersections: Intersection[];
  roads: Road[];
  activeRoute?: string[]; // Array of intersection IDs
  vehicles?: LiveMapVehicle[];
  enableZoomPan?: boolean;
  showRoadLabels?: boolean;
  performanceMode?: boolean; // For minimap or heavy-load scenarios
}

export const CityMap = memo(function CityMap({ 
  intersections = [], 
  roads = [], 
  activeRoute = [], 
  vehicles = [], 
  enableZoomPan = true, 
  showRoadLabels = false,
  performanceMode = false
}: CityMapProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showLegend, setShowLegend] = useState(!performanceMode); // Hide legend in performance mode
  const svgRef = useRef<SVGSVGElement>(null);
  const { data: videoData } = useLiveIntersectionVideo(selectedNode);

  // Memoize color computation
  const getDensityColor = useCallback((density: string, isActive: boolean = false) => {
    if (isActive) return "var(--success)"; // Green corridor
    switch (density) {
      case 'high': return "var(--destructive)";
      case 'medium': return "var(--warning)";
      case 'low': return "var(--primary)";
      default: return "var(--muted-foreground)";
    }
  }, []);

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (!enableZoomPan) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.5), 3));
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!enableZoomPan || scale === 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !enableZoomPan) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <>
      <div className="relative w-full aspect-square md:aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/10">
        {/* Background Grid */}
        <div className="absolute inset-0" 
             style={{ 
               backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
               backgroundSize: '5% 5%' 
             }} 
        />
        
        <svg 
          ref={svgRef}
          className={`absolute inset-0 w-full h-full ${enableZoomPan && scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
          viewBox="0 0 100 100" 
          preserveAspectRatio="xMidYMid meet"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            transform: `scale(${scale}) translate(${panX * 0.01}px, ${panY * 0.01}px)`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {/* Render Roads with Enhanced Visibility */}
          <defs>
            <filter id="roadGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Road background (for better visibility) */}
          {roads.map((road, i) => {
            const from = intersections.find(n => n.id === road.from);
            const to = intersections.find(n => n.id === road.to);
            if (!from || !to) return null;
            
            const isEmergencyRoute = activeRoute.includes(from.id) && activeRoute.includes(to.id);

            return (
              <g key={`road-bg-${i}`}>
                {/* Dark background for contrast */}
                <line 
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y} 
                  stroke="rgba(0,0,0,0.8)" 
                  strokeWidth={isEmergencyRoute ? 3 : 1.5}
                  strokeOpacity={0.9}
                />
              </g>
            );
          })}

          {/* Render Roads */}
          {roads.map((road, i) => {
            const from = intersections.find(n => n.id === road.from);
            const to = intersections.find(n => n.id === road.to);
            if (!from || !to) return null;
            
            const isEmergencyRoute = activeRoute.includes(from.id) && activeRoute.includes(to.id);
            const color = getDensityColor(road.density, isEmergencyRoute);
            const roadStroke = isEmergencyRoute ? 2 : 1.2;

            return (
              <g key={`road-${i}`} filter="url(#roadGlow)">
                {/* Main road line - ENHANCED VISIBILITY */}
                <line 
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y} 
                  stroke={color} 
                  strokeWidth={roadStroke}
                  strokeOpacity={1}
                  className="transition-all duration-500"
                  style={{ filter: `drop-shadow(0 0 2px ${color})` }}
                />
                
                {/* Road label (midpoint) */}
                {showRoadLabels && (
                  <text 
                    x={(from.x + to.x) / 2} 
                    y={(from.y + to.y) / 2 - 1} 
                    className="text-[1.5px] font-mono fill-white/70 text-anchor-middle pointer-events-none"
                    textAnchor="middle"
                  >
                    {road.density?.charAt(0).toUpperCase()}
                  </text>
                )}

                {/* Emergency corridor animation */}
                {isEmergencyRoute && (
                  <motion.line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={color}
                    strokeWidth={2.5}
                    initial={{ pathLength: 0, opacity: 0.8 }}
                    animate={{ pathLength: 1, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </g>
            );
          })}

          {/* Render live simulated vehicles */}
          {vehicles.map((vehicle) => {
            const isAmbulance = vehicle.id?.toString().includes('ambulance');
            
            // In performance mode, use static rendering (no animations)
            if (performanceMode) {
              return (
                <g
                  key={`vehicle-${vehicle.id}`}
                  className="pointer-events-none"
                  style={{ transform: `translate(${vehicle.x}px, ${vehicle.y}px)` }}
                >
                  {isAmbulance ? (
                    <>
                      <circle
                        r={1.2}
                        fill="hsl(var(--destructive))"
                        style={{ filter: "drop-shadow(0 0 6px rgba(255, 42, 42, 1)) drop-shadow(0 0 2px rgba(255, 42, 42, 0.8))" }}
                      />
                      <circle
                        r={2.5}
                        fill="none"
                        stroke="hsl(var(--destructive))"
                        strokeWidth={0.2}
                        opacity={0.5}
                      />
                    </>
                  ) : (
                    <>
                      <circle
                        r={0.75}
                        fill="hsl(var(--warning))"
                        style={{ filter: "drop-shadow(0 0 4px rgba(255, 184, 0, 0.85))" }}
                      />
                      <circle
                        r={1.5}
                        fill="none"
                        stroke="hsl(var(--warning))"
                        strokeWidth={0.15}
                        opacity={0.35}
                      />
                    </>
                  )}
                </g>
              );
            }

            // Normal mode with animations
            return (
              <g
                key={`vehicle-${vehicle.id}`}
                className="pointer-events-none"
                style={{ transform: `translate(${vehicle.x}px, ${vehicle.y}px)` }}
              >
                {isAmbulance ? (
                  <>
                    {/* Ambulance - Red with stronger glow */}
                    <motion.circle
                      r={1.2}
                      fill="hsl(var(--destructive))"
                      initial={{ scale: 0.8, opacity: 0.8 }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                      style={{ filter: "drop-shadow(0 0 6px rgba(255, 42, 42, 1)) drop-shadow(0 0 2px rgba(255, 42, 42, 0.8))" }}
                    />
                    {/* Ambulance markers */}
                    <circle
                      r={2.5}
                      fill="none"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={0.2}
                      opacity={0.5}
                    />
                    {/* A marker for ambulance */}
                    <text 
                      x={0} y={0.3} 
                      className="text-[1px] font-mono font-bold fill-white text-anchor-middle pointer-events-none"
                      textAnchor="middle"
                    >
                      A
                    </text>
                  </>
                ) : (
                  <>
                    {/* Regular vehicle - Yellow */}
                    <motion.circle
                      r={0.75}
                      fill="hsl(var(--warning))"
                      initial={{ scale: 0.8, opacity: 0.7 }}
                      animate={{ scale: [0.9, 1.25, 0.9], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      style={{ filter: "drop-shadow(0 0 4px rgba(255, 184, 0, 0.85))" }}
                    />
                    <circle
                      r={1.5}
                      fill="none"
                      stroke="hsl(var(--warning))"
                      strokeWidth={0.15}
                      opacity={0.35}
                    />
                  </>
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
                {performanceMode ? (
                  // Performance mode: Simple static rendering
                  <>
                    {/* Simple glow */}
                    <circle r={3} fill={color} opacity={0.15} />
                    
                    {/* Node core */}
                    <circle 
                      r={1.5} 
                      fill={color} 
                      style={{ filter: `drop-shadow(0 0 2px ${color})` }}
                    />
                  </>
                ) : (
                  // Normal mode with animations and hover effects
                  <>
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
                  </>
                )}
              </g>
            );
          })}
        </svg>
        
        {/* Zoom/Pan Controls Info */}
        {enableZoomPan && (
          <div className="absolute bottom-3 left-3 text-[10px] font-mono text-white/50 pointer-events-none">
            <div>╱ Scroll: Zoom</div>
            <div>╱ Drag: Pan</div>
          </div>
        )}
        
        {/* Legend */}
        {showLegend && (
          <div className="absolute top-4 left-4 bg-black/70 border border-white/20 rounded-lg p-3 text-[10px] font-mono space-y-2 pointer-events-auto cursor-pointer hover:bg-black/80 transition-colors" onClick={() => setShowLegend(false)}>
            <div className="text-xs font-bold text-white mb-2">LEGEND (click to hide)</div>
            
            {/* Vehicles */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-warning shadow-[0_0_4px_rgba(255,184,0,0.85)]"></div>
              <span>Regular Vehicle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive shadow-[0_0_6px_rgba(255,42,42,1)]"></div>
              <span>Ambulance (RED)</span>
            </div>
            
            {/* Roads */}
            <div className="border-t border-white/20 pt-2 mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-px bg-primary"></div>
                <span>Low Traffic</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-px bg-warning"></div>
                <span>Medium Traffic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-px bg-destructive"></div>
                <span>High Traffic</span>
              </div>
            </div>
            
            {/* Intersections */}
            <div className="border-t border-white/20 pt-2 mt-2">
              <div className="text-white/80">● = Intersections</div>
              <div className="text-white/60 text-[9px]">Click node for camera feed</div>
            </div>
          </div>
        )}
        
        {/* Show legend button */}
        {!showLegend && (
          <button 
            onClick={() => setShowLegend(true)}
            className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded text-[10px] font-mono text-white pointer-events-auto transition-colors"
            title="Show legend"
          >
            ?
          </button>
        )}
        
        {/* Zoom indicator */}
        {enableZoomPan && scale > 1 && (
          <div className="absolute top-3 right-3 text-xs font-mono bg-black/60 px-2 py-1 rounded border border-white/20 pointer-events-none">
            {(scale * 100).toFixed(0)}%
          </div>
        )}
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

});
