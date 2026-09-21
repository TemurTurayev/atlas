import { linear } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'Shift $f(x-h)+k$: the graph of $f$ shifts $h$ units right and $k$ units up (left/down for negative values).',
  'Vertical stretch/reflection: $a \\cdot f(x)$ stretches the graph by a factor of $|a|$; for $a<0$ it also reflects the graph across the $x$-axis.',
  'Horizontal stretch: $f(bx)$ compresses the graph by a factor of $|b|$ when $|b|>1$ and stretches it when $|b|<1$ — the effect is opposite to intuition.',
  'Common mistake: $f(x-2)$ is mistaken for a shift to the left — it is actually a shift RIGHT by 2.',
  'Another mistake: assuming $f(2x)$ stretches the graph — multiplying $x$ by a number greater than 1 actually compresses the graph toward the $y$-axis.',
].join('\n')

const HINTS = ['First determine what is changing — the input ($x$) or the output ($f(x)$) of the function.', 'Changes inside the parentheses $f(\\ldots)$ act on the graph "opposite" to intuition, horizontally.']

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
    statement: `Given $f(x) = ${baseLabel(kind)}$, write the formula for $${target}$.`,
    answer: { kind: 'expression', value, variables: ['x'] },
    solution: [
      { text: `Shift $${h}$ units right: replace $x$ with $${linear(1, -h)}$ inside $f$.`, tex: `f(${linear(1, -h)}) = ${shifted}` },
      { text: `Shift $${k}$ units up: add $${k}$ to the result.`, tex: value },
    ],
    hints: HINTS,
    inputHint: 'Enter an expression in x',
  }
}

function tier2(rng: Rng): Problem {
  const kind = rng.pick<BaseFn>(['sq', 'abs', 'cube'])
  const s = rng.pick([-2, -3, -4])
  const value = mulConst(baseLabel(kind), s)
  return {
    statement: `Given $f(x) = ${baseLabel(kind)}$, write the formula for $y = ${s}f(x)$.`,
    answer: { kind: 'expression', value, variables: ['x'] },
    solution: [
      { text: `Multiply $f(x)$ by $${s}$: the minus sign gives a reflection across the $x$-axis, and $|${s}| > 1$ gives a vertical stretch.` },
      { text: 'The transformed formula:', tex: `y = ${value}` },
    ],
    hints: ['A negative factor reflects the graph across the $x$-axis.', 'A factor with absolute value greater than 1 stretches the graph vertically.'],
    inputHint: 'Enter an expression in x',
  }
}

interface TransformCase {
  readonly id: string
  readonly formula: string
  readonly label: string
}

const TRANSFORM_BANK: readonly TransformCase[] = [
  { id: 'compress-reflect', formula: '-f(2x)', label: 'horizontal compression by a factor of 2 and reflection across the $x$-axis' },
  { id: 'reflect-y', formula: 'f(-x)', label: 'reflection across the $y$-axis' },
  { id: 'reflect-x', formula: '-f(x)', label: 'reflection across the $x$-axis' },
  { id: 'stretch-vert', formula: '2f(x)', label: 'vertical stretch by a factor of 2' },
  { id: 'stretch-horiz', formula: 'f\\left(\\dfrac{x}{2}\\right)', label: 'horizontal stretch by a factor of 2' },
  { id: 'compress-horiz', formula: 'f(2x)', label: 'horizontal compression by a factor of 2' },
]

function tier3(rng: Rng): Problem {
  const correct = rng.pick(TRANSFORM_BANK)
  const others = rng.shuffle(TRANSFORM_BANK.filter((t) => t.id !== correct.id)).slice(0, 3)
  const options: readonly ChoiceOption[] = rng.shuffle([correct, ...others]).map((t) => ({ id: t.id, label: t.label }))
  return {
    statement: `Which transformation turns $f(x)$ into $${correct.formula}$?`,
    answer: { kind: 'choice', options, correctId: correct.id },
    solution: [
      { text: `Correct answer: ${correct.label}.` },
      { text: 'Changes to the argument (inside the parentheses) act horizontally; changes to the function itself act vertically.' },
    ],
    hints: [...HINTS, 'Check separately: what happens to $x$ inside the parentheses, and what happens to the sign/factor outside.'],
  }
}

export const template: SkillTemplate = {
  skillId: 'transformations',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
