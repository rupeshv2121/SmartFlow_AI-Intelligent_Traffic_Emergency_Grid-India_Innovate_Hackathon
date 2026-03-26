import { GlassPanel } from "@/components/GlassPanel";
import { AppLayout } from "@/components/layout/AppLayout";
import { RealisticAmbulance } from "@/components/vehicles/RealisticAmbulance";
import { RealisticAuto } from "@/components/vehicles/RealisticAuto";
import { RealisticBike } from "@/components/vehicles/RealisticBike";
import { RealisticCar } from "@/components/vehicles/RealisticCar";
import { useTrafficSim } from "@/context/TrafficSimContext";
import type { VehicleType } from "@/types/traffic-sim";
import { Environment } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Ambulance, Bike, Bus, Car, CarFront } from "lucide-react";
import { useMemo } from "react";

const VEHICLE_CLASSES: Array<{
  type: VehicleType;
  label: string;
  color: string;
  sizeHint: string;
  detectorClassId: number;
  // High-level vehicle category used for AI model description (NORMAL / EMERGENCY)
  vehicleType: "NORMAL" | "EMERGENCY";
  icon: typeof CarFront;
}> = [
  { type: "car", label: "Car", color: "#4b5563", sizeHint: "medium", detectorClassId: 0, vehicleType: "NORMAL", icon: CarFront },
  // Auto-rickshaw vehicle type
  { type: "auto", label: "Auto", color: "#d97706", sizeHint: "medium", detectorClassId: 1, vehicleType: "NORMAL", icon: Bus },
  { type: "bike", label: "Bike", color: "#374151", sizeHint: "small", detectorClassId: 2, vehicleType: "NORMAL", icon: Bike },
  { type: "ambulance", label: "Ambulance", color: "#f3f4f6", sizeHint: "medium", detectorClassId: 3, vehicleType: "EMERGENCY", icon: Ambulance },
];

function VehiclePreviewMesh({ type }: { type: VehicleType }) {
  useFrame((state) => {
    state.scene.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.35) * 0.5;
  });

  switch (type) {
    case "car":
      return <RealisticCar position={[0, -0.2, 0]} color={0x4b5563} scale={0.5} animated />;
    case "bike":
      return <RealisticBike position={[0, -0.13, 0]} color={0x374151} scale={0.75} animated />;
    case "ambulance":
      return <RealisticAmbulance position={[0, -0.21, 0]} scale={0.45} animated />;
    case "auto":
      // Auto class uses the updated 3D auto-rickshaw model used in simulation scenes.
      return <RealisticAuto position={[0, -0.17, 0]} color={0xd97706} scale={0.65} animated />;
    default:
      return <RealisticCar position={[0, -0.2, 0]} color={0x4b5563} scale={0.5} animated />;
  }
}

function Vehicle3DPhoto({ type }: { type: VehicleType }) {
  return (
    <div className="h-42.5 w-full overflow-hidden rounded-lg border border-white/10 bg-linear-to-b from-[#27466d] via-[#4f76a8] to-[#7ea0cb]">
      <Canvas dpr={[0.8, 1.2]} camera={{ position: [2.8, 1.7, 3], fov: 35 }}>
        <color attach="background" args={["#7ea0cb"]} />
        <hemisphereLight intensity={0.55} color="#d9ecff" groundColor="#35557d" />
        <ambientLight intensity={0.65} />
        <directionalLight position={[3.4, 4.5, 2.5]} intensity={1.1} />
        <directionalLight position={[-2.6, 2.2, -2.6]} intensity={0.35} color="#c6e5ff" />

        <VehiclePreviewMesh type={type} />
        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
}

export default function Dataset() {
  const { state } = useTrafficSim();

  const liveVehicles = useMemo(() => {
    return state.roads.flatMap((road, roadIndex) =>
      road.vehicles.map((vehicle) => ({
        id: vehicle.id,
        roadLabel: road.label,
        roadIndex: roadIndex,
        signal: road.signal,
        type: vehicle.type,
        progress: Number(vehicle.progress.toFixed(3)),
        direction: vehicle.isOutgoing ? "outgoing" : "incoming",
        speed: Number(vehicle.speed.toFixed(3)),
        length: Number(vehicle.length.toFixed(2)),
        width: Number(vehicle.width.toFixed(2)),
      })),
    );
  }, [state.roads]);

  const classStats = useMemo(() => {
    return VEHICLE_CLASSES.map((cls) => {
      const count = liveVehicles.filter((vehicle) => vehicle.type === cls.type).length;
      return { ...cls, count };
    });
  }, [liveVehicles]);

  const datasetPayload = useMemo(() => {
    return {
      source: "smartflow-simulation",
      classes: VEHICLE_CLASSES.map((cls) => ({
        classId: cls.detectorClassId,
        type: cls.type,
        vehicleType: cls.vehicleType,
        label: cls.label,
        displayColor: cls.color,
        sizeHint: cls.sizeHint,
      })),
      samples: liveVehicles,
    };
  }, [liveVehicles]);

  return (
    <AppLayout>
      <div className="mb-8">
        <div>
          <GlassPanel key={1} className="p-4 border border-white/10">  
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">AI Model Details</h1>
          <hr/>
          <div className="space-y-3 text-sm text-muted-foreground mt-4">
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
        </div>
      </div>

<hr/>
      <h1 className="text-2xl font-display font-bold text-foreground mb-2 mt-6">Vehicle Details</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {classStats.map((cls) => {
          const Icon = cls.icon;
          return (
            <GlassPanel key={cls.type} className="p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" style={{ color: cls.color }} />
                  <h2 className="text-base font-display font-semibold">{cls.label}</h2>
                </div>
                <span className="text-xs font-mono rounded border border-white/15 bg-white/5 px-2 py-1">
                  ID {cls.detectorClassId}
                </span>
              </div>
              <div className="space-y-1.5 text-sm font-mono text-muted-foreground">
                <div>Type: {cls.vehicleType}</div>
                <div>Size: {cls.sizeHint}</div>
                {/* <div className="text-foreground">Live Samples: {cls.count}</div> */}
              </div>
            </GlassPanel>
          );
        })}
      </div>

      <GlassPanel className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Car className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-display font-semibold">3D Vehicle Simulation</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {VEHICLE_CLASSES.map((cls) => (
            <div key={`preview-${cls.type}`} className="rounded-lg border border-white/10 bg-white/3 p-3">
              <Vehicle3DPhoto type={cls.type} />
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm font-semibold">{cls.label}</div>
                <span className="text-xs font-mono text-muted-foreground">class {cls.detectorClassId}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/*
      <GlassPanel className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-display font-semibold">Class Taxonomy</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs font-mono text-muted-foreground border-b border-border">
              <tr>
                <th className="pb-3 font-medium">CLASS ID</th>
                <th className="pb-3 font-medium">TYPE</th>
                <th className="pb-3 font-medium">LABEL</th>
                <th className="pb-3 font-medium">VISUAL COLOR</th>
                <th className="pb-3 font-medium">SIZE HINT</th>
              </tr>
            </thead>
            <tbody>
              {classStats.map((cls) => (
                <tr key={`class-${cls.type}`} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                  <td className="py-3 font-mono">{cls.detectorClassId}</td>
                  <td className="py-3 font-mono">{cls.type}</td>
                  <td className="py-3 font-medium">{cls.label}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-2 font-mono">
                      <span className="h-2.5 w-2.5 rounded-full border border-white/20" style={{ backgroundColor: cls.color }} />
                      {cls.color}
                    </span>
                  </td>
                  <td className="py-3 font-mono">{cls.sizeHint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>
      */}
    </AppLayout>
  );
}
