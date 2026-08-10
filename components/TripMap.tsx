"use client";

import type { LatLngExpression, LatLngTuple } from "leaflet";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";

export interface TripMapProps {
  routeCoordinates?: [number, number][];
  originCoordinate?: LatLngTuple | null;
  destinationCoordinate?: LatLngTuple | null;
}

const ECUADOR_CENTER: LatLngExpression = [-1.8312, -78.1834];

function RouteViewport({ coordinates }: { coordinates: LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length > 0) {
      map.fitBounds(coordinates, { padding: [32, 32] });
    }
  }, [coordinates, map]);

  return null;
}

export default function TripMap({
  routeCoordinates,
  originCoordinate,
  destinationCoordinate,
}: TripMapProps) {
  const routePath = useMemo<LatLngTuple[]>(
    () => routeCoordinates?.map(([longitude, latitude]) => [latitude, longitude]) ?? [],
    [routeCoordinates],
  );

  return (
    <div className="h-[360px] w-full overflow-hidden rounded-[2rem] sm:h-[440px]">
      <MapContainer
        center={ECUADOR_CENTER}
        zoom={6}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {routePath.length > 0 && (
          <>
            <Polyline
              positions={routePath}
              pathOptions={{ color: "var(--wine)", weight: 5 }}
            />
            <RouteViewport coordinates={routePath} />
          </>
        )}

        {originCoordinate && (
          <CircleMarker
            center={originCoordinate}
            radius={9}
            pathOptions={{ color: "#166534", fillColor: "#22c55e", fillOpacity: 1, weight: 3 }}
          />
        )}

        {destinationCoordinate && (
          <CircleMarker
            center={destinationCoordinate}
            radius={9}
            pathOptions={{ color: "#991b1b", fillColor: "#ef4444", fillOpacity: 1, weight: 3 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
