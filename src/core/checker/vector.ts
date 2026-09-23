import { approxClose, exactClose, hasDecimal } from './compare'
import { normalizeLatex } from './normalize'
import { correct, incorrect, malformed, MSG, type CheckResult } from './result'
import { evaluateItem, mustEvaluate } from './values'

/** Every component is a scalar multiple of the reference by the same factor. */
function sameDirection(user: readonly number[], reference: readonly number[]): boolean {
  const pivot = reference.findIndex((x) => x !== 0)
  if (pivot < 0 || user[pivot] === 0) return false
  const factor = user[pivot] / reference[pivot]
  return reference.every((x, i) => exactClose(x * factor, user[i]))
}

export function checkVector(components: readonly string[], typed: readonly string[]): CheckResult {
  const input = typed.map(normalizeLatex)
  if (input.every((c) => c === '')) return malformed(MSG.empty)
  if (input.some((c) => c === '')) return malformed(MSG.everyComponent)
  if (input.length !== components.length) return malformed(`This answer has ${components.length} components`)

  const user = input.map(evaluateItem)
  if (user.some((v) => v === null)) return malformed(MSG.unparsable)
  const answer = user as number[]
  const reference = components.map(mustEvaluate)

  const approx = input.some(hasDecimal)
  const same = approx ? approxClose : exactClose
  if (answer.every((v, i) => same(v, reference[i]))) return correct(approx ? MSG.approximate : undefined)
  if (answer.every((v, i) => same(v, -reference[i]))) return incorrect(MSG.opposite)
  if (sameDirection(answer, reference)) return incorrect(MSG.wrongLength)
  return incorrect()
}
