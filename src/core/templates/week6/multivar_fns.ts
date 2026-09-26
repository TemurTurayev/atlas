import { coefPrefix, joinTerms, linear } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'A function of two variables $f(x,y)$ assigns a single number to each point $(x,y)$ in the plane — evaluate it by substituting both coordinates, exactly as with a function of one variable.',
  'A level curve is the set of points where $f(x,y)=c$ for a fixed constant $c$; drawing several level curves for different values of $c$ is how a surface $z=f(x,y)$ is sketched in two dimensions.',
  'The shape of the level curves depends on $f$: $f(x,y)=x^{2}+y^{2}$ gives circles, $f(x,y)=ax+by$ gives parallel lines, $f(x,y)=xy$ gives hyperbolas, and $f(x,y)=y-x^{2}$ gives parabolas.',
  'The domain of $f(x,y)$ is the set of points where the formula is defined: a square root needs a nonnegative radicand, and a logarithm needs a strictly positive argument, exactly as for one variable.',
  'Solving $f(x,y)=c$ for $y$ treats $x$ and $c$ as known quantities and isolates $y$ with ordinary algebra.',
  'Common mistakes: substituting the coordinates in the wrong order (computing $f(y,x)$ instead of $f(x,y)$); forgetting that a domain restriction needs $\\ge$ or $>$, not $=$; treating a two-variable domain as a single interval instead of a region in the plane.',
].join('\n')

const HINTS_EVAL = ['Substitute the given x-value and y-value into the formula for f, in the order they appear.', 'Simplify each term separately, then add them up, following the usual order of operations.']
const HINTS_LEVEL_VALUE = ['The level curve f(x,y)=c through a point is the one where c equals f evaluated at that point.', 'Substitute the given x and y into the formula for f and simplify.']
const HINTS_LEVEL_SHAPE = [
  'Look at how x and y appear in the formula: as squares added together, as a plain linear combination, as a product or a difference of squares, or as one variable minus the square of the other.',
  'Imagine setting f(x,y) equal to a constant and think about what curve that equation describes.',
]
const HINTS_DOMAIN = ['A square root needs a nonnegative expression underneath it; a logarithm needs a strictly positive argument.', 'Rearrange the inequality so that x and y are on one side, and match it against the answer choices.']
const HINTS_SOLVE_Y = ['Substitute the given value of c into f(x,y)=c, then treat x as a known quantity.', 'Move every x-term to the other side, then divide both sides by the coefficient of y.']

const INPUT_HINT_NUMBER = 'A single number; it may be negative'
const INPUT_HINT_SOLVE_Y = 'Enter an expression in x; use / for a fraction, e.g. (5-3x)/2'

/** Always-parenthesised substituted value, so a coefficient placed next to it is never mistaken for extra digits. */
function wrap(n: number): string {
  return `\\left(${n}\\right)`
}

/** k times the product of the given (already-LaTeX) factors, e.g. coefTimes(-2, ['(3)','(4)^{2}']) -> "-2\\cdot(3)\\cdot(4)^{2}". */
function coefTimes(k: number, factors: readonly string[]): string {
  const body = factors.join('\\cdot')
  if (k === 1) return body
  if (k === -1) return `-${body}`
  return `${k}\\cdot${body}`
}

interface PointFn {
  readonly fLatex: string
  readonly samplePoint: (rng: Rng) => readonly [number, number]
  readonly evaluate: (x: number, y: number) => number
  readonly substituteTex: (x: number, y: number) => string
  readonly computeTex: (x: number, y: number) => string
}

function buildQuadF(rng: Rng): PointFn {
  const a = rng.intExcept(-4, 4, [0])
  const b = rng.intExcept(-4, 4, [0])
  const c = rng.int(-6, 6)
  return {
    fLatex: joinTerms([`${coefPrefix(a)}x^{2}`, `${coefPrefix(b)}y^{2}`, String(c)]),
    samplePoint: (r) => [r.intExcept(-4, 4, [0]), r.intExcept(-4, 4, [0])],
    evaluate: (x, y) => a * x * x + b * y * y + c,
    substituteTex: (x, y) => joinTerms([coefTimes(a, [`${wrap(x)}^{2}`]), coefTimes(b, [`${wrap(y)}^{2}`]), String(c)]),
    computeTex: (x, y) => joinTerms([String(a * x * x), String(b * y * y), String(c)]),
  }
}

function buildBilinearF(rng: Rng): PointFn {
  const a = rng.intExcept(-4, 4, [0])
  const b = rng.intExcept(-4, 4, [0])
  const c = rng.intExcept(-4, 4, [0])
  const d = rng.int(-6, 6)
  return {
    fLatex: joinTerms([`${coefPrefix(a)}xy`, `${coefPrefix(b)}x`, `${coefPrefix(c)}y`, String(d)]),
    samplePoint: (r) => [r.intExcept(-4, 4, [0]), r.intExcept(-4, 4, [0])],
    evaluate: (x, y) => a * x * y + b * x + c * y + d,
    substituteTex: (x, y) => joinTerms([coefTimes(a, [wrap(x), wrap(y)]), coefTimes(b, [wrap(x)]), coefTimes(c, [wrap(y)]), String(d)]),
    computeTex: (x, y) => joinTerms([String(a * x * y), String(b * x), String(c * y), String(d)]),
  }
}

function buildSqrtF(rng: Rng): PointFn {
  const a = rng.intExcept(-4, 4, [0])
  const b = rng.intExcept(-4, 4, [0])
  const c = rng.int(-6, 6)
  return {
    fLatex: joinTerms([`${coefPrefix(a)}\\sqrt{x}`, `${coefPrefix(b)}y`, String(c)]),
    samplePoint: (r) => [r.pick([1, 4, 9, 16]), r.intExcept(-4, 4, [0])],
    evaluate: (x, y) => a * Math.sqrt(x) + b * y + c,
    substituteTex: (x, y) => joinTerms([coefTimes(a, [`\\sqrt{${x}}`]), coefTimes(b, [wrap(y)]), String(c)]),
    computeTex: (x, y) => joinTerms([String(a * Math.sqrt(x)), String(b * y), String(c)]),
  }
}

const POINT_FN_BUILDERS: readonly ((rng: Rng) => PointFn)[] = [buildQuadF, buildBilinearF, buildSqrtF]

function tier1(rng: Rng): Problem {
  const f = rng.pick(POINT_FN_BUILDERS)(rng)
  const [x0, y0] = f.samplePoint(rng)
  const value = f.evaluate(x0, y0)
  return {
    statement: `Let $f(x,y) = ${f.fLatex}$. Find $f(${x0}, ${y0})$.`,
    answer: { kind: 'number', value: String(value) },
    solution: [
      { text: 'Substitute the given values for x and y:', tex: `f(${x0},${y0}) = ${f.substituteTex(x0, y0)}` },
      { text: 'Simplify each term and add:', tex: `${f.computeTex(x0, y0)} = ${value}` },
    ],
    hints: HINTS_EVAL,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function levelCurveValue(rng: Rng): Problem {
  const f = rng.pick(POINT_FN_BUILDERS)(rng)
  const [x0, y0] = f.samplePoint(rng)
  const c = f.evaluate(x0, y0)
  return {
    statement: `The level curve $f(x,y) = c$ of $f(x,y) = ${f.fLatex}$ passes through the point $(${x0}, ${y0})$. Find $c$.`,
    answer: { kind: 'number', value: String(c) },
    solution: [
      { text: 'A level curve $f(x,y)=c$ passes through a point exactly when that point satisfies the equation, so c is f evaluated there:', tex: `c = f(${x0},${y0})` },
      { text: 'Substitute and simplify:', tex: `c = ${f.substituteTex(x0, y0)} = ${c}` },
    ],
    hints: HINTS_LEVEL_VALUE,
    inputHint: INPUT_HINT_NUMBER,
  }
}

type ShapeFamily = 'circle' | 'line' | 'hyperbola' | 'parabola'

function shapeFLatex(rng: Rng, family: ShapeFamily): string {
  if (family === 'circle') {
    const a = rng.int(1, 3)
    return joinTerms([`${coefPrefix(a)}x^{2}`, `${coefPrefix(a)}y^{2}`])
  }
  if (family === 'line') {
    const a = rng.intExcept(-4, 4, [0])
    const b = rng.intExcept(-4, 4, [0])
    return joinTerms([`${coefPrefix(a)}x`, `${coefPrefix(b)}y`])
  }
  if (family === 'hyperbola') return rng.chance(0.5) ? 'xy' : joinTerms(['x^{2}', '-y^{2}'])
  return rng.chance(0.5) ? joinTerms(['y', '-x^{2}']) : joinTerms(['x^{2}', '-y'])
}

const SHAPE_LABEL: Record<ShapeFamily, string> = {
  circle: 'Concentric circles centered at the origin',
  line: 'Parallel straight lines',
  hyperbola: 'Hyperbolas',
  parabola: 'Parabolas',
}

const SHAPE_EXPLANATION: Record<ShapeFamily, string> = {
  circle: 'Setting $x^{2}+y^{2}$ equal to a positive constant is the equation of a circle centered at the origin — different constants give different radii, so the level curves are concentric circles.',
  line: 'Setting a linear combination of x and y equal to a constant is the equation of a straight line — different constants give a family of parallel lines.',
  hyperbola: 'Setting $xy$ (or $x^{2}-y^{2}$) equal to a nonzero constant is the equation of a hyperbola.',
  parabola: 'Solving the equation for one variable shows it equals the square of the other variable plus a constant — the equation of a parabola.',
}

function levelCurveShape(rng: Rng): Problem {
  const family = rng.pick<ShapeFamily>(['circle', 'line', 'hyperbola', 'parabola'])
  const fLatex = shapeFLatex(rng, family)
  const options: ChoiceOption[] = rng.shuffle(
    (['circle', 'line', 'hyperbola', 'parabola'] as const).map((fam) => ({ id: fam, label: SHAPE_LABEL[fam] })),
  )
  return {
    statement: `The level curves of $f(x,y) = ${fLatex}$ — that is, the curves $f(x,y)=c$ for different constants $c$ — are shaped like which of the following?`,
    answer: { kind: 'choice', options, correctId: family },
    solution: [{ text: SHAPE_EXPLANATION[family] }],
    hints: HINTS_LEVEL_SHAPE,
  }
}

function tier2(rng: Rng): Problem {
  return rng.chance(0.5) ? levelCurveValue(rng) : levelCurveShape(rng)
}

function domainDisk(rng: Rng): Problem {
  const r = rng.int(2, 6)
  const r2 = r * r
  const fLatex = `\\sqrt{${r2}-x^{2}-y^{2}}`
  const options: ChoiceOption[] = rng.shuffle([
    { id: 'correct', label: `A disk: $x^{2}+y^{2}\\le ${r2}$` },
    { id: 'outside', label: `Outside a disk: $x^{2}+y^{2}\\ge ${r2}$` },
    { id: 'open', label: `An open disk: $x^{2}+y^{2} < ${r2}$` },
    { id: 'wrong-bound', label: `A disk with the wrong radius: $x^{2}+y^{2}\\le ${r}$` },
  ])
  return {
    statement: `Find the domain of $f(x,y) = ${fLatex}$.`,
    answer: { kind: 'choice', options, correctId: 'correct' },
    solution: [
      { text: 'The expression under a square root cannot be negative:', tex: `${r2}-x^{2}-y^{2}\\ge 0` },
      { text: 'Rearrange into the domain condition:', tex: `x^{2}+y^{2}\\le ${r2}` },
    ],
    hints: HINTS_DOMAIN,
  }
}

function domainHalfPlane(rng: Rng): Problem {
  const a = rng.int(-5, 5)
  const argLatex = joinTerms(['x', '-y', String(a)])
  const fLatex = `\\ln\\left(${argLatex}\\right)`
  const rhs = linear(1, a, 'x')
  const rhsFlipped = linear(-1, a, 'x')
  const options: ChoiceOption[] = rng.shuffle([
    { id: 'correct', label: `$y < ${rhs}$` },
    { id: 'flip', label: `$y > ${rhs}$` },
    { id: 'nonstrict', label: `$y \\le ${rhs}$` },
    { id: 'signflip', label: `$y < ${rhsFlipped}$` },
  ])
  return {
    statement: `Find the domain of $f(x,y) = ${fLatex}$.`,
    answer: { kind: 'choice', options, correctId: 'correct' },
    solution: [
      { text: 'The argument of a logarithm must be strictly positive:', tex: `${argLatex} > 0` },
      { text: 'Solve for y, moving every other term to the other side:', tex: `y < ${rhs}` },
    ],
    hints: HINTS_DOMAIN,
  }
}

function solveForYLinear(rng: Rng): Problem {
  const a = rng.intExcept(-5, 5, [0])
  const bAbs = rng.pick([1, 2, 3])
  const bSign = rng.pick([1, -1])
  const b = bAbs * bSign
  const c = rng.int(-10, 10)
  const fLatex = joinTerms([`${coefPrefix(a)}x`, `${coefPrefix(b)}y`])

  // y = (c - a x) / b, normalised so the printed denominator is positive.
  let numA = -a
  let numC = c
  let denom = b
  if (denom < 0) {
    numA = -numA
    numC = -numC
    denom = -denom
  }
  const numeratorLatex = joinTerms([`${coefPrefix(numA)}x`, String(numC)])
  const answerValue = denom === 1 ? numeratorLatex : `\\dfrac{${numeratorLatex}}{${denom}}`

  const isolatedLatex = joinTerms([String(c), `${coefPrefix(-a)}x`])
  const byLatex = `${coefPrefix(b)}y`

  return {
    statement: `The level curve $f(x,y) = ${c}$ of $f(x,y) = ${fLatex}$ can be written as $y = \\,?$ Solve for $y$ in terms of $x$.`,
    answer: { kind: 'expression', value: answerValue, variables: ['x'] },
    solution: [
      { text: 'Set $f(x,y)$ equal to the given constant:', tex: `${fLatex} = ${c}` },
      { text: 'Isolate the y-term by moving the x-term to the other side:', tex: `${byLatex} = ${isolatedLatex}` },
      { text: 'Divide both sides by the coefficient of y:', tex: `y = ${answerValue}` },
    ],
    hints: HINTS_SOLVE_Y,
    inputHint: INPUT_HINT_SOLVE_Y,
  }
}

function tier3(rng: Rng): Problem {
  const branch = rng.pick(['disk', 'halfplane', 'solveY'] as const)
  if (branch === 'disk') return domainDisk(rng)
  if (branch === 'halfplane') return domainHalfPlane(rng)
  return solveForYLinear(rng)
}

export const template: SkillTemplate = {
  skillId: 'multivar_fns',
  theory,
  expectedSeconds: { 1: 45, 2: 85, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
