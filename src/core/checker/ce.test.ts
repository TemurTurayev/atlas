import { describe, expect, it } from 'vitest'
import { evalReal, operandsOf, operatorOf, parseLatex, unknowns } from './ce'

describe('Compute Engine wrapper', () => {
  it('parses valid LaTeX and rejects invalid or empty input', () => {
    expect(parseLatex('\\frac{1}{2}')).not.toBeNull()
    expect(parseLatex('\\frac{x}{')).toBeNull()
    expect(parseLatex('   ')).toBeNull()
  })
  it('evaluates real values and returns null otherwise', () => {
    const sq = parseLatex('x^2')
    expect(sq && evalReal(sq, { x: 3 })).toBe(9)
    const bad = ['\\sqrt{-4}', '\\frac{1}{0}', '\\emptyset'].map((s) => parseLatex(s))
    bad.forEach((e) => expect(e && evalReal(e)).toBeNull())
    const ln = parseLatex('\\ln x')
    expect(ln && evalReal(ln, { x: -1 })).toBeNull()
    const pi = parseLatex('\\frac{\\pi}{3}')
    expect(pi && evalReal(pi)).toBeCloseTo(Math.PI / 3, 12)
  })
  it('exposes tree structure', () => {
    const e = parseLatex('xy+1')
    expect(e && [...unknowns(e)].sort()).toEqual(['x', 'y'])
    expect(e && operatorOf(e)).toBe('Add')
    const m = parseLatex('3x(x-2)')
    expect(m && operandsOf(m).map(operatorOf)).toEqual(['Integer', 'Symbol', 'Add'])
  })
})
