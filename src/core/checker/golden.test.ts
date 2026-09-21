import { describe, expect, it } from 'vitest'
import type { AnswerSpec, IntervalPart } from '../templates/types'
import { checkAnswer, type UserAnswer } from './check'
import { answerToLatex, intervalLatex, perturbedAnswer, referenceAnswer } from './reference'

type Case = readonly [AnswerSpec, UserAnswer, 'correct' | 'incorrect' | 'malformed']

const latex = (s: string): UserAnswer => ({ kind: 'latex', latex: s })
const iv = (lo: string | null, hi: string | null, loClosed = false, hiClosed = false): IntervalPart => ({ lo, hi, loClosed, hiClosed })
const numberSet = (...values: string[]): AnswerSpec => ({ kind: 'numberSet', values })
const finiteSet = (...elements: string[]): AnswerSpec => ({ kind: 'finiteSet', elements })
const interval = (...parts: IntervalPart[]): AnswerSpec => ({ kind: 'interval', parts })
const choice: AnswerSpec = { kind: 'choice', options: [{ id: 'a', label: 'yes' }, { id: 'b', label: 'no' }], correctId: 'a' }

const CASES: readonly Case[] = [
  [numberSet('2', '3'), latex('2, 3'), 'correct'],
  [numberSet('2', '3'), latex('3,2'), 'correct'],
  [numberSet('2', '3'), latex('x=2, x=3'), 'correct'],
  [numberSet('2', '3'), latex('\\{2, 3\\}'), 'correct'],
  [numberSet('2', '3'), latex('2'), 'incorrect'],
  [numberSet('2', '3'), latex('2, 3, 4'), 'incorrect'],
  [numberSet('1+\\sqrt{2}', '1-\\sqrt{2}'), latex('1\\pm\\sqrt{2}'), 'correct'],
  [numberSet(), latex('\\emptyset'), 'correct'],
  [numberSet(), latex('none'), 'correct'],
  [numberSet(), latex('0'), 'incorrect'],
  [numberSet('\\frac{3}{2}'), latex('1.5'), 'correct'],
  [numberSet('\\frac{3}{2}'), latex('1.5, 1.5'), 'correct'],
  [numberSet('-\\frac{5}{2}', '\\frac{1}{2}'), latex('\\frac{1}{2},-2.5'), 'correct'],
  [numberSet('2'), latex('x+1'), 'malformed'],
  [numberSet('2'), latex(''), 'malformed'],
  [finiteSet('1', '2', '3'), latex('\\{1,2,3\\}'), 'correct'],
  [finiteSet('1', '2', '3'), latex('1,2,3'), 'correct'],
  [finiteSet('1', '2', '3'), latex('\\left\\lbrace3,1,2\\right\\rbrace'), 'correct'],
  [finiteSet('1', '2', '3'), latex('\\{1,2\\}'), 'incorrect'],
  [finiteSet(), latex('\\emptyset'), 'correct'],
  [finiteSet('(1,2)', '(1,3)', '(2,2)', '(2,3)'), latex('\\{(1,2),(1,3),(2,2),(2,3)\\}'), 'correct'],
  [finiteSet('(1,2)', '(1,3)', '(2,2)', '(2,3)'), latex('\\{(1,2),(2,2),(2,3)\\}'), 'incorrect'],
  [finiteSet('(1,2)'), latex('\\{(2,1)\\}'), 'incorrect'],
  [interval(iv(null, '-4'), iv('4', null)), { kind: 'interval', parts: [iv(null, '-4'), iv('4', null)] }, 'correct'],
  [interval(iv(null, '-4'), iv('4', null)), { kind: 'interval', parts: [iv('4', null), iv(null, '-4')] }, 'correct'],
  [interval(iv(null, '-4'), iv('4', null)), { kind: 'interval', parts: [iv(null, '-4', false, true), iv('4', null, true)] }, 'incorrect'],
  [interval(iv('2', '5', true, false)), { kind: 'interval', parts: [iv('2', '5', true, true)] }, 'incorrect'],
  [interval(iv('2', '5', true, false)), { kind: 'interval', parts: [iv('5', '2', true, false)] }, 'malformed'],
  [interval(iv('1', '5')), { kind: 'interval', parts: [iv('1', '3', false, true), iv('3', '5')] }, 'correct'],
  [interval(), { kind: 'interval', parts: [] }, 'correct'],
  [interval(iv('-\\sqrt{2}', '\\sqrt{2}')), { kind: 'interval', parts: [iv('-1.4142135623730951', '1.4142135623730951')] }, 'correct'],
  [choice, { kind: 'choice', id: 'a' }, 'correct'],
  [choice, { kind: 'choice', id: 'b' }, 'incorrect'],
  [choice, latex('a'), 'malformed'],
  [{ kind: 'number', value: '3' }, { kind: 'choice', id: 'a' }, 'malformed'],
]

describe('golden answer set', () => {
  it.each(CASES.map((c, i) => [i, ...c] as const))('case %i', (_i, spec, answer, expected) => {
    expect(checkAnswer(spec, answer).status).toBe(expected)
  })

  it('gives helpful set diagnostics', () => {
    expect(checkAnswer(numberSet('2', '3'), latex('2'))).toEqual({ status: 'incorrect', diagnosis: 'Found 1 of 2' })
    expect(checkAnswer(numberSet('2', '3'), latex('2,3,4'))).toEqual({ status: 'incorrect', diagnosis: 'Some extra values are in there' })
    expect(checkAnswer(interval(iv('2', '5', true)), { kind: 'interval', parts: [iv('2', '5')] })).toEqual({
      status: 'incorrect',
      diagnosis: 'The endpoints are right — check the brackets: ( excludes the endpoint, [ includes it',
    })
  })
})

describe('reference answers', () => {
  const specs: readonly AnswerSpec[] = [
    { kind: 'number', value: '-\\frac{3}{4}' },
    { kind: 'expression', value: '(x-2)(x-3)', variables: ['x'], form: 'factored' },
    numberSet('2', '3'),
    numberSet(),
    finiteSet('(1,2)', '(2,1)'),
    finiteSet(),
    interval(iv(null, '-4'), iv('4', null)),
    interval(iv('2', '5', true)),
    interval(),
    interval(iv(null, null)),
    choice,
  ]
  it.each(specs.map((s, i) => [i, s] as const))('spec %i: reference is correct, perturbation is not', (_i, spec) => {
    expect(checkAnswer(spec, referenceAnswer(spec)).status).toBe('correct')
    expect(checkAnswer(spec, perturbedAnswer(spec)).status).not.toBe('correct')
  })

  it('renders answers as LaTeX', () => {
    expect(intervalLatex([iv(null, '-4'), iv('4', null)])).toBe('(-\\infty, -4) \\cup (4, \\infty)')
    expect(intervalLatex([iv('2', '5', true)])).toBe('[2, 5)')
    expect(intervalLatex([])).toBe('\\emptyset')
    expect(answerToLatex(numberSet())).toBe('\\emptyset')
    expect(answerToLatex(numberSet('2', '3'))).toBe('2, 3')
    expect(answerToLatex(finiteSet('1', '2'))).toBe('\\{1, 2\\}')
    expect(answerToLatex(choice)).toBe('yes')
  })
})
