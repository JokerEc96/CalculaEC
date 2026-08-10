"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { calculateFuelNeeded, calculateTripFuel } from "@/lib/fuel";
import type { FuelPriceRecord, FuelPricesResponse } from "@/lib/fuel-price-types";

const TripMap = dynamic(() => import("@/components/TripMap"), { ssr: false });
const LocationPickerMap = dynamic(() => import("@/components/LocationPickerMap"), { ssr: false });

type Coordinate = [number, number];
type TripType = "oneWay" | "roundTrip" | "multiStop";
type Mode = "ruta" | "kilometros";
type PickerTarget = "origin" | "destination" | { type: "stop"; id: string };
type GeocodeResult = { displayName: string; lat: number; lng: number };
type ReverseGeocodeResult = { displayName: string | null };
type RouteResponse = { distanceKm: number; durationMinutes: number; geometry: { type: "LineString"; coordinates: [number, number][] } };
type LocationPoint = { id: string; label: string; text: string; coordinate: Coordinate | null; results: GeocodeResult[] };
type LegResult = { from: string; to: string; distanceKm: number; durationMinutes: number; geometry: [number, number][] };

const fuelOptions = [
  { value: "ecopais", label: "Ecopaís" },
  { value: "super", label: "Súper" },
  { value: "diesel", label: "Diésel" },
] as const;

function createStop(index: number): LocationPoint {
  return { id: `stop-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`, label: `Parada ${index}`, text: "", coordinate: null, results: [] };
}

export default function TripCalculatorPage() {
  const [mode, setMode] = useState<Mode>("ruta");
  const [tripType, setTripType] = useState<TripType>("oneWay");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originCoordinate, setOriginCoordinate] = useState<Coordinate | null>(null);
  const [destinationCoordinate, setDestinationCoordinate] = useState<Coordinate | null>(null);
  const [originResults, setOriginResults] = useState<GeocodeResult[]>([]);
  const [destinationResults, setDestinationResults] = useState<GeocodeResult[]>([]);
  const [stops, setStops] = useState<LocationPoint[]>([]);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [kilometers, setKilometers] = useState("");
  const [consumption, setConsumption] = useState("");
  const [fuelType, setFuelType] = useState<FuelPriceRecord["type"]>("ecopais");
  const [fuelPrices, setFuelPrices] = useState<FuelPriceRecord[]>([]);
  const [fuelSourceStatus, setFuelSourceStatus] = useState<FuelPricesResponse["sourceStatus"]>("unavailable");
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [fuelPricesError, setFuelPricesError] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [routeCoordinateSets, setRouteCoordinateSets] = useState<[number, number][][]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [fuelGallons, setFuelGallons] = useState<number | null>(null);
  const [fuelCost, setFuelCost] = useState<number | null>(null);
  const [legResults, setLegResults] = useState<LegResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const calculationIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function loadFuelPrices() {
      try {
        const response = await fetch("/api/fuel-prices");
        const data = (await response.json()) as FuelPricesResponse | { error?: string };
        if (!response.ok || !data || !Array.isArray((data as FuelPricesResponse).prices) || typeof (data as FuelPricesResponse).fetchedAt !== "string" || !["official", "secondary", "unavailable"].includes((data as FuelPricesResponse).sourceStatus)) {
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
    return () => { cancelled = true; };
  }, []);

  const selectedFuel = fuelPrices.find((fuel) => fuel.type === fuelType) ?? null;
  const selectedPrice = selectedFuel?.pricePerGallon ?? null;
  const hasValidPrice = selectedPrice !== null && Number.isFinite(selectedPrice) && selectedPrice > 0;
  const tripMultiplier = tripType === "roundTrip" ? 2 : 1;
  const fuelSourceLabel = fuelSourceStatus === "official" ? "Fuente oficial" : fuelSourceStatus === "secondary" ? "Fuente secundaria" : "Precio temporalmente no disponible";

  function clearResults() {
    setDistanceKm(null);
    setDurationMinutes(null);
    setFuelGallons(null);
    setFuelCost(null);
    setLegResults([]);
    setRouteCoordinates([]);
    setRouteCoordinateSets([]);
  }

  function clearGeocodeResults() {
    setOriginResults([]);
    setDestinationResults([]);
    setStops((current) => current.map((stop) => ({ ...stop, results: [] })));
  }

  function invalidateCalculation(clearResult = true) {
    calculationIdRef.current += 1;
    setIsLoading(false);
    setIsGeocoding(false);
    if (clearResult) clearResults();
  }

  function changeMode(nextMode: Mode) {
    if (nextMode === mode) return;
    invalidateCalculation();
    setMode(nextMode);
    setTripType("oneWay");
    setPickerTarget(null);
    clearGeocodeResults();
    setError(null);
  }

  function changeTripType(nextTripType: TripType) {
    if (nextTripType === tripType) return;
    invalidateCalculation();
    setTripType(nextTripType);
    setPickerTarget(null);
    clearGeocodeResults();
    setError(null);
  }

  function isValidGeocodeResult(result: GeocodeResult | undefined): result is GeocodeResult {
    return Boolean(result && typeof result.displayName === "string" && result.displayName.trim() && typeof result.lat === "number" && Number.isFinite(result.lat) && typeof result.lng === "number" && Number.isFinite(result.lng));
  }

  async function geocodeLocation(query: string): Promise<GeocodeResult[]> {
    const params = new URLSearchParams({ q: query });
    const response = await fetch(`/api/geocode?${params.toString()}`);
    const data = (await response.json()) as GeocodeResult[] | { error?: string };
    if (!response.ok) throw new Error("No pudimos buscar una de las ubicaciones.");
    if (!Array.isArray(data)) throw new Error("No pudimos interpretar los resultados de ubicación.");
    return data.filter((result): result is GeocodeResult => isValidGeocodeResult(result));
  }

  async function reverseGeocode(coordinate: Coordinate): Promise<string | null> {
    const params = new URLSearchParams({ lat: String(coordinate[0]), lng: String(coordinate[1]) });
    const response = await fetch(`/api/geocode/reverse?${params.toString()}`);
    if (!response.ok) return null;
    const data = (await response.json()) as ReverseGeocodeResult;
    return typeof data.displayName === "string" && data.displayName.trim() ? data.displayName : null;
  }

  function getLocationPoint(target: PickerTarget): LocationPoint | null {
    if (target === "origin") return { id: "origin", label: "Origen", text: origin, coordinate: originCoordinate, results: originResults };
    if (target === "destination") return { id: "destination", label: "Destino", text: destination, coordinate: destinationCoordinate, results: destinationResults };
    return stops.find((stop) => stop.id === target.id) ?? null;
  }

  function setLocationResults(target: PickerTarget, results: GeocodeResult[]) {
    if (target === "origin") setOriginResults(results);
    else if (target === "destination") setDestinationResults(results);
    else setStops((current) => current.map((stop) => stop.id === target.id ? { ...stop, results } : stop));
  }

  function clearLocationResults(target: PickerTarget) {
    setLocationResults(target, []);
  }

  function updateStop(id: string, value: string) {
    invalidateCalculation();
    setStops((current) => current.map((stop) => stop.id === id ? { ...stop, text: value, coordinate: null, results: [] } : stop));
    setError(null);
  }

  function updateOrigin(value: string) {
    invalidateCalculation();
    setOrigin(value);
    setOriginCoordinate(null);
    setOriginResults([]);
    setError(null);
  }

  function updateDestination(value: string) {
    invalidateCalculation();
    setDestination(value);
    setDestinationCoordinate(null);
    setDestinationResults([]);
    setError(null);
  }

  function addStop() {
    if (stops.length >= 5) return;
    invalidateCalculation();
    setStops((current) => [...current, createStop(current.length + 1)]);
    setError(null);
  }

  function removeStop(id: string) {
    invalidateCalculation();
    setStops((current) => current.filter((stop) => stop.id !== id).map((stop, index) => ({ ...stop, label: `Parada ${index + 1}` })));
    setPickerTarget((current) => current && typeof current === "object" && current.type === "stop" && current.id === id ? null : current);
    setError(null);
  }

  function openPicker(target: PickerTarget) {
    invalidateCalculation();
    setError(null);
    clearLocationResults(target);
    setPickerTarget(target);
  }

  function handleGeocodeSelection(target: PickerTarget, result: GeocodeResult) {
    invalidateCalculation();
    setError(null);
    clearLocationResults(target);
    if (target === "origin") {
      setOrigin(result.displayName);
      setOriginCoordinate([result.lat, result.lng]);
    } else if (target === "destination") {
      setDestination(result.displayName);
      setDestinationCoordinate([result.lat, result.lng]);
    } else {
      setStops((current) => current.map((stop) => stop.id === target.id ? { ...stop, text: result.displayName, coordinate: [result.lat, result.lng], results: [] } : stop));
    }
  }

  async function handleMapConfirm(coordinate: Coordinate) {
    const target = pickerTarget;
    if (!target) return;
    invalidateCalculation();
    setError(null);
    clearLocationResults(target);
    setPickerTarget(null);
    try {
      const displayName = await reverseGeocode(coordinate);
      const fallback = `${coordinate[0].toFixed(5)}, ${coordinate[1].toFixed(5)}`;
      const text = displayName ?? fallback;
      if (target === "origin") {
        setOriginCoordinate(coordinate);
        setOrigin(text);
      } else if (target === "destination") {
        setDestinationCoordinate(coordinate);
        setDestination(text);
      } else {
        setStops((current) => current.map((stop) => stop.id === target.id ? { ...stop, coordinate, text, results: [] } : stop));
      }
    } catch {
      const fallback = `${coordinate[0].toFixed(5)}, ${coordinate[1].toFixed(5)}`;
      if (target === "origin") {
        setOriginCoordinate(coordinate);
        setOrigin(fallback);
      } else if (target === "destination") {
        setDestinationCoordinate(coordinate);
        setDestination(fallback);
      } else {
        setStops((current) => current.map((stop) => stop.id === target.id ? { ...stop, coordinate, text: fallback, results: [] } : stop));
      }
    }
  }

  async function resolvePoint(point: LocationPoint, calculationId: number): Promise<Coordinate> {
    if (point.coordinate) return point.coordinate;
    if (!point.text.trim()) throw new Error(`Selecciona una ubicación para ${point.label}.`);
    const results = await geocodeLocation(point.text.trim());
    if (calculationId !== calculationIdRef.current) throw new Error("El cálculo anterior fue cancelado.");
    if (results.length === 0) throw new Error(`No encontramos resultados para ${point.label.toLowerCase()}.`);
    if (results.length > 1) {
      setLocationResults(point.id === "origin" ? "origin" : point.id === "destination" ? "destination" : { type: "stop", id: point.id }, results);
      throw new Error(`Selecciona ${point.label.toLowerCase()} de la lista de resultados.`);
    }
    const result = results[0];
    if (!result) throw new Error(`No encontramos una ubicación válida para ${point.label.toLowerCase()}.`);
    return [result.lat, result.lng];
  }

  async function requestRoute(from: Coordinate, to: Coordinate): Promise<RouteResponse> {
    if (from[0] === to[0] && from[1] === to[1]) throw new Error("Dos puntos consecutivos no pueden ser el mismo lugar.");
    const params = new URLSearchParams({ originLat: String(from[0]), originLng: String(from[1]), destinationLat: String(to[0]), destinationLng: String(to[1]) });
    const response = await fetch(`/api/route?${params.toString()}`);
    const data = (await response.json()) as RouteResponse | { error?: string };
    if (!response.ok || !("distanceKm" in data) || !("durationMinutes" in data) || !data.geometry || data.geometry.type !== "LineString") throw new Error("No pudimos calcular uno de los tramos de la ruta.");
    return data;
  }

  async function calculateMultiStopRoute(points: LocationPoint[], parsedConsumption: number, price: number | null, calculationId: number) {
    const resolved: Coordinate[] = [];
    for (const point of points) {
      resolved.push(await resolvePoint(point, calculationId));
    }
    if (calculationId !== calculationIdRef.current) return;

    for (let index = 1; index < resolved.length; index += 1) {
      if (resolved[index - 1]?.[0] === resolved[index]?.[0] && resolved[index - 1]?.[1] === resolved[index]?.[1]) {
        throw new Error(`${points[index]?.label ?? "La parada"} coincide con la ubicación anterior.`);
      }
    }

    const legs: LegResult[] = [];
    for (let index = 0; index < resolved.length - 1; index += 1) {
      if (calculationId !== calculationIdRef.current) return;
      const from = resolved[index];
      const to = resolved[index + 1];
      if (!from || !to) throw new Error("No pudimos determinar uno de los puntos de la ruta.");
      const route = await requestRoute(from, to);
      legs.push({ from: points[index]?.label ?? `Punto ${index + 1}`, to: points[index + 1]?.label ?? `Punto ${index + 2}`, distanceKm: route.distanceKm, durationMinutes: route.durationMinutes, geometry: route.geometry.coordinates });
    }
    if (calculationId !== calculationIdRef.current) return;

    const totalDistance = legs.reduce((sum, leg) => sum + leg.distanceKm, 0);
    const totalDuration = legs.reduce((sum, leg) => sum + leg.durationMinutes, 0);
    const { gallons } = calculateFuelNeeded(totalDistance, parsedConsumption);
    const cost = price !== null && Number.isFinite(price) && price > 0 ? calculateTripFuel(totalDistance, parsedConsumption, price).cost : null;
    setDistanceKm(totalDistance);
    setDurationMinutes(totalDuration);
    setFuelGallons(gallons);
    setFuelCost(cost);
    setLegResults(legs);
    setRouteCoordinateSets(legs.map((leg) => leg.geometry));
    setRouteCoordinates([]);
    setOriginCoordinate(resolved[0] ?? null);
    setDestinationCoordinate(resolved[resolved.length - 1] ?? null);

    setOrigin((current) => current || points[0]?.text || "");
    setDestination((current) => current || points[points.length - 1]?.text || "");
    setStops((current) => current.map((stop, index) => ({ ...stop, coordinate: resolved[index + 1] ?? stop.coordinate })));
  }

  async function handleCalculate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    const calculationId = calculationIdRef.current + 1;
    calculationIdRef.current = calculationId;
    setError(null);
    clearGeocodeResults();
    const parsedConsumption = Number(consumption);
    if (!consumption.trim()) { setError("Ingresa el consumo de tu vehículo para calcular el combustible."); return; }
    if (!Number.isFinite(parsedConsumption) || parsedConsumption <= 0) { setError("Ingresa un consumo válido mayor que cero."); return; }
    const parsedKilometers = Number(kilometers);

    if (mode === "kilometros") {
      if (!kilometers.trim()) { setError("Ingresa los kilómetros del viaje."); return; }
      if (!Number.isFinite(parsedKilometers) || parsedKilometers <= 0) { setError("Ingresa una distancia válida mayor que cero."); return; }
      const totalDistanceKm = parsedKilometers * tripMultiplier;
      setIsLoading(true);
      clearResults();
      try {
        const { gallons } = calculateFuelNeeded(totalDistanceKm, parsedConsumption);
        const cost = hasValidPrice && selectedPrice !== null ? calculateTripFuel(totalDistanceKm, parsedConsumption, selectedPrice).cost : null;
        if (calculationId !== calculationIdRef.current) return;
        setDistanceKm(totalDistanceKm);
        setFuelGallons(gallons);
        setFuelCost(cost);
      } catch (calculationError) {
        if (calculationId === calculationIdRef.current) setError(calculationError instanceof Error ? calculationError.message : "No pudimos calcular el consumo del viaje.");
      } finally {
        if (calculationId === calculationIdRef.current) setIsLoading(false);
      }
      return;
    }

    const routePoints: LocationPoint[] = [
      { id: "origin", label: "Origen", text: origin, coordinate: originCoordinate, results: originResults },
      ...(tripType === "multiStop" ? stops : []),
      { id: "destination", label: "Destino", text: destination, coordinate: destinationCoordinate, results: destinationResults },
    ];
    if (routePoints.length < 2) { setError("Necesitas al menos un origen y un destino."); return; }
    if (routePoints.some((point) => !point.coordinate && !point.text.trim())) {
      const missing = routePoints.find((point) => !point.coordinate && !point.text.trim());
      setError(`Selecciona una ubicación para ${missing?.label ?? "el punto de ruta"}.`);
      return;
    }

    setIsLoading(true);
    setIsGeocoding(routePoints.some((point) => !point.coordinate));
    clearResults();

    try {
      if (tripType === "multiStop") {
        await calculateMultiStopRoute(routePoints, parsedConsumption, hasValidPrice ? selectedPrice : null, calculationId);
      } else {
        const originPoint = routePoints[0];
        const destinationPoint = routePoints[1];
        if (!originPoint || !destinationPoint) throw new Error("No pudimos determinar el origen y el destino.");
        const resolvedOrigin = await resolvePoint(originPoint, calculationId);
        const resolvedDestination = await resolvePoint(destinationPoint, calculationId);
        if (calculationId !== calculationIdRef.current) return;
        const route = await requestRoute(resolvedOrigin, resolvedDestination);
        if (calculationId !== calculationIdRef.current) return;
        const totalDistanceKm = route.distanceKm * tripMultiplier;
        const totalDurationMinutes = route.durationMinutes * tripMultiplier;
        const { gallons } = calculateFuelNeeded(totalDistanceKm, parsedConsumption);
        const cost = hasValidPrice && selectedPrice !== null ? calculateTripFuel(totalDistanceKm, parsedConsumption, selectedPrice).cost : null;
        setDistanceKm(totalDistanceKm);
        setDurationMinutes(totalDurationMinutes);
        setFuelGallons(gallons);
        setFuelCost(cost);
        setLegResults([{ from: "Origen", to: "Destino", distanceKm: route.distanceKm, durationMinutes: route.durationMinutes, geometry: route.geometry.coordinates }]);
        setRouteCoordinates(route.geometry.coordinates);
        setRouteCoordinateSets([]);
        setOriginCoordinate(resolvedOrigin);
        setDestinationCoordinate(resolvedDestination);
        if (!originPoint.coordinate) setOrigin(routePoints[0]?.text ?? "");
        if (!destinationPoint.coordinate) setDestination(routePoints[1]?.text ?? "");
      }
      if (calculationId === calculationIdRef.current) setError(null);
    } catch (calculationError) {
      if (calculationId === calculationIdRef.current) setError(calculationError instanceof Error ? calculationError.message : "No pudimos calcular la ruta.");
    } finally {
      if (calculationId === calculationIdRef.current) {
        setIsGeocoding(false);
        setIsLoading(false);
      }
    }
  }

  function renderLocationField(target: PickerTarget, label: string, text: string, coordinate: Coordinate | null, results: GeocodeResult[], onChange: (value: string) => void, remove?: () => void) {
    const isPickerOpen = pickerTarget === target || (typeof pickerTarget === "object" && typeof target === "object" && pickerTarget.type === "stop" && target.type === "stop" && pickerTarget.id === target.id);
    return <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="flex items-center justify-between gap-3"><label htmlFor={`location-${target === "origin" || target === "destination" ? target : target.id}`} className="text-sm font-medium">{label}</label>{remove && <button type="button" onClick={remove} aria-label={`Eliminar ${label}`} className="rounded-lg px-2 py-1 text-sm font-semibold text-[var(--muted)] hover:text-[var(--wine)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)]">✕</button>}</div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row"><input id={`location-${target === "origin" || target === "destination" ? target : target.id}`} type="text" value={text} onChange={(event) => onChange(event.target.value)} placeholder="Ciudad o ubicación" autoComplete="street-address" className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none" /><button type="button" onClick={() => openPicker(target)} className="shrink-0 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--wine)]/30 hover:text-[var(--wine)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] motion-reduce:transition-none">📍 Elegir en mapa</button></div>
      {results.length > 0 && <div className="mt-3 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-sm" role="listbox" aria-label={`Resultados para ${label}`}><p className="px-3 py-2 text-xs font-semibold text-[var(--muted)]">¿A cuál te refieres?</p><div className="max-h-56 overflow-y-auto">{results.map((result, index) => <button key={`${result.lat}-${result.lng}-${index}`} type="button" role="option" aria-label={`Seleccionar ${result.displayName}`} onClick={() => handleGeocodeSelection(target, result)} className="block w-full rounded-xl px-3 py-3 text-left text-sm text-[var(--foreground)] transition hover:bg-[var(--background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] motion-reduce:transition-none"><span className="block font-medium">📍 {result.displayName}</span></button>)}</div><button type="button" onClick={() => clearLocationResults(target)} className="mt-2 w-full rounded-xl px-3 py-2 text-xs font-medium text-[var(--muted)] hover:text-[var(--wine)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)]">Cancelar</button></div>}
      {isPickerOpen && <div className="mt-3 rounded-[1.5rem] border border-[var(--wine)]/15 bg-white p-3" aria-live="polite"><div className="mb-3 flex items-start justify-between gap-3 px-2 pt-1"><div><p className="text-sm font-semibold text-[var(--foreground)]">Seleccionando {label}</p><p className="mt-1 text-xs text-[var(--muted)]">Puedes tocar o hacer clic en cualquier punto y cambiarlo antes de confirmar.</p></div><button type="button" onClick={() => setPickerTarget(null)} className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--wine)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)]">Cerrar</button></div><LocationPickerMap initialCoordinate={coordinate} onConfirm={handleMapConfirm} /></div>}
    </div>;
  }

  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return "—";
    const rounded = Math.round(minutes);
    const hours = Math.floor(rounded / 60);
    const mins = rounded % 60;
    return hours === 0 ? `${mins} min` : `${hours} h ${String(mins).padStart(2, "0")} min`;
  };
  const formatNumber = (value: number, maximumFractionDigits = 2) => new Intl.NumberFormat("es-EC", { minimumFractionDigits: 0, maximumFractionDigits }).format(value);
  const formatFixed = (value: number, digits = 2) => new Intl.NumberFormat("es-EC", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  const modeDescription = mode === "ruta" ? (tripType === "multiStop" ? "Crea una ruta con hasta 5 paradas intermedias y calcula cada tramo." : "Selecciona un origen y un destino para calcular la distancia real, tiempo, combustible y costo del viaje.") : "Si ya conoces la distancia, introduce directamente los kilómetros del viaje.";
  const mapStops = tripType === "multiStop" ? stops.map((stop) => stop.coordinate).filter((coordinate): coordinate is Coordinate => coordinate !== null) : [];

  return (
    <main className="min-h-screen w-full bg-[var(--background)]">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] focus-visible:ring-offset-2">Calcula<span className="text-[var(--wine)]">EC</span></Link>
          <Link href="/" className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--wine)] motion-reduce:transition-none">Volver al inicio</Link>
        </header>

        <section aria-labelledby="trip-title" className="max-w-3xl"><p className="text-sm font-medium text-[var(--wine)]">Combustible · Ecuador</p><h1 id="trip-title" className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Viaje por kilómetros</h1><p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">Calcula cuánto combustible y dinero necesitas para llegar a tu destino.</p></section>

        <section className="mt-10" aria-labelledby="mode-title"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="mode-title" className="text-sm font-semibold">¿Cómo quieres calcular tu viaje?</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">{modeDescription}</p></div><div className="inline-flex w-full rounded-2xl border border-[var(--border)] bg-white p-1 shadow-sm sm:w-auto" role="tablist" aria-label="Modo de cálculo"><button type="button" role="tab" aria-selected={mode === "ruta"} onClick={() => changeMode("ruta")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition motion-reduce:transition-none sm:flex-none ${mode === "ruta" ? "bg-[var(--wine)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>🗺️ Por ruta</button><button type="button" role="tab" aria-selected={mode === "kilometros"} onClick={() => changeMode("kilometros")} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition motion-reduce:transition-none sm:flex-none ${mode === "kilometros" ? "bg-[var(--wine)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>🔢 Por kilómetros</button></div></div></section>

        {mode === "ruta" && <section className="mt-6 rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="trip-type-title"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="trip-type-title" className="text-sm font-semibold">Tipo de viaje</h2><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{tripType === "multiStop" ? "Origen → Paradas → Destino" : tripType === "roundTrip" ? "Origen → Destino → Origen" : "Origen → Destino"}</p></div><div className="grid w-full grid-cols-1 gap-1 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-1 sm:w-auto sm:grid-cols-3" role="group" aria-label="Tipo de viaje"><button type="button" aria-pressed={tripType === "oneWay"} onClick={() => changeTripType("oneWay")} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition motion-reduce:transition-none ${tripType === "oneWay" ? "bg-[var(--wine)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>🛣️ Solo ida</button><button type="button" aria-pressed={tripType === "roundTrip"} onClick={() => changeTripType("roundTrip")} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition motion-reduce:transition-none ${tripType === "roundTrip" ? "bg-[var(--wine)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>🔄 Ida y vuelta</button><button type="button" aria-pressed={tripType === "multiStop"} onClick={() => changeTripType("multiStop")} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition motion-reduce:transition-none ${tripType === "multiStop" ? "bg-[var(--wine)] text-white shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>📍 Con paradas</button></div></div></section>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          {mode === "ruta" && <div className="space-y-6"><div className="rounded-[2rem] border border-[var(--border)] bg-white p-1 shadow-sm"><TripMap routeCoordinates={routeCoordinates} routeCoordinateSets={routeCoordinateSets} originCoordinate={originCoordinate} destinationCoordinate={destinationCoordinate} stopCoordinates={mapStops} /></div></div>}

          <section className={mode === "ruta" ? "rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm sm:p-7" : "mx-auto w-full max-w-2xl rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm sm:p-7"} aria-labelledby="trip-form-title"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">{mode === "ruta" ? "Configura tu ruta" : "Calcula con una distancia conocida"}</p><h2 id="trip-form-title" className="mt-2 text-2xl font-semibold tracking-tight">Datos del recorrido</h2></div>
            <form className="mt-7 space-y-5" onSubmit={handleCalculate}>
              {mode === "ruta" ? <>
                {renderLocationField("origin", "Origen", origin, originCoordinate, originResults, updateOrigin)}
                {tripType === "multiStop" && <div className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Paradas intermedias</h3><span className="text-xs text-[var(--muted)]">{stops.length}/5</span></div>{stops.map((stop) => renderLocationField({ type: "stop", id: stop.id }, stop.label, stop.text, stop.coordinate, stop.results, (value) => updateStop(stop.id, value), () => removeStop(stop.id)))}<button type="button" onClick={addStop} disabled={stops.length >= 5} className="w-full rounded-2xl border border-dashed border-[var(--wine)]/30 bg-[var(--background)] px-4 py-3 text-sm font-semibold text-[var(--wine)] transition hover:border-[var(--wine)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none">＋ Agregar parada</button></div>}
                {renderLocationField("destination", "Destino", destination, destinationCoordinate, destinationResults, updateDestination)}
              </> : <div><label htmlFor="kilometers" className="text-sm font-medium">Kilómetros</label><div className="relative mt-2"><input id="kilometers" name="kilometers" type="number" min="0.01" step="0.01" value={kilometers} onChange={(event) => { invalidateCalculation(); setKilometers(event.target.value); setError(null); }} placeholder="Ej. 250" inputMode="decimal" className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 pr-16 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none" /><span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-[var(--muted)]">km</span></div></div>}
              <div><label htmlFor="consumption" className="text-sm font-medium">Consumo de tu vehículo</label><input id="consumption" name="consumption" type="number" min="0.01" step="0.01" value={consumption} onChange={(event) => { invalidateCalculation(); setConsumption(event.target.value); setError(null); }} placeholder="Ej. 40 km/galón" inputMode="decimal" className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none" /></div>
              <div><label htmlFor="fuel" className="text-sm font-medium">Tipo de combustible</label><select id="fuel" name="fuel" value={fuelType} onChange={(event) => { invalidateCalculation(); setFuelType(event.target.value as FuelPriceRecord["type"]); setError(null); }} className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10 motion-reduce:transition-none">{fuelOptions.map((fuel) => <option key={fuel.value} value={fuel.value}>{fuel.label}</option>)}</select></div>
              <div className="space-y-1 text-xs text-[var(--muted)]" aria-live="polite">{isLoadingPrices && <p>Cargando precios de combustible…</p>}{fuelPricesError && <p role="status">{fuelPricesError}</p>}{!isLoadingPrices && <p>{fuelSourceLabel}</p>}{!isLoadingPrices && !fuelPricesError && !hasValidPrice && <p>Precio no disponible</p>}{!isLoadingPrices && !fuelPricesError && hasValidPrice && selectedPrice !== null && <p>Precio: ${selectedPrice.toFixed(2)}/gal</p>}{selectedFuel?.source && <p>Fuente: {selectedFuel.source}</p>}{selectedFuel?.sourceUrl && <p>Fuente: {selectedFuel.sourceUrl}</p>}{selectedFuel?.updatedAt && <p>Actualizado: {selectedFuel.updatedAt}</p>}</div>
              {error && <p role="alert" className="rounded-2xl border border-[var(--border)] bg-[var(--cream)] px-4 py-3 text-sm text-[var(--wine)]">{error}</p>}
              {isGeocoding && <p className="text-xs text-[var(--muted)]" role="status" aria-live="polite">Buscando ubicaciones…</p>}
              <button type="submit" disabled={isLoading} className="w-full rounded-2xl bg-[var(--wine)] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--wine-dark)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 motion-reduce:transform-none motion-reduce:transition-none">{isLoading ? "Calculando…" : mode === "ruta" ? "Calcular viaje" : "Calcular combustible"}</button>
            </form>
          </section>
        </div>

        <section className="mt-6 rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm sm:p-7" aria-labelledby="results-title"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Resultado · {mode === "ruta" ? "Por ruta" : "Por kilómetros"}</p><h2 id="results-title" className="mt-2 text-xl font-semibold tracking-tight">Resumen del cálculo</h2></div><span className="text-xs text-[var(--muted)]">{isLoading ? "Calculando…" : tripType === "multiStop" ? "Origen → Paradas → Destino" : tripType === "roundTrip" ? "Origen → Destino → Origen" : "Origen → Destino"}</span></div>
          <div className={`mt-6 grid gap-3 ${mode === "ruta" ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}><div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"><p className="text-xs text-[var(--muted)]">Distancia de ida</p><p className="mt-2 text-xl font-semibold tracking-tight">{distanceKm === null ? "—" : tripType === "multiStop" ? formatFixed(distanceKm) + " km" : formatFixed(distanceKm / tripMultiplier) + " km"}</p></div><div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"><p className="text-xs text-[var(--muted)]">Distancia total</p><p className="mt-2 text-xl font-semibold tracking-tight">{distanceKm === null ? "—" : formatFixed(distanceKm) + " km"}</p></div>{mode === "ruta" && <><div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"><p className="text-xs text-[var(--muted)]">Duración de ida</p><p className="mt-2 text-xl font-semibold tracking-tight">{durationMinutes === null ? "—" : tripType === "multiStop" ? formatDuration(durationMinutes) : formatDuration(durationMinutes / tripMultiplier)}</p></div><div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"><p className="text-xs text-[var(--muted)]">Duración total</p><p className="mt-2 text-xl font-semibold tracking-tight">{formatDuration(durationMinutes)}</p></div></> }<div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"><p className="text-xs text-[var(--muted)]">Combustible total</p><p className="mt-2 text-xl font-semibold tracking-tight">{fuelGallons === null ? "—" : `${formatFixed(fuelGallons)} gal`}</p></div><div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"><p className="text-xs text-[var(--muted)]">Costo total</p><p className="mt-2 text-xl font-semibold tracking-tight">{fuelCost === null ? "No disponible" : `$${formatFixed(fuelCost)}`}</p></div></div>
        </section>

        {tripType === "multiStop" && legResults.length > 0 && <section className="mt-6 rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm sm:p-7" aria-labelledby="legs-title"><p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Ruta por tramos</p><h2 id="legs-title" className="mt-2 text-xl font-semibold tracking-tight">Resumen de la ruta</h2><div className="mt-6 space-y-3">{legResults.map((leg, index) => <div key={`${leg.from}-${leg.to}-${index}`} className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><p className="font-semibold">Tramo {index + 1}</p><p className="text-sm text-[var(--muted)]">{leg.from} → {leg.to}</p></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><p className="text-xs text-[var(--muted)]">Distancia</p><p className="mt-1 font-semibold">{formatFixed(leg.distanceKm)} km</p></div><div><p className="text-xs text-[var(--muted)]">Duración</p><p className="mt-1 font-semibold">{formatDuration(leg.durationMinutes)}</p></div></div></div>)}</div><div className="mt-4 rounded-2xl border border-[var(--wine)]/15 bg-[var(--background)] p-4"><p className="text-xs text-[var(--muted)]">TOTAL</p><p className="mt-1 text-lg font-semibold">{formatFixed(distanceKm ?? 0)} km · {formatDuration(durationMinutes)}</p></div></section>}

        {distanceKm !== null && fuelGallons !== null && (() => {
          const breakdownDistance = distanceKm;
          const breakdownOneWayDistance = tripType === "multiStop" ? distanceKm : distanceKm / tripMultiplier;
          const breakdownGallons = fuelGallons;
          const breakdownCost = fuelCost;
          return <section className="mt-6 rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm sm:p-7" aria-labelledby="breakdown-title"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Transparencia del cálculo</p><h2 id="breakdown-title" className="mt-2 text-xl font-semibold tracking-tight">Desglose del cálculo</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Estos valores muestran cómo se obtiene el combustible y el costo a partir de los datos utilizados en el cálculo.</p></div><dl className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"><dt className="text-xs text-[var(--muted)]">{tripType === "roundTrip" ? "Distancia de ida" : "Distancia"}</dt><dd className="mt-2 text-lg font-semibold">{formatFixed(breakdownOneWayDistance)} km</dd></div>{tripType === "roundTrip" && <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"><dt className="text-xs text-[var(--muted)]">Distancia total</dt><dd className="mt-2 text-lg font-semibold">{formatFixed(breakdownDistance)} km</dd></div>}<div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"><dt className="text-xs text-[var(--muted)]">Rendimiento</dt><dd className="mt-2 text-lg font-semibold">{formatNumber(Number(consumption))} km/gal</dd></div></dl><div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"><p className="text-xs text-[var(--muted)]">{tripType === "roundTrip" || tripType === "multiStop" ? "Combustible total" : "Combustible necesario"}</p><p className="mt-2 text-base font-medium leading-7 sm:text-lg" aria-label={`${formatFixed(breakdownDistance)} kilómetros dividido entre ${formatNumber(Number(consumption))} kilómetros por galón es igual a ${formatFixed(breakdownGallons)} galones`}>{formatFixed(breakdownDistance)} ÷ {formatNumber(Number(consumption))} = <strong>{formatFixed(breakdownGallons)} gal</strong></p></div><dl className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"><dt className="text-xs text-[var(--muted)]">Precio del combustible</dt><dd className="mt-2 text-lg font-semibold">{hasValidPrice && selectedPrice !== null ? `$${formatFixed(selectedPrice)} / gal` : "No disponible"}</dd></div><div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"><dt className="text-xs text-[var(--muted)]">{tripType === "roundTrip" || tripType === "multiStop" ? "Costo total" : "Costo estimado"}</dt><dd className="mt-2 text-base font-semibold leading-7 sm:text-lg">{hasValidPrice && selectedPrice !== null && breakdownCost !== null ? <>{formatFixed(breakdownGallons)} × ${formatFixed(selectedPrice)} = <strong>${formatFixed(breakdownCost)}</strong></> : "No disponible"}</dd></div></dl></section>;
        })()}

        <p className="mt-6 text-center text-xs leading-5 text-[var(--muted)]">Los precios de combustible se actualizarán automáticamente cuando conectemos la fuente de datos.</p>
      </div>
    </main>
  );
}
