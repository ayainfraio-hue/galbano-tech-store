import type { ReactNode } from "react";

function renderInline(value: string): ReactNode[] {
  return value.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
      : <span key={index}>{part}</span>,
  );
}

/** Renderiza apenas Markdown básico, sem interpretar HTML fornecido no cadastro. */
export function ProductDescription({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        const lines = block.split("\n");
        const isList = lines.every((line) => /^\s*[-*]\s+/.test(line));
        if (isList) {
          return <ul key={index} className="list-disc space-y-1 pl-5">{lines.map((line, i) => <li key={i}>{renderInline(line.replace(/^\s*[-*]\s+/, ""))}</li>)}</ul>;
        }
        return <p key={index}>{lines.map((line, i) => <span key={i}>{i > 0 && <br />}{renderInline(line)}</span>)}</p>;
      })}
    </div>
  );
}
