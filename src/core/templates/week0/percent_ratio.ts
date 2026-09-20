import { mul, rat, ratToLatex, type Rational } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Процент (percent) — сотая доля числа: $p\\% = \\dfrac{p}{100}$.',
  '$p\\%$ от числа $N$ равно $\\dfrac{p}{100}\\cdot N$.',
  'Процентное изменение: $\\dfrac{\\text{новое}-\\text{старое}}{\\text{старое}}\\cdot100\\%$ (знак показывает рост или убыль).',
  'Пропорция $m:n$ делит величину на $\\dfrac{m}{m+n}$ и $\\dfrac{n}{m+n}$ от целого.',
  'Типичные ошибки: при изменении делить на новое значение вместо старого; при двух последовательных изменениях складывать проценты вместо перемножения множителей.',
].join('\n')

const HINTS_OF = ['Переведи проценты в дробь: $p\\%=\\frac{p}{100}$.', 'Умножь эту дробь на число.']
const HINTS_CHANGE = ['Найди разницу между новым и старым значением.', 'Раздели разницу на СТАРОЕ значение и умножь на 100%.']
const HINTS_CHAIN = ['Каждое изменение — это умножение на множитель $1+\\frac{c}{100}$.', 'Примени множители по очереди: сначала первое изменение, потом второе.']
const HINTS_RATIO = ['Сложи части отношения, чтобы найти, сколько частей всего.', 'Раздели общую величину на число частей — получишь величину одной части.']

function numProblem(statementEn: string, statementRu: string, value: Rational, solution: Problem['solution'], hints: readonly string[]): Problem {
  return {
    statement: { en: statementEn, ru: statementRu },
    answer: { kind: 'number', value: ratToLatex(value) },
    solution,
    hints,
    inputHint: 'Ответ — число (можно дробью или отрицательное)',
  }
}

function tier1(rng: Rng): Problem {
  const p = rng.pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90])
  const n = rng.int(20, 300)
  const value = rat(p * n, 100)
  const medical = rng.chance(0.5)
  const en = medical
    ? `A tablet contains $${n}$ mg of a substance; the active ingredient is $${p}\\%$ of the mass. Find the mass of the active ingredient, in mg.`
    : `Find $${p}\\%$ of $${n}$.`
  const ru = medical
    ? `Таблетка содержит $${n}$ мг вещества; активное вещество составляет $${p}\\%$ от массы. Найди массу активного вещества в мг.`
    : `Найди $${p}\\%$ от $${n}$.`
  return numProblem(en, ru, value, [
    { ru: 'Переведём проценты в дробь:', tex: `${p}\\% = \\frac{${p}}{100}` },
    { ru: 'Умножаем на число:', tex: `\\frac{${p}}{100} \\cdot ${n} = ${ratToLatex(value)}` },
  ], HINTS_OF)
}

function tier2(rng: Rng): Problem {
  const old = rng.pick([20, 40, 60, 80, 100, 120, 140, 160, 180, 200])
  const change = rng.pick([-50, -40, -25, -20, -10, -5, 5, 10, 15, 20, 25, 30, 40, 50])
  const updated = old + (old * change) / 100
  const en = `A quantity changes from $${old}$ to $${updated}$. Find the percent change (use a minus sign for a decrease).`
  const ru = `Величина изменилась с $${old}$ до $${updated}$. Найди процентное изменение (со знаком минус, если это убыль).`
  return numProblem(en, ru, rat(change), [
    { ru: 'Находим разницу между новым и старым значением:', tex: `${updated} - ${old} = ${updated - old}` },
    { ru: 'Делим на старое значение и переводим в проценты:', tex: `\\frac{${updated - old}}{${old}} \\cdot 100\\% = ${change}\\%` },
  ], HINTS_CHANGE)
}

function successiveChanges(rng: Rng): Problem {
  const n = rng.int(50, 400)
  const c1 = rng.pick([-30, -25, -20, -10, 10, 15, 20, 25, 30, 40])
  const c2 = rng.pick([-30, -25, -20, -10, 10, 15, 20, 25, 30, 40])
  const afterFirst = mul(rat(n), rat(100 + c1, 100))
  const value = mul(afterFirst, rat(100 + c2, 100))
  const describe = (c: number) => (c >= 0 ? `increases by ${c}%` : `decreases by ${-c}%`)
  const describeRu = (c: number) => (c >= 0 ? `увеличивается на ${c}%` : `уменьшается на ${-c}%`)
  const en = `A quantity of $${n}$ first ${describe(c1)}, then ${describe(c2)}. Find the final value.`
  const ru = `Величина $${n}$ сначала ${describeRu(c1)}, затем ${describeRu(c2)}. Найди итоговое значение.`
  return numProblem(en, ru, value, [
    { ru: 'После первого изменения:', tex: `${n} \\cdot \\frac{${100 + c1}}{100} = ${ratToLatex(afterFirst)}` },
    { ru: 'После второго изменения:', tex: `${ratToLatex(afterFirst)} \\cdot \\frac{${100 + c2}}{100} = ${ratToLatex(value)}` },
  ], HINTS_CHAIN)
}

const RATIO_PAIRS: readonly (readonly [number, number])[] = [
  [2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [3, 7], [2, 7], [5, 7], [4, 7], [5, 9], [2, 9], [4, 9], [7, 9],
]

function ratioSplit(rng: Rng): Problem {
  const [m0, n0] = rng.pick(RATIO_PAIRS)
  const [m, n] = rng.chance(0.5) ? [m0, n0] : [n0, m0]
  const k = rng.int(2, 9)
  const total = k * (m + n)
  const larger = k * Math.max(m, n)
  const en = `A total of $${total}$ is split in the ratio $${m}:${n}$. Find the larger share.`
  const ru = `Величину $${total}$ разделили в отношении $${m}:${n}$. Найди большую часть.`
  return numProblem(en, ru, rat(larger), [
    { ru: 'Всего частей отношения:', tex: `${m} + ${n} = ${m + n}` },
    { ru: 'Величина одной части:', tex: `\\frac{${total}}{${m + n}} = ${k}` },
    { ru: 'Большая часть:', tex: `${k} \\cdot ${Math.max(m, n)} = ${larger}` },
  ], HINTS_RATIO)
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? successiveChanges(rng) : ratioSplit(rng)
}

export const template: SkillTemplate = {
  skillId: 'percent_ratio',
  theory,
  expectedSeconds: { 1: 35, 2: 70, 3: 130 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
