import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Rearranging a formula: isolate the required letter alone on one side of the equation.',
  'The steps are the same as for an equation: move terms across with a sign change, multiply or divide both sides.',
  'If the variable is in the denominator, first multiply both sides by that denominator.',
  'Common mistake: multiplying or dividing only part of an expression instead of both whole sides.',
].join('\n')

const HINTS = [
  'Identify which operation is "in the way" of the required variable, and apply the inverse operation to both sides.',
  'If the variable is in the denominator, first multiply both sides by the denominator to remove it from there.',
]
const INPUT_HINT = 'Enter an expression in terms of the known letters'

const VARIANTS1: readonly (readonly [string, string, string])[] = [
  ['v', 's', 't'],
  ['p', 'F', 'A'],
  ['d', 'm', 'V'],
]

function tier1(rng: Rng): Problem {
  const [lhs, num, den] = rng.pick(VARIANTS1)
  return {
    statement: `Given $${lhs} = \\dfrac{${num}}{${den}}$, solve for $${den}$.`,
    answer: { kind: 'expression', value: `\\frac{${num}}{${lhs}}`, variables: [num, lhs] },
    solution: [
      { text: `Multiply both sides by $${den}$:`, tex: `${lhs}${den} = ${num}` },
      { text: `Divide both sides by $${lhs}$:`, tex: `${den} = \\frac{${num}}{${lhs}}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const solveForB = rng.chance(0.5)
  const known = solveForB ? 'a' : 'b'
  const target = solveForB ? 'b' : 'a'
  const value = `\\frac{${known}f}{${known}-f}`
  return {
    statement: `The thin-lens equation is $\\dfrac{1}{f} = \\dfrac{1}{a} + \\dfrac{1}{b}$. Solve for $${target}$ in terms of $${known}$ and $f$.`,
    answer: { kind: 'expression', value, variables: [known, 'f'], domain: { [known]: [2, 4], f: [0.3, 0.8] } },
    solution: [
      { text: `Move $\\frac{1}{${known}}$ to the other side:`, tex: `\\frac{1}{${target}} = \\frac{1}{f} - \\frac{1}{${known}}` },
      { text: 'Bring to a common denominator:', tex: `\\frac{1}{${target}} = \\frac{${known}-f}{f\\cdot ${known}}` },
      { text: 'Take the reciprocal of both sides:', tex: `${target} = \\frac{f\\cdot ${known}}{${known}-f} = \\frac{${known}f}{${known}-f}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function celsiusBranch(): Problem {
  return {
    statement: 'The formula $C = \\dfrac{5(F-32)}{9}$ converts Fahrenheit to Celsius. Solve for $F$.',
    answer: { kind: 'expression', value: '\\frac{9C}{5}+32', variables: ['C'] },
    solution: [
      { text: 'Multiply both sides by $9$:', tex: '9C = 5(F-32)' },
      { text: 'Divide both sides by $5$:', tex: '\\frac{9C}{5} = F-32' },
      { text: 'Add $32$ to both sides:', tex: 'F = \\frac{9C}{5}+32' },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function interestBranch(): Problem {
  return {
    statement: 'Simple interest is $A = P(1+rt)$. Solve for $r$.',
    answer: { kind: 'expression', value: '\\frac{A-P}{Pt}', variables: ['A', 'P', 't'], domain: { A: [3, 6], P: [1.5, 2.5], t: [0.5, 2.5] } },
    solution: [
      { text: 'Expand the parentheses:', tex: 'A = P + Prt' },
      { text: 'Move $P$ to the other side:', tex: 'A - P = Prt' },
      { text: 'Divide both sides by $Pt$:', tex: 'r = \\frac{A-P}{Pt}' },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? celsiusBranch() : interestBranch()
}

export const template: SkillTemplate = {
  skillId: 'rearrange',
  theory,
  expectedSeconds: { 1: 45, 2: 100, 3: 130 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
