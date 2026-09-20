import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Показательное уравнение (exponential equation): если $b^{x}=b^{y}$ при $b>0,\\ b\\ne1$, то $x=y$ — приравнивай показатели.',
  'Если основания разные, логарифмируй обе части: из $Ae^{kt}=B$ следует $t=\\dfrac{1}{k}\\ln\\dfrac{B}{A}$.',
  'Логарифмическое уравнение (logarithmic equation): собери логарифмы в один по свойствам, затем перейди к показательной форме $\\log_b N=c \\iff N=b^{c}$.',
  'После решения логарифмического уравнения проверяй, что аргументы логарифмов остаются положительными — посторонние корни отбрасываются.',
  'Типичная ошибка: забыть про область допустимых значений и оставить корень, при котором выражение под логарифмом отрицательно.',
].join('\n')

function tier1(rng: Rng): Problem {
  const b = rng.pick([2, 3, 5])
  const m = rng.int(2, 5)
  const N = b ** m
  return {
    statement: { en: `Solve for $x$: $${b}^{x} = ${N}$.`, ru: `Реши уравнение относительно $x$: $${b}^{x} = ${N}$.` },
    answer: { kind: 'number', value: String(m) },
    solution: [
      { ru: 'Записываем правую часть как степень того же основания:', tex: `${N} = ${b}^{${m}}` },
      { ru: 'Основания равны, значит равны и показатели:', tex: `x = ${m}` },
    ],
    hints: ['Представь правую часть как степень основания $b$.', 'Если $b^{x}=b^{m}$, то $x=m$.'],
  }
}

const K_OPTIONS: readonly { readonly n: number; readonly latex: string }[] = [
  { n: 2, latex: '0.5' },
  { n: 4, latex: '0.25' },
  { n: 5, latex: '0.2' },
  { n: 10, latex: '0.1' },
]

function tier2(rng: Rng): Problem {
  const { n, latex: kLatex } = rng.pick(K_OPTIONS)
  const A = rng.int(2, 9)
  const R = rng.intExcept(2, 9, [1])
  const B = A * R
  return {
    statement: {
      en: `Solve for $t$: $${A}e^{${kLatex}t} = ${B}$.`,
      ru: `Реши уравнение относительно $t$: $${A}e^{${kLatex}t} = ${B}$.`,
    },
    answer: { kind: 'number', value: `${n}\\ln ${R}` },
    solution: [
      { ru: 'Делим обе части на коэффициент перед экспонентой:', tex: `e^{${kLatex}t} = \\frac{${B}}{${A}} = ${R}` },
      { ru: 'Берём натуральный логарифм от обеих частей:', tex: `${kLatex}t = \\ln ${R}` },
      { ru: 'Выражаем $t$:', tex: `t = \\frac{\\ln ${R}}{${kLatex}} = ${n}\\ln ${R}` },
    ],
    hints: [
      'Раздели обе части уравнения на коэффициент перед экспонентой.',
      'Прологарифмируй обе части натуральным логарифмом: $\\ln(e^{u})=u$.',
    ],
    inputHint: 'Точный ответ или десятичное приближение, например 5\\ln4 или 6.93',
  }
}

interface LogEqCase {
  readonly b: number
  readonly p: number
  readonly x0: number
  readonly c: number
}

/** Curated so that (x0-p)(x0+p) = b^c exactly. */
const CASES: readonly LogEqCase[] = [
  { b: 2, p: 1, x0: 3, c: 3 },
  { b: 2, p: 3, x0: 5, c: 4 },
  { b: 2, p: 7, x0: 9, c: 5 },
  { b: 3, p: 1, x0: 2, c: 1 },
  { b: 3, p: 4, x0: 5, c: 2 },
  { b: 3, p: 3, x0: 6, c: 3 },
  { b: 5, p: 2, x0: 3, c: 1 },
]

function tier3(rng: Rng): Problem {
  const { b, p, x0, c } = rng.pick(CASES)
  const bc = b ** c
  return {
    statement: {
      en: `Solve for $x$ (assume $x>${p}$): $\\log_{${b}}(x-${p}) + \\log_{${b}}(x+${p}) = ${c}$.`,
      ru: `Реши уравнение относительно $x$ (считай $x>${p}$): $\\log_{${b}}(x-${p}) + \\log_{${b}}(x+${p}) = ${c}$.`,
    },
    answer: { kind: 'number', value: String(x0) },
    solution: [
      { ru: 'Сумма логарифмов одного основания — это логарифм произведения:', tex: `\\log_{${b}}\\left((x-${p})(x+${p})\\right) = ${c}` },
      { ru: 'Переходим к показательной форме:', tex: `(x-${p})(x+${p}) = ${b}^{${c}} = ${bc}` },
      { ru: `Раскрываем разность квадратов и решаем (берём положительный корень, т.к. $x>${p}$):`, tex: `x^{2} - ${p * p} = ${bc} \\ \\Rightarrow\\ x^{2} = ${p * p + bc} \\ \\Rightarrow\\ x = ${x0}` },
    ],
    hints: [
      'Объедини сумму логарифмов в один: $\\log_b A+\\log_b B=\\log_b(AB)$.',
      'Перейди от логарифмического уравнения к показательному: $\\log_b N=c \\iff N=b^{c}$.',
      'Учти область допустимых значений: оба аргумента логарифма должны быть положительны.',
    ],
  }
}

export const template: SkillTemplate = {
  skillId: 'exp_log_eq',
  theory,
  expectedSeconds: { 1: 45, 2: 95, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
