import type { Vec } from './vector'

/** A rectangular grid of anything — numbers in a matrix, LaTeX in an answer. */
export type Grid<T> = readonly (readonly T[])[]

/** A matrix as rows of numbers; every row has the same length. */
export type Mat = Grid<number>

export const rows = <T>(a: Grid<T>): number => a.length
export const cols = <T>(a: Grid<T>): number => (a.length === 0 ? 0 : a[0].length)

export const mapMat = (a: Mat, f: (x: number, i: number, j: number) => number): number[][] =>
  a.map((row, i) => row.map((x, j) => f(x, i, j)))

export const addMat = (a: Mat, b: Mat): number[][] => mapMat(a, (x, i, j) => x + b[i][j])
export const subMat = (a: Mat, b: Mat): number[][] => mapMat(a, (x, i, j) => x - b[i][j])
export const scaleMat = (k: number, a: Mat): number[][] => mapMat(a, (x) => k * x)

export const transpose = (a: Mat): number[][] =>
  Array.from({ length: cols(a) }, (_, j) => Array.from({ length: rows(a) }, (_, i) => a[i][j]))

export function multiply(a: Mat, b: Mat): number[][] {
  return Array.from({ length: rows(a) }, (_, i) =>
    Array.from({ length: cols(b) }, (_, j) => a[i].reduce((sum, x, k) => sum + x * b[k][j], 0)),
  )
}

/** Matrix times column vector. */
export const apply = (a: Mat, v: Vec): number[] => a.map((row) => row.reduce((sum, x, j) => sum + x * v[j], 0))

export const det2 = (a: Mat): number => a[0][0] * a[1][1] - a[0][1] * a[1][0]

export function det3(a: Mat): number {
  const [[p, q, r], [s, t, u], [v, w, x]] = a as readonly [readonly number[], readonly number[], readonly number[]]
  return p * (t * x - u * w) - q * (s * x - u * v) + r * (s * w - t * v)
}

/** The adjugate of a 2×2 matrix: its inverse is this divided by the determinant. */
export const adjugate2 = (a: Mat): number[][] => [
  [a[1][1], -a[0][1]],
  [-a[1][0], a[0][0]],
]

export const identity = (n: number): number[][] =>
  Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)))

export const isSquare = (a: Mat): boolean => rows(a) === cols(a)

/** \begin{pmatrix} a & b \\ c & d \end{pmatrix} */
export const matLatex = (a: readonly (readonly (number | string)[])[]): string =>
  `\\begin{pmatrix} ${a.map((row) => row.join(' & ')).join(' \\\\ ')} \\end{pmatrix}`

/** The same grid with a vertical bar before the last column, for an augmented system. */
export const augmentedLatex = (a: readonly (readonly (number | string)[])[]): string => {
  const width = a.length === 0 ? 0 : a[0].length
  const spec = `${'c'.repeat(Math.max(0, width - 1))}|c`
  return `\\left(\\begin{array}{${spec}} ${a.map((row) => row.join(' & ')).join(' \\\\ ')} \\end{array}\\right)`
}
