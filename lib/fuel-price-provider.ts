import type { FuelPriceRecord, FuelPricesResponse } from "@/lib/fuel-price-types";
import { getSecondaryFuelPrices } from "@/lib/fuel-price-secondary";
import { OFFICIAL_SOURCES, SECONDARY_SOURCES } from "@/lib/fuel-price-sources";

const emptyPrices: FuelPriceRecord[] = [
  {
    type: "ecopais",
    name: "Ecopaís",
    pricePerGallon: null,
    currency: "USD",
    validFrom: null,
    validUntil: null,
    source: null,
    sourceUrl: null,
    updatedAt: null,
  },
  {
    type: "super",
    name: "Súper",
    pricePerGallon: null,
    currency: "USD",
    validFrom: null,
    validUntil: null,
    source: null,
    sourceUrl: null,
    updatedAt: null,
  },
  {
    type: "diesel",
    name: "Diésel Premium",
    pricePerGallon: null,
    currency: "USD",
    validFrom: null,
    validUntil: null,
    source: null,
    sourceUrl: null,
    updatedAt: null,
  },
];

function hasValidPrices(response: FuelPricesResponse): boolean {
  return response.prices.some(
    (price) => price.pricePerGallon !== null && Number.isFinite(price.pricePerGallon) && price.pricePerGallon > 0,
  );
}

export async function getFuelPrices(): Promise<FuelPricesResponse> {
  // Futuro proveedor oficial: consultar ARCH y, si no está disponible,
  // consultar EP Petroecuador respetando el orden definido por prioridad.
  // Actualmente no se realizan llamadas HTTP ni scraping desde esta capa.
  const officialSources = [...OFFICIAL_SOURCES].sort(
    (a, b) => a.priority - b.priority,
  );

  // Mantener la arquitectura preparada para implementar los proveedores oficiales.
  void officialSources;

  // Cuando exista una implementación oficial, este bloque deberá devolverla
  // si contiene al menos un precio válido y sourceStatus === "official".

  const secondarySources = [...SECONDARY_SOURCES].sort(
    (a, b) => a.priority - b.priority,
  );

  // Mantener la arquitectura preparada para proveedores secundarios ordenados.
  void secondarySources;

  const secondary = await getSecondaryFuelPrices();

  if (secondary.sourceStatus === "secondary" && hasValidPrices(secondary)) {
    return secondary;
  }

  return {
    prices: emptyPrices,
    fetchedAt: new Date().toISOString(),
    sourceStatus: "unavailable",
  };
}
