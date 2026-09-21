import { coefPrefix, linear, paren } from '../../math/latex'
import { polyMul, polyToLatex, type Poly } from '../../math/poly'
import type { Rng } from '../../random/rng'
import type { Problem, SolutionStep, SkillTemplate } from '../types'

const theory = [
  'Expanding means multiplying every term inside the brackets.',
  'Special product formulas: $(a+b)^2=a^2+2ab+b^2$, $(a-b)^2=a^2-2ab+b^2$, $(a-b)(a+b)=a^2-b^2$.',
  'For a product of polynomials, multiply each term of one by each term of the other and collect like terms.',
  'Common mistakes: forgetting the middle term $2ab$; not multiplying the minus sign in front of a bracket through every term.',
].join('\n')

const HINTS = [
  'Multiply each term inside the bracket separately.',
  'For the square of a sum/difference, use the formula $(a\\pm b)^2=a^2\\pm2ab+b^2$.',
]
const INPUT_HINT = 'Expand the brackets and collect like terms'

function build(statement: string, poly: Poly, solution: readonly SolutionStep[], variable = 'x'): Problem {
  return {
    statement: `Expand: $${statement}$`,
    answer: { kind: 'expression', value: polyToLatex(poly, variable), variables: [variable], form: 'expanded' },
    solution,
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const a = rng.intExcept(-9, 9, [0, 1, -1])
  const b = rng.intExcept(-9, 9, [0])
  const poly: Poly = [a * b, a]
  const statement = `${coefPrefix(a)}\\left(${linear(1, b)}\\right)`
  return build(statement, poly, [
    { text: `Multiply $${a}$ by each term inside the bracket:`, tex: `${a}\\cdot x ${b >= 0 ? '+' : '-'} ${a}\\cdot ${Math.abs(b)}` },
    { text: 'Result:', tex: polyToLatex(poly) },
  ])
}

function squareBranch(rng: Rng): Problem {
  const p = rng.int(2, 5)
  const q = rng.intExcept(-9, 9, [0])
  const lin: Poly = [q, p]
  const poly = polyMul(lin, lin)
  const statement = `\\left(${linear(p, q)}\\right)^{2}`
  const mid = 2 * p * q
  return build(statement, poly, [
    { text: 'The square-of-a-sum/difference formula:', tex: '(u+v)^2=u^2+2uv+v^2' },
    {
      text: `Here $u=${p}x$, $v=${paren(q)}$:`,
      tex: `(${p}x)^{2} ${mid >= 0 ? '+' : '-'} 2\\cdot ${p}x\\cdot ${paren(q)} + ${paren(q)}^{2}`,
    },
    { text: 'Result:', tex: polyToLatex(poly) },
  ])
}

function diffSquaresBranch(rng: Rng): Problem {
  const b = rng.int(2, 9)
  const poly: Poly = [-(b * b), 0, 1]
  const statement = `\\left(${linear(1, -b)}\\right)\\left(${linear(1, b)}\\right)`
  return build(statement, poly, [
    { text: 'Difference of squares:', tex: 'a^2-b^2=(a-b)(a+b)' },
    { text: 'Result:', tex: polyToLatex(poly) },
  ])
}

function tier2(rng: Rng): Problem {
  return rng.chance(0.5) ? squareBranch(rng) : diffSquaresBranch(rng)
}

function cubicBranch(rng: Rng): Problem {
  const d = rng.intExcept(-6, 6, [0])
  const p = rng.pick([1, 2, 3])
  const q = rng.intExcept(-6, 6, [0])
  const r = rng.intExcept(-6, 6, [0])
  const quad: Poly = [r, q, p]
  const poly = polyMul([d, 1], quad)
  const statement = `\\left(${linear(1, d)}\\right)\\left(${polyToLatex(quad)}\\right)`
  return build(statement, poly, [
    { text: 'Multiply each term of the first bracket by the whole trinomial:' },
    {
      text: 'Expand:',
      tex: `x\\cdot\\left(${polyToLatex(quad)}\\right) ${d >= 0 ? '+' : '-'} ${Math.abs(d)}\\cdot\\left(${polyToLatex(quad)}\\right)`,
    },
    { text: 'Collect like terms:', tex: polyToLatex(poly) },
  ])
}

function diffOfSquaresIdentityBranch(rng: Rng): Problem {
  const p = rng.int(1, 5)
  const q = rng.int(1, 5)
  const termA = `${coefPrefix(p)}a`
  const termB = `${coefPrefix(q)}b`
  const statement = `\\left(${termA}+${termB}\\right)^{2}-\\left(${termA}-${termB}\\right)^{2}`
  const coef = 4 * p * q
  const answer = `${coef}ab`
  return {
    statement: `Expand and simplify: $${statement}$`,
    answer: { kind: 'expression', value: answer, variables: ['a', 'b'], form: 'expanded' },
    solution: [
      { text: 'General formula:', tex: '(u+v)^2-(u-v)^2=4uv' },
      { text: `Here $u=${termA}$, $v=${termB}$, so the answer is:`, tex: answer },
    ],
    hints: ['Expand both squares using the special product formulas.', '$u^2$ and $v^2$ cancel on subtraction — only $4uv$ remains.'],
    inputHint: INPUT_HINT,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? cubicBranch(rng) : diffOfSquaresIdentityBranch(rng)
}

export const template: SkillTemplate = {
  skillId: 'expand',
  theory,
  expectedSeconds: { 1: 40, 2: 80, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
