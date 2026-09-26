import { coefPrefix, linear } from '../../math/latex'
import { equals, isInteger, rat, type Rational } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  "U-substitution reverses the chain rule: pick an inner function $u=g(x)$ whose derivative $du=g'(x)\\,dx$ also appears (up to a constant factor) in the integral.",
  'Rewrite the whole integral in terms of $u$ only — every $x$ should disappear — integrate using the basic rules, then substitute $g(x)$ back in for $u$.',
  'For a linear inner function $u=ax+b$, $du=a\\,dx$, so $dx=\\dfrac{du}{a}$: this only rescales the antiderivative by $\\dfrac{1}{a}$.',
  'For a definite integral, convert the limits of integration to $u$-values at the same time as the substitution, and never switch back to $x$.',
  'A quick check afterwards: differentiate your answer — you should recover the original integrand.',
  'Common mistakes: forgetting the factor $\\frac{1}{a}$ (or $\\frac{1}{g\'(x)}$) introduced by $dx=\\frac{du}{g\'(x)}$; and, for a definite integral, evaluating the $u$-antiderivative at the original $x$-limits instead of the converted ones.',
].join('\n')

function ratCoefPrefix(r: Rational): string {
  if (equals(r, rat(1))) return ''
  if (equals(r, rat(-1))) return '-'
  if (isInteger(r)) return String(r.n)
  return r.n < 0 ? `-\\frac{${-r.n}}{${r.d}}` : `\\frac{${r.n}}{${r.d}}`
}

const quadShift = (k: number): string => (k === 0 ? 'x^{2}' : `x^{2}${k > 0 ? '+' : ''}${k}`)

const HINTS_LINEAR = [
  'Let $u$ be the inner linear expression; then $du$ is just a constant multiple of $dx$.',
  'Rewrite $dx$ as $\\dfrac{du}{a}$, integrate in $u$, and substitute the original expression back in at the end.',
]

const HINTS_VISIBLE = [
  'Look for a piece of the integrand that is, up to a constant factor, the derivative of another piece — that piece is your $u$.',
  'Once $u$ and $du$ are identified, every $x$ should disappear, leaving a simple integral in $u$ alone.',
]

const HINTS_DEFINITE = [
  'Substitute for the inner function and convert the limits of integration to the new variable at the same time — do not switch back to $x$.',
  'Once the limits are in terms of $u$, evaluate the antiderivative directly at the new limits and subtract.',
]

const INPUT_HINT_EXPR = 'An expression in x, plus + C for the constant of integration'

type LinearKind = 'power' | 'exp' | 'sin' | 'cos'

function tier1(rng: Rng): Problem {
  const kind = rng.pick<LinearKind>(['power', 'exp', 'sin', 'cos'])
  const a = rng.intExcept(-5, 5, [0])
  const b = rng.int(-6, 6)
  const inner = linear(a, b)

  let fLatex: string
  let integrandU: string
  let answerValue: string
  let ruleNote: string

  if (kind === 'power') {
    const n = rng.int(2, 5)
    fLatex = `\\left(${inner}\\right)^{${n}}`
    integrandU = `u^{${n}}`
    answerValue = `${ratCoefPrefix(rat(1, a * (n + 1)))}\\left(${inner}\\right)^{${n + 1}}`
    ruleNote = `By the power rule, $\\int u^{${n}}\\,du=\\dfrac{u^{${n + 1}}}{${n + 1}}$.`
  } else if (kind === 'exp') {
    fLatex = `e^{${inner}}`
    integrandU = `e^{u}`
    answerValue = `${ratCoefPrefix(rat(1, a))}e^{${inner}}`
    ruleNote = 'The exponential is its own antiderivative: $\\int e^{u}\\,du=e^{u}$.'
  } else if (kind === 'sin') {
    fLatex = `\\sin\\left(${inner}\\right)`
    integrandU = '\\sin(u)'
    answerValue = `${ratCoefPrefix(rat(-1, a))}\\cos\\left(${inner}\\right)`
    ruleNote = 'Recall $\\int \\sin(u)\\,du=-\\cos(u)$.'
  } else {
    fLatex = `\\cos\\left(${inner}\\right)`
    integrandU = '\\cos(u)'
    answerValue = `${ratCoefPrefix(rat(1, a))}\\sin\\left(${inner}\\right)`
    ruleNote = 'Recall $\\int \\cos(u)\\,du=\\sin(u)$.'
  }

  return {
    statement: `Find the antiderivative: $\\displaystyle\\int ${fLatex}\\,dx$.`,
    answer: { kind: 'expression', value: answerValue, variables: ['x'], upToConstant: true },
    solution: [
      { text: `Let $u=${inner}$, so $du=${a}\\,dx$, i.e. $dx=\\dfrac{du}{${a}}$.` },
      { text: 'Substitute into the integral, replacing $x$ entirely with $u$:', tex: `\\int ${fLatex}\\,dx = ${ratCoefPrefix(rat(1, a))}\\int ${integrandU}\\,du` },
      { text: `${ruleNote} Integrate, then substitute $u=${inner}$ back in:`, tex: `= ${answerValue} + C` },
    ],
    hints: HINTS_LINEAR,
    inputHint: INPUT_HINT_EXPR,
  }
}

function tier2(rng: Rng): Problem {
  const c = rng.intExcept(-6, 6, [0])
  const half = rat(c, 2)
  const isExp = rng.chance(0.5)

  if (isExp) {
    const k = rng.int(-5, 5)
    const inner = quadShift(k)
    const fLatex = `${coefPrefix(c)}x e^{${inner}}`
    const answerValue = `${ratCoefPrefix(half)}e^{${inner}}`
    return {
      statement: `Find the antiderivative: $\\displaystyle\\int ${fLatex}\\,dx$.`,
      answer: { kind: 'expression', value: answerValue, variables: ['x'], upToConstant: true },
      solution: [
        { text: `The derivative of $${inner}$ is $2x$, which is present up to a constant factor. Let $u=${inner}$, so $du=2x\\,dx$, i.e. $x\\,dx=\\dfrac{du}{2}$.` },
        { text: 'Substitute:', tex: `\\int ${fLatex}\\,dx = ${ratCoefPrefix(half)}\\int e^{u}\\,du` },
        { text: 'Integrate and substitute back:', tex: `= ${answerValue} + C` },
      ],
      hints: HINTS_VISIBLE,
      inputHint: INPUT_HINT_EXPR,
    }
  }

  const k = rng.int(1, 8)
  const fLatex = `\\frac{${coefPrefix(c)}x}{x^{2}+${k}}`
  const answerValue = `${ratCoefPrefix(half)}\\ln\\left(x^{2}+${k}\\right)`
  return {
    statement: `Find the antiderivative: $\\displaystyle\\int ${fLatex}\\,dx$.`,
    answer: { kind: 'expression', value: answerValue, variables: ['x'], upToConstant: true },
    solution: [
      { text: `The derivative of $x^{2}+${k}$ is $2x$, which sits in the numerator up to a constant factor. Let $u=x^{2}+${k}$, so $du=2x\\,dx$.` },
      { text: 'Substitute:', tex: `\\int ${fLatex}\\,dx = ${ratCoefPrefix(half)}\\int \\frac{du}{u}` },
      { text: 'Integrate (the denominator is always positive here, so no absolute value is needed) and substitute back:', tex: `= ${answerValue} + C` },
    ],
    hints: HINTS_VISIBLE,
    inputHint: INPUT_HINT_EXPR,
  }
}

function tier3(rng: Rng): Problem {
  const c = rng.pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6])
  const half = rat(c, 2)
  const useLog = rng.chance(0.5)

  if (!useLog) {
    const U = rng.pick([1, 2, 3, 4])
    const U2 = U * U
    const fLatex = `${coefPrefix(c)}x e^{x^{2}}`
    const value = `${ratCoefPrefix(half)}\\left(e^{${U2}}-1\\right)`
    return {
      statement: `Evaluate: $\\displaystyle\\int_{0}^{${U}} ${fLatex}\\,dx$.`,
      answer: { kind: 'number', value },
      solution: [
        { text: 'Let $u=x^{2}$, so $du=2x\\,dx$.' },
        { text: `Convert the limits: when $x=0$, $u=0$; when $x=${U}$, $u=${U2}$.` },
        { text: 'Rewrite entirely in terms of $u$:', tex: `\\int_0^{${U}} ${fLatex}\\,dx = ${ratCoefPrefix(half)}\\int_0^{${U2}} e^{u}\\,du` },
        { text: 'Evaluate at the new limits:', tex: `= ${ratCoefPrefix(half)}\\left[e^{u}\\right]_0^{${U2}} = ${value}` },
      ],
      hints: HINTS_DEFINITE,
      inputHint: 'A number; it may contain e, e.g. 2(e^4-1)',
    }
  }

  const U = rng.pick([1, 2, 3, 4])
  const k = U * U
  const upper = 2 * k
  const fLatex = `\\frac{${coefPrefix(c)}x}{x^{2}+${k}}`
  const value = `${ratCoefPrefix(half)}\\ln\\left(2\\right)`
  return {
    statement: `Evaluate: $\\displaystyle\\int_{0}^{${U}} ${fLatex}\\,dx$.`,
    answer: { kind: 'number', value },
    solution: [
      { text: `Let $u=x^{2}+${k}$, so $du=2x\\,dx$.` },
      { text: `Convert the limits: when $x=0$, $u=${k}$; when $x=${U}$, $u=${upper}$.` },
      { text: 'Rewrite entirely in terms of $u$:', tex: `\\int_0^{${U}} ${fLatex}\\,dx = ${ratCoefPrefix(half)}\\int_{${k}}^{${upper}} \\frac{du}{u}` },
      { text: 'Evaluate at the new limits:', tex: `= ${ratCoefPrefix(half)}\\left[\\ln(u)\\right]_{${k}}^{${upper}} = ${ratCoefPrefix(half)}\\ln\\left(\\frac{${upper}}{${k}}\\right) = ${value}` },
    ],
    hints: HINTS_DEFINITE,
    inputHint: 'A number; it may be a multiple of a natural logarithm, e.g. 2ln(2)',
  }
}

export const template: SkillTemplate = {
  skillId: 'substitution',
  theory,
  expectedSeconds: { 1: 70, 2: 100, 3: 140 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
