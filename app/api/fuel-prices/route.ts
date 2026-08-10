import { NextResponse } from "next/server";

type FuelType = "ecopais" | "super" | "diesel";

type FuelPriceResult = {
  type: FuelType;
  name: string;
  pricePerGallon: number | null;
  currency: "USD";
  source: string;
  updatedAt: string | null;
};

const OFFICIAL_SOURCE = "https://controlhidrocarburos.gob.ec/";

/**
 * ARCH publishes official hydrocarbon information, but no reliable public
 * structured/API endpoint for current retail fuel prices was identified.
 * Keep this adapter isolated so a verified official source can be connected
 * later without hardcoding prices in the application.
 */
function getOfficialFuelPrices(): FuelPriceResult[] {
  return [
    {
      type: "ecopais",
      name: "Ecopaís",
      pricePerGallon: null,
      currency: "USD",
      source: OFFICIAL_SOURCE,
      updatedAt: null,
    },
    {
      type: "super",
      name: "Súper",
      pricePerGallon: null,
      currency: "USD",
      source: OFFICIAL_SOURCE,
      updatedAt: null,
    },
    {
      type: "diesel",
      name: "Diésel Premium",
      pricePerGallon: null,
      currency: "USD",
      source: OFFICIAL_SOURCE,
      updatedAt: null,
    },
  ];
}

export async function GET() {
  return NextResponse.json(getOfficialFuelPrices());
}
