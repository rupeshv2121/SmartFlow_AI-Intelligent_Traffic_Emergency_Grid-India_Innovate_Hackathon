import { AppLayout } from "@/components/layout/AppLayout";
import { GlassPanel } from "@/components/GlassPanel";
import { Save, Shield, Cpu, Bell, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { toast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Configuration Saved",
      description: "System settings have been updated and deployed to edge nodes.",
    });
  };

  return (
    <AppLayout>
      <div className="mb-8 max-w-4xl">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">SYSTEM CONFIGURATION</h1>
        <p className="text-muted-foreground font-mono text-sm">GLOBAL PARAMETERS & AI BEHAVIOR</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl">
        
        {/* Settings Navigation */}
        <div className="space-y-2 col-span-1">
          {[
            { icon: Cpu, label: "AI Models", active: true },
            { icon: Shield, label: "Security & Access", active: false },
            { icon: Bell, label: "Alert Thresholds", active: false },
            { icon: Eye, label: "Display Prefs", active: false },
          ].map((item, i) => (
             <button 
               key={i}
               className={cn(
                 "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                 item.active ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:bg-white/5 border border-transparent"
               )}
             >
               <item.icon className="w-4 h-4" />
               {item.label}
             </button>
          ))}
        </div>

        {/* Form Area */}
        <div className="col-span-1 md:col-span-3 space-y-6">
          <form onSubmit={handleSave}>
            <GlassPanel className="p-6 mb-6">
              <h2 className="text-lg font-display font-semibold mb-6 border-b border-border pb-4">VEHICLE DETECTION AI</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Active Model Architecture</label>
                  <select className="w-full bg-black/40 border border-white/10 rounded-md p-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors">
                    <option>YOLOv8 - Real-time Optimized (Primary)</option>
                    <option>ResNet-50 - High Accuracy (Heavy)</option>
                    <option>EfficientDet - Balanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Confidence Threshold</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="50" max="99" defaultValue="85" className="flex-1 accent-primary" />
                    <span className="font-mono text-primary bg-primary/10 px-2 py-1 rounded text-sm">85%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Detections below this confidence will be discarded.</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <div className="font-medium text-white/90">Auto-Adaptive Signal Timing</div>
                    <div className="text-xs text-muted-foreground">Allow AI to override manual phase timings during heavy load.</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </GlassPanel>

            <div className="flex justify-end gap-4">
              <button type="button" className="px-6 py-2 rounded-md font-medium text-sm text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer">
                Discard Changes
              </button>
              <button type="submit" className="px-6 py-2 rounded-md font-medium text-sm bg-primary hover:bg-primary/80 text-primary-foreground flex items-center gap-2 transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]">
                <Save className="w-4 h-4" />
                Deploy Configuration
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

