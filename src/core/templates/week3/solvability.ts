import { coefPrefix, joinTerms, linear, paren } from '../../math/latex'
import { augmentedLatex, matLatex } from '../../math/matrix'
import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'The rank of a matrix is the number of linearly independent rows: reduce it to row echelon form (zero out the rows that repeat information) and count the nonzero rows left.',
  'A square matrix $A$ is singular exactly when $\\det(A) = 0$ — that is precisely when its rows become linearly dependent, so the rank drops below the full size $n$.',
  'A system of $n$ equations in $n$ unknowns with a nonsingular coefficient matrix ($\\det \\neq 0$, rank $n$) always has exactly one solution.',
  'If the coefficient matrix is singular (rank $< n$), the system has either infinitely many solutions or none, depending on whether that same row dependency also holds for the right-hand side.',
  'When a parameter $k$ sits in a single entry, $\\det(A(k))$ is a linear function of $k$: setting it to zero pins down the one value where the matrix turns singular.',
  'Common mistakes: computing a determinant to judge solvability when the coefficient matrix is not square (rank is the real question there); forgetting to check the right-hand side once the coefficient matrix is singular, which is exactly what separates "no solution" from "infinitely many".',
].join('\n')

const HINTS_RANK = [
  'Look for a row that repeats information already contained in the others — a multiple of another row, or a combination of two of them.',
  'Once you spot that dependency, subtract it out so that row becomes all zeros; the number of rows left standing is the rank.',
]
const HINTS_SINGULAR = [
  'The matrix is singular exactly when its determinant is zero, so write $\\det(A(k)) = 0$ and solve for $k$.',
  'Since $k$ appears in only one entry, expanding the determinant along the row or column that contains it gives a linear equation in $k$ — solve it directly.',
]
const HINTS_CLASSIFY = [
  'Substitute the given value of $k$ first, then look for a row that is a combination of the other two — that dependency controls the outcome.',
  'If that row reduces to all zeros on the left, check the right-hand side: zero there too means infinitely many solutions, anything else means no solution. If it never reduces to all zeros, the system has exactly one solution.',
]

const INPUT_HINT_RANK = 'A single whole number'
const INPUT_HINT_K = 'A single number; write a fraction with /, e.g. -3/2'

// ---------- shared helpers ----------

/** A row of `n` small integers, never all zero. */
function randomNonzeroRow(rng: Rng, n: number, lo = -4, hi = 4): number[] {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const row = Array.from({ length: n }, () => rng.int(lo, hi))
    if (row.some((x) => x !== 0)) return row
  }
  throw new Error('solvability: could not find a nonzero row')
}

/** True when `u` and `v` are scalar multiples of each other (rank of the pair is at most 1). */
function proportional(u: readonly number[], v: readonly number[]): boolean {
  for (let i = 0; i < u.length; i += 1) {
    for (let j = i + 1; j < u.length; j += 1) {
      if (u[i] * v[j] - u[j] * v[i] !== 0) return false
    }
  }
  return true
}

/** A row that is not a multiple of `existing` — genuinely adds a new direction. */
function independentRow(rng: Rng, existing: readonly number[], n: number, lo = -4, hi = 4): number[] {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const row = randomNonzeroRow(rng, n, lo, hi)
    if (!proportional(existing, row)) return row
  }
  throw new Error('solvability: could not find an independent row')
}

const COMBO_POOL = [-2, -1, 0, 1, 2]

/** Two combination coefficients, not both zero. */
function comboCoeffs(rng: Rng): readonly [number, number] {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const p = rng.pick(COMBO_POOL)
    const q = rng.pick(COMBO_POOL)
    if (p !== 0 || q !== 0) return [p, q]
  }
  throw new Error('solvability: could not find nonzero combination coefficients')
}

const rowTerm = (c: number, idx: number): string => (c === 0 ? '' : `${coefPrefix(c)}R_${idx}`)
/** "2R_1 - R_2", "R_1 + 3R_2", "-R_2" — a row combination as it is written. */
const comboLatex = (p: number, q: number): string => joinTerms([rowTerm(p, 1), rowTerm(q, 2)])

const grid = (rows: readonly (readonly number[])[]): string[][] => rows.map((r) => r.map(String))

/** \left|\begin{matrix} a & b \\ c & d \end{matrix}\right| — a 2x2 determinant, bars and all. */
const detBarsLatex = (m: readonly (readonly number[])[]): string =>
  `\\left|\\begin{matrix} ${m.map((row) => row.join(' & ')).join(' \\\\ ')} \\end{matrix}\\right|`

// ---------- tier 1: rank of a small matrix with an obvious dependent row ----------

function tier1(rng: Rng): Problem {
  const n = 3
  const row1 = randomNonzeroRow(rng, n)
  const zero = [0, 0, 0]

  if (rng.chance(0.5)) {
    const k = rng.intExcept(-4, 4, [0])
    const row2 = row1.map((x) => k * x)
    return {
      statement: `Find the rank of $A = ${matLatex(grid([row1, row2]))}$.`,
      answer: { kind: 'number', value: '1' },
      solution: [
        { text: 'Row 2 is a multiple of Row 1:', tex: `R_2 = ${coefPrefix(k)}R_1` },
        {
          text: 'Subtracting that multiple clears Row 2 to zero — exactly a row operation of Gaussian elimination:',
          tex: `R_2 \\to R_2 - ${paren(k)}R_1 = ${matLatex(grid([row1, zero]))}`,
        },
        { text: 'Only one nonzero row is left, so the matrix is now in row echelon form and the rank is 1.' },
      ],
      hints: HINTS_RANK,
      inputHint: INPUT_HINT_RANK,
    }
  }

  const row2 = independentRow(rng, row1, n)
  const [p, q] = comboCoeffs(rng)
  const row3 = row1.map((x, i) => p * x + q * row2[i])
  return {
    statement: `Find the rank of $A = ${matLatex(grid([row1, row2, row3]))}$.`,
    answer: { kind: 'number', value: '2' },
    solution: [
      { text: 'Row 3 is this combination of Rows 1 and 2:', tex: `R_3 = ${comboLatex(p, q)}` },
      {
        text: 'Subtracting that combination clears Row 3 to zero — exactly a row operation of Gaussian elimination:',
        tex: `R_3 \\to R_3 - \\left(${comboLatex(p, q)}\\right) = ${matLatex(grid([row1, row2, zero]))}`,
      },
      { text: 'Rows 1 and 2 are not multiples of each other, so both stay nonzero; with one zero row, the matrix is in row echelon form and the rank is 2.' },
    ],
    hints: HINTS_RANK,
    inputHint: INPUT_HINT_RANK,
  }
}

// ---------- tier 2: for which k is the matrix singular ----------

const K_POOL = [-3, -2, -1, 1, 2, 3]

function tier2Order2(rng: Rng): Problem {
  const a = rng.pick(K_POOL)
  const b = rng.int(-3, 3)
  const c = rng.int(-3, 3)
  const rest = -(b * c)
  const k0 = rat(-rest, a)
  const k0Latex = ratToLatex(k0)
  const matrix: (number | string)[][] = [
    [a, b],
    [c, 'k'],
  ]
  return {
    statement: `For which value of $k$ is $A = ${matLatex(matrix)}$ singular?`,
    answer: { kind: 'number', value: k0Latex },
    solution: [
      {
        text: 'A matrix is singular exactly when its determinant is zero. Expand the determinant:',
        tex: `\\det(A) = ${a}\\cdot k - ${paren(b)}\\cdot${paren(c)} = ${linear(a, rest, 'k')}`,
      },
      {
        text: 'Set that equal to zero and solve for $k$:',
        tex: `${linear(a, rest, 'k')} = 0 \\quad\\Rightarrow\\quad k = ${k0Latex}`,
      },
    ],
    hints: HINTS_SINGULAR,
    inputHint: INPUT_HINT_K,
  }
}

function tier2Order3(rng: Rng): Problem {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const a11 = rng.int(-3, 3)
    const a12 = rng.int(-3, 3)
    const a21 = rng.int(-3, 3)
    const a22 = rng.int(-3, 3)
    const m33 = a11 * a22 - a12 * a21
    if (m33 === 0 || Math.abs(m33) > 6) continue
    const a13 = rng.int(-2, 2)
    const a23 = rng.int(-2, 2)
    const a31 = rng.int(-2, 2)
    const a32 = rng.int(-2, 2)
    const m31 = a12 * a23 - a13 * a22
    const m32 = a11 * a23 - a13 * a21
    const rest = a31 * m31 - a32 * m32
    const k0 = rat(-rest, m33)
    if (Math.abs(k0.n) > 15) continue
    const k0Latex = ratToLatex(k0)
    const matrix: (number | string)[][] = [
      [a11, a12, a13],
      [a21, a22, a23],
      [a31, a32, 'k'],
    ]
    return {
      statement: `For which value of $k$ is $A = ${matLatex(matrix)}$ singular?`,
      answer: { kind: 'number', value: k0Latex },
      solution: [
        {
          text: 'A matrix is singular exactly when its determinant is zero. Expand the determinant along the last row, the one containing $k$:',
          tex: '\\det(A) = a_{31}M_{31} - a_{32}M_{32} + k\\,M_{33}',
        },
        {
          text: 'Each $M$ is the 2×2 determinant left after crossing out that row and column:',
          tex: `M_{31} = ${detBarsLatex([
            [a12, a13],
            [a22, a23],
          ])} = ${m31}, \\quad M_{32} = ${detBarsLatex([
            [a11, a13],
            [a21, a23],
          ])} = ${m32}, \\quad M_{33} = ${detBarsLatex([
            [a11, a12],
            [a21, a22],
          ])} = ${m33}`,
        },
        {
          text: `Substitute $a_{31}=${a31}$ and $a_{32}=${a32}$ to get $\\det(A)$ as a linear function of $k$:`,
          tex: `\\det(A) = ${paren(a31)}\\cdot${paren(m31)} - ${paren(a32)}\\cdot${paren(m32)} ${m33 < 0 ? '-' : '+'} ${paren(Math.abs(m33))}k = ${linear(m33, rest, 'k')}`,
        },
        {
          text: 'Set that equal to zero and solve for $k$:',
          tex: `${linear(m33, rest, 'k')} = 0 \\quad\\Rightarrow\\quad k = ${k0Latex}`,
        },
      ],
      hints: HINTS_SINGULAR,
      inputHint: INPUT_HINT_K,
    }
  }
  throw new Error('solvability: could not build a clean tier-2 3x3 case')
}

const tier2 = (rng: Rng): Problem => (rng.chance(0.5) ? tier2Order2(rng) : tier2Order3(rng))

// ---------- tier 3: parametrised 3-equation system — one, none or infinitely many ----------

type Case = 'one' | 'none' | 'infinite'

const OPTION_LABELS: Readonly<Record<Case, string>> = {
  one: 'Exactly one solution',
  none: 'No solution',
  infinite: 'Infinitely many solutions',
}

const VARS = ['x', 'y', 'z']

function tier3(rng: Rng): Problem {
  const row1 = randomNonzeroRow(rng, 3)
  const row2 = independentRow(rng, row1, 3)
  const [p, q] = comboCoeffs(rng)
  const comboRow = row1.map((x, i) => p * x + q * row2[i])

  const validJs: number[] = []
  for (let j = 0; j < 3; j += 1) {
    const [i1, i2] = [0, 1, 2].filter((x) => x !== j)
    if (row1[i1] * row2[i2] - row1[i2] * row2[i1] !== 0) validJs.push(j)
  }
  const j = rng.pick(validJs)

  const k0 = rng.int(-5, 5)
  const kase = rng.pick(['one', 'none', 'infinite'] as const)
  const delta = kase === 'one' ? rng.pick([-3, -2, -1, 1, 2, 3]) : 0
  const k = k0 + delta
  const cj = comboRow[j] - k0

  const c1 = rng.int(-6, 6)
  const c2 = rng.int(-6, 6)
  const consistentC3 = p * c1 + q * c2
  const c3 = kase === 'infinite' ? consistentC3 : kase === 'none' ? consistentC3 + rng.pick([1, -1, 2, -2, 3, -3]) : rng.int(-9, 9)

  const row3Symbolic = comboRow.map((x, i) => (i === j ? linear(1, cj, 'k') : String(x)))
  const augmentedRows: string[][] = [
    [...row1.map(String), String(c1)],
    [...row2.map(String), String(c2)],
    [...row3Symbolic, String(c3)],
  ]

  const substitutedRow3 = comboRow.map((x, i) => (i === j ? x + delta : x))
  const substitutedRows: string[][] = [
    [...row1.map(String), String(c1)],
    [...row2.map(String), String(c2)],
    [...substitutedRow3.map(String), String(c3)],
  ]

  const remCoeffs = [0, 1, 2].map((i) => (i === j ? delta : 0))
  const rem = c3 - consistentC3
  const eliminationRow: string[] = [...remCoeffs.map(String), String(rem)]

  const solution: SolutionStep[] = [
    {
      text: `Substitute $k = ${k}$ into the last row of the augmented matrix:`,
      tex: augmentedLatex(substitutedRows),
    },
    {
      text: `Row 3's coefficients agree with $${comboLatex(p, q)}$ everywhere except possibly the column for $${VARS[j]}$ — subtract that same combination from Row 3, right-hand side included:`,
      tex: `R_3 - \\left(${comboLatex(p, q)}\\right) = ${augmentedLatex([eliminationRow])}`,
    },
  ]

  if (delta !== 0) {
    solution.push({
      text: `That row still has a nonzero entry ($${delta}$, in the column for $${VARS[j]}$), so Row 3 was never really a combination of the other two: the coefficient matrix keeps its full rank, 3. A nonsingular coefficient matrix always gives exactly one solution, whatever the right-hand side is.`,
    })
  } else if (rem === 0) {
    solution.push({
      text: 'The coefficients on that row are now all zero, so Row 3 added no new information: the coefficient matrix has rank 2, one short of the 3 unknowns.',
    })
    solution.push({
      text: 'The right-hand side became zero too, so this row now reads $0 = 0$ — automatically true. With only 2 independent equations left for 3 unknowns, the system has infinitely many solutions.',
    })
  } else {
    solution.push({
      text: 'The coefficients on that row are now all zero, so Row 3 added no new information: the coefficient matrix has rank 2, one short of the 3 unknowns.',
    })
    solution.push({
      text: `But the right-hand side came out to $${rem}$, not zero, so this row now reads $0 = ${rem}$ — impossible. The system has no solution.`,
    })
  }

  const options: readonly ChoiceOption[] = rng.shuffle((['one', 'none', 'infinite'] as const).map((id) => ({ id, label: OPTION_LABELS[id] })))

  return {
    statement: `For $k = ${k}$, how many solutions does the linear system in $x, y, z$ with this augmented matrix have? $${augmentedLatex(augmentedRows)}$`,
    answer: { kind: 'choice', options, correctId: kase },
    solution,
    hints: HINTS_CLASSIFY,
  }
}

export const template: SkillTemplate = {
  skillId: 'solvability',
  theory,
  expectedSeconds: { 1: 70, 2: 110, 3: 140 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
