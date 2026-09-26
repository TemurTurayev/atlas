import { coefPrefix, joinTerms } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  "Euler's method approximates the solution of $y' = f(t,y)$, $y(t_0)=y_0$, by following the tangent line: each step moves in the direction the derivative points, over a distance controlled by the step size $h$.",
  'One step is $y_{n+1} = y_n + h\\,f(t_n, y_n)$, with the next time $t_{n+1}=t_n+h$; repeating this builds up a numerical approximation to the whole solution curve.',
  'Smaller step sizes $h$ track the true solution more closely but need more steps to reach the same final time; larger steps are faster but less accurate.',
  'Because each step only uses the slope at its starting point, Euler follows the tangent line instead of the true curve: it undershoots a solution that curves upward (is convex) and overshoots one that curves downward (is concave).',
  'When the exact solution is known in closed form, this error can be measured directly by comparing it with the Euler estimate at the same time.',
  "Common mistakes: forgetting to advance $t$ by $h$ at every step, even when $t$ does not appear in $f$; mixing the old and new values of $y$ within the same step instead of using $t_n, y_n$ together throughout.",
].join('\n')

const HINTS_STEP = [
  'Evaluate $f$ at the starting point $(t_0, y_0)$ first — that single slope is used for the whole step.',
  'Multiply that slope by the step size $h$ and add it to $y_0$: $y_1 = y_0 + h\\,f(t_0, y_0)$.',
]
const HINTS_TABLE = [
  'Build the table one row at a time: each new $y$ uses the slope computed from the previous row, not the original one.',
  'Advance $t$ by $h$ at every step, even though $t$ does not appear in this particular $f$.',
]
const HINTS_COMPARE = [
  'Compute the Euler estimate and the exact value separately, then compare them.',
  "A convex curve (curving upward) lies above its own tangent lines, so Euler's estimate — which follows the tangent — falls below the true value; a concave curve does the opposite.",
]

const INPUT_HINT_NUMBER = 'A single number; it may be negative or a decimal'

/** Rounds away floating-point noise (e.g. 0.1+0.2) and formats without a trailing ".0". */
function clean(x: number): string {
  const rounded = Math.round(x * 1000) / 1000
  return Object.is(rounded, -0) ? '0' : String(rounded)
}

/** a t + b y + c, dropping any zero term; a=0 gives a purely y-dependent (autonomous) expression. */
function affineLatex(a: number, b: number, c: number): string {
  return joinTerms([a === 0 ? '' : `${coefPrefix(a)}t`, b === 0 ? '' : `${coefPrefix(b)}y`, String(c)])
}

const H_TENTHS = [1, 2, 5, 10]

function tier1(rng: Rng): Problem {
  const a = rng.int(-3, 3)
  const b = rng.intExcept(-3, 3, [0])
  const c = rng.int(-4, 4)
  const t0 = rng.int(-2, 4)
  const y0 = rng.int(-5, 5)
  const hTenths = rng.pick(H_TENTHS)
  const h = hTenths / 10
  const f0 = a * t0 + b * y0 + c
  const increment = h * f0
  const y1 = y0 + increment
  const hStr = clean(h)
  const t1 = clean(t0 + h)

  return {
    statement: `Use one step of Euler's method with step size $h = ${hStr}$ to estimate $y(${t1})$ for $y' = ${affineLatex(a, b, c)}$, $y(${t0}) = ${y0}$.`,
    answer: { kind: 'number', value: clean(y1) },
    solution: [
      { text: 'Write the slope function and evaluate it at the starting point:', tex: `f(t,y) = ${affineLatex(a, b, c)}, \\qquad f(${t0}, ${y0}) = ${f0}` },
      { text: 'One Euler step is $y_1 = y_0 + h\\,f(t_0, y_0)$:', tex: `y_1 = ${y0} + ${hStr}\\cdot ${f0} = ${y0} + ${clean(increment)} = ${clean(y1)}` },
    ],
    hints: HINTS_STEP,
    inputHint: INPUT_HINT_NUMBER,
  }
}

/**
 * Autonomous y' = ky + c with even k, c and h = 0.5: since 0.5k and 0.5c are then integers, every
 * intermediate y in the table stays a whole number by induction from an integer y0.
 */
function tier2(rng: Rng): Problem {
  const steps = rng.pick([2, 3])
  const h = 0.5
  const k = rng.intExcept(-3, 3, [0]) * 2
  const c = rng.int(-2, 2) * 2
  const t0 = rng.int(0, 3)
  const y0 = rng.int(-4, 4)

  const rows: { t: number; y: number }[] = [{ t: t0, y: y0 }]
  for (let i = 0; i < steps; i += 1) {
    const prev = rows[rows.length - 1]
    const slope = k * prev.y + c
    rows.push({ t: prev.t + h, y: prev.y + h * slope })
  }
  const finalRow = rows[rows.length - 1]

  const rowSteps = rows.slice(1).map((row, i) => {
    const prev = rows[i]
    const slope = k * prev.y + c
    return {
      text: `Step ${i + 1}: at $t_{${i}} = ${clean(prev.t)}$, $y_{${i}} = ${clean(prev.y)}$, the slope is $f = ${coefPrefix(k)}\\left(${clean(prev.y)}\\right)${c === 0 ? '' : (c > 0 ? '+' : '') + c} = ${slope}$:`,
      tex: `y_{${i + 1}} = ${clean(prev.y)} + ${clean(h)}\\cdot ${slope} = ${clean(row.y)}`,
    }
  })

  return {
    statement: `Starting from $y(${t0}) = ${y0}$, take ${steps} Euler steps of size $h = 0.5$ for $y' = ${affineLatex(0, k, c)}$. What is the resulting estimate for $y(${clean(finalRow.t)})$?`,
    answer: { kind: 'number', value: clean(finalRow.y) },
    solution: [{ text: 'The step formula is $y_{n+1} = y_n + h\\,f(y_n)$; build the table one row at a time.' }, ...rowSteps],
    hints: HINTS_TABLE,
    inputHint: INPUT_HINT_NUMBER,
  }
}

const COMPARE_LABELS = ['underestimates', 'overestimates', 'matches exactly']

/**
 * y' = 2a t, y(t0) = a t0^2 + b has exact solution y = a t^2 + b; one Euler step from t0 has
 * exact error (Exact - Euler) = a h^2 exactly, independent of t0 and b, which is never zero for
 * a, h != 0 — so "matches exactly" is always a genuine, if plausible-sounding, wrong answer.
 */
function eulerVsExact(rng: Rng): Problem {
  const a = rng.pick([1, -1, 2, -2])
  const b = rng.int(-5, 5)
  const t0 = rng.int(-3, 3)
  const h = rng.pick([0.5, 1, 2])
  const y0 = a * t0 * t0 + b
  const slope0 = 2 * a * t0
  const eulerEstimate = y0 + h * slope0
  const t1 = t0 + h
  const exact = a * t1 * t1 + b
  const error = eulerEstimate - exact
  const asksForError = rng.chance(0.5)
  const quadratic = joinTerms([`${coefPrefix(a)}t^{2}`, String(b)])
  const quadraticAt = (tVal: string): string => joinTerms([`${coefPrefix(a)}(${tVal})^{2}`, String(b)])

  if (asksForError) {
    return {
      statement: `The initial value problem $y' = ${coefPrefix(2 * a)}t$, $y(${t0}) = ${y0}$ has exact solution $y(t) = ${quadratic}$. Using one Euler step of size $h = ${clean(h)}$, find the error in the Euler estimate for $y(${clean(t1)})$, defined as (Euler's estimate) $-$ (the exact value).`,
      answer: { kind: 'number', value: clean(error) },
      solution: [
        { text: 'One Euler step from the initial point:', tex: `y_1 = ${y0} + ${clean(h)}\\cdot ${slope0} = ${clean(eulerEstimate)}` },
        { text: `The exact value at $t = ${clean(t1)}$:`, tex: `y(${clean(t1)}) = ${quadraticAt(clean(t1))} = ${clean(exact)}` },
        { text: 'The error is the Euler estimate minus the exact value:', tex: `${clean(eulerEstimate)} - ${clean(exact)} = ${clean(error)}` },
      ],
      hints: HINTS_COMPARE,
      inputHint: INPUT_HINT_NUMBER,
    }
  }

  const correctId = error < 0 ? 'underestimates' : 'overestimates'
  const reason =
    a > 0
      ? `the exact solution $y = ${quadratic}$ is convex (it curves upward), and Euler follows the tangent line, which lies below a convex curve`
      : `the exact solution $y = ${quadratic}$ is concave (it curves downward), and Euler follows the tangent line, which lies above a concave curve`
  const options: ChoiceOption[] = rng.shuffle(COMPARE_LABELS.map((label) => ({ id: label, label })))

  return {
    statement: `The initial value problem $y' = ${coefPrefix(2 * a)}t$, $y(${t0}) = ${y0}$ has exact solution $y(t) = ${quadratic}$. Does one Euler step of size $h = ${clean(h)}$ overestimate or underestimate the true value of $y(${clean(t1)})$?`,
    answer: { kind: 'choice', options, correctId },
    solution: [
      { text: 'One Euler step from the initial point, compared with the exact value at the same time:', tex: `y_1 = ${clean(eulerEstimate)}, \\qquad y(${clean(t1)}) = ${clean(exact)}` },
      { text: `Since ${reason}, the Euler estimate ${correctId} the true value.` },
    ],
    hints: HINTS_COMPARE,
  }
}

function tier3(rng: Rng): Problem {
  return eulerVsExact(rng)
}

export const template: SkillTemplate = {
  skillId: 'euler_method',
  theory,
  expectedSeconds: { 1: 70, 2: 110, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
