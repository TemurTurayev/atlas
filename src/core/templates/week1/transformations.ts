import { linear } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'Сдвиг (shift) $f(x-h)+k$: график $f$ сдвигается на $h$ вправо и на $k$ вверх (при отрицательных — влево/вниз).',
  'Растяжение по вертикали и отражение (vertical stretch/reflection): $a \\cdot f(x)$ растягивает график в $|a|$ раз; при $a<0$ ещё и отражает от оси $x$.',
  'Растяжение по горизонтали (horizontal stretch): $f(bx)$ сжимает график в $|b|$ раз при $|b|>1$ и растягивает при $|b|<1$ — эффект обратный интуиции.',
  'Типичная ошибка: $f(x-2)$ путают со сдвигом влево — на самом деле это сдвиг ВПРАВО на 2.',
  'Другая ошибка: считать, что $f(2x)$ растягивает график — на самом деле умножение $x$ на число больше 1 сжимает график к оси $y$.',
].join('\n')

const HINTS = ['Сначала определи, что меняется — вход ($x$) или выход ($f(x)$) функции.', 'Изменения внутри скобок $f(\\ldots)$ действуют на график «наоборот» интуиции по горизонтали.']

type BaseFn = 'sq' | 'abs' | 'cube'

const baseLabel = (kind: BaseFn): string => (kind === 'sq' ? 'x^2' : kind === 'abs' ? '|x|' : 'x^3')
const applyBase = (kind: BaseFn, e: string): string => {
  if (e === 'x') return kind === 'sq' ? 'x^{2}' : kind === 'abs' ? '|x|' : 'x^{3}'
  if (kind === 'sq') return `\\left(${e}\\right)^{2}`
  if (kind === 'abs') return `\\left|${e}\\right|`
  return `\\left(${e}\\right)^{3}`
}
const addConst = (e: string, c: number): string => (c === 0 ? e : `${e}${c > 0 ? '+' : ''}${c}`)
const mulConst = (e: string, s: number): string => (s === 1 ? e : s === -1 ? `-${e}` : `${s}${e}`)

function tier1(rng: Rng): Problem {
  const kind = rng.pick<BaseFn>(['sq', 'abs', 'cube'])
  const h = rng.intExcept(-6, 6, [0])
  const k = rng.intExcept(-6, 6, [0])
  const shifted = applyBase(kind, linear(1, -h))
  const value = addConst(shifted, k)
  const target = `f(${linear(1, -h)})${k > 0 ? `+${k}` : k}`
  return {
    statement: {
      en: `Given $f(x) = ${baseLabel(kind)}$, write the formula for $${target}$.`,
      ru: `Дана $f(x) = ${baseLabel(kind)}$. Запиши формулу для $${target}$.`,
    },
    answer: { kind: 'expression', value, variables: ['x'] },
    solution: [
      { ru: `Сдвиг на $${h}$ вправо: заменяем $x$ на $${linear(1, -h)}$ внутри $f$.`, tex: `f(${linear(1, -h)}) = ${shifted}` },
      { ru: `Сдвиг на $${k}$ вверх: прибавляем $${k}$ к результату.`, tex: value },
    ],
    hints: HINTS,
    inputHint: 'Введи выражение через x',
  }
}

function tier2(rng: Rng): Problem {
  const kind = rng.pick<BaseFn>(['sq', 'abs', 'cube'])
  const s = rng.pick([-2, -3, -4])
  const value = mulConst(baseLabel(kind), s)
  return {
    statement: {
      en: `Given $f(x) = ${baseLabel(kind)}$, write the formula for $y = ${s}f(x)$.`,
      ru: `Дана $f(x) = ${baseLabel(kind)}$. Запиши формулу для $y = ${s}f(x)$.`,
    },
    answer: { kind: 'expression', value, variables: ['x'] },
    solution: [
      { ru: `Умножаем $f(x)$ на $${s}$: знак минус даёт отражение от оси $x$, а $|${s}| > 1$ — растяжение по вертикали.` },
      { ru: 'Формула преобразования:', tex: `y = ${value}` },
    ],
    hints: ['Отрицательный множитель отражает график относительно оси $x$.', 'Множитель по модулю больше 1 растягивает график по вертикали.'],
    inputHint: 'Введи выражение через x',
  }
}

interface TransformCase {
  readonly id: string
  readonly formula: string
  readonly label: string
}

const TRANSFORM_BANK: readonly TransformCase[] = [
  { id: 'compress-reflect', formula: '-f(2x)', label: 'сжатие по горизонтали в 2 раза и отражение относительно оси $x$' },
  { id: 'reflect-y', formula: 'f(-x)', label: 'отражение относительно оси $y$' },
  { id: 'reflect-x', formula: '-f(x)', label: 'отражение относительно оси $x$' },
  { id: 'stretch-vert', formula: '2f(x)', label: 'растяжение по вертикали в 2 раза' },
  { id: 'stretch-horiz', formula: 'f\\left(\\dfrac{x}{2}\\right)', label: 'растяжение по горизонтали в 2 раза' },
  { id: 'compress-horiz', formula: 'f(2x)', label: 'сжатие по горизонтали в 2 раза' },
]

function tier3(rng: Rng): Problem {
  const correct = rng.pick(TRANSFORM_BANK)
  const others = rng.shuffle(TRANSFORM_BANK.filter((t) => t.id !== correct.id)).slice(0, 3)
  const options: readonly ChoiceOption[] = rng.shuffle([correct, ...others]).map((t) => ({ id: t.id, label: t.label }))
  return {
    statement: {
      en: `Which transformation turns $f(x)$ into $${correct.formula}$?`,
      ru: `Какое преобразование переводит $f(x)$ в $${correct.formula}$?`,
    },
    answer: { kind: 'choice', options, correctId: correct.id },
    solution: [
      { ru: `Верный ответ: ${correct.label}.` },
      { ru: 'Изменения аргумента (внутри скобок) действуют по горизонтали, изменения самой функции — по вертикали.' },
    ],
    hints: [...HINTS, 'Проверь отдельно: что происходит с $x$ внутри скобок и что происходит со знаком/множителем снаружи.'],
  }
}

export const template: SkillTemplate = {
  skillId: 'transformations',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
