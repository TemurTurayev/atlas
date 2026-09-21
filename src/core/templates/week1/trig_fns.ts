import { add, rat, sub, toNumber, type Rational } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Unit circle: for angle $\\theta$, the point on the circle is $(\\cos\\theta, \\sin\\theta)$; $\\tan\\theta=\\frac{\\sin\\theta}{\\cos\\theta}$.',
  'Exact values for reference angles: $\\sin\\frac{\\pi}{6}=\\frac12$, $\\sin\\frac{\\pi}{4}=\\frac{\\sqrt2}{2}$, $\\sin\\frac{\\pi}{3}=\\frac{\\sqrt3}{2}$; the cosine values are the same list in reverse order.',
  'Double-angle identities: $\\sin2\\alpha=2\\sin\\alpha\\cos\\alpha$; $\\cos2\\alpha=2\\cos^{2}\\alpha-1=1-2\\sin^{2}\\alpha$.',
  'When solving $\\sin x=k$ or $\\cos x=k$ on $[0,2\\pi)$, first find the reference angle, then determine in which quadrants the function has the required sign.',
  'Common mistake: finding only one root of the equation and forgetting the second one, symmetric to it in the neighboring quadrant.',
].join('\n')

interface AngleEntry {
  readonly num: number
  readonly den: number
  readonly sin: string
  readonly cos: string
  readonly tan: string | null
}

const ANGLES: readonly AngleEntry[] = [
  { num: 0, den: 1, sin: '0', cos: '1', tan: '0' },
  { num: 1, den: 6, sin: '\\frac{1}{2}', cos: '\\frac{\\sqrt{3}}{2}', tan: '\\frac{\\sqrt{3}}{3}' },
  { num: 1, den: 4, sin: '\\frac{\\sqrt{2}}{2}', cos: '\\frac{\\sqrt{2}}{2}', tan: '1' },
  { num: 1, den: 3, sin: '\\frac{\\sqrt{3}}{2}', cos: '\\frac{1}{2}', tan: '\\sqrt{3}' },
  { num: 1, den: 2, sin: '1', cos: '0', tan: null },
  { num: 2, den: 3, sin: '\\frac{\\sqrt{3}}{2}', cos: '-\\frac{1}{2}', tan: '-\\sqrt{3}' },
  { num: 3, den: 4, sin: '\\frac{\\sqrt{2}}{2}', cos: '-\\frac{\\sqrt{2}}{2}', tan: '-1' },
  { num: 5, den: 6, sin: '\\frac{1}{2}', cos: '-\\frac{\\sqrt{3}}{2}', tan: '-\\frac{\\sqrt{3}}{3}' },
  { num: 1, den: 1, sin: '0', cos: '-1', tan: '0' },
  { num: 7, den: 6, sin: '-\\frac{1}{2}', cos: '-\\frac{\\sqrt{3}}{2}', tan: '\\frac{\\sqrt{3}}{3}' },
  { num: 5, den: 4, sin: '-\\frac{\\sqrt{2}}{2}', cos: '-\\frac{\\sqrt{2}}{2}', tan: '1' },
  { num: 4, den: 3, sin: '-\\frac{\\sqrt{3}}{2}', cos: '-\\frac{1}{2}', tan: '\\sqrt{3}' },
  { num: 3, den: 2, sin: '-1', cos: '0', tan: null },
  { num: 5, den: 3, sin: '-\\frac{\\sqrt{3}}{2}', cos: '\\frac{1}{2}', tan: '-\\sqrt{3}' },
  { num: 7, den: 4, sin: '-\\frac{\\sqrt{2}}{2}', cos: '\\frac{\\sqrt{2}}{2}', tan: '-1' },
  { num: 11, den: 6, sin: '-\\frac{1}{2}', cos: '\\frac{\\sqrt{3}}{2}', tan: '-\\frac{\\sqrt{3}}{3}' },
]

function piLatex(f: Rational): string {
  if (f.n === 0) return '0'
  if (f.d === 1) return f.n === 1 ? '\\pi' : `${f.n}\\pi`
  return f.n === 1 ? `\\frac{\\pi}{${f.d}}` : `\\frac{${f.n}\\pi}{${f.d}}`
}

const findAngle = (frac: Rational): AngleEntry => {
  const found = ANGLES.find((a) => a.num === frac.n && a.den === frac.d)
  if (!found) throw new Error(`No table entry for ${frac.n}/${frac.d}`)
  return found
}

type Fn = 'sin' | 'cos' | 'tan'

function tier1(rng: Rng): Problem {
  const fn = rng.pick<Fn>(['sin', 'cos', 'tan'])
  const candidates = fn === 'tan' ? ANGLES.filter((a) => a.tan !== null) : ANGLES
  const entry = rng.pick(candidates)
  const angleLatex = piLatex(rat(entry.num, entry.den))
  const value = entry[fn] as string
  const expr = `\\${fn}\\left(${angleLatex}\\right)`
  return {
    statement: `Find the exact value of $${expr}$.`,
    answer: { kind: 'number', value },
    solution: [{ text: 'Exact value from the unit circle table:', tex: `${expr} = ${value}` }],
    hints: [
      'Recall the table of exact values on the unit circle for standard angles.',
      'Determine the quadrant of the angle — it determines the sign of the value.',
    ],
    inputHint: 'If the answer is irrational, write it with a radical: sqrt(3)/2 (not as a decimal)',
  }
}

const REF_ALPHAS: readonly Rational[] = [rat(1, 6), rat(1, 4), rat(1, 3)]

const EXACT_VALUE: Readonly<Record<Fn, Readonly<Record<number, string>>>> = {
  sin: { 6: '\\frac{1}{2}', 4: '\\frac{\\sqrt{2}}{2}', 3: '\\frac{\\sqrt{3}}{2}' },
  cos: { 6: '\\frac{\\sqrt{3}}{2}', 4: '\\frac{\\sqrt{2}}{2}', 3: '\\frac{1}{2}' },
  tan: { 6: '\\frac{\\sqrt{3}}{3}', 4: '1', 3: '\\sqrt{3}' },
}

const QUADRANT_TEXT: Readonly<Record<Fn, Readonly<Record<'pos' | 'neg', string>>>> = {
  sin: { pos: 'sine is positive in quadrants I and II', neg: 'sine is negative in quadrants III and IV' },
  cos: { pos: 'cosine is positive in quadrants I and IV', neg: 'cosine is negative in quadrants II and III' },
  tan: { pos: 'tangent is positive in quadrants I and III', neg: 'tangent is negative in quadrants II and IV' },
}

function equationSolutions(fn: Fn, alpha: Rational, positive: boolean): readonly [Rational, Rational] {
  const one = rat(1, 1)
  const two = rat(2, 1)
  if (fn === 'sin') return positive ? [alpha, sub(one, alpha)] : [add(one, alpha), sub(two, alpha)]
  if (fn === 'cos') return positive ? [alpha, sub(two, alpha)] : [sub(one, alpha), add(one, alpha)]
  return positive ? [alpha, add(one, alpha)] : [sub(one, alpha), sub(two, alpha)]
}

function tier2(rng: Rng): Problem {
  const fn = rng.pick<Fn>(['sin', 'cos', 'tan'])
  const alpha = rng.pick(REF_ALPHAS)
  const positive = rng.chance(0.5)
  const kValue = EXACT_VALUE[fn][alpha.d]
  const kLatex = positive ? kValue : `-${kValue}`
  const [s1, s2] = equationSolutions(fn, alpha, positive)
  const sorted = toNumber(s1) <= toNumber(s2) ? [s1, s2] : [s2, s1]
  const values = sorted.map(piLatex)
  return {
    statement: `Solve $\\${fn} x = ${kLatex}$ for $x \\in [0, 2\\pi)$.`,
    answer: { kind: 'numberSet', values },
    solution: [
      { text: 'Reference angle: the first-quadrant angle with the same absolute value of the function:', tex: `${piLatex(alpha)}` },
      { text: `${QUADRANT_TEXT[fn][positive ? 'pos' : 'neg']}.` },
      { text: 'Solutions on $[0,2\\pi)$:', tex: `x = ${values[0]}, \\ x = ${values[1]}` },
    ],
    hints: [
      'Find the reference angle — the angle in the first quadrant with the same absolute value of the function.',
      'Determine in which quadrants the function has the required sign, and build the solutions from the reference angle.',
    ],
    inputHint: 'List both solutions separated by a comma, e.g. pi/6, 5pi/6',
  }
}

const DOUBLE_ALPHAS: readonly Rational[] = [rat(1, 6), rat(1, 4), rat(1, 3), rat(2, 3), rat(3, 4), rat(5, 6)]

function doubleSin(rng: Rng): Problem {
  const alpha = rng.pick(DOUBLE_ALPHAS)
  const a = piLatex(alpha)
  const doubled = findAngle(add(alpha, alpha))
  const doubledLatex = piLatex(rat(doubled.num, doubled.den))
  const expr = `2\\sin\\left(${a}\\right)\\cos\\left(${a}\\right)`
  return {
    statement: `Simplify using a double-angle identity and give the exact value: $${expr}$.`,
    answer: { kind: 'number', value: doubled.sin },
    solution: [
      { text: 'Apply the double-angle formula for sine:', tex: `${expr} = \\sin\\left(2\\cdot ${a}\\right) = \\sin\\left(${doubledLatex}\\right)` },
      { text: 'Look up the exact value in the table:', tex: `\\sin\\left(${doubledLatex}\\right) = ${doubled.sin}` },
    ],
    hints: [
      'Recall the formula: $2\\sin\\alpha\\cos\\alpha=\\sin2\\alpha$.',
      'First compute the doubled angle, then find its exact value in the table.',
    ],
    inputHint: 'If the answer is irrational, write it with a radical, e.g. sqrt(3)/2',
  }
}

function doubleCos(rng: Rng): Problem {
  const alpha = rng.pick(DOUBLE_ALPHAS)
  const a = piLatex(alpha)
  const doubled = findAngle(add(alpha, alpha))
  const doubledLatex = piLatex(rat(doubled.num, doubled.den))
  const entry = findAngle(alpha)
  const useCosForm = rng.chance(0.5)
  const expr = useCosForm ? `2\\cos^{2}\\left(${a}\\right) - 1` : `1 - 2\\sin^{2}\\left(${a}\\right)`
  const identityTex = useCosForm ? `2\\cos^{2}\\left(${a}\\right) - 1 = \\cos\\left(2\\cdot ${a}\\right)` : `1 - 2\\sin^{2}\\left(${a}\\right) = \\cos\\left(2\\cdot ${a}\\right)`
  return {
    statement: `Simplify using a double-angle identity and give the exact value: $${expr}$.`,
    answer: { kind: 'number', value: doubled.cos },
    solution: [
      { text: `Use $\\cos\\left(${a}\\right)=${entry.cos}$, $\\sin\\left(${a}\\right)=${entry.sin}$, and the double-angle formula for cosine:`, tex: identityTex },
      { text: 'Look up the exact value in the table:', tex: `\\cos\\left(${doubledLatex}\\right) = ${doubled.cos}` },
    ],
    hints: [
      'Recall the formula: $\\cos2\\alpha=2\\cos^{2}\\alpha-1=1-2\\sin^{2}\\alpha$.',
      'First compute the doubled angle, then find its exact value in the table.',
    ],
    inputHint: 'If the answer is irrational, write it with a radical, e.g. -1/2',
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? doubleSin(rng) : doubleCos(rng)
}

export const template: SkillTemplate = {
  skillId: 'trig_fns',
  theory,
  expectedSeconds: { 1: 30, 2: 90, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
