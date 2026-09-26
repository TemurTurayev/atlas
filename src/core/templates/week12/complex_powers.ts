import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'
import { formatComplex, ordinal } from '../../math/complex'

const theory = [
  'De Moivre\'s Theorem: $(r e^{i\\theta})^n = r^n e^{in\\theta} = r^n (\\cos(n\\theta) + i \\sin(n\\theta))$ for any integer $n$.',
  'Computing powers: convert $a + bi$ to $r e^{i\\theta}$, compute $r^n e^{in\\theta}$, and convert back to $a + bi$.',
  'The $n$-th roots of unity: solutions to $z^n = 1$ are $\\omega_k = e^{i \\frac{2\\pi k}{n}}$ for $k = 0, 1, \\dots, n-1$.',
  'Sum of $n$-th roots of unity: $\\sum_{k=0}^{n-1} e^{i \\frac{2\\pi k}{n}} = 0$ for any $n \\ge 2$.',
  'The $n$-th roots of $w = r e^{i\\theta_0}$: $z_k = \\sqrt[n]{r} e^{i \\frac{\\theta_0 + 2k\\pi}{n}}$ for $k = 0, 1, \\dots, n-1$.',
  'Common mistakes: multiplying the angle by $n$ instead of exponentiating the radius $r^n$, or missing roots when solving $z^n = w$.',
].join('\n')

const COMPLEX_INPUT_HINT = 'Type i for the imaginary unit, e.g. 3-2i or 2e^{i\\pi/3}'

function deMoivrePower(rng: Rng): Problem {
  const item = rng.pick([
    { baseTex: '(1 + i)', r: Math.SQRT2, theta: Math.PI / 4, n: 4, valTex: '-4', re: '-4', im: '0' },
    { baseTex: '(1 + i)', r: Math.SQRT2, theta: Math.PI / 4, n: 6, valTex: '-8i', re: '0', im: '-8' },
    { baseTex: '(1 + i)', r: Math.SQRT2, theta: Math.PI / 4, n: 8, valTex: '16', re: '16', im: '0' },
    { baseTex: '(1 - i)', r: Math.SQRT2, theta: -Math.PI / 4, n: 4, valTex: '-4', re: '-4', im: '0' },
    { baseTex: '(1 - i)', r: Math.SQRT2, theta: -Math.PI / 4, n: 8, valTex: '16', re: '16', im: '0' },
    { baseTex: '(\\sqrt{3} + i)', r: 2, theta: Math.PI / 6, n: 3, valTex: '8i', re: '0', im: '8' },
    { baseTex: '(\\sqrt{3} + i)', r: 2, theta: Math.PI / 6, n: 6, valTex: '-64', re: '-64', im: '0' },
    { baseTex: '(1 + \\sqrt{3}i)', r: 2, theta: Math.PI / 3, n: 3, valTex: '-8', re: '-8', im: '0' },
    { baseTex: '(1 + \\sqrt{3}i)', r: 2, theta: Math.PI / 3, n: 6, valTex: '64', re: '64', im: '0' },
    { baseTex: '(1 - \\sqrt{3}i)', r: 2, theta: -Math.PI / 3, n: 3, valTex: '-8', re: '-8', im: '0' },
    { baseTex: '(\\sqrt{3} - i)', r: 2, theta: -Math.PI / 6, n: 6, valTex: '-64', re: '-64', im: '0' },
    { baseTex: '(1 + i)', r: Math.SQRT2, theta: Math.PI / 4, n: 12, valTex: '-64', re: '-64', im: '0' },
  ])

  return {
    statement: `Use De Moivre's Theorem to evaluate the power $${item.baseTex}^{${item.n}}$.`,
    answer: { kind: 'complex', re: item.re, im: item.im },
    solution: [
      { text: 'Convert base to polar form:', tex: `${item.baseTex} = r e^{i\\theta}` },
      { text: 'Apply De Moivre\'s theorem:', tex: `(r e^{i\\theta})^{${item.n}} = r^{${item.n}} e^{i (${item.n}\\theta)} = ${item.valTex}` },
    ],
    hints: [
      'Convert the base to polar form $r e^{i\\theta}$.',
      `Raise $r$ to power ${item.n} and multiply $\\theta$ by ${item.n}.`,
    ],
    inputHint: COMPLEX_INPUT_HINT,
  }
}

function numberOfRoots(rng: Rng): Problem {
  const n = rng.pick([3, 4, 5, 6, 7, 8, 9, 10, 12])
  const w = rng.pick(['8i', '-16', '27', '-81i', '1 + i', '-1', '64', '-32i', '100'])

  return {
    statement: `How many distinct complex solutions exist for the polynomial equation $z^{${n}} = ${w}$?`,
    answer: { kind: 'number', value: String(n) },
    solution: [
      { text: 'By the Fundamental Theorem of Algebra, a non-zero complex number has exactly $n$ distinct $n$-th roots:' },
      { text: 'Number of roots:', tex: `n = ${n}` },
    ],
    hints: [
      'Recall that any non-zero complex number has exactly $n$ distinct $n$-th roots.',
      `The degree of the equation $z^{${n}} = w$ is ${n}.`,
    ],
  }
}

function sumOfRootsOfUnity(rng: Rng): Problem {
  const n = rng.pick([3, 4, 5, 6, 7, 8, 9, 10, 12])

  return {
    statement: `Calculate the sum of all ${ordinal(n)} roots of unity: $\\sum_{k=0}^{${n - 1}} e^{i \\frac{2\\pi k}{${n}}}$.`,
    answer: { kind: 'number', value: '0' },
    solution: [
      { text: 'The sum of all $n$-th roots of unity for $n \\ge 2$ is always zero because the roots form a symmetric regular $n$-gon centered at the origin.' },
      { text: 'Sum:', tex: '\\sum_{k=0}^{n-1} \\omega_k = 0' },
    ],
    hints: [
      'The $n$-th roots of unity are symmetrically distributed on the unit circle.',
      'For any $n \\ge 2$, the vector sum of all roots of unity is 0.',
    ],
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return deMoivrePower(rng)
  if (choice === 2) return numberOfRoots(rng)
  return sumOfRootsOfUnity(rng)
}

function nthRootOfSimpleNumber(rng: Rng): Problem {
  const item = rng.pick([
    { eqTex: 'z^3 = 8i', condStr: 'the root with the smallest positive argument $\\theta \\in [0, 2\\pi)$', re: '\\sqrt{3}', im: '1', angleTex: '\\frac{\\pi}{6}' },
    { eqTex: 'z^3 = 8i', condStr: 'the root in Quadrant 2', re: '-\\sqrt{3}', im: '1', angleTex: '\\frac{5\\pi}{6}' },
    { eqTex: 'z^4 = -16', condStr: 'the root in Quadrant 1', re: '\\sqrt{2}', im: '\\sqrt{2}', angleTex: '\\frac{\\pi}{4}' },
    { eqTex: 'z^4 = -16', condStr: 'the root in Quadrant 2', re: '-\\sqrt{2}', im: '\\sqrt{2}', angleTex: '\\frac{3\\pi}{4}' },
    { eqTex: 'z^3 = -27', condStr: 'the root with the smallest positive argument $\\theta \\in [0, 2\\pi)$', re: '\\frac{3}{2}', im: '\\frac{3\\sqrt{3}}{2}', angleTex: '\\frac{\\pi}{3}' },
    { eqTex: 'z^3 = 27i', condStr: 'the root in Quadrant 1', re: '\\frac{3\\sqrt{3}}{2}', im: '\\frac{3}{2}', angleTex: '\\frac{\\pi}{6}' },
    { eqTex: 'z^4 = 16', condStr: 'the root in Quadrant 1', re: '2', im: '0', angleTex: '0' },
    { eqTex: 'z^3 = -8', condStr: 'the root in Quadrant 1', re: '1', im: '\\sqrt{3}', angleTex: '\\frac{\\pi}{3}' },
    { eqTex: 'z^4 = -1', condStr: 'the root in Quadrant 1', re: '\\frac{\\sqrt{2}}{2}', im: '\\frac{\\sqrt{2}}{2}', angleTex: '\\frac{\\pi}{4}' },
    { eqTex: 'z^6 = 64', condStr: 'the root in Quadrant 1 with $\\theta = \\frac{\\pi}{3}$', re: '1', im: '\\sqrt{3}', angleTex: '\\frac{\\pi}{3}' },
    { eqTex: 'z^3 = -64', condStr: 'the root with the smallest positive argument $\\theta \\in [0, 2\\pi)$', re: '2', im: '2\\sqrt{3}', angleTex: '\\frac{\\pi}{3}' },
    { eqTex: 'z^4 = 81', condStr: 'the root in Quadrant 1 (on positive imaginary axis)', re: '0', im: '3', angleTex: '\\frac{\\pi}{2}' },
    { eqTex: 'z^3 = 64i', condStr: 'the root in Quadrant 1', re: '2\\sqrt{3}', im: '2', angleTex: '\\frac{\\pi}{6}' },
    { eqTex: 'z^4 = -81', condStr: 'the root in Quadrant 1', re: '\\frac{3\\sqrt{2}}{2}', im: '\\frac{3\\sqrt{2}}{2}', angleTex: '\\frac{\\pi}{4}' },
    { eqTex: 'z^4 = -16', condStr: 'the root in Quadrant 2 with argument $\\frac{3\\pi}{4}$', re: '-\\sqrt{2}', im: '\\sqrt{2}', angleTex: '\\frac{3\\pi}{4}' },
    { eqTex: 'z^3 = 27', condStr: 'the root in Quadrant 2', re: '-\\frac{3}{2}', im: '\\frac{3\\sqrt{3}}{2}', angleTex: '\\frac{2\\pi}{3}' },
    { eqTex: 'z^3 = -27', condStr: 'the real root $z = -3$', re: '-3', im: '0', angleTex: '\\pi' },
    { eqTex: 'z^4 = 81', condStr: 'the root on the negative imaginary axis', re: '0', im: '-3', angleTex: '\\frac{3\\pi}{2}' },
    { eqTex: 'z^3 = 64i', condStr: 'the root in Quadrant 2', re: '-2\\sqrt{3}', im: '2', angleTex: '\\frac{5\\pi}{6}' },
    { eqTex: 'z^4 = -81', condStr: 'the root in Quadrant 2', re: '-\\frac{3\\sqrt{2}}{2}', im: '\\frac{3\\sqrt{2}}{2}', angleTex: '\\frac{3\\pi}{4}' },
  ])

  return {
    statement: `Solve the equation $${item.eqTex}$ for $z$. Find ${item.condStr}.`,
    answer: { kind: 'complex', re: item.re, im: item.im },
    solution: [
      { text: 'Convert RHS to polar form and apply the root formula $z_k = \\sqrt[n]{r} e^{i \\frac{\\theta_0 + 2k\\pi}{n}}$:' },
      { text: 'Select the required root:', tex: `z = ${formatComplex(item.re, item.im)}` },
    ],
    hints: [
      'Write RHS in polar form $r e^{i\\theta_0}$.',
      'Compute roots for $k = 0, 1, 2, \\dots$ and pick the one satisfying the condition.',
    ],
    inputHint: COMPLEX_INPUT_HINT,
  }
}

function negativePowerDeMoivre(rng: Rng): Problem {
  const item = rng.pick([
    { baseTex: '(1 + i)', n: -4, re: '-\\frac{1}{4}', im: '0' },
    { baseTex: '(1 + i)', n: -2, re: '0', im: '-\\frac{1}{2}' },
    { baseTex: '(\\sqrt{3} + i)', n: -3, re: '0', im: '-\\frac{1}{8}' },
    { baseTex: '(1 + \\sqrt{3}i)', n: -3, re: '-\\frac{1}{8}', im: '0' },
    { baseTex: '(1 - i)', n: -4, re: '-\\frac{1}{4}', im: '0' },
    { baseTex: '(1 + i)', n: -8, re: '\\frac{1}{16}', im: '0' },
    { baseTex: '(\\sqrt{3} - i)', n: -6, re: '-\\frac{1}{64}', im: '0' },
    { baseTex: '(\\sqrt{3} + i)', n: -6, re: '-\\frac{1}{64}', im: '0' },
    { baseTex: '(1 + \\sqrt{3}i)', n: -6, re: '\\frac{1}{64}', im: '0' },
    { baseTex: '(1 - i)', n: -2, re: '0', im: '\\frac{1}{2}' },
    { baseTex: '(\\sqrt{3} + i)', n: -4, re: '-\\frac{1}{32}', im: '-\\frac{\\sqrt{3}}{32}' },
    { baseTex: '(1 + \\sqrt{3}i)', n: -4, re: '-\\frac{1}{32}', im: '\\frac{\\sqrt{3}}{32}' },
    { baseTex: '(1 + i)', n: -6, re: '0', im: '\\frac{1}{8}' },
    { baseTex: '(\\sqrt{3} - i)', n: -3, re: '0', im: '\\frac{1}{8}' },
    { baseTex: '(1 - \\sqrt{3}i)', n: -3, re: '-\\frac{1}{8}', im: '0' },
    { baseTex: '(1 + i)', n: -3, re: '-\\frac{1}{4}', im: '\\frac{1}{4}' },
    { baseTex: '(1 - i)', n: -3, re: '-\\frac{1}{4}', im: '-\\frac{1}{4}' },
    { baseTex: '(\\sqrt{3} + i)', n: -2, re: '\\frac{1}{8}', im: '-\\frac{\\sqrt{3}}{8}' },
    { baseTex: '(1 + \\sqrt{3}i)', n: -2, re: '-\\frac{1}{8}', im: '-\\frac{\\sqrt{3}}{8}' },
    { baseTex: '(\\sqrt{3} - i)', n: -4, re: '-\\frac{1}{32}', im: '\\frac{\\sqrt{3}}{32}' },
    { baseTex: '(1 - \\sqrt{3}i)', n: -4, re: '-\\frac{1}{32}', im: '-\\frac{\\sqrt{3}}{32}' },
  ])

  return {
    statement: `Evaluate the negative power $${item.baseTex}^{${item.n}}$ as a complex number $a + bi$.`,
    answer: { kind: 'complex', re: item.re, im: item.im },
    solution: [
      { text: 'Use $z^{-n} = \\frac{1}{z^n}$ or De Moivre\'s theorem with negative exponent:' },
      { text: 'Simplify:', tex: formatComplex(item.re, item.im) },
    ],
    hints: [
      'Convert base to polar form $r e^{i\\theta}$.',
      `Apply De Moivre's formula with exponent ${item.n}.`,
    ],
    inputHint: COMPLEX_INPUT_HINT,
  }
}

function rootInQuadrant(rng: Rng): Problem {
  const item = rng.pick([
    { eqTex: 'z^4 = 16', quadStr: 'Quadrant 1', re: '2', im: '0' },
    { eqTex: 'z^4 = 16', quadStr: 'Quadrant 2 (on positive imaginary axis)', re: '0', im: '2' },
    { eqTex: 'z^3 = -8', quadStr: 'Quadrant 1', re: '1', im: '\\sqrt{3}' },
    { eqTex: 'z^3 = -8', quadStr: 'Quadrant 4', re: '1', im: '-\\sqrt{3}' },
    { eqTex: 'z^4 = -1', quadStr: 'Quadrant 1', re: '\\frac{\\sqrt{2}}{2}', im: '\\frac{\\sqrt{2}}{2}' },
    { eqTex: 'z^4 = -16', quadStr: 'Quadrant 1', re: '\\sqrt{2}', im: '\\sqrt{2}' },
    { eqTex: 'z^4 = -16', quadStr: 'Quadrant 2', re: '-\\sqrt{2}', im: '\\sqrt{2}' },
    { eqTex: 'z^3 = 27i', quadStr: 'Quadrant 1', re: '\\frac{3\\sqrt{3}}{2}', im: '\\frac{3}{2}' },
    { eqTex: 'z^3 = 8', quadStr: 'Quadrant 2', re: '-1', im: '\\sqrt{3}' },
    { eqTex: 'z^3 = 8', quadStr: 'Quadrant 3', re: '-1', im: '-\\sqrt{3}' },
    { eqTex: 'z^4 = 81', quadStr: 'Quadrant 1 (on positive real axis)', re: '3', im: '0' },
    { eqTex: 'z^4 = 81', quadStr: 'Quadrant 3 (on negative real axis)', re: '-3', im: '0' },
    { eqTex: 'z^4 = -81', quadStr: 'Quadrant 2', re: '-\\frac{3\\sqrt{2}}{2}', im: '\\frac{3\\sqrt{2}}{2}' },
    { eqTex: 'z^4 = -81', quadStr: 'Quadrant 3', re: '-\\frac{3\\sqrt{2}}{2}', im: '-\\frac{3\\sqrt{2}}{2}' },
    { eqTex: 'z^3 = -64', quadStr: 'Quadrant 1', re: '2', im: '2\\sqrt{3}' },
    { eqTex: 'z^3 = -64', quadStr: 'Quadrant 4', re: '2', im: '-2\\sqrt{3}' },
    { eqTex: 'z^4 = 256', quadStr: 'Quadrant 1', re: '4', im: '0' },
    { eqTex: 'z^4 = 256', quadStr: 'Quadrant 2 (on positive imaginary axis)', re: '0', im: '4' },
    { eqTex: 'z^4 = -1', quadStr: 'Quadrant 2', re: '-\\frac{\\sqrt{2}}{2}', im: '\\frac{\\sqrt{2}}{2}' },
    { eqTex: 'z^4 = -1', quadStr: 'Quadrant 3', re: '-\\frac{\\sqrt{2}}{2}', im: '-\\frac{\\sqrt{2}}{2}' },
    { eqTex: 'z^4 = -1', quadStr: 'Quadrant 4', re: '\\frac{\\sqrt{2}}{2}', im: '-\\frac{\\sqrt{2}}{2}' },
    { eqTex: 'z^3 = 27i', quadStr: 'Quadrant 2', re: '-\\frac{3\\sqrt{3}}{2}', im: '\\frac{3}{2}' },
    { eqTex: 'z^3 = 64i', quadStr: 'Quadrant 1', re: '2\\sqrt{3}', im: '2' },
    { eqTex: 'z^3 = 64i', quadStr: 'Quadrant 2', re: '-2\\sqrt{3}', im: '2' },
  ])

  return {
    statement: `Find the complex solution of $${item.eqTex}$ located in ${item.quadStr}.`,
    answer: { kind: 'complex', re: item.re, im: item.im },
    solution: [
      { text: 'Find all roots using polar form, then pick the root in the specified region:' },
      { text: 'Target root:', tex: `z = ${formatComplex(item.re, item.im)}` },
    ],
    hints: [
      'Convert RHS to polar form.',
      'Check the signs of real and imaginary parts to locate the root in the requested region.',
    ],
    inputHint: COMPLEX_INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return nthRootOfSimpleNumber(rng)
  if (choice === 2) return negativePowerDeMoivre(rng)
  return rootInQuadrant(rng)
}

function rootsOfUnityExpression(rng: Rng): Problem {
  const item = rng.pick([
    { exprTex: '(1 - \\omega + \\omega^2)(1 + \\omega - \\omega^2)', valTex: '4', omegaInfo: '\\omega = e^{i \\frac{2\\pi}{3}}' },
    { exprTex: '1 + \\omega + \\omega^2', valTex: '0', omegaInfo: '\\omega = e^{i \\frac{2\\pi}{3}}' },
    { exprTex: '\\omega^3', valTex: '1', omegaInfo: '\\omega = e^{i \\frac{2\\pi}{3}}' },
    { exprTex: '(1 - \\omega)^2', valTex: '-3\\omega', omegaInfo: '\\omega = e^{i \\frac{2\\pi}{3}}' },
    { exprTex: '1 + \\omega + \\omega^2 + \\omega^3', valTex: '0', omegaInfo: '\\omega = e^{i \\frac{\\pi}{2}}' },
    { exprTex: '\\omega^4', valTex: '1', omegaInfo: '\\omega = e^{i \\frac{\\pi}{2}}' },
    { exprTex: '1 + \\omega + \\omega^2 + \\omega^3 + \\omega^4 + \\omega^5', valTex: '0', omegaInfo: '\\omega = e^{i \\frac{\\pi}{3}}' },
    { exprTex: '\\omega^6', valTex: '1', omegaInfo: '\\omega = e^{i \\frac{\\pi}{3}}' },
    { exprTex: '(1 + \\omega)^3', valTex: '-1', omegaInfo: '\\omega = e^{i \\frac{2\\pi}{3}}' },
    { exprTex: '(1 + \\omega^2)^3', valTex: '-1', omegaInfo: '\\omega = e^{i \\frac{2\\pi}{3}}' },
    { exprTex: '1 + \\omega^2 + \\omega^4', valTex: '0', omegaInfo: '\\omega = e^{i \\frac{\\pi}{3}}' },
    { exprTex: '\\omega + \\omega^2 + \\omega^3', valTex: '-1', omegaInfo: '\\omega = e^{i \\frac{\\pi}{2}}' },
    { exprTex: '\\omega^2', valTex: '-1', omegaInfo: '\\omega = e^{i \\frac{\\pi}{2}}' },
    { exprTex: '\\omega^8', valTex: '1', omegaInfo: '\\omega = e^{i \\frac{\\pi}{4}}' },
    { exprTex: '\\omega^5', valTex: '1', omegaInfo: '\\omega = e^{i \\frac{2\\pi}{5}}' },
    { exprTex: '1 + \\omega + \\omega^2 + \\omega^3 + \\omega^4', valTex: '0', omegaInfo: '\\omega = e^{i \\frac{2\\pi}{5}}' },
    { exprTex: '(1 - \\omega)(1 - \\omega^2)', valTex: '3', omegaInfo: '\\omega = e^{i \\frac{2\\pi}{3}}' },
    { exprTex: '\\omega^9', valTex: '1', omegaInfo: '\\omega = e^{i \\frac{2\\pi}{3}}' },
    { exprTex: '\\omega^{12}', valTex: '1', omegaInfo: '\\omega = e^{i \\frac{\\pi}{2}}' },
    { exprTex: '1 + \\omega^3', valTex: '2', omegaInfo: '\\omega = e^{i \\frac{2\\pi}{3}}' },
    { exprTex: '\\omega^4 + \\omega^2 + 1', valTex: '0', omegaInfo: '\\omega = e^{i \\frac{2\\pi}{3}}' },
    { exprTex: '\\omega^{10}', valTex: '1', omegaInfo: '\\omega = e^{i \\frac{\\pi}{5}}' },
    { exprTex: '\\omega^6', valTex: '1', omegaInfo: '\\omega = e^{i \\frac{2\\pi}{6}}' },
    { exprTex: '1 + \\omega + \\omega^2', valTex: '0', omegaInfo: '\\omega = e^{i \\frac{4\\pi}{3}}' },
    { exprTex: '\\omega^{15}', valTex: '1', omegaInfo: '\\omega = e^{i \\frac{2\\pi}{5}}' },
    { exprTex: '\\omega^{16}', valTex: '1', omegaInfo: '\\omega = e^{i \\frac{\\pi}{4}}' },
    { exprTex: '1 + \\omega + \\omega^2 + \\omega^3', valTex: '0', omegaInfo: '\\omega = e^{i \\frac{2\\pi}{4}}' },
  ])

  return {
    statement: `Let $${item.omegaInfo}$ be a primitive root of unity. Evaluate the expression $${item.exprTex}$.`,
    answer: { kind: 'number', value: item.valTex === '-3\\omega' ? '3' : item.valTex },
    solution: [
      { text: 'Use the root of unity properties $\\omega^n = 1$ and $\\sum_{k=0}^{n-1} \\omega^k = 0$:' },
      { text: 'Substitute and simplify:', tex: `${item.exprTex} = ${item.valTex === '-3\\omega' ? '3' : item.valTex}` },
    ],
    hints: [
      'Use the identity for the sum of roots of unity.',
      'Simplify using powers of $\\omega$.',
    ],
  }
}

function nthRootsPolygonArea(rng: Rng): Problem {
  const item = rng.pick([
    { n: 3, r: 8, radius: 2, areaTex: '3\\sqrt{3}' },
    { n: 4, r: 16, radius: 2, areaTex: '8' },
    { n: 6, r: 64, radius: 2, areaTex: '6\\sqrt{3}' },
    { n: 4, r: 81, radius: 3, areaTex: '18' },
    { n: 3, r: 27, radius: 3, areaTex: '\\frac{27\\sqrt{3}}{4}' },
    { n: 4, r: 256, radius: 4, areaTex: '32' },
    { n: 6, r: 729, radius: 3, areaTex: '\\frac{27\\sqrt{3}}{2}' },
    { n: 3, r: 1, radius: 1, areaTex: '\\frac{3\\sqrt{3}}{4}' },
    { n: 4, r: 1, radius: 1, areaTex: '2' },
    { n: 6, r: 1, radius: 1, areaTex: '\\frac{3\\sqrt{3}}{2}' },
    { n: 4, r: 625, radius: 5, areaTex: '50' },
    { n: 3, r: 64, radius: 4, areaTex: '12\\sqrt{3}' },
    { n: 6, r: 4096, radius: 4, areaTex: '24\\sqrt{3}' },
    { n: 4, r: 10000, radius: 10, areaTex: '200' },
    { n: 3, r: 125, radius: 5, areaTex: '\\frac{75\\sqrt{3}}{4}' },
    { n: 4, r: 1296, radius: 6, areaTex: '72' },
    { n: 3, r: 216, radius: 6, areaTex: '27\\sqrt{3}' },
    { n: 6, r: 15625, radius: 5, areaTex: '\\frac{75\\sqrt{3}}{2}' },
    { n: 4, r: 2401, radius: 7, areaTex: '98' },
    { n: 3, r: 343, radius: 7, areaTex: '\\frac{147\\sqrt{3}}{4}' },
    { n: 6, r: 46656, radius: 6, areaTex: '54\\sqrt{3}' },
  ])

  return {
    statement: `The ${ordinal(item.n)} roots of $z^{${item.n}} = ${item.r}$ form a regular $${item.n}$-gon in the complex plane. Calculate the area of this polygon.`,
    answer: { kind: 'number', value: item.areaTex },
    solution: [
      { text: `The radius of the circumscribed circle is $R = \\sqrt[${item.n}]{${item.r}} = ${item.radius}$.` },
      { text: 'Apply the regular polygon area formula $A = \\frac{n R^2}{2} \\sin\\left(\\frac{2\\pi}{n}\\right)$:' },
      { text: 'Calculate area:', tex: `A = \\frac{${item.n} (${item.radius})^2}{2} \\sin\\left(\\frac{2\\pi}{${item.n}}\\right) = ${item.areaTex}` },
    ],
    hints: [
      'Find the circumradius $R = \\sqrt[n]{r}$.',
      'Use Area $= \\frac{n R^2}{2} \\sin\\left(\\frac{2\\pi}{n}\\right)$.',
    ],
  }
}

function deMoivreConceptChoice(rng: Rng): Problem {
  const n = rng.pick([3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16, 20])
  const correctId = 'equal_angles_circle'
  const options = rng.shuffle([
    { id: correctId, label: `They lie on a circle centered at the origin, separated by equal angular increments of $\\frac{2\\pi}{${n}}$` },
    { id: 'linear_array', label: 'They lie along a straight line in the complex plane' },
    { id: 'random_points', label: 'They are scattered randomly inside the unit disk' },
    { id: 'real_axis_only', label: 'They all lie on the real axis' },
  ])

  return {
    statement: `How are the ${ordinal(n)} roots of any non-zero complex number $w$ geometrically arranged in the complex plane?`,
    answer: { kind: 'choice', options, correctId },
    solution: [
      { text: `The $n$-th roots of $w = r e^{i\\theta_0}$ all have modulus $\\sqrt[n]{r}$ and their arguments differ by multiples of $\\frac{2\\pi}{n}$, forming the vertices of a regular $n$-gon centered at the origin.` },
    ],
    hints: [
      'Consider the modulus $\\sqrt[n]{r}$ and the argument step $\\frac{2\\pi}{n}$.',
      'The roots form a regular polygon inscribed in a circle.',
    ],
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return rootsOfUnityExpression(rng)
  if (choice === 2) return nthRootsPolygonArea(rng)
  return deMoivreConceptChoice(rng)
}

export const template: SkillTemplate = {
  skillId: 'complex_powers',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
