import { joinTerms, linear, paren } from '../../math/latex'
import { rat, ratToLatex, sub, mul } from '../../math/rational'
import type { Rational } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Slope of a line through two points: $k=\\frac{y_2-y_1}{x_2-x_1}$.',
  'Line equation of the form $y=kx+b$: substitute one of the points to find $b$.',
  'Parallel lines have equal slopes: $k_1=k_2$.',
  'Perpendicular lines: $k_1\\cdot k_2=-1$, that is, $k_2=-\\frac{1}{k_1}$.',
  'Common mistakes: mixing up the order of subtraction in the numerator and the denominator; forgetting to flip the sign for a perpendicular slope.',
].join('\n')

const TIER1_HINTS = [
  'The slope is the ratio of the change in $y$ to the change in $x$.',
  'Formula: $k=\\frac{y_2-y_1}{x_2-x_1}$. Substitute the coordinates of the points.',
]
const TIER2_HINTS = [
  'First find the slope from the two points.',
  'Substitute one of the points into $y=kx+b$ and solve for $b$.',
  'Write the final equation in the form $y=kx+b$.',
]
const TIER3_HINTS = [
  'Parallel lines have equal slopes; for perpendicular lines the product of the slopes is $-1$.',
  'Find the new slope, then substitute the given point to find $b$.',
]

function ratLinearLatex(m: Rational, b: Rational): string {
  const sign = m.n < 0 ? '-' : ''
  const absN = Math.abs(m.n)
  const coef = m.d === 1 ? (absN === 1 ? '' : String(absN)) : `\\frac{${absN}}{${m.d}}`
  const xTerm = `${sign}${coef}x`
  const constTerm = b.n === 0 ? '' : ratToLatex(b)
  return joinTerms([xTerm, constTerm])
}

function tier1(rng: Rng): Problem {
  const p = rng.intExcept(-6, 6, [0])
  const q = rng.intExcept(-6, 6, [0])
  const slope = rat(p, q)
  const x1 = rng.int(-6, 6)
  const y1 = rng.int(-8, 8)
  const x2 = x1 + q
  const y2 = y1 + p
  const fracStr = `\\frac{${y2 - y1}}{${x2 - x1}}`
  const reducedStr = ratToLatex(slope)
  return {
    statement: `Find the slope of the line through $(${x1}, ${y1})$ and $(${x2}, ${y2})$.`,
    answer: { kind: 'number', value: reducedStr },
    solution: [
      { text: 'Slope from two points:', tex: `k = \\frac{y_2-y_1}{x_2-x_1} = \\frac{${y2}-${paren(y1)}}{${x2}-${paren(x1)}}` },
      { text: 'Compute:', tex: `k = ${fracStr === reducedStr ? reducedStr : `${fracStr} = ${reducedStr}`}` },
    ],
    hints: TIER1_HINTS,
    inputHint: 'Write a fraction with /, e.g. 3/4 or -2/5',
  }
}

function tier2(rng: Rng): Problem {
  const m = rng.intExcept(-5, 5, [0])
  const b = rng.int(-6, 6)
  const x1 = rng.int(-4, 4)
  const dx = rng.intExcept(-4, 4, [0])
  const x2 = x1 + dx
  const y1 = m * x1 + b
  const y2 = m * x2 + b
  return {
    statement: `Find the equation, in the form $y = mx + b$, of the line through $(${x1}, ${y1})$ and $(${x2}, ${y2})$.`,
    answer: { kind: 'expression', value: linear(m, b), variables: ['x'] },
    solution: [
      { text: 'Slope from two points:', tex: `k = \\frac{${y2}-${paren(y1)}}{${x2}-${paren(x1)}} = ${m}` },
      { text: 'Substitute the point into $y=kx+b$ to find $b$:', tex: `${y1} = ${m}\\cdot${paren(x1)} + b \\Rightarrow b = ${b}` },
      { text: 'Equation of the line:', tex: `y = ${linear(m, b)}` },
    ],
    hints: TIER2_HINTS,
    inputHint: 'Enter the equation as y=..., e.g. y=2x-3',
  }
}

function tier3(rng: Rng): Problem {
  const m = rng.intExcept(-4, 4, [0])
  const c = rng.int(-6, 6)
  const x0 = rng.intExcept(-6, 6, [0])
  const y0 = rng.int(-8, 8)
  const perpendicular = rng.chance(0.5)
  const slope = perpendicular ? rat(-1, m) : rat(m, 1)
  const intercept = sub(rat(y0), mul(slope, rat(x0)))
  const value = ratLinearLatex(slope, intercept)
  const relation = perpendicular ? 'perpendicular to' : 'parallel to'
  const solution: Problem['solution'] = perpendicular
    ? [
        { text: `The slope of the given line is $k=${m}$. For a perpendicular line, the slope is:`, tex: `k' = -\\frac{1}{k} = ${ratToLatex(slope)}` },
        { text: 'Substitute the point to find $b$:', tex: `${y0} = ${ratToLatex(slope)}\\cdot${paren(x0)} + b \\Rightarrow b = ${ratToLatex(intercept)}` },
        { text: 'Equation of the line:', tex: `y = ${value}` },
      ]
    : [
        { text: 'Parallel lines have equal slopes:', tex: `k' = k = ${m}` },
        { text: 'Substitute the point to find $b$:', tex: `${y0} = ${m}\\cdot${paren(x0)} + b \\Rightarrow b = ${ratToLatex(intercept)}` },
        { text: 'Equation of the line:', tex: `y = ${value}` },
      ]
  return {
    statement: `The line $y = ${linear(m, c)}$ is given. Find the equation, in the form $y = mx + b$, of the line through $(${x0}, ${y0})$ that is ${relation} it.`,
    answer: { kind: 'expression', value, variables: ['x'] },
    solution,
    hints: TIER3_HINTS,
    inputHint: 'Enter the equation as y=... The slope of a perpendicular line is the negative reciprocal',
  }
}

export const template: SkillTemplate = {
  skillId: 'lines_2d',
  theory,
  expectedSeconds: { 1: 45, 2: 90, 3: 170 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
