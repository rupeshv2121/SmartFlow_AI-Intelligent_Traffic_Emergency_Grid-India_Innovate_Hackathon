// import { RealisticAmbulance } from "@/components/vehicles/RealisticAmbulance";
// import { RealisticAuto } from "@/components/vehicles/RealisticAuto";
// import { RealisticBike } from "@/components/vehicles/RealisticBike";
// import { RealisticCar } from "@/components/vehicles/RealisticCar";
// import type { SimRoadState, SimVehicle } from "@/types/traffic-sim";
// import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
// import { Canvas } from "@react-three/fiber";
// import { Activity, Ambulance, ArrowLeft, Bike, Bus, Car, Clock } from "lucide-react";

// interface LaneDetailViewProps {
//   road: SimRoadState;
//   laneIndex: number;
//   onBack: () => void;
// }

// const LANE_NAMES = ["North", "East", "South", "West"];

// function getVehicleIcon(type: string) {
//   switch (type) {
//     case "bike":
//       return <Bike className="w-4 h-4" />;
//     case "ambulance":
//       return <Ambulance className="w-4 h-4" />;
//     case "bus":
//       return <Bus className="w-4 h-4" />;
//     default:
//       return <Car className="w-4 h-4" />;
//   }
// }

// function getSignalColor(signal: string) {
//   if (signal === "green") return "text-green-500 bg-green-500/20 border-green-500/50";
//   if (signal === "yellow") return "text-yellow-400 bg-yellow-400/20 border-yellow-400/50";
//   return "text-red-500 bg-red-500/20 border-red-500/50";
// }

// function Lane3DView({ vehicles, road }: { vehicles: SimVehicle[]; road: SimRoadState }) {
//   const carColors = [0x3366AA, 0xCC3333, 0x22AA55, 0xFF9900, 0x9933CC, 0x00CCCC,
//                      0xFF6B9D, 0x4B5563, 0x1E3A8A, 0x991B1B, 0x065F46, 0x7C2D12];
//   const bikeColors = [0xFF4500, 0x000000, 0x0000FF, 0xFF1493, 0x32CD32, 0xFFD700];

//   return (
//     <>
//       {/* Sky background */}
//       <color attach="background" args={["#1e293b"]} />

//       {/* Lighting */}
//       <ambientLight intensity={0.8} />
//       <directionalLight position={[10, 15, 10]} intensity={1.2} />
//       <directionalLight position={[-10, 10, -10]} intensity={0.6} color="#d0e6ff" />

//       {/* Road */}
//       <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
//         <planeGeometry args={[20, 100]} />
//         <meshStandardMaterial color="#2e3440" roughness={0.9} />
//       </mesh>

//       {/* Lane markings */}
//       {Array.from({ length: 20 }).map((_, i) => (
//         <mesh key={`mark-${i}`} position={[0, 0.01, -40 + i * 4]} rotation={[-Math.PI / 2, 0, 0]}>
//           <planeGeometry args={[0.3, 2]} />
//           <meshStandardMaterial color="#ffffff" />
//         </mesh>
//       ))}

//       {/* Ground */}
//       <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
//         <planeGeometry args={[50, 100]} />
//         <meshStandardMaterial color="#2f7a35" roughness={0.95} />
//       </mesh>

//       {/* Vehicles */}
//       {vehicles.map((vehicle, idx) => {
//         const colorIndex = parseInt(vehicle.id.slice(-2), 16);
//         const carColor = carColors[colorIndex % carColors.length];
//         const bikeColor = bikeColors[colorIndex % bikeColors.length];

//         // Position vehicles in a queue
//         const spacing = 4;
//         const zPos = -20 + idx * spacing;
//         const xOffset = vehicle.laneOffset * 0.5;

//         let VehicleComponent;
//         let scale = 1.2;
//         let color: number | undefined;

//         switch (vehicle.type) {
//           case "bike":
//             VehicleComponent = RealisticBike;
//             scale = 1.0;
//             color = bikeColor;
//             break;
//           case "ambulance":
//             VehicleComponent = RealisticAmbulance;
//             scale = 1.2;
//             color = undefined;
//             break;
//           case "bus":
//             VehicleComponent = RealisticAuto;
//             scale = 1.1;
//             color = undefined;
//             break;
//           default:
//             VehicleComponent = RealisticCar;
//             scale = 1.2;
//             color = carColor;
//         }

//         return (
//           <group key={vehicle.id} position={[xOffset, 0.38, zPos]} rotation={[0, Math.PI, 0]}>
//             <VehicleComponent
//               position={[0, -0.38, 0]}
//               color={color}
//               scale={scale}
//               animated={true}
//             />
//           </group>
//         );
//       })}

//       {/* Traffic Signal */}
//       <group position={[8, 0, 5]}>
//         <mesh position={[0, 3.2, 0]}>
//           <cylinderGeometry args={[0.15, 0.15, 6.4, 16]} />
//           <meshStandardMaterial color="#121212" metalness={0.6} roughness={0.4} />
//         </mesh>
//         <mesh position={[0, 6.5, 0]}>
//           <boxGeometry args={[0.8, 2.5, 0.4]} />
//           <meshStandardMaterial color="#030303" metalness={0.5} roughness={0.35} />
//         </mesh>

//         {/* Signal lights */}
//         <mesh position={[0, 7.3, 0.25]}>
//           <sphereGeometry args={[0.18, 16, 16]} />
//           <meshStandardMaterial
//             color={road.signal === "red" ? "#ef4444" : "#7f1d1d"}
//             emissive={road.signal === "red" ? "#ef4444" : "#1a0000"}
//             emissiveIntensity={road.signal === "red" ? 1.5 : 0.1}
//             toneMapped={false}
//           />
//         </mesh>
//         <mesh position={[0, 6.5, 0.25]}>
//           <sphereGeometry args={[0.18, 16, 16]} />
//           <meshStandardMaterial
//             color={road.signal === "yellow" ? "#fbbf24" : "#78350f"}
//             emissive={road.signal === "yellow" ? "#fbbf24" : "#1a0000"}
//             emissiveIntensity={road.signal === "yellow" ? 1.5 : 0.1}
//             toneMapped={false}
//           />
//         </mesh>
//         <mesh position={[0, 5.7, 0.25]}>
//           <sphereGeometry args={[0.18, 16, 16]} />
//           <meshStandardMaterial
//             color={road.signal === "green" ? "#22c55e" : "#14532d"}
//             emissive={road.signal === "green" ? "#22c55e" : "#1a0000"}
//             emissiveIntensity={road.signal === "green" ? 1.8 : 0.1}
//             toneMapped={false}
//           />
//         </mesh>
//       </group>

//       <Environment preset="sunset" />
//     </>
//   );
// }

// export function LaneDetailView({ road, laneIndex, onBack }: LaneDetailViewProps) {
//   const laneName = LANE_NAMES[laneIndex];
//   const vehicleTypes = road.vehicles.reduce((acc, vehicle) => {
//     acc[vehicle.type] = (acc[vehicle.type] || 0) + 1;
//     return acc;
//   }, {} as Record<string, number>);

//   const avgWaitTime = road.vehicles.length > 0
//     ? Math.round((road.vehicles.reduce((sum, v) => sum + (1 - v.progress), 0) / road.vehicles.length) * 60)
//     : 0;

//   return (
//     <div className="space-y-4">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <button
//             onClick={onBack}
//             className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors text-sm font-medium"
//           >
//             <ArrowLeft className="w-4 h-4" />
//             Back to Map
//           </button>
//           <div>
//             <h2 className="text-2xl font-display font-bold text-white">{laneName} Lane Detail</h2>
//             <p className="text-sm text-slate-400 font-mono mt-1">Real-time lane monitoring and vehicle tracking</p>
//           </div>
//         </div>

//         {/* Signal Status */}
//         <div className={`px-4 py-2 rounded-lg border-2 ${getSignalColor(road.signal)} font-mono font-bold uppercase flex items-center gap-2`}>
//           <div className={`w-3 h-3 rounded-full ${road.signal === "green" ? "bg-green-500" : road.signal === "yellow" ? "bg-yellow-400" : "bg-red-500"} animate-pulse`} />
//           {road.signal}
//         </div>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
//           <div className="flex items-center gap-2 mb-2">
//             <Car className="w-4 h-4 text-cyan-400" />
//             <div className="text-xs text-slate-400 font-mono">QUEUE LENGTH</div>
//           </div>
//           <div className="text-3xl font-bold text-white">{road.vehicles.length}</div>
//         </div>

//         <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
//           <div className="flex items-center gap-2 mb-2">
//             <Activity className="w-4 h-4 text-emerald-400" />
//             <div className="text-xs text-slate-400 font-mono">VEHICLES PASSED</div>
//           </div>
//           <div className="text-3xl font-bold text-emerald-400">{road.vehicleCount}</div>
//         </div>

//         <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
//           <div className="flex items-center gap-2 mb-2">
//             <Clock className="w-4 h-4 text-yellow-400" />
//             <div className="text-xs text-slate-400 font-mono">AVG WAIT TIME</div>
//           </div>
//           <div className="text-3xl font-bold text-yellow-400">{avgWaitTime}s</div>
//         </div>

//         <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
//           <div className="flex items-center gap-2 mb-2">
//             <Ambulance className="w-4 h-4 text-red-400" />
//             <div className="text-xs text-slate-400 font-mono">EMERGENCY STATUS</div>
//           </div>
//           <div className={`text-lg font-bold ${road.ambulanceDetected ? "text-red-400 animate-pulse" : "text-slate-600"}`}>
//             {road.ambulanceDetected ? "ACTIVE" : "NORMAL"}
//           </div>
//         </div>
//       </div>

//       {/* Main Content Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//         {/* 3D View */}
//         <div className="lg:col-span-2 bg-slate-900 border border-cyan-300/25 rounded-xl overflow-hidden shadow-[0_0_0_1px_rgba(12,74,110,0.4),0_18px_38px_rgba(2,6,23,0.62)]">
//           <div className="h-[500px] relative">
//             <Canvas shadows dpr={[1, 1.5]}>
//               <PerspectiveCamera makeDefault position={[12, 8, 15]} fov={50} />
//               <Lane3DView vehicles={road.vehicles} road={road} />
//               <OrbitControls
//                 enableDamping
//                 dampingFactor={0.05}
//                 minDistance={10}
//                 maxDistance={40}
//                 maxPolarAngle={Math.PI / 2.2}
//                 target={[0, 2, 0]}
//               />
//             </Canvas>

//             <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-cyan-400/30 rounded-lg px-3 py-2 font-mono text-xs text-slate-200">
//               <div className="text-cyan-300 font-semibold">3D LANE VIEW</div>
//               <div className="mt-1">Camera: Interactive</div>
//             </div>
//           </div>
//         </div>

//         {/* Vehicle List */}
//         <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-4">
//           <div>
//             <h3 className="text-lg font-bold text-white mb-3">Vehicle Breakdown</h3>
//             <div className="space-y-2">
//               {Object.entries(vehicleTypes).map(([type, count]) => (
//                 <div key={type} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
//                   <div className="flex items-center gap-2">
//                     {getVehicleIcon(type)}
//                     <span className="text-sm text-slate-300 capitalize">{type}s</span>
//                   </div>
//                   <span className="text-sm font-bold text-white">{count}</span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Vehicle Queue */}
//           <div>
//             <h3 className="text-lg font-bold text-white mb-3">Vehicle Queue</h3>
//             <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
//               {road.vehicles.length === 0 ? (
//                 <div className="text-center py-8 text-slate-500 text-sm">
//                   No vehicles in queue
//                 </div>
//               ) : (
//                 road.vehicles.map((vehicle, idx) => (
//                   <div
//                     key={vehicle.id}
//                     className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors"
//                   >
//                     <div className="text-slate-500 font-mono text-xs">#{idx + 1}</div>
//                     <div className="text-slate-400">{getVehicleIcon(vehicle.type)}</div>
//                     <div className="flex-1">
//                       <div className="text-xs text-slate-400 font-mono">{vehicle.type}</div>
//                       <div className="text-[10px] text-slate-600">ID: {vehicle.id.slice(0, 8)}</div>
//                     </div>
//                     <div className="text-right">
//                       <div className="text-xs text-slate-300">{Math.round(vehicle.progress * 100)}%</div>
//                       <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden mt-1">
//                         <div
//                           className="h-full bg-cyan-400 rounded-full transition-all"
//                           style={{ width: `${vehicle.progress * 100}%` }}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
