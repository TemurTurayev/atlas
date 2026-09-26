import { paren } from '../../math/latex'
import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Order of operations: brackets, then powers and roots, then multiplication and division left to right, then addition and subtraction left to right.',
  'A fraction bar works like brackets: compute the numerator and the denominator separately first, and divide last.',
  'Example: $2+3\\cdot4-6$ — first $3\\cdot4=12$, then $2+12-6=8$.',
  'Common mistakes: adding before multiplying; forgetting that multiplication and division have equal priority and go left to right.',
].join('\n')

const HINTS_BASIC = ['Do the multiplication and division first, then the addition and subtraction.', 'Work strictly left to right within the same priority level.']
const INPUT_HINT = 'Enter a number (a fraction with / is allowed)'

function problem(equation: string, answer: string, solution: Problem['solution'], hints: readonly string[] = HINTS_BASIC): Problem {
  return {
    statement: `Evaluate: $${equation}$`,
    answer: { kind: 'number', value: answer },
    solution,
    hints,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const a = rng.int(-9, 9)
  const b = rng.int(2, 9)
  const c = rng.int(2, 9)
  const d = rng.int(1, 9)
  const product = b * c
  const value = a + product - d
  const equation = `${a} + ${b} \\cdot ${c} - ${d}`
  return problem(equation, String(value), [
    { text: 'Multiply first:', tex: `${b} \\cdot ${c} = ${product}` },
    { text: 'Now add and subtract left to right:', tex: `${a} + ${product} - ${d} = ${value}` },
  ])
}

function tier2(rng: Rng): Problem {
  const a = rng.int(-9, 9)
  const e = rng.pick([2, 3, 4])
  const k = rng.int(1, 4)
  const b = e * k
  const c = rng.int(1, 6)
  const d = rng.intExcept(1, 6, [c])
  const diff = c - d
  const square = diff * diff
  const afterMul = b * square
  const afterDiv = afterMul / e
  const value = a + afterDiv
  const equation = `${a} + ${b}\\left(${c}-${d}\\right)^{2} \\div ${e}`
  return problem(
    equation,
    String(value),
    [
      { text: 'Inside the brackets:', tex: `${c}-${d} = ${diff}` },
      { text: 'Raise to the power:', tex: `${paren(diff)}^{2} = ${square}` },
      { text: 'Multiplication and division left to right:', tex: `${b} \\cdot ${square} \\div ${e} = ${afterMul} \\div ${e} = ${afterDiv}` },
      { text: 'Add the first term:', tex: `${a} + ${afterDiv} = ${value}` },
    ],
    ['First compute the brackets, then raise to the power.', 'Multiplication and division have equal priority — do them left to right, and leave addition for last.'],
  )
}

function tier3(rng: Rng): Problem {
  const p = rng.int(2, 5)
  const q = rng.int(1, 6)
  const r = rng.intExcept(1, 6, [q])
  const s = rng.int(1, 9)
  const inner = q + r
  const numerator = p * inner - s
  const t = rng.int(-6, 6)
  const u = rng.intExcept(-6, 6, [t])
  const denominator = t - u
  const value = rat(numerator, denominator)
  const equation = `\\frac{${p}\\left(${q}+${r}\\right)-${s}}{${t}-${paren(u)}}`
  const fracStr = `\\frac{${numerator}}{${denominator}}`
  const reducedStr = ratToLatex(value)
  return problem(
    equation,
    reducedStr,
    [
      { text: 'First the brackets in the numerator:', tex: `${q}+${r} = ${inner}` },
      { text: 'Multiply, then subtract in the numerator:', tex: `${p} \\cdot ${inner} - ${s} = ${p * inner} - ${s} = ${numerator}` },
      { text: 'The denominator:', tex: `${t}-${paren(u)} = ${denominator}` },
      { text: 'Divide the numerator by the denominator and simplify:', tex: `${fracStr === reducedStr ? reducedStr : `${fracStr} = ${reducedStr}`}` },
    ],
    ['Treat the numerator and denominator of the fraction bar separately, as if each were in its own brackets.', 'In the numerator: first the brackets, then multiplication, then subtraction.'],
  )
}

export const template: SkillTemplate = {
  skillId: 'order_ops',
  theory,
  expectedSeconds: { 1: 35, 2: 80, 3: 140 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
