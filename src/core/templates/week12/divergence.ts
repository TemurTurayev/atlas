import { coefPrefix, joinTerms, paren } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'The divergence of a 2D field $\\vec F = (P, Q)$ is $\\nabla \\cdot \\vec F = \\frac{\\partial P}{\\partial x} + \\frac{\\partial Q}{\\partial y}$; ' +
    'for a 3D field $\\vec F = (P, Q, R)$, it is $\\nabla \\cdot \\vec F = \\frac{\\partial P}{\\partial x} + \\frac{\\partial Q}{\\partial y} + \\frac{\\partial R}{\\partial z}$.',
  'Physical meaning: $\\nabla \\cdot \\vec F > 0$ indicates a local source (outward expansion), ' +
    '$\\nabla \\cdot \\vec F < 0$ indicates a sink (inward compression), and $\\nabla \\cdot \\vec F = 0$ means incompressible (solenoidal).',
  'For the position vector field $\\vec r = (x, y, z)$, $\\nabla \\cdot \\vec r = 1 + 1 + 1 = 3$; in 2D, $\\nabla \\cdot (x, y) = 2$.',
  'The divergence of the curl of any smooth 3D vector field is identically zero: $\\nabla \\cdot (\\nabla \\times \\vec F) = 0$.',
  'To evaluate divergence at a point $(x_0, y_0, z_0)$, compute the partial derivatives first, then substitute the coordinates.',
  'Common mistakes: computing cross product components instead of adding partial derivatives; differentiating with respect to the wrong variable.',
].join('\n')

const HINTS_CALC = [
  'Compute the partial derivative of the first component with respect to x, the second with respect to y, and the third with respect to z.',
  'Add the partial derivatives together, then substitute the coordinates of the given point.',
]
const HINTS_EXPR = [
  'Take the x-derivative of the first component, y-derivative of the second, and z-derivative of the third component.',
  'Combine the resulting terms into a single expression.',
]
const HINTS_SOURCE_SINK = [
  'Compute the divergence at the given point.',
  'If divergence is positive, it is a source; if negative, a sink; if zero, it is incompressible.',
]

const NUMBER_HINT = 'A single number; it may be negative or zero'
const EXPR_HINT = 'An expression in terms of x, y, z'

function polyTerm(coef: number, vars: string): string {
  if (coef === 0) return ''
  return `${coefPrefix(coef)}${vars}`
}

function tier1(rng: Rng): Problem {
  const shape = rng.pick(['div2d_point', 'div3d_point', 'position_vec'] as const)

  if (shape === 'div2d_point') {
    const a = rng.intExcept(-4, 4, [0])
    const b = rng.intExcept(-4, 4, [0])
    const c = rng.intExcept(-4, 4, [0])
    const d = rng.intExcept(-4, 4, [0])
    const x0 = rng.int(-3, 3)
    const y0 = rng.int(-3, 3)
    const P = joinTerms([polyTerm(a, 'x^2'), polyTerm(b, 'y')])
    const Q = joinTerms([polyTerm(c, 'x'), polyTerm(d, 'y^2')])
    const val = 2 * a * x0 + 2 * d * y0

    const term1 = `${2 * a}\\cdot${paren(x0)}`
    const term2 = `${2 * d}\\cdot${paren(y0)}`
    const evalSteps = joinTerms([term1, term2])

    return {
      statement: `Find the divergence $\\nabla \\cdot \\vec F$ of the vector field $\\vec F(x,y) = \\left(${P}, ${Q}\\right)$ at the point $(${x0}, ${y0})$.`,
      answer: { kind: 'number', value: String(val) },
      solution: [
        { text: 'Compute partial derivatives $\\frac{\\partial P}{\\partial x} = ' + `${2 * a}x` + '$ and $\\frac{\\partial Q}{\\partial y} = ' + `${2 * d}y` + '$:' },
        { text: 'Divergence formula:', tex: `\\nabla \\cdot \\vec F = ${joinTerms([polyTerm(2 * a, 'x'), polyTerm(2 * d, 'y')])}` },
        { text: `Evaluate at $(${x0}, ${y0})$:`, tex: `\\nabla \\cdot \\vec F(${x0}, ${y0}) = ${evalSteps} = ${val}` },
      ],
      hints: HINTS_CALC,
      inputHint: NUMBER_HINT,
    }
  }

  if (shape === 'div3d_point') {
    const a = rng.intExcept(-3, 3, [0])
    const b = rng.intExcept(-3, 3, [0])
    const c = rng.intExcept(-3, 3, [0])
    const x0 = rng.intExcept(-2, 2, [0])
    const y0 = rng.intExcept(-2, 2, [0])
    const z0 = rng.intExcept(-2, 2, [0])
    const P = polyTerm(a, 'x^2 y')
    const Q = polyTerm(b, 'y z')
    const R = polyTerm(c, 'z^2 x')
    const val = 2 * a * x0 * y0 + b * z0 + 2 * c * z0 * x0

    return {
      statement: `Find the divergence $\\nabla \\cdot \\vec F$ of the 3D vector field $\\vec F(x,y,z) = \\left(${P}, ${Q}, ${R}\\right)$ at the point $(${x0}, ${y0}, ${z0})$.`,
      answer: { kind: 'number', value: String(val) },
      solution: [
        { text: 'Compute partial derivatives $\\frac{\\partial P}{\\partial x} = ' + `${2 * a}xy` + '$, $\\frac{\\partial Q}{\\partial y} = ' + `${b}z` + '$, $\\frac{\\partial R}{\\partial z} = ' + `${2 * c}zx` + '$:' },
        { text: `Substitute $(${x0}, ${y0}, ${z0})$ and add:`, tex: `\\nabla \\cdot \\vec F = ${val}` },
      ],
      hints: HINTS_CALC,
      inputHint: NUMBER_HINT,
    }
  }

  const a = rng.intExcept(-5, 5, [0])
  const b = rng.intExcept(-5, 5, [0])
  const c = rng.intExcept(-5, 5, [0])
  const val = a + b + c
  const P = polyTerm(a, 'x')
  const Q = polyTerm(b, 'y')
  const R = polyTerm(c, 'z')

  return {
    statement: `Find the divergence $\\nabla \\cdot \\vec F$ of the scaled position field $\\vec F(x,y,z) = \\left(${P}, ${Q}, ${R}\\right)$.`,
    answer: { kind: 'number', value: String(val) },
    solution: [
      { text: 'Compute $\\frac{\\partial P}{\\partial x} = ' + a + '$, $\\frac{\\partial Q}{\\partial y} = ' + b + '$, $\\frac{\\partial R}{\\partial z} = ' + c + '$:' },
      { text: 'Sum the partial derivatives:', tex: `\\nabla \\cdot \\vec F = ${joinTerms([String(a), String(b), String(c)])} = ${val}` },
    ],
    hints: HINTS_CALC,
    inputHint: NUMBER_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const shape = rng.pick(['div_expr', 'incompressible_k', 'source_sink_choice'] as const)

  if (shape === 'div_expr') {
    const a = rng.intExcept(-4, 4, [0])
    const c = rng.intExcept(-4, 4, [0])
    const e = rng.intExcept(-4, 4, [0])
    const P = polyTerm(a, 'x^2')
    const Q = polyTerm(c, 'y^2')
    const R = polyTerm(e, 'z^2')
    const exprValue = joinTerms([polyTerm(2 * a, 'x'), polyTerm(2 * c, 'y'), polyTerm(2 * e, 'z')])

    return {
      statement: `Find the divergence $\\nabla \\cdot \\vec F$ of the vector field $\\vec F(x,y,z) = \\left(${P}, ${Q}, ${R}\\right)$ as an expression.`,
      answer: { kind: 'expression', value: exprValue, variables: ['x', 'y', 'z'] },
      solution: [
        { text: 'Differentiate each component with respect to its corresponding variable:' },
        { text: 'Compute:', tex: `\\nabla \\cdot \\vec F = \\frac{\\partial}{\\partial x}\\left(${P}\\right) + \\frac{\\partial}{\\partial y}\\left(${Q}\\right) + \\frac{\\partial}{\\partial z}\\left(${R}\\right) = ${exprValue}` },
      ],
      hints: HINTS_EXPR,
      inputHint: EXPR_HINT,
    }
  }

  if (shape === 'incompressible_k') {
    const a = rng.intExcept(-6, 6, [0])
    const c = rng.intExcept(-6, 6, [0])
    const b = rng.int(-4, 4)
    const d = rng.int(-4, 4)
    const kVal = -(a + c)
    const P = joinTerms([polyTerm(a, 'x'), polyTerm(b, 'y')])
    const Q = joinTerms([polyTerm(c, 'y'), polyTerm(d, 'z')])
    const R = 'k z'

    return {
      statement: `Find the value of the constant $k$ such that the vector field $\\vec F(x,y,z) = \\left(${P}, ${Q}, ${R}\\right)$ is incompressible (solenoidal, so $\\nabla \\cdot \\vec F = 0$).`,
      answer: { kind: 'number', value: String(kVal) },
      solution: [
        { text: 'Compute $\\nabla \\cdot \\vec F = \\frac{\\partial P}{\\partial x} + \\frac{\\partial Q}{\\partial y} + \\frac{\\partial R}{\\partial z} = ' + joinTerms([String(a), String(c)]) + ' + k = 0$:' },
        { text: 'Solve for $k$:', tex: `k = ${kVal}` },
      ],
      hints: HINTS_EXPR,
      inputHint: NUMBER_HINT,
    }
  }

  const a = rng.intExcept(-3, 3, [0])
  const b = rng.intExcept(-3, 3, [0])
  const x0 = rng.intExcept(-2, 2, [0])
  const y0 = rng.intExcept(-2, 2, [0])
  const divVal = (a + b) * x0
  let correctId: string
  let correctLabel: string
  if (divVal > 0) {
    correctId = 'source'
    correctLabel = 'A source (outward expansion)'
  } else if (divVal < 0) {
    correctId = 'sink'
    correctLabel = 'A sink (inward compression)'
  } else {
    correctId = 'incompressible'
    correctLabel = 'Incompressible (divergence is zero)'
  }

  const options: ChoiceOption[] = rng.shuffle([
    { id: 'source', label: 'A source (outward expansion)' },
    { id: 'sink', label: 'A sink (inward compression)' },
    { id: 'incompressible', label: 'Incompressible (divergence is zero)' },
  ])

  const pComponent = a === 1 ? '\\frac{x^2}{2}' : `${coefPrefix(a)}\\frac{x^2}{2}`
  const qComponent = b === 1 ? 'xy' : `${coefPrefix(b)}xy`
  const sumAx = joinTerms([polyTerm(a, 'x'), polyTerm(b, 'x')])
  const combinedAx = polyTerm(a + b, 'x')

  return {
    statement: `At the point $P(${x0}, ${y0})$, does the vector field $\\vec F(x,y) = ` +
      `\\left(${pComponent}, ${qComponent}\\right)$ act as a source, a sink, or is it incompressible?`,
    answer: { kind: 'choice', options, correctId },
    solution: [
      { text: `Compute $\\nabla \\cdot \\vec F = ${sumAx} = ${combinedAx}$. At $(${x0}, ${y0})$, $\\nabla \\cdot \\vec F = ${divVal}$.` },
      { text: `Since the divergence is ${divVal > 0 ? 'positive' : divVal < 0 ? 'negative' : 'zero'}, it is ${correctLabel.toLowerCase()}.` },
    ],
    hints: HINTS_SOURCE_SINK,
  }
}

function tier3(rng: Rng): Problem {
  const shape = rng.pick(['high_poly_point', 'div_of_curl', 'expr_mixed'] as const)

  if (shape === 'high_poly_point') {
    const a = rng.intExcept(-3, 3, [0])
    const b = rng.intExcept(-3, 3, [0])
    const c = rng.intExcept(-3, 3, [0])
    const x0 = rng.intExcept(-2, 2, [0])
    const y0 = rng.intExcept(-2, 2, [0])
    const z0 = rng.intExcept(-2, 2, [0])
    const P = polyTerm(a, 'x^3 y')
    const Q = polyTerm(b, 'y^3 z')
    const R = polyTerm(c, 'z^3 x')
    const val = 3 * a * (x0 ** 2) * y0 + 3 * b * (y0 ** 2) * z0 + 3 * c * (z0 ** 2) * x0

    return {
      statement: `Find the divergence $\\nabla \\cdot \\vec F$ of the 3D field $\\vec F(x,y,z) = \\left(${P}, ${Q}, ${R}\\right)$ at the point $(${x0}, ${y0}, ${z0})$.`,
      answer: { kind: 'number', value: String(val) },
      solution: [
        { text: 'Compute partial derivatives $\\frac{\\partial P}{\\partial x} = ' + `${3 * a}x^2 y` + '$, $\\frac{\\partial Q}{\\partial y} = ' + `${3 * b}y^2 z` + '$, $\\frac{\\partial R}{\\partial z} = ' + `${3 * c}z^2 x` + '$:' },
        { text: `Evaluate at $(${x0}, ${y0}, ${z0})$:`, tex: `\\nabla \\cdot \\vec F(${x0}, ${y0}, ${z0}) = ${val}` },
      ],
      hints: HINTS_CALC,
      inputHint: NUMBER_HINT,
    }
  }

  if (shape === 'div_of_curl') {
    const a = rng.intExcept(-4, 4, [0])
    const b = rng.intExcept(-4, 4, [0])
    const c = rng.intExcept(-4, 4, [0])
    const P = polyTerm(a, 'x^2 y z')
    const Q = polyTerm(b, 'x y^2 z')
    const R = polyTerm(c, 'x y z^2')

    return {
      statement: `For the vector field $\\vec F(x,y,z) = \\left(${P}, ${Q}, ${R}\\right)$, find the divergence of its curl, $\\nabla \\cdot (\\nabla \\times \\vec F)$.`,
      answer: { kind: 'number', value: '0' },
      solution: [
        { text: 'By vector calculus identity, the divergence of the curl of any smooth vector field is identically zero:' },
        { text: 'Result:', tex: '\\nabla \\cdot (\\nabla \\times \\vec F) = 0' },
      ],
      hints: [
        'Recall the vector identity for divergence of curl.',
        'The divergence of any curl field is always zero.',
      ],
      inputHint: NUMBER_HINT,
    }
  }

  const a = rng.intExcept(-4, 4, [0])
  const b = rng.intExcept(-4, 4, [0])
  const c = rng.intExcept(-4, 4, [0])
  const P = polyTerm(a, 'x y^2')
  const Q = polyTerm(b, 'y z^2')
  const R = polyTerm(c, 'z x^2')
  const exprValue = joinTerms([polyTerm(a, 'y^2'), polyTerm(b, 'z^2'), polyTerm(c, 'x^2')])

  return {
    statement: `Find the divergence $\\nabla \\cdot \\vec F$ of the 3D field $\\vec F(x,y,z) = \\left(${P}, ${Q}, ${R}\\right)$ as an expression.`,
    answer: { kind: 'expression', value: exprValue, variables: ['x', 'y', 'z'] },
    solution: [
      { text: 'Differentiate each component with respect to its variable:' },
      { text: 'Compute:', tex: `\\nabla \\cdot \\vec F = ${exprValue}` },
    ],
    hints: HINTS_EXPR,
    inputHint: EXPR_HINT,
  }
}

export const template: SkillTemplate = {
  skillId: 'divergence',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 105 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
