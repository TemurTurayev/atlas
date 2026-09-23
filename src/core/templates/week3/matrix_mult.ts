import { paren } from '../../math/latex'
import { apply, matLatex, multiply, transpose, type Mat } from '../../math/matrix'
import { vecLatex, type Vec } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'The product $AB$ is defined only when the number of columns of $A$ matches the number of rows of $B$: $A\\in\\mathbb{R}^{m\\times n}$ times $B\\in\\mathbb{R}^{n\\times p}$ gives $AB\\in\\mathbb{R}^{m\\times p}$.',
  'Entry $(AB)_{ij}$ is the dot product of row $i$ of $A$ with column $j$ of $B$: $(AB)_{ij}=\\sum_k a_{ik}b_{kj}$.',
  'A matrix times a column vector works the same way: each entry of $A\\vec v$ is a row of $A$ dotted with $\\vec v$.',
  'Matrix multiplication is not commutative: in general $AB\\neq BA$, even when both products exist and have the same size.',
  'Common mistakes: multiplying matching entries like addition instead of row-by-column; computing $BA$ when $AB$ was asked for (or the reverse); assuming $AB=BA$.',
].join('\n')

const HINTS_MULT = [
  'Entry $(AB)_{ij}$ comes from row $i$ of $A$ and column $j$ of $B$: multiply matching entries, then add.',
  'Work one entry at a time: $(AB)_{11}$ uses row 1 of $A$ with column 1 of $B$, $(AB)_{12}$ uses row 1 of $A$ with column 2 of $B$, and so on.',
]
const HINTS_ORDER = [
  'Matrix multiplication is not commutative — read carefully which order the question asks for.',
  'Compute the product entry by entry in the order asked; do not reuse a product computed for the other order.',
]
const INPUT_HINT_MATRIX = 'One number per entry, left to right, top to bottom'
const INPUT_HINT_VECTOR = 'One number per component, top to bottom'

const asGrid = (m: Mat): string[][] => m.map((row) => row.map(String))
const asVec = (v: Vec): string[] => v.map(String)

const randomNonzeroMat = (rng: Rng, r: number, c: number, lo = -6, hi = 6): number[][] =>
  Array.from({ length: r }, () => Array.from({ length: c }, () => rng.intExcept(lo, hi, [0])))

/** Row of $A$ dotted with a column, written out with signs: "(2)\\cdot(-3) + (1)\\cdot(4)". */
const entryExpr = (row: readonly number[], col: readonly number[]): string =>
  row.map((x, k) => `${paren(x)}\\cdot${paren(col[k])}`).join(' + ')

/** Grid of full row-times-column expressions for every entry of $AB$. */
const productExprGrid = (a: Mat, b: Mat): string => {
  const bCols = transpose(b)
  return matLatex(a.map((row) => bCols.map((col) => entryExpr(row, col))))
}

/** A 2×2 pair whose product is not the zero matrix. */
export function buildMultPair(rng: Rng): { readonly a: Mat; readonly b: Mat } {
  let a: number[][] = []
  let b: number[][] = []
  for (let i = 0; i < 200; i += 1) {
    a = randomNonzeroMat(rng, 2, 2)
    b = randomNonzeroMat(rng, 2, 2)
    if (multiply(a, b).some((row) => row.some((x) => x !== 0))) break
  }
  return { a, b }
}

function tier1(rng: Rng): Problem {
  const { a, b } = buildMultPair(rng)
  const value = multiply(a, b)
  const solution: SolutionStep[] = [
    { text: 'Multiply row by column for every entry of the product:', tex: productExprGrid(a, b) },
    { text: 'That gives', tex: matLatex(asGrid(value)) },
  ]
  return {
    statement: `Given $A = ${matLatex(a)}$ and $B = ${matLatex(b)}$, compute $AB$.`,
    answer: { kind: 'matrix', rows: asGrid(value) },
    solution,
    hints: HINTS_MULT,
    inputHint: INPUT_HINT_MATRIX,
  }
}

/** A matrix ($2\times3$ or $3\times3$) times a 3-component vector, with a nonzero result. */
export function buildMatVec(rng: Rng): { readonly a: Mat; readonly v: Vec } {
  const r = rng.pick([2, 3])
  const c = 3
  let a: number[][] = []
  let v: number[] = []
  for (let i = 0; i < 200; i += 1) {
    a = randomNonzeroMat(rng, r, c)
    v = Array.from({ length: c }, () => rng.intExcept(-6, 6, [0]))
    if (apply(a, v).some((x) => x !== 0)) break
  }
  return { a, v }
}

function tier2(rng: Rng): Problem {
  const { a, v } = buildMatVec(rng)
  const value = apply(a, v)
  const exprRows = a.map((row) => entryExpr(row, v))
  const solution: SolutionStep[] = [
    { text: 'Dot each row of $A$ with $\\vec v$:', tex: vecLatex(exprRows) },
    { text: 'That gives', tex: vecLatex(asVec(value)) },
  ]
  return {
    statement: `Given $A = ${matLatex(a)}$ and $\\vec{v} = ${vecLatex(asVec(v))}$, compute $A\\vec{v}$.`,
    answer: { kind: 'vector', components: asVec(value) },
    solution,
    hints: HINTS_MULT,
    inputHint: INPUT_HINT_VECTOR,
  }
}

/** A 2×2 pair for which $AB \neq BA$ is guaranteed. */
export function buildNoncommutingPair(rng: Rng): { readonly a: Mat; readonly b: Mat } {
  let a: number[][] = []
  let b: number[][] = []
  for (let i = 0; i < 200; i += 1) {
    a = randomNonzeroMat(rng, 2, 2)
    b = randomNonzeroMat(rng, 2, 2)
    const ab = multiply(a, b)
    const ba = multiply(b, a)
    if (ab.some((row, ri) => row.some((x, ci) => x !== ba[ri][ci]))) break
  }
  return { a, b }
}

function tier3Ba(rng: Rng): Problem {
  const { a, b } = buildNoncommutingPair(rng)
  const ab = multiply(a, b)
  const ba = multiply(b, a)
  const solution: SolutionStep[] = [
    { text: 'Matrix multiplication is not commutative, so compute $BA$ — not $AB$ — row by column:', tex: productExprGrid(b, a) },
    { text: 'That gives', tex: matLatex(asGrid(ba)) },
    { text: 'Order really does matter here:', tex: `AB = ${matLatex(asGrid(ab))} \\neq ${matLatex(asGrid(ba))} = BA` },
  ]
  return {
    statement: `Given $A = ${matLatex(a)}$ and $B = ${matLatex(b)}$, compute $BA$.`,
    answer: { kind: 'matrix', rows: asGrid(ba) },
    solution,
    hints: HINTS_ORDER,
    inputHint: INPUT_HINT_MATRIX,
  }
}

/** A $2\times3$ and $3\times2$ pair whose product $AB$ is not the zero matrix. */
export function buildRectPair(rng: Rng): { readonly a: Mat; readonly b: Mat } {
  let a: number[][] = []
  let b: number[][] = []
  for (let i = 0; i < 200; i += 1) {
    a = randomNonzeroMat(rng, 2, 3)
    b = randomNonzeroMat(rng, 3, 2)
    if (multiply(a, b).some((row) => row.some((x) => x !== 0))) break
  }
  return { a, b }
}

function tier3Transpose(rng: Rng): Problem {
  const { a, b } = buildRectPair(rng)
  const ab = multiply(a, b)
  const value = transpose(ab)
  const solution: SolutionStep[] = [
    { text: 'First multiply row by column to get $AB$:', tex: productExprGrid(a, b) },
    {
      text: 'That gives $AB$; now transpose it — rows become columns:',
      tex: `AB = ${matLatex(asGrid(ab))} \\quad\\Rightarrow\\quad (AB)^{T} = ${matLatex(asGrid(value))}`,
    },
    { text: 'Order matters when you transpose a product: $(AB)^{T}=B^{T}A^{T}$, not $A^{T}B^{T}$.' },
  ]
  return {
    statement: `Given $A = ${matLatex(a)}$ (size $2\\times3$) and $B = ${matLatex(b)}$ (size $3\\times2$), compute $(AB)^{T}$.`,
    answer: { kind: 'matrix', rows: asGrid(value) },
    solution,
    hints: HINTS_ORDER,
    inputHint: INPUT_HINT_MATRIX,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? tier3Ba(rng) : tier3Transpose(rng)
}

export const template: SkillTemplate = {
  skillId: 'matrix_mult',
  theory,
  expectedSeconds: { 1: 70, 2: 90, 3: 130 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
