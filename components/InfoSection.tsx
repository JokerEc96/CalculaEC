import InfoCard from "./InfoCard";

const information = [
  {
    icon: "⛽",
    label: "Combustibles",
    title: "Precio actual de gasolinas en Ecuador",
    description: "Consulta los precios vigentes de Ecopaís, Súper y Diésel.",
    href: "/indicadores/combustibles",
  },
  {
    icon: "💼",
    label: "Economía",
    title: "Sueldo básico e IVA del Ecuador",
    description: "Consulta los principales valores económicos actuales.",
    href: "/indicadores/economia",
  },
];

export default function InfoSection() {
  return (
    <section aria-labelledby="information-heading" className="mt-16 sm:mt-20">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-[var(--wine)]">Información</p>
        <h2
          id="information-heading"
          className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Información actual
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)] sm:text-base">
          Datos rápidos para consultar de un vistazo.
        </p>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {information.map((item) => (
          <InfoCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}
