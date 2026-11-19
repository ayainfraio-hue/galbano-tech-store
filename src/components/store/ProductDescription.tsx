import { Fragment, createElement, type ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\x60[^\x60]+\x60)/g;
  return text.split(pattern).filter(Boolean).map((part, index) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) return createElement("strong", { key: index }, part.slice(2, -2));
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) return createElement("em", { key: index }, part.slice(1, -1));
    if (part.startsWith("\x60") && part.endsWith("\x60")) return createElement("code", { key: index, className: "rounded bg-secondary px-1.5 py-0.5 text-[0.9em] text-foreground" }, part.slice(1, -1));
    return createElement(Fragment, { key: index }, part);
  });
}

export function ProductDescription({ content }: { content: string }) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [], list: string[] = [];
  let ordered = false;
  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(createElement("p", { key: \`p-\${blocks.length}\`, className: "mb-4 last:mb-0" }, paragraph.flatMap((line, i) => i ? [createElement("br", { key: \`br-\${i}\` }), ...inline(line)] : inline(line))));
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    const Tag = ordered ? "ol" : "ul";
    blocks.push(createElement(Tag, { key: \`list-\${blocks.length}\`, className: \`mb-4 space-y-1 pl-6 marker:text-gold \${ordered ? "list-decimal" : "list-disc"}\` }, list.map((item, i) => createElement("li", { key: i }, inline(item)))));
    list = [];
  };
  lines.forEach((line) => {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const unordered = /^\s*[-*+]\s+(.+)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    if (!line.trim()) { flushParagraph(); flushList(); return; }
    if (heading) {
      flushParagraph(); flushList();
      const Tag = (\`h\${heading[1].length + 1}\`) as "h2" | "h3" | "h4";
      blocks.push(createElement(Tag, { key: \`h-\${blocks.length}\`, className: "mb-3 mt-5 font-semibold text-foreground first:mt-0" }, inline(heading[2])));
    } else if (unordered || numbered) {
      flushParagraph();
      const isOrdered = Boolean(numbered);
      if (list.length && ordered !== isOrdered) flushList();
      ordered = isOrdered;
      list.push((unordered ?? numbered)![1]);
    } else { flushList(); paragraph.push(line); }
  });
  flushParagraph(); flushList();
  return <div className="max-w-3xl leading-relaxed text-muted-foreground">{blocks}</div>;
}
