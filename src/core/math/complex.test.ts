import { describe, expect, it } from 'vitest'
import { formatComplex, ordinal } from './complex'

describe('formatComplex', () => {
  it('writes a + bi as by hand', () => {
    expect(formatComplex(3, -2)).toBe('3 - 2i')
    expect(formatComplex(-5, 1)).toBe('-5 + i')
    expect(formatComplex(-3, -1)).toBe('-3 - i')
    expect(formatComplex(0, 2)).toBe('2i')
    expect(formatComplex(0, -1)).toBe('-i')
    expect(formatComplex(5, 0)).toBe('5')
    expect(formatComplex(0, 0)).toBe('0')
    expect(formatComplex('\\frac{1}{2}', '-\\frac{\\sqrt{3}}{2}')).toBe('\\frac{1}{2} - \\frac{\\sqrt{3}}{2}i')
  })
})

describe('ordinal', () => {
  it('gives English ordinals, including the teens', () => {
    expect([1, 2, 3, 4, 9, 11, 12, 13, 21, 22, 23, 101, 111].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '9th', '11th', '12th', '13th', '21st', '22nd', '23rd', '101st', '111th',
    ])
  })
})
