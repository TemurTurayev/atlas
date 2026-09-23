import { describe, expect, it } from 'vitest'
import { checkAnswer } from './check'
import { checkMatrix } from './matrix'

describe('checkMatrix', () => {
  it('accepts the entries in place', () => {
    expect(checkMatrix([['1', '2'], ['3', '4']], [['1', '2'], ['3', '4']]).status).toBe('correct')
    expect(checkMatrix([['1', '2'], ['3', '4']], [['1', '2'], ['3', '5']]).status).toBe('incorrect')
  })

  it('evaluates the entries, so fractions are fine', () => {
    expect(checkMatrix([['\\frac{1}{2}', '0'], ['0', '\\frac{3}{4}']], [['0.5', '0'], ['0', '\\frac{6}{8}']]).status).toBe('correct')
  })

  it('names a transpose instead of just saying no', () => {
    expect(checkMatrix([['1', '2'], ['3', '4']], [['1', '3'], ['2', '4']])).toEqual({
      status: 'incorrect',
      diagnosis: 'These are the right numbers, but rows and columns are swapped',
    })
  })

  it('names the forgotten factor, the classic 2x2 inverse mistake', () => {
    // the inverse of [[3,1],[5,2]] is [[2,-1],[-5,3]]; forgetting 1/det leaves it scaled
    expect(checkMatrix([['2', '-1'], ['-5', '3']], [['4', '-2'], ['-10', '6']])).toEqual({
      status: 'incorrect',
      diagnosis: 'The pattern is right — every entry is off by the same factor',
    })
  })

  it('a symmetric matrix is its own transpose, so a wrong answer is simply wrong', () => {
    expect(checkMatrix([['1', '2'], ['2', '1']], [['1', '3'], ['3', '1']])).toEqual({ status: 'incorrect' })
  })

  it('asks for every entry, and states the size it wants', () => {
    expect(checkMatrix([['1', '2']], [['', '']])).toEqual({ status: 'malformed', message: 'Type an answer' })
    expect(checkMatrix([['1', '2']], [['1', '']])).toEqual({ status: 'malformed', message: 'Fill in every entry' })
    expect(checkMatrix([['1', '2'], ['3', '4']], [['1', '2']])).toEqual({ status: 'malformed', message: 'This answer is a 2×2 matrix' })
  })

  it('is reached through checkAnswer, and only with a matrix answer', () => {
    const spec = { kind: 'matrix' as const, rows: [['1', '0'], ['0', '1']] }
    expect(checkAnswer(spec, { kind: 'matrix', rows: [['1', '0'], ['0', '1']] }).status).toBe('correct')
    expect(checkAnswer(spec, { kind: 'latex', latex: '1' }).status).toBe('malformed')
  })
})
