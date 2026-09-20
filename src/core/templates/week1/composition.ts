import { linear } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Композиция функций (composition) $(f \\circ g)(x) = f(g(x))$ — сначала применяем $g$, потом $f$ к результату.',
  '$(f \\circ g)(x)$ и $(g \\circ f)(x)$ в общем случае разные функции — порядок важен.',
  'Область определения композиции — те $x$, где определена $g$, а $g(x)$ попадает в область определения $f$.',
  'Чтобы вычислить $f(g(x))$, подставь всю формулу $g(x)$ вместо $x$ в формулу $f$.',
  'Типичная ошибка: перепутать порядок и посчитать $g(f(x))$ вместо $f(g(x))$.',
].join('\n')

const HINTS = ['Подставляй функции по одной, начиная с самой внутренней.', 'Результат внутренней функции подставь целиком, в скобках, вместо $x$ во внешнюю.']
const DOMAIN = { x: [1.5, 4] as const }

const sq = (e: string): string => (e === 'x' ? 'x^{2}' : `\\left(${e}\\right)^{2}`)
const addConst = (e: string, c: number): string => (c === 0 ? e : `${e}${c > 0 ? '+' : ''}${c}`)

function tier1(rng: Rng): Problem {
  const c = rng.intExcept(-6, 6, [0])
  const g = linear(1, c)
  const useFg = rng.chance(0.5)
  const value = useFg ? sq(g) : addConst('x^{2}', c)
  const order = useFg ? 'f \\circ g' : 'g \\circ f'
  return {
    statement: {
      en: `Given $f(x) = x^2$ and $g(x) = ${g}$, find $(${order})(x)$.`,
      ru: `Даны $f(x) = x^2$ и $g(x) = ${g}$. Найди $(${order})(x)$.`,
    },
    answer: { kind: 'expression', value, variables: ['x'] },
    solution: useFg
      ? [
          { ru: 'Подставляем $g(x)$ вместо $x$ в $f$:', tex: `f(g(x)) = (g(x))^2` },
          { ru: 'Раскрываем $g(x)$:', tex: `(${g})^2 = ${value}` },
        ]
      : [
          { ru: 'Подставляем $f(x)$ вместо $x$ в $g$:', tex: `g(f(x)) = ${addConst('f(x)', c)}` },
          { ru: 'Раскрываем $f(x) = x^2$:', tex: `${addConst('x^2', c)} = ${value}` },
        ],
    hints: HINTS,
    inputHint: 'Введи выражение через x, например (x+3)^2',
  }
}

function tier2(rng: Rng): Problem {
  const askFg = rng.chance(0.5)
  const a = rng.intExcept(-4, 4, [0])
  const outside = rng.pick([-3, -2, -1, 0, 1, 5, 6, 7])
  const b = askFg ? outside : outside + a
  const f = linear(1, a)
  const g = `\\dfrac{1}{${linear(1, -b)}}`
  const value = askFg ? `\\dfrac{1}{${linear(1, -b)}}${a >= 0 ? '+' : ''}${a}` : `\\dfrac{1}{${linear(1, a - b)}}`
  const order = askFg ? 'f \\circ g' : 'g \\circ f'
  return {
    statement: {
      en: `Given $f(x) = ${f}$ and $g(x) = ${g}$, find $(${order})(x)$.`,
      ru: `Даны $f(x) = ${f}$ и $g(x) = ${g}$. Найди $(${order})(x)$.`,
    },
    answer: { kind: 'expression', value, variables: ['x'], domain: DOMAIN },
    solution: askFg
      ? [
          { ru: 'Подставляем $g(x)$ вместо $x$ в $f$:', tex: `f(g(x)) = ${addConst('g(x)', a)}` },
          { ru: 'Записываем $g(x)$ целиком:', tex: value },
        ]
      : [
          { ru: 'Подставляем $f(x)$ вместо $x$ в $g$:', tex: `g(f(x)) = \\dfrac{1}{f(x) - ${b}}` },
          { ru: 'Раскрываем $f(x)$ в знаменателе и упрощаем:', tex: `\\dfrac{1}{${linear(1, a)} - ${b}} = ${value}` },
        ],
    hints: [...HINTS, `Область определения ограничена до $[1.5, 4]$ — знаменатель там нигде не обращается в ноль.`],
    inputHint: 'Введи дробь через /, например 1/(x-2)+3',
  }
}

function tier3(rng: Rng): Problem {
  const a = rng.intExcept(-6, 6, [0])
  const b = rng.intExcept(-6, 6, [0, a])
  const defs: Record<'f' | 'g' | 'h', { readonly formula: string; readonly apply: (e: string) => string }> = {
    f: { formula: 'x^{2}', apply: sq },
    g: { formula: linear(1, a), apply: (e) => addConst(e, a) },
    h: { formula: linear(1, b), apply: (e) => addConst(e, b) },
  }
  const order = rng.shuffle(['f', 'g', 'h'] as const)
  let current = 'x'
  const steps = [...order].reverse().map((key) => {
    current = defs[key].apply(current)
    return { ru: `Применяем $${key}$:`, tex: current }
  })
  const compositionLatex = order.join(' \\circ ')
  return {
    statement: {
      en: `Given $f(x) = ${defs.f.formula}$, $g(x) = ${defs.g.formula}$, $h(x) = ${defs.h.formula}$, find $(${compositionLatex})(x)$.`,
      ru: `Даны $f(x) = ${defs.f.formula}$, $g(x) = ${defs.g.formula}$, $h(x) = ${defs.h.formula}$. Найди $(${compositionLatex})(x)$.`,
    },
    answer: { kind: 'expression', value: current, variables: ['x'] },
    solution: [{ ru: `Композиция читается справа налево — начинаем с внутренней функции.` }, ...steps],
    hints: ['Выполняй подстановку по порядку справа налево: сначала самая правая функция.', 'После каждого шага результат подставляй целиком в следующую функцию.'],
    inputHint: 'Введи выражение через x',
  }
}

export const template: SkillTemplate = {
  skillId: 'composition',
  theory,
  expectedSeconds: { 1: 45, 2: 90, 3: 130 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
