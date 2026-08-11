"use client";

import Link from "next/link";
import { useState } from "react";

const categories = [
  {
    id: "prestamos",
    icon: "💳",
    eyebrow: "Financiamiento",
    title: "Préstamos",
    description: "Cuotas, intereses, costo total y amortización.",
  },
  {
    id: "tarjetas",
    icon: "💳",
    eyebrow: "Crédito",
    title: "Tarjetas",
    description: "Entiende cuánto terminas pagando por una compra.",
  },
  {
    id: "ahorro",
    icon: "🎯",
    eyebrow: "Metas",
    title: "Ahorro",
    description: "Calcula cuánto necesitas guardar para llegar a tu meta.",
  },
  {
    id: "interes",
    icon: "📈",
    eyebrow: "Crecimiento",
    title: "Interés compuesto",
    description: "Mira cómo crece tu dinero con el tiempo.",
  },
  {
    id: "presupuesto",
    icon: "📊",
    eyebrow: "Control",
    title: "Presupuesto",
    description: "Organiza tus ingresos y gastos mensuales.",
  },
  {
    id: "me-alcanza",
    icon: "🧮",
    eyebrow: "Decisión",
    title: "¿Me alcanza?",
    description: "Comprueba si una cuota cabe realmente en tu presupuesto.",
  },
];

export default function FinanzasPage() {
  const [active, setActive] = useState<string | null>(null);
  const selected = categories.find((item) => item.id === active);

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto min-h-screen w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-5 sm:py-7">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Calcula<span className="text-[var(--wine)]">EC</span>
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold transition hover:border-[var(--wine)]/30 hover:text-[var(--wine)]"
          >
            ← Inicio
          </Link>
        </header>

        <section className="relative py-10 sm:py-16">
          <div className="pointer-events-none absolute -right-24 -top-20 h-80 w-80 rounded-full bg-[var(--wine)]/6 blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--wine)]">
              CalculaEC · Finanzas
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
              Tus decisiones de dinero,
              <span className="block text-[var(--wine)]">más claras.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              Elige qué quieres calcular. Cada herramienta se abrirá como una nueva capa para que puedas concentrarte en una sola decisión a la vez.
            </p>
          </div>
        </section>

        <section aria-label="Herramientas financieras" className="pb-16 sm:pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                className="group relative min-h-48 overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white p-6 text-left shadow-[0_16px_50px_rgba(37,35,33,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(37,35,33,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] focus-visible:ring-offset-2"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cream)] text-2xl" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="text-lg text-[var(--muted)] transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">↗</span>
                </div>
                <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--wine)]">{item.eyebrow}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
              </button>
            ))}
          </div>
        </section>

        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="finance-panel-title"
            onClick={() => setActive(null)}
          >
            <div
              className="finance-panel w-full max-w-3xl rounded-t-[2rem] border border-[var(--border)] bg-white p-6 shadow-[0_30px_100px_rgba(0,0,0,0.18)] sm:rounded-[2rem] sm:p-8"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--wine)]">{selected.eyebrow}</p>
                  <h2 id="finance-panel-title" className="mt-2 text-3xl font-semibold tracking-tight">{selected.title}</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">{selected.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] text-lg text-[var(--muted)] transition hover:border-[var(--wine)]/30 hover:text-[var(--wine)]"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>

              <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-6 text-center">
                <span className="text-3xl" aria-hidden="true">{selected.icon}</span>
                <p className="mt-3 text-sm font-semibold">Herramienta en construcción</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Esta sesión solo crea la navegación y la transición. El cálculo se implementará por separado.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes financeCardIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .group { animation: financeCardIn 500ms ease both; }
        @keyframes financePanelIn {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        .finance-panel { animation: financePanelIn 420ms cubic-bezier(.22,.8,.24,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .group, .finance-panel { animation: none; }
        }
      `}</style>
    </main>
  );
}
