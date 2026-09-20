import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Показательная функция (exponential function): $f(t)=A\\cdot b^{t/k}$, где $A$ — начальное значение, $b$ — множитель роста/распада за один период длиной $k$.',
  'Особое основание — число Эйлера $e\\approx 2.718$: $f(t)=A e^{kt}$; при $k>0$ — рост, при $k<0$ — распад (например, выведение лекарства из организма).',
  'Если период назван «время удвоения» или «период полураспада», подставляй $b=2$, а прошедшее время удели на длину периода — получишь число периодов $n$.',
  'Типичная ошибка: складывать проценты или периоды вместо перемножения множителей роста; $b^{n}$ — это умножение, не сложение.',
].join('\n')

const HINTS_FORMULA = [
  'Раздели показатель $t/k$, чтобы получить целое число периодов.',
  'Возведи основание в эту степень и умножь на начальное значение $A$.',
]
const HINTS_PERIOD = [
  'Раздели прошедшее время на длину одного периода — получишь число периодов $n$.',
  'Умножь (при росте) или раздели (при распаде) начальное значение на $2^{n}$.',
]
const HINTS_CLEARANCE = [
  'Подставь данные значения $t$ и $k$ в показатель степени.',
  'Вычисли $e^{-kt}$ и умножь на $C_0$; ответ округли до сотых.',
]

function tier1(rng: Rng): Problem {
  const A = rng.int(2, 20) * 10
  const b = rng.pick([2, 3, 5])
  const k = rng.int(2, 5)
  const m = rng.int(1, 4)
  const t = k * m
  const value = A * b ** m
  const formula = `${A}\\cdot ${b}^{t/${k}}`
  return {
    statement: {
      en: `A population is modeled by $N(t) = ${formula}$. Find $N(${t})$.`,
      ru: `Численность популяции моделируется функцией $N(t) = ${formula}$. Найди $N(${t})$.`,
    },
    answer: { kind: 'number', value: String(value) },
    solution: [
      { ru: `Подставляем $t=${t}$: показатель степени равен $t/${k}=${m}$.`, tex: `N(${t}) = ${A}\\cdot ${b}^{${t}/${k}} = ${A}\\cdot ${b}^{${m}}` },
      { ru: 'Вычисляем степень и умножаем:', tex: `${A}\\cdot ${b ** m} = ${value}` },
    ],
    hints: HINTS_FORMULA,
  }
}

function halfLife(rng: Rng): Problem {
  const n = rng.int(1, 4)
  const h = rng.pick([2, 3, 4, 5, 6, 8])
  const R = rng.int(2, 20)
  const M0 = R * 2 ** n
  const t = n * h
  return {
    statement: {
      en: `A radioactive isotope has a half-life of $${h}$ hours. A sample starts at $${M0}$ g. Find the remaining mass after $${t}$ hours.`,
      ru: `Период полураспада радиоактивного изотопа равен $${h}$ часов. Образец имеет начальную массу $${M0}$ г. Найди оставшуюся массу через $${t}$ часов.`,
    },
    answer: { kind: 'number', value: String(R) },
    solution: [
      { ru: `За $${t}$ часов проходит $\\frac{${t}}{${h}}=${n}$ периодов полураспада.` },
      { ru: 'Каждый период масса делится пополам:', tex: `${M0} \\div 2^{${n}} = ${R}` },
    ],
    hints: HINTS_PERIOD,
  }
}

function doubling(rng: Rng): Problem {
  const n = rng.int(1, 4)
  const d = rng.pick([2, 3, 4, 5, 6])
  const P0 = rng.int(2, 20)
  const t = n * d
  const value = P0 * 2 ** n
  return {
    statement: {
      en: `A bacteria colony doubles every $${d}$ hours. It starts with $${P0}$ cells. Find the population after $${t}$ hours.`,
      ru: `Колония бактерий удваивается каждые $${d}$ часов. Начальная численность — $${P0}$ клеток. Найди численность через $${t}$ часов.`,
    },
    answer: { kind: 'number', value: String(value) },
    solution: [
      { ru: `За $${t}$ часов проходит $\\frac{${t}}{${d}}=${n}$ периодов удвоения.` },
      { ru: 'Каждый период численность удваивается:', tex: `${P0} \\cdot 2^{${n}} = ${value}` },
    ],
    hints: HINTS_PERIOD,
  }
}

function tier2(rng: Rng): Problem {
  return rng.chance(0.5) ? halfLife(rng) : doubling(rng)
}

/** integer/10 as a trimmed decimal string, exact since the denominator is 10: 21 -> "2.1", 30 -> "3". */
function tenths(value: number): string {
  const s = (value / 10).toFixed(1)
  return s.endsWith('.0') ? s.slice(0, -2) : s
}

function tier3(rng: Rng): Problem {
  const C0 = rng.int(2, 20) * 10
  const kTenths = rng.int(1, 6)
  const t = rng.int(2, 9)
  const kLatex = tenths(kTenths)
  const expLatex = tenths(kTenths * t)
  const value = `${C0}e^{-${expLatex}}`
  const numeric = C0 * Math.exp((-kTenths * t) / 10)
  return {
    statement: {
      en: `A drug concentration follows $C(t) = C_0 e^{-kt}$ with $C_0=${C0}$ mg/L and $k=${kLatex}$ per hour. Find $C(${t})$, in mg/L (round to 2 decimal places).`,
      ru: `Концентрация препарата подчиняется закону $C(t) = C_0 e^{-kt}$, где $C_0=${C0}$ мг/л, $k=${kLatex}$ ч$^{-1}$. Найди $C(${t})$ в мг/л (округли до сотых).`,
    },
    answer: { kind: 'number', value },
    solution: [
      { ru: `Подставляем $C_0=${C0}$, $k=${kLatex}$, $t=${t}$:`, tex: `C(${t}) = ${C0} e^{-${kLatex}\\cdot ${t}} = ${C0} e^{-${expLatex}}` },
      { ru: 'Вычисляем на калькуляторе:', tex: `\\approx ${numeric.toFixed(2)}` },
    ],
    hints: HINTS_CLEARANCE,
    inputHint: 'Ответ — десятичное число, например 12.34 (округли до сотых)',
  }
}

export const template: SkillTemplate = {
  skillId: 'exp_fn',
  theory,
  expectedSeconds: { 1: 45, 2: 90, 3: 130 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
