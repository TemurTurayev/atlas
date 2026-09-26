import { coefPrefix, joinTerms } from '../../math/latex'
import { adjugate2, apply, det2, matLatex, type Mat } from '../../math/matrix'
import { rat, ratToLatex } from '../../math/rational'
import { vecLatex } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'At a critical point of $f(x,y)$ both partial derivatives vanish: $f_x=0$ and $f_y=0$ — solve this pair of equations simultaneously to find it.',
  'The second derivative test classifies a critical point using the discriminant $D=f_{xx}f_{yy}-f_{xy}^{2}$, all evaluated at that point.',
  'If $D>0$ and $f_{xx}>0$ the point is a local minimum; if $D>0$ and $f_{xx}<0$ it is a local maximum; if $D<0$ it is a saddle point.',
  'If $D=0$ the test is inconclusive — the point could be a minimum, a maximum, a saddle, or something else, and a different method is needed.',
  'For a quadratic $f(x,y)=Ax^{2}+By^{2}+Cxy+\\dots$, the second derivatives are constants everywhere: $f_{xx}=2A$, $f_{yy}=2B$, $f_{xy}=C$ — no substitution is needed for the Hessian entries themselves.',
  'Common mistakes: forgetting to square $f_{xy}$ in the discriminant; using the sign of $f_{yy}$ instead of $f_{xx}$ to tell a maximum from a minimum; calling a point a saddle just because $f_{xx}$ and $f_{yy}$ have opposite signs, without actually computing $D$.',
].join('\n')

const HINTS_SYSTEM = [
  'Differentiate to get $f_x$ and $f_y$, then set both equal to zero — this is a system of two linear equations in $x$ and $y$.',
  'Write the system as a matrix equation and solve it with the adjugate and determinant, exactly as with any $2\\times2$ system.',
]
const HINTS_DISCRIMINANT = [
  'Compute the three second derivatives $f_{xx}$, $f_{yy}$, $f_{xy}$ — for this function they are constants, so no substitution is needed.',
  'Form $D=f_{xx}f_{yy}-f_{xy}^{2}$: a positive $D$ with $f_{xx}>0$ is a minimum, a positive $D$ with $f_{xx}<0$ is a maximum, and a negative $D$ is a saddle point.',
]
const HINTS_TIER3_POINT = [
  'Differentiate to get $f_x$ and $f_y$, set both to zero, and solve the resulting $2\\times2$ system for $(x,y)$.',
  'The type of critical point (minimum, maximum or saddle) does not change which coordinates you report here.',
]
const HINTS_TIER3_CLASSIFY = [
  'First solve $f_x=0,\\,f_y=0$ to locate the critical point — but to classify it, only the second derivatives $f_{xx}$, $f_{yy}$, $f_{xy}$ matter.',
  'Form the discriminant $D=f_{xx}f_{yy}-f_{xy}^{2}$: positive with $f_{xx}>0$ is a minimum, positive with $f_{xx}<0$ is a maximum, negative is a saddle point.',
]
const HINTS_TIER3_VALUE = [
  'First solve $f_x=0,\\,f_y=0$ to locate the critical point $(x,y)$.',
  'Substitute those coordinates into $f(x,y)$ itself, not into the derivatives, to get its value there.',
]

const INPUT_HINT_POINT = 'Two numbers, top to bottom: the x-coordinate then the y-coordinate'
const INPUT_HINT_NUMBER = 'A single number; it may be negative'

/** A monomial like "3x^{2}" or "-xy"; empty when the coefficient is 0. */
const term = (coef: number, suffix: string): string => (coef === 0 ? '' : `${coefPrefix(coef)}${suffix}`)

type ClassKind = 'min' | 'max' | 'saddle'
type ClassifyId = ClassKind | 'inconclusive'

const CLASSIFY_LABELS: Readonly<Record<ClassifyId, string>> = {
  min: 'local minimum',
  max: 'local maximum',
  saddle: 'saddle point',
  inconclusive: 'the test is inconclusive',
}
const CLASSIFY_IDS: readonly ClassifyId[] = ['min', 'max', 'saddle', 'inconclusive']
const KINDS: readonly ClassKind[] = ['min', 'max', 'saddle']

function classifyOptions(rng: Rng): ChoiceOption[] {
  return rng.shuffle(CLASSIFY_IDS.map((id) => ({ id, label: CLASSIFY_LABELS[id] })))
}

/**
 * A,B,C for f_xx=2A, f_yy=2B, f_xy=C matching the requested kind: opposite signs of A,B always give
 * a negative discriminant (saddle); same sign with |C| bounded below 2*sqrt(|4AB|) always gives a
 * positive one (min if positive, max if negative).
 */
function buildHessian(rng: Rng, kind: ClassKind): { readonly A: number; readonly B: number; readonly C: number } {
  if (kind === 'saddle') {
    const magA = rng.int(1, 3)
    const magB = rng.int(1, 3)
    const A = rng.chance(0.5) ? magA : -magA
    const B = A > 0 ? -magB : magB
    const C = rng.int(-2, 2)
    return { A, B, C }
  }
  const magA = rng.int(1, 3)
  const magB = rng.int(1, 3)
  const sign = kind === 'min' ? 1 : -1
  const A = sign * magA
  const B = sign * magB
  const bound = Math.floor(Math.sqrt(4 * magA * magB - 1))
  const C = rng.int(-bound, bound)
  return { A, B, C }
}

interface ClassifyCase {
  readonly A: number
  readonly B: number
  readonly C: number
  readonly D: number
  readonly E: number
  readonly F: number
  readonly a: number
  readonly b: number
  readonly detM: number
  readonly classification: ClassKind
}

/** Builds a quadratic with a genuine critical point at (a,b), classified by its own Hessian. */
function buildClassifyCase(rng: Rng): ClassifyCase {
  const kind = rng.pick(KINDS)
  const { A, B, C } = buildHessian(rng, kind)
  const a = rng.int(-4, 4)
  const b = rng.int(-4, 4)
  const D = -(2 * A * a + C * b)
  const E = -(C * a + 2 * B * b)
  const F = rng.int(-5, 5)
  const detM = 4 * A * B - C * C
  const classification: ClassKind = detM < 0 ? 'saddle' : A > 0 ? 'min' : 'max'
  return { A, B, C, D, E, F, a, b, detM, classification }
}

const fLatex = (c: ClassifyCase): string =>
  joinTerms([term(c.A, 'x^{2}'), term(c.B, 'y^{2}'), term(c.C, 'xy'), term(c.D, 'x'), term(c.E, 'y'), c.F !== 0 ? String(c.F) : ''])

/** The (x,y) solving f_x=0, f_y=0, plus the matrix/vector/adjugate steps used to present it. */
function solveCriticalPoint(c: ClassifyCase) {
  const M: Mat = [
    [2 * c.A, c.C],
    [c.C, 2 * c.B],
  ]
  const rhs = [-c.D, -c.E]
  const detM = det2(M)
  const adjRhs = apply(adjugate2(M), rhs)
  const xLatex = ratToLatex(rat(adjRhs[0], detM))
  const yLatex = ratToLatex(rat(adjRhs[1], detM))
  const fxEq = joinTerms([term(2 * c.A, 'x'), term(c.C, 'y'), c.D !== 0 ? String(c.D) : ''])
  const fyEq = joinTerms([term(c.C, 'x'), term(2 * c.B, 'y'), c.E !== 0 ? String(c.E) : ''])
  return { M, rhs, detM, adjRhs, xLatex, yLatex, fxEq, fyEq }
}

function tier1(rng: Rng): Problem {
  const c = buildClassifyCase(rng)
  const { M, rhs, detM, adjRhs, xLatex, yLatex, fxEq, fyEq } = solveCriticalPoint(c)

  return {
    statement: `Find the critical point of $f(x,y) = ${fLatex(c)}$ (where $f_x=0$ and $f_y=0$).`,
    answer: { kind: 'vector', components: [String(c.a), String(c.b)] },
    solution: [
      { text: 'Differentiate and set both partial derivatives to zero:', tex: `f_x:\\; ${fxEq} = 0, \\qquad f_y:\\; ${fyEq} = 0` },
      {
        text: 'This is a $2\\times2$ system in $x$ and $y$. Write it as a matrix equation:',
        tex: `${matLatex(M)}\\begin{pmatrix} x \\\\ y \\end{pmatrix} = ${vecLatex(rhs)}`,
      },
      {
        text: `The determinant is $${detM}$; apply the adjugate to the right-hand side and divide by it, exactly as with any $2\\times2$ system:`,
        tex: `(x,y) = \\dfrac{1}{${detM}}${vecLatex(adjRhs)} = ${vecLatex([xLatex, yLatex])}`,
      },
    ],
    hints: HINTS_SYSTEM,
    inputHint: INPUT_HINT_POINT,
  }
}

function classifySteps(c: ClassifyCase): readonly SolutionStep[] {
  const fxx = 2 * c.A
  const fyy = 2 * c.B
  const fxy = c.C
  return [
    { text: 'For this quadratic, the second derivatives are constants — no substitution needed:', tex: `f_{xx} = ${fxx}, \\qquad f_{yy} = ${fyy}, \\qquad f_{xy} = ${fxy}` },
    { text: 'Form the discriminant:', tex: `D = f_{xx}f_{yy} - f_{xy}^{2} = ${c.detM}` },
  ]
}

function classifyReason(c: ClassifyCase): string {
  const fxx = 2 * c.A
  if (c.classification === 'saddle') return `Since $D<0$, the point $(${c.a}, ${c.b})$ is a saddle point.`
  if (c.classification === 'min') return `Since $D>0$ and $f_{xx}=${fxx}>0$, the point $(${c.a}, ${c.b})$ is a local minimum.`
  return `Since $D>0$ and $f_{xx}=${fxx}<0$, the point $(${c.a}, ${c.b})$ is a local maximum.`
}

function tier2(rng: Rng): Problem {
  const c = buildClassifyCase(rng)
  const options = classifyOptions(rng)

  return {
    statement: `The point $(${c.a}, ${c.b})$ is a critical point of $f(x,y) = ${fLatex(c)}$. Classify it using the second derivative test.`,
    answer: { kind: 'choice', options, correctId: c.classification },
    solution: [...classifySteps(c), { text: classifyReason(c) }],
    hints: HINTS_DISCRIMINANT,
  }
}

type Tier3Variant = 'point' | 'classify' | 'value'
const TIER3_VARIANTS: readonly Tier3Variant[] = ['point', 'classify', 'value']

function tier3(rng: Rng): Problem {
  const c = buildClassifyCase(rng)
  const variant = rng.pick(TIER3_VARIANTS)
  const { M, rhs, detM, adjRhs, xLatex, yLatex, fxEq, fyEq } = solveCriticalPoint(c)

  const solveSteps: readonly SolutionStep[] = [
    { text: 'Differentiate and set both partial derivatives to zero:', tex: `f_x:\\; ${fxEq} = 0, \\qquad f_y:\\; ${fyEq} = 0` },
    {
      text: 'Solve this $2\\times2$ system with the adjugate and determinant, as with any $2\\times2$ system:',
      tex: `${matLatex(M)}\\begin{pmatrix} x \\\\ y \\end{pmatrix} = ${vecLatex(rhs)} \\;\\Longrightarrow\\; (x,y) = \\dfrac{1}{${detM}}${vecLatex(adjRhs)} = ${vecLatex([xLatex, yLatex])}`,
    },
  ]
  const intro = `Find the critical point of $f(x,y) = ${fLatex(c)}$, then determine whether it is a local minimum, a local maximum or a saddle point.`

  if (variant === 'point') {
    return {
      statement: `${intro} (Enter the critical point below.)`,
      answer: { kind: 'vector', components: [String(c.a), String(c.b)] },
      solution: [...solveSteps, ...classifySteps(c), { text: classifyReason(c) }],
      hints: HINTS_TIER3_POINT,
      inputHint: INPUT_HINT_POINT,
    }
  }

  if (variant === 'classify') {
    const options = classifyOptions(rng)
    return {
      statement: `${intro} (Enter the classification below.)`,
      answer: { kind: 'choice', options, correctId: c.classification },
      solution: [...solveSteps, ...classifySteps(c), { text: classifyReason(c) }],
      hints: HINTS_TIER3_CLASSIFY,
    }
  }

  const value = c.A * c.a * c.a + c.B * c.b * c.b + c.C * c.a * c.b + c.D * c.a + c.E * c.b + c.F
  return {
    statement: `Find the critical point of $f(x,y) = ${fLatex(c)}$, then evaluate $f$ there.`,
    answer: { kind: 'number', value: String(value) },
    solution: [...solveSteps, { text: `Substitute $(${c.a}, ${c.b})$ into $f$ itself (not into the derivatives):`, tex: `f(${c.a},${c.b}) = ${value}` }],
    hints: HINTS_TIER3_VALUE,
    inputHint: INPUT_HINT_NUMBER,
  }
}

export const template: SkillTemplate = {
  skillId: 'critical_2d',
  theory,
  expectedSeconds: { 1: 110, 2: 90, 3: 140 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
