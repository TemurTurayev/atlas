import { linear } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'The inverse function $f^{-1}$ "undoes" the action of $f$: if $f(a) = b$, then $f^{-1}(b) = a$.',
  'To find $f^{-1}$: replace $f(x)$ with $y$, swap $x$ and $y$, then solve the equation for $y$.',
  'An inverse function exists only for an injective (one-to-one) function.',
  'The domain of $f^{-1}$ is the range of the original $f$, and vice versa.',
  'Common mistake: confusing $f^{-1}(x)$ with $\\dfrac{1}{f(x)}$ — these are completely different things.',
].join('\n')

const HINTS = ['Replace $f(x)$ with $y$, then swap $x$ and $y$.', 'Solve the resulting equation for the new $y$ — that is $f^{-1}(x)$.']
const DOMAIN_HINT = 'Enter an expression in x'

function tier1(rng: Rng): Problem {
  const a = rng.intExcept(-6, 6, [0])
  const b = rng.int(-8, 8)
  const f = linear(a, b)
  const value = `\\dfrac{${linear(1, -b)}}{${a}}`
  return {
    statement: `Given $f(x) = ${f}$, find $f^{-1}(x)$.`,
    answer: { kind: 'expression', value, variables: ['x'] },
    solution: [
      { text: 'Swap $x$ and $y$ in the equation $y = ax+b$:', tex: `x = ${linear(a, b, 'y')}` },
      { text: 'Move $b$ to the other side and divide by $a$:', tex: `y = ${value}` },
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
      { text: 'Replace $f(x)$ with $y$ and swap $x$ and $y$:', tex: `x = \\dfrac{${linear(a, b)}}{${linear(c, d)}}` },
      { text: 'Multiply both sides by the denominator:', tex: `x(${linear(c, d)}) = ${linear(a, b)}` },
      { text: 'Collect the terms with $y$ on one side and solve for $y$:', tex: `y = ${value}` },
    ],
    hints: [...HINTS, 'Multiply both sides by the denominator, then collect all the terms with $y$ on one side.'],
    inputHint: 'Enter a fraction using /, e.g. (2x+1)/(3-x)',
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
      { text: 'Swap $x$ and $y$:', tex: `x = ${addConst('e^{y}', c)}` },
      { text: 'Isolate the exponential and take the natural logarithm of both sides:', tex: `e^y = ${linear(1, -c)} \\;\\Rightarrow\\; y = ${value}` },
    ],
    hints: ['Move the constant so the exponential stands alone.', 'The logarithm is the inverse operation of the exponential: $\\ln(e^y) = y$.'],
    inputHint: 'Enter using the natural logarithm: ln(...)',
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
      { text: 'Swap $x$ and $y$:', tex: `x = \\sqrt{${linear(1, -a, 'y')}}` },
      { text: 'Square both sides (keeping in mind that $x \\ge 0$):', tex: `x^2 = ${linear(1, -a, 'y')} \\;\\Rightarrow\\; y = ${value}` },
    ],
    hints: ['Square both sides to get rid of the square root.', 'The domain of $f^{-1}$ is $x \\ge 0$, since a square root is never negative.'],
    inputHint: 'Enter an expression in x, e.g. x^2+3',
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
