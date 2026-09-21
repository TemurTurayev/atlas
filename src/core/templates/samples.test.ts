import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../checker/ce'
import { checkAnswer } from '../checker/check'
import { createRng } from '../random/rng'
import { getTemplate } from './registry'
import { mathSegments } from './testing'
import { TIERS } from './types'

const evaluate = (latex: string, x: number): number => {
  const e = parseLatex(latex)
  const v = e && evalReal(e, { x })
  if (v === null || v === undefined) throw new Error(`cannot evaluate ${latex} at ${x}`)
  return v
}

const constant = (latex: string): number => {
  const e = parseLatex(latex)
  const v = e && evalReal(e)
  if (v === null || v === undefined) throw new Error(`cannot evaluate ${latex}`)
  return v
}

const lastMath = (text: string): string => {
  const segs = mathSegments(text)
  return segs[segs.length - 1]
}

describe('linear_eq', () => {
  it.each(TIERS)('tier %i: the answer satisfies the equation', (tier) => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const p = getTemplate('linear_eq').generate(createRng(seed), tier)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const x = Number(p.answer.value)
      expect(Number.isInteger(x)).toBe(true)
      const [lhs, rhs] = lastMath(p.statement).split('=')
      expect(evaluate(lhs, x)).toBeCloseTo(evaluate(rhs, x), 9)
    }
  })
})

describe('quadratic_eq', () => {
  it.each(TIERS)('tier %i: every listed value is a zero of f', (tier) => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const p = getTemplate('quadratic_eq').generate(createRng(seed), tier)
      if (p.answer.kind !== 'numberSet') throw new Error('expected numberSet')
      const f = lastMath(p.statement).replace('f(x) =', '').trim()
      p.answer.values.forEach((v) => {
        expect(Math.abs(evaluate(f, constant(v))), `seed ${seed} root ${v}`).toBeLessThan(1e-9)
      })
    }
  })

  it('tier 2 sometimes has no real roots and sometimes a double root', () => {
    const sizes = new Set(
      Array.from({ length: 80 }, (_, seed) => {
        const p = getTemplate('quadratic_eq').generate(createRng(seed + 1), 2)
        return p.answer.kind === 'numberSet' ? p.answer.values.length : -1
      }),
    )
    expect(sizes).toEqual(new Set([0, 1, 2]))
  })
})

describe('factor', () => {
  it.each(TIERS)('tier %i: the expanded statement itself is not accepted', (tier) => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const p = getTemplate('factor').generate(createRng(seed), tier)
      const expanded = lastMath(p.statement)
      expect(checkAnswer(p.answer, { kind: 'latex', latex: expanded }).status, `seed ${seed}`).toBe('malformed')
    }
  })
})

describe('set_ops', () => {
  it('tier 3 asks for a Cartesian product of pairs', () => {
    const p = getTemplate('set_ops').generate(createRng(3), 3)
    expect(p.answer.kind).toBe('finiteSet')
    if (p.answer.kind === 'finiteSet') expect(p.answer.elements.every((e) => /^\(\d+,\d+\)$/.test(e))).toBe(true)
  })
})
