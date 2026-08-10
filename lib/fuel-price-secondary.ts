import type { FuelPriceRecord, FuelPricesResponse } from "@/lib/fuel-price-types";

const unavailablePrices: FuelPriceRecord[] = [
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

export async function getSecondaryFuelPrices(): Promise<FuelPricesResponse> {
  // Esta capa podrá utilizar posteriormente una fuente secundaria confiable,
  // como Primicias o El Universo, cuando exista una integración estable y verificable.
  // Actualmente no se realiza scraping ni ninguna llamada HTTP.
  return {
    prices: unavailablePrices,
    fetchedAt: new Date().toISOString(),
    sourceStatus: "unavailable",
  };
}
