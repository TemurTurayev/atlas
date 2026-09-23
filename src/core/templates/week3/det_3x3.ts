import { paren } from '../../math/latex'
import { det2, det3, matLatex, type Mat } from '../../math/matrix'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'The determinant of a $3\\times3$ matrix expands along a row or column into three $2\\times2$ minors: deleting the row and column through an entry gives its minor.',
  'Expanding along the first row: $\\det A = a_{11}M_{11} - a_{12}M_{12} + a_{13}M_{13}$, signs alternating $+,-,+$ across the row — in general entry $a_{ij}$ carries the sign $(-1)^{i+j}$.',
  'Any row or column works, and picking one with zeros saves work: a zero entry kills its whole term before any minor is even computed.',
  'For a triangular matrix (every entry on one side of the diagonal is $0$), the determinant is just the product of the diagonal entries.',
  'Swapping two rows flips the sign of the determinant, and a repeated or proportional row makes the determinant $0$.',
  'Common mistakes: dropping the minus sign on the middle term of the expansion; forgetting that a zero row or column forces the whole determinant to $0$.',
].join('\n')

const HINTS_EXPAND = [
  'Expand along the first row: multiply each entry by the $2\\times2$ minor left after deleting its row and column.',
  'Apply the alternating sign pattern $+,-,+$ across the row before adding the three terms.',
]
const HINTS_ZERO = [
  'Scan for a row or column with the most zeros — expanding along it means most terms vanish before you compute a single minor.',
  'Only the nonzero entry contributes; multiply it by its sign $(-1)^{i+j}$ and the determinant of its $2\\times2$ minor.',
]
const HINTS_TRIANGULAR = [
  'Check whether every entry on one side of the diagonal is $0$ — if so, there is no expansion to do at all.',
  'For a triangular matrix, $\\det A$ is simply the product of the diagonal entries $a_{11},a_{22},a_{33}$.',
]
const HINTS_REPEATED = [
  'Compare the rows before computing anything — two identical or proportional rows already tell you the answer.',
  'If one row is a scalar multiple of another, the determinant is exactly $0$, no matter what the third row is.',
]
const HINTS_SWAP = [
  'You are already told $\\det A$ — there is no need to expand anything from scratch.',
  'Swapping two rows always flips the sign of the determinant: $\\det B = -\\det A$.',
]

const POOL_NONZERO = [-3, -2, -1, 1, 2, 3]

const randomEntry = (rng: Rng, pool: readonly number[]): number => rng.pick(pool)

const randomMatrix3 = (rng: Rng, pool: readonly number[] = POOL_NONZERO): number[][] =>
  Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => randomEntry(rng, pool)))

/** The minor left after deleting one row and one column. */
const minor = (a: Mat, skipRow: number, skipCol: number): Mat =>
  a.filter((_, i) => i !== skipRow).map((row) => row.filter((_, j) => j !== skipCol))

/** A random 3×3 matrix whose determinant is not $0$. */
function randomNonSingular3(rng: Rng): { readonly a: number[][]; readonly value: number } {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const a = randomMatrix3(rng)
    const value = det3(a)
    if (value !== 0) return { a, value }
  }
  throw new Error('det_3x3: could not generate a nonsingular matrix')
}

/** A 3×3 matrix where row/column `idx` is $0$ everywhere except position `pos`, which holds `value`. */
function zeroRichMatrix(rng: Rng, useRow: boolean, idx: number, pos: number, value: number): number[][] {
  const base = randomMatrix3(rng)
  return base.map((row, r) =>
    row.map((x, c) => {
      if (useRow) return r === idx ? (c === pos ? value : 0) : x
      return c === idx ? (r === pos ? value : 0) : x
    }),
  )
}

/** A zero-rich matrix (two zeros in one row or column) whose determinant is not $0$, plus where the surviving term sits. */
function generateZeroRich(rng: Rng): { readonly a: number[][]; readonly useRow: boolean; readonly i: number; readonly j: number; readonly value: number } {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const useRow = rng.chance(0.5)
    const idx = rng.int(0, 2)
    const pos = rng.int(0, 2)
    const nonZeroValue = randomEntry(rng, POOL_NONZERO)
    const a = zeroRichMatrix(rng, useRow, idx, pos, nonZeroValue)
    const i = useRow ? idx : pos
    const j = useRow ? pos : idx
    const value = det3(a)
    if (value !== 0) return { a, useRow, i, j, value }
  }
  throw new Error('det_3x3: could not generate a nonzero zero-rich determinant')
}

function tier1(rng: Rng): Problem {
  const { a, value } = randomNonSingular3(rng)
  const m0 = minor(a, 0, 0)
  const m1 = minor(a, 0, 1)
  const m2 = minor(a, 0, 2)
  const d0 = det2(m0)
  const d1 = det2(m1)
  const d2 = det2(m2)

  const solution: SolutionStep[] = [
    {
      text: 'Expand along the first row. Deleting row 1 and each column in turn gives three $2\\times2$ minors:',
      tex: `M_{11}=${matLatex(m0)}, \\quad M_{12}=${matLatex(m1)}, \\quad M_{13}=${matLatex(m2)}`,
    },
    {
      text: 'Their determinants are:',
      tex: `\\det M_{11} = ${d0}, \\quad \\det M_{12} = ${d1}, \\quad \\det M_{13} = ${d2}`,
    },
    {
      text: 'Combine them with the first-row entries as coefficients, using the alternating sign pattern $+,-,+$:',
      tex: `\\det A = ${paren(a[0][0])}\\cdot ${paren(d0)} - ${paren(a[0][1])}\\cdot ${paren(d1)} + ${paren(a[0][2])}\\cdot ${paren(d2)} = ${value}`,
    },
  ]

  return {
    statement: `Compute the determinant $\\det A$ for $A = ${matLatex(a)}$.`,
    answer: { kind: 'number', value: String(value) },
    solution,
    hints: HINTS_EXPAND,
  }
}

function tier2(rng: Rng): Problem {
  const { a, useRow, i, j, value } = generateZeroRich(rng)
  const sign = (i + j) % 2 === 0 ? 1 : -1
  const m = minor(a, i, j)
  const d = det2(m)
  const signStr = sign === 1 ? '' : '-'
  const label = useRow ? `Row ${i + 1}` : `Column ${j + 1}`

  const solution: SolutionStep[] = [
    {
      text: `${label} has two zero entries, so expanding along it is much less work: every term with a zero coefficient is automatically $0$, leaving only one cofactor to compute.`,
    },
    {
      text: `Delete the row and column through the nonzero entry $a_{${i + 1}${j + 1}} = ${a[i][j]}$ to get its minor:`,
      tex: `M_{${i + 1}${j + 1}} = ${matLatex(m)}, \\quad \\det M_{${i + 1}${j + 1}} = ${d}`,
    },
    {
      text: 'The determinant is just that entry times its cofactor sign and minor — every other term is $0$:',
      tex: `\\det A = (-1)^{${i + 1}+${j + 1}}\\cdot ${paren(a[i][j])}\\cdot ${paren(d)} = ${signStr}${paren(a[i][j])}\\cdot ${paren(d)} = ${value}`,
    },
  ]

  return {
    statement: `Compute the determinant $\\det A$ for $A = ${matLatex(a)}$.`,
    answer: { kind: 'number', value: String(value) },
    solution,
    hints: HINTS_ZERO,
  }
}

function triangularProblem(rng: Rng): Problem {
  const upper = rng.chance(0.5)
  const diag: readonly [number, number, number] = [randomEntry(rng, POOL_NONZERO), randomEntry(rng, POOL_NONZERO), randomEntry(rng, POOL_NONZERO)]
  const free = (): number => randomEntry(rng, POOL_NONZERO)
  const a: number[][] = upper
    ? [
        [diag[0], free(), free()],
        [0, diag[1], free()],
        [0, 0, diag[2]],
      ]
    : [
        [diag[0], 0, 0],
        [free(), diag[1], 0],
        [free(), free(), diag[2]],
      ]
  const value = diag[0] * diag[1] * diag[2]
  const side = upper ? 'below' : 'above'

  return {
    statement: `Compute the determinant $\\det A$ for $A = ${matLatex(a)}$.`,
    answer: { kind: 'number', value: String(value) },
    solution: [
      { text: `This matrix is triangular: every entry ${side} the diagonal is $0$.` },
      {
        text: 'For a triangular matrix, the determinant is just the product of the diagonal entries — no expansion needed:',
        tex: `\\det A = ${paren(diag[0])}\\cdot ${paren(diag[1])}\\cdot ${paren(diag[2])} = ${value}`,
      },
    ],
    hints: HINTS_TRIANGULAR,
  }
}

function repeatedRowProblem(rng: Rng): Problem {
  const pairs: readonly (readonly [number, number])[] = [
    [0, 1],
    [0, 2],
    [1, 2],
  ]
  const [r1, r2] = rng.pick(pairs)
  const baseRow = [randomEntry(rng, POOL_NONZERO), randomEntry(rng, POOL_NONZERO), randomEntry(rng, POOL_NONZERO)]
  const k = rng.intExcept(-3, 3, [0])
  const otherRow = [randomEntry(rng, POOL_NONZERO), randomEntry(rng, POOL_NONZERO), randomEntry(rng, POOL_NONZERO)]

  const a: number[][] = Array.from({ length: 3 }, (_, r) => {
    if (r === r1) return baseRow
    if (r === r2) return baseRow.map((x) => k * x)
    return otherRow
  })
  const value = det3(a)

  const relation = k === 1 ? `Row ${r2 + 1} is exactly the same as Row ${r1 + 1}` : `Row ${r2 + 1} is $${k}$ times Row ${r1 + 1}`

  return {
    statement: `Compute the determinant $\\det A$ for $A = ${matLatex(a)}$.`,
    answer: { kind: 'number', value: String(value) },
    solution: [
      { text: `${relation} — the rows are proportional.` },
      { text: 'Whenever one row of a matrix is a scalar multiple of another, the determinant is $0$: no expansion is needed.', tex: '\\det A = 0' },
    ],
    hints: HINTS_REPEATED,
  }
}

function swapProblem(rng: Rng): Problem {
  const { a, value } = randomNonSingular3(rng)
  const pairs: readonly (readonly [number, number])[] = [
    [0, 1],
    [0, 2],
    [1, 2],
  ]
  const [r1, r2] = rng.pick(pairs)
  const swappedValue = -value

  return {
    statement: `The matrix $A = ${matLatex(a)}$ has determinant $\\det A = ${value}$ (no need to verify this). Let $B$ be the matrix obtained by swapping rows $${r1 + 1}$ and $${r2 + 1}$ of $A$. Find $\\det B$.`,
    answer: { kind: 'number', value: String(swappedValue) },
    solution: [
      { text: 'Swapping two rows of a matrix always flips the sign of its determinant — nothing else needs recomputing.' },
      { text: 'So:', tex: `\\det B = -\\det A = -\\left(${value}\\right) = ${swappedValue}` },
    ],
    hints: HINTS_SWAP,
  }
}

function tier3(rng: Rng): Problem {
  const kind = rng.pick(['triangular', 'repeated', 'swap'] as const)
  if (kind === 'triangular') return triangularProblem(rng)
  if (kind === 'repeated') return repeatedRowProblem(rng)
  return swapProblem(rng)
}

export const template: SkillTemplate = {
  skillId: 'det_3x3',
  theory,
  expectedSeconds: { 1: 110, 2: 80, 3: 60 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
