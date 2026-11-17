import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionTitle({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow?: string | undefined;
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col items-center gap-2 text-center", className)}>
      {eyebrow && <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{eyebrow}</span>}
      <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      <span className="gold-divider mt-1 w-24" />
      {action}
    </div>
  );
}
