import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex h-11 items-center rounded-full border border-border bg-secondary", className)}>
      <button
        type="button"
        aria-label="Diminuir quantidade"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid h-11 w-11 place-items-center text-muted-foreground transition hover:text-gold disabled:opacity-40"
        disabled={value <= min}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        onClick={() => onChange(Math.min(99, value + 1))}
        className="grid h-11 w-11 place-items-center text-muted-foreground transition hover:text-gold"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
