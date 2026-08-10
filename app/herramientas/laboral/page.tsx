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

const thirteenthMonths = ["Diciembre", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre"];

export default function LaboralPage() {
  const [monthlySalary, setMonthlySalary] = useState("482");
  const [region, setRegion] = useState<LaborRegion>("costa");
  const [months14, setMonths14] = useState("12");
  const [reserveMonths, setReserveMonths] = useState("12");
  const [reserveMode, setReserveMode] = useState<"base" | "monthly">("monthly");
  const [hours50, setHours50] = useState("0");
  const [hours100, setHours100] = useState("0");
  const [profit, setProfit] = useState("0");
  const [utilitiesTimeMode, setUtilitiesTimeMode] = useState<"months" | "days">("months");
  const [utilityMonths, setUtilityMonths] = useState("12");
  const [utilityDays, setUtilityDays] = useState("360");
  const [totalWorkerDays, setTotalWorkerDays] = useState("360");
  const [familyCount, setFamilyCount] = useState("0");
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
    const monthlyValues = monthlyRemunerations.map((value) => Math.max(0, Number(value) || 0));
    const annualRemuneration = thirteenthMode === "base" ? salary * 12 : monthlyValues.reduce((sum, value) => sum + value, 0);
    const monthCount14 = Math.min(12, Math.max(0, Number(months14) || 0));
    const reserveCount = Math.min(12, Math.max(0, Number(reserveMonths) || 0));
    const reserveAverage = reserveCount > 0 ? monthlyValues.slice(0, reserveCount).reduce((sum, value) => sum + value, 0) / reserveCount : 0;
    const reserveBase = reserveMode === "monthly" ? reserveAverage : salary;
    const selectedMonths = Math.min(12, Math.max(0, Number(utilityMonths) || 0));
    const exactDays = Math.min(360, Math.max(0, Number(utilityDays) || 0));
    const workerDays = utilitiesTimeMode === "months" ? selectedMonths * 30 : exactDays;
    const familyFactor = workerDays * Math.max(0, Number(familyCount) || 0);
    const totalDays = Math.max(0, Number(totalWorkerDays) || 0);
    const factorB = Math.max(0, Number(totalFamilyFactor) || 0);
    const utilities = calculateUtilities({ companyProfit: Number(profit) || 0, workerDays, totalWorkerDays: totalDays, familyFactor, totalFamilyFactor: factorB });

    return {
      thirteenth: calculateThirteenth([annualRemuneration]),
      fourteenth: calculateFourteenth(region, monthCount14),
      vacation: calculateVacation(annualRemuneration),
      reserve: calculateReserveFund(reserveBase, reserveCount),
      overtime: (Number(hours50) || 0) * hourly.supplementary + (Number(hours100) || 0) * hourly.extraordinary,
      hourly,
      utilities,
      workerDays,
      familyFactor,
      reserveBase,
      annualRemuneration,
      totalDays,
      factorB,
    };
  }, [monthlySalary, region, months14, reserveMonths, reserveMode, hours50, hours100, profit, utilitiesTimeMode, utilityMonths, utilityDays, totalWorkerDays, familyCount, totalFamilyFactor, thirteenthMode, monthlyRemunerations]);

  const utilityTenPercent = values.totalDays > 0 && Number(profit) > 0 ? money.format(values.utilities.tenPercent) : "No disponible";
  const utilityFivePercent = values.factorB > 0 && Number(profit) > 0 && Number(familyCount) > 0 ? money.format(values.utilities.fivePercent) : "No disponible";
  const utilityTotal = utilityTenPercent !== "No disponible" && utilityFivePercent !== "No disponible" ? money.format(values.utilities.total) : "Completa los datos";

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8">
        <Header />
        <section className="py-10 sm:py-14">
          <Link href="/" className="text-sm font-medium text-[var(--wine)]">← Volver a CalculaEC</Link>
          <div className="mt-5 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--wine)]">Trabajo · Ecuador</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Calculadora laboral</h1>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">Calcula décimos, vacaciones, fondos de reserva, horas extra y utilidades con datos que realmente puedas conocer de tus roles de pago.</p>
          </div>

          <div className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
            <h2 className="text-xl font-semibold">💵 Tu sueldo base</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Coloca aquí tu sueldo mensual fijo. No pongas $700 solo porque un mes recibiste $700 con horas extra: esos ingresos variables se registran aparte.</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Sueldo base mensual ($)" value={monthlySalary} onChange={setMonthlySalary} help="Ejemplo: $482. Se usa para horas extra y, si eliges esa opción, para fondo de reserva." />
              <label className="block"><span className="text-sm font-medium">Región</span><select value={region} onChange={(e) => setRegion(e.target.value as LaborRegion)} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm"><option value="costa">Costa / Insular</option><option value="sierra">Sierra / Amazonía</option></select><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">Solo afecta el período del décimo cuarto.</span></label>
            </div>
            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm leading-6 text-[var(--muted)]"><strong className="text-[var(--foreground)]">Ejemplo:</strong> si tu sueldo base es $482 pero un mes recibiste $700 por horas extra, deja $482 arriba y registra $700 en ese mes dentro del décimo tercero.</div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-[var(--border)] bg-white p-5 lg:col-span-2">
              <h2 className="text-xl font-semibold">🎁 Décimo tercero</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Se calcula con las remuneraciones percibidas durante el período. Registrar lo recibido mes a mes es la opción más precisa.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setThirteenthMode("monthly")} className={`min-h-14 rounded-xl border px-4 text-left transition ${thirteenthMode === "monthly" ? "border-[var(--wine)] bg-[var(--wine)]/5" : "border-[var(--border)] bg-white"}`}><span className="block text-sm font-semibold">📊 Registrar cada mes</span><span className="mt-1 block text-xs text-[var(--muted)]">Recomendado si hubo horas extra</span></button>
                <button type="button" onClick={() => setThirteenthMode("base")} className={`min-h-14 rounded-xl border px-4 text-left transition ${thirteenthMode === "base" ? "border-[var(--wine)] bg-[var(--wine)]/5" : "border-[var(--border)] bg-white"}`}><span className="block text-sm font-semibold">🧾 Solo sueldo base</span><span className="mt-1 block text-xs text-[var(--muted)]">Estimación rápida sin ingresos variables</span></button>
              </div>
              {thirteenthMode === "monthly" ? (
                <div className="mt-5 rounded-xl border border-[var(--border)] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">Remuneración recibida</p><p className="mt-1 text-xs text-[var(--muted)]">Período: diciembre a noviembre. Escribe el total remunerativo de cada mes.</p></div><div className="flex gap-2"><button type="button" onClick={fillBaseSalary} className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-medium">Llenar con sueldo base</button><button type="button" onClick={clearMonthlyRemunerations} className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-medium">Limpiar</button></div></div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{monthlyRemunerations.map((value, index) => <Field key={index} label={thirteenthMonths[index]} value={value} onChange={(next) => updateMonth(index, next)} min={0} step="0.01" placeholder="482" />)}</div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2"><Result label="Total remuneraciones del período" value={money.format(values.annualRemuneration)} /><Result label="Décimo tercero estimado" value={money.format(values.thirteenth)} /></div>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2"><Result label="Remuneración anual estimada" value={money.format(values.annualRemuneration)} /><Result label="Décimo tercero estimado" value={money.format(values.thirteenth)} /></div>
              )}
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h2 className="text-xl font-semibold">🎓 Décimo cuarto</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">No depende de tu sueldo ni de tus horas extra. Se calcula con el SBU y el tiempo trabajado del período correspondiente.</p>
              <div className="mt-4"><p className="text-sm font-medium">¿Cuántos meses trabajaste?</p><div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">{Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <button key={month} type="button" onClick={() => setMonths14(String(month))} className={`min-h-10 rounded-lg border text-sm transition ${Number(months14) === month ? "border-[var(--wine)] bg-[var(--wine)]/5 font-semibold text-[var(--wine)]" : "border-[var(--border)] bg-white"}`}>{month} {month === 1 ? "mes" : "meses"}</button>)}</div></div>
              <div className="mt-4"><Result label="Décimo cuarto estimado" value={money.format(values.fourteenth)} /></div>
              <p className="mt-3 text-xs text-[var(--muted)]">SBU 2026: {money.format(SBU_2026)}.</p>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h2 className="text-xl font-semibold">🏖️ Vacaciones</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Aquí sí importa lo que realmente ganaste durante el año. La referencia legal es la veinticuatroava parte de lo percibido en un año completo, incluyendo los componentes remunerativos que correspondan.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2"><Result label="Total remunerado en el período" value={money.format(values.annualRemuneration)} /><Result label="Vacaciones estimadas · 1/24" value={money.format(values.vacation)} /></div>
              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-xs leading-5 text-[var(--muted)]">No es un bono adicional que recibas automáticamente cada año. Es una referencia del valor de la remuneración correspondiente al período vacacional o a su parte proporcional cuando corresponda.</div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h2 className="text-xl font-semibold">🏦 Fondo de reserva</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Después del primer año de servicio, corresponde una remuneración mensual por cada año completo. Si tus ingresos cambian por horas extra, puedes usar los valores mensuales para una referencia más realista.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setReserveMode("monthly")} className={`min-h-12 rounded-xl border px-3 text-left ${reserveMode === "monthly" ? "border-[var(--wine)] bg-[var(--wine)]/5" : "border-[var(--border)]"}`}><span className="block text-sm font-semibold">📊 Usar ingresos mensuales</span><span className="block text-xs text-[var(--muted)]">Más preciso si hubo horas extra</span></button><button type="button" onClick={() => setReserveMode("base")} className={`min-h-12 rounded-xl border px-3 text-left ${reserveMode === "base" ? "border-[var(--wine)] bg-[var(--wine)]/5" : "border-[var(--border)]"}`}><span className="block text-sm font-semibold">🧾 Usar sueldo base</span><span className="block text-xs text-[var(--muted)]">Estimación rápida</span></button></div>
              <div className="mt-4"><Field label="Meses con derecho al fondo" value={reserveMonths} onChange={setReserveMonths} min={0} max={12} step="1" help="Para este cálculo rápido, 12 meses representan un año completo con derecho." /></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2"><Result label="Base mensual utilizada" value={money.format(values.reserveBase)} /><Result label="Fondo estimado" value={money.format(values.reserve)} /></div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h2 className="text-xl font-semibold">⏱️ Horas extra</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Base horaria: sueldo mensual ÷ 240. Las horas suplementarias llevan 50% y las extraordinarias 100% de recargo, según corresponda.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Horas al 50%" value={hours50} onChange={setHours50} step="1" /><Field label="Horas al 100%" value={hours100} onChange={setHours100} step="1" /></div>
              <div className="mt-4 grid grid-cols-2 gap-3"><Result label="Valor hora al 50%" value={money.format(values.hourly.supplementary)} /><Result label="Valor hora al 100%" value={money.format(values.hourly.extraordinary)} /></div>
              <div className="mt-3"><Result label="Total estimado de horas extra" value={money.format(values.overtime)} /></div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5 lg:col-span-2">
              <h2 className="text-xl font-semibold">💰 Utilidades</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">El 15% legal se reparte en 10% por tiempo trabajado y 5% por cargas familiares. Para hacerlo bien, algunos datos tienen que venir de la empresa.</p>

              <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                <p className="text-sm font-semibold">📅 Tu tiempo trabajado</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Si no recuerdas los días exactos, usa meses. Para esta estimación, 1 mes = 30 días.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setUtilitiesTimeMode("months")} className={`min-h-14 rounded-xl border px-4 text-left ${utilitiesTimeMode === "months" ? "border-[var(--wine)] bg-[var(--wine)]/5" : "border-[var(--border)] bg-white"}`}><span className="block text-sm font-semibold">📅 Por meses</span><span className="mt-1 block text-xs text-[var(--muted)]">Elige de 1 a 12 meses</span></button><button type="button" onClick={() => setUtilitiesTimeMode("days")} className={`min-h-14 rounded-xl border px-4 text-left ${utilitiesTimeMode === "days" ? "border-[var(--wine)] bg-[var(--wine)]/5" : "border-[var(--border)] bg-white"}`}><span className="block text-sm font-semibold">📆 Por días</span><span className="mt-1 block text-xs text-[var(--muted)]">Para el dato exacto</span></button></div>
                {utilitiesTimeMode === "months" ? <div className="mt-4"><p className="text-sm font-medium">Meses trabajados</p><div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <button key={month} type="button" onClick={() => setUtilityMonths(String(month))} className={`min-h-10 rounded-lg border text-sm ${Number(utilityMonths) === month ? "border-[var(--wine)] bg-[var(--wine)]/5 font-semibold text-[var(--wine)]" : "border-[var(--border)] bg-white"}`}>{month} {month === 1 ? "mes" : "meses"}</button>)}</div><div className="mt-3"><Field label="O ingresa meses trabajados" value={utilityMonths} onChange={setUtilityMonths} min={0} max={12} step="0.1" /><p className="mt-2 text-xs text-[var(--muted)]">Tu tiempo estimado: <strong>{number.format(values.workerDays)} días</strong>.</p></div></div> : <div className="mt-4"><Field label="Días trabajados" value={utilityDays} onChange={setUtilityDays} min={0} max={360} step="1" placeholder="Ejemplo: 180" /></div>}
              </div>

              <div className="mt-5 rounded-xl border border-[var(--border)] p-4">
                <p className="text-sm font-semibold">🏢 Datos que debe proporcionar la empresa</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Utilidad líquida de la empresa ($)" value={profit} onChange={setProfit} help="Es la utilidad líquida anual que se va a repartir, no tu sueldo." /><Field label="Total de días de todos los trabajadores" value={totalWorkerDays} onChange={setTotalWorkerDays} min={0} step="1" help="Suma de los días trabajados por todas las personas trabajadoras y extrabajadoras que participan en el reparto." /></div>
                <div className="mt-4 rounded-xl bg-[var(--background)] p-3 text-xs leading-5 text-[var(--muted)]"><strong className="text-[var(--foreground)]">¿Por qué necesito ese total?</strong> Porque el 10% se reparte según tus días frente a la suma de días de todas las personas participantes.</div>
              </div>

              <div className="mt-5 rounded-xl border border-[var(--border)] p-4">
                <p className="text-sm font-semibold">👨‍👩‍👧 Cargas familiares · 5%</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="¿Cuántas cargas familiares tienes?" value={familyCount} onChange={setFamilyCount} min={0} max={20} step="1" help="Cuenta las cargas familiares debidamente acreditadas para el reparto." /><Field label="Factor B total de la empresa" value={totalFamilyFactor} onChange={setTotalFamilyFactor} min={0} step="1" help="Suma de los Factores A de todos los trabajadores y extrabajadores. Sin este dato no se puede calcular exactamente el 5%." /></div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2"><Result label="Tu Factor A = días × cargas" value={number.format(values.familyFactor)} /><Result label="5% por cargas" value={utilityFivePercent} /></div>
                <div className="mt-3 rounded-xl bg-[var(--background)] p-3 text-xs leading-5 text-[var(--muted)]">Factor A = tus días trabajados × tus cargas. Factor B = suma de los Factores A de todas las personas participantes.</div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3"><Result label="10% por tiempo" value={utilityTenPercent} /><Result label="5% por cargas" value={utilityFivePercent} /><Result label="Total estimado" value={utilityTotal} /></div>
            </section>
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--wine)]/15 bg-[var(--wine)]/5 p-5 text-sm leading-6 text-[var(--muted)]"><strong className="text-[var(--foreground)]">Importante:</strong> esta herramienta es referencial. Para una liquidación definitiva deben utilizarse los valores reales de los roles de pago y los datos oficiales de la empresa.</div>
        </section>
      </div>
    </main>
  );
}
