import { describe, expect, it } from 'vitest'
import { checkAnswer } from './check'
import type { AnswerSpec } from '../templates/types'

const integral = (value: string): AnswerSpec => ({ kind: 'expression', value, variables: ['x'], upToConstant: true })
const plain = (value: string): AnswerSpec => ({ kind: 'expression', value, variables: ['x'] })
const typed = (latex: string) => ({ kind: 'latex' as const, latex })

describe('an antiderivative', () => {
  it('accepts the constant of integration, whatever it is called or set to', () => {
    expect(checkAnswer(integral('x^3+x'), typed('x^3+x+C')).status).toBe('correct')
    expect(checkAnswer(integral('x^3+x'), typed('x^3+x+5')).status).toBe('correct')
    expect(checkAnswer(integral('x^3+x'), typed('x^3+x-\\frac{1}{2}')).status).toBe('correct')
  })

  it('takes the function without "+ C", and says what is missing', () => {
    expect(checkAnswer(integral('x^3+x'), typed('x^3+x'))).toEqual({
      status: 'correct',
      note: 'The function is right; an indefinite integral also needs "+ C"',
    })
  })

  it('still refuses a function that is actually different', () => {
    expect(checkAnswer(integral('x^3+x'), typed('x^3+2x+C')).status).toBe('incorrect')
    expect(checkAnswer(integral('x^3+x'), typed('3x^2+1+C')).status).toBe('incorrect')
  })

  it('leaves ordinary expression answers alone', () => {
    expect(checkAnswer(plain('x^3+x'), typed('x^3+x+5')).status).toBe('incorrect')
    expect(checkAnswer(plain('x^3+x'), typed('x^3+x+C')).status).toBe('malformed')
    expect(checkAnswer(plain('x^3+x'), typed('x^3+x')).status).toBe('correct')
  })
})
