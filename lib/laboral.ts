export const SBU_2026 = 482;

export type LaborRegion = "costa" | "sierra";

export function calculateThirteenth(remunerations: number[]) {
  const total = remunerations.reduce((sum, value) => sum + Math.max(0, value), 0);
  return total / 12;
}

export function calculateFourteenth(region: LaborRegion, monthsWorked: number) {
  const months = Math.min(12, Math.max(0, monthsWorked));
  return (SBU_2026 / 12) * months;
}

export function calculateVacation(annualRemuneration: number) {
  return Math.max(0, annualRemuneration) / 24;
}

export function calculateReserveFund(monthlyRemuneration: number, eligibleMonths: number) {
  const months = Math.min(12, Math.max(0, eligibleMonths));
  return Math.max(0, monthlyRemuneration) * (months / 12);
}

export function calculateHourlyRates(monthlySalary: number) {
  const hourly = Math.max(0, monthlySalary) / 240;
  return {
    ordinary: hourly,
    night: hourly * 1.25,
    supplementary: hourly * 1.5,
    extraordinary: hourly * 2,
  };
}

export function calculateUtilities(params: {
  companyProfit: number;
  workerDays: number;
  totalWorkerDays: number;
  familyFactor: number;
  totalFamilyFactor: number;
}) {
  const profit = Math.max(0, params.companyProfit);
  const days = Math.max(0, params.workerDays);
  const totalDays = Math.max(0, params.totalWorkerDays);
  const factor = Math.max(0, params.familyFactor);
  const totalFactor = Math.max(0, params.totalFamilyFactor);

  const pool = profit * 0.15;
  const tenPercent = totalDays > 0 ? (pool * 0.1 * days) / totalDays : 0;
  const fivePercent = totalFactor > 0 ? (pool * 0.05 * factor) / totalFactor : 0;

  return {
    pool,
    tenPercent,
    fivePercent,
    total: tenPercent + fivePercent,
  };
}
