import { coefPrefix, joinTerms, paren } from '../../math/latex'
import { adjugate2, apply, det2, matLatex, multiply, transpose, type Mat } from '../../math/matrix'
import { gcd, rat, ratToLatex } from '../../math/rational'
import { tupleLatex, vecLatex, type Vec } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'When there are more data points than unknowns, the system $A\\vec x=\\vec b$ usually has no exact solution — the best $\\hat x$ is the one that makes $A\\hat x$ as close to $\\vec b$ as possible.',
  'That best $\\hat x$ solves the normal equations $A^{T}A\\hat x=A^{T}\\vec b$, found by multiplying both sides of $A\\vec x=\\vec b$ by $A^{T}$.',
  'Fitting a line $y=a+bx$ through points $(x_i,y_i)$ is exactly this: the design matrix $A$ has a column of ones and a column of the $x_i$, $\\vec b$ holds the $y_i$, and $\\hat x$ collects the intercept $a$ and the slope $b$.',
  'Once $\\hat x$ is known, the fitted line predicts $a+bx$ at any $x$, and the residual at a measured point is $y_i-(a+bx_i)$ — how far that one measurement sits from the line.',
  '$A^{T}A$ is invertible exactly when the columns of $A$ are independent — for a line, that just means the $x_i$ are not all equal.',
  'Common mistakes: multiplying by $A^{T}$ on only one side of the equation; confusing the square matrix $A^{T}A$ with the different square matrix $AA^{T}$; swapping the intercept and the slope in the final answer.',
].join('\n')

const INPUT_HINT_MATRIX = 'One number per entry, left to right, top to bottom'
const INPUT_HINT_VECTOR = 'One number per component, top to bottom'
const INPUT_HINT_COEFFS = 'Two numbers: intercept first, then slope'
const INPUT_HINT_NUMBER = 'A single number; it may be negative'

const HINTS_NORMAL_EQ = [
  'Transpose $A$ first — its rows become the columns of $A^{T}$.',
  'Whether the target is $A^{T}A$ or $A^{T}\\vec b$, multiply $A^{T}$ against the columns of $A$ (or against $\\vec b$) exactly as in ordinary matrix multiplication: row of $A^{T}$ dotted with column.',
]
const HINTS_LINE_FIT = [
  'Build the design matrix $A$ from a column of ones and the $x$-values, and $\\vec b$ from the $y$-values, then set up $A^{T}A\\hat x=A^{T}\\vec b$.',
  'Solve that $2\\times2$ system the way you invert a $2\\times2$ matrix: form the adjugate of $A^{T}A$, apply it to $A^{T}\\vec b$, then divide every entry by $\\det(A^{T}A)$.',
]
const HINTS_PREDICT = [
  'The fitted line gives $y$ for any $x$ by evaluating $a+bx$ — substitute the $x$ you were given.',
  'Plug the stated $x$ into $y=a+bx$ using the stated $a$ and $b$, then simplify.',
]
const HINTS_RESIDUAL = [
  'The residual compares the measured $y$ against what the line predicts at that same $x$.',
  'First evaluate the line at that $x$ to get the predicted value, then compute measured minus predicted: $y_i-(a+bx_i)$.',
]

const asGrid = (m: Mat): string[][] => m.map((row) => row.map(String))
const asVec = (v: Vec): string[] => v.map(String)

/** Row of one matrix dotted with a column of another, written out with signs. */
const entryExpr = (row: readonly number[], col: readonly number[]): string =>
  row.map((x, k) => `${paren(x)}\\cdot${paren(col[k])}`).join(' + ')

const productExprGrid = (a: Mat, b: Mat): string => {
  const bCols = transpose(b)
  return matLatex(a.map((row) => bCols.map((col) => entryExpr(row, col))))
}

/** $y=a+bx$, written with the usual sign conventions ($b=1$ drops to "+x", $a=0$ drops the constant). */
const lineLatex = (a: number, b: number): string => joinTerms([String(a), `${coefPrefix(b)}x`])

/** Everything random about tier 1: a design matrix, a matching measurement vector, and which product is asked for. */
export interface NormalEquationsCase {
  readonly a: Mat
  readonly b: Vec
  readonly wantMatrix: boolean
}

export function buildNormalEquationsCase(rng: Rng): NormalEquationsCase {
  const m = rng.pick([3, 4])
  const wantMatrix = rng.chance(0.5)
  const a: number[][] = Array.from({ length: m }, () => [rng.intExcept(-4, 4, [0]), rng.intExcept(-4, 4, [0])])
  const b = Array.from({ length: m }, () => rng.intExcept(-5, 5, [0]))
  return { a, b, wantMatrix }
}

function tier1(rng: Rng): Problem {
  const { a, b, wantMatrix } = buildNormalEquationsCase(rng)
  const at = transpose(a)

  if (wantMatrix) {
    const value = multiply(at, a)
    return {
      statement: `The normal equations for a least-squares fit are built from $A^{T}A$. Given the design matrix $A = ${matLatex(asGrid(a))}$, compute $A^{T}A$.`,
      answer: { kind: 'matrix', rows: asGrid(value) },
      solution: [
        { text: 'Transpose $A$ first — rows become columns:', tex: `A^{T} = ${matLatex(asGrid(at))}` },
        { text: 'Multiply $A^{T}$ by $A$, row by column, for every entry:', tex: productExprGrid(at, a) },
        { text: 'That gives', tex: matLatex(asGrid(value)) },
      ],
      hints: HINTS_NORMAL_EQ,
      inputHint: INPUT_HINT_MATRIX,
    }
  }

  const value = apply(at, b)
  const exprRows = at.map((row) => entryExpr(row, b))
  return {
    statement: `The normal equations for a least-squares fit are built from $A^{T}\\vec b$. Given the design matrix $A = ${matLatex(asGrid(a))}$ and the measurement vector $\\vec b = ${vecLatex(asVec(b))}$, compute $A^{T}\\vec b$.`,
    answer: { kind: 'vector', components: asVec(value) },
    solution: [
      { text: 'Transpose $A$ first — rows become columns:', tex: `A^{T} = ${matLatex(asGrid(at))}` },
      { text: 'Dot each row of $A^{T}$ with $\\vec b$:', tex: vecLatex(exprRows) },
      { text: 'That gives', tex: vecLatex(asVec(value)) },
    ],
    hints: HINTS_NORMAL_EQ,
    inputHint: INPUT_HINT_VECTOR,
  }
}

interface LineContext {
  readonly setup: string
  readonly xLabel: string
  readonly yLabel: string
}

const LINE_CONTEXTS: readonly LineContext[] = [
  {
    setup: 'A clinic tests a new drug at several doses and records the change it produces in a patient’s heart rate.',
    xLabel: 'the dose in mg',
    yLabel: 'the heart-rate change in bpm',
  },
  {
    setup: 'A physiology lab varies the concentration of a solution and records the reaction rate it produces.',
    xLabel: 'the concentration',
    yLabel: 'the reaction rate',
  },
  {
    setup: 'A student varies the number of hours spent studying before a set of quizzes and records the score on each one.',
    xLabel: 'the study time in hours',
    yLabel: 'the quiz score',
  },
]

/** Everything random about tier 2: three data points built backwards from a clean intercept and slope. */
export interface LineFitCase {
  readonly ctx: LineContext
  readonly x: readonly number[]
  readonly y: readonly number[]
  readonly a: number
  readonly b: number
}

/**
 * Picks three x-values and an intercept/slope, then builds a residual that is exactly orthogonal to the
 * design matrix's two columns (a telescoping identity: for [x1,x2,x3], (x3-x2, x1-x3, x2-x1) sums to zero
 * and is orthogonal to (x1,x2,x3) too). Adding that residual to the line leaves the least-squares fit
 * exactly equal to the intercept and slope chosen up front.
 */
export function buildLineFitCase(rng: Rng): LineFitCase {
  const ctx = rng.pick(LINE_CONTEXTS)
  const pool = [-3, -2, -1, 0, 1, 2, 3]
  const x = rng.shuffle(pool).slice(0, 3).sort((p, q) => p - q)
  const a = rng.int(-5, 5)
  const b = rng.intExcept(-4, 4, [0])

  const ePrim = [x[2] - x[1], x[0] - x[2], x[1] - x[0]]
  const g = gcd(gcd(Math.abs(ePrim[0]), Math.abs(ePrim[1])), Math.abs(ePrim[2])) || 1
  const eBase = ePrim.map((v) => v / g)
  const k = rng.intExcept(-2, 2, [0])
  const y = x.map((xi, i) => a + b * xi + eBase[i] * k)

  return { ctx, x, y, a, b }
}

function tier2(rng: Rng): Problem {
  const { ctx, x, y, a, b } = buildLineFitCase(rng)

  const design: Mat = x.map((xi) => [1, xi])
  const at = transpose(design)
  const normalMat = multiply(at, design)
  const rhs = apply(at, y)
  const detM = det2(normalMat)
  const adjM = adjugate2(normalMat)
  const adjRhs = apply(adjM, rhs)
  const xhatLatex = adjRhs.map((v) => ratToLatex(rat(v, detM)))

  const points = x.map((xi, i) => tupleLatex([xi, y[i]])).join(', ')

  return {
    statement: `${ctx.setup} Three trials give ($x$ = ${ctx.xLabel}, $y$ = ${ctx.yLabel}): $${points}$. Fit the least-squares line $y = a + bx$ through these three points. Give your answer as $(a,b)$ — the intercept first, then the slope.`,
    answer: { kind: 'vector', components: [String(a), String(b)] },
    solution: [
      {
        text: 'Assemble the design matrix (a column of ones and the $x$-values) and the measurement vector:',
        tex: `A = ${matLatex(asGrid(design))} \\qquad \\vec b = ${vecLatex(asVec(y))}`,
      },
      {
        text: 'Form the normal equations $A^{T}A\\hat x = A^{T}\\vec b$:',
        tex: `A^{T}A = ${matLatex(asGrid(normalMat))} \\qquad A^{T}\\vec b = ${vecLatex(asVec(rhs))}`,
      },
      {
        text: 'Solve that $2\\times2$ system as you would invert a matrix — form the adjugate of $A^{T}A$ and apply it to $A^{T}\\vec b$:',
        tex: `\\text{adj}(A^{T}A)\\,(A^{T}\\vec b) = ${matLatex(asGrid(adjM))}${vecLatex(asVec(rhs))} = ${vecLatex(asVec(adjRhs))}`,
      },
      {
        text: `Divide by $\\det(A^{T}A) = ${detM}$ to get $\\hat x$:`,
        tex: `\\hat x = \\dfrac{1}{${detM}}${vecLatex(asVec(adjRhs))} = ${vecLatex(xhatLatex)}`,
      },
      { text: `So the best-fit line is $y = ${lineLatex(a, b)}$: intercept $a = ${a}$, slope $b = ${b}$.` },
    ],
    hints: HINTS_LINE_FIT,
    inputHint: INPUT_HINT_COEFFS,
  }
}

/** Everything random about a "predict at a new x" tier-3 problem. */
export interface PredictCase {
  readonly ctx: LineContext
  readonly a: number
  readonly b: number
  readonly x0: number
}

export function buildPredictCase(rng: Rng): PredictCase {
  const ctx = rng.pick(LINE_CONTEXTS)
  const a = rng.int(-6, 6)
  const b = rng.intExcept(-4, 4, [0])
  const x0 = rng.intExcept(-6, 6, [0])
  return { ctx, a, b, x0 }
}

function tier3Predict(rng: Rng): Problem {
  const { ctx, a, b, x0 } = buildPredictCase(rng)
  const value = a + b * x0

  return {
    statement: `${ctx.setup} The least-squares fit to the data gives $y = ${lineLatex(a, b)}$, where $x$ is ${ctx.xLabel} and $y$ is ${ctx.yLabel}. Use this fitted line to predict $y$ at $x = ${x0}$.`,
    answer: { kind: 'number', value: String(value) },
    solution: [
      {
        text: 'Substitute the given $x$ into the fitted line:',
        tex: `y = ${a} ${b < 0 ? '-' : '+'} ${coefPrefix(Math.abs(b))}\\cdot${paren(x0)}`,
      },
      { text: 'Simplify:', tex: `y = ${value}` },
    ],
    hints: HINTS_PREDICT,
    inputHint: INPUT_HINT_NUMBER,
  }
}

/** Everything random about a "residual at a measured point" tier-3 problem. */
export interface ResidualCase {
  readonly ctx: LineContext
  readonly a: number
  readonly b: number
  readonly xi: number
  readonly r: number
}

export function buildResidualCase(rng: Rng): ResidualCase {
  const ctx = rng.pick(LINE_CONTEXTS)
  const a = rng.int(-6, 6)
  const b = rng.intExcept(-4, 4, [0])
  const xi = rng.intExcept(-6, 6, [0])
  const r = rng.intExcept(-4, 4, [0])
  return { ctx, a, b, xi, r }
}

function tier3Residual(rng: Rng): Problem {
  const { ctx, a, b, xi, r } = buildResidualCase(rng)
  const predicted = a + b * xi
  const yi = predicted + r

  return {
    statement: `${ctx.setup} The least-squares fit to the data gives $y = ${lineLatex(a, b)}$, where $x$ is ${ctx.xLabel} and $y$ is ${ctx.yLabel}. One trial measured $x = ${xi}$ and $y = ${yi}$. Find the residual at that point (the measured value minus the value the line predicts).`,
    answer: { kind: 'number', value: String(r) },
    solution: [
      {
        text: 'Evaluate the fitted line at that $x$ to get the predicted value:',
        tex: `y = ${a} ${b < 0 ? '-' : '+'} ${coefPrefix(Math.abs(b))}\\cdot${paren(xi)} = ${predicted}`,
      },
      { text: 'Subtract the predicted value from the measured value:', tex: `${yi} - \\left(${predicted}\\right) = ${r}` },
    ],
    hints: HINTS_RESIDUAL,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? tier3Predict(rng) : tier3Residual(rng)
}

export const template: SkillTemplate = {
  skillId: 'least_squares',
  theory,
  expectedSeconds: { 1: 90, 2: 170, 3: 70 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
