"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

type Category = "longitud" | "peso" | "volumen" | "temperatura" | "velocidad" | "area" | "tiempo" | "datos";
type Unit = { id: string; label: string; symbol: string; factor?: number };

const categories: { id: Category; icon: string; title: string; description: string }[] = [
  { id: "longitud", icon: "📏", title: "Longitud", description: "Metros, kilómetros, millas, pies y más." },
  { id: "peso", icon: "⚖️", title: "Peso", description: "Kilogramos, gramos, libras y onzas." },
  { id: "volumen", icon: "🧪", title: "Volumen", description: "Litros, mililitros, galones y más." },
  { id: "temperatura", icon: "🌡️", title: "Temperatura", description: "Celsius, Fahrenheit y Kelvin." },
  { id: "velocidad", icon: "🚗", title: "Velocidad", description: "km/h, mph, m/s y nudos." },
  { id: "area", icon: "📐", title: "Área", description: "m², km², hectáreas y pies²." },
  { id: "tiempo", icon: "⏱️", title: "Tiempo", description: "Segundos, minutos, horas y días." },
  { id: "datos", icon: "💾", title: "Datos", description: "Bytes, KB, MB, GB y TB." },
];

const units: Record<Category, Unit[]> = {
  longitud: [
    { id: "m", label: "Metros", symbol: "m", factor: 1 }, { id: "km", label: "Kilómetros", symbol: "km", factor: 1000 }, { id: "cm", label: "Centímetros", symbol: "cm", factor: 0.01 }, { id: "mm", label: "Milímetros", symbol: "mm", factor: 0.001 }, { id: "mi", label: "Millas", symbol: "mi", factor: 1609.344 }, { id: "ft", label: "Pies", symbol: "ft", factor: 0.3048 }, { id: "in", label: "Pulgadas", symbol: "in", factor: 0.0254 },
  ],
  peso: [
    { id: "kg", label: "Kilogramos", symbol: "kg", factor: 1 }, { id: "g", label: "Gramos", symbol: "g", factor: 0.001 }, { id: "lb", label: "Libras", symbol: "lb", factor: 0.45359237 }, { id: "oz", label: "Onzas", symbol: "oz", factor: 0.028349523125 }, { id: "t", label: "Toneladas", symbol: "t", factor: 1000 },
  ],
  volumen: [
    { id: "l", label: "Litros", symbol: "L", factor: 1 }, { id: "ml", label: "Mililitros", symbol: "mL", factor: 0.001 }, { id: "gal_us", label: "Galones (EE. UU.)", symbol: "gal", factor: 3.785411784 }, { id: "qt", label: "Cuartos (EE. UU.)", symbol: "qt", factor: 0.946352946 }, { id: "cup", label: "Tazas (EE. UU.)", symbol: "cup", factor: 0.2365882365 },
  ],
  temperatura: [
    { id: "c", label: "Celsius", symbol: "°C" }, { id: "f", label: "Fahrenheit", symbol: "°F" }, { id: "k", label: "Kelvin", symbol: "K" },
  ],
  velocidad: [
    { id: "kmh", label: "Kilómetros por hora", symbol: "km/h", factor: 1 }, { id: "mph", label: "Millas por hora", symbol: "mph", factor: 1.609344 }, { id: "ms", label: "Metros por segundo", symbol: "m/s", factor: 3.6 }, { id: "kn", label: "Nudos", symbol: "kn", factor: 1.852 },
  ],
  area: [
    { id: "m2", label: "Metros cuadrados", symbol: "m²", factor: 1 }, { id: "km2", label: "Kilómetros cuadrados", symbol: "km²", factor: 1_000_000 }, { id: "ha", label: "Hectáreas", symbol: "ha", factor: 10_000 }, { id: "ft2", label: "Pies cuadrados", symbol: "ft²", factor: 0.09290304 }, { id: "acre", label: "Acres", symbol: "acre", factor: 4046.8564224 },
  ],
  tiempo: [
    { id: "s", label: "Segundos", symbol: "s", factor: 1 }, { id: "min", label: "Minutos", symbol: "min", factor: 60 }, { id: "h", label: "Horas", symbol: "h", factor: 3600 }, { id: "day", label: "Días", symbol: "d", factor: 86400 }, { id: "week", label: "Semanas", symbol: "sem", factor: 604800 },
  ],
  datos: [
    { id: "b", label: "Bytes", symbol: "B", factor: 1 }, { id: "kb", label: "Kilobytes", symbol: "KB", factor: 1024 }, { id: "mb", label: "Megabytes", symbol: "MB", factor: 1024 ** 2 }, { id: "gb", label: "Gigabytes", symbol: "GB", factor: 1024 ** 3 }, { id: "tb", label: "Terabytes", symbol: "TB", factor: 1024 ** 4 },
  ],
};

const format = (value: number) => new Intl.NumberFormat("es-EC", { maximumFractionDigits: 8 }).format(Number.isFinite(value) ? value : 0);

function temperature(value: number, from: string, to: string) {
  const c = from === "c" ? value : from === "f" ? (value - 32) * 5 / 9 : value - 273.15;
  if (to === "c") return c;
  if (to === "f") return c * 9 / 5 + 32;
  return c + 273.15;
}

export default function ConversoresPage() {
  const [category, setCategory] = useState<Category>("longitud");
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("km");
  const converterRef = useRef<HTMLElement>(null);

  const currentUnits = units[category];
  const result = useMemo(() => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return 0;
    if (category === "temperatura") return temperature(amount, from, to);
    const source = currentUnits.find((unit) => unit.id === from)?.factor ?? 1;
    const target = currentUnits.find((unit) => unit.id === to)?.factor ?? 1;
    return (amount * source) / target;
  }, [category, currentUnits, from, to, value]);

  const changeCategory = (next: Category) => {
    const nextUnits = units[next];
    setCategory(next);
    setFrom(nextUnits[0].id);
    setTo(nextUnits[1]?.id ?? nextUnits[0].id);
    requestAnimationFrame(() => {
      converterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const fromUnit = currentUnits.find((unit) => unit.id === from);
  const toUnit = currentUnits.find((unit) => unit.id === to);

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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--wine)]">CalculaEC · Conversores</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">Convierte cualquier valor<br /><span className="text-[var(--wine)]">sin complicarte.</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">Un solo lugar para convertir unidades comunes. Cambia el valor o las unidades y el resultado se actualiza al instante.</p>
          </div>
        </section>

        <section className="pb-20">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((item) => (
              <button key={item.id} type="button" onClick={() => changeCategory(item.id)} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${category === item.id ? "border-[var(--wine)]/25 bg-[var(--wine)] text-white shadow-md" : "border-[var(--border)] bg-white"}`}>
                <span className="text-2xl">{item.icon}</span><p className="mt-3 font-semibold">{item.title}</p><p className={`mt-1 text-xs leading-5 ${category === item.id ? "text-white/70" : "text-[var(--muted)]"}`}>{item.description}</p>
              </button>
            ))}
          </div>

          <section ref={converterRef} className="mt-5 scroll-mt-5 rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-[0_18px_60px_rgba(37,35,33,0.06)] sm:p-8" aria-label="Conversor">
            <div className="border-b border-[var(--border)] pb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--wine)]">Conversor activo</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{categories.find((item) => item.id === category)?.icon} {categories.find((item) => item.id === category)?.title}</h2>
            </div>

            <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
              <label className="block"><span className="text-sm font-semibold">Tengo</span><input type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-4 text-2xl outline-none focus:border-[var(--wine)] focus:ring-4 focus:ring-[var(--wine)]/8" /><select value={from} onChange={(e) => setFrom(e.target.value)} className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3.5 text-sm outline-none focus:border-[var(--wine)]">{currentUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.label} ({unit.symbol})</option>)}</select></label>
              <button type="button" onClick={() => { setFrom(to); setTo(from); }} className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] text-lg transition hover:border-[var(--wine)] hover:text-[var(--wine)]" aria-label="Intercambiar unidades">⇄</button>
              <div><span className="text-sm font-semibold">Resultado</span><div className="mt-2 rounded-2xl bg-[var(--wine)] p-4 text-white"><p className="text-3xl font-semibold tracking-tight">{format(result)} {toUnit?.symbol}</p><p className="mt-1 text-xs text-white/70">{fromUnit?.label} → {toUnit?.label}</p></div><select value={to} onChange={(e) => setTo(e.target.value)} className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3.5 text-sm outline-none focus:border-[var(--wine)]">{currentUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.label} ({unit.symbol})</option>)}</select></div>
            </div>

            <div className="mt-8 rounded-2xl bg-[var(--background)] p-5 text-sm text-[var(--muted)]"><strong className="text-[var(--foreground)]">Conversión instantánea:</strong> no necesitas presionar un botón. Escribe el valor y cambia las unidades para ver el resultado inmediatamente.</div>
          </section>
        </section>
      </div>
    </main>
  );
}
