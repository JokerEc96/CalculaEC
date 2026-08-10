import type { FuelPriceRecord } from "@/lib/fuel-price-types";

export type CachedFuelPrices = {
  prices: FuelPriceRecord[];
  savedAt: string;
  sourceStatus: "official" | "secondary";
};

/**
 * Placeholder for a future persistent cache implementation.
 * No prices are stored in memory, files, cookies, localStorage, or environment variables.
 */
export function getCachedFuelPrices(): CachedFuelPrices | null {
  return null;
}

/**
 * Placeholder for a future persistent cache implementation.
 * A persistent storage provider can be connected here without changing the public API.
 */
export function setCachedFuelPrices(_data: CachedFuelPrices): void {
  // Intentionally left empty until persistent storage is configured.
}

export function isCacheValid(
  data: CachedFuelPrices,
  maxAgeHours: number,
): boolean {
  if (!Number.isFinite(maxAgeHours) || maxAgeHours < 0) {
    return false;
  }

  const savedAt = Date.parse(data.savedAt);

  if (!Number.isFinite(savedAt)) {
    return false;
  }

  const ageMs = Date.now() - savedAt;
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

  return ageMs >= 0 && ageMs <= maxAgeMs;
}
