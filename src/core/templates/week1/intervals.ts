import type { Rng } from '../../random/rng'
import type { IntervalPart, Problem, SkillTemplate } from '../types'

const theory = [
  'Интервал (interval) — кусок числовой прямой.',
  'Круглая скобка конец не включает: $(a, b) = \\{x \\in \\mathbb{R} : a < x < b\\}$.',
  'Квадратная включает: $[a, b] = \\{x : a \\le x \\le b\\}$; бывают и смешанные — $[a, b)$, $(a, b]$.',
  'У бесконечности скобка всегда круглая: $(-\\infty, 3]$, $(2, \\infty)$.',
  'Знак $\\cup$ (объединение) соединяет куски: «всё, кроме 2» на отрезке $[0,5]$ — это $[0,2) \\cup (2,5]$.',
  'Типичная ошибка — перепутать скобки: строгое неравенство $<$ даёт круглую, нестрогое $\\le$ — квадратную.',
].join('\n')

const HINTS = [
  'Строгий знак ($<$, $>$) — круглая скобка; нестрогий ($\\le$, $\\ge$) — квадратная.',
  'Рядом с $\\infty$ скобка всегда круглая.',
]
const INPUT_HINT = 'Собери ответ кнопками: скобка ( не включает конец, [ включает. Несколько кусков — кнопкой ∪'

const part = (lo: string | null, hi: string | null, loClosed: boolean, hiClosed: boolean): IntervalPart => ({ lo, hi, loClosed, hiClosed })

function tier1(rng: Rng): Problem {
  const a = rng.int(-8, 3)
  const b = rng.int(a + 2, a + 9)
  const loClosed = rng.chance(0.5)
  const hiClosed = rng.chance(0.5)
  const loSign = loClosed ? '\\le' : '<'
  const hiSign = hiClosed ? '\\le' : '<'
  const condition = `\\{x \\in \\mathbb{R} : ${a} ${loSign} x ${hiSign} ${b}\\}`
  return {
    statement: `Write $${condition}$ as an interval.`,
    answer: { kind: 'interval', parts: [part(String(a), String(b), loClosed, hiClosed)] },
    solution: [
      { text: `Левый конец $${a}$ ${loClosed ? 'включён' : 'не включён'}, правый $${b}$ ${hiClosed ? 'включён' : 'не включён'}.` },
      { text: 'Значит, ответ:', tex: `${loClosed ? '[' : '('}${a}, ${b}${hiClosed ? ']' : ')'}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const k = rng.int(2, 9)
  const strict = rng.chance(0.5)
  const less = rng.chance(0.5)
  const sign = less ? (strict ? '<' : '\\le') : strict ? '>' : '\\ge'
  const condition = `|x| ${sign} ${k}`
  const parts = less
    ? [part(String(-k), String(k), !strict, !strict)]
    : [part(null, String(-k), false, !strict), part(String(k), null, !strict, false)]
  return {
    statement: `Write the solution set of $${condition}$ as an interval.`,
    answer: { kind: 'interval', parts },
    solution: [
      {
        text: less
          ? `Модуль меньше ${k} — значит $x$ лежит между $-${k}$ и $${k}$.`
          : `Модуль больше ${k} — значит $x$ дальше ${k} от нуля в любую сторону, получаются два куска.`,
      },
      { text: 'Ответ:', tex: less ? `${strict ? '(' : '['}-${k}, ${k}${strict ? ')' : ']'}` : `(-\\infty, -${k}${strict ? ')' : ']'} \\cup ${strict ? '(' : '['}${k}, \\infty)` },
    ],
    hints: [`$|x| ${sign} ${k}$ — это расстояние от нуля до $x$.`, 'Для «больше» получаются два промежутка, соединённых знаком $\\cup$.'],
    inputHint: INPUT_HINT,
  }
}

function tier3(rng: Rng): Problem {
  const a = rng.int(-6, 2)
  const gap = rng.int(a + 1, a + 4)
  const b = rng.int(gap + 1, gap + 5)
  const condition = `\\{x \\in \\mathbb{R} : ${a} \\le x \\le ${b},\\ x \\ne ${gap}\\}`
  return {
    statement: `Write $${condition}$ as a union of intervals.`,
    answer: {
      kind: 'interval',
      parts: [part(String(a), String(gap), true, false), part(String(gap), String(b), false, true)],
    },
    solution: [
      { text: `Берём отрезок $[${a}, ${b}]$ и выкалываем точку $${gap}$.` },
      { text: 'Получаются два куска — рядом с выколотой точкой скобки круглые:', tex: `[${a}, ${gap}) \\cup (${gap}, ${b}]` },
    ],
    hints: ['Выколотая точка разрезает отрезок на два куска.', 'Возле выколотой точки скобки круглые, а внешние концы остаются включёнными.'],
    inputHint: INPUT_HINT,
  }
}

export const template: SkillTemplate = {
  skillId: 'intervals',
  theory,
  expectedSeconds: { 1: 40, 2: 70, 3: 95 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
