import { coefPrefix, joinTerms, paren } from '../../math/latex'
import { apply, augmentedLatex, type Mat } from '../../math/matrix'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'Gaussian elimination solves a linear system by turning it into row echelon form: use one row to cancel a variable from the rows below it, then repeat on what remains.',
  'Write the system as an augmented matrix $[A \\mid \\vec b]$ and use row operations — $R_i \\to R_i - kR_j$, or swapping two rows — which never change the solution set.',
  'Once the matrix is triangular, the bottom row gives one variable directly; back-substitution then fills in the rest, one variable at a time, from bottom to top.',
  'A row that reduces to $0 = c$ with $c \\neq 0$ is a contradiction: the system is inconsistent and has no solution.',
  'A row that reduces to $0 = 0$ carried no new information: the matching variable stays free, and there are infinitely many solutions.',
  'Common mistakes: eliminating a variable but forgetting to apply the same row operation to the constants column; stopping at a triangular shape without reading off what a zero row actually means.',
].join('\n')

const HINTS_ELIM_2 = [
  'Scale one equation so a variable’s coefficient matches the other equation’s (up to sign), then add or subtract the rows to eliminate it.',
  'Once one row has only one variable left, solve it directly, then substitute that value back into either original equation.',
]
const HINTS_ELIM_3 = [
  'Use the first row to clear the first variable out of every row below it, one row at a time — that is the whole first pass.',
  'Once the matrix is in row echelon form, read the last variable off the bottom row first, then substitute upward, row by row.',
]
const HINTS_DEGENERATE = [
  'Carry out elimination exactly as usual; whether the system has one, none, or infinitely many solutions shows up in what the last row becomes, not in the original equations.',
  'A last row of $0 = c$ with $c \\neq 0$ means no solution; a last row of $0 = 0$ means the matching variable is free, giving infinitely many solutions.',
]

const INPUT_HINT_VECTOR = 'One number per component, top to bottom'

const VARS2 = ['x', 'y'] as const
const VARS3 = ['x', 'y', 'z'] as const

/** "3x - 2y" style term list, dropping any zero coefficients. */
function termsRow(coeffs: readonly number[], vars: readonly string[]): string {
  return joinTerms(coeffs.map((c, i) => (c === 0 ? '' : `${coefPrefix(c)}${vars[i]}`)))
}

function systemLatex(rowsCoeffs: readonly (readonly number[])[], rhs: readonly number[], vars: readonly string[]): string {
  const lines = rowsCoeffs.map((row, i) => `${termsRow(row, vars)} = ${rhs[i]}`)
  return `\\begin{cases} ${lines.join(' \\\\ ')} \\end{cases}`
}

/** Names a row operation "R_t \\to R_t - kR_s" (or "+" when k is negative). */
function rowOpLatex(targetIdx: number, sourceIdx: number, k: number): string {
  const sign = k < 0 ? '+' : '-'
  const mag = Math.abs(k)
  const coef = mag === 1 ? '' : String(mag)
  return `R_${targetIdx + 1} \\to R_${targetIdx + 1} ${sign} ${coef}R_${sourceIdx + 1}`
}

interface GeneratedSystem {
  readonly problem: Problem
  /** The exact coefficient matrix shown in the statement. */
  readonly a: Mat
  /** The exact right-hand side shown in the statement. */
  readonly b: readonly number[]
}

function tier1(rng: Rng): GeneratedSystem {
  const x0 = rng.intExcept(-6, 6, [0])
  const y0 = rng.intExcept(-6, 6, [0])
  const a1 = rng.pick([1, 2, 3, -1, -2, -3])
  const b1 = rng.pick([1, 2, 3, -1, -2, -3])
  const m = rng.intExcept(-3, 3, [0])
  const a2 = m * a1
  let b2 = 0
  for (let i = 0; i < 200; i += 1) {
    const candidate = rng.intExcept(-4, 4, [0])
    if (candidate !== m * b1) {
      b2 = candidate
      break
    }
  }

  const c1 = a1 * x0 + b1 * y0
  const c2 = a2 * x0 + b2 * y0
  const a: Mat = [
    [a1, b1],
    [a2, b2],
  ]
  const b = [c1, c2]

  const M0 = [
    [a1, b1, c1],
    [a2, b2, c2],
  ]
  const b2r = b2 - m * b1
  const c2r = c2 - m * c1
  const M1 = [
    [a1, b1, c1],
    [0, b2r, c2r],
  ]

  const problem: Problem = {
    statement: `Solve the following system by Gaussian elimination: $${systemLatex([[a1, b1], [a2, b2]], [c1, c2], VARS2)}$`,
    answer: { kind: 'vector', components: [String(x0), String(y0)] },
    solution: [
      { text: 'Write the augmented matrix:', tex: augmentedLatex(M0) },
      { text: `Eliminate $x$ from the second row: $${rowOpLatex(1, 0, m)}$.`, tex: augmentedLatex(M1) },
      { text: 'The second row now has only $y$ in it:', tex: `${b2r}y = ${c2r} \\quad\\Rightarrow\\quad y = ${y0}` },
      {
        text: 'Substitute $y$ into the first row and solve for $x$:',
        tex: `${a1}x = ${c1} - ${paren(b1)}\\cdot${paren(y0)} \\quad\\Rightarrow\\quad x = ${x0}`,
      },
    ],
    hints: HINTS_ELIM_2,
    inputHint: INPUT_HINT_VECTOR,
  }
  return { problem, a, b }
}

function tier2(rng: Rng): GeneratedSystem {
  const diag = (): number => rng.pick([1, -1, 2, -2, 3, -3])
  const u11 = diag()
  const u12 = rng.int(-3, 3)
  const u13 = rng.int(-3, 3)
  const u22 = diag()
  const u23 = rng.int(-3, 3)
  const u33 = diag()
  const U: Mat = [
    [u11, u12, u13],
    [0, u22, u23],
    [0, 0, u33],
  ]

  const k21 = rng.intExcept(-2, 2, [0])
  const k32 = rng.intExcept(-2, 2, [0])
  let k31 = 0
  for (let i = 0; i < 200; i += 1) {
    const candidate = rng.intExcept(-2, 2, [0])
    if (candidate + k32 * k21 !== 0) {
      k31 = candidate
      break
    }
  }

  const row2 = U[1].map((v, i) => v + k21 * U[0][i])
  const row3a = U[2].map((v, i) => v + k31 * U[0][i])
  const row3 = row3a.map((v, i) => v + k32 * row2[i])
  const a: Mat = [U[0], row2, row3]

  const x0 = rng.intExcept(-6, 6, [0])
  const y0 = rng.intExcept(-6, 6, [0])
  const z0 = rng.intExcept(-6, 6, [0])
  const b = apply(a, [x0, y0, z0])

  const m21 = k21
  const m31 = k31 + k32 * k21
  const m32 = k32

  const M0 = a.map((row, i) => [...row, b[i]])
  const row2_1 = M0[1].map((v, j) => v - m21 * M0[0][j])
  const row3_1 = M0[2].map((v, j) => v - m31 * M0[0][j])
  const M1 = [M0[0], row2_1, row3_1]
  const row3_2 = M1[2].map((v, j) => v - m32 * M1[1][j])
  const M2 = [M1[0], M1[1], row3_2]

  const [ru11, ru12, ru13, rc1] = M2[0]
  const [, ru22, ru23, rc2] = M2[1]
  const [, , ru33, rc3] = M2[2]

  const problem: Problem = {
    statement: `Solve the following system by Gaussian elimination: $${systemLatex(a, b, VARS3)}$`,
    answer: { kind: 'vector', components: [String(x0), String(y0), String(z0)] },
    solution: [
      { text: 'Write the augmented matrix:', tex: augmentedLatex(M0) },
      {
        text: `Eliminate $x$ from rows 2 and 3: $${rowOpLatex(1, 0, m21)}$, $${rowOpLatex(2, 0, m31)}$.`,
        tex: augmentedLatex(M1),
      },
      {
        text: `Eliminate $y$ from row 3: $${rowOpLatex(2, 1, m32)}$. The matrix is now in row echelon form:`,
        tex: augmentedLatex(M2),
      },
      { text: 'The last row gives $z$ directly:', tex: `${ru33}z = ${rc3} \\quad\\Rightarrow\\quad z = ${z0}` },
      {
        text: 'Back-substitute into the second row to get $y$:',
        tex: `${ru22}y = ${rc2} - ${paren(ru23)}\\cdot${paren(z0)} \\quad\\Rightarrow\\quad y = ${y0}`,
      },
      {
        text: 'Back-substitute into the first row to get $x$:',
        tex: `${ru11}x = ${rc1} - ${paren(ru12)}\\cdot${paren(y0)} - ${paren(ru13)}\\cdot${paren(z0)} \\quad\\Rightarrow\\quad x = ${x0}`,
      },
    ],
    hints: HINTS_ELIM_3,
    inputHint: INPUT_HINT_VECTOR,
  }
  return { problem, a, b }
}

type Case = 'none' | 'infinite'

const OPTION_LABELS: Readonly<Record<'one' | Case, string>> = {
  one: 'Exactly one solution',
  none: 'No solution',
  infinite: 'Infinitely many solutions',
}

function tier3(rng: Rng): GeneratedSystem {
  const u11 = rng.pick([1, -1])
  const u12 = rng.int(-3, 3)
  const u13 = rng.int(-3, 3)
  const u22 = rng.pick([1, -1])
  const u23 = rng.int(-3, 3)

  const k21 = rng.intExcept(-2, 2, [0])
  const k32 = rng.intExcept(-2, 2, [0])
  let k31 = 0
  for (let i = 0; i < 200; i += 1) {
    const candidate = rng.intExcept(-2, 2, [0])
    if (candidate + k32 * k21 !== 0) {
      k31 = candidate
      break
    }
  }
  const m31 = k31 + k32 * k21
  const m32 = k32

  const row1 = [u11, u12, u13]
  const row2 = [0, u22, u23].map((v, i) => v + k21 * row1[i])
  const row3 = row1.map((v, i) => k31 * v + k32 * row2[i])
  const a: Mat = [row1, row2, row3]

  const b1 = rng.intExcept(-5, 5, [0])
  const b2 = rng.intExcept(-5, 5, [0])
  const kase: Case = rng.pick(['none', 'infinite'])
  const consistent = k31 * b1 + k32 * b2
  const b3 = kase === 'infinite' ? consistent : consistent + rng.pick([1, -1, 2, -2, 3])
  const b = [b1, b2, b3]

  const M0 = a.map((row, i) => [...row, b[i]])
  const row2_1 = M0[1].map((v, j) => v - k21 * M0[0][j])
  const row3_1 = M0[2].map((v, j) => v - m31 * M0[0][j])
  const M1 = [M0[0], row2_1, row3_1]
  const row3_2 = M1[2].map((v, j) => v - m32 * M1[1][j])
  const M2 = [M1[0], M1[1], row3_2]
  const finalConst = M2[2][3]
  const c2p = M1[1][3]

  const elimSteps: SolutionStep[] = [
    { text: 'Write the augmented matrix:', tex: augmentedLatex(M0) },
    {
      text: `Eliminate $x$ from rows 2 and 3: $${rowOpLatex(1, 0, k21)}$, $${rowOpLatex(2, 0, m31)}$.`,
      tex: augmentedLatex(M1),
    },
    { text: `Eliminate $y$ from row 3: $${rowOpLatex(2, 1, m32)}$.`, tex: augmentedLatex(M2) },
  ]

  const wantsParticular = kase === 'infinite' && rng.chance(0.5)

  if (wantsParticular) {
    const y0 = c2p * u22 // dividing by u22 = ±1 is the same as multiplying by it
    const x0 = (b1 - u12 * y0) * u11 // dividing by u11 = ±1 is the same as multiplying by it
    const problem: Problem = {
      statement: `This system has infinitely many solutions. Find the particular solution with $z = 0$: $${systemLatex(a, b, VARS3)}$`,
      answer: { kind: 'vector', components: [String(x0), String(y0), '0'] },
      solution: [
        ...elimSteps,
        { text: 'The last row reads $0 = 0$: it carries no information, so $z$ is free. Set $z = 0$ to get one particular solution.' },
        { text: 'The second row then gives $y$:', tex: `${u22}y = ${c2p} \\quad\\Rightarrow\\quad y = ${y0}` },
        {
          text: 'The first row gives $x$:',
          tex: `${u11}x = ${b1} - ${paren(u12)}\\cdot${paren(y0)} \\quad\\Rightarrow\\quad x = ${x0}`,
        },
        { text: 'Any other value of $z$ would give a different, equally valid solution — this is just one of infinitely many.' },
      ],
      hints: HINTS_DEGENERATE,
      inputHint: INPUT_HINT_VECTOR,
    }
    return { problem, a, b }
  }

  const finalLine: SolutionStep =
    kase === 'infinite'
      ? { text: `The last row reads $0 = 0$: it carries no new information, so one variable stays free — infinitely many solutions.` }
      : { text: `The last row reads $0 = ${finalConst}$, which is impossible — the system has no solution.` }

  const options: readonly ChoiceOption[] = rng.shuffle(
    (['one', 'none', 'infinite'] as const).map((id) => ({ id, label: OPTION_LABELS[id] })),
  )
  const problem: Problem = {
    statement: `How many solutions does the following system have? $${systemLatex(a, b, VARS3)}$`,
    answer: { kind: 'choice', options, correctId: kase },
    solution: [...elimSteps, finalLine],
    hints: HINTS_DEGENERATE,
  }
  return { problem, a, b }
}

export const template: SkillTemplate = {
  skillId: 'gauss_elim',
  theory,
  expectedSeconds: { 1: 70, 2: 220, 3: 180 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)).problem,
}

export { tier1, tier2, tier3 }
