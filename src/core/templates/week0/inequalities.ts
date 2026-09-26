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
  const a = rng.int(2, 8)
  const x0 = rng.int(-12, 12)
  const b = rng.intExcept(-15, 15, [0])
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
  const dir = rng.pick<Dir>(['<', '>', '\\le', '\\ge'])
  const isSimpleSquare = rng.chance(0.5)

  if (isSimpleSquare) {
    const k = rng.int(2, 12)
    const statement = `x^{2} - ${k * k} ${dir} 0`
    const closed = dir === '\\le' || dir === '\\ge'
    let parts: IntervalPart[]
    let solnText: string
    let solnTex: string

    if (dir === '<' || dir === '\\le') {
      parts = [{ lo: String(-k), hi: String(k), loClosed: closed, hiClosed: closed }]
      solnText = 'The product is negative (or zero) between the roots:'
      solnTex = `-${k} ${dir === '<' ? '<' : '\\le'} x ${dir === '<' ? '<' : '\\le'} ${k}`
    } else {
      parts = [
        { lo: null, hi: String(-k), loClosed: false, hiClosed: closed },
        { lo: String(k), hi: null, loClosed: closed, hiClosed: false },
      ]
      solnText = 'The product is positive (or zero) outside the roots:'
      solnTex = `x ${dir === '>' ? '<' : '\\le'} -${k} \\quad \\text{or} \\quad x ${dir === '>' ? '>' : '\\ge'} ${k}`
    }

    return {
      statement: `Solve the inequality: $${statement}$`,
      answer: { kind: 'interval', parts },
      solution: [
        { text: 'Factor the left side (difference of squares):', tex: `x^{2}-${k * k} = \\left(x-${k}\\right)\\left(x+${k}\\right)` },
        { text: solnText, tex: solnTex },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }

  // Factored form (x - a)(x - b) dir 0
  const a = rng.int(-8, 6)
  const b = rng.int(a + 1, a + 9)
  const closed = dir === '\\le' || dir === '\\ge'
  const polyStr = linear(1, -a) === 'x' ? `x(${linear(1, -b)})` : `(${linear(1, -a)})(${linear(1, -b)})`
  const statement = `${polyStr} ${dir} 0`
  let parts: IntervalPart[]
  let solnTex: string

  if (dir === '<' || dir === '\\le') {
    parts = [{ lo: String(a), hi: String(b), loClosed: closed, hiClosed: closed }]
    solnTex = `${a} ${dir === '<' ? '<' : '\\le'} x ${dir === '<' ? '<' : '\\le'} ${b}`
  } else {
    parts = [
      { lo: null, hi: String(a), loClosed: false, hiClosed: closed },
      { lo: String(b), hi: null, loClosed: closed, hiClosed: false },
    ]
    solnTex = `x ${dir === '>' ? '<' : '\\le'} ${a} \\quad \\text{or} \\quad x ${dir === '>' ? '>' : '\\ge'} ${b}`
  }

  return {
    statement: `Solve the inequality: $${statement}$`,
    answer: { kind: 'interval', parts },
    solution: [
      { text: `The roots of the quadratic equation are $x = ${a}$ and $x = ${b}$.` },
      { text: dir === '<' || dir === '\\le' ? 'A quadratic with positive leading coefficient is negative between its roots:' : 'A quadratic with positive leading coefficient is positive outside its roots:', tex: solnTex },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function absValueBranch(rng: Rng): Problem {
  const p = rng.int(-8, 8)
  const k = rng.int(2, 12)
  const closed = rng.chance(0.5)
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
  const c = rng.pick([1, 4, 9, 16, 25, 36, 49])
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
