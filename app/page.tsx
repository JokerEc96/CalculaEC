"use client";

import { useState } from "react";

export default function Home() {
const [showTools, setShowTools] = useState(false);

return (



    <header className="flex items-center justify-between">
      <div>
        <div className="text-2xl font-bold tracking-tight">
          Calcula<span className="text-[var(--wine)]">EC</span>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Herramientas útiles para Ecuador
        </p>
      </div>

      <button
        onClick={() => setShowTools(!showTools)}
        className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        Herramientas
      </button>
    </header>

    <div className="mt-20 max-w-3xl">
      <p className="mb-4 text-sm font-medium text-[var(--wine)]">
        CalculaEC · Ecuador
      </p>

      <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
        Herramientas que te dan la respuesta,
        <span className="text-[var(--wine)]"> sin hacerte perder tiempo.</span>
      </h1>

      <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
        Calculadoras, precios, indicadores y herramientas prácticas
        pensadas para la vida diaria en Ecuador.
      </p>
    </div>

    <section className="mt-14 grid gap-5 md:grid-cols-3">

      <article className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cream)] text-xl">
          ⛽
        </div>

        <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          Gasolina
        </p>

        <h2 className="mt-2 text-xl font-semibold">
          Viaje por kilómetros
        </h2>

        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Calcula cuánto combustible y dinero podrías gastar en un
          recorrido.
        </p>

        <button className="mt-6 text-sm font-semibold text-[var(--wine)]">
          Calcular →
        </button>
      </article>

      <article className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cream)] text-xl">
          💼
        </div>

        <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          Trabajo
        </p>

        <h2 className="mt-2 text-xl font-semibold">
          Calculadora laboral
        </h2>

        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Décimos, vacaciones, utilidades, liquidaciones y otras
          herramientas laborales.
        </p>

        <button className="mt-6 text-sm font-semibold text-[var(--wine)]">
          Ver calculadoras →
        </button>
      </article>

      <article className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cream)] text-xl">
          📊
        </div>

        <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          Ecuador
        </p>

        <h2 className="mt-2 text-xl font-semibold">
          Indicadores actuales
        </h2>

        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Información útil presentada de forma rápida y sencilla.
        </p>

        <button className="mt-6 text-sm font-semibold text-[var(--wine)]">
          Ver indicadores →
        </button>
      </article>

    </section>

    {showTools && (
      <section className="mt-6 rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Más herramientas próximamente
        </h2>

        <p className="mt-2 text-sm text-[var(--muted)]">
          CalculaEC crecerá poco a poco con herramientas prácticas para
          Ecuador.
        </p>
      </section>
    )}

    <section className="mt-10 grid gap-4 sm:grid-cols-2">

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <p className="text-xs text-[var(--muted)]">
          Precio actual de gasolinas en Ecuador
        </p>

        <p className="mt-2 text-sm font-medium">
          Consulta los precios actuales
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <p className="text-xs text-[var(--muted)]">
          Sueldo actual e IVA del Ecuador
        </p>

        <p className="mt-2 text-sm font-medium">
          Información económica actual
        </p>
      </div>

    </section>

    <div className="mt-10 flex min-h-24 items-center justify-center rounded-3xl border border-dashed border-[var(--border)]">
      <span className="text-xs text-[var(--muted)]">
        Espacio publicitario
      </span>
    </div>

    <footer className="mt-12 border-t border-[var(--border)] py-8 text-center text-xs text-[var(--muted)]">
      © {new Date().getFullYear()} CalculaEC · Herramientas para Ecuador
    </footer>

  </section>
</main>

);
}
