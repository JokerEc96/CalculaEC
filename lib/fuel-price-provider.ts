import type { FuelPriceRecord, FuelPricesResponse } from "@/lib/fuel-price-types";
import { getCachedFuelPrices, isCacheValid, setCachedFuelPrices } from "@/lib/fuel-price-cache";
import { getSecondaryFuelPrices } from "@/lib/fuel-price-secondary";
import { OFFICIAL_SOURCES } from "@/lib/fuel-price-sources";

const ARCH_PRICES_URL = "https://controlhidrocarburos.gob.ec/precios-gasolinas-extra-y-ecopais/";
const FETCH_TIMEOUT_MS = 10_000;
const CACHE_MAX_AGE_HOURS = 36;

const emptyPrices: FuelPriceRecord[] = [
  { type: "ecopais", name: "Ecopaís", pricePerGallon: null, currency: "USD", validFrom: null, validUntil: null, source: null, sourceUrl: null, updatedAt: null },
  { type: "super", name: "Súper", pricePerGallon: null, currency: "USD", validFrom: null, validUntil: null, source: null, sourceUrl: null, updatedAt: null },
  { type: "diesel", name: "Diésel Premium", pricePerGallon: null, currency: "USD", validFrom: null, validUntil: null, source: null, sourceUrl: null, updatedAt: null },
];

function hasValidPrices(response: FuelPricesResponse): boolean {
  return response.prices.some((price) => price.pricePerGallon !== null && Number.isFinite(price.pricePerGallon) && price.pricePerGallon > 0);
}

function normalizeText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parsePrice(value: string): number | null {
  const normalized = value.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function findPrice(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const price = parsePrice(match[1]);
      if (price !== null && price >= 1 && price <= 15) return price;
    }
  }
  return null;
}

function parseValidity(text: string): { validFrom: string | null; validUntil: string | null } {
  const months: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  };
  const match = text.match(/(?:del|desde)\s+(\d{1,2})\s+de\s+([a-záéíóú]+)\s+(?:al|hasta)\s+(\d{1,2})\s+de\s+([a-záéíóú]+)(?:\s+de\s+(\d{4}))?/i);
  if (!match) return { validFrom: null, validUntil: null };
  const startMonth = months[match[2].toLowerCase()];
  const endMonth = months[match[4].toLowerCase()];
  if (startMonth === undefined || endMonth === undefined) return { validFrom: null, validUntil: null };
  const now = new Date();
  let year = match[5] ? Number(match[5]) : now.getUTCFullYear();
  if (endMonth < startMonth && !match[5]) year -= 1;
  const start = new Date(Date.UTC(year, startMonth, Number(match[1]), 0, 0, 0));
  const endYear = endMonth < startMonth ? year + 1 : year;
  const end = new Date(Date.UTC(endYear, endMonth, Number(match[3]), 23, 59, 59));
  return { validFrom: start.toISOString(), validUntil: end.toISOString() };
}

function buildOfficialResponse(html: string): FuelPricesResponse | null {
  const text = normalizeText(html);
  const validity = parseValidity(text);

  const ecopais = findPrice(text, [
    /ecopa[ií]s[^$\d]{0,120}(?:USD\s*)?\$?\s*(\d{1,2}(?:[.,]\d{1,3})?)/i,
    /extra\s+con\s+etanol[^$\d]{0,120}(?:USD\s*)?\$?\s*(\d{1,2}(?:[.,]\d{1,3})?)/i,
  ]);
  const superPrice = findPrice(text, [
    /gasolina\s+s[uú]per[^$\d]{0,120}(?:USD\s*)?\$?\s*(\d{1,2}(?:[.,]\d{1,3})?)/i,
    /s[uú]per[^$\d]{0,120}(?:USD\s*)?\$?\s*(\d{1,2}(?:[.,]\d{1,3})?)/i,
  ]);
  const diesel = findPrice(text, [
    /di[eé]sel\s+premium[^$\d]{0,120}(?:USD\s*)?\$?\s*(\d{1,2}(?:[.,]\d{1,3})?)/i,
    /di[eé]sel[^$\d]{0,120}(?:USD\s*)?\$?\s*(\d{1,2}(?:[.,]\d{1,3})?)/i,
  ]);

  const updatedAt = new Date().toISOString();
  const prices: FuelPriceRecord[] = [
    { type: "ecopais", name: "Ecopaís", pricePerGallon: ecopais, currency: "USD", ...validity, source: "ARCH", sourceUrl: ARCH_PRICES_URL, updatedAt },
    { type: "super", name: "Súper", pricePerGallon: superPrice, currency: "USD", ...validity, source: "ARCH", sourceUrl: ARCH_PRICES_URL, updatedAt },
    { type: "diesel", name: "Diésel Premium", pricePerGallon: diesel, currency: "USD", ...validity, source: "ARCH", sourceUrl: ARCH_PRICES_URL, updatedAt },
  ];

  const response: FuelPricesResponse = { prices, fetchedAt: updatedAt, sourceStatus: "official" };
  const validUntil = validity.validUntil ? Date.parse(validity.validUntil) : null;
  if (!hasValidPrices(response)) return null;
  if (validUntil !== null && Date.now() > validUntil) return null;
  return response;
}

async function fetchOfficialFuelPrices(): Promise<FuelPricesResponse | null> {
  const source = OFFICIAL_SOURCES.find((item) => item.name === "ARCH");
  if (!source) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(ARCH_PRICES_URL, {
      signal: controller.signal,
      headers: { "User-Agent": "CalculaEC/1.0 (+https://github.com/JokerEc96/CalculaEC)" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return buildOfficialResponse(await response.text());
  } catch (error) {
    console.warn("Official fuel price source failed", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getFuelPrices(): Promise<FuelPricesResponse> {
  const official = await fetchOfficialFuelPrices();
  if (official && hasValidPrices(official)) {
    await setCachedFuelPrices({ prices: official.prices, savedAt: official.fetchedAt, sourceStatus: "official" });
    return official;
  }

  const cached = await getCachedFuelPrices();
  if (cached && isCacheValid(cached, CACHE_MAX_AGE_HOURS) && hasValidPrices({ prices: cached.prices, fetchedAt: cached.savedAt, sourceStatus: cached.sourceStatus })) {
    return { prices: cached.prices, fetchedAt: cached.savedAt, sourceStatus: cached.sourceStatus };
  }

  const secondary = await getSecondaryFuelPrices();
  if (secondary.sourceStatus === "secondary" && hasValidPrices(secondary)) {
    await setCachedFuelPrices({ prices: secondary.prices, savedAt: secondary.fetchedAt, sourceStatus: "secondary" });
    return secondary;
  }

  return { prices: emptyPrices, fetchedAt: new Date().toISOString(), sourceStatus: "unavailable" };
}
