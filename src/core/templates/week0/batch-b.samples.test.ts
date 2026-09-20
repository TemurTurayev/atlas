import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex, type Expr } from '../../checker/ce'
import { splitTopLevel } from '../../checker/split'
import { evaluateItem } from '../../checker/values'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'
import { mathSegments } from '../testing'
import { TIERS } from '../types'

const evalAt = (latex: string, vars: Readonly<Record<string, number>>): number => {
  const e = parseLatex(latex)
  const v = e && evalReal(e, vars)
  if (v === null || v === undefined) throw new Error(`cannot evaluate ${latex} at ${JSON.stringify(vars)}`)
  return v
}

const firstMath = (text: string): string => mathSegments(text)[0]

/** "(\frac{7}{2},3)" -> [3.5, 3]. */
const parsePair = (element: string): [number, number] => {
  const inner = element.trim().slice(1, -1)
  const [x, y] = splitTopLevel(inner)
  const xv = evaluateItem(x)
  const yv = evaluateItem(y)
  if (xv === null || yv === null) throw new Error(`cannot parse pair ${element}`)
  return [xv, yv]
}

describe('algebra_expr', () => {
  it('tier 1: collecting like terms preserves the value at sample points', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const p = getTemplate('algebra_expr').generate(createRng(seed), 1)
      if (p.answer.kind !== 'expression') throw new Error('expected expression')
      const original = firstMath(p.statement.en)
      const answerValue = p.answer.value
      const points = [
        { x: 2, y: 3 },
        { x: -1, y: 4 },
      ]
      points.forEach((point) => {
        expect(evalAt(original, point), `seed ${seed}`).toBeCloseTo(evalAt(answerValue, point), 9)
      })
    }
  })
})

describe('expand', () => {
  it('tier 1: expanding a(x+b) preserves the value at sample points', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const p = getTemplate('expand').generate(createRng(seed), 1)
      if (p.answer.kind !== 'expression') throw new Error('expected expression')
      const original = firstMath(p.statement.en)
      const answerValue = p.answer.value
      ;[2, -3, 5].forEach((x) => {
        expect(evalAt(original, { x }), `seed ${seed}`).toBeCloseTo(evalAt(answerValue, { x }), 9)
      })
    }
  })
})

describe('alg_fractions', () => {
  it('tier 2: simplifying (x^2-b^2)/(x^2+bx) preserves the value away from singularities', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const p = getTemplate('alg_fractions').generate(createRng(seed), 2)
      if (p.answer.kind !== 'expression') throw new Error('expected expression')
      const original = firstMath(p.statement.en)
      // x = 50 is far from x = 0 and any b in [-8, 8], so both original and simplified form are defined.
      expect(evalAt(original, { x: 50 }), `seed ${seed}`).toBeCloseTo(evalAt(p.answer.value, { x: 50 }), 6)
    }
  })
})

describe('rearrange', () => {
  it('tier 1: the isolated variable reproduces the original relationship lhs = num/den', () => {
    const samples = [2, 3, 5, 7, 11]
    for (let seed = 1; seed <= 30; seed += 1) {
      const p = getTemplate('rearrange').generate(createRng(seed), 1)
      if (p.answer.kind !== 'expression') throw new Error('expected expression')
      const [num, lhs] = p.answer.variables
      const denExpr = parseLatex(p.answer.value) as Expr
      samples.forEach((lhsVal) => {
        const numVal = lhsVal * 4 + 1
        const denVal = evalReal(denExpr, { [num]: numVal, [lhs]: lhsVal })
        if (denVal === null) throw new Error(`seed ${seed}: undefined at lhs=${lhsVal}`)
        expect(lhsVal * denVal, `seed ${seed}`).toBeCloseTo(numVal, 6)
      })
    }
  })
})

describe('sim_eq_2x2', () => {
  it.each(TIERS)('tier %i: the pair satisfies both equations', (tier) => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const p = getTemplate('sim_eq_2x2').generate(createRng(seed), tier)
      if (p.answer.kind !== 'finiteSet') throw new Error('expected finiteSet')
      expect(p.answer.elements.length).toBe(1)
      const [x, y] = parsePair(p.answer.elements[0])
      const [eq1, eq2] = mathSegments(p.statement.en)
      ;[eq1, eq2].forEach((eq) => {
        const [lhs, rhs] = eq.split('=')
        expect(evalAt(lhs, { x, y }), `seed ${seed} tier ${tier}: ${eq}`).toBeCloseTo(Number(rhs), 6)
      })
    }
  })
})

describe('inequalities', () => {
  const compare: Readonly<Record<string, (l: number, r: number) => boolean>> = {
    '<': (l, r) => l < r,
    '>': (l, r) => l > r,
    '\\le': (l, r) => l <= r,
    '\\ge': (l, r) => l >= r,
  }

  it('tier 1: a point inside the interval satisfies the inequality, a point outside does not', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const p = getTemplate('inequalities').generate(createRng(seed), 1)
      if (p.answer.kind !== 'interval') throw new Error('expected interval')
      const [lhsLatex, dir, rhsLatex] = firstMath(p.statement.en).split(' ')
      const rhsVal = Number(rhsLatex)
      const part = p.answer.parts[0]
      const [insideX, outsideX] = part.hi !== null ? [Number(part.hi) - 1, Number(part.hi) + 1] : [Number(part.lo) + 1, Number(part.lo) - 1]
      const cmp = compare[dir]
      expect(cmp(evalAt(lhsLatex, { x: insideX }), rhsVal), `seed ${seed}: inside point ${insideX}`).toBe(true)
      expect(cmp(evalAt(lhsLatex, { x: outsideX }), rhsVal), `seed ${seed}: outside point ${outsideX}`).toBe(false)
    }
  })
})

describe('sigma_notation', () => {
  it.each(TIERS)('tier %i: the sum matches an independently recomputed closed-form value', (tier) => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const p = getTemplate('sigma_notation').generate(createRng(seed), tier)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const seg = firstMath(p.statement.en)
      let expected: number
      if (tier === 1) {
        const m = seg.match(/\\sum_\{i=1\}\^\{(\d+)\}\s*i\^\{2\}/)
        if (!m) throw new Error(`unexpected statement: ${seg}`)
        const n = Number(m[1])
        expected = (n * (n + 1) * (2 * n + 1)) / 6
      } else if (tier === 2) {
        const m = seg.match(/\\sum_\{k=0\}\^\{(\d+)\}\s*\(2k\+1\)/)
        if (!m) throw new Error(`unexpected statement: ${seg}`)
        const n = Number(m[1])
        expected = (n + 1) ** 2
      } else {
        const m = seg.match(/\\sum_\{i=(\d+)\}\^\{(\d+)\}\s*i/)
        if (!m) throw new Error(`unexpected statement: ${seg}`)
        const lo = Number(m[1])
        const hi = Number(m[2])
        expected = ((lo + hi) * (hi - lo + 1)) / 2
      }
      expect(Number(p.answer.value), `seed ${seed}`).toBe(expected)
    }
  })
})
