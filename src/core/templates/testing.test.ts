import { describe, expect, it } from 'vitest'
import { mathSegments, repeatedValues, signSlips, strayLatex, unbracedScripts } from './testing'

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

describe('signSlips', () => {
  it('flags doubled signs and a bare negative after a product sign', () => {
    expect(signSlips('12 - -36')).toEqual(['- -'])
    expect(signSlips('-4x+-2y=-18')).toEqual(['+-'])
    expect(signSlips('5 + 0.2\\cdot -11')).toEqual(['\\cdot -'])
  })
  it('passes brackets, \\pm and ordinary negatives', () => {
    expect(signSlips('12 - (-36) = 48')).toEqual([])
    expect(signSlips('x = \\pm 3, \\; -x^2 - 3')).toEqual([])
    expect(signSlips('0.2\\cdot\\left(-11\\right)')).toEqual([])
    expect(signSlips('(-\\infty, -3)')).toEqual([])
  })
})

describe('repeatedValues', () => {
  it('flags a value written twice in a row', () => {
    expect(repeatedValues('\\frac{22}{18} = \\frac{11}{9} = \\frac{11}{9}')).toEqual(['\\frac{11}{9}'])
  })
  it('passes chains that move on, and inequalities', () => {
    expect(repeatedValues('x = 2 + 3 = 5')).toEqual([])
    expect(repeatedValues('a \\le b, \\quad c \\ge d')).toEqual([])
    expect(repeatedValues('f(x) = x, \\quad g(x) = x')).toEqual([])
    expect(repeatedValues('0 = 0')).toEqual([])
    expect(repeatedValues('d = 0 = 0')).toEqual(['0'])
  })
})

describe('unbracedScripts', () => {
  it('flags multi-character scripts without braces', () => {
    expect(unbracedScripts('4 \\times 10^14')).toEqual(['^14'])
    expect(unbracedScripts('x^-1 + a_12')).toEqual(['^-1', '_12'])
  })
  it('passes braced and single-character scripts', () => {
    expect(unbracedScripts('10^{14} + x^2 + a_{12} + e^{-x}')).toEqual([])
  })
})
