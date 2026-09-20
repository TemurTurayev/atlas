import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'
import { mathSegments } from '../testing'

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

describe('geometry', () => {
  it('tier 2: circle area/circumference matches r and pi independently', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const p = getTemplate('geometry').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const match = p.statement.en.match(/radius \$(\d+)\$ cm\. Find its (area|circumference)/)
      if (!match) throw new Error(`unexpected statement: ${p.statement.en}`)
      const r = Number(match[1])
      const expected = match[2] === 'area' ? r * r * Math.PI : 2 * r * Math.PI
      expect(constant(p.answer.value)).toBeCloseTo(expected, 6)
    }
  })
})

describe('pythagoras', () => {
  it('tier 1: hypotenuse satisfies a^2+b^2=c^2', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const p = getTemplate('pythagoras').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const match = p.statement.en.match(/legs \$(\d+)\$ and \$(\d+)\$/)
      if (!match) throw new Error(`unexpected statement: ${p.statement.en}`)
      const a = Number(match[1])
      const b = Number(match[2])
      expect(constant(p.answer.value)).toBeCloseTo(Math.sqrt(a * a + b * b), 9)
    }
  })
})

describe('lines_2d', () => {
  it('tier 1: slope matches (y2-y1)/(x2-x1) independently', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const p = getTemplate('lines_2d').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const match = p.statement.en.match(/through \$\((-?\d+), (-?\d+)\)\$ and \$\((-?\d+), (-?\d+)\)\$/)
      if (!match) throw new Error(`unexpected statement: ${p.statement.en}`)
      const [x1, y1, x2, y2] = match.slice(1).map(Number)
      expect(constant(p.answer.value)).toBeCloseTo((y2 - y1) / (x2 - x1), 9)
    }
  })
})

describe('graphs_basic', () => {
  it('tier 1: the vertex satisfies the parabola equation', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const p = getTemplate('graphs_basic').generate(createRng(seed), 1)
      if (p.answer.kind !== 'finiteSet') throw new Error('expected finiteSet')
      const [hStr, kStr] = p.answer.elements[0].replace(/[()]/g, '').split(',')
      const h = Number(hStr)
      const k = Number(kStr)
      const expr = lastMath(p.statement.en).replace('y =', '').trim()
      expect(evaluate(expr, h)).toBeCloseTo(k, 9)
    }
  })
})

describe('trig_triangle', () => {
  it('tier 1: side matches hypotenuse times sin/cos independently', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const p = getTemplate('trig_triangle').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const match = p.statement.en.match(/hypotenuse \$(\d+)\$ and an acute angle of \$(\d+)/)
      if (!match) throw new Error(`unexpected statement: ${p.statement.en}`)
      const hyp = Number(match[1])
      const angle = Number(match[2])
      const isOpposite = p.statement.en.includes('the side opposite')
      const expected = hyp * (isOpposite ? Math.sin((angle * Math.PI) / 180) : Math.cos((angle * Math.PI) / 180))
      expect(constant(p.answer.value)).toBeCloseTo(expected, 6)
    }
  })
})

describe('radians', () => {
  it('tier 1: degrees to radians matches deg*pi/180 independently', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const p = getTemplate('radians').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const match = p.statement.en.match(/Convert \$(\d+)/)
      if (!match) throw new Error(`unexpected statement: ${p.statement.en}`)
      const deg = Number(match[1])
      expect(constant(p.answer.value)).toBeCloseTo((deg * Math.PI) / 180, 9)
    }
  })
})
