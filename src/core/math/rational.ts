export interface Rational {
  readonly n: number
  readonly d: number
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const t = x % y
    x = y
    y = t
  }
  return x
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b)
}

/** Normalised fraction: positive denominator, lowest terms. */
export function rat(n: number, d = 1): Rational {
  if (!Number.isInteger(n) || !Number.isInteger(d)) throw new Error(`rat: non-integer ${n}/${d}`)
  if (d === 0) throw new Error('rat: zero denominator')
  const g = gcd(n, d) || 1
  const sign = d < 0 ? -1 : 1
  return { n: (sign * n) / g + 0, d: (sign * d) / g }
}

export const add = (a: Rational, b: Rational): Rational => rat(a.n * b.d + b.n * a.d, a.d * b.d)
export const sub = (a: Rational, b: Rational): Rational => rat(a.n * b.d - b.n * a.d, a.d * b.d)
export const mul = (a: Rational, b: Rational): Rational => rat(a.n * b.n, a.d * b.d)
export const neg = (a: Rational): Rational => rat(-a.n, a.d)
export const isInteger = (a: Rational): boolean => a.d === 1
export const toNumber = (a: Rational): number => a.n / a.d
export const equals = (a: Rational, b: Rational): boolean => a.n === b.n && a.d === b.d

export function div(a: Rational, b: Rational): Rational {
  if (b.n === 0) throw new Error('div: division by zero')
  return rat(a.n * b.d, a.d * b.n)
}

export function ratToLatex(a: Rational): string {
  if (a.d === 1) return String(a.n)
  return a.n < 0 ? `-\\frac{${-a.n}}{${a.d}}` : `\\frac{${a.n}}{${a.d}}`
}
