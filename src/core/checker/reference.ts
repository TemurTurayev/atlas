import { setLatex } from '../math/latex'
import { matLatex } from '../math/matrix'
import { vecLatex } from '../math/vector'
import type { AnswerSpec, IntervalPart } from '../templates/types'
import type { UserAnswer } from './check'

export function intervalLatex(parts: readonly IntervalPart[]): string {
  if (parts.length === 0) return '\\emptyset'
  return parts
    .map((p) => {
      const open = p.lo !== null && p.loClosed ? '[' : '('
      const close = p.hi !== null && p.hiClosed ? ']' : ')'
      return `${open}${p.lo ?? '-\\infty'}, ${p.hi ?? '\\infty'}${close}`
    })
    .join(' \\cup ')
}

/** The correct answer, as the UI would submit it. */
export function referenceAnswer(spec: AnswerSpec): UserAnswer {
  switch (spec.kind) {
    case 'number':
    case 'expression':
      return { kind: 'latex', latex: spec.value }
    case 'numberSet':
      return { kind: 'latex', latex: spec.values.length > 0 ? spec.values.join(', ') : '\\emptyset' }
    case 'finiteSet':
      return { kind: 'latex', latex: setLatex(spec.elements) }
    case 'interval':
      return { kind: 'interval', parts: spec.parts }
    case 'vector':
      return { kind: 'vector', components: spec.components }
    case 'matrix':
      return { kind: 'matrix', rows: spec.rows }
    case 'choice':
      return { kind: 'choice', id: spec.correctId }
  }
}

/** What the learner typed, ready to render next to the reference answer. */
export function userAnswerLatex(answer: UserAnswer, spec: AnswerSpec): string {
  if (answer.kind === 'matrix') return matLatex(answer.rows.map((row) => row.map((c) => (c.trim() === '' ? '?' : c))))
  if (answer.kind === 'vector') return vecLatex(answer.components.map((c) => (c.trim() === '' ? '?' : c)))
  if (answer.kind === 'interval') return intervalLatex(answer.parts)
  if (answer.kind === 'choice') return spec.kind === 'choice' ? (spec.options.find((o) => o.id === answer.id)?.label ?? answer.id) : answer.id
  return answer.latex
}

function perturbIntervals(parts: readonly IntervalPart[]): IntervalPart[] {
  if (parts.length === 0) return [{ lo: '0', hi: '1', loClosed: true, hiClosed: true }]
  const [first, ...rest] = parts
  if (first.lo !== null) return [{ ...first, loClosed: !first.loClosed }, ...rest]
  if (first.hi !== null) return [{ ...first, hiClosed: !first.hiClosed }, ...rest]
  return [{ lo: '0', hi: null, loClosed: true, hiClosed: false }]
}

/** A plausible wrong answer — used by tests to prove the checker is not trivially permissive. */
export function perturbedAnswer(spec: AnswerSpec): UserAnswer {
  switch (spec.kind) {
    case 'number':
    case 'expression':
      return { kind: 'latex', latex: `\\left(${spec.value}\\right)+1` }
    case 'numberSet':
      return { kind: 'latex', latex: [...spec.values, '1000'].join(', ') }
    case 'finiteSet':
      return { kind: 'latex', latex: setLatex([...spec.elements, '1000']) }
    case 'interval':
      return { kind: 'interval', parts: perturbIntervals(spec.parts) }
    case 'vector':
      return { kind: 'vector', components: spec.components.map((c, i) => (i === 0 ? `\\left(${c}\\right)+1` : c)) }
    case 'matrix':
      return {
        kind: 'matrix',
        rows: spec.rows.map((row, i) => row.map((c, j) => (i === 0 && j === 0 ? `\\left(${c}\\right)+1` : c))),
      }
    case 'choice':
      return { kind: 'choice', id: spec.options.find((o) => o.id !== spec.correctId)?.id ?? `${spec.correctId}-wrong` }
  }
}

/** LaTeX (or label text for choices) to display the correct answer. */
export function answerToLatex(spec: AnswerSpec): string {
  switch (spec.kind) {
    case 'number':
    case 'expression':
      return spec.value
    case 'numberSet':
      return spec.values.length > 0 ? spec.values.join(', ') : '\\emptyset'
    case 'finiteSet':
      return setLatex(spec.elements)
    case 'interval':
      return intervalLatex(spec.parts)
    case 'vector':
      return vecLatex(spec.components)
    case 'matrix':
      return matLatex(spec.rows)
    case 'choice':
      return spec.options.find((o) => o.id === spec.correctId)?.label ?? ''
  }
}
