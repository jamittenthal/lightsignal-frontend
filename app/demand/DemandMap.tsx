"use client";
import React from "react";
import dynamic from "next/dynamic";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);

export default function DemandMap({ mapData }: { mapData: any }) {
  if (!mapData) return <div className="h-64 bg-slate-100 rounded flex items-center justify-center text-slate-500">Map loading...</div>;

  const regions = mapData.regions || [];
  const events = mapData.events || [];
  
  // Default to Clearwater, FL area
  const center = regions[0] ? [regions[0].lat, regions[0].lng] : [27.965, -82.8];

  return (
    <div className="h-64 rounded overflow-hidden">
      {typeof window !== "undefined" && (
        <MapContainer
          center={center as [number, number]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Demand intensity regions */}
          {regions.map((region: any, i: number) => (
            <CircleMarker
              key={i}
              center={[region.lat, region.lng]}
              radius={Math.max(5, region.intensity * 20)}
              pathOptions={{
                fillColor: region.intensity > 0.7 ? "#059669" : region.intensity > 0.5 ? "#10b981" : "#6ee7b7",
                color: "#047857",
                weight: 2,
                fillOpacity: 0.6
              }}
            >
              <Popup>
                <div>
                  <strong>{region.name}</strong><br />
                  Demand Intensity: {Math.round(region.intensity * 100)}%
                </div>
              </Popup>
            </CircleMarker>
          ))}
          
          {/* Event markers */}
          {events.map((event: any) => (
            <Marker key={event.id} position={[event.lat, event.lng]}>
              <Popup>
                <div>
                  <strong>🎪 {event.label}</strong><br />
                  Upcoming event marker
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}