/**
 * Períodos usados nos filtros do painel. Tudo é calculado no fuso local do
 * navegador: o início é 00:00 do primeiro dia e o fim é exclusivo (00:00 do
 * dia seguinte ao último), então o dia final entra inteiro no filtro.
 */
export const DATE_PRESETS = [
  { value: "hoje", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "custom", label: "Personalizado" },
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number]["value"];

export type DateFilter = {
  preset: DatePreset;
  /** Datas do período personalizado no formato do campo de data (AAAA-MM-DD). */
  from: string;
  to: string;
};

export type DateRange = {
  /** Início inclusivo (00:00 local do primeiro dia). */
  start: Date;
  /** Fim exclusivo (00:00 local do dia seguinte ao último dia). */
  end: Date;
  /** Primeiro e último dia exibidos ao usuário (AAAA-MM-DD). */
  fromDay: string;
  toDay: string;
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

/** Data local no formato AAAA-MM-DD (o mesmo do campo de data). */
export function toInputDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Lê AAAA-MM-DD como meia-noite local (nunca como UTC). */
export function parseInputDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) || d.getMonth() !== Number(m[2]) - 1 ? null : d;
}

export function defaultDateFilter(now = new Date()): DateFilter {
  const today = toInputDate(now);
  return { preset: "hoje", from: today, to: today };
}

export function getDateRange(filter: DateFilter, now = new Date()): DateRange {
  const today = startOfDay(now);
  let first = today;
  let last = today;

  if (filter.preset === "7d") first = addDays(today, -6);
  else if (filter.preset === "30d") first = addDays(today, -29);
  else if (filter.preset === "custom") {
    const from = parseInputDate(filter.from);
    const to = parseInputDate(filter.to);
    first = from ?? to ?? today;
    last = to ?? from ?? today;
    if (first > last) [first, last] = [last, first];
  }

  return { start: first, end: addDays(last, 1), fromDay: toInputDate(first), toDay: toInputDate(last) };
}

export function isInRange(value: string | Date, range: DateRange) {
  const t = new Date(value).getTime();
  return t >= range.start.getTime() && t < range.end.getTime();
}

/** Texto curto do período, ex.: "18/11/2026" ou "12/11/2026 a 18/11/2026". */
export function formatRange(range: DateRange) {
  const fmt = (day: string) => parseInputDate(day)!.toLocaleDateString("pt-BR");
  return range.fromDay === range.toDay ? fmt(range.fromDay) : `${fmt(range.fromDay)} a ${fmt(range.toDay)}`;
}
