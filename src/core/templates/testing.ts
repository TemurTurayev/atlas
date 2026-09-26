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

/**
 * Two signs in a row inside a formula — "12 - -36", "x + -3", "0.2\cdot -11". The value may be right, but it is not
 * how anyone writes: a formula simplifies the signs (x + 3), a substitution puts the negative number in brackets.
 */
export function signSlips(tex: string): string[] {
  return [...tex.matchAll(/[+-]\s*[+-]|\\(?:cdot|times)\s*-/g)].map((m) => m[0])
}

/** "\\frac{11}{9} = \\frac{11}{9}": the same value written twice in a row adds nothing to a worked step. */
export function repeatedValues(tex: string): string[] {
  const parts = tex.split(/(?<![<>!\\])=(?!=)/).map((part) => part.trim())
  // A row of a system reducing to "0 = 0" is a statement, not a repetition.
  if (parts.length === 2 && parts[0] === '0' && parts[1] === '0') return []
  return parts.filter((part, i) => i > 0 && part !== '' && part === parts[i - 1])
}
