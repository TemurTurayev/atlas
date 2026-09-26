import { coefPrefix, joinTerms, paren } from '../../math/latex'
import { vecLatex } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'For $f(x,y)$, the gradient collects both partial derivatives into one vector: $\\nabla f = \\begin{pmatrix} f_x \\\\ f_y \\end{pmatrix}$, each found by differentiating with the other variable held constant.',
  "To find $\\nabla f$ at a point, differentiate first to get $f_x(x,y)$ and $f_y(x,y)$ as functions, then substitute the point's coordinates into each.",
  'The same idea extends to more variables: $\\nabla f = \\begin{pmatrix} f_x \\\\ f_y \\\\ f_z \\end{pmatrix}$ for $f(x,y,z)$, one partial derivative per variable.',
  '$\\nabla f$ at a point is not just a list of numbers — it is a direction: it points the way $f$ increases fastest from that point, and $\\|\\nabla f\\|$ is the rate of that fastest increase.',
  'When one factor of $f$ depends on several variables at once, such as $(ax+by+c)^{2}$, differentiate it with the chain rule, exactly as for a single variable.',
  'Common mistakes: differentiating $f_x$ with respect to $y$ as well, instead of holding $y$ fixed; forgetting to substitute the point after differentiating; writing the partials in the wrong order in the vector.',
].join('\n')

const HINTS_GRAD_BASIC = [
  'Differentiate with respect to $x$ while treating the other variables as constants; then differentiate with respect to $y$ (and $z$, if present) the same way.',
  'Compute each partial derivative as a function first, then substitute the given point into every one of them to get the numbers.',
]
const HINTS_GRAD_CHAIN = [
  'Treat the inner linear expression as a single block $u=ax+by+c$ and differentiate $f=u^{2}$ with the chain rule: $f_x = 2u\\,u_x$.',
  '$u_x$ and $u_y$ are just the coefficients of $x$ and $y$ inside $u$ — multiply each by $2u$ evaluated at the point.',
]
const HINTS_GRAD_DIRECTION = [
  'The gradient itself points in the direction of steepest ascent — find $\\nabla f$ at the given point exactly as usual.',
  'Any nonzero multiple of that gradient vector points the same way, so the gradient exactly as computed is an acceptable answer.',
]
const HINTS_GRAD_RATE = [
  'The rate of steepest ascent is the length of the gradient vector, $\\|\\nabla f\\|=\\sqrt{f_x^{2}+f_y^{2}}$.',
  'Find $\\nabla f$ at the point first, then take the square root of the sum of its squared components.',
]

const INPUT_HINT_GRAD2 = 'Two numbers, top to bottom: the x-partial then the y-partial'
const INPUT_HINT_GRAD3 = 'Three numbers, top to bottom: the x-partial, then the y-partial, then the z-partial'
const INPUT_HINT_GRAD2_SCALE = 'Two numbers, top to bottom; any nonzero multiple of a correct answer is accepted'
const INPUT_HINT_POSITIVE_NUMBER = 'A single number; it is always positive here'

/** A monomial like "3x^{2}" or "-xy"; empty when the coefficient is 0. */
const term = (coef: number, suffix: string): string => (coef === 0 ? '' : `${coefPrefix(coef)}${suffix}`)

interface QuadCase {
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
function buildQuadCase(rng: Rng): QuadCase {
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

const quadFLatex = (c: QuadCase): string =>
  joinTerms([term(c.A, 'x^{2}'), term(c.B, 'y^{2}'), term(c.C, 'xy'), term(c.D, 'x'), term(c.E, 'y')])

const quadFxLatex = (c: QuadCase): string => joinTerms([term(2 * c.A, 'x'), term(c.C, 'y'), c.D !== 0 ? String(c.D) : ''])
const quadFyLatex = (c: QuadCase): string => joinTerms([term(c.C, 'x'), term(2 * c.B, 'y'), c.E !== 0 ? String(c.E) : ''])

function tier1(rng: Rng): Problem {
  const c = buildQuadCase(rng)

  return {
    statement: `Let $f(x,y) = ${quadFLatex(c)}$. Find $\\nabla f$ at the point $(${c.a}, ${c.b})$.`,
    answer: { kind: 'vector', components: [String(c.gx), String(c.gy)] },
    solution: [
      {
        text: 'Differentiate with respect to $x$ (holding $y$ fixed), then with respect to $y$ (holding $x$ fixed):',
        tex: `f_x(x,y) = ${quadFxLatex(c)}, \\qquad f_y(x,y) = ${quadFyLatex(c)}`,
      },
      { text: `Substitute the point $(${c.a}, ${c.b})$ into each:`, tex: `f_x(${c.a},${c.b}) = ${c.gx}, \\qquad f_y(${c.a},${c.b}) = ${c.gy}` },
      { text: 'The gradient collects both partials into one vector:', tex: `\\nabla f(${c.a},${c.b}) = ${vecLatex([c.gx, c.gy])}` },
    ],
    hints: HINTS_GRAD_BASIC,
    inputHint: INPUT_HINT_GRAD2,
  }
}

function tier2Chain(rng: Rng): Problem {
  const A = rng.intExcept(-3, 3, [0])
  const B = rng.intExcept(-3, 3, [0])
  const C = rng.int(-4, 4)
  const a = rng.int(-3, 3)
  const b = rng.int(-3, 3)
  const u = A * a + B * b + C
  const gx = 2 * A * u
  const gy = 2 * B * u

  const innerTex = joinTerms([term(A, 'x'), term(B, 'y'), C !== 0 ? String(C) : ''])
  const fTex = `\\left(${innerTex}\\right)^{2}`
  const uSubstTex = C !== 0 ? `${paren(A)}\\cdot${paren(a)} + ${paren(B)}\\cdot${paren(b)} + ${paren(C)}` : `${paren(A)}\\cdot${paren(a)} + ${paren(B)}\\cdot${paren(b)}`

  return {
    statement: `Let $f(x,y) = ${fTex}$. Find $\\nabla f$ at the point $(${a}, ${b})$.`,
    answer: { kind: 'vector', components: [String(gx), String(gy)] },
    solution: [
      {
        text: `Let $u = ${innerTex}$, so $f = u^{2}$. By the chain rule, $f_x = 2u\\,u_x$ and $f_y = 2u\\,u_y$, where $u_x = ${A}$ and $u_y = ${B}$:`,
        tex: `f_x = ${coefPrefix(2 * A)}u, \\qquad f_y = ${coefPrefix(2 * B)}u`,
      },
      { text: `Substitute the point $(${a}, ${b})$ into $u$:`, tex: `u = ${uSubstTex} = ${u}` },
      { text: 'Substitute back to get the gradient:', tex: `\\nabla f(${a},${b}) = ${vecLatex([gx, gy])}` },
    ],
    hints: HINTS_GRAD_CHAIN,
    inputHint: INPUT_HINT_GRAD2,
  }
}

function tier2ThreeVar(rng: Rng): Problem {
  const A = rng.intExcept(-3, 3, [0])
  const B = rng.intExcept(-3, 3, [0])
  const Z = rng.intExcept(-3, 3, [0])
  const K = rng.int(-3, 3)
  const P = rng.int(-4, 4)
  const Q = rng.int(-4, 4)
  const R = rng.int(-4, 4)
  const a = rng.int(-3, 3)
  const b = rng.int(-3, 3)
  const cPt = rng.int(-3, 3)

  const gx = 2 * A * a + K * b + P
  const gy = K * a + 2 * B * b + Q
  const gz = 2 * Z * cPt + R

  const fTex = joinTerms([term(A, 'x^{2}'), term(B, 'y^{2}'), term(Z, 'z^{2}'), term(K, 'xy'), term(P, 'x'), term(Q, 'y'), term(R, 'z')])
  const fxTex = joinTerms([term(2 * A, 'x'), term(K, 'y'), P !== 0 ? String(P) : ''])
  const fyTex = joinTerms([term(K, 'x'), term(2 * B, 'y'), Q !== 0 ? String(Q) : ''])
  const fzTex = joinTerms([term(2 * Z, 'z'), R !== 0 ? String(R) : ''])

  return {
    statement: `Let $f(x,y,z) = ${fTex}$. Find $\\nabla f$ at the point $(${a}, ${b}, ${cPt})$.`,
    answer: { kind: 'vector', components: [String(gx), String(gy), String(gz)] },
    solution: [
      {
        text: 'Differentiate with respect to each variable, holding the other two fixed:',
        tex: `f_x = ${fxTex}, \\qquad f_y = ${fyTex}, \\qquad f_z = ${fzTex}`,
      },
      { text: `Substitute the point $(${a}, ${b}, ${cPt})$ into each:`, tex: `f_x = ${gx}, \\qquad f_y = ${gy}, \\qquad f_z = ${gz}` },
      { text: 'The gradient collects all three partials:', tex: `\\nabla f(${a},${b},${cPt}) = ${vecLatex([gx, gy, gz])}` },
    ],
    hints: HINTS_GRAD_BASIC,
    inputHint: INPUT_HINT_GRAD3,
  }
}

function tier2(rng: Rng): Problem {
  return rng.chance(0.5) ? tier2Chain(rng) : tier2ThreeVar(rng)
}

/** Same shape as buildQuadCase, retried until the gradient at the point is not the zero vector. */
function buildNonzeroGradCase(rng: Rng): QuadCase {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const c = buildQuadCase(rng)
    if (c.gx !== 0 || c.gy !== 0) return c
  }
  throw new Error('gradient: could not build a nonzero-gradient case')
}

function tier3Direction(rng: Rng): Problem {
  const c = buildNonzeroGradCase(rng)

  return {
    statement: `Let $f(x,y) = ${quadFLatex(c)}$. In which direction does $f$ increase fastest at the point $(${c.a}, ${c.b})$? Give your answer as a vector.`,
    answer: { kind: 'vector', components: [String(c.gx), String(c.gy)], upToScale: true },
    solution: [
      {
        text: 'The direction of steepest ascent at a point is the gradient there. Differentiate:',
        tex: `f_x(x,y) = ${quadFxLatex(c)}, \\qquad f_y(x,y) = ${quadFyLatex(c)}`,
      },
      { text: `Substitute the point $(${c.a}, ${c.b})$:`, tex: `\\nabla f(${c.a},${c.b}) = ${vecLatex([c.gx, c.gy])}` },
      { text: 'That vector — or any nonzero multiple of it — is the direction of fastest increase.' },
    ],
    hints: HINTS_GRAD_DIRECTION,
    inputHint: INPUT_HINT_GRAD2_SCALE,
  }
}

const PYTHAGOREAN_TRIPLES: readonly (readonly [number, number, number])[] = [
  [3, 4, 5],
  [6, 8, 10],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [9, 12, 15],
  [20, 21, 29],
]

function tier3Rate(rng: Rng): Problem {
  const [p0, q0, h] = rng.pick(PYTHAGOREAN_TRIPLES)
  const p = rng.chance(0.5) ? p0 : -p0
  const q = rng.chance(0.5) ? q0 : -q0
  const A = rng.pick([1, -1, 2, -2])
  const B = rng.pick([1, -1, 2, -2])
  const C = rng.int(-2, 2)
  const a = rng.int(-3, 3)
  const b = rng.int(-3, 3)
  const D = p - 2 * A * a - C * b
  const E = q - C * a - 2 * B * b

  const fTex = joinTerms([term(A, 'x^{2}'), term(B, 'y^{2}'), term(C, 'xy'), term(D, 'x'), term(E, 'y')])

  return {
    statement: `Let $f(x,y) = ${fTex}$. Find the rate of steepest ascent of $f$ at the point $(${a}, ${b})$ (that is, $\\|\\nabla f\\|$).`,
    answer: { kind: 'number', value: String(h) },
    solution: [
      { text: 'The rate of steepest ascent is the length of the gradient. Differentiate and substitute the point:', tex: `\\nabla f(${a},${b}) = ${vecLatex([p, q])}` },
      { text: 'Take its length:', tex: `\\|\\nabla f(${a},${b})\\| = \\sqrt{${paren(p)}^{2}+${paren(q)}^{2}} = \\sqrt{${p * p + q * q}} = ${h}` },
    ],
    hints: HINTS_GRAD_RATE,
    inputHint: INPUT_HINT_POSITIVE_NUMBER,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? tier3Direction(rng) : tier3Rate(rng)
}

export const template: SkillTemplate = {
  skillId: 'gradient',
  theory,
  expectedSeconds: { 1: 70, 2: 110, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
