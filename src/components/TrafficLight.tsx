import { cn } from "@/lib/utils";

interface TrafficLightProps {
  phase: "green" | "yellow" | "red" | "standby";
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  horizontal?: boolean;
}

export function TrafficLight({ phase, className, size = "md", horizontal = false }: TrafficLightProps) {
  const sizes = {
    xs: "w-2.5 h-2.5",
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6"
  };

  const gap = {
    xs: "gap-0.5",
    sm: "gap-1.5",
    md: "gap-2",
    lg: "gap-3"
  };

  const containerPadding = {
    xs: "px-0.5 py-0.5",
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3"
  };

  const sz = sizes[size];

  return (
    <div className={cn(
      "bg-black/80 rounded-xl border border-white/10 flex",
      horizontal ? "flex-row" : "flex-col",
      containerPadding[size],
      gap[size],
      className
    )}>
      <div className={cn(
        "rounded-full transition-all duration-300", sz,
        phase === "red" 
          ? "bg-destructive shadow-[0_0_12px_rgba(255,42,42,0.8)] opacity-100" 
          : "bg-destructive/20 opacity-40"
      )} />
      <div className={cn(
        "rounded-full transition-all duration-300", sz,
        phase === "yellow" 
          ? "bg-warning shadow-[0_0_12px_rgba(255,184,0,0.8)] opacity-100" 
          : "bg-warning/20 opacity-40"
      )} />
      <div className={cn(
        "rounded-full transition-all duration-300", sz,
        phase === "green" 
          ? "bg-success shadow-[0_0_12px_rgba(0,255,136,0.8)] opacity-100" 
          : "bg-success/20 opacity-40"
      )} />
    </div>
  );
}
