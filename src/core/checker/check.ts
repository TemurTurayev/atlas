import type { AnswerSpec, IntervalPart } from '../templates/types'
import { checkExpression } from './expression'
import { checkInterval } from './interval'
import { checkNumber } from './number'
import { correct, incorrect, malformed, MSG, type CheckResult } from './result'
import { checkFiniteSet, checkNumberSet } from './sets'

export type { CheckResult } from './result'

export type UserAnswer =
  | { readonly kind: 'latex'; readonly latex: string }
  | { readonly kind: 'interval'; readonly parts: readonly IntervalPart[] }
  | { readonly kind: 'choice'; readonly id: string }

/** The single place that decides whether an answer is right. */
export function checkAnswer(spec: AnswerSpec, answer: UserAnswer): CheckResult {
  switch (spec.kind) {
    case 'number':
      return answer.kind === 'latex' ? checkNumber(spec.value, answer.latex) : malformed(MSG.wrongInput)
    case 'expression':
      return answer.kind === 'latex' ? checkExpression(spec, answer.latex) : malformed(MSG.wrongInput)
    case 'numberSet':
      return answer.kind === 'latex' ? checkNumberSet(spec.values, answer.latex) : malformed(MSG.wrongInput)
    case 'finiteSet':
      return answer.kind === 'latex' ? checkFiniteSet(spec.elements, answer.latex) : malformed(MSG.wrongInput)
    case 'interval':
      return answer.kind === 'interval' ? checkInterval(spec.parts, answer.parts) : malformed(MSG.wrongInput)
    case 'choice':
      if (answer.kind !== 'choice') return malformed(MSG.wrongInput)
      return answer.id === spec.correctId ? correct() : incorrect()
  }
}
