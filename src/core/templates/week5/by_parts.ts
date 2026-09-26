import { coefPrefix, joinTerms } from '../../math/latex'
import { equals, isInteger, rat, ratToLatex, type Rational } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Integration by parts reverses the product rule: $\\int u\\,dv = uv - \\int v\\,du$.',
  'Pick $u$ to be the factor that gets simpler when differentiated, and $dv$ to be the factor that is easy to integrate.',
  'A polynomial times $e^{ax}$, $\\sin(ax)$ or $\\cos(ax)$: let $u$ be the polynomial (it eventually becomes a constant) and $dv$ the exponential or trig factor.',
  "A polynomial times $\\ln x$: let $u=\\ln x$, since its derivative $\\frac1x$ is simpler, and $dv$ the polynomial factor.",
  'A polynomial of degree $2$ or more may need the rule applied more than once, each time reducing the degree of the polynomial factor by one.',
  'Common mistakes: choosing $u$ and $dv$ so that the new integral $\\int v\\,du$ is harder than the original one; dropping the minus sign in front of $\\int v\\,du$.',
].join('\n')

/** Coefficient prefix for a rational multiplying a variable term: 1 → "", -1 → "-", else the fraction or integer. */
function ratCoefPrefix(r: Rational): string {
  if (equals(r, rat(1))) return ''
  if (equals(r, rat(-1))) return '-'
  if (isInteger(r)) return String(r.n)
  return r.n < 0 ? `-\\frac{${-r.n}}{${r.d}}` : `\\frac{${r.n}}{${r.d}}`
}

const axLatex = (a: number): string => (a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`)

const HINTS_ONE_APP = [
  'Pick $u$ to be the polynomial factor — it becomes a constant once you differentiate it enough times — and $dv$ the rest.',
  'Once you have $u$, $dv$, $du$ and $v$, assemble $uv-\\int v\\,du$ and finish the remaining, simpler integral.',
]

const HINTS_CHOICE = [
  'Differentiating one factor should make it simpler (or eventually a constant); that factor is $u$. The other factor becomes $dv$.',
  'If the new integral $\\int v\\,du$ looks harder than the one you started with, the choice of $u$ and $dv$ was backwards.',
]

const HINTS_DEFINITE = [
  'Find the antiderivative first (by parts), then evaluate it at the two limits and subtract — exactly as with any definite integral.',
  'Keep track of every term; a sign or arithmetic slip in one of them changes the final number.',
]

const INPUT_HINT_EXPR = 'An expression in x, plus + C for the constant of integration'
const INPUT_HINT_CLOSED = 'A number; it may be a fraction, or a multiple of e'

function tier1(rng: Rng): Problem {
  const isExp = rng.chance(0.5)
  const m = rng.intExcept(-3, 3, [0])
  const a = rng.pick([1, 2, 3])
  const uLatex = `${coefPrefix(m)}x`
  const duLatex = `${m}\\,dx`

  const dvLatex = isExp ? `e^{${axLatex(a)}}` : `\\sin\\left(${axLatex(a)}\\right)`
  const vLatex = isExp ? `${ratCoefPrefix(rat(1, a))}e^{${axLatex(a)}}` : `${ratCoefPrefix(rat(-1, a))}\\cos\\left(${axLatex(a)}\\right)`
  const fLatex = isExp ? `${coefPrefix(m)}x e^{${axLatex(a)}}` : `${coefPrefix(m)}x \\sin\\left(${axLatex(a)}\\right)`
  const t1 = isExp ? `${ratCoefPrefix(rat(m, a))}x e^{${axLatex(a)}}` : `${ratCoefPrefix(rat(-m, a))}x \\cos\\left(${axLatex(a)}\\right)`
  const t2 = isExp ? `${ratCoefPrefix(rat(-m, a * a))}e^{${axLatex(a)}}` : `${ratCoefPrefix(rat(m, a * a))}\\sin\\left(${axLatex(a)}\\right)`
  const answerValue = joinTerms([t1, t2])

  return {
    statement: `Find the antiderivative: $\\displaystyle\\int ${fLatex}\\,dx$.`,
    answer: { kind: 'expression', value: answerValue, variables: ['x'], upToConstant: true },
    solution: [
      { text: `Choose $u=${uLatex}$ (a polynomial — it becomes a constant when differentiated) and $dv=${dvLatex}\\,dx$ (easy to integrate).` },
      { text: `Then $du=${duLatex}$ and $v=${vLatex}$.` },
      { text: 'Assemble $uv-\\displaystyle\\int v\\,du$:', tex: `uv-\\int v\\,du = ${uLatex}\\cdot\\left(${vLatex}\\right) - \\int \\left(${vLatex}\\right)\\left(${m}\\right)\\,dx` },
      { text: 'Integrate the remaining term and simplify:', tex: `= ${answerValue} + C` },
    ],
    hints: HINTS_ONE_APP,
    inputHint: INPUT_HINT_EXPR,
  }
}

function tier2(rng: Rng): Problem {
  const c = rng.intExcept(-3, 3, [0])
  const useLn = rng.chance(0.5)

  if (useLn) {
    const fLatex = `${coefPrefix(c)}x\\ln x`
    const t1 = `${ratCoefPrefix(rat(c, 2))}x^{2}\\ln x`
    const t2 = `${ratCoefPrefix(rat(-c, 4))}x^{2}`
    const answerValue = joinTerms([t1, t2])
    return {
      statement: `Find the antiderivative: $\\displaystyle\\int ${fLatex}\\,dx$ (for $x>0$).`,
      answer: { kind: 'expression', value: answerValue, variables: ['x'], upToConstant: true, domain: { x: [0.4, 3] } },
      solution: [
        {
          text: `Choose $u=\\ln x$ — its derivative $\\frac{1}{x}$ is simpler than $\\ln x$ itself — and $dv=${coefPrefix(c)}x\\,dx$, which is easy to integrate. Choosing $u=${coefPrefix(c)}x$ instead would leave $\\ln x$ trapped inside a new integral, which is no easier.`,
        },
        { text: `Then $du=\\dfrac{dx}{x}$ and $v=${ratCoefPrefix(rat(c, 2))}x^{2}$.` },
        { text: 'Assemble $uv-\\displaystyle\\int v\\,du$:', tex: `uv-\\int v\\,du = \\left(${ratCoefPrefix(rat(c, 2))}x^{2}\\right)\\ln x - \\int ${ratCoefPrefix(rat(c, 2))}x\\,dx` },
        { text: 'Integrate the remaining term and simplify:', tex: `= ${answerValue} + C` },
      ],
      hints: HINTS_CHOICE,
      inputHint: INPUT_HINT_EXPR,
    }
  }

  const a = rng.intExcept(-3, 3, [0])
  const fLatex = `${coefPrefix(c)}x^{2} e^{${axLatex(a)}}`
  const t1 = `${ratCoefPrefix(rat(c, a))}x^{2}e^{${axLatex(a)}}`
  const t2 = `${ratCoefPrefix(rat(-2 * c, a * a))}x e^{${axLatex(a)}}`
  const t3 = `${ratCoefPrefix(rat(2 * c, a * a * a))}e^{${axLatex(a)}}`
  const answerValue = joinTerms([t1, t2, t3])
  const inner1 = joinTerms([`${ratCoefPrefix(rat(1, a))}x e^{${axLatex(a)}}`, `${ratCoefPrefix(rat(-1, a * a))}e^{${axLatex(a)}}`])

  return {
    statement: `Find the antiderivative: $\\displaystyle\\int ${fLatex}\\,dx$.`,
    answer: { kind: 'expression', value: answerValue, variables: ['x'], upToConstant: true },
    solution: [
      {
        text: `Choose $u=${coefPrefix(c)}x^{2}$ — differentiating a polynomial lowers its degree — and $dv=e^{${axLatex(a)}}\\,dx$. Choosing $u=e^{${axLatex(a)}}$ instead would leave a polynomial of the same degree to integrate against, making the problem worse, not better.`,
      },
      { text: `Then $du=${coefPrefix(2 * c)}x\\,dx$ and $v=${ratCoefPrefix(rat(1, a))}e^{${axLatex(a)}}$.` },
      { text: 'Assemble $uv-\\displaystyle\\int v\\,du$:', tex: `uv-\\int v\\,du = ${ratCoefPrefix(rat(c, a))}x^{2}e^{${axLatex(a)}} - ${ratCoefPrefix(rat(2 * c, a))}\\int x e^{${axLatex(a)}}\\,dx` },
      { text: `Apply integration by parts once more, exactly as for a single power of $x$:`, tex: `\\int x e^{${axLatex(a)}}\\,dx = ${inner1} + C` },
      { text: 'Substitute back and simplify:', tex: `= ${answerValue} + C` },
    ],
    hints: HINTS_CHOICE,
    inputHint: INPUT_HINT_EXPR,
  }
}

const eBoundLatex = (k: number): string => (k === 1 ? 'e' : `e^{${k}}`)

function tier3(rng: Rng): Problem {
  const c = rng.intExcept(-3, 3, [0])
  const useLn = rng.chance(0.5)

  if (useLn) {
    const k = rng.pick([1, 2])
    const upper = eBoundLatex(k)
    const term = `${coefPrefix(2 * k - 1)}e^{${2 * k}}+1`
    const value = `\\frac{${c}\\left(${term}\\right)}{4}`
    const antiderivative = joinTerms([`${ratCoefPrefix(rat(c, 2))}x^{2}\\ln x`, `${ratCoefPrefix(rat(-c, 4))}x^{2}`])
    const atUpper = `${ratCoefPrefix(rat(c * (2 * k - 1), 4))}e^{${2 * k}}`
    const atLower = ratToLatex(rat(-c, 4))

    return {
      statement: `Evaluate: $\\displaystyle\\int_{1}^{${upper}} ${coefPrefix(c)}x\\ln x\\,dx$.`,
      answer: { kind: 'number', value },
      solution: [
        { text: `Choose $u=\\ln x$ and $dv=${coefPrefix(c)}x\\,dx$, so $du=\\dfrac{dx}{x}$ and $v=${ratCoefPrefix(rat(c, 2))}x^{2}$.` },
        { text: 'An antiderivative is:', tex: `${antiderivative}` },
        {
          text: `Evaluate at $x=${upper}$ (where $\\ln(${upper})=${k}$) and at $x=1$ (where $\\ln 1=0$), then subtract:`,
          tex: `${atUpper} - \\left(${atLower}\\right) = ${value}`,
        },
      ],
      hints: HINTS_DEFINITE,
      inputHint: INPUT_HINT_CLOSED,
    }
  }

  const U = rng.pick([1, 2, 3])
  const diff = U - 1
  const term = diff === 0 ? '1' : `${coefPrefix(diff)}e^{${U}}+1`
  const value = term === '1' ? String(c) : `${coefPrefix(c)}\\left(${term}\\right)`
  const antiderivative = joinTerms([`${coefPrefix(c)}x e^{x}`, `${coefPrefix(-c)}e^{x}`])
  const atUpper = diff === 0 ? '0' : `${coefPrefix(c * diff)}e^{${U}}`

  return {
    statement: `Evaluate: $\\displaystyle\\int_{0}^{${U}} ${coefPrefix(c)}x e^{x}\\,dx$.`,
    answer: { kind: 'number', value },
    solution: [
      { text: `Choose $u=${coefPrefix(c)}x$ and $dv=e^{x}\\,dx$, so $du=${c}\\,dx$ and $v=e^{x}$.` },
      { text: 'An antiderivative is:', tex: `${antiderivative}` },
      { text: `Evaluate at $x=${U}$ and at $x=0$ (where $e^{0}=1$), then subtract:`, tex: `\\left(${atUpper}\\right) - \\left(${-c}\\right) = ${value}` },
    ],
    hints: HINTS_DEFINITE,
    inputHint: INPUT_HINT_CLOSED,
  }
}

export const template: SkillTemplate = {
  skillId: 'by_parts',
  theory,
  expectedSeconds: { 1: 80, 2: 130, 3: 170 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
