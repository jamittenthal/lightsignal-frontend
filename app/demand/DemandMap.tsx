"use client";
import React from "react";

export default function DemandMap({ mapData }: { mapData: any }) {
  if (!mapData) return <div className="h-64 bg-slate-100 rounded flex items-center justify-center text-slate-500">Map loading...</div>;

  const regions = mapData.regions || [];
  const events = mapData.events || [];
  
  return (
    <div className="h-64 rounded overflow-hidden bg-slate-100 relative">
      {/* Simple map placeholder with regions and events */}
      <div className="absolute inset-0 flex items-center justify-center text-slate-600">
        <div className="text-center">
          <div className="text-lg">🗺️ Demand Map</div>
          <div className="text-sm mt-2">
            {regions.length} regions • {events.length} events
          </div>
          <div className="mt-4 text-xs space-y-1">
            {regions.slice(0, 3).map((region: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-white px-2 py-1 rounded">
                <span>{region.name}</span>
                <span className="text-teal-600">{Math.round(region.intensity * 100)}%</span>
              </div>
            ))}
            {events.slice(0, 2).map((event: any) => (
              <div key={event.id} className="flex items-center gap-2 bg-white px-2 py-1 rounded">
                <span>🎪</span>
                <span>{event.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}