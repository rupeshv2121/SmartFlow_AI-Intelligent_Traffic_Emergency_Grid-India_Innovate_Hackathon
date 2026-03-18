import { CityMap } from "@/components/CityMap";
import { getTrafficDensityByCount, useLiveIntersections, useLiveSimVehicles } from "@/hooks/use-smartflow";
import { cn } from "@/lib/utils";
import {
  Ambulance,
  Hexagon,
  LayoutDashboard,
  LineChart,
  Settings,
  TrafficCone,
  Video
} from "lucide-react";
import { Link, useLocation } from "wouter";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/traffic", label: "Live Traffic", icon: Video },
  { href: "/signals", label: "Signal Control", icon: TrafficCone },
  { href: "/emergency", label: "Emergency Grid", icon: Ambulance },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: mapData } = useLiveIntersections();
  const { data: simVehicles = [] } = useLiveSimVehicles();
  const simDensity = getTrafficDensityByCount(simVehicles.length);

  const densityColor =
    simDensity.level === "low"
      ? "text-success"
      : simDensity.level === "medium"
        ? "text-warning"
        : "text-destructive";

  return (
    <aside className="w-64 h-screen border-r border-border bg-background/50 backdrop-blur-xl flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/30">
          <Hexagon className="w-6 h-6 text-primary absolute animate-pulse-border" />
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg tracking-widest text-glow leading-none">SMARTFLOW</h1>
          <p className="text-[10px] text-primary/60 font-mono tracking-widest">AI OPTIMIZER</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href} className="block">
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden cursor-pointer",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
              )}>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
                )}
                <Icon className={cn("w-5 h-5 transition-transform duration-200 group-hover:scale-110", isActive && "drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]")} />
                <span className="font-medium tracking-wide text-sm">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-4 flex-shrink-0">
        {/* Mini Map */}
        <div>
          <p className="text-xs font-mono text-muted-foreground mb-2 px-2">LIVE NETWORK</p>
          <div className="rounded-lg overflow-hidden border border-white/10 bg-black/60 h-32">
            <CityMap
              intersections={mapData?.intersections || []}
              roads={mapData?.roads || []}
              vehicles={simVehicles}
              enableZoomPan={false}
              performanceMode={true}
            />
          </div>
        </div>

        {/* Traffic Status */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-muted-foreground">VEHICLES</span>
            <span className="text-sm font-bold text-warning">{simVehicles.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-muted-foreground">DENSITY</span>
            <span className={cn("text-xs font-mono font-bold", densityColor)}>
              {simDensity.level.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <span className="text-xs font-mono text-muted-foreground">NODES</span>
            <span className="text-sm font-bold text-primary">{mapData?.intersections?.length || 0}</span>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-success/5 border border-success/20 rounded-lg p-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(0,255,136,0.8)] animate-pulse" />
          <div>
            <p className="text-xs font-mono text-muted-foreground">SYSTEM</p>
            <p className="text-xs font-semibold text-success">OPTIMAL</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
