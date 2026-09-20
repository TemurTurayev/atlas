import { linear } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { IntervalPart, Problem, SkillTemplate } from '../types'

const theory = [
  'Неравенство (inequality) — сравнение выражений: $<, >, \\le, \\ge$.',
  'Линейное неравенство решается как уравнение, но при умножении/делении обеих частей на отрицательное число знак меняется на противоположный.',
  'Квадратное $x^2-k^2<0$ верно между корнями: $-k<x<k$; $x^2-k^2>0$ — вне корней: $x<-k$ или $x>k$.',
  'Неравенство с модулем: $|x-p|\\le k \\Leftrightarrow -k\\le x-p\\le k$.',
  'Типичная ошибка — забыть развернуть знак неравенства при умножении/делении на отрицательное число.',
].join('\n')

const HINTS = [
  'Реши как уравнение, чтобы найти границу(ы) промежутка.',
  'При умножении/делении обеих частей на отрицательное число знак неравенства меняется на противоположный.',
]
const INPUT_HINT = 'Открытая скобка ( или ) не включает конец; закрытая [ или ] включает. Два промежутка соедини знаком ∪'

type Dir = '<' | '>' | '\\le' | '\\ge'

function boundaryPart(dir: Dir, x0: number): IntervalPart {
  const b = String(x0)
  switch (dir) {
    case '<':
      return { lo: null, hi: b, loClosed: false, hiClosed: false }
    case '\\le':
      return { lo: null, hi: b, loClosed: false, hiClosed: true }
    case '>':
      return { lo: b, hi: null, loClosed: false, hiClosed: false }
    case '\\ge':
      return { lo: b, hi: null, loClosed: true, hiClosed: false }
  }
}

function tier1(rng: Rng): Problem {
  const a = rng.int(2, 6)
  const x0 = rng.int(-8, 8)
  const b = rng.intExcept(-12, 12, [0])
  const rhs = a * x0 + b
  const dir = rng.pick<Dir>(['<', '>', '\\le', '\\ge'])
  const statement = `${linear(a, b)} ${dir} ${rhs}`
  return {
    statement: { en: `Solve the inequality: $${statement}$`, ru: `Реши неравенство: $${statement}$` },
    answer: { kind: 'interval', parts: [boundaryPart(dir, x0)] },
    solution: [
      { ru: `Перенесём число $${b}$ вправо:`, tex: `${linear(a, 0)} ${dir} ${rhs - b}` },
      { ru: `Разделим обе части на $${a}$ (коэффициент положительный, знак не меняется):`, tex: `x ${dir} ${x0}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const k = rng.int(2, 8)
  const statement = `x^{2} - ${k * k} < 0`
  return {
    statement: { en: `Solve the inequality: $${statement}$`, ru: `Реши неравенство: $${statement}$` },
    answer: { kind: 'interval', parts: [{ lo: String(-k), hi: String(k), loClosed: false, hiClosed: false }] },
    solution: [
      { ru: 'Разложим левую часть на множители (разность квадратов):', tex: `x^{2}-${k * k} = \\left(x-${k}\\right)\\left(x+${k}\\right)` },
      { ru: 'Произведение отрицательно строго между корнями:', tex: `-${k} < x < ${k}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function absValueBranch(rng: Rng): Problem {
  const p = rng.int(-6, 6)
  const k = rng.int(2, 9)
  const closed = rng.chance(0.7)
  const dir: '\\le' | '<' = closed ? '\\le' : '<'
  const inner = linear(1, -p)
  const statement = `\\left|${inner}\\right| ${dir} ${k}`
  return {
    statement: { en: `Solve the inequality: $${statement}$`, ru: `Реши неравенство: $${statement}$` },
    answer: { kind: 'interval', parts: [{ lo: String(p - k), hi: String(p + k), loClosed: closed, hiClosed: closed }] },
    solution: [
      { ru: `Модульное неравенство $|A| ${dir} ${k}$ равносильно двойному неравенству:`, tex: `-${k} ${dir} ${inner} ${dir} ${k}` },
      { ru: `Прибавим $${p}$ к каждой части:`, tex: `${p - k} ${dir} x ${dir} ${p + k}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function quadraticParamBranch(rng: Rng): Problem {
  const c = rng.pick([1, 4, 9, 16, 25])
  const boundary = 2 * Math.sqrt(c)
  const statement = `x^{2}+bx+${c}=0`
  return {
    statement: {
      en: `For which values of $b$ does $${statement}$ have two distinct real roots?`,
      ru: `При каких значениях $b$ уравнение $${statement}$ имеет два различных действительных корня?`,
    },
    answer: {
      kind: 'interval',
      parts: [
        { lo: null, hi: String(-boundary), loClosed: false, hiClosed: false },
        { lo: String(boundary), hi: null, loClosed: false, hiClosed: false },
      ],
    },
    solution: [
      { ru: 'Два различных корня — когда дискриминант положителен:', tex: `D = b^{2}-4\\cdot ${c} > 0` },
      { ru: 'Решаем неравенство относительно $b$:', tex: `b^{2} > ${4 * c} \\;\\Rightarrow\\; |b| > ${boundary}` },
      { ru: 'Итог — объединение двух лучей:', tex: `b < ${-boundary} \\ \\text{или} \\ b > ${boundary}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? absValueBranch(rng) : quadraticParamBranch(rng)
}

export const template: SkillTemplate = {
  skillId: 'inequalities',
  theory,
  expectedSeconds: { 1: 45, 2: 90, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
