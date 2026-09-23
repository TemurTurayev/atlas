import { paren } from '../../math/latex'
import { det2, matLatex, type Mat } from '../../math/matrix'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'For a $2\\times2$ matrix $A=\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}$, the determinant is $\\det(A)=ad-bc$, a single number.',
  'A matrix is singular (not invertible) exactly when its determinant is zero.',
  'Scaling every entry by $k$ scales the determinant by $k^{2}$: $\\det(kA)=k^{2}\\det(A)$, because $k$ multiplies both rows.',
  'Determinants multiply under matrix multiplication: $\\det(AB)=\\det(A)\\det(B)$.',
  'Common mistakes: computing $bc-ad$ instead of $ad-bc$; dropping a sign from a negative entry; forgetting to square $k$ in $\\det(kA)$.',
].join('\n')

const HINTS_DET = [
  'The determinant of a $2\\times2$ matrix is the product of the main diagonal minus the product of the other diagonal.',
  'Multiply $a\\cdot d$ and $b\\cdot c$ separately, keeping track of signs, then subtract: $ad-bc$.',
]
const HINTS_SINGULAR = [
  'The matrix is singular exactly when $ad-bc=0$. Substitute the known entries, with the unknown in place, and set that equal to $0$.',
  'Isolate the unknown on one side of $ad-bc=0$, then divide by whatever multiplies it.',
]
const HINTS_PROPERTY = [
  'You do not need to build the new matrix first — a determinant property gets you there faster.',
  'For a $2\\times2$ matrix: $\\det(kA)=k^{2}\\det(A)$, and $\\det(AB)=\\det(A)\\det(B)$.',
]
const INPUT_HINT_NUMBER = 'A single whole number; it may be negative'

const detExpr = (a: Mat): string => `${paren(a[0][0])}\\cdot${paren(a[1][1])} - ${paren(a[0][1])}\\cdot${paren(a[1][0])}`

const randomNonzeroMat2 = (rng: Rng, lo = -6, hi = 6): number[][] =>
  Array.from({ length: 2 }, () => Array.from({ length: 2 }, () => rng.intExcept(lo, hi, [0])))

/** A 2×2 matrix of nonzero entries whose determinant is nonzero (not singular). */
export function buildNonsingular2x2(rng: Rng): Mat {
  let a: number[][] = []
  for (let i = 0; i < 200; i += 1) {
    a = randomNonzeroMat2(rng)
    if (det2(a) !== 0) break
  }
  return a
}

function tier1(rng: Rng): Problem {
  const a = buildNonsingular2x2(rng)
  const value = det2(a)
  const solution: SolutionStep[] = [
    {
      text: 'Multiply the main diagonal, multiply the other diagonal, then subtract:',
      tex: `\\det(A) = ${detExpr(a)} = ${a[0][0] * a[1][1]} - ${a[0][1] * a[1][0]} = ${value}`,
    },
  ]
  return {
    statement: `Compute the determinant of $A = ${matLatex(a)}$.`,
    answer: { kind: 'number', value: String(value) },
    solution,
    hints: HINTS_DET,
    inputHint: INPUT_HINT_NUMBER,
  }
}

type Pos = 0 | 1 | 2 | 3

export interface SingularCase {
  /** $[a, b, c, d]$ for $\begin{pmatrix}a&b\\c&d\end{pmatrix}$; `cells[unknownPos]` is the correct answer for the hidden entry. */
  readonly cells: readonly [number, number, number, number]
  readonly unknownPos: Pos
}

const partnerOf = (pos: Pos): Pos => (pos === 0 ? 3 : pos === 3 ? 0 : pos === 1 ? 2 : 1)

/**
 * Builds a matrix that is singular by construction and hides one entry as an unknown "t".
 * The other diagonal gets values `p = y*mult` and `q` (free); the diagonal partner of the
 * unknown gets `y`; the unknown itself is set to `q*mult`. Then, whichever diagonal the
 * unknown sits on, `ad - bc = y*(q*mult) - (y*mult)*q = 0` exactly — no division needed.
 */
export function buildSingularCase(rng: Rng): SingularCase {
  const positions: readonly Pos[] = [0, 1, 2, 3]
  const unknownPos = rng.pick(positions)
  const partnerPos = partnerOf(unknownPos)
  const otherDiag = positions.filter((i) => i !== unknownPos && i !== partnerPos) as [Pos, Pos]

  const y = rng.intExcept(-6, 6, [0])
  const mult = rng.intExcept(-4, 4, [0, 1, -1])
  const q = rng.intExcept(-6, 6, [0])
  const p = y * mult
  const answer = q * mult

  const cells: number[] = [0, 0, 0, 0]
  cells[partnerPos] = y
  const [pos1, pos2] = rng.chance(0.5) ? otherDiag : [otherDiag[1], otherDiag[0]]
  cells[pos1] = p
  cells[pos2] = q
  cells[unknownPos] = answer
  return { cells: cells as [number, number, number, number], unknownPos }
}

function tier2(rng: Rng): Problem {
  const { cells, unknownPos } = buildSingularCase(rng)
  const answer = cells[unknownPos]
  const partnerPos = partnerOf(unknownPos)
  const otherDiag = ([0, 1, 2, 3] as const).filter((i) => i !== unknownPos && i !== partnerPos)
  const partnerValue = cells[partnerPos]
  const knownProduct = cells[otherDiag[0]] * cells[otherDiag[1]]

  const dispCell = (pos: Pos): string => (pos === unknownPos ? 't' : String(cells[pos]))
  const eqCell = (pos: Pos): string => (pos === unknownPos ? 't' : paren(cells[pos]))
  const display = [
    [dispCell(0), dispCell(1)],
    [dispCell(2), dispCell(3)],
  ]

  const solution: SolutionStep[] = [
    {
      text: 'The matrix is singular exactly when its determinant is zero. Substitute the entries, with $t$ in place of the unknown one:',
      tex: `${eqCell(0)}\\cdot ${eqCell(3)} - ${eqCell(1)}\\cdot ${eqCell(2)} = 0`,
    },
    {
      text: 'Solve the resulting equation for $t$:',
      tex: `${partnerValue}t = ${knownProduct} \\quad\\Rightarrow\\quad t = \\dfrac{${knownProduct}}{${partnerValue}} = ${answer}`,
    },
  ]
  return {
    statement: `The matrix $A = ${matLatex(display)}$ is singular for exactly one value of $t$. Find it.`,
    answer: { kind: 'number', value: String(answer) },
    solution,
    hints: HINTS_SINGULAR,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function tier3Scale(rng: Rng): Problem {
  const a = buildNonsingular2x2(rng)
  const k = rng.intExcept(-4, 4, [0, 1])
  const detA = det2(a)
  const value = k * k * detA
  const solution: SolutionStep[] = [
    {
      text: 'Multiplying out $kA$ and expanding the determinant works, but it is quicker to use the scaling property: for a $2\\times2$ matrix, $\\det(kA)=k^{2}\\det(A)$.',
    },
    { text: 'Find $\\det(A)$ first:', tex: `\\det(A) = ${detExpr(a)} = ${detA}` },
    { text: 'Apply the property:', tex: `\\det(${k}A) = ${k}^{2}\\det(A) = ${k * k}\\cdot(${detA}) = ${value}` },
  ]
  return {
    statement: `Given $A = ${matLatex(a)}$, find $\\det(${k}A)$ without expanding $${k}A$ first.`,
    answer: { kind: 'number', value: String(value) },
    solution,
    hints: HINTS_PROPERTY,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function tier3Product(rng: Rng): Problem {
  const a = buildNonsingular2x2(rng)
  const b = buildNonsingular2x2(rng)
  const detA = det2(a)
  const detB = det2(b)
  const value = detA * detB
  const solution: SolutionStep[] = [
    {
      text: 'Multiplying $A$ and $B$ first and then taking the determinant works, but it is quicker to use the product property: $\\det(AB)=\\det(A)\\det(B)$.',
    },
    {
      text: 'Find each determinant separately:',
      tex: `\\det(A) = ${detExpr(a)} = ${detA}, \\qquad \\det(B) = ${detExpr(b)} = ${detB}`,
    },
    { text: 'Multiply the two determinants:', tex: `\\det(AB) = \\det(A)\\det(B) = (${detA})(${detB}) = ${value}` },
  ]
  return {
    statement: `Given $A = ${matLatex(a)}$ and $B = ${matLatex(b)}$, find $\\det(AB)$ without multiplying the matrices first.`,
    answer: { kind: 'number', value: String(value) },
    solution,
    hints: HINTS_PROPERTY,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? tier3Scale(rng) : tier3Product(rng)
}

export const template: SkillTemplate = {
  skillId: 'det_2x2',
  theory,
  expectedSeconds: { 1: 25, 2: 60, 3: 70 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
