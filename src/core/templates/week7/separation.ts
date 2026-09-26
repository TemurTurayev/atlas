import { coefPrefix, joinTerms } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Separation of variables applies when $y\'=g(t)h(y)$: move every $y$ (with $dy$) to one side and every $t$ (with $dt$) to the other, then integrate each side on its own.',
  '$y\'=ky$ separates as $\\dfrac{dy}{y}=k\\,dt$, and integrating both sides gives the exponential family $y=Ae^{kt}$.',
  '$y\'=g(t)y$ separates the same way, $\\dfrac{dy}{y}=g(t)\\,dt$; integrating $g$ in place of a constant replaces $kt$ by $\\int g(t)\\,dt$ in the exponent.',
  '$y\'=g(t)/y$ separates as $y\\,dy=g(t)\\,dt$; integrating the left side gives $\\frac{y^{2}}{2}$, so the solution comes out as $y=\\pm\\sqrt{\\,\\cdots\\,}$ — pick whichever sign matches the initial condition.',
  'Always apply the initial condition after integrating, to replace the arbitrary constant with the one value that fits — an unpinned "+ C" is never itself a final answer.',
  'Common mistakes: dividing by $y$ or by $t$ without noting that the solution is then undefined there; dropping the "$\\pm$" when a square root appears and picking the wrong sign; leaving the constant of integration unpinned.',
].join('\n')

const HINTS_LINEAR_IC = [
  'Separate $y$ and $t$: divide both sides by $y$, multiply by $dt$, then integrate each side on its own.',
  'The general solution is $y=Ae^{kt}$; use the initial condition at $t=0$ — remember $e^{0}=1$ — to pin down $A$.',
]
const HINTS_GENERAL_SEPARATION = [
  'Move every $y$ (with $dy$) to one side and every $t$ (with $dt$) to the other before integrating.',
  'After integrating both sides you get an equation relating $y$, $t$, and one constant — use the initial condition to solve for that constant, then isolate $y$.',
]
const HINTS_NUMERIC = [
  'Find the general solution first, exactly as in the expression version of this problem, then pin the constant with the initial condition.',
  'Once the solution is a specific function of $t$, either substitute the given time to get a value, or set the solution equal to the given value and solve for $t$.',
]

const INPUT_HINT_T_EXPR = 'Type the solution as a function of t; the initial condition already fixes the constant, so do not add + C'
const INPUT_HINT_NUMBER = 'A single number; it may be negative'

const withCoef = (coef: number, body: string): string => `${coefPrefix(coef)}${body}`
const DOMAIN_POSITIVE_T = { t: [0.5, 3] as const }

// ---------- tier 1: y' = k y, y(0) = y0 ----------

function tier1(rng: Rng): Problem {
  const k = rng.intExcept(-3, 3, [0])
  const y0 = rng.intExcept(-4, 4, [0])
  const kt = withCoef(k, 't')
  const answerValue = withCoef(y0, `e^{${kt}}`)

  return {
    statement: `Solve $y' = ${withCoef(k, 'y')}$ with $y(0) = ${y0}$. Find $y(t)$.`,
    answer: { kind: 'expression', value: answerValue, variables: ['t'] },
    solution: [
      { text: 'Separate the variables, putting $y$ on the left and $t$ on the right:', tex: `\\frac{dy}{y} = ${coefPrefix(k)}\\,dt` },
      { text: 'Integrate both sides:', tex: `\\ln\\left|y\\right| = ${kt} + C` },
      { text: 'Exponentiate, writing $A=e^{C}$ for the new arbitrary constant:', tex: `y(t) = Ae^{${kt}}` },
      { text: `Apply the initial condition: at $t=0$, $e^{0}=1$, so $A$ must equal $y(0)$:`, tex: `${y0} = A e^{0} = A \\quad\\Longrightarrow\\quad A = ${y0}` },
      { text: 'So the solution is:', tex: `y(t) = ${answerValue}` },
    ],
    hints: HINTS_LINEAR_IC,
    inputHint: INPUT_HINT_T_EXPR,
  }
}

// ---------- tier 2: y' = g(t) h(y), clean separation ----------

/** y' = 2m t y, y(0) = y0  =>  y(t) = y0 e^{m t^2}. */
function tyProblem(rng: Rng): Problem {
  const m = rng.intExcept(-3, 3, [0])
  const y0 = rng.intExcept(-4, 4, [0])
  const odeCoef = 2 * m
  const mt2 = withCoef(m, 't^{2}')
  const answerValue = withCoef(y0, `e^{${mt2}}`)

  return {
    statement: `Solve $y' = ${withCoef(odeCoef, 't')}\\,y$ with $y(0) = ${y0}$. Find $y(t)$.`,
    answer: { kind: 'expression', value: answerValue, variables: ['t'] },
    solution: [
      { text: 'Separate the variables:', tex: `\\frac{dy}{y} = ${withCoef(odeCoef, 't')}\\,dt` },
      { text: 'Integrate both sides — the right side needs the power rule on $t$:', tex: `\\ln\\left|y\\right| = ${mt2} + C` },
      { text: 'Exponentiate:', tex: `y(t) = Ae^{${mt2}}` },
      { text: `Apply $y(0)=${y0}$: since $e^{0}=1$, $A = ${y0}$.` },
      { text: 'So the solution is:', tex: `y(t) = ${answerValue}` },
    ],
    hints: HINTS_GENERAL_SEPARATION,
    inputHint: INPUT_HINT_T_EXPR,
  }
}

/** y' = k y / t (t > 0), y(t1) = y1 chosen so the power law comes out clean  =>  y(t) = A t^{k}. */
function yOverTProblem(rng: Rng): Problem {
  const k = rng.intExcept(-2, 3, [0])
  const t1 = k < 0 ? 1 : rng.pick([1, 2, 3])
  const A = rng.intExcept(-4, 4, [0])
  const y1 = A * t1 ** k
  const answerValue = withCoef(A, `t^{${k}}`)
  const domain = k < 0 ? DOMAIN_POSITIVE_T : undefined

  return {
    statement: `Solve $y' = ${withCoef(k, '\\dfrac{y}{t}')}$ for $t>0$, with $y(${t1}) = ${y1}$. Find $y(t)$.`,
    answer: { kind: 'expression', value: answerValue, variables: ['t'], domain },
    solution: [
      { text: 'Separate the variables:', tex: `\\frac{dy}{y} = ${k}\\,\\frac{dt}{t}` },
      { text: 'Integrate both sides, using $t>0$ so $|t|=t$:', tex: `\\ln\\left|y\\right| = ${k}\\ln t + C` },
      { text: 'Exponentiate — a multiple of $\\ln t$ in the exponent becomes a power of $t$:', tex: `y(t) = At^{${k}}` },
      { text: `Apply $y(${t1})=${y1}$ to solve for $A$:`, tex: `${y1} = A\\cdot ${t1}^{${k}} \\quad\\Longrightarrow\\quad A = ${A}` },
      { text: 'So the solution is:', tex: `y(t) = ${answerValue}` },
    ],
    hints: HINTS_GENERAL_SEPARATION,
    inputHint: INPUT_HINT_T_EXPR,
  }
}

/** y' = k t / y, y(0) = y0 (k > 0 so the right side under the root is always positive)  =>  y = ±sqrt(k t^2 + y0^2). */
function tOverYProblem(rng: Rng): Problem {
  const k = rng.int(1, 3)
  const y0 = rng.intExcept(-4, 4, [0])
  const sign = y0 > 0 ? 1 : -1
  const inner = joinTerms([withCoef(k, 't^{2}'), String(y0 * y0)])
  const answerValue = sign === 1 ? `\\sqrt{${inner}}` : `-\\sqrt{${inner}}`

  return {
    statement: `Solve $y' = ${withCoef(k, '\\dfrac{t}{y}')}$ with $y(0) = ${y0}$. Find $y(t)$.`,
    answer: { kind: 'expression', value: answerValue, variables: ['t'] },
    solution: [
      { text: 'Separate the variables — this time $y$, not $\\frac{1}{y}$, goes with $dy$:', tex: `y\\,dy = ${withCoef(k, 't')}\\,dt` },
      { text: 'Integrate both sides:', tex: `\\frac{y^{2}}{2} = \\frac{${k}t^{2}}{2} + C_0 \\quad\\Longrightarrow\\quad y^{2} = ${withCoef(k, 't^{2}')} + C` },
      { text: `Apply $y(0)=${y0}$ to pin down $C$:`, tex: `${y0 * y0} = C \\quad\\Longrightarrow\\quad y^{2} = ${inner}` },
      {
        text: `Take a square root. Since $k>0$, the right-hand side is positive for every $t$, so this is defined everywhere; pick the sign that matches $y(0)=${y0}$ (${sign === 1 ? 'positive' : 'negative'}):`,
        tex: `y(t) = ${answerValue}`,
      },
    ],
    hints: HINTS_GENERAL_SEPARATION,
    inputHint: INPUT_HINT_T_EXPR,
  }
}

const TIER2_BUILDERS: readonly ((rng: Rng) => Problem)[] = [tyProblem, yOverTProblem, tOverYProblem]

function tier2(rng: Rng): Problem {
  return rng.pick(TIER2_BUILDERS)(rng)
}

// ---------- tier 3: same skill, asked as a number ----------

/** y' = 2m t y, y(0) = y0; evaluate y(t1) = y0 e^{m t1^2} — a clean multiple of e. */
function evaluateAtTime(rng: Rng): Problem {
  const m = rng.intExcept(-3, 3, [0])
  const y0 = rng.intExcept(-4, 4, [0])
  const odeCoef = 2 * m
  const t1 = rng.pick([1, 2])
  const exponent = m * t1 * t1
  const answerValue = withCoef(y0, `e^{${exponent}}`)

  return {
    statement: `Solve $y' = ${withCoef(odeCoef, 't')}\\,y$ with $y(0) = ${y0}$. Find $y(${t1})$.`,
    answer: { kind: 'number', value: answerValue },
    solution: [
      { text: 'Separating and integrating, exactly as for the general case, gives:', tex: `y(t) = ${y0}\\,e^{${withCoef(m, 't^{2}')}}` },
      { text: `Substitute $t=${t1}$:`, tex: `y(${t1}) = ${y0}\\,e^{${exponent}} = ${answerValue}` },
    ],
    hints: HINTS_NUMERIC,
    inputHint: INPUT_HINT_NUMBER,
  }
}

/** y' = k y, y(0) = y0; the target value is stated in closed form so the matching time is exact. */
function solveForTime(rng: Rng): Problem {
  const k = rng.intExcept(-3, 3, [0])
  const y0 = rng.intExcept(-4, 4, [0])
  const t1 = rng.pick([-2, -1, 1, 2, 3])
  const targetValue = withCoef(y0, `e^{${k * t1}}`)

  return {
    statement: `Solve $y' = ${withCoef(k, 'y')}$ with $y(0) = ${y0}$. At what time $t$ does $y(t) = ${targetValue}$?`,
    answer: { kind: 'number', value: String(t1) },
    solution: [
      { text: 'Separating and integrating, exactly as for the general case, gives:', tex: `y(t) = ${y0}\\,e^{${withCoef(k, 't')}}` },
      { text: 'Set this equal to the target value; since $y_0\\neq 0$, the exponents must match:', tex: `${y0}\\,e^{${k}t} = ${targetValue} \\quad\\Longrightarrow\\quad ${k}t = ${k * t1}` },
      { text: 'Solve for $t$:', tex: `t = ${t1}` },
    ],
    hints: HINTS_NUMERIC,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? evaluateAtTime(rng) : solveForTime(rng)
}

export const template: SkillTemplate = {
  skillId: 'separation',
  theory,
  expectedSeconds: { 1: 90, 2: 140, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
