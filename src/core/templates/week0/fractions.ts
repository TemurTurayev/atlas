import { add, div, lcm, rat, ratToLatex, sub, type Rational } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Дробь (fraction) $\\frac{a}{b}$: $a$ — числитель, $b$ — знаменатель.',
  'Сложение/вычитание: приведи к общему знаменателю (НОК знаменателей), затем работай с числителями.',
  'Деление на дробь — умножение на обратную: $\\dfrac{a}{b} \\div \\dfrac{c}{d} = \\dfrac{a}{b}\\cdot\\dfrac{d}{c}$.',
  'В составной дроби сначала упрости числитель и знаменатель по отдельности, потом раздели их.',
  'Типичные ошибки: складывать числители и знаменатели напрямую без общего знаменателя; забыть перевернуть вторую дробь при делении.',
].join('\n')

const HINTS_ADD = ['Найди общий знаменатель (НОК знаменателей).', 'Переведи обе дроби к общему знаменателю, сложи числители, сократи результат.']
const HINTS_MIXED = ['Сначала выполни деление — переверни вторую дробь и умножь.', 'После этого приведи обе дроби к общему знаменателю и вычти.']
const HINTS_COMPOUND = ['Сначала посчитай сумму в числителе, приведя её к общему знаменателю.', 'Раздели получившуюся дробь на дробь в знаменателе — умножь на обратную.']
const INPUT_HINT = 'Ответ — дробь, например 7/20, или целое число'

function fracLatex(r: Rational): string {
  return r.n < 0 ? `-\\frac{${-r.n}}{${r.d}}` : `\\frac{${r.n}}{${r.d}}`
}

function problem(equation: string, value: Rational, solution: Problem['solution'], hints: readonly string[]): Problem {
  return {
    statement: { en: `Compute: $${equation}$`, ru: `Вычисли: $${equation}$` },
    answer: { kind: 'number', value: ratToLatex(value) },
    solution,
    hints,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const b = rng.int(2, 9)
  const d = rng.intExcept(2, 9, [b])
  const a = rng.int(1, b - 1)
  const c = rng.int(1, d - 1)
  const fa = rat(a, b)
  const fc = rat(c, d)
  const value = add(fa, fc)
  const l = lcm(b, d)
  const na = a * (l / b)
  const nc = c * (l / d)
  const equation = `\\frac{${a}}{${b}} + \\frac{${c}}{${d}}`
  return problem(
    equation,
    value,
    [
      { ru: `Общий знаменатель — НОК$(${b},${d}) = ${l}$:`, tex: `\\frac{${a}}{${b}} = \\frac{${na}}{${l}}, \\quad \\frac{${c}}{${d}} = \\frac{${nc}}{${l}}` },
      { ru: 'Складываем числители:', tex: `\\frac{${na}}{${l}} + \\frac{${nc}}{${l}} = \\frac{${na + nc}}{${l}}` },
      { ru: 'Сокращаем, если возможно:', tex: `= ${ratToLatex(value)}` },
    ],
    HINTS_ADD,
  )
}

function tier2(rng: Rng): Problem {
  const b = rng.int(2, 9)
  const a = rng.int(1, b - 1)
  const d = rng.int(2, 9)
  const c = rng.int(1, d - 1)
  const f = rng.int(2, 9)
  const e = rng.int(1, f - 1)
  const divPart = div(rat(c, d), rat(e, f))
  const value = sub(rat(a, b), divPart)
  const equation = `\\frac{${a}}{${b}} - \\frac{${c}}{${d}} \\div \\frac{${e}}{${f}}`
  return problem(
    equation,
    value,
    [
      { ru: 'Деление на дробь — умножение на обратную:', tex: `\\frac{${c}}{${d}} \\div \\frac{${e}}{${f}} = \\frac{${c}}{${d}} \\cdot \\frac{${f}}{${e}} = ${fracLatex(divPart)}` },
      { ru: 'Приводим к общему знаменателю и вычитаем:', tex: `\\frac{${a}}{${b}} - ${fracLatex(divPart)} = ${ratToLatex(value)}` },
    ],
    HINTS_MIXED,
  )
}

function tier3(rng: Rng): Problem {
  const b = rng.int(2, 8)
  const a = rng.int(1, b - 1)
  const d = rng.intExcept(2, 8, [b])
  const c = rng.int(1, d - 1)
  const f = rng.int(2, 6)
  const e = rng.int(1, f - 1)
  const sum = add(rat(a, b), rat(c, d))
  const value = div(sum, rat(e, f))
  const equation = `\\dfrac{\\frac{${a}}{${b}} + \\frac{${c}}{${d}}}{\\frac{${e}}{${f}}}`
  return problem(
    equation,
    value,
    [
      { ru: 'Сначала сложим дроби в числителе:', tex: `\\frac{${a}}{${b}} + \\frac{${c}}{${d}} = ${fracLatex(sum)}` },
      { ru: 'Разделить на дробь — умножить на обратную:', tex: `${fracLatex(sum)} \\div \\frac{${e}}{${f}} = ${fracLatex(sum)} \\cdot \\frac{${f}}{${e}} = ${ratToLatex(value)}` },
    ],
    HINTS_COMPOUND,
  )
}

export const template: SkillTemplate = {
  skillId: 'fractions',
  theory,
  expectedSeconds: { 1: 40, 2: 90, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
