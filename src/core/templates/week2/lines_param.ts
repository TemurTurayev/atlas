import { joinTerms, paren } from '../../math/latex'
import { add, scale, tupleLatex, vecLatex, type Vec } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'A line through a point $\\vec p$ with direction $\\vec d$ is written parametrically as $\\vec r(t) = \\vec p + t\\vec d$, where $t$ ranges over all real numbers.',
  'The direction vector from point $A$ to point $B$ is $\\vec d = \\overrightarrow{AB} = B - A$; any nonzero scalar multiple of $\\vec d$ describes the same line.',
  'To find the point at a given $t$: scale $\\vec d$ by $t$, then add $\\vec p$.',
  'To find $t$ for a given point on the line: set one coordinate of $\\vec p + t\\vec d$ equal to that coordinate of the point and solve; the same $t$ must work in every coordinate.',
  'Common mistakes: subtracting the points in the wrong order when finding $\\vec d$; picking a coordinate where the direction component is zero and dividing by it.',
].join('\n')

const HINTS_DIRECTION = [
  'The direction vector of a line through two points is just the vector between them, the same idea as before — only now it defines the whole line.',
  'Subtract coordinate by coordinate: the second point minus the first, in the order asked for.',
]
const HINTS_POINT_AT_T = [
  'Plug the given value of $t$ into $\\vec r(t) = \\vec p + t\\vec d$: scale $\\vec d$ by $t$ first, then add $\\vec p$.',
  'Multiply every component of $\\vec d$ by $t$, then add the matching component of $\\vec p$.',
]
const HINTS_FIND_T = [
  'Set one coordinate of $\\vec p + t\\vec d$ equal to the matching coordinate of the given point, then solve for $t$.',
  'Use a coordinate where $\\vec d$ is nonzero: $t = \\dfrac{Q_i - p_i}{d_i}$. Every coordinate must give the same $t$.',
]

const INPUT_HINT_VECTOR = 'One number per component, top to bottom'
const INPUT_HINT_NUMBER = 'A single number'

const asColumn = (v: Vec): string => vecLatex(v.map(String))
const componentsOf = (v: Vec): string[] => v.map(String)

/** Random vector with independent integer components, allowed to be zero. */
const randomVec = (rng: Rng, size: number, lo: number, hi: number): number[] => Array.from({ length: size }, () => rng.int(lo, hi))

/** Random vector guaranteed not to be the zero vector. */
function randomNonzeroVec(rng: Rng, size: number, lo: number, hi: number): number[] {
  let v: number[]
  do {
    v = randomVec(rng, size, lo, hi)
  } while (v.every((x) => x === 0))
  return v
}

function vectorProblem(statement: string, value: Vec, solution: readonly SolutionStep[], hints: readonly string[]): Problem {
  return {
    statement,
    answer: { kind: 'vector', components: componentsOf(value) },
    solution,
    hints,
    inputHint: INPUT_HINT_VECTOR,
  }
}

function tier1(rng: Rng): Problem {
  const dim = rng.pick([2, 3])
  const A = randomVec(rng, dim, -6, 6)
  const d = randomNonzeroVec(rng, dim, -5, 5)
  const B = add(A, d)
  return vectorProblem(
    `Points $A${tupleLatex(A)}$ and $B${tupleLatex(B)}$ lie on a line. Find the direction vector $\\vec d = \\overrightarrow{AB} = B - A$ (from $A$ to $B$, in that order).`,
    d,
    [
      { text: 'The direction vector is the second point minus the first:', tex: '\\vec d = \\overrightarrow{AB} = B - A' },
      { text: 'Subtract coordinate by coordinate:', tex: d.map((v, i) => `${B[i]} - ${paren(A[i])} = ${v}`).join(' \\\\ ') },
      { text: 'So the direction vector is', tex: asColumn(d) },
    ],
    HINTS_DIRECTION,
  )
}

function tier2(rng: Rng): Problem {
  const dim = rng.pick([2, 3])
  const p = randomVec(rng, dim, -6, 6)
  const d = randomNonzeroVec(rng, dim, -5, 5)
  const t0 = rng.intExcept(-4, 4, [0])
  const point = add(p, scale(t0, d))
  return vectorProblem(
    `A line is given by $\\vec r(t) = \\vec p + t\\vec d$ with $\\vec p=${tupleLatex(p)}$ and $\\vec d=${tupleLatex(d)}$. Find the point on the line at $t=${t0}$.`,
    point,
    [
      { text: `Substitute $t=${t0}$ into the line equation:`, tex: `\\vec r(${t0}) = ${joinTerms(['\\vec p', `${t0}\\vec d`])}` },
      { text: `Scale the direction vector by ${t0}:`, tex: `${t0}\\vec d = ${asColumn(scale(t0, d))}` },
      { text: 'Add $\\vec p$, component by component:', tex: point.map((v, i) => `${p[i]} + ${paren(scale(t0, d)[i])} = ${v}`).join(' \\\\ ') },
      { text: 'So the point is', tex: asColumn(point) },
    ],
    HINTS_POINT_AT_T,
  )
}

function tier3(rng: Rng): Problem {
  const dim = rng.pick([2, 3])
  const p = randomVec(rng, dim, -6, 6)
  const d = randomNonzeroVec(rng, dim, -5, 5)
  const t0 = rng.intExcept(-5, 5, [0])
  const Q = add(p, scale(t0, d))
  const i = d.findIndex((x) => x !== 0)
  const coordName = dim === 2 ? (['x', 'y'] as const)[i] : (['x', 'y', 'z'] as const)[i]
  const checkIndex = d.findIndex((x, idx) => idx !== i && x !== 0)
  const solution: SolutionStep[] = [
    { text: `Write the ${coordName}-coordinate of a general point on the line:`, tex: `${coordName} = ${joinTerms([String(p[i]), `${d[i]}t`])}` },
    {
      text: `The point $Q${tupleLatex(Q)}$ lies on the line, so its ${coordName}-coordinate must match:`,
      tex: `${Q[i]} = ${joinTerms([String(p[i]), `${d[i]}t`])}`,
    },
    { text: 'Solve for $t$:', tex: `t = \\frac{${Q[i]} - ${paren(p[i])}}{${d[i]}} = ${t0}` },
  ]
  if (checkIndex >= 0) {
    const checkName = dim === 2 ? (['x', 'y'] as const)[checkIndex] : (['x', 'y', 'z'] as const)[checkIndex]
    solution.push({
      text: `Check with the ${checkName}-coordinate:`,
      tex: `${p[checkIndex]} + ${paren(d[checkIndex])}\\cdot${paren(t0)} = ${Q[checkIndex]}`,
    })
  }
  return {
    statement: `A line is given by $\\vec r(t) = \\vec p + t\\vec d$ with $\\vec p=${tupleLatex(p)}$ and $\\vec d=${tupleLatex(d)}$. The line passes through the point $Q${tupleLatex(Q)}$ for some value of $t$. Find $t$.`,
    answer: { kind: 'number', value: String(t0) },
    solution,
    hints: HINTS_FIND_T,
    inputHint: INPUT_HINT_NUMBER,
  }
}

export const template: SkillTemplate = {
  skillId: 'lines_param',
  theory,
  expectedSeconds: { 1: 45, 2: 55, 3: 95 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
