import type { ReactNode } from "react";

interface ToolCardProps {
  icon: ReactNode;
  category: string;
  title: string;
  description: string;
  href?: string;
  featured?: boolean;
}

export default function ToolCard({
  icon,
  category,
  title,
  description,
  href,
  featured = false,
}: ToolCardProps) {
  const content = (
    <>
      <div
        className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cream)] text-xl ${
          featured ? "ring-1 ring-[var(--wine)]/10" : ""
        }`}
        aria-hidden="true"
      >
        {icon}
      </div>

      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        {category}
      </p>

      <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--foreground)]">
        {title}
      </h2>

      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>

      <span className="mt-6 inline-flex text-sm font-semibold text-[var(--wine)]">
        Abrir herramienta →
      </span>
    </>
  );

  const className = `group block rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm transition duration-200 ease-out hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none ${
    featured ? "md:p-7 md:shadow-md" : ""
  }`;

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return <article className={className}>{content}</article>;
}
