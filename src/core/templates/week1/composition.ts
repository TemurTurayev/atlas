import { joinTerms, linear } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Composition of functions: $(f \\circ g)(x) = f(g(x))$ — apply $g$ first, then $f$ to the result.',
  '$(f \\circ g)(x)$ and $(g \\circ f)(x)$ are generally different functions — order matters.',
  'The domain of the composition consists of the $x$ where $g$ is defined and $g(x)$ lies in the domain of $f$.',
  'To compute $f(g(x))$, substitute the entire formula for $g(x)$ in place of $x$ in the formula for $f$.',
  'Common mistake: mixing up the order and computing $g(f(x))$ instead of $f(g(x))$.',
].join('\n')

const HINTS = ['Substitute the functions one at a time, starting with the innermost one.', 'Substitute the result of the inner function as a whole, in parentheses, in place of $x$ in the outer one.']
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
    statement: `Given $f(x) = x^2$ and $g(x) = ${g}$, find $(${order})(x)$.`,
    answer: { kind: 'expression', value, variables: ['x'] },
    solution: useFg
      ? [
          { text: 'Substitute $g(x)$ for $x$ in $f$:', tex: `f(g(x)) = (g(x))^2` },
          { text: 'Expand $g(x)$:', tex: `(${g})^2 = ${value}` },
        ]
      : [
          { text: 'Substitute $f(x)$ for $x$ in $g$:', tex: `g(f(x)) = ${addConst('f(x)', c)}` },
          { text: 'Substitute $f(x) = x^2$:', tex: `g(f(x)) = ${value}` },
        ],
    hints: HINTS,
    inputHint: 'Enter an expression in terms of x, e.g. (x+3)^2',
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
    statement: `Given $f(x) = ${f}$ and $g(x) = ${g}$, find $(${order})(x)$.`,
    answer: { kind: 'expression', value, variables: ['x'], domain: DOMAIN },
    solution: askFg
      ? [
          { text: 'Substitute $g(x)$ for $x$ in $f$:', tex: `f(g(x)) = ${addConst('g(x)', a)}` },
          { text: 'Write out $g(x)$ in full:', tex: value },
        ]
      : [
          { text: 'Substitute $f(x)$ for $x$ in $g$:', tex: `g(f(x)) = \\dfrac{1}{${joinTerms(['f(x)', String(-b)])}}` },
          { text: 'Expand $f(x)$ in the denominator and simplify:', tex: `\\dfrac{1}{${joinTerms([linear(1, a), String(-b)])}} ${joinTerms([linear(1, a), String(-b)]) === linear(1, a - b) ? '' : `= ${value}`}` },
        ],
    hints: [...HINTS, `The domain is restricted to $[1.5, 4]$ — the denominator is never zero there.`],
    inputHint: 'Enter a fraction using /, e.g. 1/(x-2)+3',
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
    return { text: `Apply $${key}$:`, tex: current }
  })
  const compositionLatex = order.join(' \\circ ')
  return {
    statement: `Given $f(x) = ${defs.f.formula}$, $g(x) = ${defs.g.formula}$, $h(x) = ${defs.h.formula}$, find $(${compositionLatex})(x)$.`,
    answer: { kind: 'expression', value: current, variables: ['x'] },
    solution: [{ text: `The composition is read right to left — start with the innermost function.` }, ...steps],
    hints: ['Substitute in order from right to left: start with the rightmost function.', 'After each step, substitute the whole result into the next function.'],
    inputHint: 'Enter an expression in terms of x',
  }
}

export const template: SkillTemplate = {
  skillId: 'composition',
  theory,
  expectedSeconds: { 1: 45, 2: 90, 3: 130 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
