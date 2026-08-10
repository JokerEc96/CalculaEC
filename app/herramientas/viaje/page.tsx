"use client";

import { useEffect, useState } from "react";
import { calculateFuelNeeded, calculateTripFuel } from "@/lib/fuel";
import type { FuelPriceRecord, FuelPricesResponse } from "@/lib/fuel-price-types";
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

const fuelOptions = [
  { value: "ecopais", label: "Ecopaís" },
  { value: "super", label: "Súper" },
  { value: "diesel", label: "Diésel" },
] as const;

export default function TripCalculatorPage() {
  const [mode, setMode] = useState<"ruta" | "kilometros">("ruta");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [consumption, setConsumption] = useState("");
  const [fuelType, setFuelType] = useState<FuelPriceRecord["type"]>("ecopais");
  const [fuelPrices, setFuelPrices] = useState<FuelPriceRecord[]>([]);
  const [fuelSourceStatus, setFuelSourceStatus] = useState<FuelPricesResponse["sourceStatus"]>("unavailable");
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [fuelPricesError, setFuelPricesError] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [fuelGallons, setFuelGallons] = useState<number | null>(null);
  const [fuelCost, setFuelCost] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFuelPrices() {
      try {
        const response = await fetch("/api/fuel-prices");
        const data = (await response.json()) as FuelPricesResponse | { error?: string };

        if (
          !response.ok ||
          !data ||
          !Array.isArray((data as FuelPricesResponse).prices) ||
          typeof (data as FuelPricesResponse).fetchedAt !== "string" ||
          !["official", "secondary", "unavailable"].includes(
            (data as FuelPricesResponse).sourceStatus,
          )
        ) {
          throw new Error("No pudimos obtener los precios de combustible.");
        }

        if (!cancelled) {
          const fuelData = data as FuelPricesResponse;
          setFuelPrices(fuelData.prices);
          setFuelSourceStatus(fuelData.sourceStatus);
          setFuelPricesError(null);
        }
      } catch {
        if (!cancelled) {
          setFuelPrices([]);
          setFuelSourceStatus("unavailable");
          setFuelPricesError("No pudimos obtener los precios de combustible.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPrices(false);
        }
      }
    }

    void loadFuelPrices();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedFuel = fuelPrices.find((fuel) => fuel.type === fuelType) ?? null;
  const selectedPrice = selectedFuel?.pricePerGallon ?? null;
  const hasValidPrice = selectedPrice !== null && Number.isFinite(selectedPrice) && selectedPrice > 0;

  const fuelSourceLabel =
    fuelSourceStatus === "official"
      ? "Fuente oficial"
      : fuelSourceStatus === "secondary"
        ? "Fuente secundaria"
        : "Precio temporalmente no disponible";

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
    const parsedConsumption = Number(consumption);

    if (!originQuery || !destinationQuery) {
      setError("Ingresa tu punto de salida y tu destino para calcular la ruta.");
      return;
    }

    if (!consumption.trim()) {
      setError("Ingresa el consumo de tu vehículo para calcular el combustible.");
      return;
    }

    if (!Number.isFinite(parsedConsumption) || parsedConsumption <= 0) {
      setError("Ingresa un consumo válido mayor que cero.");
      return;
    }

    setIsLoading(true);
    setDistanceKm(null);
    setDurationMinutes(null);
    setFuelGallons(null);
    setFuelCost(null);
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

      const { gallons } = calculateFuelNeeded(data.distanceKm, parsedConsumption);
      const cost = hasValidPrice
        ? calculateTripFuel(data.distanceKm, parsedConsumption, selectedPrice).cost
        : null;

      setDistanceKm(data.distanceKm);
      setDurationMinutes(data.durationMinutes);
      setFuelGallons(gallons);
      setFuelCost(cost);
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
                <input id="origin" name="origin" type="text" value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="Ciudad o ubicación" autoComplete="street-address" className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none" />
              </div>

              <div>
                <label htmlFor="destination" className="text-sm font-medium">¿A dónde vas?</label>
                <input id="destination" name="destination" type="text" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Ciudad o ubicación" autoComplete="street-address" className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none" />
              </div>
