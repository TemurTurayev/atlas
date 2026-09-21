import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Power (exponent): $x^{n}$ is $x$ multiplied by itself $n$ times.',
  'Laws of exponents: $x^{m}\\cdot x^{n}=x^{m+n}$, $\\dfrac{x^{m}}{x^{n}}=x^{m-n}$, $(x^{m})^{n}=x^{mn}$, $(xy)^{n}=x^{n}y^{n}$.',
  'A negative exponent is a reciprocal: $x^{-n}=\\dfrac{1}{x^{n}}$ (for $x\\neq0$).',
  'A fractional exponent is a root: $x^{\\frac{m}{n}}=\\left(\\sqrt[n]{x}\\right)^{m}$.',
  'Common mistakes: adding exponents when dividing instead of subtracting; treating $x^{0}=0$ instead of $1$.',
].join('\n')

const HINTS_MUL = ['When multiplying powers with the same base, the exponents add.', 'Apply $x^{m}\\cdot x^{n}=x^{m+n}$.']
const HINTS_DIV = ['First raise the product in parentheses to the power: $(x^{p}y^{q})^{k}=x^{pk}y^{qk}$.', 'Then divide the powers of $x$: the exponents subtract.']
const HINTS_FRAC = ['The exponent $\\frac{m}{n}$ applies to the numeric factor and to each variable.', 'Find the $n$-th root of the numeric factor — it must be exact.']
const INPUT_HINT = 'Enter an expression with variables, e.g. x^5 or 8a^2b^-4'

function powLatex(v: string, e: number): string {
  if (e === 0) return '1'
  return e === 1 ? v : `${v}^{${e}}`
}

function build(equation: string, value: string, variables: readonly string[], solution: Problem['solution'], hints: readonly string[], domain?: Record<string, readonly [number, number]>): Problem {
  return {
    statement: `Simplify: $${equation}$`,
    answer: { kind: 'expression', value, variables, domain },
    solution,
    hints,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const a = rng.int(2, 6)
  const b = rng.int(2, 6)
  const sum = a + b
  const equation = `x^{${a}} \\cdot x^{${b}}`
  return build(equation, powLatex('x', sum), ['x'], [
    { text: 'When multiplying powers with the same base, the exponents add:', tex: `x^{${a}} \\cdot x^{${b}} = x^{${a}+${b}} = x^{${sum}}` },
  ], HINTS_MUL)
}

function tier2(rng: Rng): Problem {
  const p = rng.intExcept(-3, 3, [0])
  const q = rng.intExcept(-3, 3, [0])
  const k = rng.pick([2, 3])
  let m = rng.intExcept(1, 6, [p * k])
  let ex = p * k - m
  if (ex === 0) {
    m = m === 6 ? 1 : m + 1
    ex = p * k - m
  }
  const ey = q * k
  const equation = `\\frac{\\left(x^{${p}}y^{${q}}\\right)^{${k}}}{x^{${m}}}`
  const value = `${powLatex('x', ex)}${powLatex('y', ey)}`
  return build(equation, value, ['x', 'y'], [
    { text: 'Raise the product in parentheses to the power:', tex: `\\left(x^{${p}}y^{${q}}\\right)^{${k}} = x^{${p * k}}y^{${ey}}` },
    { text: 'Divide the powers of $x$ — the exponents subtract:', tex: `\\frac{x^{${p * k}}}{x^{${m}}} = x^{${p * k}-${m}} = x^{${ex}}` },
    { text: 'Result:', tex: `${value}` },
  ], HINTS_DIV)
}

function tier3(rng: Rng): Problem {
  const k = rng.pick([2, 3, 4])
  const c = k ** 3
  const ea = rng.intExcept(-2, 2, [0])
  const eb = rng.intExcept(-2, 2, [0])
  const m = rng.pick([1, 2])
  const pa = 3 * ea
  const pb = 3 * eb
  const coefResult = k ** m
  const aExp = ea * m
  const bExp = eb * m
  const equation = `\\left(${c}a^{${pa}}b^{${pb}}\\right)^{\\frac{${m}}{3}}`
  const value = `${coefResult === 1 ? '' : coefResult}${powLatex('a', aExp)}${powLatex('b', bExp)}`
  return build(
    equation,
    value,
    ['a', 'b'],
    [
      { text: 'The exponent $\\frac{m}{3}$ applies to the number and to each variable separately:', tex: `\\left(${c}a^{${pa}}b^{${pb}}\\right)^{\\frac{${m}}{3}} = ${c}^{\\frac{${m}}{3}}\\cdot a^{${pa}\\cdot\\frac{${m}}{3}}\\cdot b^{${pb}\\cdot\\frac{${m}}{3}}` },
      { text: `Since $${c} = ${k}^{3}$, the cube root of $${c}$ equals $${k}$:`, tex: `${c}^{\\frac{${m}}{3}} = ${k}^{${m}} = ${coefResult}` },
      { text: 'The exponents on the variables are multiplied by $\\frac{m}{3}$:', tex: `a^{${pa}\\cdot\\frac{${m}}{3}} = a^{${aExp}}, \\quad b^{${pb}\\cdot\\frac{${m}}{3}} = b^{${bExp}}` },
    ],
    HINTS_FRAC,
    { a: [1.5, 3], b: [1.5, 3] },
  )
}

export const template: SkillTemplate = {
  skillId: 'powers',
  theory,
  expectedSeconds: { 1: 35, 2: 95, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
