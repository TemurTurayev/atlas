import { linear } from '../../math/latex'
import { polyToLatex, type Poly } from '../../math/poly'
import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Предел (limit) функции при $x\\to a$ — значение, к которому приближается $f(x)$, когда $x$ приближается к $a$, необязательно его достигая.',
  'Неопределённость $\\frac{0}{0}$: разложи числитель и знаменатель на множители и сократи общий множитель, только потом подставляй точку.',
  'Предел рациональной функции при $x\\to\\infty$, если степени числителя и знаменателя равны, — это отношение старших коэффициентов.',
  'Если в числителе или знаменателе корень, домножь дробь на сопряжённое выражение (conjugate), чтобы избавиться от неопределённости $\\frac00$.',
  'Типичная ошибка: подставлять точку сразу, не заметив неопределённость $\\frac00$, и делать вывод, что предела не существует.',
].join('\n')

function tier1(rng: Rng): Problem {
  const c = rng.intExcept(-8, 8, [0])
  const c2 = c * c
  const value = 2 * c
  const factorMinus = linear(1, -c)
  const factorPlus = linear(1, c)
  return {
    statement: {
      en: `Find $\\displaystyle\\lim_{x\\to ${c}}\\frac{x^{2}-${c2}}{${factorMinus}}$.`,
      ru: `Найди $\\displaystyle\\lim_{x\\to ${c}}\\frac{x^{2}-${c2}}{${factorMinus}}$.`,
    },
    answer: { kind: 'number', value: String(value) },
    solution: [
      { ru: 'Числитель — разность квадратов, раскладываем на множители:', tex: `x^{2}-${c2} = \\left(${factorMinus}\\right)\\left(${factorPlus}\\right)` },
      { ru: `Сокращаем общий множитель $${factorMinus}$ со знаменателем и подставляем $x=${c}$:`, tex: `\\lim_{x\\to ${c}} \\left(${factorPlus}\\right) = ${value}` },
    ],
    hints: [
      'Числитель — разность квадратов; разложи его на два множителя.',
      'Один из множителей сократится со знаменателем; после сокращения подставь предельную точку.',
    ],
  }
}

function tier2(rng: Rng): Problem {
  const a = rng.intExcept(-6, 6, [0])
  const f = rng.intExcept(-6, 6, [0])
  const b = rng.int(-6, 6)
  const e = rng.int(-9, 9)
  const g = rng.int(-6, 6)
  const h = rng.int(-9, 9)
  const numerator: Poly = [e, b, a]
  const denominator: Poly = [h, g, f]
  const numLatex = polyToLatex(numerator)
  const denLatex = polyToLatex(denominator)
  const value = ratToLatex(rat(a, f))
  return {
    statement: {
      en: `Find $\\displaystyle\\lim_{x\\to\\infty}\\frac{${numLatex}}{${denLatex}}$.`,
      ru: `Найди $\\displaystyle\\lim_{x\\to\\infty}\\frac{${numLatex}}{${denLatex}}$.`,
    },
    answer: { kind: 'number', value },
    solution: [
      {
        ru: 'Степени числителя и знаменателя равны — при $x\\to\\infty$ предел определяют только старшие коэффициенты:',
        tex: `\\lim_{x\\to\\infty}\\frac{${numLatex}}{${denLatex}} = \\frac{${a}}{${f}}`,
      },
      { ru: 'Вычисляем отношение старших коэффициентов:', tex: `\\frac{${a}}{${f}} = ${value}` },
    ],
    hints: [
      'Раздели числитель и знаменатель на $x$ в наибольшей встречающейся степени.',
      'Все слагаемые вида $\\frac{k}{x^{n}}$ стремятся к нулю; останутся только старшие коэффициенты.',
    ],
  }
}

function tier3(rng: Rng): Problem {
  const c = rng.int(2, 9)
  const c2 = c * c
  const value = ratToLatex(rat(1, 2 * c))
  return {
    statement: {
      en: `Find $\\displaystyle\\lim_{x\\to ${c2}}\\frac{\\sqrt{x}-${c}}{x-${c2}}$.`,
      ru: `Найди $\\displaystyle\\lim_{x\\to ${c2}}\\frac{\\sqrt{x}-${c}}{x-${c2}}$.`,
    },
    answer: { kind: 'number', value },
    solution: [
      {
        ru: `Домножаем числитель и знаменатель на сопряжённое выражение $\\sqrt{x}+${c}$:`,
        tex: `\\frac{\\sqrt{x}-${c}}{x-${c2}}\\cdot\\frac{\\sqrt{x}+${c}}{\\sqrt{x}+${c}} = \\frac{x-${c2}}{\\left(x-${c2}\\right)\\left(\\sqrt{x}+${c}\\right)}`,
      },
      { ru: `Сокращаем общий множитель $x-${c2}$:`, tex: `= \\frac{1}{\\sqrt{x}+${c}}` },
      { ru: `Подставляем $x=${c2}$:`, tex: `\\frac{1}{\\sqrt{${c2}}+${c}} = \\frac{1}{${2 * c}} = ${value}` },
    ],
    hints: [
      'Домножь числитель и знаменатель на сопряжённое выражение, чтобы убрать корень.',
      'После сокращения общего множителя подставь предельную точку напрямую.',
    ],
  }
}

export const template: SkillTemplate = {
  skillId: 'limits',
  theory,
  expectedSeconds: { 1: 60, 2: 90, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
