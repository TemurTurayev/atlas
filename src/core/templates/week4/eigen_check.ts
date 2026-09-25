import { coefPrefix } from '../../math/latex'
import { apply, matLatex, type Mat } from '../../math/matrix'
import { vecLatex, type Vec } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'A nonzero vector $\\vec v$ is an eigenvector of $A$ when $A\\vec v = \\lambda\\vec v$: the matrix only stretches it, never turns it.',
  'The number $\\lambda$ is the eigenvalue belonging to $\\vec v$. It may be negative (the direction flips) or zero.',
  'To check a candidate, multiply $A\\vec v$ and compare with $\\vec v$: if every component is the same multiple of the matching component of $\\vec v$, that multiple is $\\lambda$.',
  'Every nonzero multiple of an eigenvector is again an eigenvector with the same $\\lambda$ — an eigenvector is a direction, not one particular arrow.',
  'The zero vector is never an eigenvector, although $\\lambda = 0$ is allowed for a nonzero $\\vec v$.',
  'Common mistakes: comparing only one component instead of all of them; calling $\\vec 0$ an eigenvector.',
].join('\n')

const HINTS_LAMBDA = [
  'Multiply $A\\vec v$ first — the result must be a multiple of $\\vec v$.',
  'Divide each component of $A\\vec v$ by the matching component of $\\vec v$; the shared value is $\\lambda$.',
]
const HINTS_CHOICE = [
  'For each candidate, compute $A\\vec v$ and see whether the result is a multiple of that same $\\vec v$.',
  'A vector is an eigenvector only if every component is scaled by the same number.',
]
const HINTS_PARAMETER = [
  'Write out $A\\vec v$ with the unknown still in it, then demand that the result be $\\lambda\\vec v$.',
  'The first component gives $\\lambda$ straight away; the second one then fixes the unknown.',
]
const INPUT_HINT_NUMBER = 'A single number; it may be negative'

const asColumn = (v: Vec): string => vecLatex(v.map(String))

/** Rows proportional to (v2, -v1) send v to zero, so A = kI + B has v as an eigenvector with λ = k. */
function matrixWith(eigenvector: Vec, lambda: number, p: number, q: number): number[][] {
  const [v1, v2] = eigenvector
  return [
    [lambda + p * v2, -p * v1],
    [q * v2, lambda - q * v1],
  ]
}

const product = (a: Mat, v: Vec): SolutionStep => ({
  text: 'Multiply the vector by the matrix:',
  tex: `A\\vec v = ${matLatex(a.map((row) => row.map(String)))}${asColumn(v)} = ${asColumn(apply(a, v))}`,
})

function tier1(rng: Rng): Problem {
  const v = [rng.intExcept(-4, 4, [0]), rng.intExcept(-4, 4, [0])]
  const lambda = rng.intExcept(-5, 5, [0])
  const a = matrixWith(v, lambda, rng.intExcept(-2, 2, [0]), rng.intExcept(-2, 2, [0]))
  const av = apply(a, v)
  return {
    statement: `The vector $\\vec v = ${asColumn(v)}$ is an eigenvector of $A = ${matLatex(a.map((row) => row.map(String)))}$. Find the eigenvalue $\\lambda$.`,
    answer: { kind: 'number', value: String(lambda) },
    solution: [
      product(a, v),
      {
        text: 'Compare with $\\vec v$ component by component — both give the same multiple:',
        tex: `\\frac{${av[0]}}{${v[0]}} = ${lambda}, \\qquad \\frac{${av[1]}}{${v[1]}} = ${lambda}`,
      },
      { text: 'So $A\\vec v = \\lambda\\vec v$ with', tex: `\\lambda = ${lambda}` },
    ],
    hints: HINTS_LAMBDA,
    inputHint: INPUT_HINT_NUMBER,
  }
}

/** A candidate that is not parallel to either eigendirection of a 2×2 matrix. */
function distractor(rng: Rng, a: Mat, taken: readonly Vec[]): number[] {
  for (let guard = 0; guard < 200; guard += 1) {
    const w = [rng.intExcept(-4, 4, [0]), rng.intExcept(-4, 4, [0])]
    const aw = apply(a, w)
    const parallelToItself = aw[0] * w[1] - aw[1] * w[0] === 0
    const repeat = taken.some((t) => t[0] * w[1] - t[1] * w[0] === 0)
    if (!parallelToItself && !repeat) return w
  }
  throw new Error('eigen_check: no distractor found')
}

function tier2(rng: Rng): Problem {
  const v = [rng.intExcept(-3, 3, [0]), rng.intExcept(-3, 3, [0])]
  const lambda = rng.intExcept(-4, 4, [0])
  const a = matrixWith(v, lambda, rng.intExcept(-2, 2, [0]), rng.intExcept(-2, 2, [0]))
  const wrong: number[][] = []
  while (wrong.length < 3) wrong.push(distractor(rng, a, [v, ...wrong]))

  const options: ChoiceOption[] = rng.shuffle([
    { id: 'right', label: `$${asColumn(v)}$` },
    ...wrong.map((w, i) => ({ id: `wrong${i}`, label: `$${asColumn(w)}$` })),
  ])
  const first = wrong[0]
  return {
    statement: `Which of these vectors is an eigenvector of $A = ${matLatex(a.map((row) => row.map(String)))}$?`,
    answer: { kind: 'choice', options, correctId: 'right' },
    solution: [
      product(a, v),
      { text: `The result is $${lambda}$ times the vector itself, so this one is an eigenvector with $\\lambda = ${lambda}$.` },
      {
        text: 'A candidate that fails, for comparison:',
        tex: `A${asColumn(first)} = ${asColumn(apply(a, first))}`,
      },
      { text: 'That result is not a multiple of the vector it came from — the direction changed, so it is not an eigenvector.' },
    ],
    hints: HINTS_CHOICE,
  }
}

function tier3(rng: Rng): Problem {
  const t = rng.intExcept(-4, 4, [0])
  const gap = rng.intExcept(-4, 4, [0])
  const d = rng.int(-4, 4)
  const lambda = d + gap
  const c = t * gap
  const a: Mat = [
    [lambda, 0],
    [c, d],
  ]
  return {
    statement: `For which value of $t$ is $\\vec v = ${vecLatex(['1', 't'])}$ an eigenvector of $A = ${matLatex(a.map((row) => row.map(String)))}$?`,
    answer: { kind: 'number', value: String(t) },
    solution: [
      { text: 'Write out $A\\vec v$ with $t$ still unknown:', tex: `A\\vec v = ${vecLatex([String(lambda), `${c} ${d < 0 ? '-' : '+'} ${coefPrefix(Math.abs(d))}t`])}` },
      { text: 'For an eigenvector this must equal $\\lambda\\vec v$. The first component gives $\\lambda$ at once:', tex: `\\lambda \\cdot 1 = ${lambda}` },
      { text: 'Now the second component must match $\\lambda t$:', tex: `${c} ${d < 0 ? '-' : '+'} ${coefPrefix(Math.abs(d))}t = ${coefPrefix(lambda)}t` },
      { text: 'Collect the $t$ terms and solve:', tex: `${c} = ${coefPrefix(gap)}t \\quad\\Longrightarrow\\quad t = ${t}` },
    ],
    hints: HINTS_PARAMETER,
    inputHint: INPUT_HINT_NUMBER,
  }
}

export const template: SkillTemplate = {
  skillId: 'eigen_check',
  theory,
  expectedSeconds: { 1: 60, 2: 80, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
