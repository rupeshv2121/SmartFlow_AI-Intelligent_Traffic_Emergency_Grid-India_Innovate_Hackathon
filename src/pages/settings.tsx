import { GlassPanel } from "@/components/GlassPanel";
import { AppLayout } from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import {
    getSystemSettings,
    resetSettings,
    updateSystemSettings,
    type SettingsUpdateRequest,
    type SystemSettings
} from "@/lib/settings-api";
import { cn } from "@/lib/utils";
import { AlertTriangle, Bell, Check, Cpu, Eye, RotateCcw, Save, Shield } from "lucide-react";
import { useEffect, useState } from "react";

type ActiveSection = 'ai' | 'alerts' | 'traffic' | 'display';

export default function Settings() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<ActiveSection>('ai');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state for tracking changes
  const [formData, setFormData] = useState<SystemSettings | null>(null);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await getSystemSettings();
      if (response.success) {
        setSettings(response.data);
        setFormData(JSON.parse(JSON.stringify(response.data))); // Deep clone
      } else {
        toast({
          title: "Error",
          description: "Failed to load system settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: "Connection Error",
        description: "Could not connect to settings service",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData || !settings) return;

    try {
      setSaving(true);

      const changes: SettingsUpdateRequest = {};

      // Compare form data with original settings to identify changes
      if (JSON.stringify(formData.aiModel) !== JSON.stringify(settings.aiModel)) {
        changes.aiModel = formData.aiModel;
      }
      if (JSON.stringify(formData.alerts) !== JSON.stringify(settings.alerts)) {
        changes.alerts = formData.alerts;
      }
      if (JSON.stringify(formData.trafficControl) !== JSON.stringify(settings.trafficControl)) {
        changes.trafficControl = formData.trafficControl;
      }
      if (JSON.stringify(formData.display) !== JSON.stringify(settings.display)) {
        changes.display = formData.display;
      }

      if (Object.keys(changes).length === 0) {
        toast({ title: "No Changes", description: "No settings have been modified." });
        return;
      }

      const response = await updateSystemSettings(changes);

      if (response.success) {
        setSettings(response.data);
        setFormData(JSON.parse(JSON.stringify(response.data)));
        setHasChanges(false);

        toast({
          title: "Settings Updated",
          description: `${Object.keys(changes).length} setting section(s) updated successfully.`,
        });
      } else {
        throw new Error(response.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      const response = await resetSettings();

      if (response.success) {
        setSettings(response.data);
        setFormData(JSON.parse(JSON.stringify(response.data)));
        setHasChanges(false);

        toast({
          title: "Settings Reset",
          description: "All settings have been reset to factory defaults.",
        });
      } else {
        throw new Error(response.message || 'Failed to reset settings');
      }
    } catch (error) {
      console.error('Failed to reset settings:', error);
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "Failed to reset settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (section: keyof SystemSettings, field: string, value: any) => {
    if (!formData) return;

    const newFormData = {
      ...formData,
      [section]: {
        ...formData[section],
        [field]: value
      }
    };

    setFormData(newFormData);
    setHasChanges(JSON.stringify(newFormData) !== JSON.stringify(settings));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading system settings...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!settings || !formData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load settings</p>
            <button
              onClick={loadSettings}
              className="mt-4 px-4 py-2 bg-primary/20 text-primary rounded-md hover:bg-primary/30 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8 max-w-4xl">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">SYSTEM CONFIGURATION</h1>
        <p className="text-muted-foreground font-mono text-sm">
          LIVE TRAFFIC MANAGEMENT SETTINGS • 4-CAMERA SYSTEM
          {hasChanges && <span className="ml-2 text-warning">• UNSAVED CHANGES</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl">

        {/* Settings Navigation */}
        <div className="space-y-2 col-span-1">
          {[
            { key: 'ai' as ActiveSection, icon: Cpu, label: "AI Detection", desc: "YOLO Models & Confidence" },
            { key: 'alerts' as ActiveSection, icon: Bell, label: "Alert Thresholds", desc: "Congestion & Speed Limits" },
            { key: 'traffic' as ActiveSection, icon: Shield, label: "Traffic Control", desc: "Signal Timing & Emergency" },
            { key: 'display' as ActiveSection, icon: Eye, label: "Dashboard", desc: "Refresh & Visualization" },
          ].map((item) => (
             <button
               key={item.key}
               onClick={() => setActiveSection(item.key)}
               className={cn(
                 "w-full flex flex-col gap-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left",
                 activeSection === item.key ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:bg-white/5 border border-transparent"
               )}
             >
               <div className="flex items-center gap-3">
                 <item.icon className="w-4 h-4" />
                 {item.label}
               </div>
               <div className="text-xs opacity-70 ml-7">{item.desc}</div>
             </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="col-span-1 md:col-span-3 space-y-6">

          {/* AI Detection Settings */}
          {activeSection === 'ai' && (
            <GlassPanel className="p-6">
              <h2 className="text-lg font-display font-semibold mb-6 border-b border-border pb-4">
                AI VEHICLE DETECTION
              </h2>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Our SmartFlow YOLO-based model, trained on a custom dataset of 300 images, delivers real-time vehicle detection using an optimized asynchronous inference pipeline with fixed frame skipping, ensuring continuous and efficient processing.
                </p>

                <p>
                  It achieves sub-50 ms latency, processes multiple camera streams in parallel using 4 workers, and detects an average of 4–10 vehicles per frame depending on traffic density.
                </p>

                <p>
                  The model classifies vehicles into two categories: normal vehicles (marked in green) and emergency vehicles (marked in red), enabling intelligent traffic prioritization and responsive urban traffic management.
                </p>
              </div>
            </GlassPanel>
          )}

          {/* Alert Settings */}
          {activeSection === 'alerts' && (
            <GlassPanel className="p-6">
              <h2 className="text-lg font-display font-semibold mb-6 border-b border-border pb-4">
                ALERT THRESHOLDS
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Congestion Alert Threshold</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="30"
                      max="100"
                      value={formData.alerts.congestionThreshold}
                      onChange={(e) => updateFormData('alerts', 'congestionThreshold', parseInt(e.target.value))}
                      className="flex-1 accent-destructive"
                    />
                    <span className="font-mono text-destructive bg-destructive/10 px-2 py-1 rounded text-sm min-w-12">
                      {formData.alerts.congestionThreshold}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Trigger critical alerts when lane congestion exceeds this percentage
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Low Speed Alert Threshold</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={formData.alerts.lowSpeedThreshold}
                      onChange={(e) => updateFormData('alerts', 'lowSpeedThreshold', parseInt(e.target.value))}
                      className="flex-1 accent-warning"
                    />
                    <span className="font-mono text-warning bg-warning/10 px-2 py-1 rounded text-sm min-w-16">
                      {formData.alerts.lowSpeedThreshold} km/h
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Alert when average speed drops below this threshold
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Emergency Vehicle Sensitivity</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={Math.round(formData.alerts.emergencyVehicleSensitivity * 100)}
                      onChange={(e) => updateFormData('alerts', 'emergencyVehicleSensitivity', parseInt(e.target.value) / 100)}
                      className="flex-1 accent-purple-400"
                    />
                    <span className="font-mono text-purple-400 bg-purple-400/10 px-2 py-1 rounded text-sm min-w-12">
                      {Math.round(formData.alerts.emergencyVehicleSensitivity * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Detection sensitivity for emergency vehicles (ambulance, fire truck, police)
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <div className="font-medium text-white/90">Email Notifications</div>
                    <div className="text-xs text-muted-foreground">Send email alerts for critical events</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.alerts.emailNotifications}
                      onChange={(e) => updateFormData('alerts', 'emailNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </GlassPanel>
          )}

          {/* Traffic Control Settings */}
          {activeSection === 'traffic' && (
            <GlassPanel className="p-6">
              <h2 className="text-lg font-display font-semibold mb-6 border-b border-border pb-4">
                TRAFFIC SIGNAL CONTROL
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <div className="font-medium text-white/90">Auto-Adaptive Signal Timing</div>
                    <div className="text-xs text-muted-foreground">Let AI optimize signal timing based on real-time traffic</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.trafficControl.adaptiveSignalTiming}
                      onChange={(e) => updateFormData('trafficControl', 'adaptiveSignalTiming', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Maximum Green Light Duration</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="30"
                      max="180"
                      step="10"
                      value={formData.trafficControl.maxGreenTime}
                      onChange={(e) => updateFormData('trafficControl', 'maxGreenTime', parseInt(e.target.value))}
                      className="flex-1 accent-success"
                    />
                    <span className="font-mono text-success bg-success/10 px-2 py-1 rounded text-sm min-w-12">
                      {formData.trafficControl.maxGreenTime}s
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Minimum Green Light Duration</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="5"
                      value={formData.trafficControl.minGreenTime}
                      onChange={(e) => updateFormData('trafficControl', 'minGreenTime', parseInt(e.target.value))}
                      className="flex-1 accent-success"
                    />
                    <span className="font-mono text-success bg-success/10 px-2 py-1 rounded text-sm min-w-12">
                      {formData.trafficControl.minGreenTime}s
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <div className="font-medium text-white/90">Emergency Vehicle Override</div>
                    <div className="text-xs text-muted-foreground">Automatically override signals for emergency vehicles</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.trafficControl.emergencyOverride}
                      onChange={(e) => updateFormData('trafficControl', 'emergencyOverride', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-destructive"></div>
                  </label>
                </div>
              </div>
            </GlassPanel>
          )}

          {/* Display Settings */}
          {activeSection === 'display' && (
            <GlassPanel className="p-6">
              <h2 className="text-lg font-display font-semibold mb-6 border-b border-border pb-4">
                DASHBOARD PREFERENCES
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Data Refresh Interval</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1000"
                      max="30000"
                      step="1000"
                      value={formData.display.refreshInterval}
                      onChange={(e) => updateFormData('display', 'refreshInterval', parseInt(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="font-mono text-primary bg-primary/10 px-2 py-1 rounded text-sm min-w-12">
                      {Math.round(formData.display.refreshInterval / 1000)}s
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    How often the dashboard updates with new data from cameras
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <div className="font-medium text-white/90">Show AI Predictions</div>
                    <div className="text-xs text-muted-foreground">Display ML traffic forecasting on charts</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.display.showPredictions}
                      onChange={(e) => updateFormData('display', 'showPredictions', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-400"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <div className="font-medium text-white/90">Auto-Export Analytics</div>
                    <div className="text-xs text-muted-foreground">Automatically export daily traffic reports</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.display.autoExport}
                      onChange={(e) => updateFormData('display', 'autoExport', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </GlassPanel>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              Last updated: {new Date(settings.lastUpdated).toLocaleString()}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="px-6 py-2 rounded-md font-medium text-sm text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4 mr-2 inline" />
                Reset to Defaults
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="px-6 py-2 rounded-md font-medium text-sm bg-primary hover:bg-primary/80 text-primary-foreground flex items-center gap-2 transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Deploying...
                  </>
                ) : hasChanges ? (
                  <>
                    <Save className="w-4 h-4" />
                    Deploy Configuration
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Up to Date
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}