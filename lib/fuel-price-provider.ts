import type { FuelPricesResponse, FuelPriceRecord } from "@/lib/fuel-price-types";
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

export async function getFuelPrices(): Promise<FuelPricesResponse> {
  // Fuente principal: consultar ARCH primero cuando se implemente el proveedor oficial.
  // Segunda fuente oficial: consultar EP Petroecuador si ARCH no está disponible.
  // Fallback secundario: recorrer las fuentes secundarias según prioridad.
  // Validar formato, moneda, vigencia y coherencia antes de aceptar datos.
  // Fallback final: utilizar el último precio válido persistido si las fuentes fallan.
  // Por ahora no se realizan llamadas HTTP ni scraping.
  const sources = [...OFFICIAL_SOURCES, ...SECONDARY_SOURCES].sort(
    (a, b) => a.priority - b.priority,
  );

  void sources;

  return {
    prices: emptyPrices,
    fetchedAt: new Date().toISOString(),
    sourceStatus: "unavailable",
  };
}
