import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Exponential equation: if $b^{x}=b^{y}$ with $b>0,\\ b\\ne1$, then $x=y$ — equate the exponents.',
  'If the bases are different, take the logarithm of both sides: from $Ae^{kt}=B$ it follows that $t=\\dfrac{1}{k}\\ln\\dfrac{B}{A}$.',
  'Logarithmic equation: combine the logarithms into one using the log laws, then switch to exponential form $\\log_b N=c \\iff N=b^{c}$.',
  'After solving a logarithmic equation, check that the arguments of the logarithms stay positive — extraneous roots are discarded.',
  'Common mistake: forgetting the domain of validity and keeping a root for which the expression under the logarithm is negative.',
].join('\n')

function tier1(rng: Rng): Problem {
  const b = rng.pick([2, 3, 5])
  const m = rng.int(2, 5)
  const N = b ** m
  return {
    statement: `Solve for $x$: $${b}^{x} = ${N}$.`,
    answer: { kind: 'number', value: String(m) },
    solution: [
      { text: 'Write the right-hand side as a power of the same base:', tex: `${N} = ${b}^{${m}}` },
      { text: 'The bases are equal, so the exponents are equal too:', tex: `x = ${m}` },
    ],
    hints: ['Write the right-hand side as a power of base $b$.', 'If $b^{x}=b^{m}$, then $x=m$.'],
  }
}

const K_OPTIONS: readonly { readonly n: number; readonly latex: string }[] = [
  { n: 2, latex: '0.5' },
  { n: 4, latex: '0.25' },
  { n: 5, latex: '0.2' },
  { n: 10, latex: '0.1' },
]

function tier2(rng: Rng): Problem {
  const { n, latex: kLatex } = rng.pick(K_OPTIONS)
  const A = rng.int(2, 9)
  const R = rng.intExcept(2, 9, [1])
  const B = A * R
  return {
    statement: `Solve for $t$: $${A}e^{${kLatex}t} = ${B}$.`,
    answer: { kind: 'number', value: `${n}\\ln ${R}` },
    solution: [
      { text: 'Divide both sides by the coefficient in front of the exponential:', tex: `e^{${kLatex}t} = \\frac{${B}}{${A}} = ${R}` },
      { text: 'Take the natural logarithm of both sides:', tex: `${kLatex}t = \\ln ${R}` },
      { text: 'Solve for $t$:', tex: `t = \\frac{\\ln ${R}}{${kLatex}} = ${n}\\ln ${R}` },
    ],
    hints: [
      'Divide both sides of the equation by the coefficient in front of the exponential.',
      'Take the natural logarithm of both sides: $\\ln(e^{u})=u$.',
    ],
    inputHint: 'Exact answer or decimal approximation, e.g. 5\\ln4 or 6.93',
  }
}

interface LogEqCase {
  readonly b: number
  readonly p: number
  readonly x0: number
  readonly c: number
}

/** Curated so that (x0-p)(x0+p) = b^c exactly. */
const CASES: readonly LogEqCase[] = [
  { b: 2, p: 1, x0: 3, c: 3 },
  { b: 2, p: 3, x0: 5, c: 4 },
  { b: 2, p: 7, x0: 9, c: 5 },
  { b: 3, p: 1, x0: 2, c: 1 },
  { b: 3, p: 4, x0: 5, c: 2 },
  { b: 3, p: 3, x0: 6, c: 3 },
  { b: 5, p: 2, x0: 3, c: 1 },
]

function tier3(rng: Rng): Problem {
  const { b, p, x0, c } = rng.pick(CASES)
  const bc = b ** c
  return {
    statement: `Solve for $x$ (assume $x>${p}$): $\\log_{${b}}(x-${p}) + \\log_{${b}}(x+${p}) = ${c}$.`,
    answer: { kind: 'number', value: String(x0) },
    solution: [
      { text: 'A sum of logarithms with the same base is the logarithm of the product:', tex: `\\log_{${b}}\\left((x-${p})(x+${p})\\right) = ${c}` },
      { text: 'Switch to exponential form:', tex: `(x-${p})(x+${p}) = ${b}^{${c}} = ${bc}` },
      { text: `Expand the difference of squares and solve (take the positive root, since $x>${p}$):`, tex: `x^{2} - ${p * p} = ${bc} \\ \\Rightarrow\\ x^{2} = ${p * p + bc} \\ \\Rightarrow\\ x = ${x0}` },
    ],
    hints: [
      'Combine the sum of logarithms into one: $\\log_b A+\\log_b B=\\log_b(AB)$.',
      'Switch from the logarithmic equation to the exponential one: $\\log_b N=c \\iff N=b^{c}$.',
      'Account for the domain of validity: both arguments of the logarithm must be positive.',
    ],
  }
}

export const template: SkillTemplate = {
  skillId: 'exp_log_eq',
  theory,
  expectedSeconds: { 1: 45, 2: 95, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
