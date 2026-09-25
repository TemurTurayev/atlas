import { coefPrefix, joinTerms, linear, paren } from '../../math/latex'
import { matLatex, type Mat } from '../../math/matrix'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'The characteristic polynomial of a square matrix $A$ is $p(\\lambda) = \\det(A - \\lambda I)$; its roots are exactly the eigenvalues of $A$.',
  'For a $2\\times2$ matrix $A=\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}$, subtracting $\\lambda$ from each diagonal entry gives $p(\\lambda) = (a-\\lambda)(d-\\lambda) - bc = \\lambda^{2} - (a+d)\\lambda + (ad-bc)$.',
  'For a triangular matrix, $A - \\lambda I$ is triangular too, so $p(\\lambda)$ is just the product of the diagonal entries $(a_{ii}-\\lambda)$ — the eigenvalues are the diagonal entries themselves.',
  'The same idea extends to a block triangular matrix: if a row (or column) is zero except on the diagonal, expanding $\\det(A-\\lambda I)$ along it splits $p(\\lambda)$ into a product of smaller factors.',
  'A root of $p(\\lambda)$ that repeats $k$ times is an eigenvalue of algebraic multiplicity $k$; list it only once in a set of eigenvalues.',
  'Common mistakes: dropping the minus sign inside $(a-\\lambda)$; writing the constant term as $bc-ad$ instead of $ad-bc$.',
].join('\n')

const HINTS_POLY = [
  'Subtract $\\lambda$ from each diagonal entry to form $A-\\lambda I$, then take its determinant exactly as you would for any $2\\times2$ matrix.',
  'For $A=\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}$, the result is $p(\\lambda)=\\lambda^{2}-(a+d)\\lambda+(ad-bc)$.',
]
const HINTS_EIGEN2 = [
  'Write the characteristic polynomial using the trace and determinant of the matrix: $p(\\lambda)=\\lambda^{2}-\\operatorname{tr}(A)\\lambda+\\det(A)$.',
  'Factor the quadratic in $\\lambda$ (or use the quadratic formula) — each factor $(\\lambda-r)$ gives one eigenvalue $r$.',
]
const HINTS_EIGEN3 = [
  'Check first whether the matrix is triangular, or block triangular with a row or column that is zero except on the diagonal — either shortcut avoids expanding a full $3\\times3$ determinant.',
  'Whatever is left after the shortcut is at most a quadratic in $\\lambda$; factor it the same way as in the $2\\times2$ case.',
]

const INPUT_HINT_LAMBDA = 'Type the variable as lambda, e.g. lambda^2-3lambda+2'
const INPUT_HINT_SET = 'Eigenvalues separated by commas, e.g. 2, -3. List a repeated eigenvalue only once'

const wrap = (s: string): string => `\\left(${s}\\right)`

/** "a-\\lambda" (or just "-\\lambda" when a is 0). */
const diagEntry = (v: number): string => joinTerms([String(v), '-\\lambda'])

/** $\\lambda^{2}-(a+d)\\lambda+(ad-bc)$ for $A=\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}$. */
function charPoly2Latex(a: number, b: number, c: number, d: number): string {
  const trace = a + d
  const det = a * d - b * c
  const traceTerm = trace === 0 ? '' : `${coefPrefix(-trace)}\\lambda`
  return joinTerms(['\\lambda^{2}', traceTerm, String(det)])
}

/** $\\left(\\lambda - r\\right)$, the factor for eigenvalue r. */
const bracketLambda = (r: number): string => wrap(linear(1, -r, '\\lambda'))

function distinctList(values: readonly number[]): string[] {
  const seen: number[] = []
  for (const v of values) if (!seen.includes(v)) seen.push(v)
  return seen.map(String)
}

/** Two eigenvalues in [lo, hi]; sometimes the same value twice (a repeated eigenvalue). */
function pickEigenvaluePair(rng: Rng, lo: number, hi: number, repeatChance: number): readonly [number, number] {
  const l1 = rng.int(lo, hi)
  if (rng.chance(repeatChance)) return [l1, l1]
  const l2 = rng.intExcept(lo, hi, [l1])
  return [l1, l2]
}

/** A 2×2 integer matrix, not triangular, whose eigenvalues are exactly l1 and l2. */
function buildMatrixFromEigenvalues2(rng: Rng, l1: number, l2: number): Mat {
  const trace = l1 + l2
  const det = l1 * l2
  const pool = [1, -1, 2, -2]
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const a = rng.int(-3, 3)
    const d = trace - a
    const need = a * d - det
    for (const b of rng.shuffle(pool)) {
      if (need % b === 0) {
        const c = need / b
        if (c !== 0) return [[a, b], [c, d]]
      }
    }
  }
  throw new Error('char_poly: could not build a 2x2 matrix for the given eigenvalues')
}

function tier1(rng: Rng): Problem {
  const a = rng.int(-4, 4)
  const b = rng.int(-4, 4)
  const c = rng.int(-4, 4)
  const d = rng.int(-4, 4)
  const mat: Mat = [
    [a, b],
    [c, d],
  ]
  const poly = charPoly2Latex(a, b, c, d)
  const matDiag = matLatex([
    [diagEntry(a), String(b)],
    [String(c), diagEntry(d)],
  ])

  return {
    statement: `Find the characteristic polynomial $p(\\lambda) = \\det(A - \\lambda I)$ of $A = ${matLatex(mat)}$, written as a polynomial in $\\lambda$ (type the Greek letter as lambda).`,
    answer: { kind: 'expression', value: poly, variables: ['lambda'] },
    solution: [
      { text: 'Subtract $\\lambda$ from each diagonal entry to form $A - \\lambda I$:', tex: `A - \\lambda I = ${matDiag}` },
      { text: 'Take the determinant exactly as for any $2\\times2$ matrix:', tex: `\\det(A-\\lambda I) = ${wrap(diagEntry(a))}\\cdot${wrap(diagEntry(d))} - ${paren(b)}\\cdot${paren(c)}` },
      { text: 'Expand and collect the $\\lambda$ terms:', tex: `p(\\lambda) = ${poly}` },
    ],
    hints: HINTS_POLY,
    inputHint: INPUT_HINT_LAMBDA,
  }
}

function tier2(rng: Rng): Problem {
  const [l1, l2] = pickEigenvaluePair(rng, -3, 3, 0.3)
  const mat = buildMatrixFromEigenvalues2(rng, l1, l2)
  const [[a, b], [c, d]] = mat
  const poly = charPoly2Latex(a, b, c, d)
  const values = distinctList([l1, l2])

  const factorSteps: SolutionStep[] =
    l1 === l2
      ? [
          { text: 'This factors as a perfect square:', tex: `p(\\lambda) = ${bracketLambda(l1)}^{2}` },
          { text: `So $\\lambda = ${l1}$ is a repeated eigenvalue (algebraic multiplicity $2$).` },
        ]
      : [
          { text: 'Factor this quadratic in $\\lambda$:', tex: `p(\\lambda) = ${bracketLambda(l1)}${bracketLambda(l2)}` },
          { text: 'Setting each factor to zero gives the eigenvalues:', tex: `\\lambda = ${l1}, \\quad \\lambda = ${l2}` },
        ]

  return {
    statement: `Find the eigenvalues of $A = ${matLatex(mat)}$.`,
    answer: { kind: 'numberSet', values },
    solution: [
      { text: 'Write the characteristic polynomial using the trace and determinant of $A$:', tex: `p(\\lambda) = ${poly}` },
      ...factorSteps,
    ],
    hints: HINTS_EIGEN2,
    inputHint: INPUT_HINT_SET,
  }
}

function triangularEigen3(rng: Rng): Problem {
  const upper = rng.chance(0.5)
  const diag: readonly [number, number, number] = [rng.int(-4, 4), rng.int(-4, 4), rng.int(-4, 4)]
  const free = (): number => rng.intExcept(-3, 3, [0])
  const mat: Mat = upper
    ? [
        [diag[0], free(), free()],
        [0, diag[1], free()],
        [0, 0, diag[2]],
      ]
    : [
        [diag[0], 0, 0],
        [free(), diag[1], 0],
        [free(), free(), diag[2]],
      ]
  const side = upper ? 'below' : 'above'
  const values = distinctList(diag)

  return {
    statement: `Find the eigenvalues of $A = ${matLatex(mat)}$.`,
    answer: { kind: 'numberSet', values },
    solution: [
      { text: `This matrix is triangular: every entry ${side} the diagonal is $0$.` },
      {
        text: 'For a triangular matrix, $A-\\lambda I$ is triangular too, and its determinant is the product of the diagonal entries — no expansion needed:',
        tex: `p(\\lambda) = ${wrap(diagEntry(diag[0]))}${wrap(diagEntry(diag[1]))}${wrap(diagEntry(diag[2]))}`,
      },
      { text: 'So the eigenvalues are exactly the diagonal entries:', tex: `\\lambda = ${diag[0]}, \\quad \\lambda = ${diag[1]}, \\quad \\lambda = ${diag[2]}` },
    ],
    hints: HINTS_EIGEN3,
    inputHint: INPUT_HINT_SET,
  }
}

function blockEigen3(rng: Rng): Problem {
  const e1 = rng.int(-3, 3)
  const [e2, e3] = pickEigenvaluePair(rng, -3, 3, 0.2)
  const sub = buildMatrixFromEigenvalues2(rng, e2, e3)
  const x = rng.intExcept(-3, 3, [0])
  const y = rng.intExcept(-3, 3, [0])
  const mat: Mat = [
    [e1, 0, 0],
    [x, sub[0][0], sub[0][1]],
    [y, sub[1][0], sub[1][1]],
  ]
  const subPoly = charPoly2Latex(sub[0][0], sub[0][1], sub[1][0], sub[1][1])
  const values = distinctList([e1, e2, e3])

  const factorSteps: SolutionStep[] =
    e2 === e3
      ? [{ text: 'The remaining quadratic factors as a perfect square:', tex: `${bracketLambda(e2)}^{2} = 0 \\;\\Rightarrow\\; \\lambda = ${e2} \\text{ (multiplicity }2\\text{)}` }]
      : [{ text: 'Factor the remaining quadratic:', tex: `${bracketLambda(e2)}${bracketLambda(e3)} = 0 \\;\\Rightarrow\\; \\lambda = ${e2}, \\; \\lambda = ${e3}` }]

  return {
    statement: `Find the eigenvalues of $A = ${matLatex(mat)}$.`,
    answer: { kind: 'numberSet', values },
    solution: [
      {
        text: 'The first row is zero except on the diagonal, so the matrix is block triangular. Expanding $\\det(A-\\lambda I)$ along that row leaves the diagonal factor times the determinant of the remaining $2\\times2$ block:',
        tex: `\\det(A-\\lambda I) = ${wrap(diagEntry(e1))}\\cdot\\det${matLatex([
          [diagEntry(sub[0][0]), String(sub[0][1])],
          [String(sub[1][0]), diagEntry(sub[1][1])],
        ])}`,
      },
      { text: 'One eigenvalue comes straight from the diagonal factor:', tex: `\\lambda = ${e1}` },
      { text: 'Expand the remaining $2\\times2$ block using its trace and determinant:', tex: `p_2(\\lambda) = ${subPoly}` },
      ...factorSteps,
    ],
    hints: HINTS_EIGEN3,
    inputHint: INPUT_HINT_SET,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? triangularEigen3(rng) : blockEigen3(rng)
}

export const template: SkillTemplate = {
  skillId: 'char_poly',
  theory,
  expectedSeconds: { 1: 70, 2: 110, 3: 220 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
