"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ToolId = "prestamos" | "tarjetas" | "ahorro" | "interes" | "presupuesto" | "me-alcanza";

const tools: Array<{ id: ToolId; icon: string; eyebrow: string; title: string; description: string }> = [
  { id: "prestamos", icon: "💳", eyebrow: "Financiamiento", title: "Préstamos", description: "Calcula cuota, intereses y cuánto terminarás pagando." },
  { id: "tarjetas", icon: "💳", eyebrow: "Crédito", title: "Tarjetas", description: "Descubre cuánto cuesta financiar una compra." },
  { id: "ahorro", icon: "🎯", eyebrow: "Metas", title: "Ahorro", description: "Calcula cuánto guardar para alcanzar una meta." },
  { id: "interes", icon: "📈", eyebrow: "Crecimiento", title: "Interés compuesto", description: "Mira cómo puede crecer tu dinero con el tiempo." },
  { id: "presupuesto", icon: "📊", eyebrow: "Control", title: "Presupuesto", description: "Ordena tus ingresos, gastos y capacidad de ahorro." },
  { id: "me-alcanza", icon: "🧮", eyebrow: "Decisión", title: "¿Me alcanza?", description: "Comprueba si una nueva cuota cabe en tu bolsillo." },
];

const money = (value: number) => new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0);
const number = (value: number, digits = 2) => new Intl.NumberFormat("es-EC", { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
const n = (value: string) => Number(value) || 0;

function Field({ label, value, onChange, placeholder = "0", suffix }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; suffix?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <div className="relative mt-2">
        <input type="number" min="0" step="0.01" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3.5 text-sm outline-none transition focus:border-[var(--wine)] focus:ring-4 focus:ring-[var(--wine)]/8" />
        {suffix && <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-medium text-[var(--muted)]">{suffix}</span>}
      </div>
    </label>
  );
}

function Result({ label, value, accent = false, note }: { label: string; value: string; accent?: boolean; note?: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-[var(--wine)]/20 bg-[var(--wine)] text-white" : "border-[var(--border)] bg-[var(--background)]"}`}>
      <p className={`text-xs ${accent ? "text-white/70" : "text-[var(--muted)]"}`}>{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {note && <p className={`mt-1 text-xs ${accent ? "text-white/70" : "text-[var(--muted)]"}`}>{note}</p>}
    </div>
  );
}

export default function FinanzasPage() {
  const [active, setActive] = useState<ToolId>("prestamos");
  const [loan, setLoan] = useState({ amount: "5000", rate: "12", months: "24" });
  const [card, setCard] = useState({ amount: "500", rate: "18", months: "6" });
  const [saving, setSaving] = useState({ target: "3000", current: "500", monthly: "250" });
  const [compound, setCompound] = useState({ initial: "500", monthly: "100", rate: "8", years: "5" });
  const [budget, setBudget] = useState({ income: "600", fixed: "180", variable: "120", debts: "80" });
  const [afford, setAfford] = useState({ income: "600", expenses: "300", currentDebt: "80", newPayment: "120" });

  const loanResult = useMemo(() => {
    const p = n(loan.amount), monthlyRate = n(loan.rate) / 100 / 12, months = Math.max(0, Math.round(n(loan.months)));
    if (!p || !months) return { payment: 0, total: 0, interest: 0 };
    const payment = monthlyRate === 0 ? p / months : p * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
    return { payment, total: payment * months, interest: payment * months - p };
  }, [loan]);

  const cardResult = useMemo(() => {
    const p = n(card.amount), monthlyRate = n(card.rate) / 100 / 12, months = Math.max(0, Math.round(n(card.months)));
    if (!p || !months) return { payment: 0, total: 0, interest: 0 };
    const payment = monthlyRate === 0 ? p / months : p * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
    return { payment, total: payment * months, interest: payment * months - p };
  }, [card]);

  const savingResult = useMemo(() => {
    const missing = Math.max(0, n(saving.target) - n(saving.current));
    const monthly = n(saving.monthly);
    return { missing, months: monthly > 0 ? Math.ceil(missing / monthly) : 0 };
  }, [saving]);

  const compoundResult = useMemo(() => {
    const initial = n(compound.initial), monthly = n(compound.monthly), rate = n(compound.rate) / 100 / 12, months = Math.max(0, Math.round(n(compound.years) * 12));
    if (!months) return { final: initial, invested: initial, interest: 0 };
    const growth = Math.pow(1 + rate, months);
    const contributions = rate === 0 ? monthly * months : monthly * ((growth - 1) / rate);
    const final = initial * growth + contributions;
    const invested = initial + monthly * months;
    return { final, invested, interest: final - invested };
  }, [compound]);

  const budgetResult = useMemo(() => {
    const income = n(budget.income), expenses = n(budget.fixed) + n(budget.variable) + n(budget.debts), available = income - expenses;
    return { available, rate: income > 0 ? (available / income) * 100 : 0 };
  }, [budget]);

  const affordResult = useMemo(() => {
    const income = n(afford.income), obligations = n(afford.expenses) + n(afford.currentDebt), after = income - obligations - n(afford.newPayment);
    return { after, ratio: income > 0 ? ((obligations + n(afford.newPayment)) / income) * 100 : 0 };
  }, [afford]);

  const selected = tools.find((tool) => tool.id === active)!;

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-5 sm:py-7">
          <Link href="/" className="text-xl font-bold tracking-tight">Calcula<span className="text-[var(--wine)]">EC</span></Link>
          <Link href="/" className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold transition hover:border-[var(--wine)]/30 hover:text-[var(--wine)]">← Inicio</Link>
        </header>

        <section className="relative py-10 sm:py-14">
          <div className="pointer-events-none absolute -right-24 -top-20 h-80 w-80 rounded-full bg-[var(--wine)]/6 blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--wine)]">CalculaEC · Finanzas</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">Toma decisiones con<br /><span className="text-[var(--wine)]">números claros.</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">Calcula cuotas, ahorro, intereses y presupuesto sin fórmulas complicadas. Elige una herramienta y juega con los números.</p>
          </div>
        </section>

        <section className="pb-20" aria-label="Calculadoras financieras">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <button key={tool.id} type="button" onClick={() => setActive(tool.id)} className={`group min-h-44 rounded-[2rem] border p-6 text-left transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(37,35,33,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] focus-visible:ring-offset-2 ${active === tool.id ? "border-[var(--wine)]/30 bg-[var(--wine)] text-white shadow-[0_18px_50px_rgba(93,35,50,0.16)]" : "border-[var(--border)] bg-white"}`}>
                <div className="flex items-start justify-between"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${active === tool.id ? "bg-white/10" : "bg-[var(--cream)]"}`}>{tool.icon}</span><span className={`text-lg transition-transform group-hover:translate-x-1 ${active === tool.id ? "text-white/70" : "text-[var(--muted)]"}`}>↗</span></div>
                <p className={`mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] ${active === tool.id ? "text-white/70" : "text-[var(--wine)]"}`}>{tool.eyebrow}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">{tool.title}</h2>
                <p className={`mt-2 text-sm leading-6 ${active === tool.id ? "text-white/75" : "text-[var(--muted)]"}`}>{tool.description}</p>
              </button>
            ))}
          </div>

          <section className="mt-6 rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-[0_18px_60px_rgba(37,35,33,0.06)] sm:p-8" aria-live="polite">
            <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--wine)]">{selected.eyebrow}</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">{selected.icon} {selected.title}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{selected.description}</p></div>
              <span className="rounded-full bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">Calculadora</span>
            </div>

            {active === "prestamos" && <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_1.05fr]"><div className="grid gap-4 sm:grid-cols-2"><Field label="Monto del préstamo" value={loan.amount} onChange={(v) => setLoan({ ...loan, amount: v })} suffix="$" /><Field label="Tasa anual" value={loan.rate} onChange={(v) => setLoan({ ...loan, rate: v })} suffix="%" /><Field label="Plazo" value={loan.months} onChange={(v) => setLoan({ ...loan, months: v })} suffix="meses" /></div><div className="grid gap-3 sm:grid-cols-2"><Result label="Cuota mensual" value={money(loanResult.payment)} accent /><Result label="Total pagado" value={money(loanResult.total)} /><Result label="Intereses" value={money(loanResult.interest)} note="Costo financiero estimado" /><Result label="Capital" value={money(n(loan.amount))} /></div></div>}

            {active === "tarjetas" && <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_1.05fr]"><div className="grid gap-4 sm:grid-cols-2"><Field label="Valor de la compra" value={card.amount} onChange={(v) => setCard({ ...card, amount: v })} suffix="$" /><Field label="Tasa anual" value={card.rate} onChange={(v) => setCard({ ...card, rate: v })} suffix="%" /><Field label="Número de cuotas" value={card.months} onChange={(v) => setCard({ ...card, months: v })} suffix="cuotas" /></div><div className="grid gap-3 sm:grid-cols-2"><Result label="Cuota estimada" value={money(cardResult.payment)} accent /><Result label="Terminarías pagando" value={money(cardResult.total)} /><Result label="Intereses" value={money(cardResult.interest)} /><Result label="Costo extra" value={`${n(card.amount) > 0 ? number((cardResult.interest / n(card.amount)) * 100) : "0"}%`} note="Sobre el precio original" /></div></div>}

            {active === "ahorro" && <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_1.05fr]"><div className="grid gap-4 sm:grid-cols-2"><Field label="Meta de ahorro" value={saving.target} onChange={(v) => setSaving({ ...saving, target: v })} suffix="$" /><Field label="Ya tienes" value={saving.current} onChange={(v) => setSaving({ ...saving, current: v })} suffix="$" /><Field label="Aporte mensual" value={saving.monthly} onChange={(v) => setSaving({ ...saving, monthly: v })} suffix="$" /></div><div className="grid gap-3 sm:grid-cols-2"><Result label="Te falta" value={money(savingResult.missing)} accent /><Result label="Tiempo estimado" value={savingResult.missing === 0 ? "¡Meta lista!" : savingResult.months ? `${savingResult.months} meses` : "—"} /><Result label="Aporte mensual" value={money(n(saving.monthly))} /><Result label="Meta total" value={money(n(saving.target))} /></div></div>}

            {active === "interes" && <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_1.05fr]"><div className="grid gap-4 sm:grid-cols-2"><Field label="Capital inicial" value={compound.initial} onChange={(v) => setCompound({ ...compound, initial: v })} suffix="$" /><Field label="Aporte mensual" value={compound.monthly} onChange={(v) => setCompound({ ...compound, monthly: v })} suffix="$" /><Field label="Rendimiento anual" value={compound.rate} onChange={(v) => setCompound({ ...compound, rate: v })} suffix="%" /><Field label="Tiempo" value={compound.years} onChange={(v) => setCompound({ ...compound, years: v })} suffix="años" /></div><div className="grid gap-3 sm:grid-cols-2"><Result label="Valor final estimado" value={money(compoundResult.final)} accent /><Result label="Dinero aportado" value={money(compoundResult.invested)} /><Result label="Ganancia estimada" value={money(compoundResult.interest)} /><Result label="Rendimiento" value={`${n(compound.initial) + n(compound.monthly) * n(compound.years) * 12 > 0 ? number((compoundResult.interest / (n(compound.initial) + n(compound.monthly) * n(compound.years) * 12)) * 100) : "0"}%`} /></div></div>}

            {active === "presupuesto" && <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_1.05fr]"><div className="grid gap-4 sm:grid-cols-2"><Field label="Ingresos mensuales" value={budget.income} onChange={(v) => setBudget({ ...budget, income: v })} suffix="$" /><Field label="Gastos fijos" value={budget.fixed} onChange={(v) => setBudget({ ...budget, fixed: v })} suffix="$" /><Field label="Gastos variables" value={budget.variable} onChange={(v) => setBudget({ ...budget, variable: v })} suffix="$" /><Field label="Deudas / cuotas" value={budget.debts} onChange={(v) => setBudget({ ...budget, debts: v })} suffix="$" /></div><div className="grid gap-3 sm:grid-cols-2"><Result label="Dinero disponible" value={money(budgetResult.available)} accent note={budgetResult.available >= 0 ? "Después de tus gastos" : "Tus gastos superan tus ingresos"} /><Result label="Margen libre" value={`${number(budgetResult.rate)}%`} /><Result label="Gastos totales" value={money(n(budget.fixed) + n(budget.variable) + n(budget.debts))} /><Result label="Ingreso mensual" value={money(n(budget.income))} /></div></div>}

            {active === "me-alcanza" && <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_1.05fr]"><div className="grid gap-4 sm:grid-cols-2"><Field label="Ingresos mensuales" value={afford.income} onChange={(v) => setAfford({ ...afford, income: v })} suffix="$" /><Field label="Gastos mensuales" value={afford.expenses} onChange={(v) => setAfford({ ...afford, expenses: v })} suffix="$" /><Field label="Cuotas actuales" value={afford.currentDebt} onChange={(v) => setAfford({ ...afford, currentDebt: v })} suffix="$" /><Field label="Nueva cuota" value={afford.newPayment} onChange={(v) => setAfford({ ...afford, newPayment: v })} suffix="$" /></div><div className="grid gap-3 sm:grid-cols-2"><Result label="Te quedaría" value={money(affordResult.after)} accent note={affordResult.after >= 0 ? "Después de todas las obligaciones" : "La cuota supera tu margen"} /><Result label="Comprometido" value={`${number(affordResult.ratio)}%`} /><Result label="Gastos + deudas" value={money(n(afford.expenses) + n(afford.currentDebt))} /><Result label="Nueva cuota" value={money(n(afford.newPayment))} /></div></div>}

            <p className="mt-7 border-t border-[var(--border)] pt-5 text-xs leading-5 text-[var(--muted)]">Estimación matemática. No incluye comisiones, seguros, impuestos ni condiciones particulares de una entidad financiera. En productos reales, revisa siempre la tasa y el costo total que te ofrecen.</p>
          </section>
        </section>
      </div>
    </main>
  );
}
