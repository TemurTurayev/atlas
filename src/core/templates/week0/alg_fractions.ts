import { linear } from '../../math/latex'
import { polyMul, polyToLatex, type Poly } from '../../math/poly'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Алгебраическая дробь (algebraic fraction) — отношение многочленов $\\dfrac{P(x)}{Q(x)}$.',
  'Область определения (domain) исключает значения $x$, при которых знаменатель равен нулю.',
  'Чтобы сократить дробь, разложи числитель и знаменатель на множители и убери общие.',
  'Чтобы сложить дроби с разными знаменателями, приведи их к общему знаменателю (common denominator).',
  'Типичная ошибка: сокращать отдельные слагаемые вместо общих множителей.',
].join('\n')

const HINTS = [
  'Разложи числитель и знаменатель на множители, прежде чем сокращать.',
  'При сложении/вычитании дробей приведи их к общему знаменателю.',
]
const INPUT_HINT = 'Введи дробь через /, например (x-1)/x'
const DOMAIN = { x: [1.5, 4] as const }

function tier1(rng: Rng): Problem {
  const b = rng.intExcept(-8, 8, [0])
  const numerator: Poly = [-(b * b), 0, 1]
  const statement = `\\frac{${polyToLatex(numerator)}}{${linear(1, b)}}`
  return {
    statement: { en: `Simplify: $${statement}$`, ru: `Упрости: $${statement}$` },
    answer: { kind: 'expression', value: linear(1, -b), variables: ['x'], domain: DOMAIN },
    solution: [
      { ru: 'Разложим числитель как разность квадратов:', tex: `${polyToLatex(numerator)} = ${linear(1, -b)}\\left(${linear(1, b)}\\right)` },
      { ru: 'Сократим общий множитель:', tex: `\\frac{${linear(1, -b)}\\left(${linear(1, b)}\\right)}{${linear(1, b)}} = ${linear(1, -b)}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const b = rng.intExcept(-8, 8, [0])
  const numerator: Poly = [-(b * b), 0, 1]
  const denominator: Poly = [0, b, 1]
  const statement = `\\frac{${polyToLatex(numerator)}}{${polyToLatex(denominator)}}`
  const answer = `\\frac{${linear(1, -b)}}{x}`
  return {
    statement: { en: `Simplify: $${statement}$`, ru: `Упрости: $${statement}$` },
    answer: { kind: 'expression', value: answer, variables: ['x'], domain: DOMAIN },
    solution: [
      { ru: 'Разложим числитель и знаменатель на множители:', tex: `\\frac{\\left(${linear(1, -b)}\\right)\\left(${linear(1, b)}\\right)}{x\\left(${linear(1, b)}\\right)}` },
      { ru: 'Сократим общий множитель:', tex: answer },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier3(rng: Rng): Problem {
  const [p, q] = rng.shuffle([0, 1, 2, 3]).slice(0, 2)
  const lo = Math.min(p, q)
  const hi = Math.max(p, q)
  const denominator = polyMul([lo, 1], [hi, 1])
  const sum = rng.chance(0.5)
  const statement = `\\frac{1}{${linear(1, lo)}} ${sum ? '+' : '-'} \\frac{1}{${linear(1, hi)}}`
  const numerator: Poly = sum ? [lo + hi, 2] : [hi - lo]
  const value = `\\frac{${polyToLatex(numerator)}}{${polyToLatex(denominator)}}`
  return {
    statement: { en: `Combine into a single fraction: $${statement}$`, ru: `Объедини в одну дробь: $${statement}$` },
    answer: { kind: 'expression', value, variables: ['x'], domain: DOMAIN },
    solution: [
      { ru: 'Общий знаменатель — произведение обоих:', tex: `${linear(1, lo)}\\cdot ${linear(1, hi)} = ${polyToLatex(denominator)}` },
      {
        ru: sum ? 'Приведём каждую дробь к общему знаменателю и сложим числители:' : 'Приведём каждую дробь к общему знаменателю и вычтем числители:',
        tex: value,
      },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

export const template: SkillTemplate = {
  skillId: 'alg_fractions',
  theory,
  expectedSeconds: { 1: 50, 2: 90, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
