// Frontend/tenora-front/src/components/ui/HighlightedText.tsx
//
// Met en valeur tout texte entre guillemets droits "..." ou typographiques "..." / «...»
// dans un bloc de texte. Conserve les retours a la ligne.
//
// Usage :
//   <HighlightedText text={product.description} className="text-muted-foreground mt-2" />

import { Fragment } from "react";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  /** Classes appliquees au <p> englobant. */
  className?: string;
  /** Classes appliquees aux portions surlignees. */
  highlightClassName?: string;
}

// Capture aussi bien "..." que "..." (et «...»). Le groupe = contenu sans guillemets.
const QUOTE_REGEX = /(?:"([^"]+)"|\u201C([^\u201D]+)\u201D|\u00AB\s*([^\u00BB]+?)\s*\u00BB)/g;

export function HighlightedText({
  text,
  className,
  highlightClassName,
}: Props) {
  const parts: Array<{ type: "text" | "hl"; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  QUOTE_REGEX.lastIndex = 0;
  while ((match = QUOTE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    const inner = match[1] ?? match[2] ?? match[3] ?? "";
    parts.push({ type: "hl", value: inner });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return (
    <p className={cn("whitespace-pre-line", className)}>
      {parts.map((p, i) =>
        p.type === "hl" ? (
          <mark
            key={i}
            className={cn(
              // Style "brutalist" coherent avec la boutique :
              // fond accent, bord net, gras, pas d'italique navigateur.
              "inline-block px-1.5 py-0.5 mx-0.5 font-bold text-primary bg-primary/10 border-b-2 border-primary not-italic",
              highlightClassName,
            )}
          >
            {p.value}
          </mark>
        ) : (
          <Fragment key={i}>{p.value}</Fragment>
        ),
      )}
    </p>
  );
}
