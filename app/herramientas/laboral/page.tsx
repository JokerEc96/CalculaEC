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

function Field({ label, value, onChange, min = 0, max, step = "0.01", placeholder, help }: { label: string; value: string; onChange: (value: string) => void; min?: number; max?: number; step?: string; placeholder?: string; help?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      <input type="number" min={min} max={max} step={step} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10" />
      {help && <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{help}</span>}
    </label>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[var(--background)] p-3"><p className="text-xs text-[var(--muted)]">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>;
}

export default function LaboralPage() {
  const [monthlySalary, setMonthlySalary] = useState("482");
  const [region, setRegion] = useState<LaborRegion>("costa");
  const [months14, setMonths14] = useState("12");
  const [reserveMonths, setReserveMonths] = useState("12");
  const [hours50, setHours50] = useState("0");
  const [hours100, setHours100] = useState("0");
  const [profit, setProfit] = useState("0");
  const [utilitiesTimeMode, setUtilitiesTimeMode] = useState<"months" | "days">("months");
  const [utilityMonths, setUtilityMonths] = useState("12");
  const [utilityDays, setUtilityDays] = useState("360");
  const [totalWorkerDays, setTotalWorkerDays] = useState("360");
  const [familyFactor, setFamilyFactor] = useState("0");
  const [totalFamilyFactor, setTotalFamilyFactor] = useState("0");
  const [thirteenthMode, setThirteenthMode] = useState<"base" | "monthly">("monthly");
  const [monthlyRemunerations, setMonthlyRemunerations] = useState<string[]>(Array.from({ length: 12 }, () => "482"));

  const updateMonth = (index: number, value: string) => {
    setMonthlyRemunerations((current) => current.map((item, i) => (i === index ? value : item)));
  };

  const fillBaseSalary = () => setMonthlyRemunerations(Array.from({ length: 12 }, () => monthlySalary));
  const clearMonthlyRemunerations = () => setMonthlyRemunerations(Array.from({ length: 12 }, () => "0"));

  const values = useMemo(() => {
    const salary = Number(monthlySalary) || 0;
    const hourly = calculateHourlyRates(salary);
    const annualRemuneration = thirteenthMode === "base"
      ? salary * 12
      : monthlyRemunerations.reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
    const monthCount14 = Math.min(12, Math.max(0, Number(months14) || 0));
    const reserveCount = Math.min(12, Math.max(0, Number(reserveMonths) || 0));
    const selectedMonths = Math.min(12, Math.max(0, Number(utilityMonths) || 0));
    const exactDays = Math.min(360, Math.max(0, Number(utilityDays) || 0));
    const workerDays = utilitiesTimeMode === "months" ? selectedMonths * 30 : exactDays;
    const utilities = calculateUtilities({ companyProfit: Number(profit) || 0, workerDays, totalWorkerDays: Number(totalWorkerDays) || 0, familyFactor: Number(familyFactor) || 0, totalFamilyFactor: Number(totalFamilyFactor) || 0 });

    return {
      thirteenth: calculateThirteenth([annualRemuneration]),
      fourteenth: calculateFourteenth(region, monthCount14),
      vacation: calculateVacation(annualRemuneration),
      reserve: calculateReserveFund(salary, reserveCount),
      overtime: (Number(hours50) || 0) * hourly.supplementary + (Number(hours100) || 0) * hourly.extraordinary,
      hourly,
      utilities,
      workerDays,
      annualRemuneration,
    };
  }, [monthlySalary, region, months14, reserveMonths, hours50, hours100, profit, utilitiesTimeMode, utilityMonths, utilityDays, totalWorkerDays, familyFactor, totalFamilyFactor, thirteenthMode, monthlyRemunerations]);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8">
        <Header />
        <section className="py-10 sm:py-14">
          <Link href="/" className="text-sm font-medium text-[var(--wine)]">← Volver a CalculaEC</Link>
          <div className="mt-5 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--wine)]">Trabajo · Ecuador</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Calculadora laboral</h1>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">Calcula décimos, vacaciones, fondos de reserva, horas suplementarias y utilidades con una entrada clara y útil para trabajadores en Ecuador.</p>
          </div>

          <div className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
            <h2 className="text-xl font-semibold">💵 Datos de tu sueldo</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Aquí coloca solamente tu <strong>sueldo base mensual</strong>. Este dato sirve para calcular el valor de tus horas extra y el fondo de reserva. Tus ingresos variables se registran dentro del décimo tercero.</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Sueldo base mensual ($)" value={monthlySalary} onChange={setMonthlySalary} help="Ejemplo: $482. Si ganas más algunos meses por horas extra, no reemplaces aquí el sueldo base." />
              <label className="block"><span className="text-sm font-medium">Región</span><select value={region} onChange={(e) => setRegion(e.target.value as LaborRegion)} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm"><option value="costa">Costa / Insular</option><option value="sierra">Sierra / Amazonía</option></select><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">Determina el período del décimo cuarto.</span></label>
            </div>
            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm leading-6 text-[var(--muted)]"><strong className="text-[var(--foreground)]">¿Qué pasa si escribo $700?</strong> Ese será tu sueldo base para horas extra y fondo de reserva. Si $700 fue lo que realmente recibiste un mes por horas extra, regístralo en ese mes dentro del décimo tercero.</div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-[var(--border)] bg-white p-5 lg:col-span-2">
              <h2 className="text-xl font-semibold">🎁 Décimo tercero</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">El décimo tercero se calcula sobre las remuneraciones percibidas durante el período correspondiente. Por eso, si un mes recibiste $482 y otro $700 por horas extra, puedes registrar cada total mensual y el cálculo los toma en cuenta.</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setThirteenthMode("monthly")} className={`min-h-14 rounded-xl border px-4 text-left transition ${thirteenthMode === "monthly" ? "border-[var(--wine)] bg-[var(--wine)]/5" : "border-[var(--border)] bg-white"}`}><span className="block text-sm font-semibold">📊 Registrar lo recibido cada mes</span><span className="mt-1 block text-xs text-[var(--muted)]">Recomendado si hiciste horas extra</span></button>
                <button type="button" onClick={() => setThirteenthMode("base")} className={`min-h-14 rounded-xl border px-4 text-left transition ${thirteenthMode === "base" ? "border-[var(--wine)] bg-[var(--wine)]/5" : "border-[var(--border)] bg-white"}`}><span className="block text-sm font-semibold">🧾 Solo sueldo base</span><span className="mt-1 block text-xs text-[var(--muted)]">Cuando no hubo ingresos variables</span></button>
              </div>

              {thirteenthMode === "monthly" ? (
                <div className="mt-5 rounded-xl border border-[var(--border)] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">Total recibido por mes</p><p className="mt-1 text-xs text-[var(--muted)]">Ingresa el total que recibiste ese mes: sueldo + horas extra + otros componentes que formen parte de la remuneración.</p></div><div className="flex gap-2"><button type="button" onClick={fillBaseSalary} className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-medium">Llenar con sueldo base</button><button type="button" onClick={clearMonthlyRemunerations} className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-medium">Limpiar</button></div></div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {monthlyRemunerations.map((value, index) => <Field key={index} label={`Mes ${index + 1}`} value={value} onChange={(next) => updateMonth(index, next)} min={0} step="0.01" placeholder="482" />)}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2"><Result label="Remuneración acumulada del período" value={money.format(values.annualRemuneration)} /><Result label="Décimo tercero estimado" value={money.format(values.thirteenth)} /></div>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2"><Result label="Remuneración anual con sueldo base" value={money.format(values.annualRemuneration)} /><Result label="Décimo tercero estimado" value={money.format(values.thirteenth)} /></div>
              )}
              <p className="mt-4 text-xs leading-5 text-[var(--muted)]">Para una liquidación exacta, usa los valores reales de tus roles de pago. Las horas extra pueden hacer que el total remunerativo de un mes sea superior al sueldo base.</p>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h2 className="text-xl font-semibold">🎓 Décimo cuarto</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">No se calcula con tu sueldo ni con tus horas extra. Se basa en el SBU vigente y se paga proporcionalmente al tiempo del período correspondiente.</p>
              <div className="mt-4"><p className="text-sm font-medium">Meses trabajados</p><div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">{Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <button key={month} type="button" onClick={() => setMonths14(String(month))} className={`min-h-10 rounded-lg border text-sm transition ${Number(months14) === month ? "border-[var(--wine)] bg-[var(--wine)]/5 font-semibold text-[var(--wine)]" : "border-[var(--border)] bg-white"}`}>{month}</button>)}</div></div>
              <div className="mt-4"><Result label="Décimo cuarto estimado" value={money.format(values.fourteenth)} /></div>
              <p className="mt-3 text-xs text-[var(--muted)]">SBU 2026: {money.format(SBU_2026)}.</p>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h2 className="text-xl font-semibold">🏖️ Vacaciones</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Estimación sobre la remuneración anual ingresada para el décimo tercero.</p>
              <div className="mt-4"><Result label="Valor estimado de vacaciones" value={money.format(values.vacation)} /></div>
              <p className="mt-3 text-xs text-[var(--muted)]">Para una liquidación definitiva deben considerarse los componentes remunerativos que correspondan.</p>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h2 className="text-xl font-semibold">🏦 Fondo de reserva</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Se calcula con la remuneración mensual que corresponda y el tiempo con derecho al beneficio.</p>
              <div className="mt-4"><Field label="Meses con derecho al fondo" value={reserveMonths} onChange={setReserveMonths} min={0} max={12} step="1" /></div>
              <div className="mt-4"><Result label="Fondo estimado" value={money.format(values.reserve)} /></div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h2 className="text-xl font-semibold">⏱️ Horas extras</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Base horaria: sueldo base mensual ÷ 240.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Horas al 50%" value={hours50} onChange={setHours50} step="1" /><Field label="Horas al 100%" value={hours100} onChange={setHours100} step="1" /></div>
              <div className="mt-4 grid grid-cols-2 gap-3"><Result label="Hora al 50%" value={money.format(values.hourly.supplementary)} /><Result label="Hora al 100%" value={money.format(values.hourly.extraordinary)} /></div>
              <div className="mt-3"><Result label="Total horas extras" value={money.format(values.overtime)} /></div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5 lg:col-span-2">
              <h2 className="text-xl font-semibold">💰 Utilidades</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Estimación individual del 15% legal: 10% por tiempo trabajado y 5% por cargas familiares.</p>
              <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                <p className="text-sm font-semibold">Tiempo trabajado</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setUtilitiesTimeMode("months")} className={`min-h-14 rounded-xl border px-4 text-left transition ${utilitiesTimeMode === "months" ? "border-[var(--wine)] bg-[var(--wine)]/5" : "border-[var(--border)] bg-white"}`}><span className="block text-sm font-semibold">📅 Por meses</span><span className="mt-1 block text-xs text-[var(--muted)]">Recomendado</span></button><button type="button" onClick={() => setUtilitiesTimeMode("days")} className={`min-h-14 rounded-xl border px-4 text-left transition ${utilitiesTimeMode === "days" ? "border-[var(--wine)] bg-[var(--wine)]/5" : "border-[var(--border)] bg-white"}`}><span className="block text-sm font-semibold">📆 Por días</span><span className="mt-1 block text-xs text-[var(--muted)]">Para días exactos</span></button></div>
                {utilitiesTimeMode === "months" ? <div className="mt-5"><p className="text-sm font-medium">Meses trabajados</p><div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <button key={month} type="button" onClick={() => setUtilityMonths(String(month))} className={`min-h-10 rounded-lg border text-sm transition ${Number(utilityMonths) === month ? "border-[var(--wine)] bg-[var(--wine)]/5 font-semibold text-[var(--wine)]" : "border-[var(--border)] bg-white"}`}>{month} {month === 1 ? "mes" : "meses"}</button>)}</div><label className="mt-4 block"><span className="text-sm font-medium">O ingresa los meses trabajados</span><input type="number" min="0" max="12" step="0.1" value={utilityMonths} onChange={(event) => setUtilityMonths(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10" /></label><div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">Equivale aproximadamente a <strong>{number.format(values.workerDays)} días</strong> para la estimación (30 días por mes).</div></div> : <div className="mt-5"><Field label="Días trabajados" value={utilityDays} onChange={setUtilityDays} min={0} max={360} step="1" placeholder="Ejemplo: 180" /></div>}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Utilidad líquida de la empresa ($)" value={profit} onChange={setProfit} help="La utilidad líquida anual de la empresa, no tu sueldo." /><Field label="Días totales de la plantilla" value={totalWorkerDays} onChange={setTotalWorkerDays} min={0} step="1" help="Dato que normalmente proporciona la empresa." /><Field label="Tu factor de cargas" value={familyFactor} onChange={setFamilyFactor} help="Factor correspondiente a tus cargas familiares." /><Field label="Factor total de cargas" value={totalFamilyFactor} onChange={setTotalFamilyFactor} help="Suma de factores de todos los trabajadores." /></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3"><Result label="10% por tiempo" value={money.format(values.utilities.tenPercent)} /><Result label="5% por cargas" value={money.format(values.utilities.fivePercent)} /><Result label="Total estimado" value={money.format(values.utilities.total)} /></div>
            </section>
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--wine)]/15 bg-[var(--wine)]/5 p-5 text-sm leading-6 text-[var(--muted)]"><strong className="text-[var(--foreground)]">Importante:</strong> usa los valores reales de tus roles de pago cuando los tengas. Esta calculadora es referencial y la liquidación definitiva puede variar según el período, contrato y componentes remunerativos aplicables.</div>
        </section>
      </div>
    </main>
  );
}
