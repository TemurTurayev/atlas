import { coefPrefix, joinTerms, paren } from '../../math/latex'
import { polyToLatex } from '../../math/poly'
import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Power rule: $\\dfrac{d}{dx}x^{n}=nx^{n-1}$ — multiply by the exponent, then lower it by one; a constant term always differentiates to $0$.',
  'Standard derivatives to know by heart: $\\dfrac{d}{dx}e^{x}=e^{x}$, $\\dfrac{d}{dx}\\ln x=\\dfrac{1}{x}$, $\\dfrac{d}{dx}\\sin x=\\cos x$, $\\dfrac{d}{dx}\\cos x=-\\sin x$.',
  'Sum rule: differentiate a sum term by term — $\\dfrac{d}{dx}\\left[f(x)+g(x)\\right]=f\'(x)+g\'(x)$ — and a constant multiplier just rides along.',
  'A radical or a variable in the denominator is a power of $x$ in disguise: $\\sqrt{x}=x^{1/2}$ and $\\dfrac{1}{x^{n}}=x^{-n}$; rewrite it that way before differentiating.',
  'Common mistakes: forgetting that a lone constant differentiates to $0$; differentiating $\\ln x$ as $\\dfrac{1}{\\ln x}$ instead of $\\dfrac{1}{x}$; leaving a radical or a fraction un-rewritten and trying to apply the power rule to it directly.',
].join('\n')

const HINTS_POWER_RULE = [
  'Differentiate term by term; a lone constant term disappears (its derivative is $0$).',
  'For each term $cx^{n}$, multiply the coefficient by the exponent and lower the exponent by one: $\\dfrac{d}{dx}(cx^{n})=ncx^{n-1}$.',
]
const HINTS_STANDARD = [
  'Differentiate the sum term by term — each standard function has its own derivative rule, independent of the others.',
  'Recall: $(x^{n})\'=nx^{n-1}$, $(e^{x})\'=e^{x}$, $(\\ln x)\'=\\frac{1}{x}$, $(\\sin x)\'=\\cos x$, $(\\cos x)\'=-\\sin x$.',
]
const HINTS_REWRITE = [
  'Rewrite the radical and the fraction as powers of $x$ first — $\\sqrt{x}=x^{1/2}$ and $\\dfrac{1}{x^{n}}=x^{-n}$ — then the power rule applies directly.',
  'Multiply each coefficient by its exponent and lower the exponent by one, exactly as with any other power of $x$.',
]
const HINTS_POINT_REWRITE = [
  'Rewrite the radical or the fraction as a power of $x$ first, then differentiate with the ordinary power rule.',
  'Differentiate, substitute the given point, and simplify the resulting fraction.',
]

const INPUT_HINT_POLY = 'Enter an expression in x, e.g. 3x^2-4x+1'
const INPUT_HINT_MIXED = 'Enter an expression in x, e.g. 2x+e^x-1/x'
const INPUT_HINT_REWRITTEN = 'Enter an expression in x, using fractional or negative exponents, e.g. 2x^(-1/2)-3x^(-3)'
const INPUT_HINT_FRACTION = 'A single number; write a fraction with /, e.g. -3/4'

const DOMAIN_POSITIVE = { x: [0.5, 3] as const }

/** cx^k as LaTeX, k >= 0 (k=0 is just the constant c, k=1 drops the exponent). */
function termLatex(c: number, k: number): string {
  if (k === 0) return String(c)
  if (k === 1) return `${coefPrefix(c)}x`
  return `${coefPrefix(c)}x^{${k}}`
}

function tier1(rng: Rng): Problem {
  const degree = rng.pick([2, 3, 4])
  const poly: number[] = Array.from({ length: degree + 1 }, () => rng.int(-6, 6))
  poly[degree] = rng.intExcept(-5, 5, [0])

  const fLatex = polyToLatex(poly)
  const deriv = poly.slice(1).map((c, i) => c * (i + 1))
  const fprimeLatex = polyToLatex(deriv)

  const transformations = poly
    .map((c, k) => ({ c, k }))
    .filter(({ c }) => c !== 0)
    .reverse()
    .map(({ c, k }) => `${termLatex(c, k)} \\to ${k === 0 ? '0' : termLatex(c * k, k - 1)}`)
    .join(', \\quad ')

  return {
    statement: `Differentiate: $f(x) = ${fLatex}$.`,
    answer: { kind: 'expression', value: fprimeLatex, variables: ['x'] },
    solution: [
      {
        text: 'Differentiate each term with the power rule $\\dfrac{d}{dx}x^{n}=nx^{n-1}$ (a lone constant differentiates to $0$):',
        tex: transformations,
      },
      { text: 'Add the results:', tex: `f'(x) = ${fprimeLatex}` },
    ],
    hints: HINTS_POWER_RULE,
    inputHint: INPUT_HINT_POLY,
  }
}

interface TermResult {
  readonly display: string
  readonly derivDisplay: string
}

function powTerm(coef: number, exp: number): TermResult {
  const display = termLatex(coef, exp)
  const dCoef = coef * exp
  const dExp = exp - 1
  return { display, derivDisplay: termLatex(dCoef, dExp) }
}

function expTerm(coef: number): TermResult {
  const display = `${coefPrefix(coef)}e^{x}`
  return { display, derivDisplay: display }
}

function logTerm(coef: number): TermResult {
  const display = `${coefPrefix(coef)}\\ln x`
  const derivDisplay = coef < 0 ? `-\\frac{${-coef}}{x}` : `\\frac{${coef}}{x}`
  return { display, derivDisplay }
}

function sinTerm(coef: number): TermResult {
  return { display: `${coefPrefix(coef)}\\sin x`, derivDisplay: `${coefPrefix(coef)}\\cos x` }
}

function cosTerm(coef: number): TermResult {
  return { display: `${coefPrefix(coef)}\\cos x`, derivDisplay: `${coefPrefix(-coef)}\\sin x` }
}

const TERM_BUILDERS: readonly ((rng: Rng) => TermResult)[] = [
  (rng) => powTerm(rng.intExcept(-4, 4, [0]), rng.pick([2, 3])),
  (rng) => expTerm(rng.intExcept(-4, 4, [0])),
  (rng) => logTerm(rng.intExcept(-4, 4, [0])),
  (rng) => sinTerm(rng.intExcept(-4, 4, [0])),
  (rng) => cosTerm(rng.intExcept(-4, 4, [0])),
]

function tier2(rng: Rng): Problem {
  const chosen = rng.shuffle([0, 1, 2, 3, 4]).slice(0, 3).sort((a, b) => a - b)
  const parts = chosen.map((i) => TERM_BUILDERS[i](rng))

  const fLatex = joinTerms(parts.map((p) => p.display))
  const fprimeLatex = joinTerms(parts.map((p) => p.derivDisplay))
  const transformations = parts.map((p) => `${p.display} \\to ${p.derivDisplay}`).join(', \\quad ')

  return {
    statement: `Differentiate: $f(x) = ${fLatex}$.`,
    answer: { kind: 'expression', value: fprimeLatex, variables: ['x'], domain: DOMAIN_POSITIVE },
    solution: [
      {
        text: 'Differentiate each term with its own standard derivative — $\\dfrac{d}{dx}x^{n}=nx^{n-1}$, $\\dfrac{d}{dx}e^{x}=e^{x}$, $\\dfrac{d}{dx}\\ln x=\\frac{1}{x}$, $\\dfrac{d}{dx}\\sin x=\\cos x$, $\\dfrac{d}{dx}\\cos x=-\\sin x$:',
        tex: transformations,
      },
      { text: 'Add the results:', tex: `f'(x) = ${fprimeLatex}` },
    ],
    hints: HINTS_STANDARD,
    inputHint: INPUT_HINT_MIXED,
  }
}

function tier3Expression(rng: Rng): Problem {
  const halfA = rng.intExcept(-4, 4, [0])
  const b = rng.intExcept(-4, 4, [0])
  const a = 2 * halfA

  const term1 = `${coefPrefix(a)}\\sqrt{x}`
  const term2 = b < 0 ? `-\\frac{${-b}}{x^{2}}` : `\\frac{${b}}{x^{2}}`
  const fLatex = joinTerms([term1, term2])

  const term1Rewritten = `${coefPrefix(a)}x^{\\frac{1}{2}}`
  const term2Rewritten = termLatex(b, -2)
  const fRewrittenLatex = joinTerms([term1Rewritten, term2Rewritten])

  const derivTerm1 = `${coefPrefix(halfA)}x^{-\\frac{1}{2}}`
  const negTwoB = -2 * b
  const derivTerm2 = termLatex(negTwoB, -3)
  const fprimeLatex = joinTerms([derivTerm1, derivTerm2])

  return {
    statement: `Differentiate $f(x) = ${fLatex}$. Rewrite each term as a power of $x$ first.`,
    answer: { kind: 'expression', value: fprimeLatex, variables: ['x'], domain: DOMAIN_POSITIVE },
    solution: [
      {
        text: 'Rewrite each term as a power of $x$: $\\sqrt{x}=x^{1/2}$ and $\\dfrac{1}{x^{2}}=x^{-2}$:',
        tex: `f(x) = ${fRewrittenLatex}`,
      },
      {
        text: 'Apply the power rule $\\dfrac{d}{dx}x^{n}=nx^{n-1}$ to each term:',
        tex: `${term1Rewritten} \\to ${derivTerm1}, \\quad ${term2Rewritten} \\to ${derivTerm2}`,
      },
      { text: 'Add the results:', tex: `f'(x) = ${fprimeLatex}` },
    ],
    hints: HINTS_REWRITE,
    inputHint: INPUT_HINT_REWRITTEN,
  }
}

function tier3SqrtAtPoint(rng: Rng): Problem {
  const k = rng.int(1, 4)
  const a = k * k
  const coefA = rng.intExcept(-6, 6, [0])
  const value = rat(coefA, 2 * k)
  const valueLatex = ratToLatex(value)
  const fLatex = `${coefPrefix(coefA)}\\sqrt{x}`

  return {
    statement: `Let $f(x) = ${fLatex}$. Find $f'(${a})$.`,
    answer: { kind: 'number', value: valueLatex },
    solution: [
      { text: 'Rewrite as a power of $x$: $\\sqrt{x}=x^{1/2}$:', tex: `f(x) = ${coefPrefix(coefA)}x^{\\frac{1}{2}}` },
      {
        text: 'Differentiate with the power rule, then rewrite back with a radical:',
        tex: `f'(x) = ${coefPrefix(coefA)}\\cdot\\frac{1}{2}x^{-\\frac{1}{2}} = \\frac{${coefA}}{2\\sqrt{x}}`,
      },
      { text: `Substitute $x=${a}$, where $\\sqrt{${a}}=${k}$:`, tex: `f'(${a}) = \\frac{${coefA}}{2\\cdot ${k}} = ${valueLatex}` },
    ],
    hints: HINTS_POINT_REWRITE,
    inputHint: INPUT_HINT_FRACTION,
  }
}

function tier3ReciprocalSquareAtPoint(rng: Rng): Problem {
  const a = rng.pick([-3, -2, -1, 1, 2, 3])
  const b = rng.intExcept(-6, 6, [0])
  const negTwoB = -2 * b
  const value = rat(negTwoB, a * a * a)
  const valueLatex = ratToLatex(value)
  const fLatex = b < 0 ? `-\\frac{${-b}}{x^{2}}` : `\\frac{${b}}{x^{2}}`

  return {
    statement: `Let $f(x) = ${fLatex}$. Find $f'(${a})$.`,
    answer: { kind: 'number', value: valueLatex },
    solution: [
      { text: 'Rewrite as a power of $x$: $\\dfrac{1}{x^{2}}=x^{-2}$:', tex: `f(x) = ${termLatex(b, -2)}` },
      {
        text: 'Differentiate with the power rule, then rewrite back as a fraction:',
        tex: `f'(x) = ${termLatex(negTwoB, -3)} = \\frac{${negTwoB}}{x^{3}}`,
      },
      { text: `Substitute $x=${a}$:`, tex: `f'(${a}) = \\frac{${negTwoB}}{${paren(a)}^{3}} = \\frac{${negTwoB}}{${a ** 3}} = ${valueLatex}` },
    ],
    hints: HINTS_POINT_REWRITE,
    inputHint: INPUT_HINT_FRACTION,
  }
}

function tier3(rng: Rng): Problem {
  if (rng.chance(0.5)) return tier3Expression(rng)
  return rng.chance(0.5) ? tier3SqrtAtPoint(rng) : tier3ReciprocalSquareAtPoint(rng)
}

export const template: SkillTemplate = {
  skillId: 'diff_rules',
  theory,
  expectedSeconds: { 1: 60, 2: 100, 3: 130 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
