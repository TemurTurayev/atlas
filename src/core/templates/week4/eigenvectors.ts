import { coefPrefix, joinTerms } from '../../math/latex'
import { matLatex, type Mat } from '../../math/matrix'
import { gcd, rat, ratToLatex } from '../../math/rational'
import { vecLatex } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'An eigenvector for a given eigenvalue $\\lambda$ solves the homogeneous system $(A-\\lambda I)\\vec x = \\vec 0$.',
  'Form $A - \\lambda I$ by subtracting $\\lambda$ from every diagonal entry, then solve that system exactly like any other homogeneous system.',
  'Because $\\lambda$ really is an eigenvalue, $\\det(A-\\lambda I)=0$: the equations are dependent, so infinitely many vectors solve the system, and any nonzero one of them is an eigenvector.',
  'In $2$ dimensions this leaves one free parameter — pick the simplest nonzero value for it. In $3$ dimensions, eliminate the same way as in Gaussian elimination.',
  'Every nonzero multiple of a correct eigenvector is itself a correct eigenvector; an eigenspace of dimension $2$ (two free parameters after elimination) needs its dimension counted, not one particular vector.',
  'Common mistakes: solving only one equation and not checking that the others agree; reporting the zero vector; missing a whole free parameter when the eigenspace is more than $1$-dimensional.',
].join('\n')

const HINTS_VEC2 = [
  'Form $A - \\lambda I$ and write out the equation $(A-\\lambda I)\\vec x = \\vec 0$ it represents.',
  'One row is enough — solve it for the ratio between the two components, then pick the simplest nonzero integer pair with that ratio.',
]
const HINTS_VEC3 = [
  'Form $A - \\lambda I$ and row-reduce it, exactly as in Gaussian elimination — the last row should reduce to $0=0$.',
  'Row reduction leaves one free variable; set it to the simplest nonzero value ($1$ works well) and back-substitute for the other two components.',
]
const HINTS_DIM = [
  'Form $A-\\lambda I$ and solve $(A-\\lambda I)\\vec x=\\vec 0$; the number of free variables left after elimination is the dimension of the eigenspace.',
  'One row forces a variable to $0$ because the other eigenvalue $\\mu\\neq\\lambda$ sits there — look at what the remaining rows say: do they both vanish trivially, or does one of them still force a variable to be $0$?',
]

const INPUT_HINT_VEC2 = 'Two numbers; any nonzero multiple of a correct answer is accepted'
const INPUT_HINT_VEC3 = 'Three numbers, top to bottom; any nonzero multiple of a correct answer is accepted'
const INPUT_HINT_DIM = 'A single whole number (1 or 2 for these problems)'

/** Rows proportional to (v2, -v1) send v to zero, so A = λI + B has v as an eigenvector with eigenvalue λ. */
function matrixWithEigenvector(v: readonly [number, number], lambda: number, p: number, q: number): Mat {
  const [v1, v2] = v
  return [
    [lambda + p * v2, -p * v1],
    [q * v2, lambda - q * v1],
  ]
}

/** A nonzero, coprime integer pair — the simplest representative of its direction. */
function coprimeVec2(rng: Rng): [number, number] {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const v1 = rng.intExcept(-4, 4, [0])
    const v2 = rng.intExcept(-4, 4, [0])
    if (gcd(v1, v2) === 1) return [v1, v2]
  }
  throw new Error('eigenvectors: could not build a coprime vector')
}

/** "3x_{1}-2x_{2} = 0", dropping any zero coefficient. */
function rowEquation(row: readonly number[]): string {
  const terms = row.map((coef, i) => (coef === 0 ? '' : `${coefPrefix(coef)}x_{${i + 1}}`))
  return `${joinTerms(terms)} = 0`
}

function addToDiagonal(m: Mat, lambda: number): number[][] {
  return m.map((row, i) => row.map((x, j) => (i === j ? x + lambda : x)))
}

function tier1(rng: Rng): Problem {
  const v = coprimeVec2(rng)
  const lambda = rng.intExcept(-5, 5, [0])
  const p = rng.intExcept(-2, 2, [0])
  const q = rng.intExcept(-2, 2, [0])
  const a = matrixWithEigenvector(v, lambda, p, q)
  const m: Mat = [
    [a[0][0] - lambda, a[0][1]],
    [a[1][0], a[1][1] - lambda],
  ]
  const ratio = rat(-m[0][1], m[0][0])
  const answerV: readonly [number, number] = [ratio.n, ratio.d]

  return {
    statement: `The matrix $A = ${matLatex(a)}$ has eigenvalue $\\lambda = ${lambda}$. Find a corresponding eigenvector (any nonzero multiple of a correct answer is accepted).`,
    answer: { kind: 'vector', components: answerV.map(String), upToScale: true },
    solution: [
      { text: 'An eigenvector solves $(A-\\lambda I)\\vec x = \\vec 0$. Substitute $\\lambda$ and form this matrix:', tex: `A - \\lambda I = ${matLatex(m)}` },
      { text: 'The first row gives one equation in $x_1, x_2$:', tex: rowEquation(m[0]) },
      { text: 'Solve it for the ratio between the components:', tex: `x_1 = ${ratToLatex(rat(-m[0][1], m[0][0]))}x_2` },
      {
        text: `Choosing $x_2 = ${answerV[1]}$ gives $x_1 = ${answerV[0]}$. The second row gives the same relation, as it must, since $\\lambda$ is a genuine eigenvalue:`,
        tex: vecLatex(answerV),
      },
    ],
    hints: HINTS_VEC2,
    inputHint: INPUT_HINT_VEC2,
  }
}

function tier2(rng: Rng): Problem {
  const v1 = rng.intExcept(-3, 3, [0])
  const v2 = rng.intExcept(-3, 3, [0])
  const u11 = rng.intExcept(-3, 3, [0])
  const u12 = rng.int(-3, 3)
  const u22 = rng.intExcept(-3, 3, [0])
  const u23 = -u22 * v2
  const u13 = -(u11 * v1 + u12 * v2)
  const U: Mat = [
    [u11, u12, u13],
    [0, u22, u23],
    [0, 0, 0],
  ]

  const k21 = rng.intExcept(-2, 2, [0])
  const k32 = rng.intExcept(-2, 2, [0])
  const k31 = rng.intExcept(-2, 2, [0])
  const m21 = k21
  const m31 = k31 + k32 * k21
  const m32 = k32

  const row2 = U[1].map((x, i) => x + k21 * U[0][i])
  const row3 = U[2].map((x, i) => x + k31 * U[0][i]).map((x, i) => x + k32 * row2[i])
  const m: Mat = [U[0], row2, row3]

  const lambda = rng.intExcept(-4, 4, [0])
  const a = addToDiagonal(m, lambda)

  const row2_1 = row2.map((x, i) => x - m21 * m[0][i])
  const row3_1 = row3.map((x, i) => x - m31 * m[0][i])
  const m1: Mat = [m[0], row2_1, row3_1]
  const row3_2 = row3_1.map((x, i) => x - m32 * row2_1[i])
  const m2: Mat = [m1[0], m1[1], row3_2]

  const answerV: readonly [number, number, number] = [v1, v2, 1]

  return {
    statement: `The matrix $A = ${matLatex(a)}$ has eigenvalue $\\lambda = ${lambda}$. Find a corresponding eigenvector (any nonzero multiple of a correct answer is accepted).`,
    answer: { kind: 'vector', components: answerV.map(String), upToScale: true },
    solution: [
      { text: 'An eigenvector solves $(A-\\lambda I)\\vec x = \\vec 0$. Substitute $\\lambda$ and form this matrix:', tex: `A - \\lambda I = ${matLatex(m)}` },
      { text: `Eliminate $x_1$ from rows 2 and 3: $R_2 \\to R_2 - (${m21})R_1$, $R_3 \\to R_3 - (${m31})R_1$.`, tex: matLatex(m1) },
      { text: `Eliminate $x_2$ from row 3: $R_3 \\to R_3 - (${m32})R_2$. Row 3 is now all zero — it carries no information, so $x_3$ is a free variable:`, tex: matLatex(m2) },
      { text: 'Set the free variable to the simplest nonzero value:', tex: 'x_3 = 1' },
      {
        text: 'Substitute into row 2 and solve for $x_2$:',
        tex: `${joinTerms([`${coefPrefix(u22)}x_{2}`, String(u23)])} = 0 \\;\\Rightarrow\\; x_2 = ${v2}`,
      },
      {
        text: 'Substitute into row 1 and solve for $x_1$:',
        tex: `${joinTerms([`${coefPrefix(u11)}x_{1}`, String(u12 * v2 + u13)])} = 0 \\;\\Rightarrow\\; x_1 = ${v1}`,
      },
    ],
    hints: HINTS_VEC3,
    inputHint: INPUT_HINT_VEC3,
  }
}

function tier3(rng: Rng): Problem {
  const lambda = rng.intExcept(-4, 4, [0])
  const mu = rng.intExcept(-4, 4, [lambda])
  const defective = rng.chance(0.5)
  const onFirstRow = rng.chance(0.5)
  const f = rng.intExcept(-3, 3, [0])
  const topRight1 = rng.int(-3, 3)
  const topRight2 = rng.int(-3, 3)

  const block: readonly [readonly [number, number], readonly [number, number]] = defective
    ? onFirstRow
      ? [
          [lambda, f],
          [0, lambda],
        ]
      : [
          [lambda, 0],
          [f, lambda],
        ]
    : [
        [lambda, 0],
        [0, lambda],
      ]

  const a: Mat = [
    [block[0][0], block[0][1], topRight1],
    [block[1][0], block[1][1], topRight2],
    [0, 0, mu],
  ]

  const dimension = defective ? 1 : 2

  const blockSteps: SolutionStep[] = defective
    ? (() => {
        const forcedVar = onFirstRow ? 2 : 1
        const freeVar = onFirstRow ? 1 : 2
        const constraintRow = onFirstRow ? 1 : 2
        const trivialRow = onFirstRow ? 2 : 1
        return [
          {
            text: `With $x_3=0$, row $${constraintRow}$ reads $${coefPrefix(f)}x_{${forcedVar}}=0$, forcing $x_{${forcedVar}}=0$; row $${trivialRow}$ reads $0=0$, leaving $x_{${freeVar}}$ free.`,
          },
          { text: 'One free parameter — the eigenspace is $1$-dimensional.' },
        ]
      })()
    : [
        { text: 'With $x_3=0$, rows $1$ and $2$ both read $0=0$: neither constrains $x_1$ or $x_2$, so both stay free.' },
        { text: 'Two free parameters — the eigenspace is $2$-dimensional.' },
      ]

  return {
    statement: `The matrix $A = ${matLatex(a)}$ has eigenvalue $\\lambda = ${lambda}$ of algebraic multiplicity $2$ (a repeated root of the characteristic polynomial). Find the dimension of its eigenspace (the geometric multiplicity).`,
    answer: { kind: 'number', value: String(dimension) },
    solution: [
      { text: 'Form $A - \\lambda I$ and solve $(A-\\lambda I)\\vec x = \\vec 0$:', tex: `A - \\lambda I = ${matLatex(addToDiagonal(a, -lambda))}` },
      { text: `Row $3$ forces $x_3=0$, since $\\mu=${mu}\\neq\\lambda$.` },
      ...blockSteps,
    ],
    hints: HINTS_DIM,
    inputHint: INPUT_HINT_DIM,
  }
}

export const template: SkillTemplate = {
  skillId: 'eigenvectors',
  theory,
  expectedSeconds: { 1: 70, 2: 180, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
