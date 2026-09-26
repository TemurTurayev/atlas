import { coefPrefix, joinTerms, paren } from '../../math/latex'
import { rat, ratToLatex } from '../../math/rational'
import { vecLatex } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'The directional derivative of $f$ at a point in the direction of a unit vector $\\hat u$ is $D_{\\hat u}f=\\nabla f\\cdot\\hat u$ — the gradient dotted with the direction.',
  '$\\hat u$ must be a unit vector ($\\|\\hat u\\|=1$) for this to give the true rate of change; if you are given a vector that is not yet a unit vector, divide it by its own length first.',
  '$D_{\\hat u}f$ is largest, equal to $\\|\\nabla f\\|$, when $\\hat u$ points in the same direction as $\\nabla f$, and smallest, $-\\|\\nabla f\\|$, in the opposite direction.',
  '$D_{\\hat u}f=0$ exactly when $\\hat u$ is perpendicular to $\\nabla f$ — those are the directions in which $f$ is momentarily neither increasing nor decreasing.',
  'In $2$ dimensions, a vector perpendicular to $(p,q)$ is $(-q,p)$, or any nonzero multiple of it.',
  'Common mistakes: dotting the gradient with a direction vector that has not been normalised; treating any vector that points the right way as if it were already a unit vector.',
].join('\n')

const HINTS_DOT_UNIT = [
  'The directional derivative is the dot product of the gradient with the direction: $D_{\\hat u}f=\\nabla f\\cdot\\hat u$.',
  'Find $\\nabla f$ at the given point, then dot it component-by-component with $\\hat u$ — it is already a unit vector, so no normalising is needed.',
]
const HINTS_NORMALIZE = [
  'This direction vector is not yet a unit vector — first divide it by its own length, $\\hat u=\\vec v/\\|\\vec v\\|$.',
  'Once $\\hat u$ is a unit vector, dot it with $\\nabla f$ at the given point exactly as usual: $D_{\\hat u}f=\\nabla f\\cdot\\hat u$.',
]
const HINTS_ZERO_DIR = [
  'The directional derivative is zero exactly in the directions perpendicular to the gradient — find $\\nabla f$ at the point first.',
  'A vector perpendicular to $(p,q)$ is $(-q,p)$; any nonzero multiple of it is an equally valid answer.',
]
const HINTS_MAX_RATE = [
  'The largest possible directional derivative at a point equals the length of the gradient there, $\\|\\nabla f\\|$.',
  'Find $\\nabla f$ at the point, then take the square root of the sum of its squared components.',
]

const INPUT_HINT_FRACTION = 'A single number; write a fraction with /, e.g. -3/4'
const INPUT_HINT_VEC2_SCALE = 'Two numbers, top to bottom; any nonzero multiple of a correct answer is accepted'
const INPUT_HINT_POSITIVE_NUMBER = 'A single number; it is always positive here'

/** A monomial like "3x^{2}" or "-xy"; empty when the coefficient is 0. */
const term = (coef: number, suffix: string): string => (coef === 0 ? '' : `${coefPrefix(coef)}${suffix}`)

const PYTHAGOREAN_TRIPLES: readonly (readonly [number, number, number])[] = [
  [3, 4, 5],
  [6, 8, 10],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [9, 12, 15],
  [20, 21, 29],
]

interface GradCase {
  readonly A: number
  readonly B: number
  readonly C: number
  readonly D: number
  readonly E: number
  readonly a: number
  readonly b: number
  readonly gx: number
  readonly gy: number
}

/** f(x,y) = Ax^2+By^2+Cxy+Dx+Ey, with A and B forced nonzero so both squared terms appear. */
function buildGradCase(rng: Rng): GradCase {
  const A = rng.intExcept(-4, 4, [0])
  const B = rng.intExcept(-4, 4, [0])
  const C = rng.int(-3, 3)
  const D = rng.int(-5, 5)
  const E = rng.int(-5, 5)
  const a = rng.int(-4, 4)
  const b = rng.int(-4, 4)
  const gx = 2 * A * a + C * b + D
  const gy = C * a + 2 * B * b + E
  return { A, B, C, D, E, a, b, gx, gy }
}

const fLatexOf = (c: GradCase): string => joinTerms([term(c.A, 'x^{2}'), term(c.B, 'y^{2}'), term(c.C, 'xy'), term(c.D, 'x'), term(c.E, 'y')])

/** A random signed Pythagorean pair (p, q) with p^2+q^2 = h^2, h > 0. */
function signedTriple(rng: Rng): readonly [number, number, number] {
  const [p0, q0, h] = rng.pick(PYTHAGOREAN_TRIPLES)
  const p = rng.chance(0.5) ? p0 : -p0
  const q = rng.chance(0.5) ? q0 : -q0
  return [p, q, h]
}

function tier1(rng: Rng): Problem {
  const c = buildGradCase(rng)
  const [p, q, h] = signedTriple(rng)
  const uPLatex = ratToLatex(rat(p, h))
  const uQLatex = ratToLatex(rat(q, h))
  const value = ratToLatex(rat(c.gx * p + c.gy * q, h))

  return {
    statement: `Let $f(x,y) = ${fLatexOf(c)}$. At the point $(${c.a}, ${c.b})$, find the directional derivative of $f$ in the direction of the unit vector $\\hat u = ${vecLatex([uPLatex, uQLatex])}$.`,
    answer: { kind: 'number', value },
    solution: [
      { text: 'The directional derivative is $D_{\\hat u}f = \\nabla f\\cdot\\hat u$. First find the gradient at the point:', tex: `\\nabla f(${c.a},${c.b}) = ${vecLatex([c.gx, c.gy])}` },
      { text: 'Since $\\hat u$ is already a unit vector, dot it directly with the gradient:', tex: `D_{\\hat u}f = ${paren(c.gx)}\\cdot${paren(uPLatex)} + ${paren(c.gy)}\\cdot${paren(uQLatex)}` },
      { text: 'Simplify:', tex: `D_{\\hat u}f = ${value}` },
    ],
    hints: HINTS_DOT_UNIT,
    inputHint: INPUT_HINT_FRACTION,
  }
}

function tier2(rng: Rng): Problem {
  const c = buildGradCase(rng)
  const [p, q, h] = signedTriple(rng)
  const uPLatex = ratToLatex(rat(p, h))
  const uQLatex = ratToLatex(rat(q, h))
  const value = ratToLatex(rat(c.gx * p + c.gy * q, h))

  return {
    statement: `Let $f(x,y) = ${fLatexOf(c)}$. At the point $(${c.a}, ${c.b})$, find the directional derivative of $f$ in the direction of $\\vec v = ${vecLatex([p, q])}$ (not yet a unit vector — normalise it first).`,
    answer: { kind: 'number', value },
    solution: [
      { text: 'First find the length of $\\vec v$:', tex: `\\|\\vec v\\| = \\sqrt{${paren(p)}^{2}+${paren(q)}^{2}} = \\sqrt{${p * p + q * q}} = ${h}` },
      { text: 'Divide by that length to get the unit vector:', tex: `\\hat u = \\dfrac{1}{${h}}${vecLatex([p, q])} = ${vecLatex([uPLatex, uQLatex])}` },
      {
        text: 'Now find the gradient at the point and dot it with $\\hat u$:',
        tex: `\\nabla f(${c.a},${c.b}) = ${vecLatex([c.gx, c.gy])}, \\qquad D_{\\hat u}f = ${paren(c.gx)}\\cdot${paren(uPLatex)} + ${paren(c.gy)}\\cdot${paren(uQLatex)} = ${value}`,
      },
    ],
    hints: HINTS_NORMALIZE,
    inputHint: INPUT_HINT_FRACTION,
  }
}

/** Same shape as buildGradCase, retried until the gradient at the point is not the zero vector. */
function buildNonzeroGradCase(rng: Rng): GradCase {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const c = buildGradCase(rng)
    if (c.gx !== 0 || c.gy !== 0) return c
  }
  throw new Error('directional_deriv: could not build a nonzero-gradient case')
}

function tier3ZeroDirection(rng: Rng): Problem {
  const c = buildNonzeroGradCase(rng)
  const perp: readonly [number, number] = [-c.gy, c.gx]

  return {
    statement: `Let $f(x,y) = ${fLatexOf(c)}$. Find a direction (as a vector) in which the directional derivative of $f$ at the point $(${c.a}, ${c.b})$ is zero.`,
    answer: { kind: 'vector', components: perp.map(String), upToScale: true },
    solution: [
      { text: 'The directional derivative is zero exactly for directions perpendicular to the gradient. Find the gradient at the point:', tex: `\\nabla f(${c.a},${c.b}) = ${vecLatex([c.gx, c.gy])}` },
      { text: 'Swap the two components and negate one of them to get a perpendicular vector:', tex: vecLatex(perp) },
    ],
    hints: HINTS_ZERO_DIR,
    inputHint: INPUT_HINT_VEC2_SCALE,
  }
}

function tier3MaxRate(rng: Rng): Problem {
  const [p, q, h] = signedTriple(rng)
  const A = rng.pick([1, -1, 2, -2])
  const B = rng.pick([1, -1, 2, -2])
  const C = rng.int(-2, 2)
  const a = rng.int(-3, 3)
  const b = rng.int(-3, 3)
  const D = p - 2 * A * a - C * b
  const E = q - C * a - 2 * B * b
  const fTex = joinTerms([term(A, 'x^{2}'), term(B, 'y^{2}'), term(C, 'xy'), term(D, 'x'), term(E, 'y')])

  return {
    statement: `Let $f(x,y) = ${fTex}$. Find the largest possible directional derivative of $f$ at the point $(${a}, ${b})$, over all unit directions $\\hat u$.`,
    answer: { kind: 'number', value: String(h) },
    solution: [
      { text: 'The largest directional derivative at a point equals the length of the gradient there. Find $\\nabla f$ at the point:', tex: `\\nabla f(${a},${b}) = ${vecLatex([p, q])}` },
      { text: 'Take its length:', tex: `\\|\\nabla f(${a},${b})\\| = \\sqrt{${paren(p)}^{2}+${paren(q)}^{2}} = ${h}` },
    ],
    hints: HINTS_MAX_RATE,
    inputHint: INPUT_HINT_POSITIVE_NUMBER,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? tier3ZeroDirection(rng) : tier3MaxRate(rng)
}

export const template: SkillTemplate = {
  skillId: 'directional_deriv',
  theory,
  expectedSeconds: { 1: 70, 2: 100, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
