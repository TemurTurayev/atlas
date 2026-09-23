import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { exactClose } from '../../checker/compare'
import { add, dot, scale } from '../../math/vector'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'
import { mathSegments } from '../testing'
import { TIERS } from '../types'

const SEEDS = 30

/** Numbers inside the first "\left( ... \right)" tuple that appears at or after `marker` in `text`. */
function extractTuple(text: string, marker: string): number[] {
  const markerIndex = text.indexOf(marker)
  if (markerIndex < 0) throw new Error(`marker "${marker}" not found in: ${text}`)
  const openTag = '\\left('
  const closeTag = '\\right)'
  const openIndex = text.indexOf(openTag, markerIndex)
  const closeIndex = text.indexOf(closeTag, openIndex)
  if (openIndex < 0 || closeIndex < 0) throw new Error(`tuple after "${marker}" not found in: ${text}`)
  return text
    .slice(openIndex + openTag.length, closeIndex)
    .split(',')
    .map((s) => Number(s.trim()))
}

/** Integer immediately following `marker`, e.g. extractNumberAfter(text, 't=') for "...t=-3$". */
function extractNumberAfter(text: string, marker: string): number {
  const idx = text.indexOf(marker)
  if (idx < 0) throw new Error(`marker "${marker}" not found in: ${text}`)
  const rest = text.slice(idx + marker.length)
  const m = rest.match(/^-?\d+/)
  if (!m) throw new Error(`number after "${marker}" not found in: ${text}`)
  return Number(m[0])
}

/** Evaluate a bare "ax+by+cz" style expression at a point, using the same LaTeX engine as the checker. */
function evalPlaneLhs(lhs: string, point: readonly number[]): number {
  const expr = parseLatex(lhs.trim())
  if (!expr) throw new Error(`cannot parse plane expression: ${lhs}`)
  const value = evalReal(expr, { x: point[0], y: point[1], z: point[2] })
  if (value === null) throw new Error(`cannot evaluate plane expression: ${lhs}`)
  return value
}

/** Recover (a, b, c) from an "ax+by+cz" expression by evaluating at the three unit points. */
function normalFromLhs(lhs: string): number[] {
  return [evalPlaneLhs(lhs, [1, 0, 0]), evalPlaneLhs(lhs, [0, 1, 0]), evalPlaneLhs(lhs, [0, 0, 1])]
}

function expectVectorEqual(actual: readonly number[], expected: readonly number[], label: string): void {
  expect(actual.length, label).toBe(expected.length)
  actual.forEach((v, i) => expect(exactClose(v, expected[i]), `${label} component ${i}`).toBe(true))
}

describe('lines_param', () => {
  it.each(TIERS)('tier %i: the stated direction/point/parameter is mathematically correct', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('lines_param').generate(createRng(seed), tier)
      const label = `seed ${seed}`

      if (tier === 1) {
        // Direction vector must equal B - A, recomputed from the points printed in the statement.
        if (p.answer.kind !== 'vector') throw new Error('expected vector answer')
        const A = extractTuple(p.statement, 'A')
        const B = extractTuple(p.statement, 'B')
        const claimed = p.answer.components.map(Number)
        const expected = B.map((b, i) => b - A[i])
        expectVectorEqual(claimed, expected, `${label} direction`)
      } else if (tier === 2) {
        // The claimed point must equal p + t*d for the p, d, t printed in the statement.
        if (p.answer.kind !== 'vector') throw new Error('expected vector answer')
        const pVec = extractTuple(p.statement, 'p=')
        const dVec = extractTuple(p.statement, 'd=')
        const t = extractNumberAfter(p.statement, 't=')
        const claimed = p.answer.components.map(Number)
        const expected = add(pVec, scale(t, dVec))
        expectVectorEqual(claimed, expected, `${label} point at t`)
      } else {
        // Substitute the claimed t back into the line and check it lands on Q.
        if (p.answer.kind !== 'number') throw new Error('expected number answer')
        const pVec = extractTuple(p.statement, 'p=')
        const dVec = extractTuple(p.statement, 'd=')
        const Q = extractTuple(p.statement, 'Q')
        const t = Number(p.answer.value)
        const reached = add(pVec, scale(t, dVec))
        expectVectorEqual(reached, Q, `${label} r(t) reaches Q`)
      }
    }
  })
})

describe('planes', () => {
  it.each(TIERS)('tier %i: the stated normal/constant/intersection is mathematically correct', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('planes').generate(createRng(seed), tier)
      const label = `seed ${seed}`

      if (tier === 1) {
        // The claimed normal must equal the coefficients read off the plane's own equation.
        if (p.answer.kind !== 'vector') throw new Error('expected vector answer')
        const [lhs] = mathSegments(p.statement)[0].split('=')
        const claimed = p.answer.components.map(Number)
        expectVectorEqual(claimed, normalFromLhs(lhs), `${label} normal vector`)
      } else if (tier === 2) {
        // d must equal n . P for the point and normal printed in the statement.
        if (p.answer.kind !== 'number') throw new Error('expected number answer')
        const P = extractTuple(p.statement, 'P')
        const n = extractTuple(p.statement, 'n=')
        const claimed = Number(p.answer.value)
        expect(exactClose(claimed, dot(n, P)), `${label} plane constant`).toBe(true)
      } else {
        // Substitute the claimed intersection (t, or the point itself) back into both the line and the plane.
        const pVec = extractTuple(p.statement, 'p=')
        const dVec = extractTuple(p.statement, 'd=')
        const planeSegment = mathSegments(p.statement)[3]
        const [lhs, rhsStr] = planeSegment.split('=')
        const k = Number(rhsStr.trim())

        if (p.answer.kind === 'number') {
          const t = Number(p.answer.value)
          const point = add(pVec, scale(t, dVec))
          expect(exactClose(evalPlaneLhs(lhs, point), k), `${label} line-at-t satisfies plane`).toBe(true)
        } else if (p.answer.kind === 'vector') {
          const Q = p.answer.components.map(Number)
          const i = dVec.findIndex((x) => x !== 0)
          const t = (Q[i] - pVec[i]) / dVec[i]
          const onLine = add(pVec, scale(t, dVec))
          expectVectorEqual(Q, onLine, `${label} Q lies on the line`)
          expect(exactClose(evalPlaneLhs(lhs, Q), k), `${label} Q satisfies plane`).toBe(true)
        } else {
          throw new Error('expected number or vector answer')
        }
      }
    }
  })
})
