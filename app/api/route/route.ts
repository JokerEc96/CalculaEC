import { NextResponse } from "next/server";

interface OsrmRouteResponse {
  code: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      type: "LineString";
      coordinates: number[][];
    };
  }>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const values = [
    searchParams.get("originLat"),
    searchParams.get("originLng"),
    searchParams.get("destinationLat"),
    searchParams.get("destinationLng"),
  ];

  const coordinates = values.map((value) => (value === null ? NaN : Number(value)));

  if (coordinates.some((value) => !Number.isFinite(value))) {
    return NextResponse.json(
      { error: "Las cuatro coordenadas deben ser números válidos." },
      { status: 400 },
    );
  }

  const [originLat, originLng, destinationLat, destinationLng] = coordinates;

  if (
    originLat < -90 ||
    originLat > 90 ||
    destinationLat < -90 ||
    destinationLat > 90 ||
    originLng < -180 ||
    originLng > 180 ||
    destinationLng < -180 ||
    destinationLng > 180
  ) {
    return NextResponse.json(
      { error: "Las coordenadas están fuera de rango." },
      { status: 400 },
    );
  }

  const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destinationLng},${destinationLat}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    const data = (await response.json()) as OsrmRouteResponse;

    if (!response.ok || data.code !== "Ok" || !data.routes?.[0]) {
      return NextResponse.json(
        { error: data.message ?? "OSRM no pudo calcular la ruta." },
        { status: 502 },
      );
    }

    const route = data.routes[0];

    return NextResponse.json({
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60,
      geometry: route.geometry,
    });
  } catch {
    return NextResponse.json(
      { error: "No fue posible consultar el servicio de rutas." },
      { status: 502 },
    );
  }
}
