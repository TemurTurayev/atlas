import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'

const SEEDS = 30

function evaluate(latex: string): number {
  const e = parseLatex(latex)
  const v = e && evalReal(e)
  if (v === null || v === undefined) throw new Error(`cannot evaluate "${latex}"`)
  return v
}

function requireMatch(text: string, re: RegExp): RegExpMatchArray {
  const m = text.match(re)
  if (!m) throw new Error(`pattern ${re} did not match: ${text}`)
  return m
}

const dot3 = (a: readonly number[], b: readonly number[]): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross3 = (a: readonly number[], b: readonly number[]): [number, number, number] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
const norm3 = (a: readonly number[]): number => Math.sqrt(a[0] ** 2 + a[1] ** 2 + a[2] ** 2)

/** Component-wise closeness that treats -0 and 0 as equal (unlike toEqual). */
function expectVecCloseTo(actual: readonly number[], expected: readonly number[], seed: number): void {
  expect(actual.length, `seed ${seed}`).toBe(expected.length)
  actual.forEach((v, i) => expect(v, `seed ${seed}, component ${i}`).toBeCloseTo(expected[i], 9))
}

describe('vec_angle', () => {
  it('tier 1: cos(theta) between two 2D vectors matches a·b/(|a||b|)', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('vec_angle').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const m = requireMatch(p.statement, /\\vec a=\\left\((-?\d+), (-?\d+)\\right\)\$ and \$\\vec b=\\left\((-?\d+), (-?\d+)\\right\)/)
      const [ax, ay, bx, by] = m.slice(1).map(Number)
      const expectedCos = (ax * bx + ay * by) / (Math.sqrt(ax * ax + ay * ay) * Math.sqrt(bx * bx + by * by))
      expect(evaluate(p.answer.value), `seed ${seed}`).toBeCloseTo(expectedCos, 9)
      expect(Math.abs(expectedCos), `seed ${seed} is not degenerate`).toBeLessThan(1 - 1e-9)
    }
  })

  it('tier 2: angle in degrees matches the difference of the vectors\u2019 standard-position angles', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('vec_angle').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const m = requireMatch(p.statement, /\\vec a=\\left\(([^,]+), ([^)]+)\\right\)\$ and \$\\vec b=\\left\(([^,]+), ([^)]+)\\right\)/)
      const [axL, ayL, bxL, byL] = m.slice(1)
      const ax = evaluate(axL)
      const ay = evaluate(ayL)
      const bx = evaluate(bxL)
      const by = evaluate(byL)
      expect(ay, `seed ${seed}: a in upper half-plane`).toBeGreaterThanOrEqual(-1e-9)
      expect(by, `seed ${seed}: b in upper half-plane`).toBeGreaterThanOrEqual(-1e-9)
      const angleA = (Math.atan2(ay, ax) * 180) / Math.PI
      const angleB = (Math.atan2(by, bx) * 180) / Math.PI
      const expectedAngle = Math.abs(angleB - angleA)
      expect(Number(p.answer.value), `seed ${seed}`).toBeCloseTo(expectedAngle, 6)
    }
  })

  it('tier 3: 3D cosine or orthogonality-solved t are both mathematically correct', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('vec_angle').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      if (p.statement.includes('perpendicular')) {
        const m = requireMatch(
          p.statement,
          /\\vec a=\\left\((-?\d+), (-?\d+), (-?\d+)\\right\)\$ and \$\\vec b=\\left\(([^,]+), ([^,]+), ([^)]+)\\right\)/,
        )
        const [ax, ay, az] = m.slice(1, 4).map(Number)
        const bParts = m.slice(4, 7)
        const pIdx = bParts.findIndex((s) => s === 't')
        if (pIdx < 0) throw new Error(`no "t" found in b: ${bParts.join(',')}`)
        const a = [ax, ay, az]
        const t = evaluate(p.answer.value)
        const b = bParts.map((s, i) => (i === pIdx ? t : Number(s)))
        expect(dot3(a, b), `seed ${seed}: a.b should be 0`).toBeCloseTo(0, 9)
        expect(b.some((v) => v !== 0), `seed ${seed}: b should not be the zero vector`).toBe(true)
      } else {
        const m = requireMatch(
          p.statement,
          /\\vec a=\\left\((-?\d+), (-?\d+), (-?\d+)\\right\)\$ and \$\\vec b=\\left\((-?\d+), (-?\d+), (-?\d+)\\right\)/,
        )
        const [ax, ay, az, bx, by, bz] = m.slice(1).map(Number)
        const a = [ax, ay, az]
        const b = [bx, by, bz]
        const expectedCos = dot3(a, b) / (norm3(a) * norm3(b))
        expect(evaluate(p.answer.value), `seed ${seed}`).toBeCloseTo(expectedCos, 9)
        expect(Math.abs(expectedCos), `seed ${seed} is not degenerate`).toBeLessThan(1 - 1e-9)
      }
    }
  })
})

describe('cross_product', () => {
  it('tier 1: a x b is orthogonal to both inputs and has the right magnitude and sign', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('cross_product').generate(createRng(seed), 1)
      if (p.answer.kind !== 'vector') throw new Error('expected vector')
      const m = requireMatch(p.statement, /\\vec a=\\left\((-?\d+), (-?\d+), (-?\d+)\\right\)\$ and \$\\vec b=\\left\((-?\d+), (-?\d+), (-?\d+)\\right\)/)
      const [ax, ay, az, bx, by, bz] = m.slice(1).map(Number)
      const a = [ax, ay, az]
      const b = [bx, by, bz]
      const expected = cross3(a, b)
      const answer = p.answer.components.map((c) => evaluate(c))
      expectVecCloseTo(answer, expected, seed)
      expect(dot3(answer, a), `seed ${seed}: orthogonal to a`).toBeCloseTo(0, 9)
      expect(dot3(answer, b), `seed ${seed}: orthogonal to b`).toBeCloseTo(0, 9)
      expect(norm3(answer), `seed ${seed}: nonzero`).toBeGreaterThan(0)
    }
  })

  it('tier 2: normal vector u x v is orthogonal to both edges of the triangle ABC', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('cross_product').generate(createRng(seed), 2)
      if (p.answer.kind !== 'vector') throw new Error('expected vector')
      const m = requireMatch(
        p.statement,
        /Points \$A\\left\((-?\d+), (-?\d+), (-?\d+)\\right\)\$, \$B\\left\((-?\d+), (-?\d+), (-?\d+)\\right\)\$, \$C\\left\((-?\d+), (-?\d+), (-?\d+)\\right\)\$/,
      )
      const [ax, ay, az, bx, by, bz, cx, cy, cz] = m.slice(1).map(Number)
      const A = [ax, ay, az]
      const B = [bx, by, bz]
      const C = [cx, cy, cz]
      const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]]
      const v = [C[0] - A[0], C[1] - A[1], C[2] - A[2]]
      const expected = cross3(u, v)
      const answer = p.answer.components.map((c) => evaluate(c))
      expectVecCloseTo(answer, expected, seed)
      expect(dot3(answer, u), `seed ${seed}: orthogonal to AB`).toBeCloseTo(0, 9)
      expect(dot3(answer, v), `seed ${seed}: orthogonal to AC`).toBeCloseTo(0, 9)
      expect(norm3(answer), `seed ${seed}: nonzero (A,B,C not collinear)`).toBeGreaterThan(0)
    }
  })

  it('tier 3: triangle/parallelogram area matches |a x b| (halved for a triangle)', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('cross_product').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const m = requireMatch(
        p.statement,
        /\\vec a=\\left\((-?\d+), (-?\d+), (-?\d+)\\right\)\$ and \$\\vec b=\\left\((-?\d+), (-?\d+), (-?\d+)\\right\)\$ are two sides of a (triangle|parallelogram)/,
      )
      const [ax, ay, az, bx, by, bz] = m.slice(1, 7).map(Number)
      const shape = m[7]
      const a = [ax, ay, az]
      const b = [bx, by, bz]
      const magnitude = norm3(cross3(a, b))
      const expectedArea = shape === 'triangle' ? magnitude / 2 : magnitude
      expect(evaluate(p.answer.value), `seed ${seed}`).toBeCloseTo(expectedArea, 9)
      expect(magnitude, `seed ${seed}: nonzero area`).toBeGreaterThan(0)
    }
  })
})
