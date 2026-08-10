import type { FuelPriceRecord } from "@/lib/fuel-price-types";

export type FuelPriceSource = {
  name: string;
  type: "official" | "secondary";
  priority: number;
  url: string | null;
};

export const OFFICIAL_SOURCES: FuelPriceSource[] = [
  {
    name: "ARCH",
    type: "official",
    priority: 1,
    url: "https://controlhidrocarburos.gob.ec/",
  },
  {
    name: "EP Petroecuador",
    type: "official",
    priority: 2,
    url: "https://www.eppetroecuador.ec/",
  },
];

export const SECONDARY_SOURCES: FuelPriceSource[] = [
  {
    name: "Primicias",
    type: "secondary",
    priority: 3,
    url: null,
  },
  {
    name: "El Universo",
    type: "secondary",
    priority: 4,
    url: null,
  },
];

export type FuelPriceSourceRecord = FuelPriceRecord;
