import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'
import { TIERS } from '../types'

const SEEDS = 30

function evaluate(latex: string): number {
  const e = parseLatex(latex)
  const v = e && evalReal(e)
  if (v === null || v === undefined) throw new Error(`cannot evaluate "${latex}"`)
  return v
}

/** Every `\begin{pmatrix}...\end{pmatrix}` block in a statement, parsed into a grid of numbers, in order of appearance. */
function extractAllPmatrices(text: string): number[][][] {
  const blocks = [...text.matchAll(/\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g)].map((m) => m[1])
  return blocks.map((inner) =>
    inner
      .split('\\\\')
      .map((row) => row.trim())
      .filter((row) => row.length > 0)
      .map((row) => row.split('&').map((cell) => Number(cell.trim()))),
  )
}

function extractOnePmatrix(text: string): number[][] {
  const found = extractAllPmatrices(text)
  if (found.length === 0) throw new Error(`no matrix found in: ${text}`)
  return found[0]
}

/** Sarrus' rule for a 3×3 determinant — a different computation path than the cofactor expansion the templates use. */
function det3Sarrus(m: readonly (readonly number[])[]): number {
  const [[a, b, c], [d, e, f], [g, h, i]] = m
  return a * e * i + b * f * g + c * d * h - c * e * g - b * d * i - a * f * h
}

const multiplyManual = (a: readonly (readonly number[])[], b: readonly (readonly number[])[]): number[][] =>
  a.map((row) => b[0].map((_, j) => row.reduce((sum, v, k) => sum + v * b[k][j], 0)))

describe('det_3x3', () => {
  it.each(TIERS)('tier %i: the stated determinant is mathematically correct', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('det_3x3').generate(createRng(seed), tier)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const claimed = Number(p.answer.value)

      const matrix = extractOnePmatrix(p.statement)
      expect(matrix.length, `seed ${seed}: 3 rows`).toBe(3)
      matrix.forEach((row) => expect(row.length, `seed ${seed}: 3 columns`).toBe(3))
      const detA = det3Sarrus(matrix)

      const swapMatch = p.statement.match(/swapping rows \$(\d+)\$ and \$(\d+)\$ of \$A\$/)
      if (swapMatch) {
        const detMatch = p.statement.match(/\\det A = (-?\d+)/)
        if (!detMatch) throw new Error(`no stated det A in: ${p.statement}`)
        const statedDetA = Number(detMatch[1])
        expect(detA, `seed ${seed}: stated det A matches the matrix`).toBe(statedDetA)
        expect(claimed, `seed ${seed}: det B is -det A`).toBe(-statedDetA)
      } else {
        expect(claimed, `seed ${seed}`).toBe(detA)
      }
    }
  })

  it('tier 3 produces all three property flavours across seeds', () => {
    const seen = new Set<string>()
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('det_3x3').generate(createRng(seed), 3)
      const text = [p.statement, ...p.solution.map((s) => s.text)].join(' ')
      if (p.statement.includes('swapping rows')) seen.add('swap')
      else if (text.includes('triangular')) seen.add('triangular')
      else if (text.includes('proportional')) seen.add('repeated')
    }
    expect(seen).toEqual(new Set(['swap', 'triangular', 'repeated']))
  })
})

describe('inverse_2x2', () => {
  it.each([1, 2] as const)('tier %i: A times the stated inverse gives the identity', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('inverse_2x2').generate(createRng(seed), tier)
      if (p.answer.kind !== 'matrix') throw new Error('expected matrix')

      const a = extractOnePmatrix(p.statement)
      expect(a.length, `seed ${seed}`).toBe(2)
      expect(a[0].length, `seed ${seed}`).toBe(2)

      const detA = a[0][0] * a[1][1] - a[0][1] * a[1][0]
      expect(detA, `seed ${seed}: A really is invertible`).not.toBe(0)
      if (tier === 1) expect(Math.abs(detA), `seed ${seed}: tier 1 has det +-1`).toBe(1)
      else expect(Math.abs(detA), `seed ${seed}: tier 2 has a genuine fraction`).not.toBe(1)

      const inv = p.answer.rows.map((row) => row.map((cell) => evaluate(cell)))
      const product = multiplyManual(a, inv)
      product.forEach((row, i) =>
        row.forEach((v, j) => expect(v, `seed ${seed}: (AA^-1)[${i}][${j}]`).toBeCloseTo(i === j ? 1 : 0, 9)),
      )
    }
  })

  it('tier 3: A times the stated x equals the stated b exactly', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('inverse_2x2').generate(createRng(seed), 3)
      if (p.answer.kind !== 'vector') throw new Error('expected vector')

      const mats = extractAllPmatrices(p.statement)
      expect(mats.length, `seed ${seed}: A and b`).toBe(2)
      const [a, bMat] = mats
      expect(a.length, `seed ${seed}`).toBe(2)
      const b = bMat.map((row) => row[0])
      expect(b.length, `seed ${seed}`).toBe(2)

      const detA = a[0][0] * a[1][1] - a[0][1] * a[1][0]
      expect(detA, `seed ${seed}: A really is invertible`).not.toBe(0)

      const x = p.answer.components.map(Number)
      const ax = a.map((row) => row.reduce((sum, v, j) => sum + v * x[j], 0))
      ax.forEach((v, i) => expect(v, `seed ${seed}: component ${i}`).toBe(b[i]))
    }
  })
})
