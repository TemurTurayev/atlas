/** Plain numeric vectors for the problem generators. */
export type Vec = readonly number[]

export const add = (a: Vec, b: Vec): number[] => a.map((x, i) => x + b[i])
export const sub = (a: Vec, b: Vec): number[] => a.map((x, i) => x - b[i])
export const scale = (k: number, a: Vec): number[] => a.map((x) => k * x)
export const dot = (a: Vec, b: Vec): number => a.reduce((sum, x, i) => sum + x * b[i], 0)

export function cross(a: Vec, b: Vec): [number, number, number] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

export const normSquared = (a: Vec): number => dot(a, a)
export const norm = (a: Vec): number => Math.sqrt(normSquared(a))
export const isZero = (a: Vec): boolean => a.every((x) => x === 0)

/** True when one vector is a scalar multiple of the other (either may be zero). */
export function parallel(a: Vec, b: Vec): boolean {
  if (isZero(a) || isZero(b)) return true
  const k = a.findIndex((x) => x !== 0)
  const factor = b[k] / a[k]
  return a.every((x, i) => Math.abs(x * factor - b[i]) <= 1e-9 * Math.max(1, Math.abs(b[i])))
}

/** A column vector: \begin{pmatrix} 1 \\ 2 \end{pmatrix}. */
export const vecLatex = (components: readonly (number | string)[]): string =>
  `\\begin{pmatrix} ${components.join(' \\\\ ')} \\end{pmatrix}`

/** The inline form used inside sentences: (1, 2, 3). */
export const tupleLatex = (components: readonly (number | string)[]): string => `\\left(${components.join(', ')}\\right)`
