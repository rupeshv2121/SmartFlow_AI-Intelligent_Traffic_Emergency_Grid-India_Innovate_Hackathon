import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  glowColor?: "primary" | "destructive" | "warning" | "success" | "none";
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, active, glowColor = "none", children, ...props }, ref) => {
    
    const glowClasses = {
      primary: "shadow-[0_0_15px_rgba(0,255,255,0.15)] border-primary/40",
      destructive: "shadow-[0_0_15px_rgba(255,42,42,0.15)] border-destructive/40",
      warning: "shadow-[0_0_15px_rgba(255,184,0,0.15)] border-warning/40",
      success: "shadow-[0_0_15px_rgba(0,255,136,0.15)] border-success/40",
      none: ""
    };

    return (
      <div
        ref={ref}
        className={cn(
          "glass-panel rounded-xl overflow-hidden transition-all duration-300",
          active && "glass-panel-active",
          glowColor !== "none" && glowClasses[glowColor],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = "GlassPanel";

export const MotionGlassPanel = motion(GlassPanel as any);
