import { paren } from '../../math/latex'
import { dot, isZero, tupleLatex, type Vec } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'The dot product combines matching components: $\\vec a\\cdot\\vec b=a_1b_1+a_2b_2$ in the plane, $a_1b_1+a_2b_2+a_3b_3$ in space.',
  'The result of a dot product is a single number (a scalar), never a vector.',
  'Two nonzero vectors are orthogonal (perpendicular) exactly when their dot product is zero: $\\vec a\\cdot\\vec b=0$.',
  'The dot product can come out negative, positive, or zero; its sign does not simply follow from the signs of the components.',
  'Common mistakes: adding components instead of multiplying them first; forgetting a component in space; assuming a zero dot product means one of the vectors is the zero vector.',
].join('\n')

const HINTS_DOT = [
  'The dot product multiplies matching components and adds the results: $\\vec a\\cdot\\vec b=a_1b_1+a_2b_2(+a_3b_3)$.',
  'Multiply each pair of matching components one at a time, keep track of the signs, then add everything together.',
]
const HINTS_ORTHOGONAL = [
  'Orthogonal means the dot product is zero: write $\\vec a\\cdot\\vec b=0$ and solve for the unknown component.',
  'Multiply each pair of matching components (leave the unknown as a letter), add them, set the sum equal to $0$, then isolate the unknown.',
]
const INPUT_HINT_NUMBER = 'A single number; it may be negative or zero'

function randomNonzeroVec(rng: Rng, size: number, lo = -6, hi = 6): number[] {
  let v: number[] = []
  for (let i = 0; i < 200; i += 1) {
    v = Array.from({ length: size }, () => rng.int(lo, hi))
    if (!isZero(v)) break
  }
  return v
}

/** The nonzero vector pair used in tiers 1 (size 2) and 2 (size 3). */
export function buildDotVectors(rng: Rng, size: number): { readonly a: Vec; readonly b: Vec } {
  return { a: randomNonzeroVec(rng, size), b: randomNonzeroVec(rng, size) }
}

/** Signed sum for display: [12, -8, 3] -> "12 - 8 + 3". */
function signedSumLatex(nums: readonly number[]): string {
  return nums.map((n, i) => (i === 0 ? String(n) : n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`)).join(' ')
}

function dotTier(rng: Rng, size: number): Problem {
  const { a, b } = buildDotVectors(rng, size)
  const products = a.map((x, i) => x * b[i])
  const value = dot(a, b)
  const terms = a.map((x, i) => `${paren(x)}\\cdot${paren(b[i])}`)
  const solution: SolutionStep[] = [
    {
      text: 'Multiply matching components, then add the results:',
      tex: `\\vec{a}\\cdot\\vec{b} = ${terms.join(' + ')} = ${signedSumLatex(products)} = ${value}`,
    },
  ]
  return {
    statement: `Given $\\vec{a}=${tupleLatex(a)}$ and $\\vec{b}=${tupleLatex(b)}$, compute $\\vec{a}\\cdot\\vec{b}$.`,
    answer: { kind: 'number', value: String(value) },
    solution,
    hints: HINTS_DOT,
    inputHint: INPUT_HINT_NUMBER,
  }
}

interface OrthogonalCase {
  readonly a: Vec
  readonly b: Vec
  readonly j: number
  readonly x: number
}

/**
 * Builds `a` orthogonal to `b`, with the component of `b` at index `j` singled out as the
 * unknown `x`. Constructed backwards from free parameters `c`, `m`, `x` with no division:
 * setting a[j] = -c*m and b[j] = m*x makes a[j]*x + a[i0]*b[i0] = -c*m*x + c*(m*x) = 0 exactly,
 * for any nonzero c, m, x. Any remaining index gets a free component in `a` and a `0` in `b`,
 * which contributes nothing to the dot product.
 */
export function buildOrthogonalCase(rng: Rng, size: number): OrthogonalCase {
  const indices = Array.from({ length: size }, (_, i) => i)
  const [j, i0, ...rest] = rng.shuffle(indices)
  const x = rng.intExcept(-8, 8, [0])
  const c = rng.intExcept(-6, 6, [0])
  const m = rng.intExcept(-4, 4, [0])
  const a: number[] = new Array(size).fill(0)
  const b: number[] = new Array(size).fill(0)
  a[j] = -c * m
  a[i0] = c
  b[j] = x
  b[i0] = m * x
  rest.forEach((i) => {
    a[i] = rng.intExcept(-6, 6, [0])
    b[i] = 0
  })
  return { a, b, j, x }
}

function tier3(rng: Rng): Problem {
  const size = rng.pick([2, 3])
  const { a, b, j, x } = buildOrthogonalCase(rng, size)
  const bDisplay: (number | string)[] = b.map((v, i) => (i === j ? 't' : v))
  const terms = a
    .map((ai, i) => {
      if (i === j) return `${paren(ai)}\\cdot t`
      if (b[i] === 0) return null
      return `${paren(ai)}\\cdot${paren(b[i])}`
    })
    .filter((t): t is string => t !== null)
  const knownSum = a.reduce((sum, ai, i) => (i === j ? sum : sum + ai * b[i]), 0)
  const solution: SolutionStep[] = [
    { text: 'Two vectors are orthogonal exactly when their dot product is zero:', tex: '\\vec{a}\\cdot\\vec{b} = 0' },
    { text: 'Substitute the components, leaving $t$ as a letter:', tex: `${terms.join(' + ')} = 0` },
    {
      text: 'Simplify the known products and isolate $t$:',
      tex: `${a[j]}t ${knownSum < 0 ? '-' : '+'} ${Math.abs(knownSum)} = 0 \\quad\\Rightarrow\\quad ${a[j]}t = ${-knownSum} \\quad\\Rightarrow\\quad t = \\dfrac{${-knownSum}}{${a[j]}} = ${x}`,
    },
  ]
  return {
    statement: `Vectors $\\vec{a}=${tupleLatex(a)}$ and $\\vec{b}=${tupleLatex(bDisplay)}$ are orthogonal. Find the value of $t$.`,
    answer: { kind: 'number', value: String(x) },
    solution,
    hints: HINTS_ORTHOGONAL,
    inputHint: INPUT_HINT_NUMBER,
  }
}

export const template: SkillTemplate = {
  skillId: 'dot_product',
  theory,
  expectedSeconds: { 1: 35, 2: 55, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? dotTier(rng, 2) : tier === 2 ? dotTier(rng, 3) : tier3(rng)),
}
