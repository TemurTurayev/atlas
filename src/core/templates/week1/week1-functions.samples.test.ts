import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex, type Expr } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'
import { mathSegments } from '../testing'
import { TIERS } from '../types'

const SEEDS = 60

function evaluate(latex: string, vars: Record<string, number> = {}): number {
  const e = parseLatex(latex)
  const v = e && evalReal(e, vars)
  if (v === null || v === undefined) throw new Error(`cannot evaluate ${latex}`)
  return v
}

/** The last (or only) $…$ segment of a text. */
const lastMath = (text: string): string => {
  const segs = mathSegments(text)
  return segs[segs.length - 1]
}

function isDefinedAt(latex: string, x: number): boolean {
  const e = parseLatex(latex)
  if (!e) throw new Error(`cannot parse ${latex}`)
  return evalReal(e, { x }) !== null
}

function requireMatch(text: string, re: RegExp): RegExpMatchArray {
  const m = text.match(re)
  if (!m) throw new Error(`pattern ${re} did not match: ${text}`)
  return m
}

describe('product_powerset', () => {
  it('tier 1: |P(A)| is exactly 2^n', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('product_powerset').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const n = Number(requireMatch(mathSegments(p.statement.en)[0], /\|A\| = (\d+)/)[1])
      expect(Number(p.answer.value), `seed ${seed}`).toBe(2 ** n)
    }
  })

  it('tier 2: the option marked wrong is genuinely not a subset of A, and the others are', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('product_powerset').generate(createRng(seed), 2)
      if (p.answer.kind !== 'choice') throw new Error('expected choice')
      const answer = p.answer
      const [a, b] = requireMatch(mathSegments(p.statement.en)[0], /\\\{(\d+), (\d+)\\\}/).slice(1, 3).map(Number)
      const realPowerset = new Set([`\\emptyset`, `\\{${a}\\}`, `\\{${b}\\}`, `\\{${a}, ${b}\\}`])
      const strip = (label: string): string => label.replace(/^\$|\$$/g, '')
      const wrongOption = answer.options.find((o) => o.id === answer.correctId)
      if (!wrongOption) throw new Error('no marked option')
      expect(realPowerset.has(strip(wrongOption.label)), `seed ${seed}`).toBe(false)
      answer.options
        .filter((o) => o.id !== answer.correctId)
        .forEach((o) => expect(realPowerset.has(strip(o.label)), `seed ${seed} ${o.label}`).toBe(true))
    }
  })

  it('tier 3: |A x B| and |P(A x B)| are recomputed from the stated sets', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('product_powerset').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const segs = mathSegments(p.statement.en)
      const setA = requireMatch(segs[0], /\\\{([^}]*)\\\}/)[1].split(',').map(Number)
      const setB = requireMatch(segs[1], /\\\{([^}]*)\\\}/)[1].split(',').map(Number)
      const product = setA.length * setB.length
      const expected = segs[2].includes('P(') ? 2 ** product : product
      expect(Number(p.answer.value), `seed ${seed}`).toBe(expected)
    }
  })
})

describe('functions', () => {
  it.each([1, 2] as const)('tier %i: domain endpoints match where the formula is actually defined', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('functions').generate(createRng(seed), tier)
      if (p.answer.kind !== 'interval') throw new Error('expected interval')
      const formula = lastMath(p.statement.en).replace(/^f\(x\) = /, '')
      const first = p.answer.parts[0]
      const lo = Number(first.lo)
      expect(isDefinedAt(formula, lo + 0.5), `seed ${seed}`).toBe(true)
      expect(isDefinedAt(formula, lo - 0.5), `seed ${seed}`).toBe(false)
      if (tier === 2) {
        const excluded = Number(first.hi)
        expect(isDefinedAt(formula, excluded), `seed ${seed}`).toBe(false)
      }
    }
  })

  it('tier 3: the log-domain and quadratic-range branches are each mathematically consistent', () => {
    for (let seed = 1; seed <= 80; seed += 1) {
      const p = getTemplate('functions').generate(createRng(seed), 3)
      if (p.answer.kind !== 'interval') throw new Error('expected interval')
      const formula = lastMath(p.statement.en).replace(/^f\(x\) = /, '')
      const part = p.answer.parts[0]
      if (p.statement.en.includes('range')) {
        const e = parseLatex(formula)
        if (!e) throw new Error(`cannot parse ${formula}`)
        const values: number[] = []
        for (let i = 0; i <= 200; i += 1) {
          const v = evalReal(e, { x: -20 + i * 0.2 })
          if (v !== null) values.push(v)
        }
        const opensUp = part.hi === null
        const k = Number(opensUp ? part.lo : part.hi)
        if (opensUp) {
          expect(Math.min(...values), `seed ${seed}`).toBeCloseTo(k, 6)
          values.forEach((v) => expect(v).toBeGreaterThanOrEqual(k - 1e-6))
        } else {
          expect(Math.max(...values), `seed ${seed}`).toBeCloseTo(k, 6)
          values.forEach((v) => expect(v).toBeLessThanOrEqual(k + 1e-6))
        }
      } else {
        const lo = Number(part.lo)
        expect(isDefinedAt(formula, lo + 0.5), `seed ${seed}`).toBe(true)
        expect(isDefinedAt(formula, lo - 0.5), `seed ${seed}`).toBe(false)
      }
    }
  })
})

describe('injective', () => {
  it.each(TIERS)('tier %i: the option marked correct is genuinely injective on sampled points', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('injective').generate(createRng(seed), tier)
      if (p.answer.kind !== 'choice') throw new Error('expected choice')
      const answer = p.answer
      const correct = answer.options.find((o) => o.id === answer.correctId)
      if (!correct) throw new Error('no correct option')
      const e = parseLatex(correct.label.replace(/\$/g, ''))
      if (!e) throw new Error(`cannot parse ${correct.label}`)
      const probe = createRng(seed * 7 + 1)
      let comparisons = 0
      for (let i = 0; i < 30 && comparisons < 10; i += 1) {
        const x1 = -10 + probe.next() * 20
        const x2 = -10 + probe.next() * 20
        if (Math.abs(x1 - x2) < 0.5) continue
        const y1 = evalReal(e, { x: x1 })
        const y2 = evalReal(e, { x: x2 })
        if (y1 === null || y2 === null) continue
        expect(Math.abs(y1 - y2), `seed ${seed}: ${correct.label} at ${x1}, ${x2}`).toBeGreaterThan(1e-6)
        comparisons += 1
      }
      expect(comparisons, `seed ${seed}`).toBeGreaterThan(0)
    }
  })
})

describe('composition', () => {
  it.each(TIERS)('tier %i: the answer matches composing the named functions independently', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('composition').generate(createRng(seed), tier)
      if (p.answer.kind !== 'expression') throw new Error('expected expression')
      const segs = mathSegments(p.statement.en)
      const order = requireMatch(segs[segs.length - 1], /^\(([^)]+)\)\(x\)$/)[1].split('\\circ').map((s) => s.trim())
      const defs: Record<string, Expr> = {}
      segs.slice(0, -1).forEach((seg) => {
        const m = requireMatch(seg, /^([fgh])\(x\) = (.+)$/)
        const e = parseLatex(m[2])
        if (!e) throw new Error(`cannot parse ${m[2]}`)
        defs[m[1]] = e
      })
      const answerExpr = parseLatex(p.answer.value)
      if (!answerExpr) throw new Error(`cannot parse ${p.answer.value}`)
      let checked = 0
      ;[1.7, 2.5, 3.3].forEach((x0) => {
        let value: number | null = x0
        for (const key of [...order].reverse()) {
          if (value === null) break
          value = evalReal(defs[key], { x: value })
        }
        const actual = evalReal(answerExpr, { x: x0 })
        if (value === null || actual === null) return
        expect(actual, `seed ${seed} x=${x0}`).toBeCloseTo(value, 6)
        checked += 1
      })
      expect(checked, `seed ${seed}`).toBeGreaterThan(0)
    }
  })
})

describe('inverse_fn', () => {
  it.each(TIERS)('tier %i: f(f^-1(x)) returns x', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('inverse_fn').generate(createRng(seed), tier)
      if (p.answer.kind !== 'expression') throw new Error('expected expression')
      const fFormula = requireMatch(mathSegments(p.statement.en)[0], /^f\(x\) = (.+)$/)[1]
      const fExpr = parseLatex(fFormula)
      const inverseExpr = parseLatex(p.answer.value)
      if (!fExpr || !inverseExpr) throw new Error('cannot parse formulas')
      const [lo, hi] = p.answer.domain?.x ?? [1, 3]
      const x0 = (lo + hi) / 2
      const y0 = evalReal(inverseExpr, { x: x0 })
      if (y0 === null) throw new Error(`f^-1 not evaluable at ${x0}`)
      const back = evalReal(fExpr, { x: y0 })
      if (back === null) return
      expect(back, `seed ${seed}`).toBeCloseTo(x0, 6)
    }
  })
})

describe('transformations', () => {
  it.each([1, 2] as const)('tier %i: the formula matches substituting into the base function', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('transformations').generate(createRng(seed), tier)
      if (p.answer.kind !== 'expression') throw new Error('expected expression')
      const segs = mathSegments(p.statement.en)
      const baseExpr = parseLatex(requireMatch(segs[0], /^f\(x\) = (.+)$/)[1])
      const answerExpr = parseLatex(p.answer.value)
      if (!baseExpr || !answerExpr) throw new Error('cannot parse formulas')
      const x0 = 1.6
      if (tier === 1) {
        const m = requireMatch(segs[1], /^f\(([\s\S]*)\)([+-]\d+)?$/)
        const argExpr = parseLatex(m[1])
        if (!argExpr) throw new Error(`cannot parse ${m[1]}`)
        const k = m[2] ? Number(m[2]) : 0
        const shifted = evalReal(argExpr, { x: x0 })
        if (shifted === null) throw new Error('shift not evaluable')
        const expected = evalReal(baseExpr, { x: shifted })
        if (expected === null) throw new Error('base not evaluable')
        expect(evalReal(answerExpr, { x: x0 }), `seed ${seed}`).toBeCloseTo(expected + k, 6)
      } else {
        const s = Number(requireMatch(segs[1], /y = (-?\d+)f\(x\)/)[1])
        const baseVal = evalReal(baseExpr, { x: x0 })
        if (baseVal === null) throw new Error('base not evaluable')
        expect(evalReal(answerExpr, { x: x0 }), `seed ${seed}`).toBeCloseTo(s * baseVal, 6)
      }
    }
  })

  it('tier 3: the formula shown matches an independent reimplementation of the labelled transformation', () => {
    const testF = (t: number): number => t * t + t
    const expectedFor: Record<string, (x: number) => number> = {
      'compress-reflect': (x) => -testF(2 * x),
      'reflect-y': (x) => testF(-x),
      'reflect-x': (x) => -testF(x),
      'stretch-vert': (x) => 2 * testF(x),
      'stretch-horiz': (x) => testF(x / 2),
      'compress-horiz': (x) => testF(2 * x),
    }
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('transformations').generate(createRng(seed), 3)
      if (p.answer.kind !== 'choice') throw new Error('expected choice')
      const formulaRaw = mathSegments(p.statement.en).pop()
      if (!formulaRaw) throw new Error('no formula segment')
      const formulaClean = formulaRaw.replace(/\\left|\\right/g, '')
      const m = requireMatch(formulaClean, /^(-?\d*)f\((.*)\)$/)
      const outer = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1])
      const argExpr = parseLatex(m[2])
      if (!argExpr) throw new Error(`cannot parse ${m[2]}`)
      const x0 = 1.6
      const argVal = evalReal(argExpr, { x: x0 })
      if (argVal === null) throw new Error('arg not evaluable')
      const fromFormula = outer * testF(argVal)
      const expectedFn = expectedFor[p.answer.correctId]
      if (!expectedFn) throw new Error(`unknown id ${p.answer.correctId}`)
      expect(fromFormula, `seed ${seed}`).toBeCloseTo(expectedFn(x0), 6)
    }
  })
})

describe('polynomials', () => {
  it.each(TIERS)('tier %i: every listed value is a root of f', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('polynomials').generate(createRng(seed), tier)
      if (p.answer.kind !== 'numberSet') throw new Error('expected numberSet')
      const f = lastMath(p.statement.en).replace(/^f\(x\) = /, '')
      p.answer.values.forEach((v) => {
        expect(Math.abs(evaluate(f, { x: evaluate(v) })), `seed ${seed} root ${v}`).toBeLessThan(1e-9)
      })
    }
  })

  it('tier 3 sometimes tests multiplicity (root set includes 0) and sometimes a quartic (4 roots)', () => {
    const shapes = new Set(
      Array.from({ length: 80 }, (_, i) => {
        const p = getTemplate('polynomials').generate(createRng(i + 1), 3)
        return p.answer.kind === 'numberSet' ? p.answer.values.length : -1
      }),
    )
    expect(shapes).toEqual(new Set([2, 4]))
  })
})
