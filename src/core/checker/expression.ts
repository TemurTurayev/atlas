import { createRng, type Rng } from '../random/rng'
import type { ExpressionSpec } from '../templates/types'
import { evalReal, parseLatex, unknowns, type Expr } from './ce'
import { sampleClose } from './compare'
import { factorCount, isExpanded, isFactored } from './forms'
import { normalizeLatex } from './normalize'
import { correct, incorrect, malformed, MSG, type CheckResult } from './result'
import { stripAssignment } from './split'

type Verdict = 'equal' | 'negated' | 'shifted' | 'different'

/** The constant of integration, as it is written on paper. */
const CONSTANT = 'C'

const DEFAULT_RANGE: readonly [number, number] = [-3, 3]
const TARGET_POINTS = 10
const MAX_ATTEMPTS = 80

function sampleValue(rng: Rng, lo: number, hi: number): number {
  const draw = () => lo + rng.next() * (hi - lo)
  const risky = (v: number) => Math.abs(v) < 0.15 || Math.abs(Math.abs(v) - 1) < 0.15
  let value = draw()
  for (let i = 0; i < 20 && risky(value); i += 1) value = draw()
  return value
}

function samplePoint(rng: Rng, spec: ExpressionSpec): Record<string, number> {
  return Object.fromEntries(
    spec.variables.map((v) => {
      const [lo, hi] = spec.domain?.[v] ?? DEFAULT_RANGE
      return [v, sampleValue(rng, lo, hi)]
    }),
  )
}

/**
 * Compares two expressions at seeded random points inside the spec's domain. `shifted` means the
 * two differ by the same constant everywhere — the freedom an antiderivative has.
 */
export function compareOnSamples(reference: Expr, user: Expr, spec: ExpressionSpec, extra: Record<string, number> = {}): Verdict {
  const rng = createRng(0x5eed)
  let valid = 0
  let equal = true
  let negated = true
  let shift: number | null = null
  let shifted = true
  for (let attempt = 0; attempt < MAX_ATTEMPTS && valid < TARGET_POINTS; attempt += 1) {
    const point = samplePoint(rng, spec)
    const r = evalReal(reference, point)
    if (r === null) continue
    valid += 1
    const u = evalReal(user, { ...point, ...extra })
    if (u === null) return 'different'
    equal = equal && sampleClose(u, r)
    negated = negated && sampleClose(u, -r)
    const gap = u - r
    if (shift === null) shift = gap
    shifted = shifted && sampleClose(gap - shift, 0)
    if (!equal && !negated && !shifted) return 'different'
  }
  if (valid < 3) throw new Error(`Reference "${spec.value}" is undefined on its sampling domain`)
  if (equal) return 'equal'
  if (negated) return 'negated'
  return shifted ? 'shifted' : 'different'
}

function checkForm(spec: ExpressionSpec, reference: Expr, user: Expr): CheckResult {
  const form = spec.form ?? 'any'
  if (form === 'factored') {
    if (!isFactored(user)) return malformed(MSG.notFactored)
    if (factorCount(user) < factorCount(reference)) return malformed(MSG.notFullyFactored)
  }
  if (form === 'expanded' && !isExpanded(user)) return malformed(MSG.notExpanded)
  return correct()
}

export function checkExpression(spec: ExpressionSpec, latex: string): CheckResult {
  const input = normalizeLatex(latex)
  if (input === '') return malformed(MSG.empty)
  const user = parseLatex(stripAssignment(input))
  if (!user) return malformed(MSG.unparsable)
  const upToConstant = spec.upToConstant === true
  // An indefinite integral is written with a free constant; "C" is part of the answer, not a stray
  // variable, and it is pinned to zero for the comparison.
  const allowed = upToConstant ? [...spec.variables, CONSTANT] : spec.variables
  const foreign = unknowns(user).filter((v) => !allowed.includes(v))
  if (foreign.length > 0) return malformed(`Use only these variables: ${spec.variables.join(', ')}`)
  const reference = parseLatex(spec.value)
  if (!reference) throw new Error(`Invalid reference expression: ${spec.value}`)
  const verdict = compareOnSamples(reference, user, spec, upToConstant ? { [CONSTANT]: 0 } : {})
  if (verdict === 'shifted') return upToConstant ? correct(MSG.anyConstant) : incorrect()
  if (verdict === 'negated') return incorrect(MSG.sign)
  if (verdict === 'different') return incorrect()
  const form = checkForm(spec, reference, user)
  // "+ C" carries no numeric value, so the sampling cannot see it; the written answer can.
  if (upToConstant && form.status === 'correct' && !unknowns(user).includes(CONSTANT)) return correct(MSG.missingConstant)
  return form
}
