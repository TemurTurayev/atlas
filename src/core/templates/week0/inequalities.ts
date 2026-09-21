import { linear } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { IntervalPart, Problem, SkillTemplate } from '../types'

const theory = [
  'Inequality: a comparison of expressions using $<, >, \\le, \\ge$.',
  'A linear inequality is solved like an equation, but multiplying or dividing both sides by a negative number reverses the inequality sign.',
  'For a quadratic, $x^2-k^2<0$ holds between the roots: $-k<x<k$; $x^2-k^2>0$ holds outside the roots: $x<-k$ or $x>k$.',
  'Absolute value inequality: $|x-p|\\le k \\Leftrightarrow -k\\le x-p\\le k$.',
  'Common mistake: forgetting to reverse the inequality sign when multiplying or dividing by a negative number.',
].join('\n')

const HINTS = [
  'Solve it like an equation to find the boundary (or boundaries) of the interval.',
  'Multiplying or dividing both sides by a negative number reverses the inequality sign.',
]
const INPUT_HINT = 'A round bracket ( or ) excludes the endpoint; a square bracket [ or ] includes it. Join two intervals with ∪'

type Dir = '<' | '>' | '\\le' | '\\ge'

function boundaryPart(dir: Dir, x0: number): IntervalPart {
  const b = String(x0)
  switch (dir) {
    case '<':
      return { lo: null, hi: b, loClosed: false, hiClosed: false }
    case '\\le':
      return { lo: null, hi: b, loClosed: false, hiClosed: true }
    case '>':
      return { lo: b, hi: null, loClosed: false, hiClosed: false }
    case '\\ge':
      return { lo: b, hi: null, loClosed: true, hiClosed: false }
  }
}

function tier1(rng: Rng): Problem {
  const a = rng.int(2, 6)
  const x0 = rng.int(-8, 8)
  const b = rng.intExcept(-12, 12, [0])
  const rhs = a * x0 + b
  const dir = rng.pick<Dir>(['<', '>', '\\le', '\\ge'])
  const statement = `${linear(a, b)} ${dir} ${rhs}`
  return {
    statement: `Solve the inequality: $${statement}$`,
    answer: { kind: 'interval', parts: [boundaryPart(dir, x0)] },
    solution: [
      { text: `Move the number $${b}$ to the right side:`, tex: `${linear(a, 0)} ${dir} ${rhs - b}` },
      { text: `Divide both sides by $${a}$ (the coefficient is positive, the sign stays the same):`, tex: `x ${dir} ${x0}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const k = rng.int(2, 8)
  const statement = `x^{2} - ${k * k} < 0`
  return {
    statement: `Solve the inequality: $${statement}$`,
    answer: { kind: 'interval', parts: [{ lo: String(-k), hi: String(k), loClosed: false, hiClosed: false }] },
    solution: [
      { text: 'Factor the left side (difference of squares):', tex: `x^{2}-${k * k} = \\left(x-${k}\\right)\\left(x+${k}\\right)` },
      { text: 'The product is negative strictly between the roots:', tex: `-${k} < x < ${k}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function absValueBranch(rng: Rng): Problem {
  const p = rng.int(-6, 6)
  const k = rng.int(2, 9)
  const closed = rng.chance(0.7)
  const dir: '\\le' | '<' = closed ? '\\le' : '<'
  const inner = linear(1, -p)
  const statement = `\\left|${inner}\\right| ${dir} ${k}`
  return {
    statement: `Solve the inequality: $${statement}$`,
    answer: { kind: 'interval', parts: [{ lo: String(p - k), hi: String(p + k), loClosed: closed, hiClosed: closed }] },
    solution: [
      { text: `The absolute value inequality $|A| ${dir} ${k}$ is equivalent to the double inequality:`, tex: `-${k} ${dir} ${inner} ${dir} ${k}` },
      { text: `Add $${p}$ to each part:`, tex: `${p - k} ${dir} x ${dir} ${p + k}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function quadraticParamBranch(rng: Rng): Problem {
  const c = rng.pick([1, 4, 9, 16, 25])
  const boundary = 2 * Math.sqrt(c)
  const statement = `x^{2}+bx+${c}=0`
  return {
    statement: `For which values of $b$ does $${statement}$ have two distinct real roots?`,
    answer: {
      kind: 'interval',
      parts: [
        { lo: null, hi: String(-boundary), loClosed: false, hiClosed: false },
        { lo: String(boundary), hi: null, loClosed: false, hiClosed: false },
      ],
    },
    solution: [
      { text: 'Two distinct roots occur when the discriminant is positive:', tex: `D = b^{2}-4\\cdot ${c} > 0` },
      { text: 'Solve the inequality for $b$:', tex: `b^{2} > ${4 * c} \\;\\Rightarrow\\; |b| > ${boundary}` },
      { text: 'Result — the union of two rays:', tex: `b < ${-boundary} \\ \\text{or} \\ b > ${boundary}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? absValueBranch(rng) : quadraticParamBranch(rng)
}

export const template: SkillTemplate = {
  skillId: 'inequalities',
  theory,
  expectedSeconds: { 1: 45, 2: 90, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
