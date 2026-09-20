import { joinTerms, linear } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'Вершинная форма параболы (vertex form): $y=(x-h)^2+k$ — вершина в точке $(h,k)$.',
  'Разложенная форма (factored form): $y=a(x-r_1)(x-r_2)$ — нули функции (x-intercepts) в точках $x=r_1$ и $x=r_2$.',
  'Знак коэффициента $a$ определяет направление ветвей: $a>0$ — вверх, $a<0$ — вниз.',
  'Чтобы найти нули, реши $y=0$: произведение равно нулю, если один из множителей равен нулю.',
  'Типичная ошибка: перепутать знак $h$ внутри скобки $(x-h)$ — вершина смещена в сторону, противоположную знаку внутри скобки.',
].join('\n')

function factorBracket(r: number): string {
  return `\\left(${linear(1, -r)}\\right)`
}

function coefPrefixOf(a: number): string {
  return a === 1 ? '' : a === -1 ? '-' : String(a)
}

function tier1(rng: Rng): Problem {
  const h = rng.int(-6, 6)
  const k = rng.int(-8, 8)
  const eq = joinTerms([`\\left(${linear(1, -h)}\\right)^2`, String(k)])
  return {
    statement: {
      en: `Find the vertex of the parabola $y = ${eq}$.`,
      ru: `Найди вершину параболы $y = ${eq}$.`,
    },
    answer: { kind: 'finiteSet', elements: [`(${h},${k})`] },
    solution: [
      { ru: 'Парабола в вершинной форме $y=(x-h)^2+k$ имеет вершину $(h,k)$:', tex: `h=${h}, \\quad k=${k}` },
      { ru: 'Вершина:', tex: `(${h}, ${k})` },
    ],
    hints: ['Сравни уравнение с вершинной формой $y=(x-h)^2+k$.', 'Вершина параболы — это точка $(h, k)$.'],
    inputHint: 'Ответ — пара (x, y), например (2,-3)',
  }
}

function tier2(rng: Rng): Problem {
  const a = rng.pick([1, 1, 1, 2, -1, 3])
  const aPrefix = coefPrefixOf(a)
  if (rng.chance(0.75)) {
    const r1 = rng.int(-7, 7)
    const r2 = rng.intExcept(-7, 7, [r1])
    const [lo, hi] = r1 < r2 ? [r1, r2] : [r2, r1]
    const eq = `${aPrefix}${factorBracket(r1)}${factorBracket(r2)}`
    return {
      statement: {
        en: `Find the x-intercepts of the parabola $y = ${eq}$.`,
        ru: `Найди точки пересечения параболы $y = ${eq}$ с осью $x$.`,
      },
      answer: { kind: 'numberSet', values: [String(lo), String(hi)] },
      solution: [
        { ru: 'На оси $x$ значение $y=0$:', tex: `${eq} = 0` },
        { ru: 'Произведение равно нулю, если один из множителей равен нулю:', tex: `x = ${r1}, \\quad x = ${r2}` },
      ],
      hints: ['Пересечение с осью $x$ — это точки, где $y=0$.', 'Произведение равно нулю, если хотя бы один множитель равен нулю.'],
      inputHint: 'Перечисли корни через запятую, например -2, 3',
    }
  }
  const r = rng.intExcept(-7, 7, [0])
  const eq = `${aPrefix}${factorBracket(r)}^2`
  return {
    statement: {
      en: `Find the x-intercepts of the parabola $y = ${eq}$.`,
      ru: `Найди точки пересечения параболы $y = ${eq}$ с осью $x$.`,
    },
    answer: { kind: 'numberSet', values: [String(r)] },
    solution: [
      { ru: 'На оси $x$ значение $y=0$:', tex: `${eq} = 0` },
      { ru: 'Множитель повторяется дважды — корень один (двойной):', tex: `x = ${r}` },
    ],
    hints: ['Пересечение с осью $x$ — это точки, где $y=0$.', 'Здесь множитель повторяется дважды — корень только один.'],
    inputHint: 'Если корень один, укажи только его: например 3',
  }
}

function describeParabola(a: number, h: number, k: number): string {
  const dir = a > 0 ? 'upward' : 'downward'
  return `Opens ${dir}; vertex $(${h}, ${k})$`
}

function tier3(rng: Rng): Problem {
  const a = rng.pick([1, 2, -1, -2])
  const h = rng.int(-5, 5)
  const k = rng.int(-6, 6)
  const bracket = `\\left(${linear(1, -h)}\\right)^2`
  const aTerm = a === 1 ? bracket : a === -1 ? `-${bracket}` : `${a}${bracket}`
  const eq = joinTerms([aTerm, String(k)])
  const flip = (n: number): number => (n === 0 ? n + 1 : -n)
  const options: ChoiceOption[] = rng.shuffle([
    { id: 'correct', label: describeParabola(a, h, k) },
    { id: 'flip-dir', label: describeParabola(flip(a), h, k) },
    { id: 'flip-h', label: describeParabola(a, flip(h), k) },
    { id: 'flip-k', label: describeParabola(a, h, flip(k)) },
  ])
  return {
    statement: {
      en: `Which statement correctly describes the graph of $y = ${eq}$?`,
      ru: `Какое утверждение верно описывает график $y = ${eq}$?`,
    },
    answer: { kind: 'choice', options, correctId: 'correct' },
    solution: [
      { ru: `Знак коэффициента при скобке определяет направление ветвей: ${a > 0 ? 'вверх' : 'вниз'}.` },
      { ru: 'Вершина параболы $y=a(x-h)^2+k$ — точка $(h,k)$:', tex: `(${h}, ${k})` },
    ],
    hints: [
      'Знак $a$ перед скобкой определяет, куда направлены ветви параболы.',
      'В форме $y=a(x-h)^2+k$ вершина — точка $(h,k)$: обрати внимание на знаки внутри скобки.',
    ],
  }
}

export const template: SkillTemplate = {
  skillId: 'graphs_basic',
  theory,
  expectedSeconds: { 1: 40, 2: 80, 3: 130 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
