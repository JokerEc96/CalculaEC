"use client";

import Link from "next/link";
import Header from "@/components/Header";
import ToolsSection from "@/components/ToolsSection";
import InfoSection from "@/components/InfoSection";

export default function Home() {
  return (
    <main id="inicio" className="min-h-screen w-full overflow-hidden bg-[var(--background)]">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <Header />

        <section className="relative scroll-mt-8 py-14 sm:py-20 lg:py-24" aria-labelledby="hero-title">
          <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-[var(--wine)]/5 blur-3xl" aria-hidden="true" />
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="relative max-w-2xl">
              <p className="inline-flex rounded-full border border-[var(--wine)]/15 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--wine)]">CalculaEC · Ecuador</p>
              <h1 id="hero-title" className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl">Herramientas que te dan la respuesta,<span className="block text-[var(--wine)]">sin hacerte perder tiempo.</span></h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">Calculadoras, precios, indicadores y herramientas prácticas pensadas para la vida diaria en Ecuador.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="#herramientas" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--wine)] px-6 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--wine-dark)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none">Explorar herramientas</Link>
                <Link href="#indicadores" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-6 text-sm font-semibold text-[var(--foreground)] transition duration-200 hover:border-[var(--wine)]/30 hover:text-[var(--wine)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] focus-visible:ring-offset-2 motion-reduce:transition-none">Ver información actual</Link>
              </div>
              <div className="mt-10 grid max-w-lg grid-cols-3 border-t border-[var(--border)] pt-5">
                {["Rápido", "Confiable", "Útil"].map((item) => <div key={item} className="flex items-center gap-2 text-xs font-medium text-[var(--muted)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--wine)]" aria-hidden="true" />{item}</div>)}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[520px] lg:ml-auto" aria-label="Espacio para contenido destacado">
              <div className="absolute -inset-3 rounded-[2rem] bg-[var(--wine)]/5 blur-xl" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-[0_24px_70px_rgba(37,35,33,0.10)] sm:p-8">
                <div className="flex min-h-[330px] flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--wine)]">CalculaEC</p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight">Un espacio para algo grande.</h2>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">Aquí podemos colocar después un video corto, una animación de marca, una herramienta destacada o incluso un bloque publicitario.</p>
                  </div>
                  <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-5">
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cream)] text-xl" aria-hidden="true">✦</span>
                      <div><p className="text-sm font-semibold">Contenido destacado</p><p className="mt-1 text-xs text-[var(--muted)]">Reservado para una idea futura.</p></div>
                    </div>
                  </div>
                  <p className="mt-5 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Este espacio puede convertirse en publicidad más adelante</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="herramientas" className="scroll-mt-8"><ToolsSection /></section>
        <section id="indicadores" className="scroll-mt-8"><InfoSection /></section>

        <section className="mt-14 sm:mt-20" aria-label="Espacio publicitario"><div className="flex min-h-28 items-center justify-center rounded-[2rem] border border-dashed border-[var(--border)] bg-white/40 px-6 text-center"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Espacio publicitario</p><p className="mt-1 text-xs text-[var(--muted)]">Próximamente</p></div></div></section>

        <footer className="mt-16 border-t border-[var(--border)] py-10 sm:mt-20"><div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><Link href="/" className="text-xl font-bold tracking-tight text-[var(--foreground)]">Calcula<span className="text-[var(--wine)]">EC</span></Link><p className="mt-2 text-sm text-[var(--muted)]">Herramientas para Ecuador.</p></div><p className="text-xs text-[var(--muted)]">© {new Date().getFullYear()} CalculaEC · Todos los derechos reservados.</p></div></footer>
      </div>
    </main>
  );
}
