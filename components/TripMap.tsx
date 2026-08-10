"use client";

import type { LatLngExpression, LatLngTuple } from "leaflet";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";

export interface TripMapProps {
  routeCoordinates?: [number, number][];
  routeCoordinateSets?: [number, number][][];
  originCoordinate?: LatLngTuple | null;
  destinationCoordinate?: LatLngTuple | null;
  stopCoordinates?: LatLngTuple[];
}

const ECUADOR_CENTER: LatLngExpression = [-1.8312, -78.1834];

function RouteViewport({ coordinates }: { coordinates: LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length > 0) map.fitBounds(coordinates, { padding: [32, 32] });
  }, [coordinates, map]);

  return null;
}

export default function TripMap({ routeCoordinates, routeCoordinateSets, originCoordinate, destinationCoordinate, stopCoordinates = [] }: TripMapProps) {
  const routePaths = useMemo<LatLngTuple[][]>(() => {
    if (routeCoordinateSets && routeCoordinateSets.length > 0) {
      return routeCoordinateSets.map((route) => route.map(([longitude, latitude]) => [latitude, longitude] as LatLngTuple));
    }
    if (routeCoordinates && routeCoordinates.length > 0) {
      return [routeCoordinates.map(([longitude, latitude]) => [latitude, longitude] as LatLngTuple)];
    }
    return [];
  }, [routeCoordinates, routeCoordinateSets]);

  const allRouteCoordinates = useMemo<LatLngTuple[]>(() => routePaths.flat(), [routePaths]);

  return (
    <div className="h-[360px] w-full overflow-hidden rounded-[2rem] sm:h-[440px]">
      <MapContainer center={ECUADOR_CENTER} zoom={6} scrollWheelZoom className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {routePaths.map((path, index) => (
          <Polyline key={`route-${index}`} positions={path} pathOptions={{ color: "var(--wine)", weight: 5 }} />
        ))}
        {allRouteCoordinates.length > 0 && <RouteViewport coordinates={allRouteCoordinates} />}
        {originCoordinate && <CircleMarker center={originCoordinate} radius={9} pathOptions={{ color: "#166534", fillColor: "#22c55e", fillOpacity: 1, weight: 3 }} />}
        {stopCoordinates.map((coordinate, index) => <CircleMarker key={`stop-${index}`} center={coordinate} radius={7} pathOptions={{ color: "#92400e", fillColor: "#f59e0b", fillOpacity: 1, weight: 3 }} />)}
        {destinationCoordinate && <CircleMarker center={destinationCoordinate} radius={9} pathOptions={{ color: "#991b1b", fillColor: "#ef4444", fillOpacity: 1, weight: 3 }} />}
      </MapContainer>
    </div>
  );
}
