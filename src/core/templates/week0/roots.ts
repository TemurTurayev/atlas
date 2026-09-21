import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Корень n-й степени (n-th root): $\\sqrt[n]{a^{n}}=a$ для $a\\geq0$; $\\sqrt{a}$ — это $\\sqrt[2]{a}$.',
  'Дробный показатель — это корень: $a^{\\frac{m}{n}} = \\sqrt[n]{a^{m}} = \\left(\\sqrt[n]{a}\\right)^{m}$.',
  'Произведение корней: $\\sqrt{a}\\cdot\\sqrt{b}=\\sqrt{ab}$; $\\left(\\sqrt{a}\\right)^{2}=a$.',
  'Избавление от корня в знаменателе: $\\dfrac{1}{\\sqrt{a}}=\\dfrac{\\sqrt{a}}{a}$.',
  'Типичные ошибки: считать $\\sqrt{a+b}=\\sqrt{a}+\\sqrt{b}$ (это неверно); путать $\\sqrt[3]{a}$ с $\\sqrt{a}$.',
].join('\n')

const HINTS_BASIC = ['Подбери число, которое при возведении в нужную степень даёт число под корнем.', 'Проверь: возведи предполагаемый ответ обратно в степень.']
const HINTS_FRAC = ['Дробный показатель $\\frac{m}{n}$ значит: корень степени $n$, потом степень $m$ (или наоборот).', 'Сначала найди $\\sqrt[n]{a}$ — это должно быть целое число.']
const HINTS_T3 = ['Попробуй объединить корни под одним знаком корня: $\\sqrt{a}\\cdot\\sqrt{b}=\\sqrt{ab}$.', 'Ищи внутри полный квадрат или используй $\\left(\\sqrt{a}\\right)^{2}=a$.']
const INPUT_HINT = 'Ответ — число, можно с корнем, например sqrt(3)/3'

function build(equation: string, value: string, solution: Problem['solution'], hints: readonly string[]): Problem {
  return {
    statement: `Evaluate: $${equation}$`,
    answer: { kind: 'number', value },
    solution,
    hints,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  if (rng.chance(0.5)) {
    const n = rng.int(2, 12)
    return build(`\\sqrt{${n * n}}`, String(n), [{ text: `Ищем число, квадрат которого равен $${n * n}$, ведь $${n}^{2} = ${n * n}$:`, tex: `\\sqrt{${n * n}} = ${n}` }], HINTS_BASIC)
  }
  const n = rng.int(2, 6)
  return build(`\\sqrt[3]{${n ** 3}}`, String(n), [{ text: `Ищем число, куб которого равен $${n ** 3}$, ведь $${n}^{3} = ${n ** 3}$:`, tex: `\\sqrt[3]{${n ** 3}} = ${n}` }], HINTS_BASIC)
}

function tier2(rng: Rng): Problem {
  const d = rng.pick([3, 4])
  const k = rng.int(2, 5)
  const base = k ** d
  const m = rng.int(1, d - 1)
  const value = k ** m
  const equation = `${base}^{\\frac{${m}}{${d}}}`
  return build(equation, String(value), [
    { text: `Показатель $\\frac{${m}}{${d}}$ значит: корень степени $${d}$, затем степень $${m}$:`, tex: `${base}^{\\frac{${m}}{${d}}} = \\left(\\sqrt[${d}]{${base}}\\right)^{${m}}` },
    { text: `Корень степени $${d}$ из $${base}$ равен $${k}$, так как $${k}^{${d}} = ${base}$:`, tex: `\\sqrt[${d}]{${base}} = ${k}` },
    { text: 'Возводим в степень:', tex: `${k}^{${m}} = ${value}` },
  ], HINTS_FRAC)
}

function rootsProduct(rng: Rng): Problem {
  const c = rng.int(2, 9)
  const m = rng.int(2, 6)
  const a = c * c * m
  const b = m
  const value = c * m
  return build(`\\sqrt{${a}} \\cdot \\sqrt{${b}}`, String(value), [
    { text: 'Объединяем под одним корнем:', tex: `\\sqrt{${a}} \\cdot \\sqrt{${b}} = \\sqrt{${a} \\cdot ${b}} = \\sqrt{${a * b}}` },
    { text: `Под корнем — точный квадрат $${value}^{2}$:`, tex: `\\sqrt{${a * b}} = \\sqrt{${value}^{2}} = ${value}` },
  ], HINTS_T3)
}

function rootPower(rng: Rng): Problem {
  const n = rng.int(2, 9)
  const value = n * n
  return build(`\\left(\\sqrt{${n}}\\right)^{4}`, String(value), [
    { text: 'Разбиваем четвёртую степень на квадрат квадрата:', tex: `\\left(\\sqrt{${n}}\\right)^{4} = \\left(\\left(\\sqrt{${n}}\\right)^{2}\\right)^{2} = ${n}^{2}` },
    { text: 'Вычисляем:', tex: `${n}^{2} = ${value}` },
  ], HINTS_T3)
}

function rationalizeDenominator(rng: Rng): Problem {
  const n = rng.pick([2, 3, 5, 6, 7, 8, 10, 11, 12, 13])
  const value = `\\frac{\\sqrt{${n}}}{${n}}`
  return build(`\\frac{1}{\\sqrt{${n}}}`, value, [
    { text: `Умножаем числитель и знаменатель на $\\sqrt{${n}}$:`, tex: `\\frac{1}{\\sqrt{${n}}} = \\frac{1\\cdot\\sqrt{${n}}}{\\sqrt{${n}}\\cdot\\sqrt{${n}}} = \\frac{\\sqrt{${n}}}{${n}}` },
  ], HINTS_T3)
}

function tier3(rng: Rng): Problem {
  const roll = rng.next()
  if (roll < 0.34) return rootsProduct(rng)
  if (roll < 0.67) return rootPower(rng)
  return rationalizeDenominator(rng)
}

export const template: SkillTemplate = {
  skillId: 'roots',
  theory,
  expectedSeconds: { 1: 30, 2: 75, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
