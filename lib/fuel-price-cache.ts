import { neon } from "@neondatabase/serverless";
import type { FuelPriceRecord } from "@/lib/fuel-price-types";

export type CachedFuelPrices = {
  prices: FuelPriceRecord[];
  savedAt: string;
  sourceStatus: "official" | "secondary";
};

type CachedFuelPriceRow = {
  fuel_type: FuelPriceRecord["type"];
  name: string;
  price_per_gallon: number;
  currency: "USD";
  valid_from: string | null;
  valid_until: string | null;
  source: string | null;
  source_url: string | null;
  updated_at: string | null;
  saved_at: string;
  source_status: "official" | "secondary";
};

function getDatabaseUrl(): string | null {
  return (
    process.env.STORAGE_URL ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL ??
    null
  );
}

function getSql() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    return null;
  }

  return neon(databaseUrl);
}

export async function getCachedFuelPrices(): Promise<CachedFuelPrices | null> {
  const sql = getSql();

  if (!sql) {
    return null;
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS fuel_prices (
        fuel_type TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price_per_gallon DOUBLE PRECISION NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        valid_from TIMESTAMPTZ,
        valid_until TIMESTAMPTZ,
        source TEXT,
        source_url TEXT,
        updated_at TIMESTAMPTZ,
        saved_at TIMESTAMPTZ NOT NULL,
        source_status TEXT NOT NULL CHECK (source_status IN ('official', 'secondary'))
      )
    `;

    const rows: CachedFuelPriceRow[] = await sql`
      SELECT
        fuel_type,
        name,
        price_per_gallon,
        currency,
        valid_from::text,
        valid_until::text,
        source,
        source_url,
        updated_at::text,
        saved_at::text,
        source_status
      FROM fuel_prices
      ORDER BY fuel_type
    `;

    if (rows.length === 0) {
      return null;
    }

    const first = rows[0];

    return {
      prices: rows.map((row) => ({
        type: row.fuel_type,
        name: row.name,
        pricePerGallon: Number(row.price_per_gallon),
        currency: row.currency,
        validFrom: row.valid_from,
        validUntil: row.valid_until,
        source: row.source,
        sourceUrl: row.source_url,
        updatedAt: row.updated_at,
      })),
      savedAt: first.saved_at,
      sourceStatus: first.source_status,
    };
  } catch (error) {
    console.warn("Fuel price cache read failed", error);
    return null;
  }
}

export async function setCachedFuelPrices(
  data: CachedFuelPrices,
): Promise<void> {
  const sql = getSql();

  if (!sql) {
    return;
  }

  const validPrices = data.prices.filter(
    (price) =>
      price.pricePerGallon !== null &&
      Number.isFinite(price.pricePerGallon) &&
      price.pricePerGallon > 0,
  );

  if (validPrices.length === 0) {
    return;
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS fuel_prices (
        fuel_type TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price_per_gallon DOUBLE PRECISION NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        valid_from TIMESTAMPTZ,
        valid_until TIMESTAMPTZ,
        source TEXT,
        source_url TEXT,
        updated_at TIMESTAMPTZ,
        saved_at TIMESTAMPTZ NOT NULL,
        source_status TEXT NOT NULL CHECK (source_status IN ('official', 'secondary'))
      )
    `;

    for (const price of validPrices) {
      await sql`
        INSERT INTO fuel_prices (
          fuel_type,
          name,
          price_per_gallon,
          currency,
          valid_from,
          valid_until,
          source,
          source_url,
          updated_at,
          saved_at,
          source_status
        ) VALUES (
          ${price.type},
          ${price.name},
          ${price.pricePerGallon},
          ${price.currency},
          ${price.validFrom},
          ${price.validUntil},
          ${price.source},
          ${price.sourceUrl},
          ${price.updatedAt},
          ${data.savedAt},
          ${data.sourceStatus}
        )
        ON CONFLICT (fuel_type) DO UPDATE SET
          name = EXCLUDED.name,
          price_per_gallon = EXCLUDED.price_per_gallon,
          currency = EXCLUDED.currency,
          valid_from = EXCLUDED.valid_from,
          valid_until = EXCLUDED.valid_until,
          source = EXCLUDED.source,
          source_url = EXCLUDED.source_url,
          updated_at = EXCLUDED.updated_at,
          saved_at = EXCLUDED.saved_at,
          source_status = EXCLUDED.source_status
      `;
    }
  } catch (error) {
    console.warn("Fuel price cache write failed", error);
  }
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
