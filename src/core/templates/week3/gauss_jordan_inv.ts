import { paren } from '../../math/latex'
import { apply, det2, identity, matLatex, type Mat } from '../../math/matrix'
import { rat, ratToLatex } from '../../math/rational'
import { vecLatex } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'The Gauss–Jordan method finds $A^{-1}$ by augmenting $A$ with the identity, $[A \\mid I]$, and row-reducing the left block all the way down to $I$.',
  'Every row operation applied to the left block must be applied to the whole row, right block included; once the left side reaches $I$, the right side has become $A^{-1}$.',
  'A square matrix is invertible exactly when its determinant is nonzero. If a column can never get a nonzero pivot, no inverse exists.',
  'Once $A^{-1}$ is known, $A\\vec x = \\vec b$ solves instantly as $\\vec x = A^{-1}\\vec b$ — no elimination needed.',
  'Checking an inverse costs one multiplication: $AA^{-1}$ must come back to the identity.',
  'Common mistakes: reducing only the left block and forgetting the right; stopping once the left block is triangular instead of continuing all the way to $I$.',
].join('\n')

const HINTS_INV_2 = [
  'Augment $A$ with the identity matrix, then use row operations to turn the left block into the identity.',
  'Whatever operation clears an entry on the left, apply that exact same operation to the whole row — identity block included.',
]
const HINTS_INV_3 = [
  'Work one column at a time: clear every other entry in that column before moving on to the next.',
  'Track every operation on the full row, identity block included — the right-hand block only becomes $A^{-1}$ if you do.',
]
const HINTS_SOLVE_VIA_INV = [
  'There is no need to eliminate anything here — multiply $A^{-1}$ by $\\vec b$.',
  'Matrix times vector: each entry of the result is a row of $A^{-1}$ dotted with $\\vec b$.',
]
const HINTS_SINGULAR = [
  'A matrix fails to have an inverse exactly when its determinant is zero — write the determinant as a function of the parameter.',
  'That determinant is linear in the parameter; set it to zero and solve.',
]

const INPUT_HINT_MATRIX = 'One number per entry, left to right, top to bottom'
const INPUT_HINT_VECTOR = 'One number per component, top to bottom'
const INPUT_HINT_NUMBER = 'A single number; write a fraction with /, e.g. -3/2'

type ShearOp = { readonly kind: 'shear'; readonly to: number; readonly from: number; readonly k: number }
type SwapOp = { readonly kind: 'swap'; readonly i: number; readonly j: number }
type RowOp = ShearOp | SwapOp

function applyOp(rows: readonly (readonly number[])[], op: RowOp): number[][] {
  const m = rows.map((r) => [...r])
  if (op.kind === 'swap') {
    const tmp = m[op.i]
    m[op.i] = m[op.j]
    m[op.j] = tmp
    return m
  }
  m[op.to] = m[op.to].map((v, c) => v + op.k * m[op.from][c])
  return m
}

const invertOp = (op: RowOp): RowOp => (op.kind === 'swap' ? op : { ...op, k: -op.k })

/** Names a row operation: "R_a \\to R_a - kR_b" (or "+"), or "R_a \\leftrightarrow R_b" for a swap. */
function opLatex(op: RowOp): string {
  if (op.kind === 'swap') return `R_${op.i + 1} \\leftrightarrow R_${op.j + 1}`
  const sign = op.k < 0 ? '+' : '-'
  const mag = Math.abs(op.k)
  const coef = mag === 1 ? '' : String(mag)
  return `R_${op.to + 1} \\to R_${op.to + 1} ${sign} ${coef}R_${op.from + 1}`
}

/** [ left | right ] with an n-column bar, e.g. an n×2n augmented block. */
function sideBySideLatex(left: readonly (readonly (number | string)[])[], right: readonly (readonly (number | string)[])[]): string {
  const n = left.length
  const spec = `${'c'.repeat(n)}|${'c'.repeat(n)}`
  const body = left.map((row, i) => [...row, ...right[i]].join(' & ')).join(' \\\\ ')
  return `\\left(\\begin{array}{${spec}} ${body} \\end{array}\\right)`
}

/** Builds an n×n integer matrix as a short product of elementary row operations applied to I, so it is always invertible with an integer inverse. */
function buildInvertible(rng: Rng, n: 2 | 3): { readonly a: Mat; readonly ops: readonly RowOp[] } {
  const ops: RowOp[] = []
  let m: number[][] = identity(n)
  const shearCount = n === 2 ? 2 : 3
  for (let s = 0; s < shearCount; s += 1) {
    const to = rng.int(0, n - 1)
    const from = rng.intExcept(0, n - 1, [to])
    const k = rng.pick([-2, -1, 1, 2])
    const op: RowOp = { kind: 'shear', to, from, k }
    m = applyOp(m, op)
    ops.push(op)
  }
  if (rng.chance(0.4)) {
    const j = rng.intExcept(0, n - 1, [0])
    const op: RowOp = { kind: 'swap', i: 0, j }
    m = applyOp(m, op)
    ops.push(op)
  }
  return { a: m, ops }
}

/** Row-reduces [A|I] using the exact reverse of the operations that built A, so the result is provably A^{-1}. */
function reduceToInverse(a: Mat, ops: readonly RowOp[]): { readonly stages: readonly Mat[]; readonly reduction: readonly RowOp[]; readonly inv: Mat } {
  const n = a.length
  const id = identity(n)
  let aug: number[][] = a.map((row, i) => [...row, ...id[i]])
  const stages: Mat[] = [aug.map((r) => [...r])]
  const reduction = [...ops].reverse().map(invertOp)
  for (const op of reduction) {
    aug = applyOp(aug, op)
    stages.push(aug.map((r) => [...r]))
  }
  const inv = aug.map((row) => row.slice(n))
  return { stages, reduction, inv }
}

function buildSteps(stages: readonly Mat[], reduction: readonly RowOp[], n: number): SolutionStep[] {
  const renderStage = (stage: Mat): string => sideBySideLatex(stage.map((r) => r.slice(0, n)), stage.map((r) => r.slice(n)))
  const steps: SolutionStep[] = [{ text: 'Augment $A$ with the identity matrix:', tex: renderStage(stages[0]) }]
  reduction.forEach((op, i) => {
    steps.push({ text: `Apply $${opLatex(op)}$:`, tex: renderStage(stages[i + 1]) })
  })
  steps.push({ text: 'The left block is now the identity, so the right block is $A^{-1}$.' })
  return steps
}

interface GeneratedInverse {
  readonly problem: Problem
  readonly a: Mat
}

function tier1(rng: Rng): GeneratedInverse {
  const { a, ops } = buildInvertible(rng, 2)
  const { stages, reduction, inv } = reduceToInverse(a, ops)
  const problem: Problem = {
    statement: `Find the inverse of $A = ${matLatex(a)}$ using the Gauss–Jordan method.`,
    answer: { kind: 'matrix', rows: inv.map((row) => row.map(String)) },
    solution: [
      { text: `Since $\\det A = ${det2(a)} \\neq 0$, $A$ is invertible.` },
      ...buildSteps(stages, reduction, 2),
    ],
    hints: HINTS_INV_2,
    inputHint: INPUT_HINT_MATRIX,
  }
  return { problem, a }
}

function tier2(rng: Rng): GeneratedInverse {
  const { a, ops } = buildInvertible(rng, 3)
  const { stages, reduction, inv } = reduceToInverse(a, ops)
  const problem: Problem = {
    statement: `Find the inverse of $A = ${matLatex(a)}$ using the Gauss–Jordan method.`,
    answer: { kind: 'matrix', rows: inv.map((row) => row.map(String)) },
    solution: buildSteps(stages, reduction, 3),
    hints: HINTS_INV_3,
    inputHint: INPUT_HINT_MATRIX,
  }
  return { problem, a }
}

interface GeneratedSolve {
  readonly problem: Problem
  readonly a: Mat
  readonly b: readonly number[]
}

function tier3Solve(rng: Rng): GeneratedSolve {
  const { a, ops } = buildInvertible(rng, 3)
  const { inv } = reduceToInverse(a, ops)
  const x0 = rng.intExcept(-6, 6, [0])
  const y0 = rng.intExcept(-6, 6, [0])
  const z0 = rng.intExcept(-6, 6, [0])
  const b = apply(a, [x0, y0, z0])

  const problem: Problem = {
    statement: `Given $A = ${matLatex(a)}$ and $\\vec b = ${vecLatex(b)}$, use $A^{-1}$ to solve $A\\vec x = \\vec b$.`,
    answer: { kind: 'vector', components: [String(x0), String(y0), String(z0)] },
    solution: [
      { text: 'Gauss–Jordan on $[A \\mid I]$ gives the inverse:', tex: `A^{-1} = ${matLatex(inv)}` },
      { text: 'The solution is then $\\vec x = A^{-1}\\vec b$:', tex: `\\vec x = ${matLatex(inv)}${vecLatex(b)} = ${vecLatex([x0, y0, z0])}` },
    ],
    hints: HINTS_SOLVE_VIA_INV,
    inputHint: INPUT_HINT_VECTOR,
  }
  return { problem, a, b }
}

interface GeneratedParam {
  readonly problem: Problem
  readonly a: number
  readonly b: number
  readonly c: number
}

function tier3Param(rng: Rng): GeneratedParam {
  const a = rng.pick([1, 2, 3, -1, -2, -3])
  const b = rng.intExcept(-4, 4, [0])
  const c = rng.intExcept(-4, 4, [0])
  const t0 = rat(b * c, a)
  const t0Latex = ratToLatex(t0)

  const problem: Problem = {
    statement: `For which value of $t$ is the matrix $${matLatex([[a, b], [c, 't']])}$ not invertible?`,
    answer: { kind: 'number', value: t0Latex },
    solution: [
      {
        text: 'A matrix fails to be invertible exactly when its determinant is zero:',
        tex: `\\det = ${a}\\cdot t - ${paren(b)}\\cdot${paren(c)} = 0`,
      },
      { text: 'Solve for $t$:', tex: `${a}t = ${b * c} \\quad\\Rightarrow\\quad t = ${t0Latex}` },
    ],
    hints: HINTS_SINGULAR,
    inputHint: INPUT_HINT_NUMBER,
  }
  return { problem, a, b, c }
}

export const template: SkillTemplate = {
  skillId: 'gauss_jordan_inv',
  theory,
  expectedSeconds: { 1: 110, 2: 240, 3: 150 },
  generate: (rng, tier) => {
    if (tier === 1) return tier1(rng).problem
    if (tier === 2) return tier2(rng).problem
    return (rng.chance(0.5) ? tier3Solve(rng) : tier3Param(rng)).problem
  },
}

export { tier1, tier2, tier3Solve, tier3Param }
