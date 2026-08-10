import type { ReactNode } from "react";

interface InfoCardProps {
  icon: ReactNode;
  label: string;
  title: string;
  value?: string;
  description?: string;
  href?: string;
}

export default function InfoCard({
  icon,
  label,
  title,
  value,
  description,
  href,
}: InfoCardProps) {
  const content = (
    <>
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cream)] text-lg text-[var(--wine)]"
          aria-hidden="true"
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            {label}
          </p>
          <h3 className="mt-1 text-sm font-semibold tracking-tight text-[var(--foreground)]">
            {title}
          </h3>
        </div>
      </div>

      {value && (
        <p className="mt-5 text-2xl font-semibold tracking-tight text-[var(--wine)]">
          {value}
        </p>
      )}

      {description && (
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
          {description}
        </p>
      )}
    </>
  );

  const className =
    "group block rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none";

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return <article className={className}>{content}</article>;
}
