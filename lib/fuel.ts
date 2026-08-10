function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} debe ser un número mayor que cero.`);
  }
}

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateFuelNeeded(
  distanceKm: number,
  kmPerGallon: number,
): { gallons: number } {
  assertPositive(distanceKm, "distanceKm");
  assertPositive(kmPerGallon, "kmPerGallon");

  return {
    gallons: roundToTwo(distanceKm / kmPerGallon),
  };
}

export function calculateFuelCost(
  gallons: number,
  pricePerGallon: number,
): { cost: number } {
  assertPositive(gallons, "gallons");
  assertPositive(pricePerGallon, "pricePerGallon");

  return {
    cost: roundToTwo(gallons * pricePerGallon),
  };
}

export function calculateTripFuel(
  distanceKm: number,
  kmPerGallon: number,
  pricePerGallon: number,
): { gallons: number; cost: number } {
  const { gallons } = calculateFuelNeeded(distanceKm, kmPerGallon);
  const { cost } = calculateFuelCost(gallons, pricePerGallon);

  return { gallons, cost };
}
