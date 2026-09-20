import { paren } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Целые числа (integers) — это …, −2, −1, 0, 1, 2, … Отрицательные числа лежат левее нуля на числовой прямой.',
  'Знаки при умножении и делении: $(-a)\\cdot(-b)=ab$, $(-a)\\cdot b=-ab$, $\\dfrac{-a}{-b}=\\dfrac{a}{b}$.',
  'Вычесть отрицательное число — то же самое, что прибавить: $a-(-b)=a+b$.',
  'Чётная степень отрицательного числа положительна: $(-2)^{2}=4$; нечётная — отрицательна: $(-2)^{3}=-8$.',
  'Типичные ошибки: потерять минус при раскрытии скобки $-(-n)$; забыть, что умножение выполняется раньше сложения и вычитания.',
].join('\n')

const HINTS_BASIC = ['Сначала выполни умножение, потом сложение и вычитание.', 'Вычесть отрицательное число — значит прибавить положительное: $a-(-n)=a+n$.']
const INPUT_HINT = 'Введи целое число, например -7'

function problem(equation: string, value: number, solution: Problem['solution'], hints: readonly string[] = HINTS_BASIC): Problem {
  return {
    statement: { en: `Evaluate: $${equation}$`, ru: `Вычисли: $${equation}$` },
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
    { ru: 'Сначала умножение:', tex: `${paren(b)} \\cdot ${c} = ${product}` },
    { ru: `Вычесть $${product}$ — значит прибавить $${-product}$:`, tex: `${a} - \\left(${product}\\right) = ${a} + ${-product} = ${value}` },
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
      { ru: 'Сначала умножение:', tex: `${paren(p3)} \\cdot ${p4} = ${product}` },
      { ru: `Вычесть отрицательное $${p2}$ — значит прибавить $${-p2}$:`, tex: `${p1} - \\left(${p2}\\right) = ${p1 - p2}` },
      { ru: 'Складываем всё по порядку слева направо:', tex: `${p1 - p2} + \\left(${product}\\right) = ${value}` },
    ],
    ['Умножение выполняется раньше сложения и вычитания.', 'Дальше складывай и вычитай слева направо, следя за знаком каждого слагаемого.'],
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
      { ru: `Возводим $${a}$ в степень $${p}$ (${p % 2 === 0 ? 'чётная степень — результат положителен' : 'нечётная степень — знак сохраняется'}):`, tex: `${paren(a)}^{${p}} = ${ap}` },
      { ru: `Возводим $${b}$ в степень $${q}$:`, tex: `${paren(b)}^{${q}} = ${bq}` },
      { ru: 'Вычитаем:', tex: `${ap} - \\left(${bq}\\right) = ${value}` },
    ],
    [
      'Чётная степень отрицательного числа даёт положительный результат, нечётная — отрицательный.',
      'Вычисли каждую степень отдельно, затем выполни вычитание, помня про знак.',
    ],
  )
}

export const template: SkillTemplate = {
  skillId: 'int_neg',
  theory,
  expectedSeconds: { 1: 35, 2: 75, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
