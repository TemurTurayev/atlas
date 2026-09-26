import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'
import { formatComplex } from '../../math/complex'

const theory = [
  'Euler\'s formula: $e^{i\\theta} = \\cos\\theta + i \\sin\\theta$. Any complex number $z = a + bi$ can be written as $r e^{i\\theta}$.',
  'Modulus $r = |z| = \\sqrt{a^2 + b^2}$ and argument $\\theta = \\operatorname{arg}(z) \\in [0, 2\\pi)$.',
  'Conversion from polar to rectangular: $a = r \\cos\\theta$ and $b = r \\sin\\theta$.',
  'Multiplication in polar form: $r_1 e^{i\\theta_1} \\cdot r_2 e^{i\\theta_2} = r_1 r_2 e^{i(\\theta_1 + \\theta_2)}$.',
  'Division in polar form: $\\frac{r_1 e^{i\\theta_1}}{r_2 e^{i\\theta_2}} = \\frac{r_1}{r_2} e^{i(\\theta_1 - \\theta_2)}$.',
  'Common mistakes: adding moduli instead of multiplying ($r_1 r_2$), or subtracting arguments in reverse order.',
].join('\n')

const COMPLEX_INPUT_HINT = 'Type i for the imaginary unit, e.g. 3-2i or 2e^{i\\pi/3}'

interface PolarComplexPair {
  readonly r: number
  readonly rTex: string
  readonly thetaTex: string
  readonly rad: number
  readonly zStr: string
  readonly reTex: string
  readonly imTex: string
  readonly cosTex: string
  readonly sinTex: string
}

const POLAR_COMPLEX_PAIRS: readonly PolarComplexPair[] = [
  { r: 2, rTex: '2', thetaTex: '\\frac{\\pi}{6}', rad: Math.PI / 6, zStr: '\\sqrt{3} + i', reTex: '\\sqrt{3}', imTex: '1', cosTex: '\\frac{\\sqrt{3}}{2}', sinTex: '\\frac{1}{2}' },
  { r: 4, rTex: '4', thetaTex: '\\frac{\\pi}{6}', rad: Math.PI / 6, zStr: '2\\sqrt{3} + 2i', reTex: '2\\sqrt{3}', imTex: '2', cosTex: '\\frac{\\sqrt{3}}{2}', sinTex: '\\frac{1}{2}' },
  { r: 2, rTex: '2', thetaTex: '\\frac{\\pi}{3}', rad: Math.PI / 3, zStr: '1 + \\sqrt{3}i', reTex: '1', imTex: '\\sqrt{3}', cosTex: '\\frac{1}{2}', sinTex: '\\frac{\\sqrt{3}}{2}' },
  { r: 4, rTex: '4', thetaTex: '\\frac{\\pi}{3}', rad: Math.PI / 3, zStr: '2 + 2\\sqrt{3}i', reTex: '2', imTex: '2\\sqrt{3}', cosTex: '\\frac{1}{2}', sinTex: '\\frac{\\sqrt{3}}{2}' },
  { r: 3, rTex: '3', thetaTex: '\\frac{\\pi}{2}', rad: Math.PI / 2, zStr: '3i', reTex: '0', imTex: '3', cosTex: '0', sinTex: '1' },
  { r: 2, rTex: '2', thetaTex: '\\frac{2\\pi}{3}', rad: (2 * Math.PI) / 3, zStr: '-1 + \\sqrt{3}i', reTex: '-1', imTex: '\\sqrt{3}', cosTex: '-\\frac{1}{2}', sinTex: '\\frac{\\sqrt{3}}{2}' },
  { r: 4, rTex: '4', thetaTex: '\\frac{2\\pi}{3}', rad: (2 * Math.PI) / 3, zStr: '-2 + 2\\sqrt{3}i', reTex: '-2', imTex: '2\\sqrt{3}', cosTex: '-\\frac{1}{2}', sinTex: '\\frac{\\sqrt{3}}{2}' },
  { r: 2, rTex: '2', thetaTex: '\\frac{5\\pi}{6}', rad: (5 * Math.PI) / 6, zStr: '-\\sqrt{3} + i', reTex: '-\\sqrt{3}', imTex: '1', cosTex: '-\\frac{\\sqrt{3}}{2}', sinTex: '\\frac{1}{2}' },
  { r: 4, rTex: '4', thetaTex: '\\frac{5\\pi}{6}', rad: (5 * Math.PI) / 6, zStr: '-2\\sqrt{3} + 2i', reTex: '-2\\sqrt{3}', imTex: '2', cosTex: '-\\frac{\\sqrt{3}}{2}', sinTex: '\\frac{1}{2}' },
  { r: 5, rTex: '5', thetaTex: '\\pi', rad: Math.PI, zStr: '-5', reTex: '-5', imTex: '0', cosTex: '-1', sinTex: '0' },
  { r: 2, rTex: '2', thetaTex: '\\frac{7\\pi}{6}', rad: (7 * Math.PI) / 6, zStr: '-\\sqrt{3} - i', reTex: '-\\sqrt{3}', imTex: '-1', cosTex: '-\\frac{\\sqrt{3}}{2}', sinTex: '-\\frac{1}{2}' },
  { r: 2, rTex: '2', thetaTex: '\\frac{4\\pi}{3}', rad: (4 * Math.PI) / 3, zStr: '-1 - \\sqrt{3}i', reTex: '-1', imTex: '-\\sqrt{3}', cosTex: '-\\frac{1}{2}', sinTex: '-\\frac{\\sqrt{3}}{2}' },
  { r: 6, rTex: '6', thetaTex: '\\frac{3\\pi}{2}', rad: (3 * Math.PI) / 2, zStr: '-6i', reTex: '0', imTex: '-6', cosTex: '0', sinTex: '-1' },
  { r: 2, rTex: '2', thetaTex: '\\frac{5\\pi}{3}', rad: (5 * Math.PI) / 3, zStr: '1 - \\sqrt{3}i', reTex: '1', imTex: '-\\sqrt{3}', cosTex: '\\frac{1}{2}', sinTex: '-\\frac{\\sqrt{3}}{2}' },
  { r: 2, rTex: '2', thetaTex: '\\frac{11\\pi}{6}', rad: (11 * Math.PI) / 6, zStr: '\\sqrt{3} - i', reTex: '\\sqrt{3}', imTex: '-1', cosTex: '\\frac{\\sqrt{3}}{2}', sinTex: '-\\frac{1}{2}' },
]

function rectangularToPolarExp(rng: Rng): Problem {
  const item = rng.pick(POLAR_COMPLEX_PAIRS)
  const askArg = rng.chance(0.5)

  if (askArg) {
    return {
      statement: `Find the argument $\\theta \\in [0, 2\\pi)$ of the complex number $z = ${item.zStr}$.`,
      answer: { kind: 'number', value: item.thetaTex },
      solution: [
        { text: 'Identify the angle in $[0, 2\\pi)$ satisfying $\\tan\\theta = \\frac{b}{a}$ in the correct quadrant:' },
        { text: 'Calculate argument:', tex: `\\theta = \\operatorname{arg}(${item.zStr}) = ${item.thetaTex}` },
      ],
      hints: [
        'Use $\\theta = \\operatorname{atan2}(b, a)$ and determine the quadrant.',
        `The argument in $[0, 2\\pi)$ is $${item.thetaTex}$.`,
      ],
    }
  }

  return {
    statement: `Find the modulus $r = |z|$ of the complex number $z = ${item.zStr}$.`,
    answer: { kind: 'number', value: item.rTex },
    solution: [
      { text: 'Apply the modulus formula $r = \\sqrt{a^2 + b^2}$:' },
      { text: 'Calculate radius:', tex: `r = ${item.rTex}` },
    ],
    hints: [
      'Use $r = \\sqrt{a^2 + b^2}$.',
      `Square the real and imaginary parts to get $r = ${item.rTex}$.`,
    ],
  }
}

function polarExpToRectangular(rng: Rng): Problem {
  const item = rng.pick(POLAR_COMPLEX_PAIRS)
  const label = rng.pick(['w', 'z', 'u', 'v'])

  return {
    statement: `Convert the complex number $${label} = ${item.rTex} e^{i \\left(${item.thetaTex}\\right)}$ to rectangular form $a + bi$.`,
    answer: { kind: 'complex', re: item.reTex, im: item.imTex },
    solution: [
      { text: 'Apply Euler\'s formula $r e^{i\\theta} = r \\cos\\theta + i r \\sin\\theta$:' },
      { text: 'Substitute trigonometric values:', tex: `${label} = ${item.rTex}\\left(\\cos\\left(${item.thetaTex}\\right) + i \\sin\\left(${item.thetaTex}\\right)\\right) = ${formatComplex(item.reTex, item.imTex)}` },
    ],
    hints: [
      'Use $a = r \\cos\\theta$ and $b = r \\sin\\theta$.',
      `Evaluate $\\cos\\left(${item.thetaTex}\\right)$ and $\\sin\\left(${item.thetaTex}\\right)$ and multiply by ${item.rTex}.`,
    ],
    inputHint: COMPLEX_INPUT_HINT,
  }
}

function eulersIdentityEval(rng: Rng): Problem {
  const item = rng.pick([
    { exprTex: 'e^{i \\pi}', re: '-1', im: '0', hintText: 'e^{i\\pi} = -1' },
    { exprTex: 'e^{i \\frac{\\pi}{2}}', re: '0', im: '1', hintText: 'e^{i\\pi/2} = i' },
    { exprTex: 'e^{i \\frac{3\\pi}{2}}', re: '0', im: '-1', hintText: 'e^{i 3\\pi/2} = -i' },
    { exprTex: 'e^{i 2\\pi}', re: '1', im: '0', hintText: 'e^{i 2\\pi} = 1' },
    { exprTex: 'e^{i \\pi} + 1', re: '0', im: '0', hintText: 'e^{i\\pi} + 1 = 0' },
    { exprTex: '2 e^{i \\pi}', re: '-2', im: '0', hintText: '2 e^{i\\pi} = -2' },
  ])

  return {
    statement: `Evaluate the expression $${item.exprTex}$ as a complex number $a + bi$.`,
    answer: { kind: 'complex', re: item.re, im: item.im },
    solution: [
      { text: 'Apply Euler\'s formula $e^{i\\theta} = \\cos\\theta + i \\sin\\theta$:' },
      { text: 'Simplify:', tex: `${item.exprTex} = ${formatComplex(item.re, item.im)}` },
    ],
    hints: [
      'Recall Euler\'s identity $e^{i\\pi} = -1$.',
      `Simplify using $${item.hintText}$.`,
    ],
    inputHint: COMPLEX_INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return rectangularToPolarExp(rng)
  if (choice === 2) return polarExpToRectangular(rng)
  return eulersIdentityEval(rng)
}

function polarMultiplication(rng: Rng): Problem {
  const item = rng.pick([
    { r1: '2', t1: '\\frac{\\pi}{6}', r2: '3', t2: '\\frac{\\pi}{3}', rRes: '6', tRes: '\\frac{\\pi}{2}', re: '0', im: '6' },
    { r1: '2', t1: '\\frac{\\pi}{4}', r2: '2', t2: '\\frac{\\pi}{4}', rRes: '4', tRes: '\\frac{\\pi}{2}', re: '0', im: '4' },
    { r1: '3', t1: '\\frac{\\pi}{3}', r2: '2', t2: '\\frac{2\\pi}{3}', rRes: '6', tRes: '\\pi', re: '-6', im: '0' },
    { r1: '2', t1: '\\frac{\\pi}{6}', r2: '4', t2: '\\frac{5\\pi}{6}', rRes: '8', tRes: '\\pi', re: '-8', im: '0' },
    { r1: '4', t1: '\\frac{\\pi}{2}', r2: '2', t2: '\\frac{\\pi}{2}', rRes: '8', tRes: '\\pi', re: '-8', im: '0' },
    { r1: '3', t1: '\\frac{\\pi}{4}', r2: '3', t2: '\\frac{3\\pi}{4}', rRes: '9', tRes: '\\pi', re: '-9', im: '0' },
    { r1: '5', t1: '\\frac{\\pi}{6}', r2: '2', t2: '\\frac{\\pi}{3}', rRes: '10', tRes: '\\frac{\\pi}{2}', re: '0', im: '10' },
    { r1: '2', t1: '\\frac{2\\pi}{3}', r2: '3', t2: '\\frac{5\\pi}{6}', rRes: '6', tRes: '\\frac{3\\pi}{2}', re: '0', im: '-6' },
    { r1: '4', t1: '\\frac{\\pi}{3}', r2: '2', t2: '\\frac{7\\pi}{6}', rRes: '8', tRes: '\\frac{3\\pi}{2}', re: '0', im: '-8' },
    { r1: '3', t1: '\\frac{\\pi}{2}', r2: '3', t2: '\\pi', rRes: '9', tRes: '\\frac{3\\pi}{2}', re: '0', im: '-9' },
    { r1: '2', t1: '\\frac{\\pi}{3}', r2: '4', t2: '\\frac{\\pi}{6}', rRes: '8', tRes: '\\frac{\\pi}{2}', re: '0', im: '8' },
    { r1: '5', t1: '\\frac{\\pi}{4}', r2: '2', t2: '\\frac{5\\pi}{4}', rRes: '10', tRes: '\\frac{3\\pi}{2}', re: '0', im: '-10' },
    { r1: '3', t1: '\\frac{\\pi}{6}', r2: '3', t2: '\\frac{5\\pi}{6}', rRes: '9', tRes: '\\pi', re: '-9', im: '0' },
    { r1: '4', t1: '0', r2: '2', t2: '\\frac{\\pi}{2}', rRes: '8', tRes: '\\frac{\\pi}{2}', re: '0', im: '8' },
    { r1: '6', t1: '\\frac{\\pi}{4}', r2: '2', t2: '\\frac{\\pi}{4}', rRes: '12', tRes: '\\frac{\\pi}{2}', re: '0', im: '12' },
    { r1: '2', t1: '\\frac{\\pi}{6}', r2: '5', t2: '\\frac{\\pi}{3}', rRes: '10', tRes: '\\frac{\\pi}{2}', re: '0', im: '10' },
    { r1: '4', t1: '\\frac{\\pi}{3}', r2: '3', t2: '\\frac{2\\pi}{3}', rRes: '12', tRes: '\\pi', re: '-12', im: '0' },
    { r1: '5', t1: '\\frac{\\pi}{2}', r2: '3', t2: '\\frac{\\pi}{2}', rRes: '15', tRes: '\\pi', re: '-15', im: '0' },
  ])

  return {
    statement: `Calculate the product $z_1 z_2$ for $z_1 = ${item.r1} e^{i \\left(${item.t1}\\right)}$ and $z_2 = ${item.r2} e^{i \\left(${item.t2}\\right)}$, expressing the result as $a + bi$.`,
    answer: { kind: 'complex', re: item.re, im: item.im },
    solution: [
      { text: 'Multiply moduli and add arguments:', tex: `z_1 z_2 = (${item.r1} \\cdot ${item.r2}) e^{i \\left(${item.t1} + ${item.t2}\\right)} = ${item.rRes} e^{i \\left(${item.tRes}\\right)}` },
      { text: 'Convert to rectangular form:', tex: formatComplex(item.re, item.im) },
    ],
    hints: [
      'Multiply radii: $r = r_1 r_2$.',
      'Add angles: $\\theta = \\theta_1 + \\theta_2$.',
    ],
    inputHint: COMPLEX_INPUT_HINT,
  }
}

function polarDivision(rng: Rng): Problem {
  const item = rng.pick([
    { r1: '6', t1: '\\frac{3\\pi}{4}', r2: '2', t2: '\\frac{\\pi}{4}', rRes: '3', tRes: '\\frac{\\pi}{2}', re: '0', im: '3' },
    { r1: '8', t1: '\\frac{5\\pi}{6}', r2: '4', t2: '\\frac{\\pi}{6}', rRes: '2', tRes: '\\frac{2\\pi}{3}', re: '-1', im: '\\sqrt{3}' },
    { r1: '10', t1: '\\pi', r2: '5', t2: '\\frac{\\pi}{2}', rRes: '2', tRes: '\\frac{\\pi}{2}', re: '0', im: '2' },
    { r1: '12', t1: '\\frac{2\\pi}{3}', r2: '3', t2: '\\frac{\\pi}{6}', rRes: '4', tRes: '\\frac{\\pi}{2}', re: '0', im: '4' },
    { r1: '6', t1: '\\frac{\\pi}{2}', r2: '2', t2: '\\frac{\\pi}{6}', rRes: '3', tRes: '\\frac{\\pi}{3}', re: '\\frac{3}{2}', im: '\\frac{3\\sqrt{3}}{2}' },
    { r1: '12', t1: '\\pi', r2: '4', t2: '\\frac{\\pi}{2}', rRes: '3', tRes: '\\frac{\\pi}{2}', re: '0', im: '3' },
    { r1: '15', t1: '\\frac{5\\pi}{4}', r2: '3', t2: '\\frac{\\pi}{4}', rRes: '5', tRes: '\\pi', re: '-5', im: '0' },
    { r1: '16', t1: '\\frac{7\\pi}{6}', r2: '2', t2: '\\frac{\\pi}{6}', rRes: '8', tRes: '\\pi', re: '-8', im: '0' },
    { r1: '9', t1: '\\frac{5\\pi}{3}', r2: '3', t2: '\\frac{2\\pi}{3}', rRes: '3', tRes: '\\pi', re: '-3', im: '0' },
    { r1: '14', t1: '\\frac{3\\pi}{2}', r2: '2', t2: '\\frac{\\pi}{2}', rRes: '7', tRes: '\\pi', re: '-7', im: '0' },
    { r1: '20', t1: '\\frac{5\\pi}{6}', r2: '5', t2: '\\frac{\\pi}{3}', rRes: '4', tRes: '\\frac{\\pi}{2}', re: '0', im: '4' },
    { r1: '18', t1: '\\pi', r2: '6', t2: '\\frac{\\pi}{2}', rRes: '3', tRes: '\\frac{\\pi}{2}', re: '0', im: '3' },
    { r1: '8', t1: '\\frac{2\\pi}{3}', r2: '2', t2: '\\frac{\\pi}{6}', rRes: '4', tRes: '\\frac{\\pi}{2}', re: '0', im: '4' },
    { r1: '10', t1: '\\frac{3\\pi}{4}', r2: '2', t2: '\\frac{\\pi}{4}', rRes: '5', tRes: '\\frac{\\pi}{2}', re: '0', im: '5' },
    { r1: '12', t1: '\\frac{3\\pi}{4}', r2: '3', t2: '\\frac{\\pi}{4}', rRes: '4', tRes: '\\frac{\\pi}{2}', re: '0', im: '4' },
    { r1: '16', t1: '\\pi', r2: '4', t2: '\\frac{\\pi}{2}', rRes: '4', tRes: '\\frac{\\pi}{2}', re: '0', im: '4' },
    { r1: '24', t1: '\\frac{2\\pi}{3}', r2: '6', t2: '\\frac{\\pi}{6}', rRes: '4', tRes: '\\frac{\\pi}{2}', re: '0', im: '4' },
    { r1: '10', t1: '\\frac{5\\pi}{6}', r2: '2', t2: '\\frac{\\pi}{3}', rRes: '5', tRes: '\\frac{\\pi}{2}', re: '0', im: '5' },
  ])

  return {
    statement: `Calculate the quotient $\\frac{z_1}{z_2}$ for $z_1 = ${item.r1} e^{i \\left(${item.t1}\\right)}$ and $z_2 = ${item.r2} e^{i \\left(${item.t2}\\right)}$, expressing the result as $a + bi$.`,
    answer: { kind: 'complex', re: item.re, im: item.im },
    solution: [
      { text: 'Divide moduli and subtract arguments:', tex: `\\frac{z_1}{z_2} = \\frac{${item.r1}}{${item.r2}} e^{i \\left(${item.t1} - ${item.t2}\\right)} = ${item.rRes} e^{i \\left(${item.tRes}\\right)}` },
      { text: 'Convert to rectangular form:', tex: formatComplex(item.re, item.im) },
    ],
    hints: [
      'Divide radii: $r = \\frac{r_1}{r_2}$.',
      'Subtract angles: $\\theta = \\theta_1 - \\theta_2$.',
    ],
    inputHint: COMPLEX_INPUT_HINT,
  }
}

function eulerTrigRepresentation(rng: Rng): Problem {
  const angle = rng.pick(POLAR_COMPLEX_PAIRS)
  const isCos = rng.chance(0.5)

  if (isCos) {
    return {
      statement: `Evaluate the expression $\\frac{e^{i \\left(${angle.thetaTex}\\right)} + e^{-i \\left(${angle.thetaTex}\\right)}}{2}$.`,
      answer: { kind: 'number', value: angle.cosTex ?? '1' },
      solution: [
        { text: 'Recall Euler\'s formula for cosine: $\\cos\\theta = \\frac{e^{i\\theta} + e^{-i\\theta}}{2}$:' },
        { text: 'Evaluate cosine:', tex: `\\cos\\left(${angle.thetaTex}\\right) = ${angle.cosTex}` },
      ],
      hints: [
        'Recognize the identity $\\cos\\theta = \\frac{e^{i\\theta} + e^{-i\\theta}}{2}$.',
        `Evaluate $\\cos\\left(${angle.thetaTex}\\right) = ${angle.cosTex}$.`,
      ],
    }
  }

  return {
    statement: `Evaluate the expression $\\frac{e^{i \\left(${angle.thetaTex}\\right)} - e^{-i \\left(${angle.thetaTex}\\right)}}{2i}$.`,
    answer: { kind: 'number', value: angle.sinTex ?? '0' },
    solution: [
      { text: 'Recall Euler\'s formula for sine: $\\sin\\theta = \\frac{e^{i\\theta} - e^{-i\\theta}}{2i}$:' },
      { text: 'Evaluate sine:', tex: `\\sin\\left(${angle.thetaTex}\\right) = ${angle.sinTex}` },
    ],
    hints: [
      'Recognize the identity $\\sin\\theta = \\frac{e^{i\\theta} - e^{-i\\theta}}{2i}$.',
      `Evaluate $\\sin\\left(${angle.thetaTex}\\right) = ${angle.sinTex}$.`,
    ],
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return polarMultiplication(rng)
  if (choice === 2) return polarDivision(rng)
  return eulerTrigRepresentation(rng)
}

function polarCombinedOperation(rng: Rng): Problem {
  const item = rng.pick([
    { exprTex: '\\frac{(2 e^{i \\frac{\\pi}{3}})(3 e^{i \\frac{\\pi}{6}})}{6 e^{i \\frac{\\pi}{2}}}', re: '1', im: '0' },
    { exprTex: '\\frac{(4 e^{i \\frac{\\pi}{4}})(2 e^{i \\frac{\\pi}{4}})}{4 e^{i \\frac{\\pi}{2}}}', re: '2', im: '0' },
    { exprTex: '\\frac{(3 e^{i \\frac{\\pi}{6}})(4 e^{i \\frac{\\pi}{3}})}{2 e^{i \\frac{\\pi}{6}}}', re: '3', im: '3\\sqrt{3}' },
    { exprTex: '\\frac{(6 e^{i \\frac{2\\pi}{3}})(2 e^{i \\frac{\\pi}{3}})}{4 e^{i \\pi}}', re: '-3', im: '0' },
    { exprTex: '\\frac{(5 e^{i \\frac{\\pi}{4}})(4 e^{i \\frac{3\\pi}{4}})}{10 e^{i \\pi}}', re: '-2', im: '0' },
    { exprTex: '\\frac{(3 e^{i \\frac{\\pi}{2}})(6 e^{i \\frac{\\pi}{2}})}{9 e^{i \\pi}}', re: '-2', im: '0' },
    { exprTex: '\\frac{(8 e^{i \\frac{5\\pi}{6}})(2 e^{i \\frac{\\pi}{6}})}{4 e^{i \\pi}}', re: '-4', im: '0' },
    { exprTex: '\\frac{(4 e^{i \\frac{\\pi}{3}})(3 e^{i \\frac{\\pi}{3}})}{6 e^{i \\frac{2\\pi}{3}}}', re: '2', im: '0' },
    { exprTex: '\\frac{(6 e^{i \\frac{\\pi}{4}})(2 e^{i \\frac{3\\pi}{4}})}{3 e^{i \\pi}}', re: '-4', im: '0' },
    { exprTex: '\\frac{(2 e^{i \\frac{\\pi}{6}})(5 e^{i \\frac{\\pi}{3}})}{10 e^{i \\frac{\\pi}{2}}}', re: '1', im: '0' },
    { exprTex: '\\frac{(3 e^{i \\frac{2\\pi}{3}})(4 e^{i \\frac{\\pi}{3}})}{6 e^{i \\pi}}', re: '-2', im: '0' },
    { exprTex: '\\frac{(4 e^{i \\frac{\\pi}{2}})(2 e^{i \\frac{\\pi}{2}})}{2 e^{i \\pi}}', re: '-4', im: '0' },
    { exprTex: '\\frac{(2 e^{i \\frac{\\pi}{4}})(6 e^{i \\frac{\\pi}{4}})}{3 e^{i \\frac{\\pi}{2}}}', re: '0', im: '4' },
    { exprTex: '\\frac{(5 e^{i \\frac{\\pi}{6}})(2 e^{i \\frac{\\pi}{3}})}{5 e^{i \\frac{\\pi}{2}}}', re: '0', im: '2' },
    { exprTex: '\\frac{(8 e^{i \\frac{3\\pi}{4}})(3 e^{i \\frac{\\pi}{4}})}{12 e^{i \\pi}}', re: '-2', im: '0' },
    { exprTex: '\\frac{(6 e^{i \\frac{5\\pi}{6}})(2 e^{i \\frac{\\pi}{6}})}{3 e^{i \\pi}}', re: '-4', im: '0' },
    { exprTex: '\\frac{(3 e^{i \\frac{\\pi}{4}})(2 e^{i \\frac{3\\pi}{4}})}{6 e^{i \\pi}}', re: '1', im: '0' },
    { exprTex: '\\frac{(4 e^{i \\frac{\\pi}{3}})(3 e^{i \\frac{\\pi}{6}})}{2 e^{i \\frac{\\pi}{2}}}', re: '6', im: '0' },
    { exprTex: '\\frac{(5 e^{i \\frac{\\pi}{2}})(2 e^{i \\frac{\\pi}{2}})}{5 e^{i \\pi}}', re: '2', im: '0' },
    { exprTex: '\\frac{(6 e^{i \\frac{\\pi}{6}})(2 e^{i \\frac{\\pi}{3}})}{4 e^{i \\frac{\\pi}{2}}}', re: '3', im: '0' },
    { exprTex: '\\frac{(2 e^{i \\frac{\\pi}{3}})(4 e^{i \\frac{2\\pi}{3}})}{4 e^{i \\pi}}', re: '2', im: '0' },
    { exprTex: '\\frac{(3 e^{i \\frac{\\pi}{4}})(4 e^{i \\frac{\\pi}{4}})}{2 e^{i \\frac{\\pi}{2}}}', re: '6', im: '0' },
    { exprTex: '\\frac{(8 e^{i \\frac{\\pi}{6}})(3 e^{i \\frac{\\pi}{3}})}{6 e^{i \\frac{\\pi}{2}}}', re: '4', im: '0' },
    { exprTex: '\\frac{(5 e^{i \\frac{3\\pi}{4}})(2 e^{i \\frac{\\pi}{4}})}{5 e^{i \\pi}}', re: '2', im: '0' },
  ])

  return {
    statement: `Evaluate the expression $${item.exprTex}$ as a complex number $a + bi$.`,
    answer: { kind: 'complex', re: item.re, im: item.im },
    solution: [
      { text: 'Combine moduli and arguments in numerator and denominator:' },
      { text: 'Simplify:', tex: formatComplex(item.re, item.im) },
    ],
    hints: [
      'Multiply moduli in numerator and divide by denominator modulus.',
      'Add numerator arguments and subtract denominator argument.',
    ],
    inputHint: COMPLEX_INPUT_HINT,
  }
}

function argumentInPrincipalRange(rng: Rng): Problem {
  const item = rng.pick([
    { zStr: '-1 + i', thetaTex: '\\frac{3\\pi}{4}' },
    { zStr: '-\\sqrt{3} - i', thetaTex: '-\\frac{5\\pi}{6}' },
    { zStr: '1 - \\sqrt{3}i', thetaTex: '-\\frac{\\pi}{3}' },
    { zStr: '-2i', thetaTex: '-\\frac{\\pi}{2}' },
    { zStr: '-5', thetaTex: '\\pi' },
    { zStr: '1 + i', thetaTex: '\\frac{\\pi}{4}' },
    { zStr: '\\sqrt{3} + i', thetaTex: '\\frac{\\pi}{6}' },
    { zStr: '1 + \\sqrt{3}i', thetaTex: '\\frac{\\pi}{3}' },
    { zStr: '4i', thetaTex: '\\frac{\\pi}{2}' },
    { zStr: '-1 - i', thetaTex: '-\\frac{3\\pi}{4}' },
    { zStr: '-\\sqrt{3} + i', thetaTex: '\\frac{5\\pi}{6}' },
    { zStr: '\\sqrt{3} - i', thetaTex: '-\\frac{\\pi}{6}' },
    { zStr: '3', thetaTex: '0' },
    { zStr: '-3i', thetaTex: '-\\frac{\\pi}{2}' },
    { zStr: '-2 + 2i', thetaTex: '\\frac{3\\pi}{4}' },
    { zStr: '2 + 2i', thetaTex: '\\frac{\\pi}{4}' },
    { zStr: '-2 - 2i', thetaTex: '-\\frac{3\\pi}{4}' },
    { zStr: '2 - 2i', thetaTex: '-\\frac{\\pi}{4}' },
    { zStr: '-3 + 3i', thetaTex: '\\frac{3\\pi}{4}' },
    { zStr: '3 + 3i', thetaTex: '\\frac{\\pi}{4}' },
    { zStr: '-3 - 3i', thetaTex: '-\\frac{3\\pi}{4}' },
    { zStr: '3 - 3i', thetaTex: '-\\frac{\\pi}{4}' },
    { zStr: '-\\sqrt{3} + \\sqrt{3}i', thetaTex: '\\frac{3\\pi}{4}' },
    { zStr: '\\sqrt{3} + 3i', thetaTex: '\\frac{\\pi}{3}' },
    { zStr: '3 + \\sqrt{3}i', thetaTex: '\\frac{\\pi}{6}' },
    { zStr: '-3 - \\sqrt{3}i', thetaTex: '-\\frac{5\\pi}{6}' },
    { zStr: '-3 + \\sqrt{3}i', thetaTex: '\\frac{5\\pi}{6}' },
    { zStr: '3 - \\sqrt{3}i', thetaTex: '-\\frac{\\pi}{6}' },
  ])

  return {
    statement: `Find the principal argument $\\operatorname{Arg}(z) \\in (-\\pi, \\pi]$ for $z = ${item.zStr}$.`,
    answer: { kind: 'number', value: item.thetaTex },
    solution: [
      { text: 'Calculate the argument and wrap into the principal interval $(-\\pi, \\pi]$:' },
      { text: 'Principal argument:', tex: `\\operatorname{Arg}(${item.zStr}) = ${item.thetaTex}` },
    ],
    hints: [
      'Principal argument $\\operatorname{Arg}(z)$ must lie strictly in $(-\\pi, \\pi]$.',
      `Identify the quadrant and subtract $2\\pi$ if needed to get $${item.thetaTex}$.`,
    ],
  }
}

function complexPolarConceptChoice(rng: Rng): Problem {
  const angle = rng.pick(['\\frac{\\pi}{2}', '\\pi', '\\frac{\\pi}{4}', '\\frac{\\pi}{3}', '\\frac{2\\pi}{3}', '\\frac{3\\pi}{4}', '\\frac{5\\pi}{6}', '-\\frac{\\pi}{2}'])
  const options = rng.shuffle([
    { id: 'rotation_by_angle', label: `It rotates the vector representing $z$ counterclockwise by angle $\\theta = ${angle}$ without changing its modulus.` },
    { id: 'scaling_only', label: 'It scales the modulus of $z$ by a factor of $\\pi$ without rotating it.' },
    { id: 'reflection', label: 'It reflects $z$ across the real axis.' },
    { id: 'conjugate', label: 'It produces the complex conjugate $\\overline{z}$.' },
  ])

  return {
    statement: `What geometric transformation is performed on a complex number $z$ when it is multiplied by $e^{i \\left(${angle}\\right)}$?`,
    answer: { kind: 'choice', options, correctId: 'rotation_by_angle' },
    solution: [
      { text: 'Multiplying by $e^{i\\theta}$ has modulus $1$, so it preserves distance to the origin and rotates the complex vector by angle $\\theta$ counterclockwise.' },
    ],
    hints: [
      'Note that $|e^{i\\theta}| = 1$.',
      'Multiplying by a unit complex number corresponds to pure rotation.',
    ],
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return polarCombinedOperation(rng)
  if (choice === 2) return argumentInPrincipalRange(rng)
  return complexPolarConceptChoice(rng)
}

export const template: SkillTemplate = {
  skillId: 'complex_polar',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
