import { cn } from "@/lib/utils";
import {
  Database,
  LayoutDashboard,
  // Boxes,
  LineChart,
  Settings,
  TrafficCone,
  Video
} from "lucide-react";
import { Link, useLocation } from "wouter";
import smartflow_icon from '../../../public/smartflow_icon.jpeg';

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/traffic", label: "Live Traffic", icon: Video },
  { href: "/signals", label: "Signal Control", icon: TrafficCone },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/dataset", label: "AI Model", icon: Database },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  onExpandedChange?: (isExpanded: boolean) => void;
  isExpanded?: boolean;
}

export function Sidebar({ onExpandedChange, isExpanded = true }: SidebarProps) {
  const [location] = useLocation();

  return (
    <aside
      className={cn(
        "h-screen border-r border-border bg-background/50 backdrop-blur-xl flex flex-col sticky top-0 z-50 transition-all duration-300",
        isExpanded ? "w-64" : "w-20"
      )}
    >
      <Link to="/">
        <div className="p-5 flex items-center justify-center h-22">
          <div className="flex items-center gap-3 w-full">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 shrink-0">
            <img src={smartflow_icon} alt=""  className="rounded-lg"/>
            </div>
            {isExpanded && (
              <div className="overflow-hidden whitespace-nowrap">
                <h1 className="font-display font-bold text-lg tracking-widest text-glow leading-none">SMARTFLOW</h1>
                <p className="text-[10px] text-primary/60 font-mono tracking-widest">AI OPTIMIZER</p>
              </div>
            )}
          </div>
        </div>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="block">
              <div
                className={cn(
                  "flex items-center justify-start gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative overflow-hidden cursor-pointer",
                  isExpanded ? "" : "justify-center",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                )}
                title={!isExpanded ? item.label : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
                )}
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-transform duration-200",
                    isActive && "drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]",
                    isExpanded && "group-hover:scale-110"
                  )}
                />
                {isExpanded && (
                  <span className="font-medium tracking-wide text-sm whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* <div className="p-3 border-t border-border">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(0,255,136,0.8)] animate-pulse" />
          {isExpanded && (
            <div className="overflow-hidden whitespace-nowrap">
              <p className="text-xs font-mono text-muted-foreground">SYSTEM STATUS</p>
              <p className="text-sm font-semibold text-success text-glow-success">OPTIMAL</p>
            </div>
          )}
        </div>
      </div> */}
    </aside>
  );
}
