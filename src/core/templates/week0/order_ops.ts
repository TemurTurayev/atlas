import { paren } from '../../math/latex'
import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Порядок действий (order of operations): скобки → степени и корни → умножение и деление слева направо → сложение и вычитание слева направо.',
  'Дробная черта работает как скобки: числитель и знаменатель сначала считают отдельно, а делят в самом конце.',
  'Пример: $2+3\\cdot4-6$ — сначала $3\\cdot4=12$, потом $2+12-6=8$.',
  'Типичные ошибки: складывать раньше умножения; забыть, что деление и умножение равноправны и идут слева направо.',
].join('\n')

const HINTS_BASIC = ['Сначала выполни умножение и деление, потом сложение и вычитание.', 'Считай строго слева направо внутри одного уровня приоритета.']
const INPUT_HINT = 'Введи число (можно дробью через /)'

function problem(equation: string, answer: string, solution: Problem['solution'], hints: readonly string[] = HINTS_BASIC): Problem {
  return {
    statement: { en: `Evaluate: $${equation}$`, ru: `Вычисли: $${equation}$` },
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
    { ru: 'Сначала умножение:', tex: `${b} \\cdot ${c} = ${product}` },
    { ru: 'Теперь сложение и вычитание слева направо:', tex: `${a} + ${product} - ${d} = ${value}` },
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
      { ru: 'Внутри скобок:', tex: `${c}-${d} = ${diff}` },
      { ru: 'Возводим в степень:', tex: `${paren(diff)}^{2} = ${square}` },
      { ru: 'Умножение и деление слева направо:', tex: `${b} \\cdot ${square} \\div ${e} = ${afterMul} \\div ${e} = ${afterDiv}` },
      { ru: 'Прибавляем первое слагаемое:', tex: `${a} + ${afterDiv} = ${value}` },
    ],
    ['Сначала посчитай то, что в скобках, потом возведи в степень.', 'Умножение и деление равноправны — считай их слева направо, а сложение оставь напоследок.'],
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
  const equation = `\\frac{${p}\\left(${q}+${r}\\right)-${s}}{${t}-${u}}`
  return problem(
    equation,
    ratToLatex(value),
    [
      { ru: 'Сначала скобка в числителе:', tex: `${q}+${r} = ${inner}` },
      { ru: 'Умножение, затем вычитание в числителе:', tex: `${p} \\cdot ${inner} - ${s} = ${p * inner} - ${s} = ${numerator}` },
      { ru: 'Знаменатель:', tex: `${t}-${u} = ${denominator}` },
      { ru: 'Делим числитель на знаменатель и сокращаем:', tex: `\\frac{${numerator}}{${denominator}} = ${ratToLatex(value)}` },
    ],
    ['Числитель и знаменатель дробной черты считай отдельно, как будто каждый в своих скобках.', 'В числителе — сначала скобка, потом умножение, потом вычитание.'],
  )
}

export const template: SkillTemplate = {
  skillId: 'order_ops',
  theory,
  expectedSeconds: { 1: 35, 2: 80, 3: 140 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
