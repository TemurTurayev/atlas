import { linear } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { IntervalPart, Problem, SkillTemplate } from '../types'

const theory = [
  'Область определения (domain) функции — все $x$, для которых формула имеет смысл.',
  'Под квадратным корнем подкоренное выражение должно быть $\\ge 0$: $\\sqrt{x-a}$ требует $x \\ge a$.',
  'Знаменатель дроби не может быть равен нулю — такие точки выкалываются из области.',
  'Под логарифмом аргумент должен быть строго больше нуля: $\\ln(x-a)$ требует $x > a$.',
  'Область значений (range) — все $y$, которые функция реально принимает.',
  'Типичная ошибка: забыть выколоть точку, где знаменатель равен нулю, или спутать $\\ge$ со строгим $>$.',
].join('\n')

const HINTS = ['Найди отдельно каждое ограничение (корень, знаменатель, логарифм).', 'Объедини условия: возьми пересечение, а точки со знаменателем нулём — выколи.']
const INPUT_HINT = 'Собери ответ кнопками: скобка ( не включает конец, [ включает'

const part = (lo: string | null, hi: string | null, loClosed: boolean, hiClosed: boolean): IntervalPart => ({ lo, hi, loClosed, hiClosed })

function tier1(rng: Rng): Problem {
  const a = rng.int(-6, 6)
  const f = `\\sqrt{${linear(1, -a)}}`
  return {
    statement: `Find the domain of $f(x) = ${f}$.`,
    answer: { kind: 'interval', parts: [part(String(a), null, true, false)] },
    solution: [
      { text: `Подкоренное выражение не может быть отрицательным:`, tex: `${linear(1, -a)} \\ge 0` },
      { text: 'Решаем неравенство:', tex: `x \\ge ${a}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const a = rng.int(-5, 4)
  const b = rng.int(a + 1, a + 7)
  const f = `\\dfrac{\\sqrt{${linear(1, -a)}}}{${linear(1, -b)}}`
  return {
    statement: `Find the domain of $f(x) = ${f}$.`,
    answer: {
      kind: 'interval',
      parts: [part(String(a), String(b), true, false), part(String(b), null, false, false)],
    },
    solution: [
      { text: 'Подкоренное выражение неотрицательно:', tex: `x \\ge ${a}` },
      { text: 'Знаменатель не равен нулю:', tex: `x \\ne ${b}` },
      { text: 'Объединяем оба условия (точка $b$ выколота):', tex: `[${a}, ${b}) \\cup (${b}, \\infty)` },
    ],
    hints: [...HINTS, `Не забудь, что $x = ${b}$ обнуляет знаменатель, даже если корень там определён.`],
    inputHint: INPUT_HINT,
  }
}

function logDomain(rng: Rng): Problem {
  const a = rng.int(-6, 6)
  const f = `\\ln\\left(${linear(1, -a)}\\right)`
  return {
    statement: `Find the domain of $f(x) = ${f}$.`,
    answer: { kind: 'interval', parts: [part(String(a), null, false, false)] },
    solution: [
      { text: 'Аргумент логарифма должен быть строго положительным:', tex: `${linear(1, -a)} > 0` },
      { text: 'Решаем неравенство:', tex: `x > ${a}` },
    ],
    hints: ['Логарифм определён только для положительного аргумента.', `Реши строгое неравенство $${linear(1, -a)} > 0$.`],
    inputHint: INPUT_HINT,
  }
}

function quadraticRange(rng: Rng): Problem {
  const h = rng.int(-5, 5)
  const k = rng.int(-6, 6)
  const opensUp = rng.chance(0.5)
  const sign = opensUp ? '' : '-'
  const f = `${sign}\\left(${linear(1, -h)}\\right)^{2}${k === 0 ? '' : k > 0 ? `+${k}` : k}`
  return {
    statement: `Find the range of $f(x) = ${f}$.`,
    answer: {
      kind: 'interval',
      parts: opensUp ? [part(String(k), null, true, false)] : [part(null, String(k), false, true)],
    },
    solution: [
      { text: `Вершина параболы в точке $x = ${h}$, значение в вершине $y = ${k}$.` },
      {
        text: opensUp ? 'Ветви направлены вверх — минимум в вершине, дальше $y$ растёт без ограничений:' : 'Ветви направлены вниз — максимум в вершине, дальше $y$ убывает без ограничений:',
        tex: opensUp ? `y \\ge ${k}` : `y \\le ${k}`,
      },
    ],
    hints: ['Найди координату $y$ вершины параболы.', opensUp ? 'Ветви вверх — область значений начинается от вершины и идёт до $+\\infty$.' : 'Ветви вниз — область значений идёт от $-\\infty$ до вершины.'],
    inputHint: INPUT_HINT,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? logDomain(rng) : quadraticRange(rng)
}

export const template: SkillTemplate = {
  skillId: 'functions',
  theory,
  expectedSeconds: { 1: 40, 2: 75, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
