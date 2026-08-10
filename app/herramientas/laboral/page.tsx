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
  const [hours25, setHours25] = useState("0");
  const [hours50, setHours50] = useState("0");
  const [hours100, setHours100] = useState("0");
  const [profit, setProfit] = useState("");
  const [hrWorkerDays, setHrWorkerDays] = useState("360");
  const [hrFamilyCount, setHrFamilyCount] = useState("0");
  const [totalWorkerDays, setTotalWorkerDays] = useState("");
  const [totalFamilyFactor, setTotalFamilyFactor] = useState("");
  const [workerUtilityBase, setWorkerUtilityBase] = useState("");
  const [workerUtilityCharges, setWorkerUtilityCharges] = useState("");
  const [workerFamilyCount, setWorkerFamilyCount] = useState("0");
  const [showUtilityAdvanced, setShowUtilityAdvanced] = useState(false);
  const [thirteenthMode, setThirteenthMode] = useState<"base" | "monthly">("monthly");
  const [monthlyRemunerations, setMonthlyRemunerations] = useState<string[]>(Array.from({ length: 12 }, () => "482"));

  const updateMonth = (index: number, value: string) => setMonthlyRemunerations((current) => current.map((item, i) => (i === index ? value : item)));
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
    const workerDays = Math.min(360, Math.max(0, Number(hrWorkerDays) || 0));
    const familyFactor = workerDays * Math.max(0, Number(hrFamilyCount) || 0);
    const totalDays = Math.max(0, Number(totalWorkerDays) || 0);
    const factorB = Math.max(0, Number(totalFamilyFactor) || 0);
    const utilities = calculateUtilities({ companyProfit: Number(profit) || 0, workerDays, totalWorkerDays: totalDays, familyFactor, totalFamilyFactor: factorB });
    return {
      thirteenth: calculateThirteenth([annualRemuneration]),
      fourteenth: calculateFourteenth(region, monthCount14),
      vacation: calculateVacation(annualRemuneration),
      reserve: calculateReserveFund(reserveBase, reserveCount),
      overtime: (Number(hours25) || 0) * hourly.night + (Number(hours50) || 0) * hourly.supplementary + (Number(hours100) || 0) * hourly.extraordinary,
      hourly,
      utilities,
      reserveBase,
      annualRemuneration,
      totalDays,
      factorB,
    };
  }, [monthlySalary, region, months14, reserveMonths, reserveMode, hours25, hours50, hours100, profit, hrWorkerDays, hrFamilyCount, totalWorkerDays, totalFamilyFactor, thirteenthMode, monthlyRemunerations]);

  const workerBase = Math.max(0, Number(workerUtilityBase) || 0);
  const workerChargesPerFamily = Math.max(0, Number(workerUtilityCharges) || 0);
  const workerFamilyCountNumber = Math.min(5, Math.max(0, Number(workerFamilyCount) || 0));
  const workerCharges = workerChargesPerFamily * workerFamilyCountNumber;
  const workerUtilityTotal = workerBase + workerCharges;
  const workerUtilityHasInput = workerUtilityBase.trim() !== "" || workerUtilityCharges.trim() !== "";
  const utilityReady = showUtilityAdvanced && Number(profit) > 0 && values.totalDays > 0 && values.factorB > 0;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8">
        <Header />
        <section className="py-10 sm:py-14">
          <Link href="/" className="text-sm font-medium text-[var(--wine)]">← Volver a CalculaEC</Link>
          <div className="mt-5 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--wine)]">Trabajo · Ecuador</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Calculadora laboral</h1>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">Calcula tus principales beneficios laborales con datos que una persona trabajadora pueda conocer de sus roles de pago.</p>
          </div>

          <div className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
            <h2 className="text-xl font-semibold">💵 Tu sueldo base</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Es tu sueldo mensual fijo. Si algunos meses recibes más por horas extra, no cambies este valor: esos ingresos se registran dentro del décimo tercero.</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Sueldo base mensual ($)" value={monthlySalary} onChange={setMonthlySalary} help="Ejemplo: $482. Se utiliza para calcular horas extra y como referencia del fondo de reserva." />
              <label className="block"><span className="text-sm font-medium">Región</span><select value={region} onChange={(e) => setRegion(e.target.value as LaborRegion)} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm"><option value="costa">Costa / Insular</option><option value="sierra">Sierra / Amazonía</option></select><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">Se usa para el período del décimo cuarto.</span></label>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-[var(--border)] bg-white p-5 lg:col-span-2">
              <h2 className="text-xl font-semibold">🎁 Décimo tercero</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Se calcula con las remuneraciones percibidas durante el período. Si hiciste horas extra, registrar cada mes es lo más preciso.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setThirteenthMode("monthly")} className={`min-h-14 rounded-xl border px-4 text-left ${thirteenthMode === "monthly" ? "border-[var(--wine)] bg-[var(--wine)]/5" : "border-[var(--border)]"}`}><span className="block text-sm font-semibold">📊 Registrar cada mes</span><span className="mt-1 block text-xs text-[var(--muted)]">Recomendado si hubo horas extra</span></button>
                <button type="button" onClick={() => setThirteenthMode("base")} className={`min-h-14 rounded-xl border px-4 text-left ${thirteenthMode === "base" ? "border-[var(--wine)] bg-[var(--wine)]/5" : "border-[var(--border)]"}`}><span className="block text-sm font-semibold">🧾 Solo sueldo base</span><span className="mt-1 block text-xs text-[var(--muted)]">Estimación rápida</span></button>
              </div>
              {thirteenthMode === "monthly" ? <div className="mt-5 rounded-xl border border-[var(--border)] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">Lo que recibiste cada mes</p><p className="mt-1 text-xs text-[var(--muted)]">Período: diciembre a noviembre. Incluye los ingresos remunerativos que correspondan, como horas extra.</p></div><div className="flex gap-2"><button type="button" onClick={fillBaseSalary} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium">Llenar con sueldo base</button><button type="button" onClick={clearMonthlyRemunerations} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium">Limpiar</button></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{monthlyRemunerations.map((value, index) => <Field key={index} label={thirteenthMonths[index]} value={value} onChange={(next) => updateMonth(index, next)} min={0} step="0.01" placeholder="482" />)}</div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Result label="Total remuneraciones del período" value={money.format(values.annualRemuneration)} /><Result label="Décimo tercero estimado" value={money.format(values.thirteenth)} /></div></div> : <div className="mt-5 grid gap-3 sm:grid-cols-2"><Result label="Remuneración anual estimada" value={money.format(values.annualRemuneration)} /><Result label="Décimo tercero estimado" value={money.format(values.thirteenth)} /></div>}
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h2 className="text-xl font-semibold">🎓 Décimo cuarto</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">No depende de tu sueldo ni de tus horas extra. Se calcula con el SBU y el tiempo trabajado del período correspondiente.</p>
              <div className="mt-4"><p className="text-sm font-medium">¿Cuántos meses trabajaste?</p><div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">{Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <button key={month} type="button" onClick={() => setMonths14(String(month))} className={`min-h-10 rounded-lg border text-sm ${Number(months14) === month ? "border-[var(--wine)] bg-[var(--wine)]/5 font-semibold text-[var(--wine)]" : "border-[var(--border)]"}`}>{month} {month === 1 ? "mes" : "meses"}</button>)}</div></div><div className="mt-4"><Result label="Décimo cuarto estimado" value={money.format(values.fourteenth)} /></div><p className="mt-3 text-xs text-[var(--muted)]">SBU 2026: {money.format(SBU_2026)}.</p>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h2 className="text-xl font-semibold">🏖️ Vacaciones</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">La referencia legal es la veinticuatroava parte de lo percibido durante un año completo, tomando en cuenta los componentes remunerativos que correspondan.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><Result label="Total remunerado en el período" value={money.format(values.annualRemuneration)} /><Result label="Vacaciones estimadas · 1/24" value={money.format(values.vacation)} /></div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h2 className="text-xl font-semibold">🏦 Fondo de reserva</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Para una referencia rápida puedes usar tu sueldo base. Si tus ingresos remunerativos cambian, también puedes usar el promedio de los meses registrados arriba.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setReserveMode("monthly")} className={`min-h-12 rounded-xl border px-3 text-left ${reserveMode === "monthly" ? "border-[var(--wine)] bg-[var(--wine)]/5" : "border-[var(--border)]"}`}><span className="block text-sm font-semibold">📊 Usar ingresos mensuales</span><span className="block text-xs text-[var(--muted)]">Más preciso si hubo horas extra</span></button><button type="button" onClick={() => setReserveMode("base")} className={`min-h-12 rounded-xl border px-3 text-left ${reserveMode === "base" ? "border-[var(--wine)] bg-[var(--wine)]/5" : "border-[var(--border)]"}`}><span className="block text-sm font-semibold">🧾 Usar sueldo base</span><span className="block text-xs text-[var(--muted)]">Estimación rápida</span></button></div><div className="mt-4"><Field label="Meses con derecho al fondo" value={reserveMonths} onChange={setReserveMonths} min={0} max={12} step="1" /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Result label="Base mensual utilizada" value={money.format(values.reserveBase)} /><Result label="Fondo estimado" value={money.format(values.reserve)} /></div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h2 className="text-xl font-semibold">⏱️ Horas extra</h2><p className="mt-1 text-sm text-[var(--muted)]">Base horaria: sueldo mensual ÷ 240. La jornada nocturna tiene 25% de recargo; las horas suplementarias 50% y las extraordinarias 100%, según corresponda.</p><div className="mt-4 grid gap-4 sm:grid-cols-3"><Field label="Horas nocturnas · 25%" value={hours25} onChange={setHours25} step="1" /><Field label="Horas al 50%" value={hours50} onChange={setHours50} step="1" /><Field label="Horas al 100%" value={hours100} onChange={setHours100} step="1" /></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Result label="Valor hora nocturna · 25%" value={money.format(values.hourly.night)} /><Result label="Valor hora al 50%" value={money.format(values.hourly.supplementary)} /><Result label="Valor hora al 100%" value={money.format(values.hourly.extraordinary)} /></div><div className="mt-3"><Result label="Total estimado de horas con recargo" value={money.format(values.overtime)} /></div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-white p-5 lg:col-span-2">
              <h2 className="text-xl font-semibold">💰 Utilidades</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Aquí tienes dos caminos: si tu empresa ya te dio los valores, solo los sumas; si eres RR. HH., puedes abrir el cálculo completo del reparto.</p>

              <div className="mt-5 rounded-2xl border border-[var(--wine)]/20 bg-[var(--wine)]/5 p-5">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">👷</div>
                  <div><h3 className="text-base font-semibold">Si eres trabajador</h3><p className="mt-1 text-sm leading-6 text-[var(--muted)]">Si tu empresa te informó, por ejemplo, <strong>Base (10%) $700</strong> y <strong>Cargas (5%) $500 por cada carga</strong>, coloca esos valores. No necesitas saber cuántos trabajadores tiene la empresa ni ningún dato de RR. HH.</p></div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field label="Base (10%) — tu valor ($)" value={workerUtilityBase} onChange={setWorkerUtilityBase} min={0} step="0.01" placeholder="700" help="El valor que te informó la empresa." />
                  <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                    <Field label="Cargas (5%) — valor por cada carga ($)" value={workerUtilityCharges} onChange={setWorkerUtilityCharges} min={0} step="0.01" placeholder="500" help="Ingresa el valor que corresponde a una sola carga familiar." />
                    <label className="block"><span className="text-xs font-medium text-[var(--foreground)]">N.º de cargas</span><select aria-label="Número de cargas familiares" value={workerFamilyCount} onChange={(event) => setWorkerFamilyCount(event.target.value)} className="mt-2 min-h-11 w-16 rounded-full border border-[var(--border)] bg-white px-2 text-center text-sm outline-none focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine)]/10">{Array.from({ length: 6 }, (_, index) => <option key={index} value={index}>{index}</option>)}</select></label>
                  </div>
                </div>
                <div className="mt-5 rounded-xl bg-white p-4"><p className="text-xs text-[var(--muted)]">Total de utilidades que recibirías</p><p className="mt-1 text-3xl font-semibold tracking-tight">{workerUtilityHasInput ? money.format(workerUtilityTotal) : "—"}</p>{!workerUtilityHasInput && <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Ejemplo: $700 de Base + ($500 × 3 cargas) = $2.200.</p>}</div>
              </div>

              <div className="mt-5 rounded-xl border border-[var(--border)] p-4">
                <button type="button" onClick={() => setShowUtilityAdvanced((current) => !current)} className="w-full text-left"><span className="text-sm font-semibold">{showUtilityAdvanced ? "▾ Ocultar cálculo para RR. HH." : "▸ 🧑‍💼 Soy RR. HH. / Tengo los datos de reparto de la empresa"}</span><span className="mt-1 block text-xs text-[var(--muted)]">Solo abre esta sección si tienes la información interna necesaria para calcular el reparto.</span></button>
                {showUtilityAdvanced && <div className="mt-5"><div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm leading-6 text-[var(--muted)]"><strong className="text-[var(--foreground)]">Cálculo empresarial:</strong> el 10% se reparte por días trabajados y el 5% por cargas familiares. Estos datos son propios del reparto de la empresa y normalmente los maneja RR. HH. o la nómina.</div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Utilidad líquida de la empresa ($)" value={profit} onChange={setProfit} help="Utilidad líquida sobre la que se calcula el 15%." /><Field label="Tus días trabajados" value={hrWorkerDays} onChange={setHrWorkerDays} min={0} max={360} step="1" help="Tus días trabajados durante el ejercicio." /><Field label="Tus cargas familiares" value={hrFamilyCount} onChange={setHrFamilyCount} min={0} max={20} step="1" help="Cargas familiares acreditadas ante la empresa." /><Field label="Total de días de todas las personas" value={totalWorkerDays} onChange={setTotalWorkerDays} min={0} step="1" help="Dato interno de la empresa." /><Field label="Factor B total" value={totalFamilyFactor} onChange={setTotalFamilyFactor} min={0} step="1" help="Suma del Factor A de todas las personas." /></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Result label="Base (10%)" value={utilityReady ? money.format(values.utilities.tenPercent) : "No disponible"} /><Result label="Cargas (5%)" value={utilityReady ? money.format(values.utilities.fivePercent) : "No disponible"} /><Result label="Total de utilidades" value={utilityReady ? money.format(values.utilities.total) : "Completa los datos"} /></div></div>}
              </div>
            </section>
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--wine)]/15 bg-[var(--wine)]/5 p-5 text-sm leading-6 text-[var(--muted)]"><strong className="text-[var(--foreground)]">Importante:</strong> esta herramienta es referencial. Para una liquidación definitiva deben utilizarse los valores reales de tus roles de pago y, cuando se trate de utilidades, los datos oficiales del reparto de la empresa.</div>
        </section>
      </div>
    </main>
  );
}
