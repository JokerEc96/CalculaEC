import ToolCard from "./ToolCard";

const tools = [
  {
    icon: "⛽",
    category: "Combustible",
    title: "Viaje por kilómetros",
    description: "Calcula combustible y dinero para un recorrido.",
    href: "/herramientas/viaje",
    featured: true,
  },
  {
    icon: "💼",
    category: "Trabajo",
    title: "Calculadora laboral",
    description: "Décimos, vacaciones, utilidades y liquidaciones.",
    href: "/herramientas/laboral",
    featured: false,
  },
  {
    icon: "💰",
    category: "Finanzas",
    title: "Préstamos y créditos",
    description: "Calcula cuotas aproximadas para préstamos, motos y vehículos.",
    href: "/herramientas/finanzas",
    featured: false,
  },
  {
    icon: "🔄",
    category: "Conversores",
    title: "Conversores",
    description: "Convierte monedas, unidades y otros valores.",
    href: "/herramientas/conversores",
    featured: false,
  },
];

export default function ToolsSection() {
  return (
    <section aria-labelledby="tools-heading" className="mt-20 sm:mt-24">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-[var(--wine)]">CalculaEC</p>
        <h2
          id="tools-heading"
          className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Herramientas para tu día a día
        </h2>
        <p className="mt-3 text-base text-[var(--muted)]">
          Calcula, consulta y decide más rápido.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {tools.map((tool) => (
          <ToolCard key={tool.title} {...tool} />
        ))}
      </div>
    </section>
  );
}
