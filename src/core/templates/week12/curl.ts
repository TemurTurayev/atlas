import { coefPrefix, joinTerms } from '../../math/latex'
import { ordinal } from '../../math/complex'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'The curl of a 3D vector field $\\vec F = (P, Q, R)$ is $\\nabla \\times \\vec F = ' +
    '\\left(\\frac{\\partial R}{\\partial y} - \\frac{\\partial Q}{\\partial z}, \\, ' +
    '\\frac{\\partial P}{\\partial z} - \\frac{\\partial R}{\\partial x}, \\, ' +
    '\\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y}\\right)$.',
  'It can be computed as the symbolic determinant of a $3 \\times 3$ matrix with top row $(\\mathbf{i}, \\mathbf{j}, \\mathbf{k})$, ' +
    'second row $(\\partial_x, \\partial_y, \\partial_z)$, and bottom row $(P, Q, R)$.',
  'Physical meaning: $\\nabla \\times \\vec F$ measures local rotation (vorticity). ' +
    'If $\\nabla \\times \\vec F = \\mathbf{0}$, the field is irrotational (conservative).',
  'The rotation field $\\vec F = (-y, x, 0)$ has constant curl $\\nabla \\times \\vec F = (0, 0, 2)$; ' +
    'for a rigid rotation $\\vec F = \\vec \\omega \\times \\vec r$, $\\nabla \\times \\vec F = 2\\vec \\omega$.',
  'The curl of any gradient field is identically zero: $\\nabla \\times (\\nabla f) = \\mathbf{0}$ for any smooth scalar potential $f(x,y,z)$.',
  'Common mistakes: swapping the sign of the y-component (the middle component); mixing up which partial derivative subtracts from which.',
].join('\n')

const HINTS_CURL = [
  'Compute the components using the determinant formula: (dR/dy - dQ/dz, dP/dz - dR/dx, dQ/dx - dP/dy).',
  'Differentiate each component, then substitute the coordinates of the given point.',
]
const HINTS_IRROTATIONAL = [
  'A field is irrotational if its curl is identically zero.',
  'Set the components of curl to zero and solve for the unknown parameter.',
]

const VECTOR_HINT = 'Three components (x, y, z) for the curl vector'
const EXPR_HINT = 'An expression in x, y, z'
const NUMBER_HINT = 'A single number; it may be negative or zero'

function polyTerm(coef: number, vars: string): string {
  if (coef === 0) return ''
  return `${coefPrefix(coef)}${vars}`
}

function tier1(rng: Rng): Problem {
  const shape = rng.pick(['rotation_field', 'simple_3d_point', 'curl_z_expr'] as const)

  if (shape === 'rotation_field') {
    const a = rng.intExcept(-4, 4, [0])
    const P = polyTerm(-a, 'y')
    const Q = polyTerm(a, 'x')

    return {
      statement: `Find the curl $\\nabla \\times \\vec F$ of the rotation field $\\vec F(x,y,z) = \\left(${P}, ${Q}, 0\\right)$.`,
      answer: { kind: 'vector', components: ['0', '0', String(2 * a)] },
      solution: [
        { text: 'Use the curl formula for $\\vec F = (P, Q, 0)$:' },
        { text: 'Compute:', tex: `\\nabla \\times \\vec F = \\left(0, 0, \\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y}\\right) = \\left(0, 0, ${a} - (${-a})\\right) = \\begin{pmatrix} 0 \\\\ 0 \\\\ ${2 * a} \\end{pmatrix}` },
      ],
      hints: HINTS_CURL,
      inputHint: VECTOR_HINT,
    }
  }

  if (shape === 'simple_3d_point') {
    const a = rng.intExcept(-4, 4, [0])
    const b = rng.intExcept(-4, 4, [0])
    const c = rng.intExcept(-4, 4, [0])
    const x0 = rng.int(-3, 3)
    const y0 = rng.int(-3, 3)
    const z0 = rng.int(-3, 3)
    const P = polyTerm(a, 'y')
    const Q = polyTerm(b, 'z')
    const R = polyTerm(c, 'x')
    const cx = -b
    const cy = -c
    const cz = -a

    return {
      statement: `Find the curl $\\nabla \\times \\vec F$ of the vector field $\\vec F(x,y,z) = \\left(${P}, ${Q}, ${R}\\right)$ at the point $(${x0}, ${y0}, ${z0})$.`,
      answer: { kind: 'vector', components: [String(cx), String(cy), String(cz)] },
      solution: [
        { text: 'Compute partial derivatives for each component of curl:' },
        { text: 'Evaluate:', tex: `\\nabla \\times \\vec F = \\begin{pmatrix} ${-b} \\\\ ${-c} \\\\ ${-a} \\end{pmatrix}` },
      ],
      hints: HINTS_CURL,
      inputHint: VECTOR_HINT,
    }
  }

  const b = rng.intExcept(-4, 4, [0])
  const c = rng.intExcept(-4, 4, [0])
  const P = polyTerm(b, 'y^2')
  const Q = polyTerm(c, 'x y')
  const zCoeff = c - 2 * b
  const exprVal = polyTerm(zCoeff, 'y')
  const stepTex = joinTerms([polyTerm(c, 'y'), polyTerm(-2 * b, 'y')])

  return {
    statement: `Find the 3rd component (z-component) of $\\nabla \\times \\vec F$ as an expression for $\\vec F(x,y,z) = \\left(${P}, ${Q}, 0\\right)$.`,
    answer: { kind: 'expression', value: exprVal, variables: ['x', 'y', 'z'] },
    solution: [
      { text: 'The z-component of curl is $\\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y}$:' },
      { text: 'Compute:', tex: `(\\nabla \\times \\vec F)_3 = ${stepTex} = ${exprVal}` },
    ],
    hints: HINTS_CURL,
    inputHint: EXPR_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const shape = rng.pick(['poly_point', 'irrotational_choice', 'curl_gradient'] as const)

  if (shape === 'poly_point') {
    const a = rng.intExcept(-4, 4, [0])
    const b = rng.intExcept(-4, 4, [0])
    const c = rng.intExcept(-4, 4, [0])
    const x0 = rng.intExcept(-3, 3, [0])
    const y0 = rng.intExcept(-3, 3, [0])
    const z0 = rng.intExcept(-3, 3, [0])
    const P = polyTerm(a, 'y z')
    const Q = polyTerm(b, 'x z')
    const R = polyTerm(c, 'x y')
    const cx = (c - b) * x0
    const cy = (a - c) * y0
    const cz = (b - a) * z0

    const k1 = c - b
    const k2 = a - c
    const k3 = b - a
    const curlExpr = `\\left(${joinTerms([polyTerm(k1, 'x')])}, ${joinTerms([polyTerm(k2, 'y')])}, ${joinTerms([polyTerm(k3, 'z')])}\\right)`

    return {
      statement: `Find the curl $\\nabla \\times \\vec F$ of the 3D field $\\vec F(x,y,z) = \\left(${P}, ${Q}, ${R}\\right)$ at the point $(${x0}, ${y0}, ${z0})$.`,
      answer: { kind: 'vector', components: [String(cx), String(cy), String(cz)] },
      solution: [
        { text: 'Compute components of $\\nabla \\times \\vec F = ' + curlExpr + '$:' },
        { text: `Substitute $(${x0}, ${y0}, ${z0})$:`, tex: `\\nabla \\times \\vec F(${x0}, ${y0}, ${z0}) = \\begin{pmatrix} ${cx} \\\\ ${cy} \\\\ ${cz} \\end{pmatrix}` },
      ],
      hints: HINTS_CURL,
      inputHint: VECTOR_HINT,
    }
  }

  if (shape === 'irrotational_choice') {
    const a = rng.pick([1, 2, 3, 4, 5])
    const b = rng.pick([1, 2, 3, 4])
    const aTerm = a === 1 ? 'x^2' : `${a}x^2`
    const options: ChoiceOption[] = rng.shuffle([
      { id: 'conservative', label: `$\\vec F = (${2 * a}x y + z, ${aTerm}, x)$` },
      { id: 'field_a', label: '$\\vec F = (-y, x, 0)$' },
      { id: 'field_b', label: `$\\vec F = (${b}y z, ${2 * b}x z, x y)$` },
      { id: 'field_c', label: `$\\vec F = (${b}y^2, x, z)$` },
    ])

    return {
      statement: 'Which of the following 3D vector fields is irrotational (conservative, so $\\nabla \\times \\vec F = \\mathbf{0}$)?',
      answer: { kind: 'choice', options, correctId: 'conservative' },
      solution: [
        { text: 'Compute curl for each candidate; the conservative field has $\\nabla \\times \\vec F = \\mathbf{0}$.' },
      ],
      hints: HINTS_IRROTATIONAL,
    }
  }

  const a = rng.intExcept(-4, 4, [0])
  const b = rng.intExcept(-4, 4, [0])
  const c = rng.intExcept(-4, 4, [0])
  const fExpr = joinTerms([polyTerm(a, 'x^2 y'), polyTerm(b, 'y z^3'), polyTerm(c, 'z^2 x')])

  return {
    statement: `Let $f(x,y,z) = ${fExpr}$ be a scalar potential. Compute the curl of its gradient field, $\\nabla \\times (\\nabla f)$.`,
    answer: { kind: 'vector', components: ['0', '0', '0'] },
    solution: [
      { text: 'The curl of any gradient field is identically zero for any smooth potential $f$:' },
      { text: 'Result:', tex: '\\nabla \\times (\\nabla f) = \\mathbf{0} = \\begin{pmatrix} 0 \\\\ 0 \\\\ 0 \\end{pmatrix}' },
    ],
    hints: HINTS_IRROTATIONAL,
    inputHint: VECTOR_HINT,
  }
}

function tier3(rng: Rng): Problem {
  const shape = rng.pick(['param_a', 'component_expr', 'quadratic_point'] as const)

  if (shape === 'param_a') {
    const targetA = rng.pick([2, 3, 4, 5])
    const P = 'a y z + x'
    const Q = `${targetA}x z + y`
    const R = `${targetA}x y + z`

    return {
      statement: `Find the constant $a$ such that the vector field $\\vec F(x,y,z) = \\left(${P}, ${Q}, ${R}\\right)$ is irrotational (so $\\nabla \\times \\vec F = \\mathbf{0}$).`,
      answer: { kind: 'number', value: String(targetA) },
      solution: [
        { text: 'Set the z-component of curl to zero: $\\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y} = ' + targetA + 'z - a z = 0$:' },
        { text: 'Solve for $a$:', tex: `a = ${targetA}` },
      ],
      hints: HINTS_IRROTATIONAL,
      inputHint: NUMBER_HINT,
    }
  }

  if (shape === 'component_expr') {
    const k = rng.pick([1, 2, 3])
    const b = rng.intExcept(-3, 3, [0])
    const c = rng.intExcept(-3, 3, [0])
    const P = polyTerm(b, 'x^2')
    const Q = polyTerm(b, 'y^2 z')
    const R = polyTerm(c, 'y z^2')
    let exprVal: string
    if (k === 1) exprVal = joinTerms([polyTerm(c, 'z^2'), polyTerm(-b, 'y^2')])
    else if (k === 2) exprVal = '0'
    else exprVal = '0'

    return {
      statement: `Find the ${ordinal(k)} component of $\\nabla \\times \\vec F$ as an expression for $\\vec F(x,y,z) = \\left(${P}, ${Q}, ${R}\\right)$.`,
      answer: { kind: 'expression', value: exprVal, variables: ['x', 'y', 'z'] },
      solution: [
        { text: `Compute the ${ordinal(k)} component of $\\nabla \\times \\vec F$:` },
        { text: 'Evaluate:', tex: `(\\nabla \\times \\vec F)_{${k}} = ${exprVal}` },
      ],
      hints: HINTS_CURL,
      inputHint: EXPR_HINT,
    }
  }

  const a = rng.intExcept(-3, 3, [0])
  const b = rng.intExcept(-3, 3, [0])
  const c = rng.intExcept(-3, 3, [0])
  const x0 = rng.intExcept(-2, 2, [0])
  const y0 = rng.intExcept(-2, 2, [0])
  const z0 = rng.intExcept(-2, 2, [0])
  const P = polyTerm(a, 'y^2')
  const Q = polyTerm(b, 'z^2')
  const R = polyTerm(c, 'x^2')
  const cx = -2 * b * z0
  const cy = -2 * c * x0
  const cz = -2 * a * y0

  const c1 = polyTerm(-2 * b, 'z')
  const c2 = polyTerm(-2 * c, 'x')
  const c3 = polyTerm(-2 * a, 'y')
  const curlExpr = `\\left(${c1}, ${c2}, ${c3}\\right)`

  return {
    statement: `Find the curl $\\nabla \\times \\vec F$ of the 3D field $\\vec F(x,y,z) = \\left(${P}, ${Q}, ${R}\\right)$ at the point $(${x0}, ${y0}, ${z0})$.`,
    answer: { kind: 'vector', components: [String(cx), String(cy), String(cz)] },
    solution: [
      { text: 'Compute $\\nabla \\times \\vec F = ' + curlExpr + '$:' },
      { text: `Substitute $(${x0}, ${y0}, ${z0})$:`, tex: `\\nabla \\times \\vec F(${x0}, ${y0}, ${z0}) = \\begin{pmatrix} ${cx} \\\\ ${cy} \\\\ ${cz} \\end{pmatrix}` },
    ],
    hints: HINTS_CURL,
    inputHint: VECTOR_HINT,
  }
}

export const template: SkillTemplate = {
  skillId: 'curl',
  theory,
  expectedSeconds: { 1: 50, 2: 85, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
