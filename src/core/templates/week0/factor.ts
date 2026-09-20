import { linear } from '../../math/latex'
import { polyFromRoots, polyToLatex, type Poly } from '../../math/poly'
import { gcd } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SolutionStep, SkillTemplate } from '../types'

const theory = [
  'Разложить на множители (factor) — записать выражение как произведение.',
  '1. Вынеси общий множитель: $6x^2 - 9x = 3x(2x - 3)$.',
  '2. Разность квадратов (difference of squares): $a^2 - b^2 = (a - b)(a + b)$.',
  '3. Трёхчлен: $x^2 + bx + c = (x - x_1)(x - x_2)$, где $x_1 + x_2 = -b$ и $x_1 x_2 = c$.',
  'Проверка — раскрой скобки обратно. Ответ вводи произведением, например (x-2)(x+3).',
].join('\n')

const HINTS = ['Есть ли общий множитель у всех слагаемых?', 'Для $x^2 + bx + c$ найди два числа: их сумма $-b$, произведение $c$.']
const INPUT_HINT = 'Запиши произведение, например 3x(x-2) или (x-1)(x+4)'

const bracket = (a: number, b: number): string => `\\left(${linear(a, b)}\\right)`

function build(poly: Poly, value: string, solution: readonly SolutionStep[]): Problem {
  const expanded = polyToLatex(poly)
  return {
    statement: { en: `Factor completely: $${expanded}$`, ru: `Разложи на множители: $${expanded}$` },
    answer: { kind: 'expression', value, variables: ['x'], form: 'factored' },
    solution,
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const k = rng.int(2, 6)
  const p = rng.intExcept(-7, 7, [0])
  if (rng.chance(0.6)) {
    const poly = [0, k * p, k]
    const value = `${k}x${bracket(1, p)}`
    return build(poly, value, [{ ru: `Общий множитель — $${k}x$:`, tex: `${polyToLatex(poly)} = ${value}` }])
  }
  const poly = [k * p, k]
  const value = `${k}${bracket(1, p)}`
  return build(poly, value, [{ ru: `Общий множитель — $${k}$:`, tex: `${polyToLatex(poly)} = ${value}` }])
}

function tier2(rng: Rng): Problem {
  const r1 = rng.intExcept(-8, 8, [0])
  const r2 = rng.intExcept(-8, 8, [0, r1])
  const poly = polyFromRoots(1, [r1, r2])
  const value = `${bracket(1, -r1)}${bracket(1, -r2)}`
  return build(poly, value, [
    { ru: `Ищем два числа с суммой $${r1 + r2}$ и произведением $${r1 * r2}$: это $${r1}$ и $${r2}$.` },
    { ru: 'Значит:', tex: `${polyToLatex(poly)} = ${value}` },
  ])
}

function tier3(rng: Rng): Problem {
  if (rng.chance(0.5)) {
    const a = rng.int(1, 5)
    const b = rng.intExcept(1, 9, [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => gcd(n, a) !== 1))
    const poly = [-b * b, 0, a * a]
    const value = `${bracket(a, -b)}${bracket(a, b)}`
    return build(poly, value, [
      { ru: `Разность квадратов: $${polyToLatex(poly)} = (${linear(a, 0)})^2 - ${b}^2$.` },
      { ru: 'По формуле $a^2 - b^2 = (a-b)(a+b)$:', tex: value },
    ])
  }
  const k = rng.pick([2, 3, 5])
  const r1 = rng.intExcept(-6, 6, [0])
  const r2 = rng.intExcept(-6, 6, [0, r1])
  const poly = polyFromRoots(k, [r1, r2])
  const inner = polyFromRoots(1, [r1, r2])
  const value = `${k}${bracket(1, -r1)}${bracket(1, -r2)}`
  return build(poly, value, [
    { ru: `Вынесем общий множитель $${k}$:`, tex: `${k}\\left(${polyToLatex(inner)}\\right)` },
    { ru: `Числа с суммой $${r1 + r2}$ и произведением $${r1 * r2}$ — это $${r1}$ и $${r2}$:`, tex: value },
  ])
}

export const template: SkillTemplate = {
  skillId: 'factor',
  theory,
  expectedSeconds: { 1: 45, 2: 90, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
