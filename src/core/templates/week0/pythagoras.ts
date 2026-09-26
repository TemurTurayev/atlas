import { paren } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Pythagorean theorem: in a right triangle $a^2+b^2=c^2$, where $c$ is the hypotenuse and $a$ and $b$ are the legs.',
  'To find a leg when the hypotenuse is known: $b=\\sqrt{c^2-a^2}$.',
  'In space, the diagonal of a rectangular box: $d=\\sqrt{p^2+q^2+r^2}$.',
  'Distance between points in the plane: $d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}$.',
  'Leave the root in simplified form: $\\sqrt{50}=5\\sqrt{2}$.',
  'Common mistake: mixing up the hypotenuse and a leg when subtracting squares.',
].join('\n')

const HINTS = [
  'Recall the Pythagorean theorem: $a^2+b^2=c^2$.',
  'Determine what is given — the hypotenuse or a leg — and substitute into the right formula.',
  'If the number under the root is not a perfect square, factor out the largest square factor: $\\sqrt{50}=\\sqrt{25\\cdot2}=5\\sqrt{2}$.',
]
const INPUT_HINT = 'Write an irrational answer with a root: press the √ button, e.g. 5√2'

const TRIPLES: readonly (readonly [number, number, number])[] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
  [9, 40, 41],
  [12, 35, 37],
  [11, 60, 61],
  [16, 30, 34],
  [13, 84, 85],
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

function build(statement: string, value: string, solution: Problem['solution']): Problem {
  return { statement, answer: { kind: 'number', value }, solution, hints: HINTS, inputHint: INPUT_HINT }
}

function tier1(rng: Rng): Problem {
  const triple = rng.pick(TRIPLES)
  const swapLegs = rng.chance(0.5)
  const leg1 = swapLegs ? triple[1] : triple[0]
  const leg2 = swapLegs ? triple[0] : triple[1]
  const hyp = triple[2]
  const k = rng.int(1, 5)
  const a = leg1 * k
  const b = leg2 * k
  const c = hyp * k
  return build(
    `A right triangle has legs $${a}$ and $${b}$. Find the length of the hypotenuse.`,
    String(c),
    [
      { text: 'By the Pythagorean theorem:', tex: `c^2 = ${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${a * a + b * b}` },
      { text: 'Take the square root:', tex: `c = \\sqrt{${a * a + b * b}} = ${c}` },
    ],
  )
}

function tier2(rng: Rng): Problem {
  let c = 0
  let a = 0
  let diff = 0
  for (let i = 0; i < 200; i += 1) {
    c = rng.int(7, 25)
    a = rng.int(2, c - 2)
    diff = c * c - a * a
    if (!Number.isInteger(Math.sqrt(diff))) break
  }
  const value = sqrtLatex(diff)
  return build(
    `A right triangle has hypotenuse $${c}$ and one leg $${a}$. Find the length of the other leg.`,
    value,
    [
      { text: 'By the Pythagorean theorem:', tex: `b^2 = c^2 - a^2 = ${c}^2 - ${a}^2 = ${c * c} - ${a * a} = ${diff}` },
      { text: 'Take the square root:', tex: `b = \\sqrt{${diff}} = ${value}` },
    ],
  )
}

function boxDiagonal(rng: Rng): Problem {
  const p = rng.int(2, 12)
  const q = rng.int(2, 12)
  const r = rng.int(2, 12)
  const sq = p * p + q * q + r * r
  const value = sqrtLatex(sq)
  return build(
    `A rectangular box has edge lengths $${p}$, $${q}$ and $${r}$. Find the length of its space diagonal.`,
    value,
    [
      { text: 'Space diagonal of the box:', tex: `d^2 = ${p}^2+${q}^2+${r}^2 = ${sq}` },
      { text: 'Take the square root:', tex: `d = \\sqrt{${sq}} = ${value}` },
    ],
  )
}

function pointDistance(rng: Rng): Problem {
  let x1 = 0
  let y1 = 0
  let x2 = 0
  let y2 = 0
  let sq = 0
  for (let i = 0; i < 200; i += 1) {
    x1 = rng.int(-10, 10)
    y1 = rng.int(-10, 10)
    x2 = rng.int(-10, 10)
    y2 = rng.int(-10, 10)
    sq = (x2 - x1) ** 2 + (y2 - y1) ** 2
    if (sq > 0) break
  }
  const value = sqrtLatex(sq)
  return build(
    `Find the distance between the points $(${x1}, ${y1})$ and $(${x2}, ${y2})$.`,
    value,
    [
      { text: 'Distance formula between two points:', tex: `d^2 = (${x2}-${paren(x1)})^2+(${y2}-${paren(y1)})^2 = ${sq}` },
      { text: 'Take the square root:', tex: `d = \\sqrt{${sq}} = ${value}` },
    ],
  )
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? boxDiagonal(rng) : pointDistance(rng)
}

export const template: SkillTemplate = {
  skillId: 'pythagoras',
  theory,
  expectedSeconds: { 1: 40, 2: 90, 3: 160 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
