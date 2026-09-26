import type { Rng } from '../../random/rng'
import { rat } from '../../math/rational'
import type { Problem, SkillTemplate } from '../types'
import { formatComplex } from '../../math/complex'

const theory = [
  'A complex number $z = a + bi$ has real part $\\operatorname{Re}(z) = a$ and imaginary part $\\operatorname{Im}(z) = b$.',
  'Addition and subtraction: $(a + bi) \\pm (c + di) = (a \\pm c) + (b \\pm d)i$.',
  'Multiplication: $(a + bi)(c + di) = (ac - bd) + (ad + bc)i$.',
  'Complex conjugate: $\\overline{a + bi} = a - bi$; $z \\overline{z} = a^2 + b^2 = |z|^2$.',
  'Division: $\\frac{a + bi}{c + di} = \\frac{(a + bi)(c - di)}{c^2 + d^2} = \\frac{ac + bd}{c^2 + d^2} + \\frac{bc - ad}{c^2 + d^2}i$.',
  'Common mistakes: forgetting $i^2 = -1$ when multiplying, or missing the minus sign in $(a + bi)(a - bi) = a^2 + b^2$.',
].join('\n')

const COMPLEX_INPUT_HINT = 'Type i for the imaginary unit, e.g. 3-2i or 2e^{i\\pi/3}'

interface PythPair {
  readonly a: number
  readonly b: number
  readonly c: number
}

const PYTH_TRIPLES: readonly PythPair[] = [
  { a: 3, b: 4, c: 5 },
  { a: 5, b: 12, c: 13 },
  { a: 6, b: 8, c: 10 },
  { a: 8, b: 15, c: 17 },
  { a: 9, b: 12, c: 15 },
  { a: 12, b: 16, c: 20 },
  { a: 15, b: 20, c: 25 },
  { a: 10, b: 24, c: 26 },
  { a: 20, b: 21, c: 29 },
]

function complexAddSub(rng: Rng): Problem {
  const a = rng.int(-9, 9)
  const b = rng.pick([-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  const c = rng.int(-9, 9)
  const d = rng.pick([-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  const isAdd = rng.chance(0.5)

  const re = isAdd ? a + c : a - c
  const im = isAdd ? b + d : b - d
  const op = isAdd ? '+' : '-'

  const z1Str = formatComplex(a, b)
  const z2Str = formatComplex(c, d)

  return {
    statement: `Evaluate the expression $(${z1Str}) ${op} (${z2Str})$.`,
    answer: { kind: 'complex', re: String(re), im: String(im) },
    solution: [
      { text: 'Combine real parts and imaginary parts separately:' },
      { text: 'Real and imaginary components:', tex: `\\operatorname{Re}: ${a} ${op} (${c}) = ${re}, \\quad \\operatorname{Im}: ${b} ${op} (${d}) = ${im}` },
    ],
    hints: [
      'Add or subtract the real and imaginary parts independently.',
      `Compute $( ${a} ${op} (${c}) ) + ( ${b} ${op} (${d}) )i$.`,
    ],
    inputHint: COMPLEX_INPUT_HINT,
  }
}

function complexMultiply(rng: Rng): Problem {
  const a = rng.int(-5, 5)
  const b = rng.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5])
  const c = rng.int(-5, 5)
  const d = rng.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5])

  const re = a * c - b * d
  const im = a * d + b * c

  const z1Str = formatComplex(a, b)
  const z2Str = formatComplex(c, d)

  return {
    statement: `Compute the product $(${z1Str})(${z2Str})$.`,
    answer: { kind: 'complex', re: String(re), im: String(im) },
    solution: [
      { text: 'Expand using the FOIL method and substitute $i^2 = -1$:' },
      { text: 'Calculate:', tex: `(${a})(${c}) + (${a})(${formatComplex(0, d)}) + (${formatComplex(0, b)})(${c}) + (${formatComplex(0, b)})(${formatComplex(0, d)}) = ${formatComplex(re, im)}` },
    ],
    hints: [
      'Expand the product $(a+bi)(c+di) = ac + ad i + bc i + bd i^2$.',
      'Replace $i^2$ with $-1$ and combine like terms.',
    ],
    inputHint: COMPLEX_INPUT_HINT,
  }
}

function complexModulus(rng: Rng): Problem {
  const triple = rng.pick(PYTH_TRIPLES)
  const signA = rng.chance(0.5) ? 1 : -1
  const signB = rng.chance(0.5) ? 1 : -1
  const a = signA * triple.a
  const b = signB * triple.b

  const zStr = formatComplex(a, b)

  return {
    statement: `Calculate the modulus $|z|$ of the complex number $z = ${zStr}$.`,
    answer: { kind: 'number', value: String(triple.c) },
    solution: [
      { text: 'Apply the modulus formula $|a + bi| = \\sqrt{a^2 + b^2}$:' },
      { text: 'Substitute parts:', tex: `|${zStr}| = \\sqrt{(${a})^2 + (${b})^2} = \\sqrt{${a * a} + ${b * b}} = ${triple.c}` },
    ],
    hints: [
      'Use $|z| = \\sqrt{\\operatorname{Re}(z)^2 + \\operatorname{Im}(z)^2}$.',
      `Square $${a}$ and $${b}$, sum them ($${triple.c * triple.c}$), and take the square root.`,
    ],
  }
}

function powersOfI(rng: Rng): Problem {
  const n = rng.int(1, 100)
  const rem = n % 4

  let re = '0'
  let im = '0'
  let resTex = 'i'

  if (rem === 0) {
    re = '1'
    im = '0'
    resTex = '1'
  } else if (rem === 1) {
    re = '0'
    im = '1'
    resTex = 'i'
  } else if (rem === 2) {
    re = '-1'
    im = '0'
    resTex = '-1'
  } else {
    re = '0'
    im = '-1'
    resTex = '-i'
  }

  return {
    statement: `Simplify the power of $i$: $i^{${n}}$.`,
    answer: { kind: 'complex', re, im },
    solution: [
      { text: 'Because $i^4 = 1$, reduce the exponent modulo $4$:' },
      { text: 'Calculate remainder:', tex: `${n} = 4 \\cdot ${Math.floor(n / 4)} + ${rem} \\implies i^{${n}} = i^{${rem}} = ${resTex}` },
    ],
    hints: [
      'Recall that $i^1 = i$, $i^2 = -1$, $i^3 = -i$, $i^4 = 1$.',
      `Divide ${n} by 4 to get remainder ${rem}.`,
    ],
    inputHint: COMPLEX_INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 4)
  if (choice === 1) return complexAddSub(rng)
  if (choice === 2) return complexMultiply(rng)
  if (choice === 3) return complexModulus(rng)
  return powersOfI(rng)
}

function complexDivision(rng: Rng): Problem {
  const c = rng.pick([-3, -2, -1, 1, 2, 3])
  const d = rng.pick([-3, -2, -1, 1, 2, 3])
  const targetRe = rat(rng.int(-4, 4), 1)
  const targetIm = rat(rng.pick([-4, -3, -2, -1, 1, 2, 3, 4]), 1)

  const reVal = targetRe.n
  const imVal = targetIm.n

  const a = reVal * c - imVal * d
  const b = reVal * d + imVal * c

  const numStr = formatComplex(a, b)
  const denStr = formatComplex(c, d)
  const conjStr = formatComplex(c, -d)
  const denSq = c * c + d * d

  return {
    statement: `Calculate the quotient $\\frac{${numStr}}{${denStr}}$ and express as $a + bi$.`,
    answer: { kind: 'complex', re: String(reVal), im: String(imVal) },
    solution: [
      { text: `Multiply numerator and denominator by the conjugate $(${conjStr})$:` },
      { text: 'Simplify denominator and numerator:', tex: `\\frac{(${numStr})(${conjStr})}{${c}^2 + (${d})^2} = \\frac{${formatComplex(a * c + b * d, b * c - a * d)}}{${denSq}} = ${formatComplex(reVal, imVal)}` },
    ],
    hints: [
      `Multiply numerator and denominator by the conjugate of the denominator: $(${conjStr})$.`,
      `Simplify the denominator to $c^2 + d^2 = ${denSq}$ and reduce terms.`,
    ],
    inputHint: COMPLEX_INPUT_HINT,
  }
}

function solveNegativeDiscriminantQuadratic(rng: Rng): Problem {
  const alpha = rng.int(-5, 5)
  const beta = rng.pick([1, 2, 3, 4, 5])

  const b = -2 * alpha
  const c = alpha * alpha + beta * beta

  const bStr = b === 0 ? '' : b > 0 ? `+ ${b}z` : `- ${Math.abs(b)}z`

  return {
    statement: `Solve the quadratic equation $z^2 ${bStr} + ${c} = 0$. Find the root with positive imaginary part.`,
    answer: { kind: 'complex', re: String(alpha), im: String(beta) },
    solution: [
      { text: 'Apply the quadratic formula with $a = 1, b = ${b}, c = ${c}$:' },
      { text: 'Calculate discriminant:', tex: `\\Delta = b^2 - 4ac = (${b})^2 - 4(1)(${c}) = -${4 * beta * beta}` },
      { text: 'Find roots:', tex: `z = \\frac{-(${b}) \\pm i \\sqrt{${4 * beta * beta}}}{2} = ${formatComplex(alpha, beta)}` },
    ],
    hints: [
      'Use $z = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.',
      `Since $b^2 - 4ac = -${4 * beta * beta}$, $\\sqrt{\\Delta} = ${2 * beta}i$.`,
    ],
    inputHint: COMPLEX_INPUT_HINT,
  }
}

function complexPartEval(rng: Rng): Problem {
  const a = rng.int(-4, 4)
  const b = rng.pick([-4, -3, -2, -1, 1, 2, 3, 4])
  const askReal = rng.chance(0.5)

  const reSq = a * a - b * b
  const imSq = 2 * a * b
  const zStr = formatComplex(a, b)

  if (askReal) {
    return {
      statement: `Find the real part $\\operatorname{Re}(z^2)$ for $z = ${zStr}$.`,
      answer: { kind: 'number', value: String(reSq) },
      solution: [
        { text: `Expand $z^2 = (${zStr})^2 = (${a})^2 - (${b})^2 + 2(${a})(${b})i = ${formatComplex(reSq, imSq)}$.` },
        { text: 'Extract real part:', tex: `\\operatorname{Re}(z^2) = ${reSq}` },
      ],
      hints: [
        'Expand $(a + bi)^2 = a^2 - b^2 + 2abi$.',
        `The real part is $a^2 - b^2 = (${a})^2 - (${b})^2 = ${reSq}$.`,
      ],
    }
  }

  return {
    statement: `Find the imaginary part $\\operatorname{Im}(z^2)$ for $z = ${zStr}$.`,
    answer: { kind: 'number', value: String(imSq) },
    solution: [
      { text: `Expand $z^2 = (${zStr})^2 = (${a})^2 - (${b})^2 + 2(${a})(${b})i = ${formatComplex(reSq, imSq)}$.` },
      { text: 'Extract imaginary part:', tex: `\\operatorname{Im}(z^2) = ${imSq}` },
    ],
    hints: [
      'Expand $(a + bi)^2 = a^2 - b^2 + 2abi$.',
      `The imaginary part is $2ab = 2(${a})(${b}) = ${imSq}$.`,
    ],
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return complexDivision(rng)
  if (choice === 2) return solveNegativeDiscriminantQuadratic(rng)
  return complexPartEval(rng)
}

function solveLinearComplexEq(rng: Rng): Problem {
  const targetRe = rng.int(-3, 3)
  const targetIm = rng.pick([-3, -2, -1, 1, 2, 3])
  const a = rng.pick([-2, -1, 1, 2])
  const b = rng.pick([-2, -1, 1, 2])

  const c = rng.int(-4, 4)
  const d = rng.pick([-4, -3, -2, -1, 1, 2, 3, 4])

  const multRe = a * targetRe - b * targetIm
  const multIm = a * targetIm + b * targetRe

  const e = multRe + c
  const f = multIm + d

  const coeffStr = formatComplex(a, b)
  const constStr = formatComplex(c, d)
  const rhsStr = formatComplex(e, f)

  return {
    statement: `Solve the linear equation $(${coeffStr}) z + (${constStr}) = ${rhsStr}$ for $z$.`,
    answer: { kind: 'complex', re: String(targetRe), im: String(targetIm) },
    solution: [
      { text: `Subtract $(${constStr})$ from both sides:` },
      { text: 'Isolated product:', tex: `(${coeffStr}) z = ${formatComplex(multRe, multIm)}` },
      { text: 'Divide to find z:', tex: `z = \\frac{${formatComplex(multRe, multIm)}}{${coeffStr}} = ${formatComplex(targetRe, targetIm)}` },
    ],
    hints: [
      'Isolate the term with $z$ by subtracting the constant.',
      'Divide by the coefficient using complex division.',
    ],
    inputHint: COMPLEX_INPUT_HINT,
  }
}

function complexConjugateProduct(rng: Rng): Problem {
  const a = rng.pick([1, 2, 3, 4, 5, 6, 7, 8])
  const b = rng.pick([1, 2, 3, 4, 5, 6, 7, 8])
  const val = 2 * (a * a - b * b)

  const zStr = formatComplex(a, b)
  const conjStr = formatComplex(a, -b)

  return {
    statement: `Evaluate the expression $(${zStr})^2 + (${conjStr})^2$.`,
    answer: { kind: 'number', value: String(val) },
    solution: [
      { text: 'Recall $(a + bi)^2 + (a - bi)^2 = 2(a^2 - b^2)$:' },
      { text: 'Substitute values:', tex: `2((${a})^2 - (${b})^2) = 2(${a * a} - ${b * b}) = ${val}` },
    ],
    hints: [
      'Expand both squares and note that cross terms cancel.',
      `Compute $2(a^2 - b^2) = 2(${a * a} - ${b * b}) = ${val}$.`,
    ],
  }
}

function complexConceptChoice(rng: Rng): Problem {
  const a = rng.pick([1, 2, 3, 4, 5, 6, 7, 8])
  const b = rng.pick([1, 2, 3, 4, 5, 6, 7, 8])
  const modSq = a * a + b * b
  const zStr = formatComplex(a, b)
  const conjStr = formatComplex(a, -b)

  const modLabel = Number.isInteger(Math.sqrt(modSq)) ? String(Math.sqrt(modSq)) : `\\sqrt{${modSq}}`
  const correctId = 'modulus_squared'
  const options = rng.shuffle([
    { id: correctId, label: `It equals $|z|^2 = ${modSq}$` },
    { id: 'zero_identity', label: 'It equals 0 for all complex numbers' },
    { id: 'pure_imaginary', label: 'It is a pure imaginary number' },
    { id: 'modulus_linear', label: `It equals $|z| = ${modLabel}$` },
  ])

  return {
    statement: `For the complex number $z = ${zStr}$, what is the value of the product $z \\cdot \\overline{z} = (${zStr})(${conjStr})$?`,
    answer: { kind: 'choice', options, correctId },
    solution: [
      { text: 'The product of a complex number and its conjugate always equals the square of its modulus: $z \\overline{z} = |z|^2 = a^2 + b^2$.' },
      { text: 'Calculate:', tex: `(${a})^2 + (${b})^2 = ${modSq}` },
    ],
    hints: [
      'Use the identity $z \\overline{z} = |z|^2$.',
      `Compute $a^2 + b^2 = ${a * a} + ${b * b} = ${modSq}$.`,
    ],
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return solveLinearComplexEq(rng)
  if (choice === 2) return complexConjugateProduct(rng)
  return complexConceptChoice(rng)
}

export const template: SkillTemplate = {
  skillId: 'complex_arith',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
