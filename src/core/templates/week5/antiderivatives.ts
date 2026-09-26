import { coefPrefix } from '../../math/latex'
import { polyEval, polyToLatex, type Poly } from '../../math/poly'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  "An antiderivative of $f$ is a function $F$ with $F'(x) = f(x)$; differentiating $F$ must give back exactly $f$.",
  'Power rule in reverse: $\\displaystyle\\int x^{n}\\,dx = \\frac{x^{n+1}}{n+1} + C$ for $n \\neq -1$ — raise the exponent by one, then divide by the new exponent.',
  'Standard antiderivatives: $\\displaystyle\\int e^{kx}dx=\\frac{1}{k}e^{kx}+C$, $\\displaystyle\\int\\frac{1}{x}dx=\\ln\\left|x\\right|+C$, $\\displaystyle\\int\\sin(kx)\\,dx=-\\frac{1}{k}\\cos(kx)+C$, $\\displaystyle\\int\\cos(kx)\\,dx=\\frac{1}{k}\\sin(kx)+C$.',
  'Any two antiderivatives of the same function differ only by a constant, so a general answer carries a free "$+C$" — every choice of $C$ gives a correct antiderivative.',
  'When a condition such as $F(a)=b$ pins the function down, substitute it into the general antiderivative and solve for the one value of $C$ that fits.',
  'Common mistakes: forgetting the "+ C"; integrating $\\frac{1}{x}$ with the power rule instead of using $\\ln\\left|x\\right|$; applying the power rule to $x^{-1}$, where it does not apply.',
].join('\n')

const HINTS_POWER = [
  'Integrate each term separately: raise the exponent by one, then divide by the new exponent.',
  'Check your answer by differentiating it — you should get back exactly the original function.',
]
const HINTS_STANDARD = [
  'Recall the standard antiderivative for this kind of function, then adjust the coefficient for the rate multiplying $x$ inside it.',
  'If $f(x) = c\\cdot g(kx)$ and $G$ is a known antiderivative of $g$, then $\\frac{c}{k}G(kx)$ is an antiderivative of $f$.',
]
const HINTS_CONDITION = [
  'First find the general antiderivative, with a "+ C" left in.',
  'Substitute the given point into that general antiderivative and solve for the one value of $C$ that makes the condition true.',
]

const INPUT_HINT_PLUS_C = 'Type the antiderivative, then add + C for the constant of integration'
const INPUT_HINT_NO_CONSTANT = 'Type the specific function F(x); the condition fixes the constant, so do not add + C'
const INPUT_HINT_NUMBER = 'A single number; it may be negative'

const DOMAIN_POSITIVE = { x: [0.5, 3] as const }

/** Term-by-term derivative of an ascending-coefficient polynomial: d/dx (c_k x^k) = k c_k x^{k-1}. */
function polyDeriv(p: Poly): Poly {
  return p.slice(1).map((c, i) => c * (i + 1))
}

/** coef · body, e.g. (3, "e^{x}") -> "3e^{x}"; (1, "\sin x") -> "\sin x"; (-1, "\sin x") -> "-\sin x". */
const withCoef = (coef: number, body: string): string => `${coefPrefix(coef)}${body}`

/** c/x as LaTeX, folding the sign into the fraction: -3 -> "-\frac{3}{x}". */
const overX = (c: number): string => (c < 0 ? `-\\frac{${-c}}{x}` : `\\frac{${c}}{x}`)

/**
 * Builds an antiderivative F (zero constant term, so the "+ C" carries the whole constant) with
 * integer coefficients from `x^1` up to a random degree, and its derivative f = F'.
 */
function buildPolyPair(rng: Rng, minDegree: number, maxDegree: number): { readonly F: Poly; readonly f: Poly } {
  const degree = rng.int(minDegree, maxDegree)
  const coeffs: number[] = [0]
  for (let k = 1; k < degree; k += 1) coeffs.push(rng.chance(0.3) ? 0 : rng.intExcept(-4, 4, [0]))
  coeffs.push(rng.intExcept(-4, 4, [0]))
  return { F: coeffs, f: polyDeriv(coeffs) }
}

function tier1(rng: Rng): Problem {
  const { F, f } = buildPolyPair(rng, 2, 4)
  const fLatex = polyToLatex(f)
  const FLatex = polyToLatex(F)
  return {
    statement: `Find the indefinite integral $\\displaystyle\\int \\left(${fLatex}\\right) dx$.`,
    answer: { kind: 'expression', value: FLatex, variables: ['x'], upToConstant: true },
    solution: [
      { text: 'Integrate term by term with the power rule in reverse:', tex: '\\int x^{n}\\,dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)' },
      { text: 'Raise each exponent by one and divide by the new exponent:', tex: `\\int\\left(${fLatex}\\right) dx = ${FLatex} + C` },
    ],
    hints: HINTS_POWER,
    inputHint: INPUT_HINT_PLUS_C,
  }
}

function exponentialProblem(rng: Rng): Problem {
  const A = rng.intExcept(-4, 4, [0])
  const k = rng.intExcept(-3, 3, [0])
  const exponent = `${coefPrefix(k)}x`
  const c = A * k
  const fLatex = withCoef(c, `e^{${exponent}}`)
  const FLatex = withCoef(A, `e^{${exponent}}`)
  return {
    statement: `Find the indefinite integral $\\displaystyle\\int ${fLatex}\\,dx$.`,
    answer: { kind: 'expression', value: FLatex, variables: ['x'], upToConstant: true },
    solution: [
      { text: 'Use the standard rule for an exponential with a linear exponent:', tex: '\\int e^{kx}\\,dx = \\frac{1}{k}e^{kx} + C' },
      { text: `Here $k=${k}$, so the coefficient out front becomes $\\frac{${c}}{${k}}=${A}$:`, tex: `\\int ${fLatex}\\,dx = ${FLatex} + C` },
    ],
    hints: HINTS_STANDARD,
    inputHint: INPUT_HINT_PLUS_C,
  }
}

function reciprocalProblem(rng: Rng): Problem {
  const c = rng.intExcept(-4, 4, [0])
  const fLatex = overX(c)
  const FLatex = withCoef(c, '\\ln\\left|x\\right|')
  return {
    statement: `Find the indefinite integral $\\displaystyle\\int ${fLatex}\\,dx$.`,
    answer: { kind: 'expression', value: FLatex, variables: ['x'], upToConstant: true, domain: DOMAIN_POSITIVE },
    solution: [
      { text: 'Use the standard rule for a reciprocal:', tex: '\\int\\frac{1}{x}\\,dx = \\ln\\left|x\\right| + C' },
      { text: 'Carry the coefficient through unchanged:', tex: `\\int ${fLatex}\\,dx = ${FLatex} + C` },
    ],
    hints: HINTS_STANDARD,
    inputHint: INPUT_HINT_PLUS_C,
  }
}

function sineProblem(rng: Rng): Problem {
  const A = rng.intExcept(-4, 4, [0])
  const b = rng.intExcept(-3, 3, [0])
  const bx = `${coefPrefix(b)}x`
  const c = -A * b
  const fLatex = withCoef(c, `\\sin\\left(${bx}\\right)`)
  const FLatex = withCoef(A, `\\cos\\left(${bx}\\right)`)
  return {
    statement: `Find the indefinite integral $\\displaystyle\\int ${fLatex}\\,dx$.`,
    answer: { kind: 'expression', value: FLatex, variables: ['x'], upToConstant: true },
    solution: [
      { text: 'Use the standard rule for sine with a linear argument:', tex: '\\int\\sin(bx)\\,dx = -\\frac{1}{b}\\cos(bx) + C' },
      { text: `Here $b=${b}$, so the coefficient out front becomes $-\\frac{${c}}{${b}}=${A}$:`, tex: `\\int ${fLatex}\\,dx = ${FLatex} + C` },
    ],
    hints: HINTS_STANDARD,
    inputHint: INPUT_HINT_PLUS_C,
  }
}

function cosineProblem(rng: Rng): Problem {
  const A = rng.intExcept(-4, 4, [0])
  const b = rng.intExcept(-3, 3, [0])
  const bx = `${coefPrefix(b)}x`
  const c = A * b
  const fLatex = withCoef(c, `\\cos\\left(${bx}\\right)`)
  const FLatex = withCoef(A, `\\sin\\left(${bx}\\right)`)
  return {
    statement: `Find the indefinite integral $\\displaystyle\\int ${fLatex}\\,dx$.`,
    answer: { kind: 'expression', value: FLatex, variables: ['x'], upToConstant: true },
    solution: [
      { text: 'Use the standard rule for cosine with a linear argument:', tex: '\\int\\cos(bx)\\,dx = \\frac{1}{b}\\sin(bx) + C' },
      { text: `Here $b=${b}$, so the coefficient out front becomes $\\frac{${c}}{${b}}=${A}$:`, tex: `\\int ${fLatex}\\,dx = ${FLatex} + C` },
    ],
    hints: HINTS_STANDARD,
    inputHint: INPUT_HINT_PLUS_C,
  }
}

function negativePowerProblem(rng: Rng): Problem {
  const m = rng.int(1, 3)
  const n = m + 1
  const A = rng.intExcept(-4, 4, [0])
  const c = -A * m
  const fLatex = withCoef(c, `x^{-${n}}`)
  const FLatex = withCoef(A, `x^{-${m}}`)
  return {
    statement: `Find the indefinite integral $\\displaystyle\\int ${fLatex}\\,dx$.`,
    answer: { kind: 'expression', value: FLatex, variables: ['x'], upToConstant: true, domain: DOMAIN_POSITIVE },
    solution: [
      { text: 'Use the power rule, which also applies to a negative exponent:', tex: '\\int x^{n}\\,dx = \\frac{x^{n+1}}{n+1} + C \\quad (n\\neq-1)' },
      { text: `Raise the exponent from $-${n}$ to $-${m}$ and divide by the new exponent $-${m}$:`, tex: `\\int ${fLatex}\\,dx = ${FLatex} + C` },
    ],
    hints: HINTS_POWER,
    inputHint: INPUT_HINT_PLUS_C,
  }
}

function sqrtProblem(rng: Rng): Problem {
  const t = rng.intExcept(-3, 3, [0])
  const A = 2 * t
  const c = 3 * t
  const fLatex = withCoef(c, '\\sqrt{x}')
  const FLatex = withCoef(A, 'x^{\\frac{3}{2}}')
  return {
    statement: `Find the indefinite integral $\\displaystyle\\int ${fLatex}\\,dx$.`,
    answer: { kind: 'expression', value: FLatex, variables: ['x'], upToConstant: true, domain: DOMAIN_POSITIVE },
    solution: [
      { text: 'Rewrite the root as a power, then apply the power rule:', tex: '\\sqrt{x} = x^{\\frac{1}{2}}, \\qquad \\int x^{\\frac{1}{2}}\\,dx = \\frac{2}{3}x^{\\frac{3}{2}} + C' },
      { text: 'Carry the coefficient through:', tex: `\\int ${fLatex}\\,dx = ${FLatex} + C` },
    ],
    hints: HINTS_POWER,
    inputHint: INPUT_HINT_PLUS_C,
  }
}

const TIER2_BUILDERS: readonly ((rng: Rng) => Problem)[] = [
  exponentialProblem,
  reciprocalProblem,
  sineProblem,
  cosineProblem,
  negativePowerProblem,
  sqrtProblem,
]

function tier2(rng: Rng): Problem {
  return rng.pick(TIER2_BUILDERS)(rng)
}

function tier3(rng: Rng): Problem {
  const { F, f } = buildPolyPair(rng, 2, 3)
  const a = rng.intExcept(-3, 3, [0])
  const C0 = rng.int(-5, 5)
  const valueAtA = polyEval(F, a)
  const b = valueAtA + C0
  const fLatex = polyToLatex(f)
  const FLatex = polyToLatex(F)
  const pinned: Poly = [C0, ...F.slice(1)]
  const pinnedLatex = polyToLatex(pinned)
  const generalStep = { text: 'Integrate term by term to get the general antiderivative:', tex: `F(x) = ${FLatex} + C` }
  const solveForC = {
    text: `Substitute $x=${a}$ and set the result equal to $${b}$:`,
    tex: `${valueAtA} + C = ${b} \\quad\\Longrightarrow\\quad C = ${C0}`,
  }

  if (rng.chance(0.5)) {
    return {
      statement: `Find the function $F$ with $F'(x) = ${fLatex}$ and $F(${a}) = ${b}$.`,
      answer: { kind: 'expression', value: pinnedLatex, variables: ['x'] },
      solution: [generalStep, solveForC, { text: 'So the antiderivative pinned down by the condition is:', tex: `F(x) = ${pinnedLatex}` }],
      hints: HINTS_CONDITION,
      inputHint: INPUT_HINT_NO_CONSTANT,
    }
  }

  const p = rng.intExcept(-4, 4, [a])
  const value = polyEval(pinned, p)
  return {
    statement: `The function $F$ satisfies $F'(x) = ${fLatex}$ and $F(${a}) = ${b}$. Find $F(${p})$.`,
    answer: { kind: 'number', value: String(value) },
    solution: [generalStep, solveForC, { text: `So $F(x) = ${pinnedLatex}$. Evaluate at $x=${p}$:`, tex: `F(${p}) = ${value}` }],
    hints: HINTS_CONDITION,
    inputHint: INPUT_HINT_NUMBER,
  }
}

export const template: SkillTemplate = {
  skillId: 'antiderivatives',
  theory,
  expectedSeconds: { 1: 70, 2: 100, 3: 140 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
