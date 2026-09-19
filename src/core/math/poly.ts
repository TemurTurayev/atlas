import { coefPrefix, joinTerms } from './latex'

/** Polynomial as ascending coefficients: [c0, c1, c2, …] = c0 + c1·x + c2·x². */
export type Poly = readonly number[]

export function trim(p: Poly): Poly {
  let end = p.length
  while (end > 1 && p[end - 1] === 0) end -= 1
  return p.length === 0 ? [0] : p.slice(0, end)
}

export const degree = (p: Poly): number => trim(p).length - 1

export function polyAdd(a: Poly, b: Poly): Poly {
  return Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] ?? 0) + (b[i] ?? 0))
}

export function polyMul(a: Poly, b: Poly): Poly {
  const out = new Array<number>(a.length + b.length - 1).fill(0)
  a.forEach((x, i) => b.forEach((y, j) => (out[i + j] += x * y)))
  return out
}

export const polyScale = (p: Poly, k: number): Poly => p.map((c) => c * k)

/** leading · Π (x − r). */
export function polyFromRoots(leading: number, roots: readonly number[]): Poly {
  return roots.reduce<Poly>((acc, r) => polyMul(acc, [-r, 1]), [leading])
}

export function polyEval(p: Poly, x: number): number {
  return p.reduceRight((acc, c) => acc * x + c, 0)
}

/** Descending LaTeX, e.g. [6, -5, 1] → "x^{2}-5x+6". */
export function polyToLatex(p: Poly, v = 'x'): string {
  const c = trim(p)
  const terms: string[] = []
  for (let k = c.length - 1; k >= 0; k -= 1) {
    const a = c[k]
    if (a === 0) continue
    if (k === 0) terms.push(String(a))
    else terms.push(`${coefPrefix(a)}${k === 1 ? v : `${v}^{${k}}`}`)
  }
  return joinTerms(terms)
}
