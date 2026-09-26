import type { Rng } from '../../random/rng'
import { rat, ratToLatex } from '../../math/rational'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Polar coordinates $(r, \\theta)$ represent a point at distance $r \\ge 0$ and angle $\\theta$ from the origin.',
  'Conversion from Polar to Cartesian: $x = r \\cos\\theta$ and $y = r \\sin\\theta$.',
  'Conversion from Cartesian to Polar: $r = \\sqrt{x^2 + y^2}$ and $\\theta = \\operatorname{atan2}(y, x) \\in [0, 2\\pi)$.',
  'Distance between polar points $(r_1, \\theta_1)$ and $(r_2, \\theta_2)$: $d = \\sqrt{r_1^2 + r_2^2 - 2r_1 r_2 \\cos(\\theta_2 - \\theta_1)}$.',
  'Polar curves: $r = 2a \\cos\\theta$ is a circle $(x - a)^2 + y^2 = a^2$ of radius $a$ centered at $(a, 0)$.',
  'Common mistakes: using degrees instead of radians, or failing to add $\\pi$ when converting points in Quadrants 2 and 3.',
].join('\n')

interface AngleSpec {
  readonly thetaTex: string
  readonly rad: number
  readonly cosTex: string
  readonly sinTex: string
}

const STANDARD_ANGLES: readonly AngleSpec[] = [
  { thetaTex: '0', rad: 0, cosTex: '1', sinTex: '0' },
  { thetaTex: '\\frac{\\pi}{6}', rad: Math.PI / 6, cosTex: '\\frac{\\sqrt{3}}{2}', sinTex: '\\frac{1}{2}' },
  { thetaTex: '\\frac{\\pi}{4}', rad: Math.PI / 4, cosTex: '\\frac{\\sqrt{2}}{2}', sinTex: '\\frac{\\sqrt{2}}{2}' },
  { thetaTex: '\\frac{\\pi}{3}', rad: Math.PI / 3, cosTex: '\\frac{1}{2}', sinTex: '\\frac{\\sqrt{3}}{2}' },
  { thetaTex: '\\frac{\\pi}{2}', rad: Math.PI / 2, cosTex: '0', sinTex: '1' },
  { thetaTex: '\\frac{2\\pi}{3}', rad: (2 * Math.PI) / 3, cosTex: '-\\frac{1}{2}', sinTex: '\\frac{\\sqrt{3}}{2}' },
  { thetaTex: '\\frac{3\\pi}{4}', rad: (3 * Math.PI) / 4, cosTex: '-\\frac{\\sqrt{2}}{2}', sinTex: '\\frac{\\sqrt{2}}{2}' },
  { thetaTex: '\\frac{5\\pi}{6}', rad: (5 * Math.PI) / 6, cosTex: '-\\frac{\\sqrt{3}}{2}', sinTex: '\\frac{1}{2}' },
  { thetaTex: '\\pi', rad: Math.PI, cosTex: '-1', sinTex: '0' },
  { thetaTex: '\\frac{7\\pi}{6}', rad: (7 * Math.PI) / 6, cosTex: '-\\frac{\\sqrt{3}}{2}', sinTex: '-\\frac{1}{2}' },
  { thetaTex: '\\frac{5\\pi}{4}', rad: (5 * Math.PI) / 4, cosTex: '-\\frac{\\sqrt{2}}{2}', sinTex: '-\\frac{\\sqrt{2}}{2}' },
  { thetaTex: '\\frac{4\\pi}{3}', rad: (4 * Math.PI) / 3, cosTex: '-\\frac{1}{2}', sinTex: '-\\frac{\\sqrt{3}}{2}' },
  { thetaTex: '\\frac{3\\pi}{2}', rad: (3 * Math.PI) / 2, cosTex: '0', sinTex: '-1' },
  { thetaTex: '\\frac{5\\pi}{3}', rad: (5 * Math.PI) / 3, cosTex: '\\frac{1}{2}', sinTex: '-\\frac{\\sqrt{3}}{2}' },
  { thetaTex: '\\frac{7\\pi}{4}', rad: (7 * Math.PI) / 4, cosTex: '\\frac{\\sqrt{2}}{2}', sinTex: '-\\frac{\\sqrt{2}}{2}' },
  { thetaTex: '\\frac{11\\pi}{6}', rad: (11 * Math.PI) / 6, cosTex: '\\frac{\\sqrt{3}}{2}', sinTex: '-\\frac{1}{2}' },
]

interface ExactPointPair {
  readonly r: number
  readonly rTex: string
  readonly thetaTex: string
  readonly xTex: string
  readonly yTex: string
}

const EXACT_POINTS: readonly ExactPointPair[] = [
  { r: 2, rTex: '2', thetaTex: '0', xTex: '2', yTex: '0' },
  { r: 2, rTex: '2', thetaTex: '\\frac{\\pi}{6}', xTex: '\\sqrt{3}', yTex: '1' },
  { r: 4, rTex: '4', thetaTex: '\\frac{\\pi}{6}', xTex: '2\\sqrt{3}', yTex: '2' },
  { r: 2, rTex: '2', thetaTex: '\\frac{\\pi}{3}', xTex: '1', yTex: '\\sqrt{3}' },
  { r: 4, rTex: '4', thetaTex: '\\frac{\\pi}{3}', xTex: '2', yTex: '2\\sqrt{3}' },
  { r: 3, rTex: '3', thetaTex: '\\frac{\\pi}{2}', xTex: '0', yTex: '3' },
  { r: 2, rTex: '2', thetaTex: '\\frac{2\\pi}{3}', xTex: '-1', yTex: '\\sqrt{3}' },
  { r: 4, rTex: '4', thetaTex: '\\frac{2\\pi}{3}', xTex: '-2', yTex: '2\\sqrt{3}' },
  { r: 2, rTex: '2', thetaTex: '\\frac{5\\pi}{6}', xTex: '-\\sqrt{3}', yTex: '1' },
  { r: 4, rTex: '4', thetaTex: '\\frac{5\\pi}{6}', xTex: '-2\\sqrt{3}', yTex: '2' },
  { r: 5, rTex: '5', thetaTex: '\\pi', xTex: '-5', yTex: '0' },
  { r: 2, rTex: '2', thetaTex: '\\frac{7\\pi}{6}', xTex: '-\\sqrt{3}', yTex: '-1' },
  { r: 4, rTex: '4', thetaTex: '\\frac{7\\pi}{6}', xTex: '-2\\sqrt{3}', yTex: '-2' },
  { r: 2, rTex: '2', thetaTex: '\\frac{4\\pi}{3}', xTex: '-1', yTex: '-\\sqrt{3}' },
  { r: 4, rTex: '4', thetaTex: '\\frac{4\\pi}{3}', xTex: '-2', yTex: '-2\\sqrt{3}' },
  { r: 6, rTex: '6', thetaTex: '\\frac{3\\pi}{2}', xTex: '0', yTex: '-6' },
  { r: 2, rTex: '2', thetaTex: '\\frac{5\\pi}{3}', xTex: '1', yTex: '-\\sqrt{3}' },
  { r: 4, rTex: '4', thetaTex: '\\frac{5\\pi}{3}', xTex: '2', yTex: '-2\\sqrt{3}' },
  { r: 2, rTex: '2', thetaTex: '\\frac{11\\pi}{6}', xTex: '\\sqrt{3}', yTex: '-1' },
  { r: 4, rTex: '4', thetaTex: '\\frac{11\\pi}{6}', xTex: '2\\sqrt{3}', yTex: '-2' },
]

function cartesianToPolar(rng: Rng): Problem {
  const pt = rng.pick(EXACT_POINTS)
  const label = rng.pick(['P', 'Q', 'R', 'A', 'B'])

  return {
    statement: `Convert the Cartesian point ${label} $= (${pt.xTex}, ${pt.yTex})$ to polar coordinates $(r, \\theta)$ with $r > 0$ and $\\theta \\in [0, 2\\pi)$.`,
    answer: { kind: 'vector', components: [pt.rTex, pt.thetaTex] },
    solution: [
      { text: 'Calculate the radial distance:', tex: `r = \\sqrt{x^2 + y^2} = \\sqrt{(${pt.xTex})^2 + (${pt.yTex})^2} = ${pt.rTex}` },
      { text: 'Find the polar angle:', tex: `\\theta = \\operatorname{atan2}(${pt.yTex}, ${pt.xTex}) = ${pt.thetaTex}` },
    ],
    hints: [
      'Use $r = \\sqrt{x^2 + y^2}$ to find the radius.',
      `Determine the angle $\\theta \\in [0, 2\\pi)$ matching the quadrant of $(${pt.xTex}, ${pt.yTex})$.`,
    ],
    inputHint: 'Enter two components: r and theta.',
  }
}

function polarToCartesian(rng: Rng): Problem {
  const pt = rng.pick(EXACT_POINTS)
  const label = rng.pick(['P', 'Q', 'R', 'M', 'N'])

  return {
    statement: `Convert the polar point ${label} $= (${pt.rTex}, ${pt.thetaTex})$ to Cartesian coordinates $(x, y)$.`,
    answer: { kind: 'vector', components: [pt.xTex, pt.yTex] },
    solution: [
      { text: 'Calculate the x-coordinate:', tex: `x = r \\cos\\theta = ${pt.rTex} \\cdot \\cos\\left(${pt.thetaTex}\\right) = ${pt.xTex}` },
      { text: 'Calculate the y-coordinate:', tex: `y = r \\sin\\theta = ${pt.rTex} \\cdot \\sin\\left(${pt.thetaTex}\\right) = ${pt.yTex}` },
    ],
    hints: [
      'Use $x = r \\cos\\theta$ and $y = r \\sin\\theta$.',
      `Evaluate $\\cos\\left(${pt.thetaTex}\\right)$ and $\\sin\\left(${pt.thetaTex}\\right)$ using standard angles.`,
    ],
    inputHint: 'Enter two components: x and y.',
  }
}

function polarRadiusOrAngle(rng: Rng): Problem {
  const pt = rng.pick(EXACT_POINTS)
  const askRadius = rng.chance(0.5)

  if (askRadius) {
    return {
      statement: `Find the polar radius $r > 0$ for the point with Cartesian coordinates $(${pt.xTex}, ${pt.yTex})$.`,
      answer: { kind: 'number', value: pt.rTex },
      solution: [
        { text: 'Apply the formula $r = \\sqrt{x^2 + y^2}$:' },
        { text: 'Substitute coordinates:', tex: `r = \\sqrt{(${pt.xTex})^2 + (${pt.yTex})^2} = ${pt.rTex}` },
      ],
      hints: [
        'Use $r = \\sqrt{x^2 + y^2}$.',
        `Square both coordinates and take the square root to get $r = ${pt.rTex}$.`,
      ],
    }
  }

  return {
    statement: `Find the polar angle $\\theta \\in [0, 2\\pi)$ for the point with Cartesian coordinates $(${pt.xTex}, ${pt.yTex})$.`,
    answer: { kind: 'number', value: pt.thetaTex },
    solution: [
      { text: 'Identify the angle $\\theta \\in [0, 2\\pi)$ satisfying $\\tan\\theta = \\frac{y}{x}$ in the correct quadrant:' },
      { text: 'Calculate angle:', tex: `\\theta = ${pt.thetaTex}` },
    ],
    hints: [
      'Use $\\tan\\theta = \\frac{y}{x}$ and identify the quadrant.',
      `The angle in $[0, 2\\pi)$ is $${pt.thetaTex}$.`,
    ],
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return cartesianToPolar(rng)
  if (choice === 2) return polarToCartesian(rng)
  return polarRadiusOrAngle(rng)
}

function polarDistance(rng: Rng): Problem {
  const item = rng.pick([
    { r1: 3, r1Tex: '3', t1Tex: '0', r2: 4, r2Tex: '4', t2Tex: '\\frac{\\pi}{2}', dTex: '5', diffTex: '\\frac{\\pi}{2}' },
    { r1: 2, r1Tex: '2', t1Tex: '\\frac{\\pi}{6}', r2: 2, r2Tex: '2', t2Tex: '\\frac{\\pi}{2}', dTex: '2', diffTex: '\\frac{\\pi}{3}' },
    { r1: 3, r1Tex: '3', t1Tex: '\\frac{\\pi}{4}', r2: 3, r2Tex: '3', t2Tex: '\\frac{3\\pi}{4}', dTex: '3\\sqrt{2}', diffTex: '\\frac{\\pi}{2}' },
    { r1: 2, r1Tex: '2', t1Tex: '0', r2: 4, r2Tex: '4', t2Tex: '\\pi', dTex: '6', diffTex: '\\pi' },
    { r1: 3, r1Tex: '3', t1Tex: '\\frac{\\pi}{3}', r2: 5, r2Tex: '5', t2Tex: '\\frac{\\pi}{3}', dTex: '2', diffTex: '0' },
    { r1: 5, r1Tex: '5', t1Tex: '\\frac{\\pi}{6}', r2: 12, r2Tex: '12', t2Tex: '\\frac{2\\pi}{3}', dTex: '13', diffTex: '\\frac{\\pi}{2}' },
    { r1: 1, r1Tex: '1', t1Tex: '0', r2: 1, r2Tex: '1', t2Tex: '\\frac{2\\pi}{3}', dTex: '\\sqrt{3}', diffTex: '\\frac{2\\pi}{3}' },
    { r1: 2, r1Tex: '2', t1Tex: '\\frac{\\pi}{3}', r2: 2, r2Tex: '2', t2Tex: '\\pi', dTex: '2\\sqrt{3}', diffTex: '\\frac{2\\pi}{3}' },
    { r1: 4, r1Tex: '4', t1Tex: '\\frac{\\pi}{6}', r2: 3, r2Tex: '3', t2Tex: '\\frac{5\\pi}{6}', dTex: '\\sqrt{37}', diffTex: '\\frac{2\\pi}{3}' },
    { r1: 6, r1Tex: '6', t1Tex: '\\frac{\\pi}{2}', r2: 8, r2Tex: '8', t2Tex: '\\pi', dTex: '10', diffTex: '\\frac{\\pi}{2}' },
    { r1: 2, r1Tex: '2', t1Tex: '0', r2: 2, r2Tex: '2', t2Tex: '\\frac{\\pi}{3}', dTex: '2', diffTex: '\\frac{\\pi}{3}' },
    { r1: 5, r1Tex: '5', t1Tex: '\\frac{\\pi}{4}', r2: 5, r2Tex: '5', t2Tex: '\\frac{7\\pi}{4}', dTex: '5\\sqrt{2}', diffTex: '\\frac{3\\pi}{2}' },
    { r1: 3, r1Tex: '3', t1Tex: '\\frac{\\pi}{2}', r2: 3, r2Tex: '3', t2Tex: '\\frac{7\\pi}{6}', dTex: '3\\sqrt{3}', diffTex: '\\frac{2\\pi}{3}' },
    { r1: 4, r1Tex: '4', t1Tex: '0', r2: 4, r2Tex: '4', t2Tex: '\\frac{2\\pi}{3}', dTex: '4\\sqrt{3}', diffTex: '\\frac{2\\pi}{3}' },
  ])

  return {
    statement: `Calculate the distance $d$ between the two polar points $A = (${item.r1Tex}, ${item.t1Tex})$ and $B = (${item.r2Tex}, ${item.t2Tex})$.`,
    answer: { kind: 'number', value: item.dTex },
    solution: [
      { text: 'Apply the polar distance formula (Law of Cosines):', tex: 'd = \\sqrt{r_1^2 + r_2^2 - 2 r_1 r_2 \\cos(\\theta_2 - \\theta_1)}' },
      { text: `Substitute values:`, tex: `d = \\sqrt{${item.r1}^2 + ${item.r2}^2 - 2(${item.r1})(${item.r2}) \\cos\\left(${item.diffTex}\\right)} = ${item.dTex}` },
    ],
    hints: [
      'Use $d = \\sqrt{r_1^2 + r_2^2 - 2r_1 r_2 \\cos(\\theta_2 - \\theta_1)}$.',
      `Evaluate the angle difference $\\Delta\\theta = ${item.diffTex}$ and simplify.`,
    ],
  }
}

function polarCurveChoice(rng: Rng): Problem {
  const a = rng.pick([1, 2, 3, 4, 5, 6, 7, 8])
  const variant = rng.pick([1, 2, 3, 4])

  if (variant === 1) {
    const doubleA = 2 * a
    const aSq = a * a
    const correctId = 'circle_x_axis'
    const options = rng.shuffle([
      { id: correctId, label: `A circle $(x - ${a})^2 + y^2 = ${aSq}$ of radius $${a}$ centered at $(${a}, 0)$` },
      { id: 'circle_y_axis', label: `A circle $x^2 + (y - ${a})^2 = ${aSq}$ of radius $${a}$ centered at $(0, ${a})$` },
      { id: 'horizontal_line', label: `A horizontal line $y = ${doubleA}$` },
      { id: 'cardioid', label: `A cardioid $r = ${a}(1 + \\cos\\theta)$` },
    ])
    return {
      statement: `Identify the Cartesian curve represented by the polar equation $r = ${doubleA} \\cos\\theta$.`,
      answer: { kind: 'choice', options, correctId },
      solution: [
        { text: 'Multiply both sides by $r$:', tex: `r^2 = ${doubleA} r \\cos\\theta \\implies x^2 + y^2 = ${doubleA} x` },
        { text: 'Complete the square:', tex: `(x - ${a})^2 + y^2 = ${aSq}` },
      ],
      hints: [
        'Multiply both sides by $r$ to get $r^2 = 2a r \\cos\\theta$.',
        'Substitute $r^2 = x^2 + y^2$ and $r \\cos\\theta = x$, then complete the square.',
      ],
    }
  }

  if (variant === 2) {
    const doubleA = 2 * a
    const aSq = a * a
    const correctId = 'circle_y_axis'
    const options = rng.shuffle([
      { id: correctId, label: `A circle $x^2 + (y - ${a})^2 = ${aSq}$ of radius $${a}$ centered at $(0, ${a})$` },
      { id: 'circle_x_axis', label: `A circle $(x - ${a})^2 + y^2 = ${aSq}$ of radius $${a}$ centered at $(${a}, 0)$` },
      { id: 'vertical_line', label: `A vertical line $x = ${doubleA}$` },
      { id: 'rose_curve', label: `A rose curve $r = ${a} \\sin(2\\theta)$` },
    ])
    return {
      statement: `Identify the Cartesian curve represented by the polar equation $r = ${doubleA} \\sin\\theta$.`,
      answer: { kind: 'choice', options, correctId },
      solution: [
        { text: 'Multiply both sides by $r$:', tex: `r^2 = ${doubleA} r \\sin\\theta \\implies x^2 + y^2 = ${doubleA} y` },
        { text: 'Complete the square:', tex: `x^2 + (y - ${a})^2 = ${aSq}` },
      ],
      hints: [
        'Multiply both sides by $r$ to get $r^2 = 2a r \\sin\\theta$.',
        'Substitute $r^2 = x^2 + y^2$ and $r \\sin\\theta = y$, then complete the square.',
      ],
    }
  }

  if (variant === 3) {
    const correctId = 'vertical_line'
    const options = rng.shuffle([
      { id: correctId, label: `A vertical line $x = ${a}$` },
      { id: 'horizontal_line', label: `A horizontal line $y = ${a}$` },
      { id: 'circle_origin', label: `A circle $x^2 + y^2 = ${a * a}$` },
      { id: 'parabola', label: `A parabola $y^2 = 4${a}x$` },
    ])
    return {
      statement: `Identify the Cartesian curve represented by the polar equation $r \\cos\\theta = ${a}$.`,
      answer: { kind: 'choice', options, correctId },
      solution: [
        { text: 'Recall that $x = r \\cos\\theta$, so $r \\cos\\theta = ${a}$ directly gives the line $x = ${a}$.' },
      ],
      hints: [
        'Use the relationship $x = r \\cos\\theta$.',
        'Substitute $x$ for $r \\cos\\theta$ to get $x = a$.',
      ],
    }
  }

  const correctId = 'horizontal_line'
  const options = rng.shuffle([
    { id: correctId, label: `A horizontal line $y = ${a}$` },
    { id: 'vertical_line', label: `A vertical line $x = ${a}$` },
    { id: 'circle_origin', label: `A circle $x^2 + y^2 = ${a * a}$` },
    { id: 'line_through_origin', label: `A line through the origin $y = x$` },
  ])
  return {
    statement: `Identify the Cartesian curve represented by the polar equation $r \\sin\\theta = ${a}$.`,
    answer: { kind: 'choice', options, correctId },
    solution: [
      { text: 'Recall that $y = r \\sin\\theta$, so $r \\sin\\theta = ${a}$ directly gives the line $y = ${a}$.' },
    ],
    hints: [
      'Use the relationship $y = r \\sin\\theta$.',
      'Substitute $y$ for $r \\sin\\theta$ to get $y = a$.',
    ],
  }
}

function polarTriangleArea(rng: Rng): Problem {
  const item = rng.pick([
    { r1: 4, r2: 6, t1Tex: '0', t2Tex: '\\frac{\\pi}{6}', areaTex: '6' },
    { r1: 4, r2: 4, t1Tex: '\\frac{\\pi}{6}', t2Tex: '\\frac{\\pi}{2}', areaTex: '4\\sqrt{3}' },
    { r1: 6, r2: 6, t1Tex: '\\frac{\\pi}{4}', t2Tex: '\\frac{3\\pi}{4}', areaTex: '18' },
    { r1: 2, r2: 8, t1Tex: '\\frac{\\pi}{3}', t2Tex: '\\frac{2\\pi}{3}', areaTex: '4\\sqrt{3}' },
    { r1: 5, r2: 4, t1Tex: '0', t2Tex: '\\frac{\\pi}{2}', areaTex: '10' },
    { r1: 3, r2: 8, t1Tex: '0', t2Tex: '\\frac{\\pi}{6}', areaTex: '6' },
    { r1: 4, r2: 5, t1Tex: '\\frac{\\pi}{4}', t2Tex: '\\frac{3\\pi}{4}', areaTex: '10' },
    { r1: 2, r2: 6, t1Tex: '\\frac{\\pi}{6}', t2Tex: '\\frac{2\\pi}{3}', areaTex: '6' },
    { r1: 8, r2: 3, t1Tex: '0', t2Tex: '\\frac{\\pi}{2}', areaTex: '12' },
    { r1: 6, r2: 4, t1Tex: '\\frac{\\pi}{3}', t2Tex: '\\frac{5\\pi}{6}', areaTex: '12' },
    { r1: 10, r2: 6, t1Tex: '0', t2Tex: '\\frac{\\pi}{6}', areaTex: '15' },
    { r1: 4, r2: 8, t1Tex: '\\frac{\\pi}{4}', t2Tex: '\\frac{3\\pi}{4}', areaTex: '16' },
    { r1: 3, r2: 4, t1Tex: '\\frac{\\pi}{6}', t2Tex: '\\frac{\\pi}{2}', areaTex: '3\\sqrt{3}' },
    { r1: 6, r2: 8, t1Tex: '\\frac{\\pi}{3}', t2Tex: '\\frac{2\\pi}{3}', areaTex: '12\\sqrt{3}' },
  ])

  return {
    statement: `Calculate the area of the triangle formed by the origin $(0, 0)$ and the two polar points $A = (${item.r1}, ${item.t1Tex})$ and $B = (${item.r2}, ${item.t2Tex})$.`,
    answer: { kind: 'number', value: item.areaTex },
    solution: [
      { text: 'Apply the polar triangle area formula:', tex: 'A = \\frac{1}{2} r_1 r_2 \\sin|\\theta_2 - \\theta_1|' },
      { text: `Substitute values:`, tex: `A = \\frac{1}{2}(${item.r1})(${item.r2}) \\sin\\left(${item.t2Tex} - ${item.t1Tex}\\right) = ${item.areaTex}` },
    ],
    hints: [
      'Use Area $= \\frac{1}{2} r_1 r_2 \\sin(\\Delta\\theta)$.',
      'Compute the sine of the angle between the two rays.',
    ],
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return polarDistance(rng)
  if (choice === 2) return polarCurveChoice(rng)
  return polarTriangleArea(rng)
}

function formatCardioidR(a: number, sign: '+' | '-', rad: 2 | 3): string {
  if (a % 2 === 0) {
    const coeff = a / 2
    const coeffStr = coeff === 1 ? '' : String(coeff)
    return `${a} ${sign} ${coeffStr}\\sqrt{${rad}}`
  }
  return `${a} ${sign} \\frac{${a}\\sqrt{${rad}}}{2}`
}

function polarCardioidEval(rng: Rng): Problem {
  const a = rng.pick([2, 3, 4, 5, 6, 8])
  const angle = rng.pick(STANDARD_ANGLES)
  const isSin = rng.chance(0.3)
  const trigVal = isSin ? Math.sin(angle.rad) : Math.cos(angle.rad)
  const trigTex = isSin ? angle.sinTex : angle.cosTex
  const trigName = isSin ? '\\sin' : '\\cos'

  let rTex: string
  if (Math.abs(trigVal - 1) < 1e-6) rTex = String(2 * a)
  else if (Math.abs(trigVal + 1) < 1e-6) rTex = '0'
  else if (Math.abs(trigVal) < 1e-6) rTex = String(a)
  else if (Math.abs(trigVal - 0.5) < 1e-6) rTex = ratToLatex(rat(3 * a, 2))
  else if (Math.abs(trigVal + 0.5) < 1e-6) rTex = ratToLatex(rat(a, 2))
  else if (trigTex === '\\frac{\\sqrt{3}}{2}') rTex = formatCardioidR(a, '+', 3)
  else if (trigTex === '-\\frac{\\sqrt{3}}{2}') rTex = formatCardioidR(a, '-', 3)
  else if (trigTex === '\\frac{\\sqrt{2}}{2}') rTex = formatCardioidR(a, '+', 2)
  else rTex = formatCardioidR(a, '-', 2)

  const onePlusTrigTex = trigTex.startsWith('-')
    ? `1 - ${trigTex.slice(1)}`
    : `1 + ${trigTex}`

  return {
    statement: `For the cardioid $r = ${a}(1 + ${trigName}\\theta)$, calculate the radius $r$ when $\\theta = ${angle.thetaTex}$.`,
    answer: { kind: 'number', value: rTex },
    solution: [
      { text: `Evaluate $${trigName}\\left(${angle.thetaTex}\\right) = ${trigTex}$:` },
      { text: 'Substitute into the cardioid equation:', tex: `r = ${a}\\left(${onePlusTrigTex}\\right) = ${rTex}` },
    ],
    hints: [
      `Find $${trigName}\\left(${angle.thetaTex}\\right) = ${trigTex}$.`,
      `Multiply by ${a} and simplify.`,
    ],
  }
}

function polarSymmetryChoice(rng: Rng): Problem {
  const a = rng.pick([2, 3, 4, 5, 6, 7])
  const variant = rng.pick([1, 2, 3, 4])

  if (variant === 1) {
    const correctId = 'polar_axis_sym'
    const options = rng.shuffle([
      { id: correctId, label: 'Symmetric about the polar axis (the x-axis)' },
      { id: 'pi_over_2_sym', label: 'Symmetric about the line $\\theta = \\frac{\\pi}{2}$ (the y-axis)' },
      { id: 'origin_sym', label: 'Symmetric about the origin only' },
      { id: 'no_sym', label: 'No rotational or line symmetry' },
    ])
    return {
      statement: `Which line of symmetry does the polar cardioid $r = ${a}(1 + \\cos\\theta)$ possess?`,
      answer: { kind: 'choice', options, correctId },
      solution: [
        { text: 'Because $\\cos(-\\theta) = \\cos\\theta$, replacing $\\theta$ with $-\\theta$ leaves the equation unchanged, indicating symmetry about the polar axis.' },
      ],
      hints: [
        'Test the condition $r(-\\theta) = r(\\theta)$.',
        'Even function property of $\\cos\\theta$ implies x-axis symmetry.',
      ],
    }
  }

  if (variant === 2) {
    const correctId = 'pi_over_2_sym'
    const options = rng.shuffle([
      { id: correctId, label: 'Symmetric about the line $\\theta = \\frac{\\pi}{2}$ (the y-axis)' },
      { id: 'polar_axis_sym', label: 'Symmetric about the polar axis (the x-axis)' },
      { id: 'origin_sym', label: 'Symmetric about the origin only' },
      { id: 'no_sym', label: 'No symmetry' },
    ])
    return {
      statement: `Which line of symmetry does the polar cardioid $r = ${a}(1 + \\sin\\theta)$ possess?`,
      answer: { kind: 'choice', options, correctId },
      solution: [
        { text: 'Because $\\sin(\\pi - \\theta) = \\sin\\theta$, replacing $\\theta$ with $\\pi - \\theta$ leaves the equation unchanged, indicating symmetry about $\\theta = \\frac{\\pi}{2}$.' },
      ],
      hints: [
        'Test the condition $r(\\pi - \\theta) = r(\\theta)$.',
        'Identity $\\sin(\\pi - \\theta) = \\sin\\theta$ implies y-axis symmetry.',
      ],
    }
  }

  if (variant === 3) {
    const correctId = 'origin_sym'
    const options = rng.shuffle([
      { id: correctId, label: 'Symmetric about the origin (pole)' },
      { id: 'polar_axis_sym', label: 'Symmetric about the polar axis only' },
      { id: 'y_axis_sym', label: 'Symmetric about the line $\\theta = \\frac{\\pi}{4}$' },
      { id: 'no_sym', label: 'Asymmetric' },
    ])
    return {
      statement: `Which symmetry property is exhibited by the rose curve $r = ${a} \\cos(2\\theta)$?`,
      answer: { kind: 'choice', options, correctId },
      solution: [
        { text: 'Because $\\cos(2(\\theta + \\pi)) = \\cos(2\\theta + 2\\pi) = \\cos(2\\theta)$, the curve is symmetric about the origin (pole).' },
      ],
      hints: [
        'Test $r(\\theta + \\pi) = r(\\theta)$.',
        'The period of $\\cos(2\\theta)$ is $\\pi$, creating 4-fold rose symmetry.',
      ],
    }
  }

  const correctId = 'origin_sym'
  const options = rng.shuffle([
    { id: correctId, label: 'Symmetric about the origin (pole)' },
    { id: 'polar_axis_sym', label: 'Symmetric about the polar axis only' },
    { id: 'pi_over_2_sym', label: 'Symmetric about the line $\\theta = \\frac{\\pi}{2}$ only' },
    { id: 'no_sym', label: 'No symmetry' },
  ])
  return {
    statement: `Which symmetry property is exhibited by the lemniscate $r^2 = ${a * a} \\cos(2\\theta)$?`,
    answer: { kind: 'choice', options, correctId },
    solution: [
      { text: 'Replacing $(r, \\theta)$ with $(-r, \\theta)$ leaves $r^2$ unchanged, indicating symmetry about the origin (pole).' },
    ],
    hints: [
      'Test $(-r)^2 = r^2$.',
      'Symmetry about the origin holds for any $r^2 = f(\\theta)$ curve.',
    ],
  }
}

function polarCurveIntersection(rng: Rng): Problem {
  const item = rng.pick([
    { a: 2, halfA: '1', fn: '\\cos', ansTex: '\\frac{\\pi}{3}', eqText: '\\cos\\theta = \\frac{1}{2}' },
    { a: 4, halfA: '2', fn: '\\cos', ansTex: '\\frac{\\pi}{3}', eqText: '\\cos\\theta = \\frac{1}{2}' },
    { a: 6, halfA: '3', fn: '\\cos', ansTex: '\\frac{\\pi}{3}', eqText: '\\cos\\theta = \\frac{1}{2}' },
    { a: 8, halfA: '4', fn: '\\cos', ansTex: '\\frac{\\pi}{3}', eqText: '\\cos\\theta = \\frac{1}{2}' },
    { a: 2, halfA: '1', fn: '\\sin', ansTex: '\\frac{\\pi}{6}', eqText: '\\sin\\theta = \\frac{1}{2}' },
    { a: 4, halfA: '2', fn: '\\sin', ansTex: '\\frac{\\pi}{6}', eqText: '\\sin\\theta = \\frac{1}{2}' },
    { a: 6, halfA: '3', fn: '\\sin', ansTex: '\\frac{\\pi}{6}', eqText: '\\sin\\theta = \\frac{1}{2}' },
    { a: 8, halfA: '4', fn: '\\sin', ansTex: '\\frac{\\pi}{6}', eqText: '\\sin\\theta = \\frac{1}{2}' },
    { a: 2, halfA: '\\sqrt{2}', fn: '\\cos', ansTex: '\\frac{\\pi}{4}', eqText: '\\cos\\theta = \\frac{\\sqrt{2}}{2}' },
    { a: 4, halfA: '2\\sqrt{2}', fn: '\\cos', ansTex: '\\frac{\\pi}{4}', eqText: '\\cos\\theta = \\frac{\\sqrt{2}}{2}' },
    { a: 6, halfA: '3\\sqrt{2}', fn: '\\cos', ansTex: '\\frac{\\pi}{4}', eqText: '\\cos\\theta = \\frac{\\sqrt{2}}{2}' },
    { a: 8, halfA: '4\\sqrt{2}', fn: '\\cos', ansTex: '\\frac{\\pi}{4}', eqText: '\\cos\\theta = \\frac{\\sqrt{2}}{2}' },
    { a: 2, halfA: '\\sqrt{2}', fn: '\\sin', ansTex: '\\frac{\\pi}{4}', eqText: '\\sin\\theta = \\frac{\\sqrt{2}}{2}' },
    { a: 4, halfA: '2\\sqrt{2}', fn: '\\sin', ansTex: '\\frac{\\pi}{4}', eqText: '\\sin\\theta = \\frac{\\sqrt{2}}{2}' },
    { a: 6, halfA: '3\\sqrt{2}', fn: '\\sin', ansTex: '\\frac{\\pi}{4}', eqText: '\\sin\\theta = \\frac{\\sqrt{2}}{2}' },
    { a: 8, halfA: '4\\sqrt{2}', fn: '\\sin', ansTex: '\\frac{\\pi}{4}', eqText: '\\sin\\theta = \\frac{\\sqrt{2}}{2}' },
    { a: 2, halfA: '\\sqrt{3}', fn: '\\cos', ansTex: '\\frac{\\pi}{6}', eqText: '\\cos\\theta = \\frac{\\sqrt{3}}{2}' },
    { a: 4, halfA: '2\\sqrt{3}', fn: '\\cos', ansTex: '\\frac{\\pi}{6}', eqText: '\\cos\\theta = \\frac{\\sqrt{3}}{2}' },
    { a: 6, halfA: '3\\sqrt{3}', fn: '\\cos', ansTex: '\\frac{\\pi}{6}', eqText: '\\cos\\theta = \\frac{\\sqrt{3}}{2}' },
    { a: 8, halfA: '4\\sqrt{3}', fn: '\\cos', ansTex: '\\frac{\\pi}{6}', eqText: '\\cos\\theta = \\frac{\\sqrt{3}}{2}' },
    { a: 2, halfA: '\\sqrt{3}', fn: '\\sin', ansTex: '\\frac{\\pi}{3}', eqText: '\\sin\\theta = \\frac{\\sqrt{3}}{2}' },
    { a: 4, halfA: '2\\sqrt{3}', fn: '\\sin', ansTex: '\\frac{\\pi}{3}', eqText: '\\sin\\theta = \\frac{\\sqrt{3}}{2}' },
    { a: 6, halfA: '3\\sqrt{3}', fn: '\\sin', ansTex: '\\frac{\\pi}{3}', eqText: '\\sin\\theta = \\frac{\\sqrt{3}}{2}' },
    { a: 8, halfA: '4\\sqrt{3}', fn: '\\sin', ansTex: '\\frac{\\pi}{3}', eqText: '\\sin\\theta = \\frac{\\sqrt{3}}{2}' },
  ])

  return {
    statement: `Find the polar angle $\\theta \\in [0, \\frac{\\pi}{2}]$ where the circle $r = ${item.a} ${item.fn}\\theta$ intersects the circle $r = ${item.halfA}$.`,
    answer: { kind: 'number', value: item.ansTex },
    solution: [
      { text: 'Set the radial equations equal:', tex: `${item.a} ${item.fn}\\theta = ${item.halfA} \\implies ${item.eqText}` },
      { text: 'Solve for $\\theta \\in [0, \\frac{\\pi}{2}]$:', tex: `\\theta = ${item.ansTex}` },
    ],
    hints: [
      'Equate $r_1 = r_2$ to find the trigonometric value.',
      `Solve in Quadrant 1 to get $\\theta = ${item.ansTex}$.`,
    ],
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return polarCardioidEval(rng)
  if (choice === 2) return polarSymmetryChoice(rng)
  return polarCurveIntersection(rng)
}

export const template: SkillTemplate = {
  skillId: 'polar',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
