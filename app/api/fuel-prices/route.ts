import { getFuelPrices } from "@/lib/fuel-price-provider";

export async function GET() {
  try {
    const result = await getFuelPrices();

    return Response.json({
      prices: result.prices,
      fetchedAt: result.fetchedAt,
      sourceStatus: result.sourceStatus,
    });
  } catch {
    return Response.json(
      {
        prices: [],
        fetchedAt: new Date().toISOString(),
        sourceStatus: "unavailable",
      },
      { status: 500 },
    );
  }
}
