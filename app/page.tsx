"use client";

import { useState } from "react";
import Header from "@/components/Header";
import ToolsSection from "@/components/ToolsSection";
import InfoSection from "@/components/InfoSection";

export default function Home() {
  const [showTools, setShowTools] = useState(false);

  return (
    <main>
      <Header />

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

      <section id="herramientas">
        <ToolsSection />
      </section>

      <section id="indicadores">
        <InfoSection />
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

      <div className="mt-10 flex min-h-24 items-center justify-center rounded-3xl border border-dashed border-[var(--border)]">
        <span className="text-xs text-[var(--muted)]">
          Espacio publicitario
        </span>
      </div>

      <footer className="mt-12 border-t border-[var(--border)] py-8 text-center text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} CalculaEC · Herramientas para Ecuador
      </footer>
    </main>
  );
}
