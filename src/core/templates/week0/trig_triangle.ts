import { joinTerms } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Right-triangle trigonometry: $\\sin\\theta=\\frac{\\text{opposite}}{\\text{hypotenuse}}$, $\\cos\\theta=\\frac{\\text{adjacent}}{\\text{hypotenuse}}$, $\\tan\\theta=\\frac{\\text{opposite}}{\\text{adjacent}}$.',
  'Exact values: $\\sin 30^\\circ=\\cos 60^\\circ=\\frac{1}{2}$; $\\sin 45^\\circ=\\cos 45^\\circ=\\frac{\\sqrt{2}}{2}$; $\\sin 60^\\circ=\\cos 30^\\circ=\\frac{\\sqrt{3}}{2}$.',
  'Tangent: $\\tan 30^\\circ=\\frac{1}{\\sqrt{3}}$, $\\tan 45^\\circ=1$, $\\tan 60^\\circ=\\sqrt{3}$.',
  'To find a leg, multiply the hypotenuse by the sine or cosine of the given angle; to find an angle, divide the opposite leg by the adjacent leg and compare with the table values of tangent.',
  'Common mistakes: mixing up the opposite and adjacent legs; forgetting that these angles are in degrees, not radians.',
].join('\n')

type Angle = 30 | 45 | 60
const ANGLES: readonly Angle[] = [30, 45, 60]

const SIN_ROOT: Readonly<Record<Angle, number>> = { 30: 1, 45: 2, 60: 3 }
const COS_ROOT: Readonly<Record<Angle, number>> = { 30: 3, 45: 2, 60: 1 }
const EXACT_LATEX: Readonly<Record<Angle, { readonly sin: string; readonly cos: string }>> = {
  30: { sin: '\\frac{1}{2}', cos: '\\frac{\\sqrt{3}}{2}' },
  45: { sin: '\\frac{\\sqrt{2}}{2}', cos: '\\frac{\\sqrt{2}}{2}' },
  60: { sin: '\\frac{\\sqrt{3}}{2}', cos: '\\frac{1}{2}' },
}

function sqrtCoefLatex(m: number, root: number): string {
  if (root === 1) return String(m)
  return m === 1 ? `\\sqrt{${root}}` : `${m}\\sqrt{${root}}`
}

function tier1(rng: Rng): Problem {
  const angle = rng.pick(ANGLES)
  const useSin = rng.chance(0.5)
  const root = useSin ? SIN_ROOT[angle] : COS_ROOT[angle]
  const m = rng.int(3, 9)
  const hyp = 2 * m
  const side = sqrtCoefLatex(m, root)
  const exact = EXACT_LATEX[angle][useSin ? 'sin' : 'cos']
  const whichPhrase = useSin ? 'opposite' : 'adjacent to'
  const letter = useSin ? 'a' : 'b'
  return {
    statement: `A right triangle has hypotenuse $${hyp}$ and an acute angle of $${angle}^\\circ$. Find the length of the side ${whichPhrase} this angle.`,
    answer: { kind: 'number', value: side },
    solution: [
      { text: `${useSin ? 'Sine' : 'Cosine'} of the angle:`, tex: `${useSin ? '\\sin' : '\\cos'} ${angle}^\\circ = ${exact}` },
      { text: 'The side equals the hypotenuse multiplied by this value:', tex: `${letter} = ${hyp}\\cdot ${exact} = ${side}` },
    ],
    hints: [
      'Recall the exact values of sine and cosine for 30°, 45°, 60°.',
      `${useSin ? 'Sine' : 'Cosine'} of the angle is the needed side divided by the hypotenuse; express the needed side.`,
    ],
    inputHint: 'If the answer is irrational, use the √ button, e.g. 5√3',
  }
}

function tier2(rng: Rng): Problem {
  const angle = rng.pick(ANGLES)
  const k = rng.int(2, 9)
  let adjacent: string
  let opposite: string
  if (angle === 45) {
    adjacent = String(k)
    opposite = String(k)
  } else if (angle === 60) {
    adjacent = String(k)
    opposite = sqrtCoefLatex(k, 3)
  } else {
    adjacent = sqrtCoefLatex(k, 3)
    opposite = String(k)
  }
  return {
    statement: `A right triangle has legs $${adjacent}$ (adjacent to angle $\\theta$) and $${opposite}$ (opposite angle $\\theta$). Find $\\theta$ in degrees.`,
    answer: { kind: 'number', value: String(angle) },
    solution: [
      { text: 'Tangent of the angle is the ratio of the opposite leg to the adjacent leg:', tex: `\\tan\\theta = \\frac{${opposite}}{${adjacent}}` },
      { text: 'This is the table value of tangent for the angle:', tex: `\\theta = ${angle}^\\circ` },
    ],
    hints: [
      '$\\tan\\theta = $ opposite $/$ adjacent.',
      'Compare the resulting ratio with the table values: $\\tan 30^\\circ=\\frac{1}{\\sqrt{3}}$, $\\tan 45^\\circ=1$, $\\tan 60^\\circ=\\sqrt{3}$.',
    ],
    inputHint: 'The answer is a number in degrees, e.g. 45',
  }
}

function ladderTree(rng: Rng): Problem {
  const angle = rng.pick(ANGLES)
  const m = rng.int(2, 6)
  let d: number
  let climb: string
  if (angle === 30) {
    d = 3 * m
    climb = sqrtCoefLatex(m, 3)
  } else if (angle === 60) {
    d = m
    climb = sqrtCoefLatex(m, 3)
  } else {
    d = m
    climb = String(m)
  }
  const eye = rng.int(1, 3)
  const total = angle === 45 ? String(eye + m) : joinTerms([String(eye), climb])
  return {
    statement: `A person whose eyes are $${eye}$ m above the ground stands $${d}$ m from a tree. The angle of elevation to the top of the tree is $${angle}^\\circ$. Find the height of the tree.`,
    answer: { kind: 'number', value: total },
    solution: [
      { text: 'Height from eye level to the top:', tex: `h_1 = ${d}\\cdot\\tan ${angle}^\\circ = ${climb}` },
      { text: 'Add the height up to eye level:', tex: `h = h_1 + ${eye} = ${total}` },
    ],
    hints: [
      'First find the height from eye level to the top: $h_1=d\\cdot\\tan\\theta$.',
      'Do not forget to add the height of the observer up to eye level.',
    ],
    inputHint: 'If the answer contains a radical, write it exactly with the √ button, e.g. 2+3√3',
  }
}

function rampAngle(rng: Rng): Problem {
  const angle = rng.pick(ANGLES)
  const k = rng.int(2, 6)
  let rise: string
  let run: string
  if (angle === 45) {
    rise = String(k)
    run = String(k)
  } else if (angle === 60) {
    rise = sqrtCoefLatex(k, 3)
    run = String(k)
  } else {
    rise = String(k)
    run = sqrtCoefLatex(k, 3)
  }
  return {
    statement: `A wheelchair ramp rises $${rise}$ m over a horizontal run of $${run}$ m. Find the angle the ramp makes with the ground, in degrees.`,
    answer: { kind: 'number', value: String(angle) },
    solution: [
      { text: 'Tangent of the angle of inclination:', tex: `\\tan\\theta = \\frac{${rise}}{${run}}` },
      { text: 'Compare with the table value:', tex: `\\theta = ${angle}^\\circ` },
    ],
    hints: [
      'The angle of inclination is found via tangent: rise divided by horizontal run.',
      'Compare the ratio with the table values $\\tan 30^\\circ, \\tan 45^\\circ, \\tan 60^\\circ$.',
    ],
    inputHint: 'The answer is a number in degrees, e.g. 60',
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? ladderTree(rng) : rampAngle(rng)
}

export const template: SkillTemplate = {
  skillId: 'trig_triangle',
  theory,
  expectedSeconds: { 1: 45, 2: 90, 3: 170 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
