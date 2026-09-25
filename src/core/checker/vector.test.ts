import { describe, expect, it } from 'vitest'
import { checkAnswer } from './check'
import { checkNumber } from './number'
import { perturbedAnswer, referenceAnswer } from './reference'
import { checkVector } from './vector'

const spec = (components: string[]) => ({ kind: 'vector' as const, components })

describe('checkVector', () => {
  it('accepts the components in order', () => {
    expect(checkVector(['3', '-1', '2'], ['3', '-1', '2']).status).toBe('correct')
    expect(checkVector(['3', '-1'], ['-1', '3']).status).toBe('incorrect')
  })

  it('evaluates the components, so fractions and roots are fine', () => {
    expect(checkVector(['\\frac{1}{\\sqrt{5}}', '\\frac{2}{\\sqrt{5}}'], ['\\frac{\\sqrt5}{5}', '\\frac{2\\sqrt5}{5}']).status).toBe('correct')
    expect(checkVector(['6'], ['2\\cdot3']).status).toBe('correct')
  })

  it('accepts decimals with a note', () => {
    expect(checkVector(['\\frac{1}{2}', '1'], ['0.5', '1'])).toEqual({ status: 'correct', note: 'Correct (approximately)' })
  })

  it('names the mistake when the whole vector is flipped', () => {
    expect(checkVector(['3', '-1', '2'], ['-3', '1', '-2'])).toEqual({
      status: 'incorrect',
      diagnosis: 'This is the opposite vector — check the signs',
    })
  })

  it('separates a wrong length from a wrong direction', () => {
    expect(checkVector(['3', '4'], ['6', '8'])).toEqual({ status: 'incorrect', diagnosis: 'Right direction, but the length is off' })
    expect(checkVector(['3', '4'], ['4', '3'])).toEqual({ status: 'incorrect' })
  })

  it('asks for every component before judging', () => {
    expect(checkVector(['1', '2'], ['', ''])).toEqual({ status: 'malformed', message: 'Type an answer' })
    expect(checkVector(['1', '2'], ['1', ''])).toEqual({ status: 'malformed', message: 'Fill in every component' })
  })

  it('rejects components it cannot read', () => {
    expect(checkVector(['1', '2'], ['1', 'x']).status).toBe('malformed')
    expect(checkVector(['1', '2'], ['1', '\\frac{']).status).toBe('malformed')
  })

  it('is reached through checkAnswer, and only with a vector answer', () => {
    expect(checkAnswer(spec(['1', '2']), { kind: 'vector', components: ['1', '2'] }).status).toBe('correct')
    expect(checkAnswer(spec(['1', '2']), { kind: 'latex', latex: '1, 2' }).status).toBe('malformed')
  })
})

describe('degree signs', () => {
  it('an answer in degrees may carry the unit', () => {
    expect(checkNumber('45', '45^\\circ').status).toBe('correct')
    expect(checkNumber('45', '45°').status).toBe('correct')
    expect(checkNumber('45', '45').status).toBe('correct')
    expect(checkNumber('45', '30^\\circ').status).toBe('incorrect')
  })
})

describe('a direction answer', () => {
  it('accepts any nonzero multiple, including the opposite one', () => {
    expect(checkVector(['1', '2'], ['1', '2'], true).status).toBe('correct')
    expect(checkVector(['1', '2'], ['3', '6'], true)).toEqual({
      status: 'correct',
      note: 'Correct — any nonzero multiple of this direction works',
    })
    expect(checkVector(['1', '2'], ['-1', '-2'], true).status).toBe('correct')
    expect(checkVector(['1', '2'], ['\\frac{1}{2}', '1'], true).status).toBe('correct')
  })

  it('still refuses a different direction, and the zero vector', () => {
    expect(checkVector(['1', '2'], ['2', '1'], true).status).toBe('incorrect')
    expect(checkVector(['1', '2'], ['0', '0'], true).status).toBe('incorrect')
  })

  it('leaves the exact-answer behaviour alone when the flag is off', () => {
    expect(checkVector(['1', '2'], ['3', '6'])).toEqual({ status: 'incorrect', diagnosis: 'Right direction, but the length is off' })
  })
})

describe('the perturbed answer the harness uses', () => {
  it('breaks the direction even when only one component is nonzero', () => {
    const spec = { kind: 'vector' as const, components: ['2', '0', '0'], upToScale: true }
    const wrong = perturbedAnswer(spec)
    expect(checkAnswer(spec, wrong).status).not.toBe('correct')
    expect(checkAnswer(spec, referenceAnswer(spec)).status).toBe('correct')
  })

  it('still breaks an ordinary vector answer', () => {
    const spec = { kind: 'vector' as const, components: ['3', '-1'] }
    expect(checkAnswer(spec, perturbedAnswer(spec)).status).not.toBe('correct')
  })
})
