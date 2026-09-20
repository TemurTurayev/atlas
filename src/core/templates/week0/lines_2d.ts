import { joinTerms, linear, paren } from '../../math/latex'
import { rat, ratToLatex, sub, mul } from '../../math/rational'
import type { Rational } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Наклон прямой (slope) через две точки: $k=\\frac{y_2-y_1}{x_2-x_1}$.',
  'Уравнение прямой (line equation) вида $y=kx+b$ — подставь одну из точек, чтобы найти $b$.',
  'Параллельные прямые (parallel lines) имеют одинаковый наклон: $k_1=k_2$.',
  'Перпендикулярные прямые (perpendicular lines): $k_1\\cdot k_2=-1$, то есть $k_2=-\\frac{1}{k_1}$.',
  'Типичные ошибки: перепутать порядок вычитания в числителе и знаменателе; забыть сменить знак у перпендикулярного наклона.',
].join('\n')

const TIER1_HINTS = [
  'Наклон — это отношение изменения $y$ к изменению $x$.',
  'Формула: $k=\\frac{y_2-y_1}{x_2-x_1}$. Подставь координаты точек.',
]
const TIER2_HINTS = [
  'Сначала найди наклон по двум точкам.',
  'Подставь одну из точек в $y=kx+b$ и найди $b$.',
  'Запиши итоговое уравнение в виде $y=kx+b$.',
]
const TIER3_HINTS = [
  'У параллельных прямых наклон совпадает; у перпендикулярных — произведение наклонов равно $-1$.',
  'Найди новый наклон, затем подставь данную точку, чтобы найти $b$.',
]

function ratLinearLatex(m: Rational, b: Rational): string {
  const sign = m.n < 0 ? '-' : ''
  const absN = Math.abs(m.n)
  const coef = m.d === 1 ? (absN === 1 ? '' : String(absN)) : `\\frac{${absN}}{${m.d}}`
  const xTerm = `${sign}${coef}x`
  const constTerm = b.n === 0 ? '' : ratToLatex(b)
  return joinTerms([xTerm, constTerm])
}

function tier1(rng: Rng): Problem {
  const p = rng.intExcept(-6, 6, [0])
  const q = rng.intExcept(-6, 6, [0])
  const slope = rat(p, q)
  const x1 = rng.int(-6, 6)
  const y1 = rng.int(-8, 8)
  const x2 = x1 + q
  const y2 = y1 + p
  return {
    statement: {
      en: `Find the slope of the line through $(${x1}, ${y1})$ and $(${x2}, ${y2})$.`,
      ru: `Найди наклон прямой, проходящей через точки $(${x1}, ${y1})$ и $(${x2}, ${y2})$.`,
    },
    answer: { kind: 'number', value: ratToLatex(slope) },
    solution: [
      { ru: 'Наклон через две точки:', tex: `k = \\frac{y_2-y_1}{x_2-x_1} = \\frac{${y2}-${paren(y1)}}{${x2}-${paren(x1)}}` },
      { ru: 'Вычисляем:', tex: `k = \\frac{${y2 - y1}}{${x2 - x1}} = ${ratToLatex(slope)}` },
    ],
    hints: TIER1_HINTS,
    inputHint: 'Дробь пиши через /, например 3/4 или -2/5',
  }
}

function tier2(rng: Rng): Problem {
  const m = rng.intExcept(-5, 5, [0])
  const b = rng.int(-6, 6)
  const x1 = rng.int(-4, 4)
  const dx = rng.intExcept(-4, 4, [0])
  const x2 = x1 + dx
  const y1 = m * x1 + b
  const y2 = m * x2 + b
  return {
    statement: {
      en: `Find the equation, in the form $y = mx + b$, of the line through $(${x1}, ${y1})$ and $(${x2}, ${y2})$.`,
      ru: `Найди уравнение прямой вида $y = mx + b$, проходящей через точки $(${x1}, ${y1})$ и $(${x2}, ${y2})$.`,
    },
    answer: { kind: 'expression', value: linear(m, b), variables: ['x'] },
    solution: [
      { ru: 'Наклон по двум точкам:', tex: `k = \\frac{${y2}-${paren(y1)}}{${x2}-${paren(x1)}} = ${m}` },
      { ru: 'Подставим точку в $y=kx+b$, чтобы найти $b$:', tex: `${y1} = ${m}\\cdot${paren(x1)} + b \\Rightarrow b = ${b}` },
      { ru: 'Уравнение прямой:', tex: `y = ${linear(m, b)}` },
    ],
    hints: TIER2_HINTS,
    inputHint: 'Введи уравнение как y=..., например y=2x-3',
  }
}

function tier3(rng: Rng): Problem {
  const m = rng.intExcept(-4, 4, [0])
  const c = rng.int(-6, 6)
  const x0 = rng.intExcept(-6, 6, [0])
  const y0 = rng.int(-8, 8)
  const perpendicular = rng.chance(0.5)
  const slope = perpendicular ? rat(-1, m) : rat(m, 1)
  const intercept = sub(rat(y0), mul(slope, rat(x0)))
  const value = ratLinearLatex(slope, intercept)
  const relation = perpendicular ? 'perpendicular to' : 'parallel to'
  const relationRu = perpendicular ? 'перпендикулярна' : 'параллельна'
  const solution: Problem['solution'] = perpendicular
    ? [
        { ru: `Наклон данной прямой $k=${m}$. Для перпендикулярной прямой наклон:`, tex: `k' = -\\frac{1}{k} = ${ratToLatex(slope)}` },
        { ru: 'Подставим точку, чтобы найти $b$:', tex: `${y0} = ${ratToLatex(slope)}\\cdot${paren(x0)} + b \\Rightarrow b = ${ratToLatex(intercept)}` },
        { ru: 'Уравнение прямой:', tex: `y = ${value}` },
      ]
    : [
        { ru: 'Параллельные прямые имеют одинаковый наклон:', tex: `k' = k = ${m}` },
        { ru: 'Подставим точку, чтобы найти $b$:', tex: `${y0} = ${m}\\cdot${paren(x0)} + b \\Rightarrow b = ${ratToLatex(intercept)}` },
        { ru: 'Уравнение прямой:', tex: `y = ${value}` },
      ]
  return {
    statement: {
      en: `The line $y = ${linear(m, c)}$ is given. Find the equation, in the form $y = mx + b$, of the line through $(${x0}, ${y0})$ that is ${relation} it.`,
      ru: `Дана прямая $y = ${linear(m, c)}$. Найди уравнение прямой вида $y=mx+b$, которая проходит через точку $(${x0}, ${y0})$ и ${relationRu} данной.`,
    },
    answer: { kind: 'expression', value, variables: ['x'] },
    solution,
    hints: TIER3_HINTS,
    inputHint: 'Введи уравнение как y=... Наклон перпендикулярной прямой — обратное число с минусом',
  }
}

export const template: SkillTemplate = {
  skillId: 'lines_2d',
  theory,
  expectedSeconds: { 1: 45, 2: 90, 3: 170 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
