import { joinTerms, linear, paren } from '../../math/latex'
import { polyAdd, polyEval, polyMul, polyToLatex, type Poly } from '../../math/poly'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'A function is continuous at a point $x=c$ if $\\lim_{x\\to c}f(x)$ exists and equals $f(c)$ — the graph has no break.',
  'For a piecewise function, continuity at a junction point means both formulas give the same value there.',
  'The discontinuities of a rational function are the zeros of the denominator. If the factor causing the zero cancels with the numerator, the discontinuity is removable; otherwise it is non-removable (a pole).',
  'A removable discontinuity can be "removed" by defining the function at that point to equal the limit.',
  'Common mistake: substituting the junction point into only one formula of a piecewise function and forgetting to set it equal to the other.',
].join('\n')

function tier1(rng: Rng): Problem {
  const c = rng.int(-4, 4)
  const m = rng.intExcept(-5, 5, [0])
  const k = rng.int(-8, 8)
  const rhsAtC = m * c + k
  const a = rhsAtC - c * c
  const rightLatex = linear(m, k)
  const statementCore = `f(x)=\\begin{cases}x^{2}+a, & x\\le ${c} \\\\ ${rightLatex}, & x> ${c}\\end{cases}`
  return {
    statement: `The function $${statementCore}$ is continuous everywhere. Find $a$.`,
    answer: { kind: 'number', value: String(a) },
    solution: [
      { text: 'At the junction point, both formulas must give the same value.' },
      { text: `The right-hand piece at $x=${c}$ equals:`, tex: `${joinTerms([`${m}\\cdot ${paren(c)}`, String(k)])} = ${rhsAtC}` },
      { text: 'Set the left-hand piece equal to this number and solve for $a$:', tex: `${paren(c)}^{2}+a = ${rhsAtC} \\ \\Rightarrow\\ a = ${rhsAtC} - ${c * c} = ${a}` },
    ],
    hints: ['At the junction point, the values of both pieces must match.', `Substitute $x=${c}$ into both pieces and set them equal.`],
  }
}

function tier2(rng: Rng): Problem {
  const c = rng.intExcept(-6, 6, [0])
  const r = rng.int(-4, 4)
  const numerator: Poly = polyAdd(polyMul([-r, 1], [-r, 1]), [1])
  const numLatex = polyToLatex(numerator)
  const denLatex = linear(1, -c)
  return {
    statement: `For which $x$ is $f(x)=\\dfrac{${numLatex}}{${denLatex}}$ discontinuous?`,
    answer: { kind: 'number', value: String(c) },
    solution: [
      { text: 'The function is undefined where the denominator equals zero:', tex: `${denLatex} = 0 \\ \\Rightarrow\\ x = ${c}` },
      { text: `The numerator at this point equals $${polyEval(numerator, c)}\\ne 0$ — the factor does not cancel, so this is a non-removable discontinuity.` },
    ],
    hints: ['The domain of the fraction excludes the zeros of the denominator.', 'Set the denominator equal to zero and solve.'],
  }
}

function removableHole(rng: Rng): Problem {
  const p = rng.intExcept(-6, 6, [0])
  const q = rng.intExcept(-6, 6, [0, p])
  const numerator: Poly = polyMul([-p, 1], [-q, 1])
  const numLatex = polyToLatex(numerator)
  const denLatex = linear(1, -p)
  const value = p - q
  return {
    statement: `The function $f(x)=\\dfrac{${numLatex}}{${denLatex}}$ is undefined at $x=${p}$. What value should be assigned to $f(${p})$ to make $f$ continuous there?`,
    answer: { kind: 'number', value: String(value) },
    solution: [
      {
        text: 'Factor the numerator — one factor matches the denominator:',
        tex: `\\frac{${numLatex}}{${denLatex}} = \\frac{\\left(${linear(1, -p)}\\right)\\left(${linear(1, -q)}\\right)}{${linear(1, -p)}} = ${linear(1, -q)} \\quad (x\\ne ${p})`,
      },
      { text: `Substitute the discontinuity point into the simplified expression:`, tex: `f(${p}) = ${paren(p)} - ${paren(q)} = ${value}` },
    ],
    hints: [
      'Factor the numerator — one factor should match the denominator.',
      'Cancel the common factor and substitute the discontinuity point into the remaining expression.',
    ],
  }
}

function twoConditions(rng: Rng): Problem {
  const p = rng.intExcept(-3, 2, [1])
  const q = rng.intExcept(p + 1, p + 5, [-1])
  const k = rng.pick([-3, -2, -1, 1, 2, 3])
  const D = p * q + 1
  const m = D * k
  const a = k * (q + 1)
  const b = k * (p - 1)
  const statementCore = `f(x)=\\begin{cases}ax-b, & x<${p} \\\\ ${m}, & ${p}\\le x<${q} \\\\ bx+a, & x\\ge ${q}\\end{cases}`
  return {
    statement: `Suppose $f$ is continuous everywhere: $${statementCore}$. Find $a$.`,
    answer: { kind: 'number', value: String(a) },
    solution: [
      { text: `Matching at $x=${p}$ gives the first equation:`, tex: `a\\cdot ${paren(p)} - b = ${m}` },
      { text: `Matching at $x=${q}$ gives the second equation:`, tex: `b\\cdot ${paren(q)} + a = ${m}` },
      { text: 'Solve the system of two equations in two unknowns:', tex: `a = ${a}, \\quad b = ${b}` },
    ],
    hints: [
      'The continuity condition at each junction point gives one equation in $a$ and $b$.',
      'Write both equations and solve the system by substitution or elimination.',
    ],
    inputHint: 'Enter the value of a (not b)',
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? removableHole(rng) : twoConditions(rng)
}

export const template: SkillTemplate = {
  skillId: 'continuity',
  theory,
  expectedSeconds: { 1: 75, 2: 60, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
