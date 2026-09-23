/** Normalises MathLive LaTeX so it can be split and parsed reliably. */
export function normalizeLatex(latex: string): string {
  return latex
    .replace(/\\left(?![a-zA-Z])|\\right(?![a-zA-Z])/g, '')
    .replace(/\\lbrace/g, '\\{')
    .replace(/\\rbrace/g, '\\}')
    .replace(/\\lbrack/g, '[')
    .replace(/\\rbrack/g, ']')
    .replace(/\\placeholder\{[^}]*\}/g, '')
    // A degree sign is a unit, not an operation: an answer asked for in degrees may carry it.
    .replace(/\^\{?\\circ\}?|°/g, '')
    .replace(/\\[,;:!]|\\ |~/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
