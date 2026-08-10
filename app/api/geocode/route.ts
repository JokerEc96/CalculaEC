import { NextResponse } from "next/server";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "El parámetro q es obligatorio." },
      { status: 400 },
    );
  }

  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "5",
    countrycodes: "ec",
  });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          "User-Agent": "CalculaEC/1.0 (https://github.com/JokerEc96/CalculaEC)",
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "No fue posible consultar el servicio de geocodificación." },
        { status: 502 },
      );
    }

    const results = (await response.json()) as NominatimResult[];

    return NextResponse.json(
      results.map(({ display_name, lat, lon }) => ({
        displayName: display_name,
        lat: Number(lat),
        lng: Number(lon),
      })),
    );
  } catch {
    return NextResponse.json(
      { error: "No fue posible consultar el servicio de geocodificación." },
      { status: 502 },
    );
  }
}
