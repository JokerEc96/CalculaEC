"use client";

import type { LatLngExpression } from "leaflet";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export interface TripMapPoint {
  lat: number;
  lng: number;
}

export interface TripMapProps {
  origin?: TripMapPoint;
  destination?: TripMapPoint;
  routeCoordinates?: TripMapPoint[];
}

const ECUADOR_CENTER: LatLngExpression = [-1.8312, -78.1834];

export default function TripMap({
  origin: _origin,
  destination: _destination,
  routeCoordinates: _routeCoordinates,
}: TripMapProps) {
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
      </MapContainer>
    </div>
  );
}
