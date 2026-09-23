import { paren } from '../../math/latex'
import { add, scale, sub, tupleLatex, vecLatex, type Vec } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'A vector is given by its components: $\\vec{a}=(a_1,a_2)$ in the plane, $\\vec{a}=(a_1,a_2,a_3)$ in space. It is usually written as a column.',
  'Addition and subtraction work componentwise: $\\vec{a}\\pm\\vec{b}=(a_1\\pm b_1,\\ a_2\\pm b_2)$.',
  'Scaling multiplies every component by the same number: $k\\vec{a}=(ka_1,\\ ka_2)$. A negative $k$ reverses the direction.',
  'The vector from point $A$ to point $B$ is $\\overrightarrow{AB}=B-A$ — the endpoint minus the starting point.',
  'Common mistakes: subtracting in the wrong order ($A-B$ instead of $B-A$); scaling only the first component.',
].join('\n')

const HINTS_COMBINE = [
  'Work one component at a time: the first components together, then the second, then the third.',
  'Scale first, then add: $k\\vec{a}$ multiplies every component of $\\vec{a}$ by $k$.',
]
const HINTS_POINTS = [
  'The vector from $A$ to $B$ is $B-A$, the endpoint minus the starting point.',
  'Subtract coordinate by coordinate, and keep track of the signs.',
]
const INPUT_HINT = 'One number per component, top to bottom'

const asColumn = (v: Vec): string => vecLatex(v.map(String))
/** "3", "-" or "" — the coefficient as it is written in front of a vector. */
const coef = (n: number): string => (n === 1 ? '' : n === -1 ? '-' : String(n))
const componentsOf = (v: Vec): string[] => v.map(String)

function build(statement: string, value: Vec, solution: readonly SolutionStep[], hints: readonly string[]): Problem {
  return {
    statement,
    answer: { kind: 'vector', components: componentsOf(value) },
    solution,
    hints,
    inputHint: INPUT_HINT,
  }
}

const randomVec = (rng: Rng, size: number, lo = -6, hi = 6): number[] => Array.from({ length: size }, () => rng.int(lo, hi))

/** Componentwise arithmetic, written out term by term. */
function componentSteps(a: Vec, b: Vec, k: number, m: number): SolutionStep[] {
  const terms = a.map((x, i) => `${k}\\cdot${paren(x)} ${m < 0 ? '-' : '+'} ${Math.abs(m)}\\cdot${paren(b[i])}`)
  const result = add(scale(k, a), scale(m, b))
  return [
    { text: 'Work componentwise:', tex: terms.map((t, i) => `${i + 1}) \\quad ${t} = ${result[i]}`).join(' \\\\ ') },
    { text: 'Collect the components into one vector:', tex: asColumn(result) },
  ]
}

function tier1(rng: Rng): Problem {
  const a = randomVec(rng, 2)
  const b = randomVec(rng, 2)
  const plus = rng.chance(0.5)
  const value = plus ? add(a, b) : sub(a, b)
  const sign = plus ? '+' : '-'
  return build(
    `Given $\\vec{a}=${tupleLatex(a)}$ and $\\vec{b}=${tupleLatex(b)}$, compute $\\vec{a} ${sign} \\vec{b}$.`,
    value,
    [
      {
        text: `${plus ? 'Add' : 'Subtract'} the components in pairs:`,
        tex: value.map((v, i) => `${a[i]} ${sign} ${paren(b[i])} = ${v}`).join(' \\\\ '),
      },
      { text: 'The answer is the vector', tex: asColumn(value) },
    ],
    HINTS_COMBINE,
  )
}

function tier2(rng: Rng): Problem {
  const size = rng.pick([2, 3])
  const a = randomVec(rng, size, -5, 5)
  const b = randomVec(rng, size, -5, 5)
  const k = rng.intExcept(-4, 4, [0, 1])
  const m = rng.intExcept(-4, 4, [0])
  const value = add(scale(k, a), scale(m, b))
  const second = `${m < 0 ? '-' : '+'} ${coef(Math.abs(m))}\\vec{b}`
  return build(
    `Given $\\vec{a}=${tupleLatex(a)}$ and $\\vec{b}=${tupleLatex(b)}$, compute $${coef(k)}\\vec{a} ${second}$.`,
    value,
    [
      { text: `Scale $\\vec{a}$ by $${k}$:`, tex: `${k}\\vec{a} = ${asColumn(scale(k, a))}` },
      { text: `Scale $\\vec{b}$ by $${m}$:`, tex: `${m}\\vec{b} = ${asColumn(scale(m, b))}` },
      ...componentSteps(a, b, k, m),
    ],
    HINTS_COMBINE,
  )
}

function tier3(rng: Rng): Problem {
  const A = randomVec(rng, 3, -7, 7)
  const B = randomVec(rng, 3, -7, 7)
  const k = rng.intExcept(-3, 3, [0, 1])
  const ab = sub(B, A)
  const value = scale(k, ab)
  return build(
    `Points $A${tupleLatex(A)}$ and $B${tupleLatex(B)}$ are given. Compute $${coef(k)}\\overrightarrow{AB}$.`,
    value,
    [
      { text: 'The vector from $A$ to $B$ is the endpoint minus the starting point:', tex: `\\overrightarrow{AB} = B - A` },
      { text: 'Subtract coordinate by coordinate:', tex: ab.map((v, i) => `${B[i]} - ${paren(A[i])} = ${v}`).join(' \\\\ ') },
      { text: `Now scale the result by $${k}$:`, tex: `${k} \\cdot ${asColumn(ab)} = ${asColumn(value)}` },
    ],
    HINTS_POINTS,
  )
}

export const template: SkillTemplate = {
  skillId: 'vectors',
  theory,
  expectedSeconds: { 1: 45, 2: 80, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
