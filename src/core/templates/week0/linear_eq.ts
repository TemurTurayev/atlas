import { coefPrefix, joinTerms, linear } from '../../math/latex'
import { lcm, rat, ratToLatex, sub } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'A linear equation is an equation of the form $ax + b = c$. The goal is to isolate $x$.',
  '1. Expand the parentheses and collect like terms.',
  '2. Move the terms with $x$ to the left and the numbers to the right; the sign flips when a term crosses the equals sign.',
  '3. Divide both sides by the coefficient of $x$.',
  'Common mistakes: forgetting to flip the sign when moving a term; multiplying a minus sign in front of parentheses by only the first term.',
].join('\n')

const HINTS = [
  'First expand the parentheses and collect everything with $x$ on one side.',
  'Move the numbers to the other side (flipping the sign), then divide by the coefficient of $x$.',
]

const INPUT_HINT = 'Enter a number. Type a fraction using /'

function problem(equation: string, x: number, solution: Problem['solution']): Problem {
  return {
    statement: `Solve for $x$: $${equation}$`,
    answer: { kind: 'number', value: String(x) },
    solution,
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const a = rng.int(2, 9)
  const x = rng.int(-9, 9)
  const b = rng.intExcept(-15, 15, [0])
  const c = a * x + b
  return problem(`${linear(a, b)} = ${c}`, x, [
    { text: 'Move the constant term to the right, flipping its sign:', tex: `${a}x = ${c} ${b > 0 ? '-' : '+'} ${Math.abs(b)} = ${c - b}` },
    { text: `Divide both sides by $${a}$:`, tex: `x = \\frac{${c - b}}{${a}} = ${x}` },
  ])
}

function tier2(rng: Rng): Problem {
  const a = rng.pick([2, 3, 4, 5, -2, -3])
  const p = rng.intExcept(-6, 6, [0])
  const q = rng.intExcept(-9, 9, [0])
  const r = rng.intExcept(-5, 5, [0, a])
  const x = rng.int(-6, 6)
  const s = a * (x + p) + q - r * x
  const lhs = joinTerms([`${coefPrefix(a)}\\left(${linear(1, p)}\\right)`, String(q)])
  const rhs = linear(r, s)
  const k = a - r
  const constant = s - a * p - q
  return problem(`${lhs} = ${rhs}`, x, [
    { text: 'Expand the parentheses:', tex: `${linear(a, a * p + q)} = ${rhs}` },
    { text: 'Move the terms with $x$ to the left, the numbers to the right:', tex: `${linear(k, 0)} = ${constant}` },
    { text: 'Divide by the coefficient of $x$:', tex: Math.abs(k) === 1 ? `x = ${x}` : `x = \\frac{${constant}}{${k}} = ${x}` },
  ])
}

function tier3(rng: Rng): Problem {
  const [m, n] = rng.shuffle([2, 3, 4, 5, 6]).slice(0, 2)
  const x = rng.int(-8, 8)
  const p = rng.intExcept(-6, 6, [0])
  const q = rng.intExcept(-6, 6, [0])
  const k = sub(rat(x + p, m), rat(x - q, n))
  const multiple = lcm(m, n)
  const cm = multiple / m
  const cn = multiple / n
  const right = (k.n * multiple) / k.d
  const coefX = cm - cn
  const constant = cm * p + cn * q
  const equation = `\\frac{${linear(1, p)}}{${m}} - \\frac{${linear(1, -q)}}{${n}} = ${ratToLatex(k)}`
  return problem(equation, x, [
    {
      text: `Multiply both sides by the common denominator $${multiple}$:`,
      tex: `${coefPrefix(cm)}\\left(${linear(1, p)}\\right) - ${coefPrefix(cn)}\\left(${linear(1, -q)}\\right) = ${right}`,
    },
    { text: 'Expand the parentheses — the minus sign in front of the second one flips both signs:', tex: `${linear(coefX, constant)} = ${right}` },
    { text: 'Move the number across and divide:', tex: `${linear(coefX, 0)} = ${right - constant} \\Rightarrow x = ${x}` },
  ])
}

export const template: SkillTemplate = {
  skillId: 'linear_eq',
  theory,
  expectedSeconds: { 1: 45, 2: 100, 3: 180 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
