import { linear } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { IntervalPart, Problem, SkillTemplate } from '../types'

const theory = [
  'The domain of a function is the set of all $x$ for which the formula is defined.',
  'Under a square root, the radicand must be $\\ge 0$: $\\sqrt{x-a}$ requires $x \\ge a$.',
  'The denominator of a fraction cannot equal zero — such points are excluded from the domain.',
  'Under a logarithm, the argument must be strictly greater than zero: $\\ln(x-a)$ requires $x > a$.',
  'The range of a function is the set of all $y$ values it actually attains.',
  'Common mistake: forgetting to exclude the point where the denominator equals zero, or confusing $\\ge$ with strict $>$.',
].join('\n')

const HINTS = ['Find each restriction separately (radical, denominator, logarithm).', 'Combine the conditions: take the intersection, and exclude points where the denominator is zero.']
const INPUT_HINT = 'Build the answer with the buttons: ( excludes the endpoint, [ includes it'

const part = (lo: string | null, hi: string | null, loClosed: boolean, hiClosed: boolean): IntervalPart => ({ lo, hi, loClosed, hiClosed })

function tier1(rng: Rng): Problem {
  const a = rng.int(-20, 20)
  const f = `\\sqrt{${linear(1, -a)}}`
  return {
    statement: `Find the domain of $f(x) = ${f}$.`,
    answer: { kind: 'interval', parts: [part(String(a), null, true, false)] },
    solution: [
      { text: 'The radicand cannot be negative:', tex: `${linear(1, -a)} \\ge 0` },
      { text: 'Solve the inequality:', tex: `x \\ge ${a}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const a = rng.int(-12, 10)
  const b = rng.int(a + 1, a + 12)
  const f = `\\dfrac{\\sqrt{${linear(1, -a)}}}{${linear(1, -b)}}`
  return {
    statement: `Find the domain of $f(x) = ${f}$.`,
    answer: {
      kind: 'interval',
      parts: [part(String(a), String(b), true, false), part(String(b), null, false, false)],
    },
    solution: [
      { text: 'The radicand is nonnegative:', tex: `x \\ge ${a}` },
      { text: 'The denominator is not zero:', tex: `x \\ne ${b}` },
      { text: 'Combine both conditions (the point $b$ is excluded):', tex: `[${a}, ${b}) \\cup (${b}, \\infty)` },
    ],
    hints: [...HINTS, `Do not forget that $x = ${b}$ makes the denominator zero, even though the radical is defined there.`],
    inputHint: INPUT_HINT,
  }
}

function logDomain(rng: Rng): Problem {
  const a = rng.int(-20, 20)
  const f = `\\ln\\left(${linear(1, -a)}\\right)`
  return {
    statement: `Find the domain of $f(x) = ${f}$.`,
    answer: { kind: 'interval', parts: [part(String(a), null, false, false)] },
    solution: [
      { text: 'The argument of the logarithm must be strictly positive:', tex: `${linear(1, -a)} > 0` },
      { text: 'Solve the inequality:', tex: `x > ${a}` },
    ],
    hints: ['A logarithm is defined only for a positive argument.', `Solve the strict inequality $${linear(1, -a)} > 0$.`],
    inputHint: INPUT_HINT,
  }
}

function quadraticRange(rng: Rng): Problem {
  const h = rng.int(-15, 15)
  const k = rng.int(-15, 15)
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
      { text: `The vertex of the parabola is at $x = ${h}$, with value $y = ${k}$ at the vertex.` },
      {
        text: opensUp ? 'The branches open upward — the minimum is at the vertex, and $y$ increases without bound from there:' : 'The branches open downward — the maximum is at the vertex, and $y$ decreases without bound from there:',
        tex: opensUp ? `y \\ge ${k}` : `y \\le ${k}`,
      },
    ],
    hints: ['Find the $y$-coordinate of the vertex of the parabola.', opensUp ? 'Branches upward — the range starts at the vertex and goes to $+\\infty$.' : 'Branches downward — the range goes from $-\\infty$ to the vertex.'],
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
