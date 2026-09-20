import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Знак суммы $\\Sigma$ (sigma notation, summation): $\\sum_{i=m}^{n} a_i = a_m + a_{m+1} + \\dots + a_n$.',
  'Индекс $i$ пробегает все целые значения от нижней границы $m$ до верхней $n$ включительно.',
  'Полезная формула: $\\sum_{i=1}^{n} i = \\dfrac{n(n+1)}{2}$ — сумма первых $n$ натуральных чисел.',
  'Типичная ошибка — забыть крайний член ($i=m$ или $i=n$) или неверно подставить нижнюю границу.',
].join('\n')

const HINTS = [
  'Распиши сумму по слагаемым, подставляя по очереди каждое значение индекса.',
  'Для суммы первых $n$ натуральных чисел используй формулу $\\frac{n(n+1)}{2}$.',
]
const INPUT_HINT = 'Введи число'

function tier1(rng: Rng): Problem {
  const n = rng.int(3, 6)
  const terms = Array.from({ length: n }, (_, i) => (i + 1) ** 2)
  const sum = terms.reduce((s, t) => s + t, 0)
  const statement = `\\sum_{i=1}^{${n}} i^{2}`
  return {
    statement: { en: `Evaluate $${statement}$.`, ru: `Вычисли $${statement}$.` },
    answer: { kind: 'number', value: String(sum) },
    solution: [
      { ru: 'Распишем слагаемые:', tex: `${terms.map((_, i) => `${i + 1}^{2}`).join('+')} = ${terms.join('+')}` },
      { ru: 'Сложим:', tex: `${sum}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const n = rng.int(3, 7)
  const terms = Array.from({ length: n + 1 }, (_, k) => 2 * k + 1)
  const sum = terms.reduce((s, t) => s + t, 0)
  const statement = `\\sum_{k=0}^{${n}} (2k+1)`
  return {
    statement: { en: `Evaluate $${statement}$.`, ru: `Вычисли $${statement}$.` },
    answer: { kind: 'number', value: String(sum) },
    solution: [
      { ru: `Распишем слагаемые при $k=0,1,\\dots,${n}$:`, tex: `${terms.join('+')}` },
      { ru: 'Сложим:', tex: `${sum}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function bigSumBranch(rng: Rng): Problem {
  const n = rng.int(20, 60)
  const sum = (n * (n + 1)) / 2
  const statement = `\\sum_{i=1}^{${n}} i`
  return {
    statement: {
      en: `Evaluate $${statement}$ using the formula for the sum of the first $n$ natural numbers.`,
      ru: `Вычисли $${statement}$, используя формулу суммы первых $n$ натуральных чисел.`,
    },
    answer: { kind: 'number', value: String(sum) },
    solution: [
      { ru: 'Формула суммы первых $n$ натуральных чисел:', tex: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}' },
      { ru: `Подставим $n=${n}$:`, tex: `\\frac{${n}\\cdot ${n + 1}}{2} = ${sum}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function shiftedBranch(rng: Rng): Problem {
  const k = rng.int(2, 6)
  const count = rng.int(10, 30)
  const upper = k + count - 1
  let sum = 0
  for (let i = k; i <= upper; i += 1) sum += i
  const statement = `\\sum_{i=${k}}^{${upper}} i`
  return {
    statement: { en: `Evaluate $${statement}$.`, ru: `Вычисли $${statement}$.` },
    answer: { kind: 'number', value: String(sum) },
    solution: [
      {
        ru: 'Это сумма подряд идущих целых чисел — используем формулу суммы арифметической прогрессии:',
        tex: `\\sum_{i=${k}}^{${upper}} i = \\frac{(${k}+${upper})\\cdot ${count}}{2}`,
      },
      {
        ru: 'Проверим через разность двух сумм от единицы:',
        tex: `\\sum_{i=1}^{${upper}} i - \\sum_{i=1}^{${k - 1}} i = \\frac{${upper}\\cdot ${upper + 1}}{2} - \\frac{${k - 1}\\cdot ${k}}{2} = ${sum}`,
      },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? bigSumBranch(rng) : shiftedBranch(rng)
}

export const template: SkillTemplate = {
  skillId: 'sigma_notation',
  theory,
  expectedSeconds: { 1: 35, 2: 60, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
