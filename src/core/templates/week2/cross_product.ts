import { joinTerms, paren } from '../../math/latex'
import { rat, ratToLatex } from '../../math/rational'
import { cross, dot, sub, tupleLatex, vecLatex, type Vec } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'In 3D, the cross product is $\\vec a\\times\\vec b=(a_2b_3-a_3b_2,\\ a_3b_1-a_1b_3,\\ a_1b_2-a_2b_1)$ — the result is a new vector, not a number.',
  'The result is perpendicular to both $\\vec a$ and $\\vec b$, which makes it useful as a normal vector to the plane they span.',
  'Order matters: $\\vec a\\times\\vec b=-\\vec b\\times\\vec a$ — swapping the two vectors flips the sign of every component.',
  'Its length equals the area of the parallelogram spanned by $\\vec a$ and $\\vec b$: $|\\vec a\\times\\vec b|=|\\vec a||\\vec b|\\sin\\theta$. Half of that is the area of the triangle they span.',
  'Common mistakes: mixing up the component formula (swapping which subscripts go where); forgetting to halve the parallelogram area to get the triangle area.',
].join('\n')

const HINTS_BASIC = [
  'Compute each component separately using $(a_2b_3-a_3b_2,\\ a_3b_1-a_1b_3,\\ a_1b_2-a_2b_1)$.',
  'The subscript pattern cycles $1\\to2\\to3\\to1$; a common slip is swapping the sign of the middle component.',
]
const HINTS_NORMAL = [
  'First build the two edge vectors $\\vec u=\\overrightarrow{AB}$ and $\\vec v=\\overrightarrow{AC}$ by subtracting coordinates, then cross them.',
  'The order is $\\vec u\\times\\vec v$, not $\\vec v\\times\\vec u$ — swapping the order flips the sign of every component.',
]
const HINTS_AREA = [
  'The area of the parallelogram spanned by $\\vec a$ and $\\vec b$ is $|\\vec a\\times\\vec b|$; halve it for the triangle they span.',
  'Compute the cross product first, then take the square root of the sum of the squares of its components.',
]

const COMPONENT_INPUT_HINT = 'One number per component, top to bottom'
const NUMBER_INPUT_HINT = 'A single number; if it is a fraction, write it like 9/2, not as a decimal'

const isZeroVec = (v: Vec): boolean => v.every((x) => x === 0)

/** Component-by-component derivation of c = sa × sb, named as in the statement (e.g. "a","b" or "u","v"). */
function crossSteps(a: Vec, b: Vec, sa: string, sb: string): SolutionStep[] {
  const c = cross(a, b)
  const rows: readonly (readonly [number, number, number, string, number])[] = [
    [1, 2, 3, joinTerms([`${a[1]}\\cdot${paren(b[2])}`, `${-a[2]}\\cdot${paren(b[1])}`]), c[0]],
    [2, 3, 1, joinTerms([`${a[2]}\\cdot${paren(b[0])}`, `${-a[0]}\\cdot${paren(b[2])}`]), c[1]],
    [3, 1, 2, joinTerms([`${a[0]}\\cdot${paren(b[1])}`, `${-a[1]}\\cdot${paren(b[0])}`]), c[2]],
  ]
  const lines = rows.map(([k, i, j, substituted, val]) => `c_{${k}} = ${sa}_{${i}}${sb}_{${j}}-${sa}_{${j}}${sb}_{${i}} = ${substituted} = ${val}`)
  return [
    { text: `Let $\\vec c=${sa}\\times ${sb}$. Compute each component:`, tex: lines.join(' \\\\ ') },
    { text: 'Collect the components into one vector:', tex: vecLatex(c.map(String)) },
  ]
}

// ---------- tier 1: a × b for small 3D vectors ----------

const randomVec3 = (rng: Rng, lo = -4, hi = 4): number[] => Array.from({ length: 3 }, () => rng.int(lo, hi))

function pickNonParallelVectors(rng: Rng): readonly [number[], number[]] {
  for (let i = 0; i < 1000; i += 1) {
    const a = randomVec3(rng)
    const b = randomVec3(rng)
    if (!isZeroVec(a) && !isZeroVec(b) && !isZeroVec(cross(a, b))) return [a, b]
  }
  throw new Error('pickNonParallelVectors: exhausted retries')
}

function tier1(rng: Rng): Problem {
  const [a, b] = pickNonParallelVectors(rng)
  const c = cross(a, b)
  return {
    statement: `Given $\\vec a=${tupleLatex(a)}$ and $\\vec b=${tupleLatex(b)}$, compute $\\vec a\\times\\vec b$ (in this order).`,
    answer: { kind: 'vector', components: c.map(String) },
    solution: crossSteps(a, b, 'a', 'b'),
    hints: HINTS_BASIC,
    inputHint: COMPONENT_INPUT_HINT,
  }
}

// ---------- tier 2: normal vector to the plane through three points ----------

function pickTriplePoints(rng: Rng): { readonly A: number[]; readonly B: number[]; readonly C: number[]; readonly u: number[]; readonly v: number[] } {
  for (let i = 0; i < 1000; i += 1) {
    const A = randomVec3(rng)
    const B = randomVec3(rng)
    const C = randomVec3(rng)
    const u = sub(B, A)
    const v = sub(C, A)
    if (!isZeroVec(u) && !isZeroVec(v) && !isZeroVec(cross(u, v))) return { A, B, C, u, v }
  }
  throw new Error('pickTriplePoints: exhausted retries')
}

function tier2(rng: Rng): Problem {
  const { A, B, C, u, v } = pickTriplePoints(rng)
  const n = cross(u, v)
  return {
    statement: `Points $A${tupleLatex(A)}$, $B${tupleLatex(B)}$, $C${tupleLatex(C)}$ lie in a plane. Let $\\vec u=\\overrightarrow{AB}$ and $\\vec v=\\overrightarrow{AC}$. Compute $\\vec u\\times\\vec v$ (in this order) — a normal vector to the plane through $A$, $B$, $C$.`,
    answer: { kind: 'vector', components: n.map(String) },
    solution: [
      {
        text: 'Build the two edge vectors from $A$:',
        tex: `\\vec u = B - A = ${vecLatex(u.map(String))}, \\quad \\vec v = C - A = ${vecLatex(v.map(String))}`,
      },
      ...crossSteps(u, v, 'u', 'v'),
    ],
    hints: HINTS_NORMAL,
    inputHint: COMPONENT_INPUT_HINT,
  }
}

// ---------- tier 3: area of a triangle or parallelogram from |a × b| ----------

interface Dir3 {
  readonly v: readonly [number, number, number]
  readonly norm: number
}

const BASE_TRIPLES_3D: readonly (readonly [number, number, number])[] = [
  [1, 2, 2],
  [2, 3, 6],
  [1, 4, 8],
  [4, 4, 7],
  [2, 6, 9],
]

function normOf3D([x, y, z]: readonly [number, number, number]): number {
  return Math.round(Math.sqrt(x * x + y * y + z * z))
}

function buildDirs3D(): Dir3[] {
  const dirs: Dir3[] = []
  for (const t of BASE_TRIPLES_3D) {
    const norm = normOf3D(t)
    const perms: readonly (readonly [number, number, number])[] = [
      [t[0], t[1], t[2]],
      [t[1], t[2], t[0]],
      [t[2], t[0], t[1]],
    ]
    for (const perm of perms) {
      for (const sx of [1, -1]) {
        for (const sy of [1, -1]) {
          for (const sz of [1, -1]) {
            dirs.push({ v: [sx * perm[0], sy * perm[1], sz * perm[2]], norm })
          }
        }
      }
    }
  }
  return dirs
}

const DIRS_3D: readonly Dir3[] = buildDirs3D()

interface OrthoPair {
  readonly ia: number
  readonly ib: number
}

/** Pairs of curated directions that happen to be perpendicular: |a×b| = |a||b| exactly, a clean integer. */
function buildOrthoPairs(dirs: readonly Dir3[]): OrthoPair[] {
  const pairs: OrthoPair[] = []
  for (let ia = 0; ia < dirs.length; ia += 1) {
    for (let ib = ia + 1; ib < dirs.length; ib += 1) {
      if (dot(dirs[ia].v, dirs[ib].v) === 0) pairs.push({ ia, ib })
    }
  }
  return pairs
}

const ORTHO_PAIRS: readonly OrthoPair[] = buildOrthoPairs(DIRS_3D)

function tier3(rng: Rng): Problem {
  const { ia, ib } = rng.pick(ORTHO_PAIRS)
  const da = DIRS_3D[ia]
  const db = DIRS_3D[ib]
  const c = cross(da.v, db.v)
  const crossNorm = Math.round(Math.sqrt(dot(c, c)))
  const triangle = rng.chance(0.5)
  const areaLatex = ratToLatex(rat(crossNorm, triangle ? 2 : 1))
  const shape = triangle ? 'triangle' : 'parallelogram'
  const areaFormula = triangle ? '\\text{Area} = \\frac{1}{2}|\\vec a\\times \\vec b|' : '\\text{Area} = |\\vec a\\times \\vec b|'
  const magnitudeStep: SolutionStep = {
    text: 'Its length:',
    tex: `|\\vec a\\times \\vec b| = \\sqrt{${paren(c[0])}^{2}+${paren(c[1])}^{2}+${paren(c[2])}^{2}} = ${crossNorm}`,
  }
  const halveStep: readonly SolutionStep[] = triangle ? [{ text: 'Halve it for the triangle:', tex: `\\text{Area} = ${crossNorm % 2 === 0 ? `\\frac{${crossNorm}}{2} = ${areaLatex}` : areaLatex}` }] : []
  return {
    statement: `Vectors $\\vec a=${tupleLatex(da.v)}$ and $\\vec b=${tupleLatex(db.v)}$ are two sides of a ${shape}, from the same vertex. Find its area.`,
    answer: { kind: 'number', value: areaLatex },
    solution: [{ text: `Area of the ${shape} spanned by $\\vec a$ and $\\vec b$:`, tex: areaFormula }, ...crossSteps(da.v, db.v, 'a', 'b'), magnitudeStep, ...halveStep],
    hints: HINTS_AREA,
    inputHint: NUMBER_INPUT_HINT,
  }
}

export const template: SkillTemplate = {
  skillId: 'cross_product',
  theory,
  expectedSeconds: { 1: 55, 2: 85, 3: 95 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
