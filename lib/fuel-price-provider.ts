import type {
  FuelPriceRecord,
  FuelPricesResponse,
} from "@/lib/fuel-price-types";

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
  // Future provider chain: official ARCH/Petroecuador, trusted secondary source,
  // then a persisted last-known valid price fallback.
  return {
    prices: emptyPrices,
    fetchedAt: new Date().toISOString(),
    sourceStatus: "unavailable",
  };
}
