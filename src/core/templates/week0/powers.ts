import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Степень (power, exponent): $x^{n}$ — это $x$, умноженное само на себя $n$ раз.',
  'Законы степеней: $x^{m}\\cdot x^{n}=x^{m+n}$, $\\dfrac{x^{m}}{x^{n}}=x^{m-n}$, $(x^{m})^{n}=x^{mn}$, $(xy)^{n}=x^{n}y^{n}$.',
  'Отрицательный показатель — это обратная величина: $x^{-n}=\\dfrac{1}{x^{n}}$ (при $x\\neq0$).',
  'Дробный показатель — это корень: $x^{\\frac{m}{n}}=\\left(\\sqrt[n]{x}\\right)^{m}$.',
  'Типичные ошибки: складывать показатели при делении вместо вычитания; считать $x^{0}=0$ вместо $1$.',
].join('\n')

const HINTS_MUL = ['При умножении степеней с одинаковым основанием показатели складываются.', 'Примени $x^{m}\\cdot x^{n}=x^{m+n}$.']
const HINTS_DIV = ['Сначала возведи произведение в скобках в степень: $(x^{p}y^{q})^{k}=x^{pk}y^{qk}$.', 'Затем раздели степени с основанием $x$: показатели вычитаются.']
const HINTS_FRAC = ['Показатель $\\frac{m}{n}$ действует и на числовой множитель, и на каждую переменную.', 'Найди корень степени $n$ из числового множителя — он должен быть точным.']
const INPUT_HINT = 'Введи выражение с переменными, например x^5 или 8a^2b^-4'

function powLatex(v: string, e: number): string {
  if (e === 0) return '1'
  return e === 1 ? v : `${v}^{${e}}`
}

function build(equation: string, value: string, variables: readonly string[], solution: Problem['solution'], hints: readonly string[], domain?: Record<string, readonly [number, number]>): Problem {
  return {
    statement: { en: `Simplify: $${equation}$`, ru: `Упрости: $${equation}$` },
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
    { ru: 'При умножении степеней с одним основанием показатели складываются:', tex: `x^{${a}} \\cdot x^{${b}} = x^{${a}+${b}} = x^{${sum}}` },
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
    { ru: 'Возводим произведение в скобках в степень:', tex: `\\left(x^{${p}}y^{${q}}\\right)^{${k}} = x^{${p * k}}y^{${ey}}` },
    { ru: 'Делим степени с основанием $x$ — показатели вычитаются:', tex: `\\frac{x^{${p * k}}}{x^{${m}}} = x^{${p * k}-${m}} = x^{${ex}}` },
    { ru: 'Итог:', tex: `${value}` },
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
      { ru: 'Показатель $\\frac{m}{3}$ применяется к числу и к каждой переменной отдельно:', tex: `\\left(${c}a^{${pa}}b^{${pb}}\\right)^{\\frac{${m}}{3}} = ${c}^{\\frac{${m}}{3}}\\cdot a^{${pa}\\cdot\\frac{${m}}{3}}\\cdot b^{${pb}\\cdot\\frac{${m}}{3}}` },
      { ru: `Так как $${c} = ${k}^{3}$, корень кубический из $${c}$ равен $${k}$:`, tex: `${c}^{\\frac{${m}}{3}} = ${k}^{${m}} = ${coefResult}` },
      { ru: 'Показатели при переменных умножаются на $\\frac{m}{3}$:', tex: `a^{${pa}\\cdot\\frac{${m}}{3}} = a^{${aExp}}, \\quad b^{${pb}\\cdot\\frac{${m}}{3}} = b^{${bExp}}` },
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
