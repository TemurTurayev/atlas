import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { coefPrefix, joinTerms, linear, paren, setLatex } from './latex'
import { degree, polyAdd, polyEval, polyFromRoots, polyMul, polyScale, polyToLatex } from './poly'
import { add, div, gcd, lcm, mul, neg, rat, ratToLatex, sub, toNumber } from './rational'

describe('latex helpers', () => {
  it('coefPrefix hides ±1', () => {
    expect([coefPrefix(1), coefPrefix(-1), coefPrefix(3), coefPrefix(-4)]).toEqual(['', '-', '3', '-4'])
  })
  it('joinTerms inserts plus signs and drops zeros', () => {
    expect(joinTerms(['3x^{2}', '-5x', '6'])).toBe('3x^{2}-5x+6')
    expect(joinTerms(['', '0', '-x'])).toBe('-x')
    expect(joinTerms([])).toBe('0')
  })
  it('linear formats a·v + b', () => {
    expect(linear(3, -7)).toBe('3x-7')
    expect(linear(1, 2)).toBe('x+2')
    expect(linear(-1, 0, 't')).toBe('-t')
    expect(linear(0, 5)).toBe('5')
  })
  it('paren wraps negatives only', () => {
    expect(paren(-3)).toBe('\\left(-3\\right)')
    expect(paren(4)).toBe('4')
    expect(paren('-\\frac{1}{2}')).toBe('\\left(-\\frac{1}{2}\\right)')
  })
  it('setLatex lists elements or shows the empty set', () => {
    expect(setLatex([1, 2, 3])).toBe('\\{1, 2, 3\\}')
    expect(setLatex([])).toBe('\\emptyset')
  })
})

describe('rational', () => {
  it('normalises sign and lowest terms', () => {
    expect(rat(6, -8)).toEqual({ n: -3, d: 4 })
    expect(rat(0, -5)).toEqual({ n: 0, d: 1 })
  })
  it('does arithmetic', () => {
    expect(add(rat(1, 2), rat(1, 3))).toEqual(rat(5, 6))
    expect(sub(rat(3, 4), rat(2, 3))).toEqual(rat(1, 12))
    expect(mul(rat(2, 3), rat(9, 4))).toEqual(rat(3, 2))
    expect(div(rat(2, 3), rat(4, 9))).toEqual(rat(3, 2))
    expect(neg(rat(1, 2))).toEqual(rat(-1, 2))
    expect(toNumber(rat(3, 4))).toBe(0.75)
  })
  it('formats LaTeX', () => {
    expect(ratToLatex(rat(5))).toBe('5')
    expect(ratToLatex(rat(-3, 4))).toBe('-\\frac{3}{4}')
    expect(ratToLatex(rat(3, 4))).toBe('\\frac{3}{4}')
  })
  it('rejects bad input', () => {
    expect(() => rat(1, 0)).toThrow()
    expect(() => rat(1.5, 2)).toThrow()
    expect(() => div(rat(1), rat(0))).toThrow()
  })
  it('gcd and lcm', () => {
    expect(gcd(12, -18)).toBe(6)
    expect(lcm(4, 6)).toBe(12)
  })
})

describe('polynomials (ascending coefficients)', () => {
  it('builds from roots', () => {
    expect(polyFromRoots(1, [2, 3])).toEqual([6, -5, 1])
    expect(polyFromRoots(2, [1])).toEqual([-2, 2])
  })
  it('multiplies, adds, scales', () => {
    expect(polyMul([1, 1], [-1, 1])).toEqual([-1, 0, 1])
    expect(polyAdd([1, 2, 3], [-1, -2])).toEqual([0, 0, 3])
    expect(polyScale([1, -2], 3)).toEqual([3, -6])
    expect(degree([0, 0, 3, 0])).toBe(2)
  })
  it('formats LaTeX in descending order', () => {
    expect(polyToLatex([6, -5, 1])).toBe('x^{2}-5x+6')
    expect(polyToLatex([-4, 8, -6, 2])).toBe('2x^{3}-6x^{2}+8x-4')
    expect(polyToLatex([0, -1])).toBe('-x')
    expect(polyToLatex([0])).toBe('0')
    expect(polyToLatex([4, 0, -5, 0, 1], 't')).toBe('t^{4}-5t^{2}+4')
  })
  it('every root evaluates to zero', () => {
    fc.assert(
      fc.property(fc.integer({ min: -5, max: 5 }).filter((a) => a !== 0), fc.array(fc.integer({ min: -6, max: 6 }), { maxLength: 4 }), (a, roots) =>
        roots.every((r) => polyEval(polyFromRoots(a, roots), r) === 0),
      ),
    )
  })
})
