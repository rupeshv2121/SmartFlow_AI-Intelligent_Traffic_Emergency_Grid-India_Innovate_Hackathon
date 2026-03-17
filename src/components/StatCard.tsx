import { ReactNode } from "react";
import { GlassPanel } from "./GlassPanel";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  glow?: "primary" | "destructive" | "warning" | "success" | "none";
  className?: string;
}

export function StatCard({ title, value, icon, trend, glow = "none", className }: StatCardProps) {
  return (
    <GlassPanel glowColor={glow} className={cn("p-5 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 cursor-default", className)}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            {trend.isPositive ? "+" : "-"}{trend.value}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-muted-foreground text-sm font-medium tracking-wide mb-1 uppercase font-display">{title}</h3>
        <p className="text-3xl font-bold font-display text-glow tracking-wider text-foreground">{value}</p>
      </div>
    </GlassPanel>
  );
}
