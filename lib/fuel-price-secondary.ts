import type { FuelPriceRecord, FuelPricesResponse } from "@/lib/fuel-price-types";

const SOURCES = [
  {
    name: "Primicias",
    url: "https://www.primicias.ec/economia/precios-gasolina-super-extra-ecopais-diesel-ecuador-julio-127717/",
  },
  {
    name: "Ecuavisa",
    url: "https://www.ecuavisa.com/ecuador/nuevo-precio-gasolinas-extra-ecopais-diesel-premium-20260712-0004.html",
  },
] as const;

const unavailablePrices: FuelPriceRecord[] = [
  { type: "ecopais", name: "Ecopaís", pricePerGallon: null, currency: "USD", validFrom: null, validUntil: null, source: null, sourceUrl: null, updatedAt: null },
  { type: "super", name: "Súper", pricePerGallon: null, currency: "USD", validFrom: null, validUntil: null, source: null, sourceUrl: null, updatedAt: null },
  { type: "diesel", name: "Diésel Premium", pricePerGallon: null, currency: "USD", validFrom: null, validUntil: null, source: null, sourceUrl: null, updatedAt: null },
];

function normalizeText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parsePrice(value: string): number | null {
  const number = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(number) && number > 0 && number < 15 ? number : null;
}

function findPrice(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const price = parsePrice(match[1]);
      if (price !== null) return price;
    }
  }
  return null;
}

function parseValidity(text: string): { validFrom: string | null; validUntil: string | null } {
  const months: Record<string, number> = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 };
  const match = text.match(/del\s+(\d{1,2})\s+de\s+([a-záéíóú]+)\s+al\s+(\d{1,2})\s+de\s+([a-záéíóú]+)(?:\s+de\s+(\d{4}))?/i);
  if (!match) return { validFrom: null, validUntil: null };
  const startMonth = months[match[2].toLowerCase()];
  const endMonth = months[match[4].toLowerCase()];
  if (startMonth === undefined || endMonth === undefined) return { validFrom: null, validUntil: null };
  const year = match[5] ? Number(match[5]) : new Date().getUTCFullYear();
  const endYear = endMonth < startMonth ? year + 1 : year;
  return {
    validFrom: new Date(Date.UTC(year, startMonth, Number(match[1]))).toISOString(),
    validUntil: new Date(Date.UTC(endYear, endMonth, Number(match[3]), 23, 59, 59)).toISOString(),
  };
}

function parseArticle(html: string, source: string, sourceUrl: string): FuelPricesResponse | null {
  const text = normalizeText(html);
  const validity = parseValidity(text);
  const updatedAt = new Date().toISOString();
  const prices: FuelPriceRecord[] = [
    { type: "ecopais", name: "Ecopaís", pricePerGallon: findPrice(text, [/ecopa[ií]s[^$\d]{0,120}(?:USD\s*|\$\s*)(\d{1,2}(?:[.,]\d{1,3})?)/i, /extra\s+y\s+ecopa[ií]s[^$\d]{0,120}(?:USD\s*|\$\s*)(\d{1,2}(?:[.,]\d{1,3})?)/i]), currency: "USD", ...validity, source, sourceUrl, updatedAt },
    { type: "super", name: "Súper", pricePerGallon: findPrice(text, [/gasolina\s+s[uú]per[^$\d]{0,120}(?:USD\s*|\$\s*)(\d{1,2}(?:[.,]\d{1,3})?)/i, /s[uú]per[^$\d]{0,120}(?:USD\s*|\$\s*)(\d{1,2}(?:[.,]\d{1,3})?)/i]), currency: "USD", ...validity, source, sourceUrl, updatedAt },
    { type: "diesel", name: "Diésel Premium", pricePerGallon: findPrice(text, [/di[eé]sel\s+premium[^$\d]{0,120}(?:USD\s*|\$\s*)(\d{1,2}(?:[.,]\d{1,3})?)/i, /di[eé]sel[^$\d]{0,120}(?:USD\s*|\$\s*)(\d{1,2}(?:[.,]\d{1,3})?)/i]), currency: "USD", ...validity, source, sourceUrl, updatedAt },
  ];
  const validUntil = validity.validUntil ? Date.parse(validity.validUntil) : null;
  if (!prices.some((price) => price.pricePerGallon !== null && price.pricePerGallon > 0)) return null;
  if (validUntil !== null && Date.now() > validUntil) return null;
  return { prices, fetchedAt: updatedAt, sourceStatus: "secondary" };
}

export async function getSecondaryFuelPrices(): Promise<FuelPricesResponse> {
  for (const source of SOURCES) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(source.url, {
        signal: controller.signal,
        headers: { "User-Agent": "CalculaEC/1.0" },
        cache: "no-store",
      });
      if (!response.ok) continue;
      const result = parseArticle(await response.text(), source.name, source.url);
      if (result) return result;
    } catch (error) {
      console.warn(`Secondary fuel source failed: ${source.name}`, error);
    } finally {
      clearTimeout(timeout);
    }
  }

  return { prices: unavailablePrices, fetchedAt: new Date().toISOString(), sourceStatus: "unavailable" };
}
