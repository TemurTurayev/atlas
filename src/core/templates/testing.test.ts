import { describe, expect, it } from 'vitest'
import { mathSegments, strayLatex } from './testing'

describe('strayLatex', () => {
  it('passes prose whose LaTeX lives inside $…$', () => {
    expect(strayLatex('Find $\\frac{1}{2}x^{2}$ at 90% confidence, $50\\%$ of the time.')).toEqual([])
  })
  it('flags commands, sub- and superscripts outside $…$', () => {
    expect(strayLatex('The value \\sqrt{2} and x^{2} and a_{1}')).toEqual(['\\sqrt', '^{', '_{'])
  })
  it('flags escaped symbols outside $…$, which the app would print with their backslash', () => {
    expect(strayLatex('a 90\\% confidence level, 5\\,mm')).toEqual(['\\%', '\\,'])
  })
})

describe('mathSegments', () => {
  it('returns the contents of every $…$', () => {
    expect(mathSegments('a $x$ b $y+1$')).toEqual(['x', 'y+1'])
  })
})
