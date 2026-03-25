import type { SimIntersection } from "@/types/traffic-sim";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";

interface IntersectionMapProps {
  intersections: SimIntersection[];
  onSelect: (intersectionId: string) => void;
}

const CITY_CENTER: [number, number] = [28.6139, 77.209];

function densityColor(density: SimIntersection["density"]) {
  if (density === "high") return "#ff4d4f";
  if (density === "medium") return "#f7b500";
  return "#00d084";
}

function toLatLng(intersection: SimIntersection): [number, number] {
  // API provides normalized x/y style coordinates; convert to lat/lng around the city center.
  const lat = CITY_CENTER[0] + (50 - intersection.y) * 0.002;
  const lng = CITY_CENTER[1] + (intersection.x - 50) * 0.0025;
  return [lat, lng];
}

export function IntersectionMap({ intersections, onSelect }: IntersectionMapProps) {
  return (
    <div className="w-full h-140 rounded-xl overflow-hidden border border-white/15">
      <MapContainer center={CITY_CENTER} zoom={12} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {intersections.map((intersection) => (
          <CircleMarker
            key={intersection.id}
            center={toLatLng(intersection)}
            radius={9}
            pathOptions={{
              color: "#0b1220",
              weight: 2,
              fillColor: densityColor(intersection.density),
              fillOpacity: 0.92,
            }}
            eventHandlers={{
              click: () => onSelect(intersection.id),
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1}>
              {intersection.name} ({intersection.id})
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
