import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Выразить переменную (rearranging a formula) — оставить нужную букву одну в одной части равенства.',
  'Действия те же, что и в уравнении: перенос слагаемых со сменой знака, умножение/деление обеих частей.',
  'Если переменная в знаменателе — сначала умножь обе части на этот знаменатель.',
  'Типичная ошибка: умножить/разделить только часть выражения, а не обе части целиком.',
].join('\n')

const HINTS = [
  'Определи, какое действие "мешает" нужной переменной, и выполни обратное действие над обеими частями.',
  'Если переменная в знаменателе — сначала умножь обе части на знаменатель, чтобы её оттуда убрать.',
]
const INPUT_HINT = 'Введи выражение через известные буквы'

const VARIANTS1: readonly (readonly [string, string, string])[] = [
  ['v', 's', 't'],
  ['p', 'F', 'A'],
  ['d', 'm', 'V'],
]

function tier1(rng: Rng): Problem {
  const [lhs, num, den] = rng.pick(VARIANTS1)
  return {
    statement: {
      en: `Given $${lhs} = \\dfrac{${num}}{${den}}$, solve for $${den}$.`,
      ru: `Дано $${lhs} = \\dfrac{${num}}{${den}}$. Вырази $${den}$.`,
    },
    answer: { kind: 'expression', value: `\\frac{${num}}{${lhs}}`, variables: [num, lhs] },
    solution: [
      { ru: `Умножим обе части на $${den}$:`, tex: `${lhs}${den} = ${num}` },
      { ru: `Разделим обе части на $${lhs}$:`, tex: `${den} = \\frac{${num}}{${lhs}}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const solveForB = rng.chance(0.5)
  const known = solveForB ? 'a' : 'b'
  const target = solveForB ? 'b' : 'a'
  const value = `\\frac{${known}f}{${known}-f}`
  return {
    statement: {
      en: `The thin-lens equation is $\\dfrac{1}{f} = \\dfrac{1}{a} + \\dfrac{1}{b}$. Solve for $${target}$ in terms of $${known}$ and $f$.`,
      ru: `Формула тонкой линзы: $\\dfrac{1}{f} = \\dfrac{1}{a} + \\dfrac{1}{b}$. Вырази $${target}$ через $${known}$ и $f$.`,
    },
    answer: { kind: 'expression', value, variables: [known, 'f'], domain: { [known]: [2, 4], f: [0.3, 0.8] } },
    solution: [
      { ru: `Перенесём $\\frac{1}{${known}}$ в другую часть:`, tex: `\\frac{1}{${target}} = \\frac{1}{f} - \\frac{1}{${known}}` },
      { ru: 'Приведём к общему знаменателю:', tex: `\\frac{1}{${target}} = \\frac{${known}-f}{f\\cdot ${known}}` },
      { ru: 'Перевернём обе части (обратные величины):', tex: `${target} = \\frac{f\\cdot ${known}}{${known}-f} = \\frac{${known}f}{${known}-f}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function celsiusBranch(): Problem {
  return {
    statement: {
      en: 'The formula $C = \\dfrac{5(F-32)}{9}$ converts Fahrenheit to Celsius. Solve for $F$.',
      ru: 'Формула $C = \\dfrac{5(F-32)}{9}$ переводит градусы Фаренгейта в Цельсия. Вырази $F$.',
    },
    answer: { kind: 'expression', value: '\\frac{9C}{5}+32', variables: ['C'] },
    solution: [
      { ru: 'Умножим обе части на $9$:', tex: '9C = 5(F-32)' },
      { ru: 'Разделим обе части на $5$:', tex: '\\frac{9C}{5} = F-32' },
      { ru: 'Прибавим $32$ к обеим частям:', tex: 'F = \\frac{9C}{5}+32' },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function interestBranch(): Problem {
  return {
    statement: {
      en: 'Simple interest is $A = P(1+rt)$. Solve for $r$.',
      ru: 'Формула простых процентов: $A = P(1+rt)$. Вырази $r$.',
    },
    answer: { kind: 'expression', value: '\\frac{A-P}{Pt}', variables: ['A', 'P', 't'], domain: { A: [3, 6], P: [1.5, 2.5], t: [0.5, 2.5] } },
    solution: [
      { ru: 'Раскроем скобки:', tex: 'A = P + Prt' },
      { ru: 'Перенесём $P$ в другую часть:', tex: 'A - P = Prt' },
      { ru: 'Разделим обе части на $Pt$:', tex: 'r = \\frac{A-P}{Pt}' },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? celsiusBranch() : interestBranch()
}

export const template: SkillTemplate = {
  skillId: 'rearrange',
  theory,
  expectedSeconds: { 1: 45, 2: 100, 3: 130 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
