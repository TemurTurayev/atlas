import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'
import { mathSegments } from '../testing'

const SEEDS = 60

function evaluate(latex: string, vars: Record<string, number> = {}): number {
  const e = parseLatex(latex)
  const v = e && evalReal(e, vars)
  if (v === null || v === undefined) throw new Error(`cannot evaluate "${latex}"`)
  return v
}

/** The last (or only) $…$ segment of a text. */
const lastMath = (text: string): string => {
  const segs = mathSegments(text)
  return segs[segs.length - 1]
}

function requireMatch(text: string, re: RegExp): RegExpMatchArray {
  const m = text.match(re)
  if (!m) throw new Error(`pattern ${re} did not match: ${text}`)
  return m
}

describe('exp_fn', () => {
  it('tier 1: N(t) = A*b^(t/k) recomputed independently matches the answer', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('exp_fn').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const m = requireMatch(p.statement, /N\(t\) = (\d+)\\cdot (\d+)\^\{t\/(\d+)\}\$\. Find \$N\((\d+)\)/)
      const [A, b, k, t] = m.slice(1).map(Number)
      const expected = A * b ** (t / k)
      expect(Number(p.answer.value), `seed ${seed}`).toBeCloseTo(expected, 9)
    }
  })

  it('tier 2: half-life / doubling recomputed independently matches the answer', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('exp_fn').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const half = p.statement.match(/half-life of \$(\d+)\$ hours\. A sample starts at \$(\d+)\$ g\. Find the remaining mass after \$(\d+)\$ hours/)
      const doubling = p.statement.match(/doubles every \$(\d+)\$ hours\. It starts with \$(\d+)\$ cells\. Find the population after \$(\d+)\$ hours/)
      if (half) {
        const [h, M0, t] = half.slice(1).map(Number)
        expect(Number(p.answer.value), `seed ${seed}`).toBeCloseTo(M0 / 2 ** (t / h), 9)
      } else if (doubling) {
        const [d, P0, t] = doubling.slice(1).map(Number)
        expect(Number(p.answer.value), `seed ${seed}`).toBeCloseTo(P0 * 2 ** (t / d), 9)
      } else {
        throw new Error(`unexpected statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: drug clearance C0*e^(-kt) recomputed independently is within rounding of the exact answer', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('exp_fn').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const m = requireMatch(p.statement, /C_0=(\d+)\$ mg\/L and \$k=([\d.]+)\$ per hour\. Find \$C\((\d+)\)/)
      const C0 = Number(m[1])
      const k = Number(m[2])
      const t = Number(m[3])
      const expected = C0 * Math.exp(-k * t)
      expect(evaluate(p.answer.value), `seed ${seed}`).toBeCloseTo(expected, 6)
    }
  })
})

describe('log_laws', () => {
  it('tier 1: b^answer equals the number under the logarithm', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('log_laws').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const m = requireMatch(p.statement, /\\log(?:_\{(\d+)\})?\\left\((\d+)\\right\)/)
      const base = m[1] ? Number(m[1]) : 10
      const N = Number(m[2])
      expect(base ** Number(p.answer.value), `seed ${seed}`).toBeCloseTo(N, 6)
    }
  })

  it('tier 2: the stated log difference equals the answer at sample points', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('log_laws').generate(createRng(seed), 2)
      if (p.answer.kind !== 'expression') throw new Error('expected expression')
      const lhs = lastMath(p.statement)
      const vars = { a: 2.5, b: 3.5 }
      expect(evaluate(lhs, vars), `seed ${seed}`).toBeCloseTo(evaluate(p.answer.value, vars), 9)
    }
  })

  it('tier 3: the stated log sum equals the answer at sample points', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('log_laws').generate(createRng(seed), 3)
      if (p.answer.kind !== 'expression') throw new Error('expected expression')
      const lhs = lastMath(p.statement)
      const vars = { x: 2.5, y: 3.5 }
      expect(evaluate(lhs, vars), `seed ${seed}`).toBeCloseTo(evaluate(p.answer.value, vars), 9)
    }
  })
})

describe('exp_log_eq', () => {
  it('tier 1: b^answer equals the right-hand side', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('exp_log_eq').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const m = requireMatch(p.statement, /\$(\d+)\^\{x\} = (\d+)\$/)
      const [b, N] = m.slice(1).map(Number)
      expect(b ** Number(p.answer.value), `seed ${seed}`).toBeCloseTo(N, 6)
    }
  })

  it('tier 2: t = ln(B/A)/k recomputed independently matches the answer', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('exp_log_eq').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const m = requireMatch(p.statement, /\$(\d+)e\^\{([\d.]+)t\} = (\d+)\$/)
      const A = Number(m[1])
      const k = Number(m[2])
      const B = Number(m[3])
      const expected = Math.log(B / A) / k
      expect(evaluate(p.answer.value), `seed ${seed}`).toBeCloseTo(expected, 6)
    }
  })

  it('tier 3: x = sqrt(b^c + p^2) recomputed independently matches the answer', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('exp_log_eq').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const m = requireMatch(p.statement, /\\log_\{(\d+)\}\(x-(\d+)\) \+ \\log_\{\d+\}\(x\+\d+\) = (\d+)\$/)
      const [b, pVal, c] = m.slice(1).map(Number)
      const expected = Math.sqrt(b ** c + pVal * pVal)
      expect(Number(p.answer.value), `seed ${seed}`).toBeCloseTo(expected, 9)
    }
  })
})

describe('trig_fns', () => {
  it('tier 1: the table value matches Math.sin/cos/tan of the angle', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('trig_fns').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const m = requireMatch(p.statement, /\\(sin|cos|tan)\\left\((.+)\\right\)\$\.$/)
      const fn = m[1] as 'sin' | 'cos' | 'tan'
      const angle = evaluate(m[2])
      const expected = Math[fn](angle)
      expect(evaluate(p.answer.value), `seed ${seed}`).toBeCloseTo(expected, 9)
    }
  })

  it('tier 2: every returned solution actually satisfies the equation', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('trig_fns').generate(createRng(seed), 2)
      if (p.answer.kind !== 'numberSet') throw new Error('expected numberSet')
      const m = requireMatch(p.statement, /\\(sin|cos|tan) x = (.+)\$ for/)
      const fn = m[1] as 'sin' | 'cos' | 'tan'
      const target = evaluate(m[2])
      expect(p.answer.values.length, `seed ${seed}`).toBe(2)
      p.answer.values.forEach((v) => {
        const x = evaluate(v)
        expect(x, `seed ${seed} solution ${v} in range`).toBeGreaterThanOrEqual(0)
        expect(x, `seed ${seed} solution ${v} in range`).toBeLessThan(2 * Math.PI)
        expect(Math[fn](x), `seed ${seed} solution ${v}`).toBeCloseTo(target, 9)
      })
    }
  })

  it('tier 3: the stated identity expression equals the answer', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('trig_fns').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const lhs = lastMath(p.statement)
      expect(evaluate(lhs), `seed ${seed}`).toBeCloseTo(evaluate(p.answer.value), 9)
    }
  })
})

describe('limits', () => {
  it('tier 1: the fraction approaches the answer near x=c', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('limits').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const m = requireMatch(p.statement, /\\lim_\{x\\to (-?\d+)\}(.+)\$\.$/)
      const c = Number(m[1])
      const near = evaluate(m[2], { x: c + 1e-4 })
      expect(near, `seed ${seed}`).toBeCloseTo(Number(p.answer.value), 2)
    }
  })

  it('tier 2: the rational function approaches the answer as x grows large', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('limits').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const m = requireMatch(p.statement, /\\lim_\{x\\to\\infty\}(.+)\$\.$/)
      const near = evaluate(m[1], { x: 1e6 })
      expect(near, `seed ${seed}`).toBeCloseTo(evaluate(p.answer.value), 3)
    }
  })

  it('tier 3: the conjugate-simplified fraction approaches the answer near x=c^2', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('limits').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const m = requireMatch(p.statement, /\\lim_\{x\\to (\d+)\}(.+)\$\.$/)
      const c2 = Number(m[1])
      const near = evaluate(m[2], { x: c2 + 1e-4 })
      expect(near, `seed ${seed}`).toBeCloseTo(evaluate(p.answer.value), 2)
    }
  })
})

describe('continuity', () => {
  it('tier 1: a = (right piece at c) - c^2, recomputed independently', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('continuity').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const m = requireMatch(p.statement, /x\\le (-?\d+) \\\\ (.+), & x> -?\d+\\end\{cases\}/)
      const c = Number(m[1])
      const rightAtC = evaluate(m[2], { x: c })
      expect(Number(p.answer.value), `seed ${seed}`).toBeCloseTo(rightAtC - c * c, 9)
    }
  })

  it('tier 2: the numerator is nonzero at the stated discontinuity, and it is the denominator root', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('continuity').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const m = requireMatch(p.statement, /f\(x\)=\\dfrac\{(.+)\}\{(.+)\}\$ discontinuous/)
      const c = Number(p.answer.value)
      expect(evaluate(m[2], { x: c }), `seed ${seed} denominator root`).toBeCloseTo(0, 9)
      expect(Math.abs(evaluate(m[1], { x: c })), `seed ${seed} numerator nonzero`).toBeGreaterThan(0.5)
    }
  })

  it('tier 3: removable-hole answers equal the simplified fraction\'s limit at the hole', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('continuity').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const hole = p.statement.match(/f\(x\)=\\dfrac\{(.+)\}\{(.+)\}\$ is undefined at \$x=(-?\d+)\$/)
      if (!hole) continue // the "two conditions" sub-type is covered by the harness's generic checker test
      const [numLatex, denLatex, pStr] = [hole[1], hole[2], hole[3]]
      const p0 = Number(pStr)
      expect(evaluate(denLatex, { x: p0 }), `seed ${seed} denominator zero at hole`).toBeCloseTo(0, 9)
      const near = evaluate(numLatex, { x: p0 + 1e-4 }) / evaluate(denLatex, { x: p0 + 1e-4 })
      expect(near, `seed ${seed}`).toBeCloseTo(Number(p.answer.value), 2)
    }
  })
})
