"use client";

import { useState } from "react";

const navigation = [
  { label: "Herramientas", href: "#herramientas" },
  { label: "Indicadores", href: "#indicadores" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="relative flex items-center justify-between py-5">
      <a
        href="/"
        className="group flex items-center gap-2"
        aria-label="CalculaEC, inicio"
      >
        <span className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Calcula<span className="text-[var(--wine)]">EC</span>
        </span>
      </a>

      <nav className="hidden items-center gap-8 md:flex" aria-label="Navegación principal">
        {navigation.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="text-sm text-[var(--muted)] transition-colors duration-200 hover:text-[var(--wine)]"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--foreground)] transition hover:-translate-y-0.5 hover:shadow-sm md:hidden"
      >
        <span className="sr-only">{isOpen ? "Cerrar menú" : "Abrir menú"}</span>
        <span className="flex w-4 flex-col gap-1" aria-hidden="true">
          <span className="h-px w-full bg-current" />
          <span className="h-px w-full bg-current" />
          <span className="h-px w-full bg-current" />
        </span>
      </button>

      {isOpen && (
        <nav
          id="mobile-navigation"
          className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-lg md:hidden"
          aria-label="Navegación móvil"
        >
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm text-[var(--muted)] transition-colors duration-200 hover:bg-[var(--cream)] hover:text-[var(--wine)]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
