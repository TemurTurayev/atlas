import { linear } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Обратная функция (inverse function) $f^{-1}$ «отменяет» действие $f$: если $f(a) = b$, то $f^{-1}(b) = a$.',
  'Чтобы найти $f^{-1}$: замени $f(x)$ на $y$, поменяй местами $x$ и $y$, затем реши уравнение относительно $y$.',
  'Обратная функция существует только у инъективной (взаимно однозначной) функции.',
  'Область определения $f^{-1}$ — это область значений исходной $f$, и наоборот.',
  'Типичная ошибка: путать $f^{-1}(x)$ с $\\dfrac{1}{f(x)}$ — это совершенно разные вещи.',
].join('\n')

const HINTS = ['Замени $f(x)$ на $y$, поменяй местами $x$ и $y$.', 'Реши получившееся уравнение относительно новой $y$ — это и есть $f^{-1}(x)$.']
const DOMAIN_HINT = 'Введи выражение через x'

function tier1(rng: Rng): Problem {
  const a = rng.intExcept(-6, 6, [0])
  const b = rng.int(-8, 8)
  const f = linear(a, b)
  const value = `\\dfrac{${linear(1, -b)}}{${a}}`
  return {
    statement: `Given $f(x) = ${f}$, find $f^{-1}(x)$.`,
    answer: { kind: 'expression', value, variables: ['x'] },
    solution: [
      { text: 'Меняем местами $x$ и $y$ в уравнении $y = ax+b$:', tex: `x = ${linear(a, b, 'y')}` },
      { text: 'Переносим $b$ и делим на $a$:', tex: `y = ${value}` },
    ],
    hints: HINTS,
    inputHint: DOMAIN_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const c = rng.pick([1, 2, 3])
  const pole = rng.pick([-3, -2, -1, 0, 6, 7])
  const a = pole * c
  const d = rng.int(-5, 5)
  const badB = pole * d
  const b = rng.intExcept(-5, 5, [badB])
  const f = `\\dfrac{${linear(a, b)}}{${linear(c, d)}}`
  const value = `\\dfrac{${linear(d, -b)}}{${linear(-c, a)}}`
  return {
    statement: `Given $f(x) = ${f}$, find $f^{-1}(x)$.`,
    answer: { kind: 'expression', value, variables: ['x'], domain: { x: [1.5, 4] } },
    solution: [
      { text: 'Заменяем $f(x)$ на $y$ и меняем $x$ с $y$ местами:', tex: `x = \\dfrac{${linear(a, b)}}{${linear(c, d)}}` },
      { text: 'Умножаем обе части на знаменатель:', tex: `x(${linear(c, d)}) = ${linear(a, b)}` },
      { text: 'Собираем слагаемые с $y$ в одной части и выражаем $y$:', tex: `y = ${value}` },
    ],
    hints: [...HINTS, 'Умножь обе части на знаменатель, потом собери все члены с $y$ в одной части.'],
    inputHint: 'Введи дробь через /, например (2x+1)/(3-x)',
  }
}

const addConst = (base: string, c: number): string => `${base}${c === 0 ? '' : c > 0 ? `+${c}` : c}`

function expBranch(rng: Rng): Problem {
  const c = rng.intExcept(-5, 5, [0])
  const f = addConst('e^{x}', c)
  const value = `\\ln\\left(${linear(1, -c)}\\right)`
  return {
    statement: `Given $f(x) = ${f}$, find $f^{-1}(x)$.`,
    answer: { kind: 'expression', value, variables: ['x'], domain: { x: [c + 1, c + 5] } },
    solution: [
      { text: 'Меняем $x$ и $y$ местами:', tex: `x = ${addConst('e^{y}', c)}` },
      { text: 'Выражаем экспоненту и берём натуральный логарифм от обеих частей:', tex: `e^y = ${linear(1, -c)} \\;\\Rightarrow\\; y = ${value}` },
    ],
    hints: ['Перенеси константу, чтобы экспонента осталась одна.', 'Логарифм — обратная операция к экспоненте: $\\ln(e^y) = y$.'],
    inputHint: 'Введи через натуральный логарифм: ln(...)',
  }
}

function sqrtBranch(rng: Rng): Problem {
  const a = rng.int(-6, 6)
  const f = `\\sqrt{${linear(1, -a)}}`
  const value = addConst('x^{2}', a)
  return {
    statement: `Given $f(x) = ${f}$ for $x \\ge ${a}$, find $f^{-1}(x)$.`,
    answer: { kind: 'expression', value, variables: ['x'], domain: { x: [0.3, 4] } },
    solution: [
      { text: 'Меняем $x$ и $y$ местами:', tex: `x = \\sqrt{${linear(1, -a, 'y')}}` },
      { text: 'Возводим обе части в квадрат (учитывая, что $x \\ge 0$):', tex: `x^2 = ${linear(1, -a, 'y')} \\;\\Rightarrow\\; y = ${value}` },
    ],
    hints: ['Возведи обе части в квадрат, чтобы избавиться от корня.', 'Область определения $f^{-1}$ — это $x \\ge 0$, ведь корень не бывает отрицательным.'],
    inputHint: 'Введи выражение через x, например x^2+3',
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? expBranch(rng) : sqrtBranch(rng)
}

export const template: SkillTemplate = {
  skillId: 'inverse_fn',
  theory,
  expectedSeconds: { 1: 50, 2: 100, 3: 140 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
