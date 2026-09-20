import { describe, expect, it } from 'vitest'
import { normalizeLatex } from './normalize'
import { expandPlusMinus, isEmptySetLatex, splitAnswerList, splitTopLevel, stripAssignment, stripSetBraces } from './split'

describe('normalizeLatex', () => {
  it('removes \\left/\\right but keeps arrows', () => {
    expect(normalizeLatex('\\left(x+1\\right)^2')).toBe('(x+1)^2')
    expect(normalizeLatex('a\\leftarrow b\\rightarrow c')).toBe('a\\leftarrow b\\rightarrow c')
  })
  it('maps brace/bracket commands and strips spacing', () => {
    expect(normalizeLatex('\\left\\lbrace 1,2\\right\\rbrace')).toBe('\\{ 1,2\\}')
    expect(normalizeLatex('\\lbrack 1, 2\\rbrack')).toBe('[ 1, 2]')
    expect(normalizeLatex('x\\,+\\;1\\!')).toBe('x + 1')
    expect(normalizeLatex('  2 \\placeholder{} ')).toBe('2')
  })
})

describe('list splitting', () => {
  it('splits at top-level commas and semicolons only', () => {
    expect(splitTopLevel('2, 3')).toEqual(['2', '3'])
    expect(splitTopLevel('(1,2),(3,4)')).toEqual(['(1,2)', '(3,4)'])
    expect(splitTopLevel('\\frac{1}{2}; -1')).toEqual(['\\frac{1}{2}', '-1'])
    expect(splitTopLevel('x_{1}=2', ['='])).toEqual(['x_{1}', '2'])
  })
  it('strips outer set braces only when they wrap everything', () => {
    expect(stripSetBraces('\\{1, 2\\}')).toBe('1, 2')
    expect(stripSetBraces('{1, 2}')).toBe('1, 2')
    expect(stripSetBraces('\\{1\\},\\{2\\}')).toBe('\\{1\\},\\{2\\}')
    expect(stripSetBraces('1, 2')).toBe('1, 2')
  })
  it('recognises the empty set', () => {
    ;['\\emptyset', '\\varnothing', '\\{\\}', 'none', '\\text{none}', ' \\emptyset ', '∅'].forEach((s) => expect(isEmptySetLatex(s)).toBe(true))
    ;['0', '\\{0\\}', 'x'].forEach((s) => expect(isEmptySetLatex(s)).toBe(false))
  })
  it('drops assignments', () => {
    expect(stripAssignment('x=2')).toBe('2')
    expect(stripAssignment('x_{1}=-3')).toBe('-3')
    expect(stripAssignment('2')).toBe('2')
  })
  it('expands ± and ∓', () => {
    expect(expandPlusMinus('1\\pm\\sqrt{2}')).toEqual(['1+\\sqrt{2}', '1-\\sqrt{2}'])
    expect(expandPlusMinus('\\mp 2')).toEqual(['- 2', '+ 2'])
    expect(expandPlusMinus('\\pm1\\pm2')).toHaveLength(4)
    expect(expandPlusMinus('5')).toEqual(['5'])
  })
  it('runs the whole pipeline', () => {
    expect(splitAnswerList('x=1\\pm\\sqrt{2}, x=0')).toEqual(['1+\\sqrt{2}', '1-\\sqrt{2}', '0'])
    expect(splitAnswerList('\\left\\{2,3\\right\\}')).toEqual(['2', '3'])
  })
})
