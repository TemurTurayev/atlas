import { coefPrefix, joinTerms } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Algebraic expression: a combination of variables, numbers, and operations.',
  'Like terms have the same variable raised to the same power; add their coefficients.',
  'Expanding: $a(b+c) = ab + ac$ — the sign in front of the bracket multiplies every term inside.',
  'Substitution: replace the letters with numbers and evaluate using the order of operations.',
  'Common mistakes: adding coefficients of different variables; forgetting to multiply the second term inside the bracket.',
].join('\n')

const HINTS = [
  'Group the terms with the same variable.',
  'Expand the brackets: multiply the number in front by each term inside.',
]
const INPUT_HINT = 'Enter the expression using + and -, e.g. 3x+7y'

function tier1(rng: Rng): Problem {
  const cx1 = rng.intExcept(-9, 9, [0])
  const cx2 = rng.intExcept(-9, 9, [0, -cx1])
  const cy1 = rng.intExcept(-9, 9, [0])
  const cy2 = rng.intExcept(-9, 9, [0, -cy1])
  const X = cx1 + cx2
  const Y = cy1 + cy2
  const statement = joinTerms([`${coefPrefix(cx1)}x`, `${coefPrefix(cy1)}y`, `${coefPrefix(cx2)}x`, `${coefPrefix(cy2)}y`])
  const answer = joinTerms([`${coefPrefix(X)}x`, `${coefPrefix(Y)}y`])
  return {
    statement: `Simplify by collecting like terms: $${statement}$`,
    answer: { kind: 'expression', value: answer, variables: ['x', 'y'], form: 'expanded' },
    solution: [
      { text: `Terms with $x$: $${cx1}x ${cx2 >= 0 ? '+' : '-'} ${Math.abs(cx2)}x = ${X}x$` },
      { text: `Terms with $y$: $${cy1}y ${cy2 >= 0 ? '+' : '-'} ${Math.abs(cy2)}y = ${Y}y$` },
      { text: 'Result:', tex: answer },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const p = rng.int(2, 6)
  const q = rng.int(2, 6)
  const a = rng.pick([1, 2, 3])
  const c = rng.pick([1, 2, 3])
  const wantMinus = rng.chance(0.5)
  const sign = wantMinus && p * a !== q * c ? -1 : 1
  const b = rng.intExcept(-9, 9, [0])
  const d = rng.intExcept(-9, 9, [0])
  const X = p * a + sign * q * c
  const K = p * b + sign * q * d
  const term1 = `${coefPrefix(p)}\\left(${joinTerms([`${coefPrefix(a)}x`, String(b)])}\\right)`
  const term2raw = `${coefPrefix(q)}\\left(${joinTerms([`${coefPrefix(c)}x`, String(d)])}\\right)`
  const term2 = sign === 1 ? term2raw : `-${term2raw}`
  const statement = joinTerms([term1, term2])
  const answer = joinTerms([`${coefPrefix(X)}x`, String(K)])
  return {
    statement: `Expand and collect like terms: $${statement}$`,
    answer: { kind: 'expression', value: answer, variables: ['x'], form: 'expanded' },
    solution: [
      { text: 'Expand the first bracket:', tex: `${p}\\left(${joinTerms([`${coefPrefix(a)}x`, String(b)])}\\right) = ${joinTerms([`${coefPrefix(p * a)}x`, String(p * b)])}` },
      {
        text: sign === 1 ? 'Expand the second bracket:' : 'Expand the second bracket (remember to flip both signs inside):',
        tex: `${sign === 1 ? '' : '-'}${q}\\left(${joinTerms([`${coefPrefix(c)}x`, String(d)])}\\right) = ${joinTerms([`${coefPrefix(sign * q * c)}x`, String(sign * q * d)])}`,
      },
      { text: 'Add the like terms:', tex: answer },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function decimalString(tenths: number): string {
  return tenths % 10 === 0 ? String(tenths / 10) : (tenths / 10).toFixed(1)
}

function bmiProblem(rng: Rng): Problem {
  const h = rng.int(150, 195)
  const w = rng.int(45, 100)
  const hm = h / 100
  const bmi = Math.round((w / (hm * hm)) * 10) / 10
  const bmiStr = bmi.toFixed(1)
  return {
    statement: `A patient weighs $${w}$ kg and is $${h}$ cm tall. Compute the BMI (body mass index) $= \\dfrac{\\text{weight, kg}}{\\text{height, m}^{2}}$, rounded to $1$ decimal place.`,
    answer: { kind: 'number', value: bmiStr },
    solution: [
      { text: `Convert the height to meters: $${h}$ cm $= ${hm}$ m.` },
      { text: 'Substitute into the formula and compute:', tex: `BMI = \\frac{${w}}{${hm}^{2}} \\approx ${bmiStr}` },
    ],
    hints: ['Convert the height from centimeters to meters before squaring.', 'BMI = weight (kg) / height² (in meters).'],
    inputHint: 'Enter a number with a decimal point, e.g. 22.5',
  }
}

function kinematicsProblem(rng: Rng): Problem {
  const v0Tenths = rng.int(10, 80)
  const t = rng.int(2, 6)
  const a = rng.int(1, 6)
  const v0Str = decimalString(v0Tenths)
  const term1Tenths = v0Tenths * t
  const term2Tenths = 5 * a * t * t
  const sStr = decimalString(term1Tenths + term2Tenths)
  return {
    statement: `A body moves with initial velocity $v_0 = ${v0Str}$ m/s and constant acceleration $a = ${a}$ m/s$^{2}$. Find the distance $s = v_0 t + \\dfrac{a t^{2}}{2}$ after $t = ${t}$ s.`,
    answer: { kind: 'number', value: sStr },
    solution: [
      { text: 'Substitute the values into the formula:', tex: `s = ${v0Str}\\cdot ${t} + \\frac{${a}\\cdot ${t}^{2}}{2}` },
      { text: 'Compute each term and add them:', tex: `s = ${decimalString(term1Tenths)} + ${decimalString(term2Tenths)} = ${sStr}` },
    ],
    hints: ['Substitute the numbers for $v_0$, $a$, $t$ one at a time.', 'Do not forget to divide $at^2$ by $2$.'],
    inputHint: 'Enter a number (a decimal point is allowed)',
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? bmiProblem(rng) : kinematicsProblem(rng)
}

export const template: SkillTemplate = {
  skillId: 'algebra_expr',
  theory,
  expectedSeconds: { 1: 40, 2: 85, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
