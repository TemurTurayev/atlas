import { paren } from '../../math/latex'
import { addMat, adjugate2, apply, det2, identity, matLatex, multiply, scaleMat, transpose, type Mat } from '../../math/matrix'
import { rat, ratToLatex } from '../../math/rational'
import { normSquared, vecLatex, type Vec } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'When the columns of $A$ are nearly dependent, $A^{T}A$ is close to singular and the least-squares solution $\\hat x$ can become huge and unstable — a tiny change in the data swings it wildly.',
  'Ridge regression tames this by solving $(A^{T}A+\\lambda I)\\hat x_\\lambda = A^{T}\\vec b$ instead, for a chosen penalty $\\lambda > 0$.',
  'Adding $\\lambda I$ changes only the diagonal of $A^{T}A$; it leaves $A^{T}\\vec b$ untouched.',
  'For any $\\lambda>0$ the matrix $A^{T}A+\\lambda I$ is invertible, even when $A^{T}A$ itself is not.',
  'As $\\lambda$ grows, $\\hat x_\\lambda$ shrinks toward $\\vec 0$: the ridge solution is never longer than the plain least-squares one, and usually strictly shorter.',
  'Common mistakes: adding $\\lambda$ to every entry of $A^{T}A$ instead of only the diagonal; changing $A^{T}\\vec b$ as well, when only the matrix on the left should change; assuming a bigger $\\lambda$ always gives a better fit rather than trading a little bias for stability.',
].join('\n')

const INPUT_HINT_MATRIX = 'One number per entry, left to right, top to bottom'
const INPUT_HINT_VECTOR = 'One number per component, top to bottom'
const INPUT_HINT_NUMBER = 'A single number'

const HINTS_RIDGE_MATRIX = [
  'First form the ordinary $A^{T}A$, exactly as in a plain least-squares problem.',
  '$\\lambda I$ only touches the diagonal: add $\\lambda$ to each diagonal entry of $A^{T}A$ and leave the off-diagonal entries unchanged.',
]
const HINTS_RIDGE_SOLVE = [
  'Build $A^{T}A$, add $\\lambda I$ to it, and compute $A^{T}\\vec b$ — then you have a $2\\times2$ system just like an ordinary least-squares fit.',
  'Solve $(A^{T}A+\\lambda I)\\hat x_\\lambda=A^{T}\\vec b$ the way you invert a $2\\times2$ matrix: form the adjugate of the left-hand matrix, apply it to the right-hand vector, then divide by the determinant.',
]
const HINTS_SHRINK = [
  'Square each component of a vector and add them up to get its squared length $\\|\\cdot\\|^{2}$ — no square roots needed.',
  'Compute $\\|\\hat x\\|^{2}$ and $\\|\\hat x_\\lambda\\|^{2}$ separately, then subtract the ridge one from the plain one.',
]

const asGrid = (m: Mat): string[][] => m.map((row) => row.map(String))
const asVec = (v: Vec): string[] => v.map(String)

/** Everything random about tier 1: a design matrix and a small penalty. */
export interface RidgeMatrixCase {
  readonly a: Mat
  readonly lambda: number
}

export function buildRidgeMatrixCase(rng: Rng): RidgeMatrixCase {
  const m = rng.pick([3, 4])
  const a: number[][] = Array.from({ length: m }, () => [rng.intExcept(-4, 4, [0]), rng.intExcept(-4, 4, [0])])
  const lambda = rng.int(1, 4)
  return { a, lambda }
}

function tier1(rng: Rng): Problem {
  const { a, lambda } = buildRidgeMatrixCase(rng)
  const normalMat = multiply(transpose(a), a)
  const penalty = scaleMat(lambda, identity(2))
  const value = addMat(normalMat, penalty)

  return {
    statement: `A least-squares fit uses the design matrix $A = ${matLatex(asGrid(a))}$. For a ridge penalty $\\lambda = ${lambda}$, write the ridge matrix $A^{T}A + \\lambda I$.`,
    answer: { kind: 'matrix', rows: asGrid(value) },
    solution: [
      { text: 'Form the ordinary $A^{T}A$, exactly as for a plain least-squares fit:', tex: `A^{T}A = ${matLatex(asGrid(normalMat))}` },
      {
        text: `Add $\\lambda I = ${lambda}I$ — this changes only the diagonal:`,
        tex: `A^{T}A + \\lambda I = ${matLatex(asGrid(normalMat))} + ${matLatex(asGrid(penalty))} = ${matLatex(asGrid(value))}`,
      },
    ],
    hints: HINTS_RIDGE_MATRIX,
    inputHint: INPUT_HINT_MATRIX,
  }
}

/**
 * Everything random about tiers 2 and 3: a unimodular $2\times2$ design matrix $A=\begin{pmatrix}1&s\\t&1+st\end{pmatrix}$
 * (determinant exactly $1$ for any $s,t$), a clean target ridge solution $\hat x_\lambda=(p,q)$, and a penalty
 * $\lambda$. The measurement vector $\vec b$ is then reverse-engineered so that $(A^{T}A+\lambda I)\hat x_\lambda=A^{T}\vec b$
 * holds exactly: since $\det A=1$, $b=(A^{T})^{-1}\big[(A^{T}A+\lambda I)\hat x_\lambda\big]$ comes out to whole numbers.
 */
export interface RidgeSolveCase {
  readonly a: Mat
  readonly b: Vec
  readonly lambda: number
  readonly xhat: readonly [number, number]
}

export function buildRidgeSolveCase(rng: Rng): RidgeSolveCase {
  const s = rng.int(-1, 1)
  const t = rng.int(-1, 1)
  const a: Mat = [
    [1, s],
    [t, 1 + s * t],
  ]
  const p = rng.intExcept(-2, 2, [0])
  const q = rng.intExcept(-2, 2, [0])
  const lambda = rng.int(1, 2)

  const at = transpose(a)
  const normalMat = multiply(at, a)
  const ridgeMat = addMat(normalMat, scaleMat(lambda, identity(2)))
  const target = apply(ridgeMat, [p, q])
  const b = apply(adjugate2(at), target)

  return { a, b, lambda, xhat: [p, q] }
}

function tier2(rng: Rng): Problem {
  const { a, b, lambda, xhat } = buildRidgeSolveCase(rng)
  const at = transpose(a)
  const normalMat = multiply(at, a)
  const ridgeMat = addMat(normalMat, scaleMat(lambda, identity(2)))
  const rhs = apply(at, b)
  const detM = det2(ridgeMat)
  const adjM = adjugate2(ridgeMat)
  const adjRhs = apply(adjM, rhs)
  const xhatLatex = adjRhs.map((v) => ratToLatex(rat(v, detM)))

  return {
    statement: `Given the design matrix $A = ${matLatex(asGrid(a))}$, the measurement vector $\\vec b = ${vecLatex(asVec(b))}$, and ridge penalty $\\lambda = ${lambda}$, solve $(A^{T}A+\\lambda I)\\hat x_\\lambda = A^{T}\\vec b$ for $\\hat x_\\lambda$.`,
    answer: { kind: 'vector', components: xhat.map(String) },
    solution: [
      {
        text: 'Form the ridge matrix and the right-hand side:',
        tex: `A^{T}A + \\lambda I = ${matLatex(asGrid(ridgeMat))} \\qquad A^{T}\\vec b = ${vecLatex(asVec(rhs))}`,
      },
      {
        text: 'Solve the $2\\times2$ system as you would invert a matrix — form the adjugate of $A^{T}A+\\lambda I$ and apply it to $A^{T}\\vec b$:',
        tex: `\\text{adj}(A^{T}A+\\lambda I)\\,(A^{T}\\vec b) = ${matLatex(asGrid(adjM))}${vecLatex(asVec(rhs))} = ${vecLatex(asVec(adjRhs))}`,
      },
      {
        text: `Divide by $\\det(A^{T}A+\\lambda I) = ${detM}$ to get $\\hat x_\\lambda$:`,
        tex: `\\hat x_\\lambda = \\dfrac{1}{${detM}}${vecLatex(asVec(adjRhs))} = ${vecLatex(xhatLatex)}`,
      },
    ],
    hints: HINTS_RIDGE_SOLVE,
    inputHint: INPUT_HINT_VECTOR,
  }
}

function tier3(rng: Rng): Problem {
  const { a, b, lambda, xhat } = buildRidgeSolveCase(rng)
  const plain = apply(adjugate2(a), b)
  const normSqPlain = normSquared(plain)
  const normSqRidge = normSquared(xhat)
  const shrink = normSqPlain - normSqRidge

  const squareTerms = (v: Vec): string => v.map((c) => `${paren(c)}^{2}`).join(' + ')

  return {
    statement: `For the design matrix $A = ${matLatex(asGrid(a))}$ and measurement vector $\\vec b = ${vecLatex(asVec(b))}$, the plain least-squares solution is $\\hat x = ${vecLatex(asVec(plain))}$, and with ridge penalty $\\lambda = ${lambda}$ it becomes $\\hat x_\\lambda = ${vecLatex(asVec(xhat))}$. By how much does $\\|\\hat x\\|^{2}$ exceed $\\|\\hat x_\\lambda\\|^{2}$?`,
    answer: { kind: 'number', value: String(shrink) },
    solution: [
      {
        text: 'Square and add the components of each solution — no square roots needed:',
        tex: `\\|\\hat x\\|^{2} = ${squareTerms(plain)} = ${normSqPlain} \\qquad \\|\\hat x_\\lambda\\|^{2} = ${squareTerms(xhat)} = ${normSqRidge}`,
      },
      { text: 'Subtract:', tex: `${normSqPlain} - ${normSqRidge} = ${shrink}` },
      {
        text: 'The ridge solution is never longer than the plain least-squares one: the penalty trades a little bias for a smaller, steadier coefficient vector, which matters most when the columns of $A$ are nearly dependent.',
      },
    ],
    hints: HINTS_SHRINK,
    inputHint: INPUT_HINT_NUMBER,
  }
}

export const template: SkillTemplate = {
  skillId: 'regularization',
  theory,
  expectedSeconds: { 1: 80, 2: 170, 3: 90 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
