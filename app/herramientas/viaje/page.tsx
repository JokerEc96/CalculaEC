"use client";

import { useState } from "react";
import TripMap from "@/components/TripMap";

type GeocodeResult = {
  displayName: string;
  lat: number;
  lng: number;
};

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
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function geocodeLocation(query: string): Promise<GeocodeResult> {
    const params = new URLSearchParams({ q: query });
    const response = await fetch(`/api/geocode?${params.toString()}`);
    const data = (await response.json()) as GeocodeResult[] | { error?: string };

    if (!response.ok) {
      throw new Error("No pudimos buscar una de las ubicaciones.");
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`No encontramos resultados para "${query}".`);
    }

    const result = data[0];

    if (
      !result ||
      typeof result.lat !== "number" ||
      !Number.isFinite(result.lat) ||
      typeof result.lng !== "number" ||
      !Number.isFinite(result.lng)
    ) {
      throw new Error(`No encontramos una ubicación válida para "${query}".`);
    }

    return result;
  }

  async function handleCalculateRoute(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const originQuery = origin.trim();
    const destinationQuery = destination.trim();

    if (!originQuery || !destinationQuery) {
      setError("Ingresa tu punto de salida y tu destino para calcular la ruta.");
      return;
    }

    setIsLoading(true);
    setDistanceKm(null);
    setDurationMinutes(null);
    setRouteCoordinates([]);

    try {
      const [originLocation, destinationLocation] = await Promise.all([
        geocodeLocation(originQuery),
        geocodeLocation(destinationQuery),
      ]);

      const routeParams = new URLSearchParams({
        originLat: String(originLocation.lat),
        originLng: String(originLocation.lng),
        destinationLat: String(destinationLocation.lat),
        destinationLng: String(destinationLocation.lng),
      });

      const response = await fetch(`/api/route?${routeParams.toString()}`);
      const data = (await response.json()) as RouteResponse | { error?: string };

      if (
        !response.ok ||
        !("distanceKm" in data) ||
        !("durationMinutes" in data) ||
        !data.geometry ||
        data.geometry.type !== "LineString"
      ) {
        throw new Error("No pudimos calcular una ruta entre esas ubicaciones.");
      }

      setDistanceKm(data.distanceKm);
      setDurationMinutes(data.durationMinutes);
      setRouteCoordinates(data.geometry.coordinates);
    } catch (routeError) {
      setError(
        routeError instanceof Error
          ? routeError.message
          : "No pudimos calcular la ruta. Inténtalo nuevamente.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-[var(--background)]">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-10 flex items-center justify-between gap-4">
          <a
            href="/"
            className="text-xl font-bold tracking-tight text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] focus-visible:ring-offset-2"
          >
            Calcula<span className="text-[var(--wine)]">EC</span>
          </a>
          <a
            href="/"
            className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--wine)] motion-reduce:transition-none"
          >
            Volver al inicio
          </a>
        </header>

        <section aria-labelledby="trip-title" className="max-w-3xl">
          <p className="text-sm font-medium text-[var(--wine)]">Combustible · Ecuador</p>
          <h1 id="trip-title" className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            Viaje por kilómetros
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
            Calcula cuánto combustible y dinero necesitas para llegar a tu destino.
          </p>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-6">
            <div
              className="inline-flex rounded-full border border-[var(--border)] bg-white p-1 shadow-sm"
              role="group"
              aria-label="Tipo de cálculo"
            >
              <button
                type="button"
                aria-pressed={mode === "ruta"}
                onClick={() => setMode("ruta")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition motion-reduce:transition-none ${
                  mode === "ruta"
                    ? "bg-[var(--wine)] text-white shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                Ruta
              </button>
              <button
                type="button"
                aria-pressed={mode === "kilometros"}
                onClick={() => setMode("kilometros")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition motion-reduce:transition-none ${
                  mode === "kilometros"
                    ? "bg-[var(--wine)] text-white shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                Kilómetros
              </button>
            </div>

            <div className="rounded-[2rem] border border-[var(--border)] bg-white p-1 shadow-sm">
              <TripMap routeCoordinates={routeCoordinates} />
            </div>
          </div>

          <section
            className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm sm:p-7"
            aria-labelledby="trip-form-title"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                Configura tu viaje
              </p>
              <h2 id="trip-form-title" className="mt-2 text-2xl font-semibold tracking-tight">
                Datos del recorrido
              </h2>
            </div>

            <form className="mt-7 space-y-5" onSubmit={handleCalculateRoute}>
              <div>
                <label htmlFor="origin" className="text-sm font-medium">
                  ¿De dónde sales?
                </label>
                <input
                  id="origin"
                  name="origin"
                  type="text"
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                  placeholder="Ciudad o ubicación"
                  autoComplete="street-address"
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none"
                />
              </div>

              <div>
                <label htmlFor="destination" className="text-sm font-medium">
                  ¿A dónde vas?
                </label>
                <input
                  id="destination"
                  name="destination"
                  type="text"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Ciudad o ubicación"
                  autoComplete="street-address"
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--cream)] px-4 py-3 text-sm text-[var(--wine)]"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-[var(--wine)] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--wine-dark)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 motion-reduce:transform-none motion-reduce:transition-none"
              >
                {isLoading ? "Calculando ruta…" : "Calcular viaje"}
              </button>
            </form>
          </section>
        </div>

        <section
          className="mt-6 rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm sm:p-7"
          aria-labelledby="results-title"
        >
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                Resultado
              </p>
              <h2 id="results-title" className="mt-2 text-xl font-semibold tracking-tight">
                Resumen del viaje
              </h2>
            </div>
            <span className="text-xs text-[var(--muted)]">
              {isLoading ? "Calculando…" : "Datos del recorrido"}
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Distancia", distanceKm === null ? "—" : `${distanceKm.toFixed(1)} km`],
              ["Combustible estimado", "—"],
              ["Costo aproximado", "—"],
              [
                "Tiempo estimado",
                durationMinutes === null ? "—" : `${durationMinutes.toFixed(0)} min`,
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
              >
                <p className="text-xs text-[var(--muted)]">{label}</p>
                <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-[var(--muted)]">
          Los precios de combustible se actualizarán automáticamente cuando conectemos la fuente de datos.
        </p>
      </div>
    </main>
  );
}
