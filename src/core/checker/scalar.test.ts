import { describe, expect, it } from 'vitest'
import { parseLatex } from './ce'
import { checkExpression } from './expression'
import { factorCount, isExpanded, isFactored } from './forms'
import { checkNumber } from './number'
import type { ExpressionSpec } from '../templates/types'

const num = (value: string, answer: string) => checkNumber(value, answer)
const expr = (value: string, answer: string, extra: Partial<ExpressionSpec> = {}) =>
  checkExpression({ kind: 'expression', value, variables: ['x'], ...extra }, answer)
const tree = (latex: string) => {
  const e = parseLatex(latex)
  if (!e) throw new Error(`bad test latex ${latex}`)
  return e
}

describe('checkNumber', () => {
  it.each([
    ['4', '4'], ['4', '2+2'], ['4', '4.0'], ['-\\frac{3}{4}', '-0.75'], ['-\\frac{3}{4}', '\\frac{-3}{4}'],
    ['5\\ln 4', '6.93'], ['2\\sqrt{10}', '\\sqrt{40}'], ['\\frac{3\\pi}{4}', '\\frac{3}{4}\\pi'], ['9', '27^{\\frac{2}{3}}'],
    ['5', 'x=5'], ['\\frac{1}{3}', '0.333'], ['0', '0'], ['\\frac{1}{2}', '\\left(\\frac{1}{2}\\right)'],
  ])('accepts %s ← %s', (value, answer) => expect(num(value, answer).status).toBe('correct'))

  it.each([['5\\ln 4', '6.9'], ['\\frac{1}{3}', '0.33'], ['7', '8']])('rejects %s ← %s', (value, answer) =>
    expect(num(value, answer).status).toBe('incorrect'),
  )

  it('diagnoses sign and reciprocal slips', () => {
    expect(num('-\\frac{3}{4}', '\\frac{3}{4}')).toEqual({ status: 'incorrect', diagnosis: 'Looks like a sign slipped' })
    expect(num('\\frac{2}{3}', '\\frac{3}{2}')).toEqual({ status: 'incorrect', diagnosis: 'Looks like the fraction is upside down' })
  })

  it('flags malformed input without counting it as wrong', () => {
    expect(num('10', '').status).toBe('malformed')
    expect(num('10', 'x+1').status).toBe('malformed')
    expect(num('2.5', '2,5').status).toBe('malformed')
    expect(num('1', '\\frac{1}{').status).toBe('malformed')
  })

  it('notes approximate answers', () => {
    expect(num('\\sqrt{2}', '1.414')).toEqual({ status: 'correct', note: 'Correct (approximately)' })
  })
})

describe('checkExpression', () => {
  it.each([
    ['x^2-x', 'x(x-1)'], ['\\frac{3x+1}{x-2}', '\\frac{1+3x}{x-2}'], ['e^{-3x}(2x-3x^2)', '(2x-3x^2)e^{-3x}'],
    ['\\frac{3x+1}{x-2}', 'f^{-1}(x)=\\frac{3x+1}{x-2}'], ['2x+6', '2(x+3)'],
  ])('accepts %s ← %s', (value, answer) => expect(expr(value, answer).status).toBe('correct'))

  it('respects a sampling domain', () => {
    expect(expr('\\ln x', '\\ln(x)', { domain: { x: [0.5, 4] } }).status).toBe('correct')
    expect(expr('\\ln x', '\\ln(2x)', { domain: { x: [0.5, 4] } }).status).toBe('incorrect')
  })

  it('rejects wrong expressions and diagnoses sign', () => {
    expect(expr('\\frac{3x+1}{x-2}', '\\frac{3x-1}{x-2}').status).toBe('incorrect')
    expect(expr('x^2-x', '-x^2+x')).toEqual({ status: 'incorrect', diagnosis: 'Looks like a sign slipped' })
  })

  it('refuses foreign variables', () => {
    expect(expr('x^2', 't^2')).toEqual({ status: 'malformed', message: 'Use only these variables: x' })
  })

  it('enforces factored form', () => {
    const spec = { form: 'factored' as const }
    expect(expr('(x-2)(x-3)', '(x-3)(x-2)', spec).status).toBe('correct')
    expect(expr('(x-2)(x-3)', 'x^2-5x+6', spec).status).toBe('malformed')
    expect(expr('3x(x-2)', '3(x^2-2x)', spec)).toEqual({ status: 'malformed', message: 'Right value, but it can be factored further' })
    expect(expr('3x(x-2)', 'x(3x-6)', spec).status).toBe('correct')
  })

  it('enforces expanded form', () => {
    const spec = { form: 'expanded' as const }
    expect(expr('4x^2-12x+9', '9-12x+4x^2', spec).status).toBe('correct')
    expect(expr('4x^2-12x+9', '(2x-3)^2', spec).status).toBe('malformed')
  })
})

describe('form predicates', () => {
  it('isFactored', () => {
    expect(isFactored(tree('(x-2)(x+3)'))).toBe(true)
    expect(isFactored(tree('-(x-2)(x+3)'))).toBe(true)
    expect(isFactored(tree('(x-1)^2'))).toBe(true)
    expect(isFactored(tree('x^2-1'))).toBe(false)
  })
  it('isExpanded', () => {
    expect(isExpanded(tree('4x^2-12x+9'))).toBe(true)
    expect(isExpanded(tree('2(x+1)'))).toBe(false)
    expect(isExpanded(tree('(x+1)^2'))).toBe(false)
  })
  it('factorCount counts non-constant factors with multiplicity', () => {
    expect(factorCount(tree('3x(x-2)'))).toBe(2)
    expect(factorCount(tree('(x-1)^2(x+2)'))).toBe(3)
    expect(factorCount(tree('3(x^2-2x)'))).toBe(1)
  })
})
