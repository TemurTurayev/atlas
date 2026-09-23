import { paren } from '../../math/latex'
import { rat, ratToLatex } from '../../math/rational'
import { cross, dot, tupleLatex, type Vec } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'The cosine of the angle between two vectors is $\\cos\\theta=\\dfrac{\\vec a\\cdot\\vec b}{|\\vec a||\\vec b|}$, with $\\theta\\in[0^\\circ,180^\\circ]$.',
  'The dot product is $\\vec a\\cdot\\vec b=a_1b_1+a_2b_2(+a_3b_3)$; the length is $|\\vec a|=\\sqrt{a_1^{2}+a_2^{2}(+a_3^{2})}$.',
  'Two nonzero vectors are perpendicular exactly when their dot product is $0$ — the angle between them is $90^\\circ$.',
  'A vector is a positive multiple of $(\\cos\\alpha,\\sin\\alpha)$ exactly when it points along the ray at angle $\\alpha$ from the positive x-axis; scaling by a positive number never changes the angle.',
  'Common mistakes: forgetting to divide by both lengths, not just one; reporting a negative angle instead of the value in $[0^\\circ,180^\\circ]$.',
].join('\n')

const HINTS_COS = [
  'Use $\\cos\\theta=\\dfrac{\\vec a\\cdot\\vec b}{|\\vec a||\\vec b|}$: compute the dot product and each length separately, then divide.',
  'The dot product is $a_1b_1+a_2b_2(+a_3b_3)$; each length is the square root of the sum of its squared components.',
]
const HINTS_STD = [
  'Try to recognize each vector as a positive multiple of a standard direction $(\\cos\\alpha,\\sin\\alpha)$ for $\\alpha\\in\\{0^\\circ,30^\\circ,45^\\circ,60^\\circ,90^\\circ,120^\\circ,135^\\circ,150^\\circ,180^\\circ\\}$.',
  'Scaling a vector by a positive number never changes its direction: the angle between the two vectors is the difference of the two standard angles you found.',
]
const HINTS_ORTHO = [
  'Perpendicular vectors satisfy $\\vec a\\cdot\\vec b=0$ — write the dot product as a sum and set it equal to zero.',
  'Isolate $t$: move the known terms to the other side of the equation, then divide by the coefficient of $t$.',
]

const COS_INPUT_HINT = 'A single number; if it is a fraction, write it like -4/5, not as a decimal'
const DEGREES_INPUT_HINT = 'The angle in degrees, e.g. 60'
const ORTHO_INPUT_HINT = 'A single number; if it is a fraction, write it like -7/3, not as a decimal'

const isZeroVec = (v: Vec): boolean => v.every((x) => x === 0)

/** A problem that asks for the exact cosine of the angle between two given vectors (2D or 3D). */
function cosineProblem(a: Vec, b: Vec, normA: number, normB: number): Problem {
  const dotAB = dot(a, b)
  const cosLatex = ratToLatex(rat(dotAB, normA * normB))
  const terms = a.map((x, i) => `${x}\\cdot${paren(b[i])}`).join(' + ')
  return {
    statement: `Given $\\vec a=${tupleLatex(a)}$ and $\\vec b=${tupleLatex(b)}$, find $\\cos\\theta$, where $\\theta$ is the angle between $\\vec a$ and $\\vec b$.`,
    answer: { kind: 'number', value: cosLatex },
    solution: [
      { text: 'Dot product:', tex: `\\vec a\\cdot\\vec b = ${terms} = ${dotAB}` },
      { text: 'Length of each vector:', tex: `|\\vec a| = ${normA}, \\quad |\\vec b| = ${normB}` },
      { text: 'Divide the dot product by the product of the lengths, and reduce:', tex: `\\cos\\theta = \\frac{${dotAB}}{${normA}\\cdot ${normB}} = ${cosLatex}` },
    ],
    hints: HINTS_COS,
    inputHint: COS_INPUT_HINT,
  }
}

// ---------- tier 1: 2D vectors with an integer norm, so the cosine reduces to a clean fraction ----------

interface Dir2 {
  readonly v: readonly [number, number]
  readonly norm: number
}

const TRIPLES_2D: readonly (readonly [number, number, number])[] = [
  [3, 4, 5],
  [6, 8, 10],
  [5, 12, 13],
  [9, 12, 15],
  [8, 15, 17],
]

function buildDirs2D(): Dir2[] {
  const dirs: Dir2[] = []
  for (const [p, q, r] of TRIPLES_2D) {
    for (const [x, y] of [
      [p, q],
      [q, p],
    ] as const) {
      for (const sx of [1, -1]) {
        for (const sy of [1, -1]) {
          dirs.push({ v: [sx * x, sy * y], norm: r })
        }
      }
    }
  }
  dirs.push({ v: [1, 0], norm: 1 }, { v: [-1, 0], norm: 1 }, { v: [0, 1], norm: 1 }, { v: [0, -1], norm: 1 })
  return dirs
}

const DIRS_2D: readonly Dir2[] = buildDirs2D()

function pickNonParallel2D(rng: Rng): readonly [Dir2, Dir2] {
  for (let i = 0; i < 1000; i += 1) {
    const a = rng.pick(DIRS_2D)
    const b = rng.pick(DIRS_2D)
    if (a.v[0] * b.v[1] - a.v[1] * b.v[0] !== 0) return [a, b]
  }
  throw new Error('pickNonParallel2D: exhausted retries')
}

function tier1(rng: Rng): Problem {
  const [da, db] = pickNonParallel2D(rng)
  return cosineProblem(da.v, db.v, da.norm, db.norm)
}

// ---------- tier 2: angle in degrees, built backward from a standard angle ----------

type Comp = { readonly kind: 'zero' } | { readonly kind: 'int'; readonly sign: 1 | -1 } | { readonly kind: 'sqrt3'; readonly sign: 1 | -1 }

interface StdDir {
  readonly angle: number
  readonly x: Comp
  readonly y: Comp
}

const STD_DIRS: readonly StdDir[] = [
  { angle: 0, x: { kind: 'int', sign: 1 }, y: { kind: 'zero' } },
  { angle: 30, x: { kind: 'sqrt3', sign: 1 }, y: { kind: 'int', sign: 1 } },
  { angle: 45, x: { kind: 'int', sign: 1 }, y: { kind: 'int', sign: 1 } },
  { angle: 60, x: { kind: 'int', sign: 1 }, y: { kind: 'sqrt3', sign: 1 } },
  { angle: 90, x: { kind: 'zero' }, y: { kind: 'int', sign: 1 } },
  { angle: 120, x: { kind: 'int', sign: -1 }, y: { kind: 'sqrt3', sign: 1 } },
  { angle: 135, x: { kind: 'int', sign: -1 }, y: { kind: 'int', sign: 1 } },
  { angle: 150, x: { kind: 'sqrt3', sign: -1 }, y: { kind: 'int', sign: 1 } },
  { angle: 180, x: { kind: 'int', sign: -1 }, y: { kind: 'zero' } },
]

const STANDARD_ANGLES: ReadonlySet<number> = new Set(STD_DIRS.map((d) => d.angle))

interface AnglePair {
  readonly ia: number
  readonly ib: number
  readonly result: number
}

function buildAnglePairs(): AnglePair[] {
  const pairs: AnglePair[] = []
  for (let ia = 0; ia < STD_DIRS.length; ia += 1) {
    for (let ib = 0; ib < STD_DIRS.length; ib += 1) {
      const diff = Math.abs(STD_DIRS[ib].angle - STD_DIRS[ia].angle)
      if (STANDARD_ANGLES.has(diff)) pairs.push({ ia, ib, result: diff })
    }
  }
  return pairs
}

const ANGLE_PAIRS: readonly AnglePair[] = buildAnglePairs()

function compLatex(c: Comp, k: number): string {
  if (c.kind === 'zero') return '0'
  if (c.kind === 'int') return String(c.sign * k)
  const mag = k === 1 ? '\\sqrt{3}' : `${k}\\sqrt{3}`
  return c.sign < 0 ? `-${mag}` : mag
}

function tier2(rng: Rng): Problem {
  const { ia, ib, result } = rng.pick(ANGLE_PAIRS)
  const dirA = STD_DIRS[ia]
  const dirB = STD_DIRS[ib]
  const ka = rng.int(1, 3)
  const kb = rng.int(1, 3)
  const a = [compLatex(dirA.x, ka), compLatex(dirA.y, ka)]
  const b = [compLatex(dirB.x, kb), compLatex(dirB.y, kb)]
  return {
    statement: `Given $\\vec a=${tupleLatex(a)}$ and $\\vec b=${tupleLatex(b)}$, find the angle $\\theta$ between them, in degrees.`,
    answer: { kind: 'number', value: String(result) },
    solution: [
      { text: `$\\vec a$ is a positive multiple of $(\\cos\\alpha,\\sin\\alpha)$ for $\\alpha=${dirA.angle}^\\circ$ — it points along the ray at that angle from the positive x-axis.` },
      { text: `$\\vec b$ is a positive multiple of $(\\cos\\beta,\\sin\\beta)$ for $\\beta=${dirB.angle}^\\circ$.` },
      {
        text: 'Scaling by a positive number never changes direction, so the angle between them is the difference of these two standard angles:',
        tex: `\\theta = \\left|${dirB.angle}^\\circ - ${dirA.angle}^\\circ\\right| = ${result}^\\circ`,
      },
    ],
    hints: HINTS_STD,
    inputHint: DEGREES_INPUT_HINT,
  }
}

// ---------- tier 3: 3D cosine, or an orthogonality condition solved for an unknown component ----------

interface Dir3 {
  readonly v: readonly [number, number, number]
  readonly norm: number
}

const BASE_TRIPLES_3D: readonly (readonly [number, number, number])[] = [
  [1, 2, 2],
  [2, 1, 2],
  [2, 2, 1],
  [2, 3, 6],
  [3, 6, 2],
  [6, 2, 3],
  [1, 4, 8],
  [4, 8, 1],
  [8, 1, 4],
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
    for (const sx of [1, -1]) {
      for (const sy of [1, -1]) {
        for (const sz of [1, -1]) {
          dirs.push({ v: [sx * t[0], sy * t[1], sz * t[2]], norm })
        }
      }
    }
  }
  return dirs
}

const DIRS_3D: readonly Dir3[] = buildDirs3D()

function pickNonParallel3D(rng: Rng): readonly [Dir3, Dir3] {
  for (let i = 0; i < 1000; i += 1) {
    const a = rng.pick(DIRS_3D)
    const b = rng.pick(DIRS_3D)
    if (!isZeroVec(cross(a.v, b.v))) return [a, b]
  }
  throw new Error('pickNonParallel3D: exhausted retries')
}

function threeDCosine(rng: Rng): Problem {
  const [da, db] = pickNonParallel3D(rng)
  return cosineProblem(da.v, db.v, da.norm, db.norm)
}

const randomNonzero3D = (rng: Rng, lo = -5, hi = 5): [number, number, number] => {
  for (let i = 0; i < 1000; i += 1) {
    const v: [number, number, number] = [rng.int(lo, hi), rng.int(lo, hi), rng.int(lo, hi)]
    if (v.every((x) => x !== 0)) return v
  }
  throw new Error('randomNonzero3D: exhausted retries')
}

function orthogonalT(rng: Rng): Problem {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const a = randomNonzero3D(rng)
    const p = rng.int(0, 2)
    const bDisplay: string[] = []
    let sumKnown = 0
    let othersAllZero = true
    for (let i = 0; i < 3; i += 1) {
      if (i === p) {
        bDisplay.push('t')
      } else {
        const v = rng.int(-5, 5)
        if (v !== 0) othersAllZero = false
        bDisplay.push(String(v))
        sumKnown += a[i] * v
      }
    }
    const tRat = rat(-sumKnown, a[p])
    if (othersAllZero && tRat.n === 0) continue // would make b the zero vector
    const tLatex = ratToLatex(tRat)
    const dotTerms = bDisplay.map((c, i) => `${a[i]}\\cdot ${paren(c)}`).join(' + ')
    return {
      statement: `Vectors $\\vec a=${tupleLatex(a)}$ and $\\vec b=${tupleLatex(bDisplay)}$ are perpendicular. Find $t$.`,
      answer: { kind: 'number', value: tLatex },
      solution: [
        { text: 'Perpendicular vectors have a dot product of zero:', tex: '\\vec a\\cdot\\vec b = 0' },
        { text: 'Write out the dot product and set it to zero:', tex: `${dotTerms} = 0` },
        { text: 'Solve for $t$:', tex: `t = ${tLatex}` },
      ],
      hints: HINTS_ORTHO,
      inputHint: ORTHO_INPUT_HINT,
    }
  }
  throw new Error('orthogonalT: exhausted retries')
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? threeDCosine(rng) : orthogonalT(rng)
}

export const template: SkillTemplate = {
  skillId: 'vec_angle',
  theory,
  expectedSeconds: { 1: 55, 2: 70, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
