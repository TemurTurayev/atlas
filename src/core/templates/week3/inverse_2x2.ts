import { paren } from '../../math/latex'
import { adjugate2, apply, det2, identity, matLatex, multiply, type Mat } from '../../math/matrix'
import { rat, ratToLatex } from '../../math/rational'
import { vecLatex } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate, SolutionStep } from '../types'

const GENERIC_A = matLatex([
  ['a', 'b'],
  ['c', 'd'],
])
const GENERIC_ADJ = matLatex([
  ['d', '-b'],
  ['-c', 'a'],
])

const theory = [
  `For a $2\\times2$ matrix $A=${GENERIC_A}$, the inverse exists exactly when $\\det A = ad-bc \\neq 0$, and then $A^{-1}=\\dfrac{1}{\\det A}${GENERIC_ADJ}$.`,
  'That matrix on the right, the adjugate, swaps the diagonal entries $a,d$ and negates the off-diagonal entries $b,c$.',
  'Always check an inverse by multiplying: $AA^{-1}$ should come out to the identity matrix $I$.',
  'If $\\det A = 1$ or $-1$, the inverse has whole-number entries; for any other determinant, expect fractions.',
  'Once $A^{-1}$ is known, a system $A\\vec{x}=\\vec{b}$ solves in one step: $\\vec{x}=A^{-1}\\vec{b}$.',
  'Common mistakes: forgetting to divide by $\\det A$ — swapping and negating alone gives only the adjugate, not the inverse; swapping the wrong pair of entries ($a$ and $d$, not $b$ and $c$).',
].join('\n')

const HINTS_UNIT = [
  'Compute $\\det A = ad-bc$ first — for this matrix it works out to $1$ or $-1$, so dividing will not introduce fractions.',
  'Swap the diagonal entries, negate the off-diagonal ones, then divide by the determinant you found.',
]
const HINTS_FRACTION = [
  `Compute $\\det A = ad-bc$ first, then build the swap-and-negate matrix $${GENERIC_ADJ}$.`,
  'Divide every entry of that matrix by $\\det A$ — do not skip this step; forgetting the $\\frac{1}{\\det A}$ factor is the single most common mistake here.',
]
const HINTS_SOLVE = [
  'Find $A^{-1}$ first (swap the diagonal, negate the off-diagonal, divide by $\\det A$), then multiply it by $\\vec b$.',
  '$\\vec x = A^{-1}\\vec b$: multiply the inverse matrix by the vector $\\vec b$ using ordinary matrix-vector multiplication.',
]

const POOL = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]
const SWAP_ROWS: number[][] = [
  [0, 1],
  [1, 0],
]
const NEGATE_ROW1: number[][] = [
  [-1, 0],
  [0, 1],
]

/** The inverse of a 2×2 matrix, as exact fractions: the adjugate divided by the determinant, entry by entry. */
function inverseEntries(m: Mat): { readonly detVal: number; readonly adj: Mat; readonly rows: string[][] } {
  const detVal = det2(m)
  const adj = adjugate2(m)
  const rows = adj.map((row) => row.map((x) => ratToLatex(rat(x, detVal))))
  return { detVal, adj, rows }
}

const detStep = (m: Mat, detVal: number): SolutionStep => ({
  text: 'Compute the determinant using $ad-bc$:',
  tex: `\\det A = ${paren(m[0][0])}\\cdot ${paren(m[1][1])} - ${paren(m[0][1])}\\cdot ${paren(m[1][0])} = ${detVal}`,
})

/** One shear: adds a small multiple of one row to the other. Preserves the determinant. */
function randomShear(rng: Rng): number[][] {
  const t = rng.intExcept(-2, 2, [0])
  return rng.chance(0.5) ? [[1, t], [0, 1]] : [[1, 0], [t, 1]]
}

/** A random integer $2\times2$ matrix with determinant exactly $1$ or $-1$. */
function unimodularMatrix(rng: Rng): number[][] {
  const ops: readonly number[][][] = [
    randomShear(rng),
    randomShear(rng),
    ...(rng.chance(0.5) ? [SWAP_ROWS] : []),
    ...(rng.chance(0.5) ? [NEGATE_ROW1] : []),
  ]
  return ops.reduce<number[][]>((acc, op) => multiply(op, acc), identity(2))
}

/** A random integer $2\times2$ matrix whose determinant is neither $0$ nor $\pm1$. */
function randomInvertibleGeneral(rng: Rng): number[][] {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const m = [
      [rng.pick(POOL), rng.int(-5, 5)],
      [rng.int(-5, 5), rng.pick(POOL)],
    ]
    const d = det2(m)
    if (d !== 0 && Math.abs(d) !== 1) return m
  }
  throw new Error('inverse_2x2: could not generate a general invertible matrix')
}

/** A random small integer $2\times2$ matrix that is invertible (any nonzero determinant). */
function randomInvertible2x2(rng: Rng): number[][] {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const m = [
      [rng.int(-4, 4), rng.int(-4, 4)],
      [rng.int(-4, 4), rng.int(-4, 4)],
    ]
    if (det2(m) !== 0) return m
  }
  throw new Error('inverse_2x2: could not generate an invertible matrix')
}

function tier1(rng: Rng): Problem {
  const m = unimodularMatrix(rng)
  const { detVal, adj, rows } = inverseEntries(m)
  const note = detVal === -1 ? ', flipping every sign since you are dividing by $-1$' : ''

  return {
    statement: `Find the inverse of $A = ${matLatex(m)}$.`,
    answer: { kind: 'matrix', rows },
    solution: [
      detStep(m, detVal),
      {
        text: `Since $\\det A = ${detVal}$, the inverse has whole-number entries. Swap the diagonal entries and negate the off-diagonal ones${note}:`,
        tex: `A^{-1} = \\dfrac{1}{${detVal}}${matLatex(adj)} = ${matLatex(rows)}`,
      },
    ],
    hints: HINTS_UNIT,
  }
}

function tier2(rng: Rng): Problem {
  const m = randomInvertibleGeneral(rng)
  const { detVal, adj, rows } = inverseEntries(m)

  return {
    statement: `Find the inverse of $A = ${matLatex(m)}$.`,
    answer: { kind: 'matrix', rows },
    solution: [
      detStep(m, detVal),
      { text: 'Swap the diagonal entries and negate the off-diagonal ones to form the adjugate:', tex: `\\text{adj}(A) = ${matLatex(adj)}` },
      {
        text: `Divide every entry by $\\det A = ${detVal}$ — this is the step it is easy to forget:`,
        tex: `A^{-1} = \\dfrac{1}{${detVal}}${matLatex(adj)} = ${matLatex(rows)}`,
      },
    ],
    hints: HINTS_FRACTION,
  }
}

function tier3(rng: Rng): Problem {
  const m = randomInvertible2x2(rng)
  const x = [rng.intExcept(-4, 4, [0]), rng.intExcept(-4, 4, [0])]
  const b = apply(m, x)
  const { detVal, adj } = inverseEntries(m)
  const adjB = apply(adj, b)

  return {
    statement: `Given $A = ${matLatex(m)}$ and $\\vec b = ${vecLatex(b.map(String))}$, solve $A\\vec{x} = \\vec{b}$ using the inverse of $A$.`,
    answer: { kind: 'vector', components: x.map(String) },
    solution: [
      detStep(m, detVal),
      {
        text: 'Form the adjugate and multiply it by $\\vec b$ — still whole numbers, no fractions yet:',
        tex: `\\text{adj}(A)\\vec b = ${matLatex(adj)}${vecLatex(b.map(String))} = ${vecLatex(adjB.map(String))}`,
      },
      {
        text: `Divide by $\\det A = ${detVal}$ to get $\\vec x = A^{-1}\\vec b$:`,
        tex: `\\vec x = \\dfrac{1}{${detVal}}${vecLatex(adjB.map(String))} = ${vecLatex(x.map(String))}`,
      },
    ],
    hints: HINTS_SOLVE,
  }
}

export const template: SkillTemplate = {
  skillId: 'inverse_2x2',
  theory,
  expectedSeconds: { 1: 70, 2: 105, 3: 95 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
