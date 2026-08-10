import { NextResponse } from "next/server";

interface NominatimReverseResult {
  display_name?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "Las coordenadas son obligatorias y deben ser válidas." },
      { status: 400 },
    );
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
    zoom: "18",
    addressdetails: "0",
  });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          "User-Agent": "CalculaEC/1.0 (https://github.com/JokerEc96/CalculaEC)",
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "No fue posible consultar la geocodificación inversa." },
        { status: 502 },
      );
    }

    const result = (await response.json()) as NominatimReverseResult;

    return NextResponse.json({ displayName: result.display_name ?? null });
  } catch {
    return NextResponse.json(
      { error: "No fue posible consultar la geocodificación inversa." },
      { status: 502 },
    );
  }
}
