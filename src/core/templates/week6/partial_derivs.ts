import { coefPrefix, joinTerms } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'A partial derivative $\\dfrac{\\partial f}{\\partial x}$ differentiates $f(x,y)$ with respect to $x$ while treating $y$ as a fixed constant — every ordinary differentiation rule still applies.',
  'Symmetrically, $\\dfrac{\\partial f}{\\partial y}$ treats $x$ as a fixed constant and differentiates with respect to $y$.',
  'The product and chain rules carry over unchanged, as long as the variable being held constant is never differentiated: e.g. $\\dfrac{\\partial}{\\partial x}\\left(x^{2}e^{y}\\right)=2xe^{y}$, since $e^{y}$ is just a constant factor from $x$\'s point of view.',
  'Second partial derivatives repeat the process: $f_{xx}=\\dfrac{\\partial}{\\partial x}\\left(\\dfrac{\\partial f}{\\partial x}\\right)$, and the mixed partial $f_{xy}=\\dfrac{\\partial}{\\partial y}\\left(\\dfrac{\\partial f}{\\partial x}\\right)$.',
  'For every function seen in this course, the mixed partials agree: $f_{xy}=f_{yx}$ — a useful check on your work.',
  'Common mistakes: differentiating the variable that should be held constant; forgetting the extra factor from the chain rule when the other variable sits inside $e^{(\\cdot)}$, $\\sin(\\cdot)$ or $\\ln(\\cdot)$; mixing up which variable a subscript like $f_{xy}$ means to differentiate first.',
].join('\n')

const HINTS_PARTIAL_X = [
  'Treat y as if it were a fixed number, and differentiate with respect to x exactly as in single-variable calculus.',
  'Apply the power rule $\\frac{\\partial}{\\partial x}x^{n}=nx^{n-1}$ to each term; a term with no x in it does not depend on x, so it differentiates to 0.',
]
const HINTS_PRODUCT_CHAIN = [
  'Hold the variable you are not differentiating fixed, then apply the product or chain rule exactly as in single-variable calculus.',
  'Identify which factor actually depends on the variable you are differentiating with respect to — everything else is just a constant multiplier.',
]
const HINTS_LN_SUM = [
  'The derivative of $\\ln(g)$ is $\\dfrac{1}{g}$ times the partial derivative of $g$ with respect to the variable you want.',
  'Differentiate $x^{2}+y^{2}$ with respect to that one variable, holding the other constant — the square of the other variable just disappears.',
]
const HINTS_SECOND_PARTIAL = [
  'Differentiate twice in sequence: find the first partial derivative first, then differentiate that result.',
  'For a mixed partial, the order does not matter for the functions in this course — $f_{xy}=f_{yx}$ — so differentiate in whichever order is easier.',
]
const HINTS_PARTIAL_POINT = [
  'Differentiate symbolically first, treating the other variable as a constant, before substituting any numbers.',
  'Substitute the point only after the partial derivative formula is complete, then simplify.',
]

const INPUT_HINT_XY = 'Enter an expression in x and y, e.g. 2xy+3'
const INPUT_HINT_XY_OR_CONST = 'Enter an expression in x and y (a plain number is fine if they cancel out), e.g. 2xy+3'
const INPUT_HINT_NUMBER = 'A single number; it may be negative'

/** Always-parenthesised substituted value, so a coefficient placed next to it is never mistaken for extra digits. */
function wrap(n: number): string {
  return `\\left(${n}\\right)`
}

/** k times the product of the given (already-LaTeX) factors. */
function coefTimes(k: number, factors: readonly string[]): string {
  const body = factors.join('\\cdot')
  if (k === 1) return body
  if (k === -1) return `-${body}`
  return `${k}\\cdot${body}`
}

function powVar(v: string, e: number): string {
  if (e === 0) return ''
  if (e === 1) return v
  return `${v}^{${e}}`
}

/** cx^{cx}y^{cy} as LaTeX, with the given coefficient. (0,0) is just the constant. */
function monomialLatex(coef: number, cx: number, cy: number): string {
  if (cx === 0 && cy === 0) return String(coef)
  return `${coefPrefix(coef)}${powVar('x', cx)}${powVar('y', cy)}`
}

// ---------- tier 1: partial w.r.t. x of a polynomial in x and y ----------

const HAS_X_PAIRS: readonly (readonly [number, number])[] = [
  [1, 0],
  [2, 0],
  [1, 1],
  [2, 1],
  [1, 2],
]
const OTHER_PAIRS: readonly (readonly [number, number])[] = [
  [0, 1],
  [0, 2],
  [0, 0],
]
const ALL_PAIRS: readonly (readonly [number, number])[] = [...HAS_X_PAIRS, ...OTHER_PAIRS]

/** `count` distinct (power of x, power of y) pairs, guaranteed to include at least one with x in it, ordered by total degree. */
function pickMonomialPairs(rng: Rng, count: number): (readonly [number, number])[] {
  const guaranteed = rng.pick(HAS_X_PAIRS)
  const rest = rng.shuffle(ALL_PAIRS.filter((p) => p !== guaranteed)).slice(0, count - 1)
  return [guaranteed, ...rest].sort((p, q) => q[0] + q[1] - (p[0] + p[1]) || q[0] - p[0])
}

function tier1(rng: Rng): Problem {
  const pairs = pickMonomialPairs(rng, 3)
  const monomials = pairs.map(([cx, cy]) => ({ coef: rng.intExcept(-6, 6, [0]), cx, cy }))
  const fLatex = joinTerms(monomials.map((m) => monomialLatex(m.coef, m.cx, m.cy)))
  const derivTerms = monomials.map((m) => (m.cx === 0 ? '0' : monomialLatex(m.coef * m.cx, m.cx - 1, m.cy)))
  const fxLatex = joinTerms(derivTerms)
  const transformations = monomials.map((m, i) => `${monomialLatex(m.coef, m.cx, m.cy)} \\to ${derivTerms[i]}`).join(', \\quad ')

  return {
    statement: `Find $\\dfrac{\\partial f}{\\partial x}$ for $f(x,y) = ${fLatex}$.`,
    answer: { kind: 'expression', value: fxLatex, variables: ['x', 'y'] },
    solution: [
      {
        text: 'Differentiate with respect to x, treating y as a constant. A term with no x in it is a constant with respect to x, so it differentiates to 0; otherwise apply the ordinary power rule to the power of x:',
        tex: transformations,
      },
      { text: 'Add the results:', tex: `\\dfrac{\\partial f}{\\partial x} = ${fxLatex}` },
    ],
    hints: HINTS_PARTIAL_X,
    inputHint: INPUT_HINT_XY,
  }
}

// ---------- tier 2: partial needing the product or chain rule ----------

type Wrt = 'x' | 'y'

function partialSymbol(wrt: Wrt): string {
  return `\\dfrac{\\partial f}{\\partial ${wrt}}`
}

function xSquaredExpY(rng: Rng, wrt: Wrt): Problem {
  const a = rng.intExcept(-4, 4, [0])
  const fLatex = `${coefPrefix(a)}x^{2}e^{y}`
  if (wrt === 'x') {
    const value = `${coefPrefix(2 * a)}xe^{y}`
    return {
      statement: `Find $${partialSymbol('x')}$ for $f(x,y) = ${fLatex}$.`,
      answer: { kind: 'expression', value, variables: ['x', 'y'] },
      solution: [{ text: 'Hold y constant, so $e^{y}$ acts as a constant factor; differentiate $x^{2}$ with the ordinary power rule:', tex: `${partialSymbol('x')} = ${coefPrefix(a)}\\cdot 2x\\cdot e^{y} = ${value}` }],
      hints: HINTS_PRODUCT_CHAIN,
      inputHint: INPUT_HINT_XY,
    }
  }
  const value = fLatex
  return {
    statement: `Find $${partialSymbol('y')}$ for $f(x,y) = ${fLatex}$.`,
    answer: { kind: 'expression', value, variables: ['x', 'y'] },
    solution: [{ text: 'Hold x constant, so $x^{2}$ acts as a constant factor; the derivative of $e^{y}$ is itself:', tex: `${partialSymbol('y')} = ${coefPrefix(a)}x^{2}\\cdot e^{y} = ${value}` }],
    hints: HINTS_PRODUCT_CHAIN,
    inputHint: INPUT_HINT_XY,
  }
}

function sinXY(rng: Rng, wrt: Wrt): Problem {
  const a = rng.intExcept(-4, 4, [0])
  const fLatex = `${coefPrefix(a)}\\sin\\left(xy\\right)`
  const other: Wrt = wrt === 'x' ? 'y' : 'x'
  const value = `${coefPrefix(a)}${other}\\cos\\left(xy\\right)`
  return {
    statement: `Find $${partialSymbol(wrt)}$ for $f(x,y) = ${fLatex}$.`,
    answer: { kind: 'expression', value, variables: ['x', 'y'] },
    solution: [
      { text: `The outer function is a sine; the inner function is $xy$. Its derivative with respect to ${wrt}, holding ${other} constant, is ${other}:`, tex: `\\dfrac{\\partial}{\\partial ${wrt}}(xy) = ${other}` },
      { text: 'Multiply by the derivative of the outer sine, $\\cos(xy)$:', tex: `${partialSymbol(wrt)} = ${coefPrefix(a)}\\cos\\left(xy\\right)\\cdot ${other} = ${value}` },
    ],
    hints: HINTS_PRODUCT_CHAIN,
    inputHint: INPUT_HINT_XY,
  }
}

const DOMAIN_LN_SUM = { x: [1, 3] as const, y: [1, 3] as const }

function lnSumSquares(wrt: Wrt): Problem {
  const fLatex = `\\ln\\left(x^{2}+y^{2}\\right)`
  const other: Wrt = wrt === 'x' ? 'y' : 'x'
  const value = wrt === 'x' ? `\\dfrac{2x}{x^{2}+y^{2}}` : `\\dfrac{2y}{x^{2}+y^{2}}`
  return {
    statement: `Find $${partialSymbol(wrt)}$ for $f(x,y) = ${fLatex}$.`,
    answer: { kind: 'expression', value, variables: ['x', 'y'], domain: DOMAIN_LN_SUM },
    solution: [
      { text: 'The outer function is a logarithm, with derivative 1 over its argument:', tex: `${partialSymbol(wrt)} = \\dfrac{1}{x^{2}+y^{2}}\\cdot\\dfrac{\\partial}{\\partial ${wrt}}\\left(x^{2}+y^{2}\\right)` },
      { text: `Differentiate the argument with respect to ${wrt}, holding ${other} constant:`, tex: `\\dfrac{\\partial}{\\partial ${wrt}}\\left(x^{2}+y^{2}\\right) = 2${wrt}` },
      { text: 'Combine:', tex: `${partialSymbol(wrt)} = ${value}` },
    ],
    hints: HINTS_LN_SUM,
    inputHint: INPUT_HINT_XY,
  }
}

function tier2(rng: Rng): Problem {
  const wrt = rng.pick<Wrt>(['x', 'y'])
  const branch = rng.pick(['xexpy', 'sinxy', 'lnsum'] as const)
  if (branch === 'xexpy') return xSquaredExpY(rng, wrt)
  if (branch === 'sinxy') return sinXY(rng, wrt)
  return lnSumSquares(wrt)
}

// ---------- tier 3: a second partial, or a partial evaluated at a point ----------

type SecondKind = 'fxx' | 'fyy' | 'fxy'

function secondPartial(rng: Rng): Problem {
  const kind = rng.pick<SecondKind>(['fxx', 'fyy', 'fxy'])
  const a = rng.intExcept(-3, 3, [0])
  const b = rng.intExcept(-3, 3, [0])
  const c = rng.intExcept(-4, 4, [0])
  const d = rng.int(-5, 5)
  // f = a x^3 + b x^2 y + c y^2 + d
  const fLatex = joinTerms([`${coefPrefix(a)}x^{3}`, `${coefPrefix(b)}x^{2}y`, `${coefPrefix(c)}y^{2}`, String(d)])
  const fx = joinTerms([`${coefPrefix(3 * a)}x^{2}`, `${coefPrefix(2 * b)}xy`])
  const fy = joinTerms([`${coefPrefix(b)}x^{2}`, `${coefPrefix(2 * c)}y`])
  const fxx = joinTerms([`${coefPrefix(6 * a)}x`, `${coefPrefix(2 * b)}y`])
  const fyy = String(2 * c)
  const fxy = `${coefPrefix(2 * b)}x`

  if (kind === 'fxx') {
    return {
      statement: `Find $f_{xx} = \\dfrac{\\partial^{2} f}{\\partial x^{2}}$ for $f(x,y) = ${fLatex}$.`,
      answer: { kind: 'expression', value: fxx, variables: ['x', 'y'] },
      solution: [
        { text: 'First find the partial derivative with respect to x, holding y constant:', tex: `f_{x} = ${fx}` },
        { text: 'Differentiate that result again with respect to x:', tex: `f_{xx} = ${fxx}` },
      ],
      hints: HINTS_SECOND_PARTIAL,
      inputHint: INPUT_HINT_XY_OR_CONST,
    }
  }
  if (kind === 'fyy') {
    return {
      statement: `Find $f_{yy} = \\dfrac{\\partial^{2} f}{\\partial y^{2}}$ for $f(x,y) = ${fLatex}$.`,
      answer: { kind: 'expression', value: fyy, variables: ['x', 'y'] },
      solution: [
        { text: 'First find the partial derivative with respect to y, holding x constant:', tex: `f_{y} = ${fy}` },
        { text: 'Differentiate that result again with respect to y:', tex: `f_{yy} = ${fyy}` },
      ],
      hints: HINTS_SECOND_PARTIAL,
      inputHint: INPUT_HINT_XY_OR_CONST,
    }
  }
  return {
    statement: `Find the mixed partial $f_{xy} = \\dfrac{\\partial^{2} f}{\\partial y\\,\\partial x}$ for $f(x,y) = ${fLatex}$.`,
    answer: { kind: 'expression', value: fxy, variables: ['x', 'y'] },
    solution: [
      { text: 'First find the partial derivative with respect to x, holding y constant:', tex: `f_{x} = ${fx}` },
      { text: 'Differentiate that result with respect to y, holding x constant:', tex: `f_{xy} = ${fxy}` },
      { text: 'This matches differentiating in the other order — $f_{xy}=f_{yx}$ for every function in this course:', tex: `f_{y} = ${fy}, \\quad f_{yx} = ${fxy}` },
    ],
    hints: HINTS_SECOND_PARTIAL,
    inputHint: INPUT_HINT_XY_OR_CONST,
  }
}

function partialAtPoint(rng: Rng): Problem {
  const a = rng.intExcept(-3, 3, [0])
  const b = rng.intExcept(-6, 6, [0])
  const c = rng.intExcept(-6, 6, [0])
  const x0 = rng.intExcept(-3, 3, [0])
  const y0 = rng.intExcept(-3, 3, [0])
  const wrt = rng.pick<Wrt>(['x', 'y'])
  // f = a x^2 y^2 + b x + c y
  const fLatex = joinTerms([`${coefPrefix(a)}x^{2}y^{2}`, `${coefPrefix(b)}x`, `${coefPrefix(c)}y`])

  if (wrt === 'x') {
    const derivLatex = joinTerms([`${coefPrefix(2 * a)}xy^{2}`, String(b)])
    const value = 2 * a * x0 * y0 * y0 + b
    const substituted = joinTerms([coefTimes(2 * a, [wrap(x0), `${wrap(y0)}^{2}`]), String(b)])
    const computed = joinTerms([String(2 * a * x0 * y0 * y0), String(b)])
    return {
      statement: `Let $f(x,y) = ${fLatex}$. Find $f_{x}(${x0}, ${y0})$.`,
      answer: { kind: 'number', value: String(value) },
      solution: [
        { text: 'Differentiate with respect to x, holding y constant:', tex: `f_{x}(x,y) = ${derivLatex}` },
        { text: 'Substitute the point and simplify:', tex: `f_{x}(${x0},${y0}) = ${substituted} = ${computed} = ${value}` },
      ],
      hints: HINTS_PARTIAL_POINT,
      inputHint: INPUT_HINT_NUMBER,
    }
  }

  const derivLatex = joinTerms([`${coefPrefix(2 * a)}x^{2}y`, String(c)])
  const value = 2 * a * x0 * x0 * y0 + c
  const substituted = joinTerms([coefTimes(2 * a, [`${wrap(x0)}^{2}`, wrap(y0)]), String(c)])
  const computed = joinTerms([String(2 * a * x0 * x0 * y0), String(c)])
  return {
    statement: `Let $f(x,y) = ${fLatex}$. Find $f_{y}(${x0}, ${y0})$.`,
    answer: { kind: 'number', value: String(value) },
    solution: [
      { text: 'Differentiate with respect to y, holding x constant:', tex: `f_{y}(x,y) = ${derivLatex}` },
      { text: 'Substitute the point and simplify:', tex: `f_{y}(${x0},${y0}) = ${substituted} = ${computed} = ${value}` },
    ],
    hints: HINTS_PARTIAL_POINT,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? secondPartial(rng) : partialAtPoint(rng)
}

export const template: SkillTemplate = {
  skillId: 'partial_derivs',
  theory,
  expectedSeconds: { 1: 55, 2: 95, 3: 135 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
