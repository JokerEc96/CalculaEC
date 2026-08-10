export type FuelType = "ecopais" | "super" | "diesel";

export type FuelPrice = {
  type: FuelType;
  name: string;
  pricePerGallon: number | null;
};

export const fuelPrices: Record<FuelType, FuelPrice> = {
  ecopais: {
    type: "ecopais",
    name: "Ecopaís",
    pricePerGallon: null,
  },
  super: {
    type: "super",
    name: "Súper",
    pricePerGallon: null,
  },
  diesel: {
    type: "diesel",
    name: "Diésel",
    pricePerGallon: null,
  },
};

export function getFuelPrice(type: FuelType): number | null {
  return fuelPrices[type].pricePerGallon;
}
