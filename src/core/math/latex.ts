/** Coefficient prefix for a term: 1 → "", -1 → "-", 3 → "3". */
export function coefPrefix(c: number): string {
  if (c === 1) return ''
  if (c === -1) return '-'
  return String(c)
}

/** Joins signed terms: ["3x^{2}", "-5x", "6"] → "3x^{2}-5x+6". Drops "" and "0"; empty → "0". */
export function joinTerms(terms: readonly string[]): string {
  const parts = terms.filter((t) => t !== '' && t !== '0')
  if (parts.length === 0) return '0'
  return parts.map((t, i) => (i === 0 || t.startsWith('-') ? t : `+${t}`)).join('')
}

/** a·v + b, e.g. linear(3, -7) → "3x-7". */
export function linear(a: number, b: number, v = 'x'): string {
  return joinTerms([a === 0 ? '' : `${coefPrefix(a)}${v}`, String(b)])
}

/** Wraps negative numbers/LaTeX in \left( \right): -3 → "\left(-3\right)". */
export function paren(value: number | string): string {
  const text = String(value)
  return text.startsWith('-') ? `\\left(${text}\\right)` : text
}

/** "\{1, 2, 3\}" or "\emptyset". */
export function setLatex(elements: readonly (string | number)[]): string {
  return elements.length === 0 ? '\\emptyset' : `\\{${elements.join(', ')}\\}`
}
