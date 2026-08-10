export type FuelType = "ecopais" | "super" | "diesel";

export type FuelPriceRecord = {
  type: FuelType;
  name: string;
  pricePerGallon: number | null;
  currency: "USD";
  validFrom: string | null;
  validUntil: string | null;
  source: string | null;
  sourceUrl: string | null;
  updatedAt: string | null;
};

export type FuelPricesResponse = {
  prices: FuelPriceRecord[];
  fetchedAt: string;
  sourceStatus: "official" | "secondary" | "unavailable";
};
