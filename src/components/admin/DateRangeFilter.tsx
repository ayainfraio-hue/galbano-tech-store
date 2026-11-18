import { CalendarDays } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DATE_PRESETS, formatRange, getDateRange, type DateFilter, type DatePreset } from "@/lib/date-range";
import { cn } from "@/lib/utils";

/** Seletor de período do painel: Hoje, 7 dias, 30 dias ou datas personalizadas. */
export function DateRangeFilter({
  value,
  onChange,
  className,
}: {
  value: DateFilter;
  onChange: (next: DateFilter) => void;
  className?: string;
}) {
  const range = getDateRange(value);

  function setPreset(preset: DatePreset) {
    // Ao abrir o Personalizado, começa com as datas do período que estava selecionado.
    if (preset === "custom") onChange({ preset, from: range.fromDay, to: range.toDay });
    else onChange({ ...value, preset });
  }

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", className)}>
      <Select value={value.preset} onValueChange={(v) => setPreset(v as DatePreset)}>
        <SelectTrigger className="justify-start gap-2 bg-white sm:w-48 [&>svg:last-child]:ml-auto" aria-label="Período">
          <CalendarDays className="h-4 w-4 shrink-0 text-gold" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATE_PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value.preset === "custom" ? (
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
            De
            <Input
              type="date"
              value={value.from}
              max={value.to || undefined}
              onChange={(e) => onChange({ ...value, from: e.target.value })}
              className="bg-white text-foreground sm:w-40"
              aria-label="Data inicial"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
            Até
            <Input
              type="date"
              value={value.to}
              min={value.from || undefined}
              onChange={(e) => onChange({ ...value, to: e.target.value })}
              className="bg-white text-foreground sm:w-40"
              aria-label="Data final"
            />
          </label>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground sm:px-1">{formatRange(range)}</span>
      )}
    </div>
  );
}
