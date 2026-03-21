import { Link, useLocation } from "wouter";
import { FocusEvent } from "react";
import { 
  LayoutDashboard, 
  Video, 
  TrafficCone, 
  Ambulance, 
  // Boxes,
  LineChart, 
  Settings,
  Hexagon,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/traffic", label: "Live Traffic", icon: Video },
  { href: "/signals", label: "Signal Control", icon: TrafficCone },
  { href: "/emergency", label: "Emergency Grid", icon: Ambulance },
  // { href: "/simulations", label: "Simulations", icon: Boxes },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/dataset", label: "ML Dataset", icon: Database },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  onExpandedChange?: (isExpanded: boolean) => void;
}

export function Sidebar({ onExpandedChange }: SidebarProps) {
  const [location] = useLocation();

  const handleBlurCapture = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      onExpandedChange?.(false);
    }
  };

  return (
    <aside
      className="group h-screen w-20 hover:w-64 border-r border-border bg-background/50 backdrop-blur-xl flex flex-col sticky top-0 z-50 transition-all duration-300"
      onMouseEnter={() => onExpandedChange?.(true)}
      onMouseLeave={() => onExpandedChange?.(false)}
      onFocusCapture={() => onExpandedChange?.(true)}
      onBlurCapture={handleBlurCapture}
    >
      <div className="p-5 flex items-center gap-3 min-h-[88px]">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/30">
          <Hexagon className="w-6 h-6 text-primary absolute animate-pulse-border" />
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        </div>
        <div className="overflow-hidden w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
          <h1 className="font-display font-bold text-lg tracking-widest text-glow leading-none">SMARTFLOW</h1>
          <p className="text-[10px] text-primary/60 font-mono tracking-widest">AI OPTIMIZER</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href} className="block">
              <div className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative overflow-hidden cursor-pointer",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
              )}>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
                )}
                <Icon className={cn("w-5 h-5 min-w-5 transition-transform duration-200 group-hover:scale-110", isActive && "drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]")} />
                <span className="font-medium tracking-wide text-sm whitespace-nowrap overflow-hidden w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* <div className="p-3 border-t border-border">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(0,255,136,0.8)] animate-pulse" />
          <div className="overflow-hidden w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
            <p className="text-xs font-mono text-muted-foreground">SYSTEM STATUS</p>
            <p className="text-sm font-semibold text-success text-glow-success">OPTIMAL</p>
          </div>
        </div>
      </div> */}
    </aside>
  );
}
