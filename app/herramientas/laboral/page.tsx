"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Header from "@/components/Header";
import {
  SBU_2026,
  calculateFourteenth,
  calculateHourlyRates,
  calculateReserveFund,
  calculateThirteenth,
  calculateUtilities,
  calculateVacation,
  type LaborRegion,
} from "@/lib/laboral";

const money = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });
const number = new Intl.NumberFormat("es-EC", { maximumFractionDigits: 2 });

function Field({ label, value, onChange, min = 0, step = "0.01" }: { label: string; value: string; onChange: (value: string) => void; min?: number; step?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10"
      />
    </label>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--background)] p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

export default function LaboralPage() {
  const [monthlySalary, setMonthlySalary] = useState("482");
  const [annualRemuneration, setAnnualRemuneration] = useState("5784");
  const [region, setRegion] = useState<LaborRegion>("costa");
  const [months, setMonths] = useState("12");
  const [reserveMonths, setReserveMonths] = useState("12");
  const [hours50, setHours50] = useState("0");
  const [hours100, setHours100] = useState("0");
  const [profit, setProfit] = useState("0");
  const [workerDays, setWorkerDays] = useState("360");
  const [totalWorkerDays, setTotalWorkerDays] = useState("360");
  const [familyFactor, setFamilyFactor] = useState("0");
  const [totalFamilyFactor, setTotalFamilyFactor] = useState("0");

  const values = useMemo(() => {
    const salary = Number(monthlySalary) || 0;
    const annual = Number(annualRemuneration) || salary * 12;
    const monthCount = Number(months) || 0;
    const reserveCount = Number(reserveMonths) || 0;
    const hourly = calculateHourlyRates(salary);
    const utilities = calculateUtilities({
      companyProfit: Number(profit) || 0,
      workerDays: Number(workerDays) || 0,
      totalWorkerDays: Number(totalWorkerDays) || 0,
      familyFactor: Number(familyFactor) || 0,
      totalFamilyFactor: Number(totalFamilyFactor) || 0,
    });

    return {
      thirteenth: calculateThirteenth([annual]),
      fourteenth: calculateFourteenth(region, monthCount),
      vacation: calculateVacation(annual),
      reserve: calculateReserveFund(salary, reserveCount),
      overtime: (Number(hours50) || 0) * hourly.supplementary + (Number(hours100) || 0) * hourly.extraordinary,
      hourly,
      utilities,
    };
  }, [monthlySalary, annualRemuneration, region, months, reserveMonths, hours50, hours100, profit, workerDays, totalWorkerDays, familyFactor, totalFamilyFactor]);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8">
        <Header />

        <section className="py-10 sm:py-14">
          <Link href="/" className="text-sm font-medium text-[var(--wine)]">← Volver a CalculaEC</Link>
          <div className="mt-5 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--wine)]">Trabajo · Ecuador</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Calculadora laboral</h1>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">Calcula décimos, vacaciones, fondos de reserva, horas suplementarias y utilidades con reglas del Código del Trabajo.</p>
          </div>

          <div className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Sueldo mensual ($)" value={monthlySalary} onChange={setMonthlySalary} />
              <Field label="Remuneración anual ($)" value={annualRemuneration} onChange={setAnnualRemuneration} />
              <label className="block"><span className="text-sm font-medium">Región</span><select value={region} onChange={(e) => setRegion(e.target.value as LaborRegion)} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm"><option value="costa">Costa / Insular</option><option value="sierra">Sierra / Amazonía</option></select></label>
            </div>
            <p className="mt-4 text-xs text-[var(--muted)]">SBU 2026: {money.format(SBU_2026)}. El cálculo es referencial y aplica al régimen general del Código del Trabajo.</p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h2 className="text-xl font-semibold">🎁 Décimos</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Calculados proporcionalmente según el período ingresado.</p>
              <div className="mt-4"><Field label="Meses trabajados (para décimo cuarto)" value={months} onChange={setMonths} min={0} step="1" /></div>
              <div className="mt-4 grid grid-cols-2 gap-3"><Result label="Décimo tercero" value={money.format(values.thirteenth)} /><Result label="Décimo cuarto" value={money.format(values.fourteenth)} /></div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h2 className="text-xl font-semibold">🏖️ Vacaciones</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">La liquidación general corresponde a la veinticuatroava parte de lo percibido durante un año completo.</p>
              <div className="mt-4"><Result label="Valor anual de vacaciones" value={money.format(values.vacation)} /></div>
              <p className="mt-3 text-xs text-[var(--muted)]">El cálculo incluye la base anual que ingresaste, no una estimación automática de horas extra o comisiones.</p>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h2 className="text-xl font-semibold">🏦 Fondo de reserva</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Se aplica después del primer año de servicio.</p>
              <div className="mt-4"><Field label="Meses con derecho al fondo" value={reserveMonths} onChange={setReserveMonths} min={0} step="1" /></div>
              <div className="mt-4"><Result label="Fondo estimado" value={money.format(values.reserve)} /></div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h2 className="text-xl font-semibold">⏱️ Horas extras</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Base horaria: sueldo mensual ÷ 240.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Horas al 50%" value={hours50} onChange={setHours50} step="1" /><Field label="Horas al 100%" value={hours100} onChange={setHours100} step="1" /></div>
              <div className="mt-4 grid grid-cols-2 gap-3"><Result label="Hora al 50%" value={money.format(values.hourly.supplementary)} /><Result label="Hora al 100%" value={money.format(values.hourly.extraordinary)} /></div>
              <div className="mt-3"><Result label="Total horas extras" value={money.format(values.overtime)} /></div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5 lg:col-span-2">
              <h2 className="text-xl font-semibold">💰 Utilidades</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Estimación individual del 15% legal: 10% por días trabajados y 5% por cargas familiares.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Utilidad líquida de la empresa ($)" value={profit} onChange={setProfit} />
                <Field label="Tus días trabajados" value={workerDays} onChange={setWorkerDays} step="1" />
                <Field label="Días totales de trabajadores" value={totalWorkerDays} onChange={setTotalWorkerDays} step="1" />
                <Field label="Tu factor de cargas" value={familyFactor} onChange={setFamilyFactor} />
                <Field label="Factor total de cargas" value={totalFamilyFactor} onChange={setTotalFamilyFactor} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3"><Result label="10% por tiempo" value={money.format(values.utilities.tenPercent)} /><Result label="5% por cargas" value={money.format(values.utilities.fivePercent)} /><Result label="Total estimado" value={money.format(values.utilities.total)} /></div>
            </section>
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--wine)]/15 bg-[var(--wine)]/5 p-5 text-sm leading-6 text-[var(--muted)]">
            <strong className="text-[var(--foreground)]">Importante:</strong> esta herramienta es una estimación para trabajadores sujetos al Código del Trabajo. La liquidación definitiva puede variar según contrato, causa de terminación, componentes normales de remuneración, tiempo exacto trabajado y otras condiciones. Para una liquidación oficial, verifica los datos con el Ministerio del Trabajo.
          </div>
        </section>
      </div>
    </main>
  );
}
