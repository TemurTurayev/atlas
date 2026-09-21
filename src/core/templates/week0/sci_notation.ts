import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Scientific notation: $a\\times10^{n}$, where $1\\le a<10$.',
  'Multiplication: multiply the mantissas, add the exponents: $10^{m}\\cdot10^{n}=10^{m+n}$.',
  'Division: divide the mantissas, subtract the exponents: $10^{m}\\div10^{n}=10^{m-n}$.',
  'Addition and subtraction: first bring the numbers to the same order of magnitude (exponent), then add the mantissas.',
  'Common mistakes: adding the exponents when adding numbers instead of aligning them; forgetting to carry the factor of $10$ when aligning orders of magnitude.',
].join('\n')

const HINTS_MUL = ['Multiply the mantissas separately from the powers of ten.', 'When multiplying, the exponents add.']
const HINTS_DIV = ['Divide the mantissas separately from the powers of ten.', 'When dividing, the exponents subtract.']
const HINTS_SUM = ['Bring both numbers to the same power of 10.', 'After aligning the orders of magnitude, just add the mantissas.']
const INPUT_HINT = 'The answer is a number; give it as a*10^n or as a plain decimal'

function trimZeros(s: string): string {
  if (!s.includes('.')) return s
  const trimmed = s.replace(/0+$/, '').replace(/\.$/, '')
  return trimmed === '' || trimmed === '-' ? '0' : trimmed
}

function build(equation: string, value: string, solution: Problem['solution'], hints: readonly string[]): Problem {
  return {
    statement: `Compute: $${equation}$. Give the answer in scientific notation.`,
    answer: { kind: 'number', value },
    solution,
    hints,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const c1 = rng.int(1, 9)
  const e1 = rng.int(-3, 3)
  const c2 = rng.int(1, 9)
  const e2 = rng.int(-3, 3)
  const mantissa = c1 * c2
  const exponent = e1 + e2
  const equation = `\\left(${c1}\\times10^{${e1}}\\right)\\left(${c2}\\times10^{${e2}}\\right)`
  const value = `${mantissa}\\times10^{${exponent}}`
  return build(equation, value, [
    { text: 'Multiply the mantissas:', tex: `${c1}\\cdot${c2} = ${mantissa}` },
    { text: 'Add the exponents:', tex: `10^{${e1}}\\cdot10^{${e2}} = 10^{${exponent}}` },
    { text: 'Result:', tex: `${mantissa}\\times10^{${exponent}}` },
  ], HINTS_MUL)
}

function tier2(rng: Rng): Problem {
  const c2 = rng.int(11, 49)
  const r = rng.int(2, 6)
  const c1 = c2 * r
  const e1 = rng.int(-3, 3)
  const e2 = rng.int(-3, 3)
  const c1Str = (c1 / 10).toFixed(1)
  const c2Str = (c2 / 10).toFixed(1)
  const exponent = e1 - e2
  const equation = `\\dfrac{${c1Str}\\times10^{${e1}}}{${c2Str}\\times10^{${e2}}}`
  const value = `${r}\\times10^{${exponent}}`
  return build(equation, value, [
    { text: 'Divide the mantissas:', tex: `${c1Str} \\div ${c2Str} = ${r}` },
    { text: 'Subtract the exponents:', tex: `10^{${e1}}\\div10^{${e2}} = 10^{${exponent}}` },
    { text: 'Result:', tex: `${r}\\times10^{${exponent}}` },
  ], HINTS_DIV)
}

function tier3(rng: Rng): Problem {
  const e2 = rng.int(-7, -2)
  const e1 = e2 + 1
  const x = rng.int(11, 99)
  const c1Str = (x / 10).toFixed(1)
  const c2 = rng.int(1, 9)
  const sumMantissa = x + c2
  const scale = -e2
  const decimalValue = trimZeros((sumMantissa / 10 ** scale).toFixed(scale))
  const equation = `${c1Str}\\times10^{${e1}} + ${c2}\\times10^{${e2}}`
  return build(equation, decimalValue, [
    { text: `Bring the first term to the order $10^{${e2}}$:`, tex: `${c1Str}\\times10^{${e1}} = ${x}\\times10^{${e2}}` },
    { text: 'Add the mantissas of the same order:', tex: `${x}\\times10^{${e2}} + ${c2}\\times10^{${e2}} = ${sumMantissa}\\times10^{${e2}}` },
    { text: 'Convert to decimal notation:', tex: `${sumMantissa}\\times10^{${e2}} = ${decimalValue}` },
  ], HINTS_SUM)
}

export const template: SkillTemplate = {
  skillId: 'sci_notation',
  theory,
  expectedSeconds: { 1: 30, 2: 75, 3: 130 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
