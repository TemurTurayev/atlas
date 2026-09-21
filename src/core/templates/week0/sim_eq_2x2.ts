import { coefPrefix, joinTerms } from '../../math/latex'
import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'A system of two linear equations in two unknowns $x$ and $y$.',
  'Substitution method: express one variable in terms of the other and substitute into the second equation.',
  'Elimination method: multiply the equations so that the coefficients of one variable become opposite, then add them.',
  'The answer is the unique pair $(x, y)$ that satisfies both equations at once.',
  'Common mistake: multiplying only one term of an equation by the factor instead of both sides in full.',
].join('\n')

const HINTS = [
  'Express $y$ in terms of $x$ (or vice versa) from one equation and substitute it into the other.',
  'Or multiply the equations so that the coefficients of $x$ (or of $y$) become opposite, then add the equations.',
]
const INPUT_HINT = 'The answer is a pair (x, y), e.g. (2,3)'

function eqLatex(a: number, b: number, c: number): string {
  const termX = a === 0 ? '' : `${coefPrefix(a)}x`
  const termY = b === 0 ? '' : `${coefPrefix(b)}y`
  return `${joinTerms([termX, termY])} = ${c}`
}

/** Picks (a2, b2) so the system a1x+b1y=…, a2x+b2y=… has a unique solution. */
function pickIndependent(rng: Rng, aOpts: readonly number[], bOpts: readonly number[], a1: number, b1: number): [number, number] {
  for (let i = 0; i < 50; i += 1) {
    const a2 = rng.pick(aOpts)
    const b2 = rng.pick(bOpts)
    if (a1 * b2 - a2 * b1 !== 0) return [a2, b2]
  }
  throw new Error('sim_eq_2x2: could not find an independent second equation')
}

function buildSystem(a1: number, b1: number, c1: number, a2: number, b2: number, c2: number): Problem {
  const eq1 = eqLatex(a1, b1, c1)
  const eq2 = eqLatex(a2, b2, c2)
  const det = a1 * b2 - a2 * b1
  const xNum = c1 * b2 - c2 * b1
  const yNum = a1 * c2 - a2 * c1
  const x = rat(xNum, det)
  const y = rat(yNum, det)
  const xLatex = ratToLatex(x)
  const yLatex = ratToLatex(y)
  return {
    statement: `Solve the system: $${eq1}$, $${eq2}$`,
    answer: { kind: 'finiteSet', elements: [`(${xLatex},${yLatex})`] },
    solution: [
      {
        text: `Multiply the first equation by $${b2}$ and the second by $${b1}$, so that the coefficients of $y$ match:`,
        tex: `${a1 * b2}x+${b1 * b2}y=${c1 * b2}, \\quad ${a2 * b1}x+${b1 * b2}y=${c2 * b1}`,
      },
      { text: 'Subtract the second equation from the first — $y$ cancels:', tex: `${det}x = ${xNum} \\Rightarrow x = ${xLatex}` },
      { text: 'Substitute the found $x$ into either equation and solve for $y$:', tex: `y = ${yLatex}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
    ...(b1 !== 0
      ? {
          alternative: {
            title: 'Alternative method: substitution',
            steps: [
              { text: 'Express $y$ from the first equation:', tex: `y = \\frac{${c1} ${a1 < 0 ? '+' : '-'} ${Math.abs(a1)}x}{${b1}}` },
              {
                text: 'Substitute this expression into the second equation:',
                tex: `${coefPrefix(a2)}x + ${coefPrefix(b2)}\\cdot\\frac{${c1} ${a1 < 0 ? '+' : '-'} ${Math.abs(a1)}x}{${b1}} = ${c2}`,
              },
              { text: `Multiply both sides by $${b1}$ and collect like terms:`, tex: `${det}x = ${xNum} \\Rightarrow x = ${xLatex}` },
              { text: 'Substitute the found $x$ back into the expression for $y$:', tex: `y = ${yLatex}` },
            ],
          },
        }
      : {}),
  }
}

function tier1(rng: Rng): Problem {
  const a1 = rng.pick([1, 2])
  const b1 = rng.pick([1, -1])
  const [a2, b2] = pickIndependent(rng, [1, 2, 3], [1, -1, 2, -2], a1, b1)
  const x0 = rng.int(-6, 6)
  const y0 = rng.int(-6, 6)
  return buildSystem(a1, b1, a1 * x0 + b1 * y0, a2, b2, a2 * x0 + b2 * y0)
}

function tier2(rng: Rng): Problem {
  const aOpts = [1, 2, 3, 4, 5]
  const bOpts = [1, -1, 2, -2, 3, -3]
  const a1 = rng.pick(aOpts)
  const b1 = rng.pick(bOpts)
  const [a2, b2] = pickIndependent(rng, aOpts, bOpts, a1, b1)
  const x0 = rng.intExcept(-8, 8, [0])
  const y0 = rng.intExcept(-8, 8, [0])
  return buildSystem(a1, b1, a1 * x0 + b1 * y0, a2, b2, a2 * x0 + b2 * y0)
}

function tier3(rng: Rng): Problem {
  const a1 = rng.pick([2, 3])
  const b1 = rng.pick([2, 3, -2, -3])
  const [a2, b2] = pickIndependent(rng, [2, 3, 4, 5], [2, 3, -2, -3], a1, b1)
  const c1 = rng.intExcept(-10, 10, [0])
  const c2 = rng.intExcept(-10, 10, [0])
  return buildSystem(a1, b1, c1, a2, b2, c2)
}

export const template: SkillTemplate = {
  skillId: 'sim_eq_2x2',
  theory,
  expectedSeconds: { 1: 60, 2: 110, 3: 170 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
