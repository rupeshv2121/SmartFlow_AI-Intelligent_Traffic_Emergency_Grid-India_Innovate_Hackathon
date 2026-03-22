import { GlassPanel } from "@/components/GlassPanel";
import { AppLayout } from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import {
  getSystemSettings,
  resetSettings,
  updateSystemSettings,
  type SettingsUpdateRequest,
  type SystemSettings,
} from "@/lib/settings-api";
import { cn } from "@/lib/utils";
import { AlertTriangle, Bell, Check, Eye, RotateCcw, Save, Shield } from "lucide-react";
import { useEffect, useState } from "react";

type ActiveSection = "alerts" | "traffic" | "display";
type EditableSettingsSection = keyof SettingsUpdateRequest;

interface PullSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  description?: string;
  fillClassName: string;
  thumbClassName: string;
  valueClassName: string;
  formatValue: (value: number) => string;
  onChange: (value: number) => void;
}

function PullSlider({
  label,
  value,
  min,
  max,
  step = 1,
  description,
  fillClassName,
  thumbClassName,
  valueClassName,
  formatValue,
  onChange,
}: PullSliderProps) {
  const ratio = (value - min) / (max - min);
  const clampedRatio = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  const fillPercent = clampedRatio * 100;

  return (
    <div>
      <label className="block text-sm font-medium text-white/80 mb-2">{label}</label>
      <div className="flex items-center gap-4">
        <div className="relative flex-1 h-5">
          <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full border border-white/15 bg-white/10" />
          <div
            className={cn("absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full", fillClassName)}
            style={{ width: `${fillPercent}%` }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className={cn(
              "absolute inset-0 h-5 w-full cursor-pointer appearance-none bg-transparent",
              "[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent",
              "[&::-moz-range-track]:h-2 [&::-moz-range-track]:bg-transparent [&::-moz-range-track]:border-0",
              "[&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/40 [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(15,23,42,0.4)]",
              "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/40 [&::-moz-range-thumb]:shadow-[0_0_0_4px_rgba(15,23,42,0.4)]",
              thumbClassName,
            )}
          />
        </div>
        <span className={cn("font-mono px-2 py-1 rounded text-sm min-w-16 text-center", valueClassName)}>
          {formatValue(value)}
        </span>
      </div>
      {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<ActiveSection>('alerts');
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

  const updateFormData = <S extends EditableSettingsSection, F extends keyof SystemSettings[S]>(
    section: S,
    field: F,
    value: SystemSettings[S][F],
  ) => {
    if (!formData) return;

    const newFormData = {
      ...formData,
      [section]: {
        ...formData[section],
        [field]: value,
      }
    };

    setFormData(newFormData);
    setHasChanges(JSON.stringify(newFormData) !== JSON.stringify(settings));
  };

  const updateTrafficAlgorithm = (field: keyof SystemSettings['trafficControl']['algorithm'], value: number) => {
    if (!formData) return;

    const newFormData = {
      ...formData,
      trafficControl: {
        ...formData.trafficControl,
        algorithm: {
          ...formData.trafficControl.algorithm,
          [field]: value,
        },
      },
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

          {/* Alert Settings */}
          {activeSection === 'alerts' && (
            <GlassPanel className="p-6">
              <h2 className="text-lg font-display font-semibold mb-6 border-b border-border pb-4">
                ALERT THRESHOLDS
              </h2>

              <div className="space-y-6">
                <div>
                  <PullSlider
                    label="Congestion Alert Threshold"
                    value={formData.alerts.congestionThreshold}
                    min={30}
                    max={100}
                    fillClassName="bg-linear-to-r from-rose-500 to-pink-500"
                    thumbClassName="[&::-webkit-slider-thumb]:bg-rose-400 [&::-moz-range-thumb]:bg-rose-400"
                    valueClassName="text-rose-300 bg-rose-500/12 border border-rose-400/20"
                    formatValue={(v) => `${Math.round(v)}%`}
                    description="Trigger critical alerts when lane congestion exceeds this percentage"
                    onChange={(v) => updateFormData('alerts', 'congestionThreshold', Math.round(v))}
                  />
                </div>

                <div>
                  <PullSlider
                    label="Low Speed Alert Threshold"
                    value={formData.alerts.lowSpeedThreshold}
                    min={5}
                    max={50}
                    fillClassName="bg-linear-to-r from-amber-400 to-yellow-300"
                    thumbClassName="[&::-webkit-slider-thumb]:bg-amber-300 [&::-moz-range-thumb]:bg-amber-300"
                    valueClassName="text-amber-200 bg-amber-400/12 border border-amber-300/20"
                    formatValue={(v) => `${Math.round(v)} km/h`}
                    description="Alert when average speed drops below this threshold"
                    onChange={(v) => updateFormData('alerts', 'lowSpeedThreshold', Math.round(v))}
                  />
                </div>

                <div>
                  <PullSlider
                    label="Emergency Vehicle Sensitivity"
                    value={Math.round(formData.alerts.emergencyVehicleSensitivity * 100)}
                    min={50}
                    max={100}
                    fillClassName="bg-linear-to-r from-violet-400 to-fuchsia-400"
                    thumbClassName="[&::-webkit-slider-thumb]:bg-violet-300 [&::-moz-range-thumb]:bg-violet-300"
                    valueClassName="text-violet-300 bg-violet-500/12 border border-violet-400/20"
                    formatValue={(v) => `${Math.round(v)}%`}
                    description="Detection sensitivity for emergency vehicles (ambulance, fire truck, police)"
                    onChange={(v) => updateFormData('alerts', 'emergencyVehicleSensitivity', Math.round(v) / 100)}
                  />
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
                  <PullSlider
                    label="Maximum Green Light Duration"
                    value={formData.trafficControl.maxGreenTime}
                    min={30}
                    max={180}
                    step={10}
                    fillClassName="bg-linear-to-r from-emerald-500 to-green-400"
                    thumbClassName="[&::-webkit-slider-thumb]:bg-emerald-300 [&::-moz-range-thumb]:bg-emerald-300"
                    valueClassName="text-emerald-200 bg-emerald-500/12 border border-emerald-400/20"
                    formatValue={(v) => `${Math.round(v)}s`}
                    onChange={(v) => updateFormData('trafficControl', 'maxGreenTime', Math.round(v))}
                  />
                </div>

                <div>
                  <PullSlider
                    label="Minimum Green Light Duration"
                    value={formData.trafficControl.minGreenTime}
                    min={5}
                    max={30}
                    step={5}
                    fillClassName="bg-linear-to-r from-teal-500 to-emerald-400"
                    thumbClassName="[&::-webkit-slider-thumb]:bg-teal-300 [&::-moz-range-thumb]:bg-teal-300"
                    valueClassName="text-teal-200 bg-teal-500/12 border border-teal-400/20"
                    formatValue={(v) => `${Math.round(v)}s`}
                    onChange={(v) => updateFormData('trafficControl', 'minGreenTime', Math.round(v))}
                  />
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-white/90 mb-4">Adaptive Algorithm Parameters</h3>

                  <div className="space-y-5">
                    <div>
                      <PullSlider
                        label="Base Time (baseTime)"
                        value={formData.trafficControl.algorithm.baseTime}
                        min={5}
                        max={30}
                        step={1}
                        fillClassName="bg-linear-to-r from-cyan-500 to-blue-500"
                        thumbClassName="[&::-webkit-slider-thumb]:bg-cyan-300 [&::-moz-range-thumb]:bg-cyan-300"
                        valueClassName="text-cyan-200 bg-cyan-500/12 border border-cyan-400/20"
                        formatValue={(v) => `${Math.round(v)}s`}
                        onChange={(v) => updateTrafficAlgorithm('baseTime', Math.round(v))}
                      />
                    </div>

                    <div>
                      <PullSlider
                        label="Vehicle Factor (factor)"
                        value={formData.trafficControl.algorithm.factor}
                        min={0.5}
                        max={10}
                        step={0.1}
                        fillClassName="bg-linear-to-r from-sky-500 to-cyan-400"
                        thumbClassName="[&::-webkit-slider-thumb]:bg-sky-300 [&::-moz-range-thumb]:bg-sky-300"
                        valueClassName="text-sky-200 bg-sky-500/12 border border-sky-400/20"
                        formatValue={(v) => v.toFixed(1)}
                        onChange={(v) => updateTrafficAlgorithm('factor', v)}
                      />
                    </div>

                    <div>
                      <PullSlider
                        label="Weight W1 (vehicle count)"
                        value={formData.trafficControl.algorithm.w1}
                        min={0}
                        max={5}
                        step={0.1}
                        fillClassName="bg-linear-to-r from-amber-500 to-orange-400"
                        thumbClassName="[&::-webkit-slider-thumb]:bg-amber-300 [&::-moz-range-thumb]:bg-amber-300"
                        valueClassName="text-amber-200 bg-amber-500/12 border border-amber-400/20"
                        formatValue={(v) => v.toFixed(1)}
                        onChange={(v) => updateTrafficAlgorithm('w1', v)}
                      />
                    </div>

                    <div>
                      <PullSlider
                        label="Weight W2 (waiting time)"
                        value={formData.trafficControl.algorithm.w2}
                        min={0}
                        max={5}
                        step={0.1}
                        fillClassName="bg-linear-to-r from-violet-500 to-purple-400"
                        thumbClassName="[&::-webkit-slider-thumb]:bg-violet-300 [&::-moz-range-thumb]:bg-violet-300"
                        valueClassName="text-violet-200 bg-violet-500/12 border border-violet-400/20"
                        formatValue={(v) => v.toFixed(1)}
                        onChange={(v) => updateTrafficAlgorithm('w2', v)}
                      />
                    </div>

                    <div>
                      <PullSlider
                        label="Wait Scale"
                        value={formData.trafficControl.algorithm.waitScale}
                        min={0.01}
                        max={1}
                        step={0.01}
                        fillClassName="bg-linear-to-r from-emerald-500 to-teal-400"
                        thumbClassName="[&::-webkit-slider-thumb]:bg-emerald-300 [&::-moz-range-thumb]:bg-emerald-300"
                        valueClassName="text-emerald-200 bg-emerald-500/12 border border-emerald-400/20"
                        formatValue={(v) => v.toFixed(2)}
                        onChange={(v) => updateTrafficAlgorithm('waitScale', v)}
                      />
                    </div>

                    <div>
                      <PullSlider
                        label="Starvation Threshold"
                        value={formData.trafficControl.algorithm.starvationThreshold}
                        min={30}
                        max={600}
                        step={10}
                        fillClassName="bg-linear-to-r from-rose-500 to-red-400"
                        thumbClassName="[&::-webkit-slider-thumb]:bg-rose-300 [&::-moz-range-thumb]:bg-rose-300"
                        valueClassName="text-rose-200 bg-rose-500/12 border border-rose-400/20"
                        formatValue={(v) => `${Math.round(v)}s`}
                        onChange={(v) => updateTrafficAlgorithm('starvationThreshold', Math.round(v))}
                      />
                    </div>

                    <div>
                      <PullSlider
                        label="Max Wait Clamp"
                        value={formData.trafficControl.algorithm.maxWait}
                        min={60}
                        max={900}
                        step={10}
                        fillClassName="bg-linear-to-r from-yellow-500 to-amber-400"
                        thumbClassName="[&::-webkit-slider-thumb]:bg-yellow-300 [&::-moz-range-thumb]:bg-yellow-300"
                        valueClassName="text-yellow-200 bg-yellow-500/12 border border-yellow-400/20"
                        formatValue={(v) => `${Math.round(v)}s`}
                        onChange={(v) => updateTrafficAlgorithm('maxWait', Math.round(v))}
                      />
                    </div>
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
                  <PullSlider
                    label="Data Refresh Interval"
                    value={formData.display.refreshInterval}
                    min={1000}
                    max={30000}
                    step={1000}
                    fillClassName="bg-linear-to-r from-cyan-500 to-teal-400"
                    thumbClassName="[&::-webkit-slider-thumb]:bg-cyan-300 [&::-moz-range-thumb]:bg-cyan-300"
                    valueClassName="text-cyan-200 bg-cyan-500/12 border border-cyan-400/20"
                    formatValue={(v) => `${Math.round(v / 1000)}s`}
                    description="How often the dashboard updates with new data from cameras"
                    onChange={(v) => updateFormData('display', 'refreshInterval', Math.round(v))}
                  />
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