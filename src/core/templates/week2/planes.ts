import { coefPrefix, joinTerms, linear, paren } from '../../math/latex'
import { add, dot, scale, tupleLatex, vecLatex, type Vec } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'A plane can be written as $ax+by+cz=d$. The coefficients of $x,y,z$ form its normal vector: $\\vec n=(a,b,c)$.',
  'Every point $(x,y,z)$ on the plane satisfies the same equation, so a point and a normal vector fix the constant: $d=\\vec n\\cdot P$.',
  'A parametric line $\\vec r(t)=\\vec p+t\\vec d$ meets the plane $\\vec n\\cdot X=k$ where $\\vec n\\cdot(\\vec p+t\\vec d)=k$; this is one linear equation in $t$.',
  'The line actually crosses the plane (rather than running parallel to it or lying inside it) exactly when $\\vec n\\cdot\\vec d\\neq0$.',
  'Common mistakes: mixing up which coefficient is $a,b,c$ when a variable is missing (coefficient $0$); forgetting to substitute the whole line, coordinate by coordinate, before solving for $t$.',
].join('\n')

const HINTS_NORMAL = [
  'In the equation $ax+by+cz=d$, the normal vector is just the triple of coefficients $(a,b,c)$ — nothing to compute.',
  'Match each coefficient to its variable: the coefficient of $x$ is first, $y$ second, $z$ third. A missing variable means that coefficient is $0$.',
]
const HINTS_CONSTANT = [
  'Every point of the plane satisfies $ax+by+cz=d$ for the same $d$ — including the given point.',
  'Substitute the point\'s coordinates for $x,y,z$ (using the given normal vector\'s components as $a,b,c$), then compute $d=ax_0+by_0+cz_0$.',
]
const HINTS_INTERSECTION = [
  'A point on the line is $\\vec p+t\\vec d$. Substitute its coordinates into the plane equation to get one linear equation in $t$.',
  'Collect the $t$-terms on one side and the constants on the other, then divide.',
]

const INPUT_HINT_VECTOR = 'One number per component, top to bottom'
const INPUT_HINT_NUMBER = 'A single number'

const asColumn = (v: Vec): string => vecLatex(v.map(String))
const componentsOf = (v: Vec): string[] => v.map(String)

const randomVec = (rng: Rng, size: number, lo: number, hi: number): number[] => Array.from({ length: size }, () => rng.int(lo, hi))

/** Random vector guaranteed not to be the zero vector. */
function randomNonzeroVec(rng: Rng, size: number, lo: number, hi: number): number[] {
  let v: number[]
  do {
    v = randomVec(rng, size, lo, hi)
  } while (v.every((x) => x === 0))
  return v
}

/** Plane coefficients (a, b, c) against variables (x, y, z), e.g. "2x-3z". Drops zero terms. */
function planeLhs(n: Vec): string {
  const vars = ['x', 'y', 'z']
  return joinTerms(n.map((c, i) => (c === 0 ? '' : `${coefPrefix(c)}${vars[i]}`)))
}

function tier1(rng: Rng): Problem {
  const a = rng.intExcept(-8, 8, [0])
  const b = rng.int(-8, 8)
  const c = rng.int(-8, 8)
  const n = [a, b, c]
  const d = rng.int(-10, 10)
  return {
    statement: `A plane is given by the equation $${planeLhs(n)} = ${d}$. Give its normal vector $\\vec n=(a,b,c)$ (the coefficients of $x,y,z$).`,
    answer: { kind: 'vector', components: componentsOf(n) },
    solution: [
      { text: 'For a plane written as $ax+by+cz=d$, the normal vector is exactly the triple of coefficients:', tex: '\\vec n = (a, b, c)' },
      { text: 'Reading off the coefficients here:', tex: `\\vec n = ${tupleLatex(n)}` },
    ],
    hints: HINTS_NORMAL,
    inputHint: INPUT_HINT_VECTOR,
  }
}

function tier2(rng: Rng): Problem {
  const n = randomNonzeroVec(rng, 3, -7, 7)
  const P = randomVec(rng, 3, -6, 6)
  const dConst = dot(n, P)
  return {
    statement: `A plane passes through the point $P${tupleLatex(P)}$ and has normal vector $\\vec n=${tupleLatex(n)}$. Its equation has the form $ax+by+cz=d$ with $(a,b,c)=\\vec n$. Find $d$.`,
    answer: { kind: 'number', value: String(dConst) },
    solution: [
      { text: 'Every point of the plane satisfies $ax+by+cz=d$; substitute $P$ for $(x,y,z)$:', tex: `d = ${n[0]}\\cdot${paren(P[0])} + ${n[1]}\\cdot${paren(P[1])} + ${n[2]}\\cdot${paren(P[2])}` },
      {
        text: 'Compute:',
        tex: `d = ${joinTerms([String(n[0] * P[0]), String(n[1] * P[1]), String(n[2] * P[2])])} = ${dConst}`,
      },
    ],
    hints: HINTS_CONSTANT,
    inputHint: INPUT_HINT_NUMBER,
  }
}

/** Coordinate of the line at parameter t, e.g. p=5, d=-3 -> "5-3t". */
const paramCoord = (p: number, d: number): string => joinTerms([String(p), d === 0 ? '' : `${coefPrefix(d)}t`])

function tier3(rng: Rng): Problem {
  const p = randomVec(rng, 3, -6, 6)
  const d = randomNonzeroVec(rng, 3, -5, 5)
  const t0 = rng.intExcept(-5, 5, [0])
  const Q = add(p, scale(t0, d))

  let n: number[]
  do {
    n = randomNonzeroVec(rng, 3, -6, 6)
  } while (dot(n, d) === 0)
  const k = dot(n, Q)

  const A = dot(n, d)
  const B = dot(n, p)
  const substituted = joinTerms(n.map((ni, i) => (ni === 0 ? '' : `${coefPrefix(ni)}\\left(${paramCoord(p[i], d[i])}\\right)`)))

  const commonSolution: SolutionStep[] = [
    { text: 'Substitute the line\'s coordinates into the plane equation:', tex: `${substituted} = ${k}` },
    { text: 'Expand and collect the terms in $t$:', tex: `${linear(A, B, 't')} = ${k}` },
    { text: 'Solve for $t$:', tex: `t = \\frac{${k} - ${paren(B)}}{${A}} = ${t0}` },
  ]

  const askForPoint = rng.chance(0.5)
  const planeEq = `${planeLhs(n)} = ${k}`
  const preamble = `A line is given by $\\vec r(t) = \\vec p + t\\vec d$ with $\\vec p=${tupleLatex(p)}$ and $\\vec d=${tupleLatex(d)}$. It meets the plane $${planeEq}$ at a single point.`

  if (askForPoint) {
    return {
      statement: `${preamble} Find the coordinates of the intersection point.`,
      answer: { kind: 'vector', components: componentsOf(Q) },
      solution: [
        ...commonSolution,
        { text: `Substitute $t=${t0}$ back into the line:`, tex: `\\vec r(${t0}) = ${asColumn(p)} + ${t0}${asColumn(d)} = ${asColumn(Q)}` },
      ],
      hints: HINTS_INTERSECTION,
      inputHint: INPUT_HINT_VECTOR,
    }
  }

  return {
    statement: `${preamble} Find the parameter $t$ at the intersection.`,
    answer: { kind: 'number', value: String(t0) },
    solution: commonSolution,
    hints: HINTS_INTERSECTION,
    inputHint: INPUT_HINT_NUMBER,
  }
}

export const template: SkillTemplate = {
  skillId: 'planes',
  theory,
  expectedSeconds: { 1: 35, 2: 55, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
