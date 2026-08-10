"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { calculateFuelNeeded, calculateTripFuel } from "@/lib/fuel";
import type { FuelPriceRecord, FuelPricesResponse } from "@/lib/fuel-price-types";

const TripMap = dynamic(() => import("@/components/TripMap"), { ssr: false });
const LocationPickerMap = dynamic(() => import("@/components/LocationPickerMap"), {
  ssr: false,
});

type Coordinate = [number, number];
type TripType = "oneWay" | "roundTrip";

type GeocodeResult = {
  displayName: string;
  lat: number;
  lng: number;
};

type ReverseGeocodeResult = {
  displayName: string | null;
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
  const [tripType, setTripType] = useState<TripType>("oneWay");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originCoordinate, setOriginCoordinate] = useState<Coordinate | null>(null);
  const [destinationCoordinate, setDestinationCoordinate] = useState<Coordinate | null>(null);
  const [pickerTarget, setPickerTarget] = useState<"origin" | "destination" | null>(null);
  const [kilometers, setKilometers] = useState("");
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
        if (!cancelled) setIsLoadingPrices(false);
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
  const tripMultiplier = tripType === "roundTrip" ? 2 : 1;
  const fuelSourceLabel =
    fuelSourceStatus === "official"
      ? "Fuente oficial"
      : fuelSourceStatus === "secondary"
        ? "Fuente secundaria"
        : "Precio temporalmente no disponible";

  function clearResults() {
    setDistanceKm(null);
    setDurationMinutes(null);
    setFuelGallons(null);
    setFuelCost(null);
    setRouteCoordinates([]);
    setError(null);
  }

  function changeMode(nextMode: "ruta" | "kilometros") {
    if (nextMode === mode) return;
    setMode(nextMode);
    setPickerTarget(null);
    clearResults();
  }

  function changeTripType(nextTripType: TripType) {
    if (nextTripType === tripType) return;
    setTripType(nextTripType);
    clearResults();
  }

  async function geocodeLocation(query: string): Promise<GeocodeResult> {
    const params = new URLSearchParams({ q: query });
    const response = await fetch(`/api/geocode?${params.toString()}`);
    const data = (await response.json()) as GeocodeResult[] | { error?: string };

    if (!response.ok) throw new Error("No pudimos buscar una de las ubicaciones.");
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

  async function reverseGeocode(coordinate: Coordinate): Promise<string | null> {
    const params = new URLSearchParams({ lat: String(coordinate[0]), lng: String(coordinate[1]) });
    const response = await fetch(`/api/geocode/reverse?${params.toString()}`);
    if (!response.ok) return null;

    const data = (await response.json()) as ReverseGeocodeResult;
    return typeof data.displayName === "string" && data.displayName.trim()
      ? data.displayName
      : null;
  }

  async function handleMapConfirm(coordinate: Coordinate) {
    const target = pickerTarget;
    if (!target) return;

    setError(null);
    if (target === "origin") {
      setOriginCoordinate(coordinate);
    } else {
      setDestinationCoordinate(coordinate);
    }

    setPickerTarget(null);

    try {
      const displayName = await reverseGeocode(coordinate);
      const fallback = `${coordinate[0].toFixed(5)}, ${coordinate[1].toFixed(5)}`;
      if (target === "origin") setOrigin(displayName ?? fallback);
      else setDestination(displayName ?? fallback);
    } catch {
      const fallback = `${coordinate[0].toFixed(5)}, ${coordinate[1].toFixed(5)}`;
      if (target === "origin") setOrigin(fallback);
      else setDestination(fallback);
    }
  }

  async function handleCalculate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedConsumption = Number(consumption);
    if (!consumption.trim()) {
      setError("Ingresa el consumo de tu vehículo para calcular el combustible.");
      return;
    }
    if (!Number.isFinite(parsedConsumption) || parsedConsumption <= 0) {
      setError("Ingresa un consumo válido mayor que cero.");
      return;
    }

    const parsedKilometers = Number(kilometers);
    if (mode === "kilometros") {
      if (!kilometers.trim()) {
        setError("Ingresa los kilómetros del viaje.");
        return;
      }
      if (!Number.isFinite(parsedKilometers) || parsedKilometers <= 0) {
        setError("Ingresa una distancia válida mayor que cero.");
        return;
      }

      const totalDistanceKm = parsedKilometers * tripMultiplier;
      setIsLoading(true);
      clearResults();

      try {
        const { gallons } = calculateFuelNeeded(totalDistanceKm, parsedConsumption);
        const cost =
          hasValidPrice && selectedPrice !== null
            ? calculateTripFuel(totalDistanceKm, parsedConsumption, selectedPrice).cost
            : null;

        setDistanceKm(totalDistanceKm);
        setFuelGallons(gallons);
        setFuelCost(cost);
      } catch (calculationError) {
        setError(
          calculationError instanceof Error
            ? calculationError.message
            : "No pudimos calcular el consumo del viaje.",
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const originQuery = origin.trim();
    const destinationQuery = destination.trim();
    if ((!originQuery && !originCoordinate) || (!destinationQuery && !destinationCoordinate)) {
      setError("Ingresa o selecciona tu punto de salida y tu destino.");
      return;
    }

    setIsLoading(true);
    clearResults();

    try {
      const [originLocation, destinationLocation] = await Promise.all([
        originCoordinate
          ? Promise.resolve({ lat: originCoordinate[0], lng: originCoordinate[1] })
          : geocodeLocation(originQuery),
        destinationCoordinate
          ? Promise.resolve({ lat: destinationCoordinate[0], lng: destinationCoordinate[1] })
          : geocodeLocation(destinationQuery),
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

      const totalDistanceKm = data.distanceKm * tripMultiplier;
      const { gallons } = calculateFuelNeeded(totalDistanceKm, parsedConsumption);
      const cost =
        hasValidPrice && selectedPrice !== null
          ? calculateTripFuel(totalDistanceKm, parsedConsumption, selectedPrice).cost
          : null;

      setDistanceKm(totalDistanceKm);
      setDurationMinutes(data.durationMinutes * tripMultiplier);
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

  function openPicker(target: "origin" | "destination") {
    setError(null);
    setPickerTarget(target);
  }

  function formatDuration(minutes: number | null): string {
    if (minutes === null) return "—";
    const roundedMinutes = Math.round(minutes);
    const hours = Math.floor(roundedMinutes / 60);
    const remainingMinutes = roundedMinutes % 60;
    if (hours === 0) return `${remainingMinutes} min`;
    return `${hours} h ${String(remainingMinutes).padStart(2, "0")} min`;
  }

  const modeDescription =
    mode === "ruta"
      ? "Selecciona un origen y un destino para calcular la distancia real, tiempo, combustible y costo del viaje."
      : "Si ya conoces la distancia, introduce directamente los kilómetros del viaje.";

  return (
    <main className="min-h-screen w-full bg-[var(--background)]">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] focus-visible:ring-offset-2">
            Calcula<span className="text-[var(--wine)]">EC</span>
          </Link>
          <Link href="/" className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--wine)] motion-reduce:transition-none">
            Volver al inicio
          </Link>
        </header>

        <section aria-labelledby="trip-title" className="max-w-3xl">
          <p className="text-sm font-medium text-[var(--wine)]">Combustible · Ecuador</p>
          <h1 id="trip-title" className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Viaje por kilómetros</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
            Calcula cuánto combustible y dinero necesitas para llegar a tu destino.
          </p>
        </section>

        <section className="mt-10" aria-labelledby="mode-title">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="mode-title" className="text-sm font-semibold text-[var(--foreground)]">¿Cómo quieres calcular tu viaje?</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">{modeDescription}</p>
            </div>
            <div className="inline-flex w-full rounded-2xl border border-[var(--border)] bg-white p-1 shadow-sm sm:w-auto" role="tablist" aria-label="Modo de cálculo">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "ruta"}
                onClick={() => changeMode("ruta")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition motion-reduce:transition-none sm:flex-none ${mode === "ruta" ? "bg-[var(--wine)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
              >
                🗺️ Por ruta
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "kilometros"}
                onClick={() => changeMode("kilometros")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition motion-reduce:transition-none sm:flex-none ${mode === "kilometros" ? "bg-[var(--wine)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
              >
                🔢 Por kilómetros
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="trip-type-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="trip-type-title" className="text-sm font-semibold text-[var(--foreground)]">Tipo de viaje</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                {tripType === "roundTrip" ? "Origen → Destino → Origen" : "Origen → Destino"}
              </p>
            </div>
            <div className="grid w-full grid-cols-2 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-1 sm:w-auto" role="group" aria-label="Tipo de viaje">
              <button
                type="button"
                aria-pressed={tripType === "oneWay"}
                onClick={() => changeTripType("oneWay")}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition motion-reduce:transition-none ${tripType === "oneWay" ? "bg-[var(--wine)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
              >
                🛣️ Solo ida
              </button>
              <button
                type="button"
                aria-pressed={tripType === "roundTrip"}
                onClick={() => changeTripType("roundTrip")}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition motion-reduce:transition-none ${tripType === "roundTrip" ? "bg-[var(--wine)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
              >
                🔄 Ida y vuelta
              </button>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          {mode === "ruta" && (
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-[var(--border)] bg-white p-1 shadow-sm">
                <TripMap routeCoordinates={routeCoordinates} />
              </div>
            </div>
          )}

          <section className={mode === "ruta" ? "rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm sm:p-7" : "mx-auto w-full max-w-2xl rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm sm:p-7"} aria-labelledby="trip-form-title">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">{mode === "ruta" ? "Configura tu ruta" : "Calcula con una distancia conocida"}</p>
              <h2 id="trip-form-title" className="mt-2 text-2xl font-semibold tracking-tight">Datos del recorrido</h2>
            </div>

            <form className="mt-7 space-y-5" onSubmit={handleCalculate}>
              {mode === "ruta" ? (
                <>
                  <div>
                    <label htmlFor="origin" className="text-sm font-medium">¿De dónde sales?</label>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input id="origin" name="origin" type="text" value={origin} onChange={(event) => { setOrigin(event.target.value); setOriginCoordinate(null); }} placeholder="Ciudad o ubicación" autoComplete="street-address" className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none" />
                      <button type="button" onClick={() => openPicker("origin")} className="shrink-0 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--wine)]/30 hover:text-[var(--wine)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] motion-reduce:transition-none">
                        📍 Elegir en mapa
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="destination" className="text-sm font-medium">¿A dónde vas?</label>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input id="destination" name="destination" type="text" value={destination} onChange={(event) => { setDestination(event.target.value); setDestinationCoordinate(null); }} placeholder="Ciudad o ubicación" autoComplete="street-address" className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none" />
                      <button type="button" onClick={() => openPicker("destination")} className="shrink-0 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--wine)]/30 hover:text-[var(--wine)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] motion-reduce:transition-none">
                        📍 Elegir en mapa
                      </button>
                    </div>
                  </div>

                  {pickerTarget && (
                    <div className="rounded-[1.75rem] border border-[var(--wine)]/15 bg-[var(--background)] p-3" aria-live="polite">
                      <div className="mb-3 flex items-start justify-between gap-3 px-2 pt-1">
                        <div>
                          <p className="text-sm font-semibold text-[var(--foreground)]">
                            {pickerTarget === "origin" ? "Selecciona el punto de partida en el mapa" : "Selecciona el destino en el mapa"}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted)]">Puedes tocar o hacer clic en cualquier punto y cambiarlo antes de confirmar.</p>
                        </div>
                        <button type="button" onClick={() => setPickerTarget(null)} className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--wine)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)]">
                          Cerrar
                        </button>
                      </div>
                      <LocationPickerMap
                        initialCoordinate={pickerTarget === "origin" ? originCoordinate : destinationCoordinate}
                        onConfirm={handleMapConfirm}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label htmlFor="kilometers" className="text-sm font-medium">Kilómetros</label>
                  <div className="relative mt-2">
                    <input id="kilometers" name="kilometers" type="number" min="0.01" step="0.01" value={kilometers} onChange={(event) => setKilometers(event.target.value)} placeholder="Ej. 250" inputMode="decimal" className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 pr-16 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none" />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-[var(--muted)]">km</span>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="consumption" className="text-sm font-medium">Consumo de tu vehículo</label>
                <input id="consumption" name="consumption" type="number" min="0.01" step="0.01" value={consumption} onChange={(event) => setConsumption(event.target.value)} placeholder="Ej. 40 km/galón" inputMode="decimal" className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none" />
              </div>

              <div>
                <label htmlFor="fuel" className="text-sm font-medium">Tipo de combustible</label>
                <select id="fuel" name="fuel" value={fuelType} onChange={(event) => setFuelType(event.target.value as FuelPriceRecord["type"])} className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none">
                  {fuelOptions.map((fuel) => <option key={fuel.value} value={fuel.value}>{fuel.label}</option>)}
                </select>
              </div>

              <div className="space-y-1 text-xs text-[var(--muted)]" aria-live="polite">
                {isLoadingPrices && <p>Cargando precios de combustible…</p>}
                {fuelPricesError && <p role="status">{fuelPricesError}</p>}
                {!isLoadingPrices && <p>{fuelSourceLabel}</p>}
                {!isLoadingPrices && !fuelPricesError && !hasValidPrice && <p>Precio no disponible</p>}
                {!isLoadingPrices && !fuelPricesError && hasValidPrice && selectedPrice !== null && <p>Precio: ${selectedPrice.toFixed(2)}/gal</p>}
                {selectedFuel?.source && <p>Fuente: {selectedFuel.source}</p>}
                {selectedFuel?.sourceUrl && <p>Fuente: {selectedFuel.sourceUrl}</p>}
                {selectedFuel?.updatedAt && <p>Actualizado: {selectedFuel.updatedAt}</p>}
              </div>

              {error && <p role="alert" className="rounded-2xl border border-[var(--border)] bg-[var(--cream)] px-4 py-3 text-sm text-[var(--wine)]">{error}</p>}

              <button type="submit" disabled={isLoading} className="w-full rounded-2xl bg-[var(--wine)] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--wine-dark)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 motion-reduce:transform-none motion-reduce:transition-none">
                {isLoading ? "Calculando…" : mode === "ruta" ? "Calcular viaje" : "Calcular combustible"}
              </button>
            </form>
          </section>
        </div>

        <section className="mt-6 rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm sm:p-7" aria-labelledby="results-title">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Resultado · {mode === "ruta" ? "Por ruta" : "Por kilómetros"}</p>
              <h2 id="results-title" className="mt-2 text-xl font-semibold tracking-tight">Resumen del cálculo</h2>
            </div>
            <span className="text-xs text-[var(--muted)]">{isLoading ? "Calculando…" : tripType === "roundTrip" ? "Origen → Destino → Origen" : "Origen → Destino"}</span>
          </div>

          <div className={`mt-6 grid gap-3 ${mode === "ruta" ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="text-xs text-[var(--muted)]">Distancia de ida</p>
              <p className="mt-2 text-xl font-semibold tracking-tight">{distanceKm === null ? "—" : `${(distanceKm / tripMultiplier).toFixed(2)} km`}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="text-xs text-[var(--muted)]">Distancia total</p>
              <p className="mt-2 text-xl font-semibold tracking-tight">{distanceKm === null ? "—" : `${distanceKm.toFixed(2)} km`}</p>
            </div>
            {mode === "ruta" && (
              <>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <p className="text-xs text-[var(--muted)]">Duración de ida</p>
                  <p className="mt-2 text-xl font-semibold tracking-tight">{durationMinutes === null ? "—" : formatDuration(durationMinutes / tripMultiplier)}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <p className="text-xs text-[var(--muted)]">Duración total</p>
                  <p className="mt-2 text-xl font-semibold tracking-tight">{formatDuration(durationMinutes)}</p>
                </div>
              </>
            )}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="text-xs text-[var(--muted)]">Combustible total</p>
              <p className="mt-2 text-xl font-semibold tracking-tight">{fuelGallons === null ? "—" : `${fuelGallons.toFixed(2)} gal`}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="text-xs text-[var(--muted)]">Costo total</p>
              <p className="mt-2 text-xl font-semibold tracking-tight">{fuelCost === null ? "No disponible" : `$${fuelCost.toFixed(2)}`}</p>
            </div>
          </div>
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-[var(--muted)]">Los precios de combustible se actualizarán automáticamente cuando conectemos la fuente de datos.</p>
      </div>
    </main>
  );
}
