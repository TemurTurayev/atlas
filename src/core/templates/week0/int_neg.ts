import { paren } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Integers are …, −2, −1, 0, 1, 2, … Negative numbers lie to the left of zero on the number line.',
  'Signs in multiplication and division: $(-a)\\cdot(-b)=ab$, $(-a)\\cdot b=-ab$, $\\dfrac{-a}{-b}=\\dfrac{a}{b}$.',
  'Subtracting a negative number is the same as adding: $a-(-b)=a+b$.',
  'An even power of a negative number is positive: $(-2)^{2}=4$; an odd power is negative: $(-2)^{3}=-8$.',
  'Common mistakes: losing the minus sign when expanding $-(-n)$; forgetting that multiplication is done before addition and subtraction.',
].join('\n')

const HINTS_BASIC = ['Do the multiplication first, then the addition and subtraction.', 'Subtracting a negative number means adding a positive one: $a-(-n)=a+n$.']
const INPUT_HINT = 'Enter an integer, e.g. -7'

function problem(equation: string, value: number, solution: Problem['solution'], hints: readonly string[] = HINTS_BASIC): Problem {
  return {
    statement: `Evaluate: $${equation}$`,
    answer: { kind: 'number', value: String(value) },
    solution,
    hints,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const a = rng.int(-9, 9)
  const b = rng.int(-9, -1)
  const c = rng.int(2, 9)
  const product = b * c
  const value = a - product
  const equation = `${a} - ${paren(b)} \\cdot ${c}`
  return problem(equation, value, [
    { text: 'Multiply first:', tex: `${paren(b)} \\cdot ${c} = ${product}` },
    { text: `Subtracting $${product}$ means adding $${-product}$:`, tex: `${a} - \\left(${product}\\right) = ${a} + ${-product} = ${value}` },
  ])
}

function tier2(rng: Rng): Problem {
  const p1 = rng.int(-9, 9)
  const p2 = rng.int(-9, -1)
  const p3 = rng.int(-9, -1)
  const p4 = rng.int(2, 6)
  const product = p3 * p4
  const value = p1 - p2 + product
  const equation = `${p1} - ${paren(p2)} + ${paren(p3)} \\cdot ${p4}`
  return problem(
    equation,
    value,
    [
      { text: 'Multiply first:', tex: `${paren(p3)} \\cdot ${p4} = ${product}` },
      { text: `Subtracting the negative $${p2}$ means adding $${-p2}$:`, tex: `${p1} - \\left(${p2}\\right) = ${p1 - p2}` },
      { text: 'Add everything in order, left to right:', tex: `${p1 - p2} + \\left(${product}\\right) = ${value}` },
    ],
    ['Multiplication is done before addition and subtraction.', 'Then add and subtract left to right, tracking the sign of each term.'],
  )
}

function tier3(rng: Rng): Problem {
  const a = rng.int(-6, -2)
  const b = rng.intExcept(-6, -2, [a])
  const p = rng.pick([2, 3])
  const q = rng.pick([2, 3])
  const ap = Math.pow(a, p)
  const bq = Math.pow(b, q)
  const value = ap - bq
  const equation = `${paren(a)}^{${p}} - ${paren(b)}^{${q}}`
  return problem(
    equation,
    value,
    [
      { text: `Raise $${a}$ to the power $${p}$ (${p % 2 === 0 ? 'even power: the result is positive' : 'odd power: the sign is preserved'}):`, tex: `${paren(a)}^{${p}} = ${ap}` },
      { text: `Raise $${b}$ to the power $${q}$:`, tex: `${paren(b)}^{${q}} = ${bq}` },
      { text: 'Subtract:', tex: `${ap} - \\left(${bq}\\right) = ${value}` },
    ],
    [
      'An even power of a negative number is positive; an odd power is negative.',
      'Compute each power separately, then subtract, keeping track of the sign.',
    ],
  )
}

export const template: SkillTemplate = {
  skillId: 'int_neg',
  theory,
  expectedSeconds: { 1: 35, 2: 75, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
