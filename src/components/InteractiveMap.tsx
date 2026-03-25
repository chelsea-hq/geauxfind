"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Place } from "@/types";

/* Fix default marker icons in Next.js/webpack (leaflet assets aren't bundled automatically) */
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

/* City coordinate lookup */
const CITY_COORDS: Record<string, [number, number]> = {
  lafayette: [30.2241, -92.0198],
  broussard: [30.1464, -91.9585],
  youngsville: [30.0991, -91.994],
  "breaux bridge": [30.2735, -91.8993],
  "new iberia": [30.0035, -91.8188],
  scott: [30.2357, -92.0946],
  opelousas: [30.5335, -92.0815],
  crowley: [30.2141, -92.4438],
  eunice: [30.4941, -92.4177],
  abbeville: [29.9746, -92.1343],
  rayne: [30.2349, -92.2685],
  carencro: [30.3174, -92.049],
  sunset: [30.4124, -92.0682],
};

function getCoords(city: string): [number, number] | null {
  return CITY_COORDS[city.toLowerCase()] || null;
}

/* Slight random offset so markers in the same city don't stack */
function jitter(base: [number, number], index: number): [number, number] {
  const offset = 0.003;
  const angle = (index * 137.5 * Math.PI) / 180; // golden angle spread
  return [base[0] + Math.cos(angle) * offset * (index % 3 + 1), base[1] + Math.sin(angle) * offset * (index % 3 + 1)];
}

interface InteractiveMapProps {
  places: Place[];
  className?: string;
}

export default function InteractiveMap({ places, className }: InteractiveMapProps) {
  useEffect(() => {
    // Force leaflet CSS (already imported but ensure it loads)
  }, []);

  const markersData = places
    .map((place, i) => {
      const coords = getCoords(place.city);
      if (!coords) return null;
      return { place, position: jitter(coords, i) as [number, number] };
    })
    .filter(Boolean) as Array<{ place: Place; position: [number, number] }>;

  return (
    <div className={`overflow-hidden rounded-2xl border border-[var(--spanish-moss)]/30 ${className || ""}`}>
      <MapContainer center={[30.2241, -92.0198]} zoom={10} scrollWheelZoom={false} className="h-[350px] w-full md:h-[420px]">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markersData.map(({ place, position }) => (
          <Marker key={place.slug} position={position}>
            <Popup>
              <div className="text-sm">
                <strong className="text-base">{place.name}</strong>
                <br />
                <span className="text-xs text-gray-500">{place.category} · {place.city}</span>
                <br />
                <span>⭐ {place.rating.toFixed(1)} · {place.price}</span>
                <br />
                <a href={`/place/${place.slug}`} className="mt-1 inline-block text-[#bf1f34] underline">View details →</a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
