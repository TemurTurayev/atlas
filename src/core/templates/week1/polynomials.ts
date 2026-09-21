import { linear } from '../../math/latex'
import { polyFromRoots, polyMul, polyToLatex, type Poly } from '../../math/poly'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'A root of a polynomial is a value $x$ for which $f(x) = 0$.',
  'Factor theorem: if $f(r) = 0$, then $(x - r)$ divides $f(x)$ with no remainder.',
  'Multiplicity of a root is how many times the factor $(x-r)$ appears in the factorization; for example, in $x^2(x-3)$ the root $0$ has multiplicity 2.',
  'A set of roots lists each value once, even if its multiplicity is greater than 1.',
  'Common mistake: forgetting the root $x=0$ when $x$ can be factored out of the polynomial.',
].join('\n')

const HINTS = ['Factor the polynomial and set each factor equal to zero.', 'Write each distinct root value in the answer only once, even if its multiplicity is greater than 1.']
const INPUT_HINT = 'Roots separated by commas, e.g. 0, 2'

const bracket = (r: number): string => `\\left(${linear(1, -r)}\\right)`

function build(poly: Poly, roots: readonly number[], solution: Problem['solution']): Problem {
  const f = polyToLatex(poly)
  return {
    statement: `Find all real roots of $f(x) = ${f}$.`,
    answer: { kind: 'numberSet', values: roots.map(String) },
    solution,
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const degree = rng.pick([2, 3])
  const roots = rng.shuffle([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]).slice(0, degree)
  const factored = roots.map(bracket).join('')
  return {
    statement: `Find all real roots of $f(x) = ${factored}$.`,
    answer: { kind: 'numberSet', values: roots.map(String) },
    solution: [
      { text: 'The polynomial is already factored — set each factor equal to zero:', tex: `${factored} = 0` },
      { text: 'Roots:', tex: roots.map((r) => `x = ${r}`).join(', \\quad ') },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const roots = rng.shuffle([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]).slice(0, 3)
  const [given, ...rest] = roots
  const poly = polyFromRoots(1, roots)
  const quad = polyFromRoots(1, rest)
  return build(poly, roots, [
    { text: `We know that $x = ${given}$ is a root, so $f(x)$ is divisible by $${bracket(given)}$.` },
    { text: 'Divide the polynomial by this factor (by long division or synthetic division):', tex: `f(x) = ${bracket(given)}\\left(${polyToLatex(quad)}\\right)` },
    { text: 'Factor the remaining quadratic factor into roots:', tex: `${rest.map(bracket).join('')} = 0 \\;\\Rightarrow\\; x = ${rest[0]}, \\; x = ${rest[1]}` },
  ])
}

function multiplicityBranch(rng: Rng): Problem {
  const k = rng.int(2, 4)
  const r = rng.intExcept(-6, 6, [0])
  const power: Poly = Array.from({ length: k + 1 }, (_, i) => (i === k ? 1 : 0))
  const poly = polyMul(power, [-r, 1])
  return build(poly, [0, r], [
    { text: `Factor out the common factor $x^{${k}}$:`, tex: `${polyToLatex(poly)} = x^{${k}}\\left(${linear(1, -r)}\\right)` },
    { text: `Set each factor equal to zero: $x^{${k}} = 0$ gives the root $0$ (multiplicity ${k}), and $${linear(1, -r)} = 0$ gives the root $${r}$.` },
    { text: 'Set of distinct roots:', tex: `\\{0, ${r}\\}` },
  ])
}

function quarticBranch(rng: Rng): Problem {
  const roots = rng.shuffle([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]).slice(0, 4)
  const poly = polyFromRoots(1, roots)
  return build(poly, roots, [
    { text: 'Factor the degree-4 polynomial into 4 linear factors:', tex: `${roots.map(bracket).join('')} = 0` },
    { text: 'Roots:', tex: roots.map((r) => `x = ${r}`).join(', \\quad ') },
  ])
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? multiplicityBranch(rng) : quarticBranch(rng)
}

export const template: SkillTemplate = {
  skillId: 'polynomials',
  theory,
  expectedSeconds: { 1: 45, 2: 100, 3: 140 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
