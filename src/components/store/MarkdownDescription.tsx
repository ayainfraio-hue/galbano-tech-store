import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const token = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\x60[^\x60]+\x60)/g;
  return text.split(token).filter(Boolean).map((part, index) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="rounded bg-muted px-1.5 py-0.5 text-[0.9em] text-foreground">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

/** Renderiza Markdown básico com React, sem injetar HTML vindo do cadastro. */
export function MarkdownDescription({ content }: { content: string }) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(<p key={blocks.length} className="mb-4 last:mb-0">{inline(paragraph.join(" "))}</p>);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={blocks.length} className="mb-4 list-disc space-y-1 pl-6 last:mb-0">
          {list.map((item, index) => <li key={index}>{inline(item)}</li>)}
        </ul>,
      );
      list = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    const bullet = trimmed.match(/^(?:[-*+] |• )(.*)$/);
    const numbered = trimmed.match(/^\d+[.)] (.*)$/);
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (!trimmed) {
      flushParagraph();
      flushList();
    } else if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const className = level === 1 ? "mb-3 mt-5 text-xl font-bold text-foreground first:mt-0" : "mb-2 mt-4 text-lg font-semibold text-foreground";
      blocks.push(level === 1
        ? <h2 key={blocks.length} className={className}>{inline(heading[2])}</h2>
        : <h3 key={blocks.length} className={className}>{inline(heading[2])}</h3>);
    } else if (bullet || numbered) {
      flushParagraph();
      list.push((bullet ?? numbered)![1]);
    } else {
      flushList();
      paragraph.push(trimmed);
    }
  });
  flushParagraph();
  flushList();

  return <div className="max-w-none">{blocks}</div>;
}
