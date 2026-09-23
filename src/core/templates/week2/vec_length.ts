import { paren } from '../../math/latex'
import { isZero, norm, normSquared, tupleLatex, vecLatex, type Vec } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'The length (magnitude) of a vector is the square root of the sum of the squares of its components: $|\\vec a|=\\sqrt{a_1^2+a_2^2}$ in the plane, $|\\vec a|=\\sqrt{a_1^2+a_2^2+a_3^2}$ in space.',
  'The length is always a non-negative number. If the sum under the root is not a perfect square, leave the root in simplified form, e.g. $\\sqrt{28}=2\\sqrt{7}$.',
  'A unit vector is a vector of length exactly $1$ pointing in the same direction: $\\hat a=\\dfrac{1}{|\\vec a|}\\vec a$.',
  'Only a nonzero vector has a direction, so only a nonzero vector has a unit vector.',
  'Common mistakes: forgetting to square every component before adding; dropping a minus sign when squaring a negative component; dividing by $|\\vec a|^2$ instead of $|\\vec a|$ when finding a unit vector.',
].join('\n')

const HINTS_LENGTH = [
  'The length of a vector is the square root of the sum of the squares of its components.',
  'Square every component (a negative number squared is positive), add the squares, then take the square root.',
]
const HINTS_UNIT = [
  'A unit vector points in the same direction as $\\vec a$ but has length exactly $1$.',
  'First find $|\\vec a|$, then divide every component of $\\vec a$ by that length. Keep the result as an exact fraction, not a decimal.',
]
const INPUT_HINT_NUMBER = 'A whole number, or a root such as sqrt(29) or 2sqrt(7) when it is not whole'
const INPUT_HINT_VECTOR = 'One fraction per component, e.g. 3/5'

const TRIPLES: readonly (readonly [number, number, number])[] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
]

function simplifySqrt(n: number): { readonly coef: number; readonly radicand: number } {
  let coef = 1
  let radicand = n
  for (let k = Math.floor(Math.sqrt(radicand)); k >= 2; k -= 1) {
    if (radicand % (k * k) === 0) {
      coef = k
      radicand = radicand / (k * k)
      break
    }
  }
  return { coef, radicand }
}

function sqrtLatex(n: number): string {
  const { coef, radicand } = simplifySqrt(n)
  if (radicand === 1) return String(coef)
  return coef === 1 ? `\\sqrt{${radicand}}` : `${coef}\\sqrt{${radicand}}`
}

function fracLatex(num: number, den: number): string {
  const sign = num < 0 ? '-' : ''
  return `${sign}\\frac{${Math.abs(num)}}{${den}}`
}

const asColumn = (v: Vec): string => vecLatex(v.map(String))

/** The 2D vector for tier 1 (and reused by tier 3): whole-number length, built from a Pythagorean triple. */
export function buildTier1Vector(rng: Rng): Vec {
  const [p, q] = rng.pick(TRIPLES)
  const [legX, legY] = rng.chance(0.5) ? [p, q] : [q, p]
  const sx = rng.chance(0.5) ? 1 : -1
  const sy = rng.chance(0.5) ? 1 : -1
  return [sx * legX, sy * legY]
}

/** The 3D vector for tier 2; its length may or may not be a whole number. */
export function buildTier2Vector(rng: Rng): Vec {
  let v: number[] = [0, 0, 0]
  for (let i = 0; i < 200; i += 1) {
    v = [rng.int(-6, 6), rng.int(-6, 6), rng.int(-6, 6)]
    if (!isZero(v)) break
  }
  return v
}

function tier1(rng: Rng): Problem {
  const a = buildTier1Vector(rng)
  const c = Math.round(norm(a))
  const solution: SolutionStep[] = [
    {
      text: 'Square each component and add them:',
      tex: `|\\vec{a}|^2 = ${paren(a[0])}^2 + ${paren(a[1])}^2 = ${a[0] ** 2} + ${a[1] ** 2} = ${c * c}`,
    },
    { text: 'Take the square root:', tex: `|\\vec{a}| = \\sqrt{${c * c}} = ${c}` },
  ]
  return {
    statement: `Find the length of the vector $\\vec{a}=${tupleLatex(a)}$.`,
    answer: { kind: 'number', value: String(c) },
    solution,
    hints: HINTS_LENGTH,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function tier2(rng: Rng): Problem {
  const a = buildTier2Vector(rng)
  const sumSq = normSquared(a)
  const value = sqrtLatex(sumSq)
  const solution: SolutionStep[] = [
    {
      text: 'Square each component and add them:',
      tex: `|\\vec{a}|^2 = ${paren(a[0])}^2 + ${paren(a[1])}^2 + ${paren(a[2])}^2 = ${a[0] ** 2} + ${a[1] ** 2} + ${a[2] ** 2} = ${sumSq}`,
    },
    { text: 'Take the square root:', tex: `|\\vec{a}| = \\sqrt{${sumSq}} = ${value}` },
  ]
  return {
    statement: `Find the length of the vector $\\vec{a}=${tupleLatex(a)}$.`,
    answer: { kind: 'number', value },
    solution,
    hints: HINTS_LENGTH,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function tier3(rng: Rng): Problem {
  const a = buildTier1Vector(rng)
  const c = Math.round(norm(a))
  const components = a.map((v) => fracLatex(v, c))
  const solution: SolutionStep[] = [
    {
      text: 'Find the length of $\\vec a$ first:',
      tex: `|\\vec{a}| = \\sqrt{${paren(a[0])}^2 + ${paren(a[1])}^2} = \\sqrt{${c * c}} = ${c}`,
    },
    {
      text: 'Divide every component of $\\vec a$ by its length:',
      tex: `\\hat{a} = \\dfrac{1}{${c}}${asColumn(a)} = ${vecLatex(components)}`,
    },
  ]
  return {
    statement: `Find the unit vector in the direction of $\\vec{a}=${tupleLatex(a)}$.`,
    answer: { kind: 'vector', components },
    solution,
    hints: HINTS_UNIT,
    inputHint: INPUT_HINT_VECTOR,
  }
}

export const template: SkillTemplate = {
  skillId: 'vec_length',
  theory,
  expectedSeconds: { 1: 40, 2: 70, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
