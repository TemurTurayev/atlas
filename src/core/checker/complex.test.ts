import { describe, expect, it } from 'vitest'
import { checkAnswer } from './check'
import { checkComplex, complexLatex } from './complex'
import { answerToLatex, perturbedAnswer, referenceAnswer } from './reference'

describe('checkComplex', () => {
  it('accepts the number in any equivalent form', () => {
    expect(checkComplex('3', '-2', '3-2i').status).toBe('correct')
    expect(checkComplex('3', '-2', '-2i+3').status).toBe('correct')
    expect(checkComplex('0', '2', '(1+i)^2').status).toBe('correct')
    expect(checkComplex('1', '\\sqrt{3}', '2e^{i\\pi/3}').status).toBe('correct')
    expect(checkComplex('1', '\\sqrt{3}', '2\\left(\\cos\\frac{\\pi}{3}+i\\sin\\frac{\\pi}{3}\\right)').status).toBe('correct')
    expect(checkComplex('-1', '0', 'e^{i\\pi}').status).toBe('correct')
    expect(checkComplex('5', '0', '5').status).toBe('correct')
  })

  it('accepts decimals with a note', () => {
    expect(checkComplex('\\frac{1}{2}', '\\frac{\\sqrt{3}}{2}', '0.5+0.866i')).toEqual({ status: 'correct', note: 'Correct (approximately)' })
  })

  it('names the common slips', () => {
    expect(checkComplex('3', '-2', '3+2i')).toEqual({ status: 'incorrect', diagnosis: 'This is the complex conjugate — check the sign of the imaginary part' })
    expect(checkComplex('3', '-2', '-3+2i')).toEqual({ status: 'incorrect', diagnosis: 'Looks like a sign slipped' })
    expect(checkComplex('3', '-2', '-2+3i')).toEqual({ status: 'incorrect', diagnosis: 'The real and imaginary parts are swapped' })
    expect(checkComplex('3', '-2', '3')).toEqual({ status: 'incorrect', diagnosis: 'The real part is right, but the imaginary part is missing' })
    expect(checkComplex('3', '-2', '4-2i')).toEqual({ status: 'incorrect' })
  })

  it('asks for a single number without variables', () => {
    expect(checkComplex('1', '1', '')).toEqual({ status: 'malformed', message: 'Type an answer' })
    expect(checkComplex('1', '1', '1+i, 2')).toEqual({ status: 'malformed', message: 'One number, please. Use a dot for decimals: 2.5' })
    expect(checkComplex('1', '1', 'x+i')).toEqual({ status: 'malformed', message: 'This answer is a number, with no variables' })
  })
})

describe('complexLatex', () => {
  it('writes a + bi the way it is written by hand', () => {
    expect(complexLatex('3', '-2')).toBe('3-2i')
    expect(complexLatex('3', '2')).toBe('3+2i')
    expect(complexLatex('0', '2')).toBe('2i')
    expect(complexLatex('0', '-1')).toBe('-i')
    expect(complexLatex('4', '1')).toBe('4+i')
    expect(complexLatex('5', '0')).toBe('5')
    expect(complexLatex('0', '0')).toBe('0')
    expect(complexLatex('\\frac{1}{2}', '-\\frac{\\sqrt{3}}{2}')).toBe('\\frac{1}{2}-\\frac{\\sqrt{3}}{2}i')
  })
})

describe('complex answers in the shared checker', () => {
  const spec = { kind: 'complex' as const, re: '2', im: '-1' }
  it('accepts its own reference and rejects the perturbation', () => {
    expect(checkAnswer(spec, referenceAnswer(spec)).status).toBe('correct')
    expect(checkAnswer(spec, perturbedAnswer(spec)).status).not.toBe('correct')
    expect(answerToLatex(spec)).toBe('2-i')
  })
  it('is typed as a formula, not as components', () => {
    expect(checkAnswer(spec, { kind: 'vector', components: ['2', '-1'] }).status).toBe('malformed')
  })
})
