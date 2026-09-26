import { coefPrefix, linear, paren } from '../../math/latex'
import { adjugate2, det2, identity, matLatex, multiply, type Mat } from '../../math/matrix'
import { add, parallel, scale, vecLatex, type Vec } from '../../math/vector'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'Diagonalizing $A$ means writing $A = PDP^{-1}$, where $D$ is diagonal with the eigenvalues of $A$ and column $i$ of $P$ is the matching eigenvector for the $i$-th diagonal entry.',
  'A $2\\times2$ matrix with two distinct eigenvalues always has two independent eigenvectors, so it is always diagonalizable this way.',
  'The payoff is computing powers: since the middle $P^{-1}P$ pairs cancel, $A^{n} = PD^{n}P^{-1}$, and $D^{n}$ is just each diagonal entry raised to the power $n$ — no repeated matrix multiplication.',
  'If a vector is already written as a combination of eigenvectors, $\\vec v = c_1\\vec v_1 + c_2\\vec v_2$, then $A^{n}\\vec v = c_1\\lambda_1^{\\,n}\\vec v_1 + c_2\\lambda_2^{\\,n}\\vec v_2$ directly — each eigen-direction is just rescaled.',
  'The order of the columns in $P$ must match the order of the eigenvalues in $D$; changing one without the other gives the wrong matrix.',
  'Common mistakes: raising $P$ (or $P^{-1}$) to the power $n$ instead of $D$; stopping at $PD^{n}$ and forgetting the final $P^{-1}$; pairing an eigenvector with the wrong eigenvalue.',
].join('\n')

const HINTS_TIER1 = [
  'Diagonalizing does not change the trace or the determinant of $A$ — use both to write the characteristic equation $\\lambda^2 - \\operatorname{tr}(A)\\lambda + \\det(A) = 0$.',
  'Factor that quadratic (or use the quadratic formula) to get the two eigenvalues, then put the smaller one in the top-left of $D$.',
]
const HINTS_TIER2 = [
  'You never need to expand $A$ itself: compute $D^{n}$ by raising each diagonal entry to the power $n$, then multiply $P$, $D^{n}$, and $P^{-1}$ in that order.',
  'Find $P^{-1}$ first (swap the diagonal of $P$, negate the off-diagonal, then divide by $\\det P$), then multiply $P \\cdot D^{n}$ before multiplying that result by $P^{-1}$.',
]
const HINTS_TIER3 = [
  'You do not need $A$ itself — each eigenvector just gets multiplied by its own eigenvalue raised to the $n$-th power.',
  'Compute $\\lambda_1^{\\,n}$ and $\\lambda_2^{\\,n}$, scale each eigenvector by its share of the combination, then add the two results component by component.',
]

const N_POOL = [2, 3] as const

/** One shear step (adds a small multiple of one row to the other); it never changes the determinant. */
function shear(rng: Rng): number[][] {
  const t = rng.pick([-1, 1])
  return rng.chance(0.5) ? [[1, t], [0, 1]] : [[1, 0], [t, 1]]
}

/** A random integer 2×2 matrix with determinant exactly 1 or −1, and small entries. */
function unimodular2x2(rng: Rng): number[][] {
  const swap = [[0, 1], [1, 0]]
  const ops: readonly number[][][] = [shear(rng), shear(rng), ...(rng.chance(0.5) ? [swap] : [])]
  return ops.reduce<number[][]>((acc, op) => multiply(op, acc), identity(2))
}

/** Same as unimodular2x2, but rejects a diagonal result (too close to a trivial example). */
function genericUnimodular(rng: Rng): Mat {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const p = unimodular2x2(rng)
    if (p[0][1] !== 0 && p[1][0] !== 0) return p
  }
  throw new Error('diagonalization: could not build a non-diagonal P')
}

/** The exact inverse of a unimodular 2×2 matrix (determinant ±1), so it stays whole numbers. */
function unimodularInverse(p: Mat): { readonly det: number; readonly inv: number[][] } {
  const det = det2(p)
  const adj = adjugate2(p)
  return { det, inv: adj.map((row) => row.map((x) => x / det)) }
}

/** Two distinct nonzero integers in [lo, hi]. */
function distinctNonzeroPair(rng: Rng, lo: number, hi: number): readonly [number, number] {
  const a = rng.intExcept(lo, hi, [0])
  const b = rng.intExcept(lo, hi, [0, a])
  return [a, b]
}

/** term for c·rest, with an explicit leading sign (" + 3x" / " - x"). */
function signedTerm(coef: number, rest: string): string {
  return `${coef < 0 ? '-' : '+'} ${coefPrefix(Math.abs(coef))}${rest}`
}

/** c1·v1 ± c2·v2, written symbolically (e.g. "2\vec v_1 - 3\vec v_2"). */
function eigenbasisCombo(c1: number, c2: number): string {
  return `${coefPrefix(c1)}\\vec v_1 ${signedTerm(c2, '\\vec v_2')}`
}

interface Diagonalizable {
  readonly a: number[][]
  readonly lo: number
  readonly hi: number
}

/** A 2×2 integer matrix built backwards from two whole, distinct eigenvalues via A = PDP⁻¹. */
function buildDiagonalizable(rng: Rng, eigenLo: number, eigenHi: number, maxAbs: number): Diagonalizable {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const [e1, e2] = distinctNonzeroPair(rng, eigenLo, eigenHi)
    const [lo, hi] = e1 < e2 ? [e1, e2] : [e2, e1]
    const p = genericUnimodular(rng)
    const d: Mat = [[lo, 0], [0, hi]]
    const { inv } = unimodularInverse(p)
    const a = multiply(multiply(p, d), inv)
    const triangular = a[0][1] === 0 || a[1][0] === 0
    const tooBig = a.some((row) => row.some((x) => Math.abs(x) > maxAbs))
    if (!triangular && !tooBig) return { a, lo, hi }
  }
  throw new Error('diagonalization: could not build a suitable matrix')
}

function tier1(rng: Rng): Problem {
  const { a, lo, hi } = buildDiagonalizable(rng, -4, 4, 50)
  const trace = a[0][0] + a[1][1]
  const detA = det2(a)
  const dLatex = matLatex([[String(lo), '0'], ['0', String(hi)]])

  return {
    statement: `The matrix $A = ${matLatex(a)}$ has two distinct whole eigenvalues. Find the diagonal matrix $D$ in $A = PDP^{-1}$, listing the smaller eigenvalue first (top-left, then the larger one bottom-right).`,
    answer: { kind: 'matrix', rows: [[String(lo), '0'], ['0', String(hi)]] },
    solution: [
      {
        text: 'Diagonalizing does not change the trace or the determinant, so the eigenvalues of $A$ are still the roots of the characteristic equation built from those two numbers:',
        tex: `\\operatorname{tr}(A) = ${trace}, \\qquad \\det(A) = ${detA}`,
      },
      {
        text: 'Substitute them into $\\lambda^{2} - \\operatorname{tr}(A)\\lambda + \\det(A) = 0$ and factor:',
        tex: `${joinCharPoly(trace, detA)} = 0 \\quad\\Longrightarrow\\quad \\left(${linear(1, -lo, '\\lambda')}\\right)\\left(${linear(1, -hi, '\\lambda')}\\right) = 0`,
      },
      { text: `So the eigenvalues are $\\lambda = ${lo}$ and $\\lambda = ${hi}$.` },
      {
        text: 'List the smaller eigenvalue first, as the problem asks:',
        tex: `D = ${dLatex}`,
      },
    ],
    hints: HINTS_TIER1,
  }
}

/** λ² − trace·λ + det, written with the correct signs and the zero term dropped. */
function joinCharPoly(trace: number, detA: number): string {
  const linearTerm = trace === 0 ? '' : ` ${trace > 0 ? '-' : '+'} ${coefPrefix(Math.abs(trace))}\\lambda`
  const constantTerm = ` ${detA >= 0 ? '+' : '-'} ${Math.abs(detA)}`
  return `\\lambda^{2}${linearTerm}${constantTerm}`
}

function tier2(rng: Rng): Problem {
  const [lambda1, lambda2] = distinctNonzeroPair(rng, -2, 2)
  const p = genericUnimodular(rng)
  const n = rng.pick(N_POOL)
  const d: Mat = [[lambda1, 0], [0, lambda2]]
  const dn: Mat = [[lambda1 ** n, 0], [0, lambda2 ** n]]
  const { det, inv } = unimodularInverse(p)
  const pdn = multiply(p, dn)
  const an = multiply(pdn, inv)
  const flipNote = det === -1 ? ', then flip every sign since you are dividing by $-1$' : ''

  return {
    statement: `Let $P = ${matLatex(p)}$ and $D = ${matLatex(d)}$, with $A = PDP^{-1}$. Compute $A^{${n}}$.`,
    answer: { kind: 'matrix', rows: an.map((row) => row.map(String)) },
    solution: [
      {
        text: 'Powers of $A$ telescope: every inner $P^{-1}P$ pair cancels, leaving',
        tex: `A^{${n}} = PD^{${n}}P^{-1}`,
      },
      {
        text: `Raising a diagonal matrix to a power just raises each diagonal entry to that power:`,
        tex: `D^{${n}} = ${matLatex(dn)}`,
      },
      {
        text: `Since $\\det P = ${det}$, the inverse of $P$ has whole-number entries: swap the diagonal entries and negate the off-diagonal ones${flipNote}:`,
        tex: `P^{-1} = ${matLatex(inv)}`,
      },
      {
        text: `Multiply $P$ by $D^{${n}}$ first:`,
        tex: `PD^{${n}} = ${matLatex(p)}${matLatex(dn)} = ${matLatex(pdn)}`,
      },
      {
        text: `Then multiply that result by $P^{-1}$ to get $A^{${n}}$:`,
        tex: `A^{${n}} = ${matLatex(pdn)}${matLatex(inv)} = ${matLatex(an)}`,
      },
    ],
    hints: HINTS_TIER2,
  }
}

/** A random nonzero integer vector with components in [-bound, bound]. */
function nonzeroVec(rng: Rng, bound: number): Vec {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const v = [rng.int(-bound, bound), rng.int(-bound, bound)]
    if (v[0] !== 0 || v[1] !== 0) return v
  }
  throw new Error('diagonalization: could not find a nonzero vector')
}

/** Two independent (non-parallel) integer eigenvectors. */
function eigenvectorPair(rng: Rng, bound: number): readonly [Vec, Vec] {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const v1 = nonzeroVec(rng, bound)
    const v2 = nonzeroVec(rng, bound)
    if (!parallel(v1, v2)) return [v1, v2]
  }
  throw new Error('diagonalization: could not find independent eigenvectors')
}

function tier3(rng: Rng): Problem {
  const [v1, v2] = eigenvectorPair(rng, 2)
  const [lambda1, lambda2] = distinctNonzeroPair(rng, -2, 2)
  const c1 = rng.intExcept(-2, 2, [0])
  const c2 = rng.intExcept(-2, 2, [0])
  const n = rng.pick(N_POOL)

  const l1n = lambda1 ** n
  const l2n = lambda2 ** n
  const term1 = scale(c1 * l1n, v1)
  const term2 = scale(c2 * l2n, v2)
  const result = add(term1, term2)
  const combo = eigenbasisCombo(c1, c2)

  const steps: SolutionStep[] = [
    {
      text: 'Each eigenvector only gets rescaled by its own eigenvalue, power after power, so applying $A$ to the combination is immediate — no matrix multiplication needed:',
      tex: `A^{${n}}\\vec v = A^{${n}}\\left(${combo}\\right) = ${coefPrefix(c1)}\\lambda_1^{${n}}\\vec v_1 ${signedTerm(c2, `\\lambda_2^{${n}}\\vec v_2`)}`,
    },
    {
      text: `Raise the two eigenvalues to the power ${n}:`,
      tex: `\\lambda_1^{${n}} = ${l1n}, \\qquad \\lambda_2^{${n}} = ${l2n}`,
    },
    {
      text: 'Scale each eigenvector by its share of the combination:',
      tex: `${paren(c1 * l1n)}${vecLatex(v1.map(String))} = ${vecLatex(term1.map(String))}, \\qquad ${paren(c2 * l2n)}${vecLatex(v2.map(String))} = ${vecLatex(term2.map(String))}`,
    },
    {
      text: 'Add the two results component by component:',
      tex: `A^{${n}}\\vec v = ${vecLatex(term1.map(String))} + ${vecLatex(term2.map(String))} = ${vecLatex(result.map(String))}`,
    },
  ]

  return {
    statement: `The matrix $A$ has eigenvector $\\vec v_1 = ${vecLatex(v1.map(String))}$ with eigenvalue $\\lambda_1 = ${lambda1}$, and eigenvector $\\vec v_2 = ${vecLatex(v2.map(String))}$ with eigenvalue $\\lambda_2 = ${lambda2}$. For $\\vec v = ${combo}$, find $A^{${n}}\\vec v$.`,
    answer: { kind: 'vector', components: result.map(String) },
    solution: steps,
    hints: HINTS_TIER3,
  }
}

export const template: SkillTemplate = {
  skillId: 'diagonalization',
  theory,
  expectedSeconds: { 1: 90, 2: 130, 3: 70 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
