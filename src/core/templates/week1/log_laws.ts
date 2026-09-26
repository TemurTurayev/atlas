import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Properties of logarithms (log laws): $\\log_b(xy)=\\log_b x+\\log_b y$; $\\log_b\\frac{x}{y}=\\log_b x-\\log_b y$; $\\log_b(x^{k})=k\\log_b x$.',
  'The logarithm $\\log_b N$ answers the question: to what power must the base $b$ be raised to get $N$? Writing $\\log$ without a base usually means base $10$; $\\ln$ is the natural logarithm, base $e$.',
  'Change of base: $\\log_b N=\\dfrac{\\ln N}{\\ln b}$.',
  'A logarithm is defined only for a positive argument — keep track of the domain of validity.',
  'Common mistake: confusing $\\log(x+y)$ with $\\log x+\\log y$ — only the logarithms themselves can be added, not their arguments inside the sum.',
].join('\n')

type Base = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 'e'

function logLatex(base: Base, argument: string): string {
  if (base === 'e') return `\\ln\\left(${argument}\\right)`
  if (base === 10) return `\\log\\left(${argument}\\right)`
  return `\\log_{${base}}\\left(${argument}\\right)`
}

const varPow = (v: string, e: number): string => (e === 1 ? v : `${v}^{${e}}`)

function tier1(rng: Rng): Problem {
  const b = rng.pick([2, 3, 4, 5, 6, 7, 8, 9, 10] as const)
  const m = rng.int(1, 6)
  const N = b ** m
  const expr = logLatex(b, String(N))
  return {
    statement: `Compute: $${expr}$`,
    answer: { kind: 'number', value: String(m) },
    solution: [
      { text: 'Find the exponent:', tex: `${b}^{${m}} = ${N}` },
      { text: 'So:', tex: `${expr} = ${m}` },
    ],
    hints: [
      'The logarithm $\\log_b N$ is the exponent to which $b$ must be raised to get $N$.',
      'Try powers of the base until you get the number under the logarithm.',
    ],
  }
}

function tier2(rng: Rng): Problem {
  const base = rng.pick<Base>([2, 3, 'e'])
  const p = rng.int(2, 5)
  const q = rng.int(2, 5)
  const term1 = `${varPow('a', p)}${varPow('b', q)}`
  const term2 = 'ab'
  const resultTerm = `${varPow('a', p - 1)}${varPow('b', q - 1)}`
  const first = logLatex(base, term1)
  const second = logLatex(base, term2)
  const ratioExpr = logLatex(base, `\\frac{${term1}}{${term2}}`)
  const answerValue = logLatex(base, resultTerm)
  return {
    statement: `Combine into a single logarithm and simplify: $${first} - ${second}$.`,
    answer: { kind: 'expression', value: answerValue, variables: ['a', 'b'], domain: { a: [1.5, 4], b: [1.5, 4] } },
    solution: [
      { text: 'The difference of logarithms with the same base is the logarithm of the quotient:', tex: `${first} - ${second} = ${ratioExpr}` },
      { text: 'Simplify the fraction inside the logarithm:', tex: `${ratioExpr} = ${answerValue}` },
    ],
    hints: [
      'Use $\\log_b x-\\log_b y=\\log_b\\frac{x}{y}$.',
      `Simplify the fraction $\\frac{${term1}}{${term2}}$ by subtracting the exponents of $a$ and $b$.`,
    ],
    inputHint: 'The answer is a logarithm in variables a, b, e.g. \\log_2(ab)',
  }
}

function tier3(rng: Rng): Problem {
  const base = rng.pick<Base>([2, 3, 'e'])
  const m = rng.int(1, 4)
  const n = rng.int(1, 4)
  const leftTerm = m === 1 ? logLatex(base, 'x') : `${m}${logLatex(base, 'x')}`
  const rightTerm = n === 1 ? logLatex(base, 'y') : `${n}${logLatex(base, 'y')}`
  const poweredTerm = `${varPow('x', m)}${varPow('y', n)}`
  const answerValue = logLatex(base, poweredTerm)
  return {
    statement: `Write as a single logarithm: $${leftTerm} + ${rightTerm}$.`,
    answer: { kind: 'expression', value: answerValue, variables: ['x', 'y'], domain: { x: [1.5, 4], y: [1.5, 4] } },
    solution: [
      { text: 'Move the coefficient in front of the logarithm into the exponent inside the logarithm:', tex: `${leftTerm} = ${logLatex(base, varPow('x', m))}, \\quad ${rightTerm} = ${logLatex(base, varPow('y', n))}` },
      { text: 'Logarithms with the same base add up to the logarithm of the product:', tex: `${logLatex(base, varPow('x', m))} + ${logLatex(base, varPow('y', n))} = ${answerValue}` },
    ],
    hints: [
      'Use $k\\log_b x=\\log_b(x^{k})$ to bring the coefficient inside the logarithm.',
      'Use $\\log_b x+\\log_b y=\\log_b(xy)$ to combine into a single logarithm.',
    ],
    inputHint: 'The answer is a logarithm in variables x, y, e.g. \\log_3(x^2y)',
  }
}

export const template: SkillTemplate = {
  skillId: 'log_laws',
  theory,
  expectedSeconds: { 1: 40, 2: 85, 3: 115 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
