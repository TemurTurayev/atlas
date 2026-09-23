import { addMat, matLatex, scaleMat, subMat, transpose, type Mat } from '../../math/matrix'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'A matrix is a rectangular grid of numbers. Its size is written rows × columns: $A \\in \\mathbb{R}^{2\\times3}$ has 2 rows and 3 columns.',
  'The entry $a_{ij}$ sits in row $i$, column $j$. Row index first, always.',
  'Addition and subtraction work entry by entry, and only between matrices of the same size.',
  'Scaling multiplies every entry by the same number: $(kA)_{ij}=k\\,a_{ij}$.',
  'The transpose $A^{T}$ turns rows into columns: $(A^{T})_{ij}=a_{ji}$. A $2\\times3$ matrix transposes into a $3\\times2$ one.',
  'Common mistakes: adding matrices of different sizes; transposing only the outer shape and leaving the entries where they were.',
].join('\n')

const HINTS_SUM = [
  'Work entry by entry: the top-left of the answer comes only from the two top-left entries.',
  'Scale first, then add or subtract — a scalar multiplies every entry of its matrix.',
]
const HINTS_TRANSPOSE = [
  'The transpose turns row $i$ into column $i$; the entry $a_{ij}$ moves to position $(j,i)$.',
  'Write $A^{T}$ out on its own first, then do the arithmetic.',
]
const INPUT_HINT = 'One number per entry, left to right, top to bottom'

const asGrid = (m: Mat): string[][] => m.map((row) => row.map(String))

function build(statement: string, value: Mat, solution: readonly SolutionStep[], hints: readonly string[]): Problem {
  return {
    statement,
    answer: { kind: 'matrix', rows: asGrid(value) },
    solution,
    hints,
    inputHint: INPUT_HINT,
  }
}

const randomMat = (rng: Rng, r: number, c: number, lo = -6, hi = 6): number[][] =>
  Array.from({ length: r }, () => Array.from({ length: c }, () => rng.int(lo, hi)))

/** "A + B", "2A - 3B" — the combination as it is written in the statement. */
const combo = (k: number, m: number): string => {
  const first = k === 1 ? 'A' : k === -1 ? '-A' : `${k}A`
  const second = `${m < 0 ? '-' : '+'} ${Math.abs(m) === 1 ? '' : Math.abs(m)}B`
  return `${first} ${second}`
}

/** Entry-by-entry arithmetic, written as a grid of little sums. */
const entrySteps = (a: Mat, b: Mat, k: number, m: number): string =>
  matLatex(a.map((row, i) => row.map((x, j) => `${k}\\cdot${x < 0 ? `(${x})` : x}${m < 0 ? '-' : '+'}${Math.abs(m)}\\cdot${b[i][j] < 0 ? `(${b[i][j]})` : b[i][j]}`)))

function tier1(rng: Rng): Problem {
  const a = randomMat(rng, 2, 2)
  const b = randomMat(rng, 2, 2)
  const plus = rng.chance(0.5)
  const value = plus ? addMat(a, b) : subMat(a, b)
  return build(
    `Given $A = ${matLatex(a)}$ and $B = ${matLatex(b)}$, compute $A ${plus ? '+' : '-'} B$.`,
    value,
    [
      { text: `${plus ? 'Add' : 'Subtract'} the matrices entry by entry:`, tex: entrySteps(a, b, 1, plus ? 1 : -1) },
      { text: 'That gives', tex: matLatex(asGrid(value)) },
    ],
    HINTS_SUM,
  )
}

function tier2(rng: Rng): Problem {
  const r = rng.pick([2, 3])
  const c = rng.pick([2, 3])
  const a = randomMat(rng, r, c, -5, 5)
  const b = randomMat(rng, r, c, -5, 5)
  const k = rng.intExcept(-4, 4, [0])
  const m = rng.intExcept(-4, 4, [0])
  const value = addMat(scaleMat(k, a), scaleMat(m, b))
  return build(
    `Given $A = ${matLatex(a)}$ and $B = ${matLatex(b)}$, compute $${combo(k, m)}$.`,
    value,
    [
      { text: `Scale $A$ by $${k}$:`, tex: `${k}A = ${matLatex(asGrid(scaleMat(k, a)))}` },
      { text: `Scale $B$ by $${m}$:`, tex: `${m}B = ${matLatex(asGrid(scaleMat(m, b)))}` },
      { text: 'Add the two results entry by entry:', tex: matLatex(asGrid(value)) },
    ],
    HINTS_SUM,
  )
}

function tier3(rng: Rng): Problem {
  const r = 2
  const c = 3
  const a = randomMat(rng, r, c, -5, 5)
  const b = randomMat(rng, c, r, -5, 5)
  const k = rng.intExcept(-3, 3, [0])
  const bT = transpose(b)
  const value = addMat(a, scaleMat(k, bT))
  return build(
    `Given $A = ${matLatex(a)}$ (size $2\\times3$) and $B = ${matLatex(b)}$ (size $3\\times2$), compute $A ${k < 0 ? '-' : '+'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}B^{T}$.`,
    value,
    [
      { text: 'Only matrices of the same size can be added, so transpose $B$ first — rows become columns:', tex: `B^{T} = ${matLatex(asGrid(bT))}` },
      { text: `Now both are $2\\times3$. Scale $B^{T}$ by $${k}$:`, tex: `${k}B^{T} = ${matLatex(asGrid(scaleMat(k, bT)))}` },
      { text: 'Add entry by entry:', tex: matLatex(asGrid(value)) },
    ],
    HINTS_TRANSPOSE,
  )
}

export const template: SkillTemplate = {
  skillId: 'matrix_basics',
  theory,
  expectedSeconds: { 1: 50, 2: 90, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
