/** Contents of every $…$ segment in a text. */
export function mathSegments(text: string): string[] {
  return [...text.matchAll(/\$([^$]+)\$/g)].map((m) => m[1])
}

/**
 * Prose that is left once every $…$ segment is removed. LaTeX out here is a bug: the app renders
 * `statement`, `hints` and a step's `text` as text, so a stray command shows up as backslashes.
 */
export function strayLatex(text: string): string[] {
  const prose = text.replace(/\$[^$]+\$/g, ' ')
  // Commands (\sqrt), escaped symbols (\%, \,) and sub- or superscripts all print literally out here.
  return [...prose.matchAll(/\\[a-zA-Z]+|\\[^a-zA-Z\s]|[_^]\{/g)].map((m) => m[0])
}
