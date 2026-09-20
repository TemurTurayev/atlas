import type { IntervalPart } from '../templates/types'
import { sameEndpoint } from './compare'
import { normalizeLatex } from './normalize'
import { correct, incorrect, malformed, type CheckResult } from './result'
import { evaluateItem } from './values'

interface NumericPart {
  readonly lo: number
  readonly hi: number
  readonly loClosed: boolean
  readonly hiClosed: boolean
}

const BRACKETS_HINT = 'Концы верные — проверь скобки: ( не включает конец, [ включает'

function endpoint(latex: string | null, side: 'lo' | 'hi'): number | null {
  if (latex === null) return side === 'lo' ? -Infinity : Infinity
  return evaluateItem(normalizeLatex(latex))
}

function toNumeric(parts: readonly IntervalPart[]): NumericPart[] | null {
  const out: NumericPart[] = []
  for (const p of parts) {
    const lo = endpoint(p.lo, 'lo')
    const hi = endpoint(p.hi, 'hi')
    if (lo === null || hi === null) return null
    const loClosed = Number.isFinite(lo) && p.loClosed
    const hiClosed = Number.isFinite(hi) && p.hiClosed
    if (lo > hi || (sameEndpoint(lo, hi) && !(loClosed && hiClosed))) return null
    out.push({ lo, hi, loClosed, hiClosed })
  }
  return out
}

const compareLo = (a: NumericPart, b: NumericPart): number =>
  sameEndpoint(a.lo, b.lo) ? Number(b.loClosed) - Number(a.loClosed) : a.lo < b.lo ? -1 : 1

function touches(last: NumericPart, next: NumericPart): boolean {
  return next.lo < last.hi || (sameEndpoint(next.lo, last.hi) && (last.hiClosed || next.loClosed))
}

/** Sorts and merges overlapping or touching parts into a canonical union. */
export function mergeParts(parts: readonly NumericPart[]): NumericPart[] {
  return [...parts].sort(compareLo).reduce<NumericPart[]>((acc, part) => {
    const last = acc[acc.length - 1]
    if (!last || !touches(last, part)) return [...acc, part]
    const hi = Math.max(last.hi, part.hi)
    const hiClosed = sameEndpoint(part.hi, last.hi) ? last.hiClosed || part.hiClosed : part.hi > last.hi ? part.hiClosed : last.hiClosed
    return [...acc.slice(0, -1), { ...last, hi, hiClosed }]
  }, [])
}

export function checkInterval(reference: readonly IntervalPart[], answer: readonly IntervalPart[]): CheckResult {
  const user = toNumeric(answer)
  if (!user) return malformed('Проверь концы: левый должен быть меньше правого, и оба — числа')
  const ref = toNumeric(reference)
  if (!ref) throw new Error('Invalid reference interval')
  const u = mergeParts(user)
  const r = mergeParts(ref)
  if (u.length !== r.length) return incorrect()
  const valuesMatch = u.every((p, i) => sameEndpoint(p.lo, r[i].lo) && sameEndpoint(p.hi, r[i].hi))
  if (!valuesMatch) return incorrect()
  const bracketsMatch = u.every((p, i) => p.loClosed === r[i].loClosed && p.hiClosed === r[i].hiClosed)
  return bracketsMatch ? correct() : incorrect(BRACKETS_HINT)
}
