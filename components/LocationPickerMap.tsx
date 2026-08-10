"use client";

import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import { useState } from "react";

export type LocationCoordinate = [number, number];

interface LocationPickerMapProps {
  initialCoordinate?: LocationCoordinate | null;
  onConfirm: (coordinate: LocationCoordinate) => void;
}

function MapClickHandler({ onSelect }: { onSelect: (coordinate: LocationCoordinate) => void }) {
  useMapEvents({
    click(event) {
      onSelect([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

export default function LocationPickerMap({
  initialCoordinate = null,
  onConfirm,
}: LocationPickerMapProps) {
  const [selectedCoordinate, setSelectedCoordinate] = useState<LocationCoordinate | null>(
    initialCoordinate,
  );

  const center: LatLngTuple = selectedCoordinate ?? [-1.8312, -78.1834];

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white">
      <div className="h-[300px] w-full sm:h-[360px]">
        <MapContainer
          center={center}
          zoom={selectedCoordinate ? 13 : 6}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onSelect={setSelectedCoordinate} />
          {selectedCoordinate && (
            <CircleMarker
              center={selectedCoordinate}
              radius={9}
              pathOptions={{ color: "var(--wine)", fillColor: "var(--wine)", fillOpacity: 0.9, weight: 3 }}
            />
          )}
        </MapContainer>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-[var(--muted)]">
          {selectedCoordinate
            ? `${selectedCoordinate[0].toFixed(5)}, ${selectedCoordinate[1].toFixed(5)}`
            : "Toca o haz clic en el mapa para seleccionar un punto."}
        </p>
        <button
          type="button"
          onClick={() => selectedCoordinate && onConfirm(selectedCoordinate)}
          disabled={!selectedCoordinate}
          className="rounded-xl bg-[var(--wine)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--wine-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
        >
          Confirmar ubicación
        </button>
      </div>
    </div>
  );
}
