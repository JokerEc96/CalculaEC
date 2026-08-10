"use client";

import { useState } from "react";
import TripMap from "@/components/TripMap";

const fuelOptions = ["Ecopaís", "Súper", "Diésel"] as const;

type FuelType = (typeof fuelOptions)[number];

type RouteResponse = {
  distanceKm: number;
  durationMinutes: number;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
};

export default function TripCalculatorPage() {
  const [mode, setMode] = useState<"ruta" | "kilometros">("ruta");
  const [fuelType, setFuelType] = useState<FuelType>("Ecopaís");
  const [originLat, setOriginLat] = useState("");
  const [originLng, setOriginLng] = useState("");
  const [destinationLat, setDestinationLat] = useState("");
  const [destinationLng, setDestinationLng] = useState("");
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCalculateRoute(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const coordinates = [originLat, originLng, destinationLat, destinationLng].map(Number);

    if (coordinates.some((value) => !Number.isFinite(value))) {
      setError("Ingresa coordenadas válidas para calcular la ruta.");
      return;
    }

    const [parsedOriginLat, parsedOriginLng, parsedDestinationLat, parsedDestinationLng] = coordinates;

    if (
      parsedOriginLat < -90 ||
      parsedOriginLat > 90 ||
      parsedDestinationLat < -90 ||
      parsedDestinationLat > 90 ||
      parsedOriginLng < -180 ||
      parsedOriginLng > 180 ||
      parsedDestinationLng < -180 ||
      parsedDestinationLng > 180
    ) {
      setError("Las coordenadas están fuera de rango. Revisa latitud y longitud.");
      return;
    }

    setIsLoading(true);
    setDistanceKm(null);
    setDurationMinutes(null);
    setRouteCoordinates([]);

    try {
      const params = new URLSearchParams({
        originLat: String(parsedOriginLat),
        originLng: String(parsedOriginLng),
        destinationLat: String(parsedDestinationLat),
        destinationLng: String(parsedDestinationLng),
      });

      const response = await fetch(`/api/route?${params.toString()}`);
      const data = (await response.json()) as RouteResponse | { error?: string };

      if (!response.ok || !("distanceKm" in data) || !("durationMinutes" in data) || !data.geometry) {
        setError("No pudimos calcular la ruta. Revisa las coordenadas e inténtalo nuevamente.");
        return;
      }

      setDistanceKm(data.distanceKm);
      setDurationMinutes(data.durationMinutes);
      setRouteCoordinates(data.geometry.coordinates);
    } catch {
      setError("No pudimos conectar con el servicio de rutas. Inténtalo nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-[var(--background)]">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-10 flex items-center justify-between gap-4">
          <a href="/" className="text-xl font-bold tracking-tight text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] focus-visible:ring-offset-2">
            Calcula<span className="text-[var(--wine)]">EC</span>
          </a>
          <a href="/" className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--wine)] motion-reduce:transition-none">
            Volver al inicio
          </a>
        </header>

        <section aria-labelledby="trip-title" className="max-w-3xl">
          <p className="text-sm font-medium text-[var(--wine)]">Combustible · Ecuador</p>
          <h1 id="trip-title" className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Viaje por kilómetros</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
            Calcula cuánto combustible y dinero necesitas para llegar a tu destino.
          </p>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-[var(--border)] bg-white p-1 shadow-sm" role="group" aria-label="Tipo de cálculo">
              <button type="button" aria-pressed={mode === "ruta"} onClick={() => setMode("ruta")} className={`rounded-full px-5 py-2 text-sm font-medium transition motion-reduce:transition-none ${mode === "ruta" ? "bg-[var(--wine)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                Ruta
              </button>
              <button type="button" aria-pressed={mode === "kilometros"} onClick={() => setMode("kilometros")} className={`rounded-full px-5 py-2 text-sm font-medium transition motion-reduce:transition-none ${mode === "kilometros" ? "bg-[var(--wine)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                Kilómetros
              </button>
            </div>

            <div className="rounded-[2rem] border border-[var(--border)] bg-white p-1 shadow-sm">
              <TripMap routeCoordinates={routeCoordinates} />
            </div>
          </div>

          <section className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm sm:p-7" aria-labelledby="trip-form-title">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Configura tu viaje</p>
              <h2 id="trip-form-title" className="mt-2 text-2xl font-semibold tracking-tight">Datos del recorrido</h2>
            </div>

            <form className="mt-7 space-y-5" onSubmit={handleCalculateRoute}>
              <div>
                <label htmlFor="origin" className="text-sm font-medium">¿De dónde sales?</label>
                <input id="origin" name="origin" type="text" placeholder="Ciudad o ubicación" className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none" />
              </div>

              <div>
                <label htmlFor="destination" className="text-sm font-medium">¿A dónde vas?</label>
                <input id="destination" name="destination" type="text" placeholder="Ciudad o ubicación" className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="originLat" className="text-sm font-medium">Latitud de origen</label>
                  <input id="originLat" name="originLat" type="number" step="any" value={originLat} onChange={(event) => setOriginLat(event.target.value)} placeholder="Ej. -2.1709" className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none" />
                </div>
                <div>
                  <label htmlFor="originLng" className="text-sm font-medium">Longitud de origen</label>
                  <input id="originLng" name="originLng" type="number" step="any" value={originLng} onChange={(event) => setOriginLng(event.target.value)} placeholder="Ej. -79.9224" className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none" />
                </div>
                <div>
                  <label htmlFor="destinationLat" className="text-sm font-medium">Latitud de destino</label>
                  <input id="destinationLat" name="destinationLat" type="number" step="any" value={destinationLat} onChange={(event) => setDestinationLat(event.target.value)} placeholder="Ej. -0.1807" className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none" />
                </div>
                <div>
                  <label htmlFor="destinationLng" className="text-sm font-medium">Longitud de destino</label>
                  <input id="destinationLng" name="destinationLng" type="number" step="any" value={destinationLng} onChange={(event) => setDestinationLng(event.target.value)} placeholder="Ej. -78.4678" className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none" />
                </div>
              </div>

              <div>
                <label htmlFor="consumption" className="text-sm font-medium">Consumo de tu vehículo</label>
                <input id="consumption" name="consumption" type="text" placeholder="Ej. 40 km/galón" className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none" />
              </div>

              <div>
                <label htmlFor="fuel" className="text-sm font-medium">Tipo de combustible</label>
                <select id="fuel" name="fuel" value={fuelType} onChange={(event) => setFuelType(event.target.value as FuelType)} className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none">
                  {fuelOptions.map((fuel) => <option key={fuel} value={fuel}>{fuel}</option>)}
                </select>
              </div>

              {error && <p role="alert" className="rounded-2xl border border-[var(--border)] bg-[var(--cream)] px-4 py-3 text-sm text-[var(--wine)]">{error}</p>}

              <button type="submit" disabled={isLoading} className="w-full rounded-2xl bg-[var(--wine)] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--wine-dark)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 motion-reduce:transform-none motion-reduce:transition-none">
                {isLoading ? "Calculando ruta…" : "Calcular viaje"}
              </button>
            </form>
          </section>
        </div>

        <section className="mt-6 rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm sm:p-7" aria-labelledby="results-title">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Resultado</p>
              <h2 id="results-title" className="mt-2 text-xl font-semibold tracking-tight">Resumen del viaje</h2>
            </div>
            <span className="text-xs text-[var(--muted)]">{isLoading ? "Calculando…" : "Datos del recorrido"}</span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Distancia", distanceKm === null ? "—" : `${distanceKm.toFixed(1)} km`],
              ["Combustible estimado", "—"],
              ["Costo aproximado", "—"],
              ["Tiempo estimado", durationMinutes === null ? "—" : `${durationMinutes.toFixed(0)} min`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                <p className="text-xs text-[var(--muted)]">{label}</p>
                <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-[var(--muted)]">Los precios de combustible se actualizarán automáticamente cuando conectemos la fuente de datos.</p>
      </div>
    </main>
  );
}
