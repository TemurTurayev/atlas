import { rat } from '../../math/rational'
import type { Rational } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'A radian is the angle subtended by an arc whose length equals the radius. Full circle: $360^\\circ=2\\pi$ rad.',
  'Converting degrees to radians: $\\text{rad}=\\text{deg}\\cdot\\frac{\\pi}{180}$. The reverse conversion: $\\text{deg}=\\text{rad}\\cdot\\frac{180}{\\pi}$.',
  'Arc length: $s=r\\theta$. Sector area: $S=\\frac{1}{2}r^2\\theta$, where $\\theta$ is in radians.',
  'Unless told to round, leave $\\pi$ exact — do not replace it with 3.14.',
  'Common mistake: plugging an angle in degrees into $s=r\\theta$ or $S=\\frac{1}{2}r^2\\theta$ without converting to radians.',
].join('\n')

const NICE_DEGREES: readonly number[] = [30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]

function piFractionLatex(frac: Rational): string {
  const { n: p, d: q } = frac
  if (p === 0) return '0'
  if (q === 1) return p === 1 ? '\\pi' : `${p}\\pi`
  return p === 1 ? `\\frac{\\pi}{${q}}` : `\\frac{${p}\\pi}{${q}}`
}

const HINTS_DEG_TO_RAD = [
  'Use the formula: rad $=$ deg $\\cdot\\frac{\\pi}{180}$.',
  'Reduce the fraction $\\frac{\\text{deg}}{180}$ to lowest terms, then attach $\\pi$.',
]
const HINTS_RAD_TO_DEG = [
  'Use the formula: deg $=$ rad $\\cdot\\frac{180}{\\pi}$.',
  'Divide the value by $\\pi$ to get its coefficient, then multiply that number by 180.',
]

function tier1(rng: Rng): Problem {
  const deg = rng.pick(NICE_DEGREES)
  const theta = rat(deg, 180)
  const value = piFractionLatex(theta)
  return {
    statement: `Convert $${deg}^\\circ$ to radians. Leave $\\pi$ exact.`,
    answer: { kind: 'number', value },
    solution: [
      { text: 'Multiply by $\\frac{\\pi}{180}$:', tex: `${deg}^\\circ = ${deg}\\cdot\\frac{\\pi}{180} = \\frac{${deg}\\pi}{180}` },
      { text: 'Simplify the fraction:', tex: `\\frac{${deg}\\pi}{180} = ${value}` },
    ],
    hints: HINTS_DEG_TO_RAD,
    inputHint: 'The answer contains π, e.g. 3\\pi/4',
  }
}

function tier2(rng: Rng): Problem {
  const deg = rng.pick(NICE_DEGREES)
  const theta = rat(deg, 180)
  const rad = piFractionLatex(theta)
  return {
    statement: `Convert $${rad}$ radians to degrees.`,
    answer: { kind: 'number', value: String(deg) },
    solution: [{ text: 'Multiply by $\\frac{180}{\\pi}$:', tex: `${rad}\\cdot\\frac{180}{\\pi} = ${deg}^\\circ` }],
    hints: HINTS_RAD_TO_DEG,
    inputHint: 'The answer is in degrees, e.g. 150',
  }
}

function tier3(rng: Rng): Problem {
  const deg = rng.pick(NICE_DEGREES)
  const theta = rat(deg, 180)
  const thetaLatex = piFractionLatex(theta)
  const r = rng.int(2, 9)
  if (rng.chance(0.5)) {
    const arc = rat(r * theta.n, theta.d)
    const value = piFractionLatex(arc)
    return {
      statement: `A sector has radius $${r}$ and central angle $${thetaLatex}$ rad. Find the arc length. Leave $\\pi$ exact.`,
      answer: { kind: 'number', value },
      solution: [{ text: 'Arc length:', tex: `s = r\\theta = ${r}\\cdot ${thetaLatex} = ${value}` }],
      hints: ['Arc length formula: $s=r\\theta$, with the angle in radians.', 'Multiply the radius by the angle without converting $\\pi$ to a decimal.'],
      inputHint: 'The answer contains π, e.g. 3\\pi',
    }
  }
  const area = rat(r * r * theta.n, 2 * theta.d)
  const value = piFractionLatex(area)
  return {
    statement: `A sector has radius $${r}$ and central angle $${thetaLatex}$ rad. Find the area of the sector. Leave $\\pi$ exact.`,
    answer: { kind: 'number', value },
    solution: [{ text: 'Sector area:', tex: `S = \\frac{1}{2}r^2\\theta = \\frac{1}{2}\\cdot ${r}^2\\cdot ${thetaLatex} = ${value}` }],
    hints: ['Sector area formula: $S=\\frac{1}{2}r^2\\theta$, with the angle in radians.', 'First square the radius, then multiply by the angle and by $\\frac{1}{2}$.'],
    inputHint: 'The answer contains π, e.g. 6\\pi',
  }
}

export const template: SkillTemplate = {
  skillId: 'radians',
  theory,
  expectedSeconds: { 1: 35, 2: 55, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
