import { cols, rows, transpose, type Mat } from '../math/matrix'
import { approxClose, exactClose, hasDecimal } from './compare'
import { normalizeLatex } from './normalize'
import { correct, incorrect, malformed, MSG, type CheckResult } from './result'
import { evaluateItem, mustEvaluate } from './values'

const flat = (a: Mat): number[] => a.flatMap((row) => [...row])

/** Every entry is the same multiple of the reference — the missing 1/det of an inverse, typically. */
function sameShapeDifferentScale(user: Mat, reference: Mat): boolean {
  const flatRef = flat(reference)
  const flatUser = flat(user)
  const pivot = flatRef.findIndex((x) => x !== 0)
  if (pivot < 0 || flatUser[pivot] === 0) return false
  const factor = flatUser[pivot] / flatRef[pivot]
  if (exactClose(factor, 1)) return false
  return flatRef.every((x, i) => exactClose(x * factor, flatUser[i]))
}

const sameSize = (a: Mat, b: Mat): boolean => rows(a) === rows(b) && cols(a) === cols(b)

export function checkMatrix(reference: readonly (readonly string[])[], typed: readonly (readonly string[])[]): CheckResult {
  const input = typed.map((row) => row.map(normalizeLatex))
  const cells = input.flatMap((row) => row)
  if (cells.every((c) => c === '')) return malformed(MSG.empty)
  if (cells.some((c) => c === '')) return malformed(MSG.everyEntry)
  if (rows(input) !== rows(reference) || cols(input) !== cols(reference)) {
    return malformed(`This answer is a ${rows(reference)}×${cols(reference)} matrix`)
  }

  const evaluated = input.map((row) => row.map(evaluateItem))
  if (evaluated.some((row) => row.some((v) => v === null))) return malformed(MSG.unparsable)
  const user = evaluated as number[][]
  const expected = reference.map((row) => row.map(mustEvaluate))

  const approx = cells.some(hasDecimal)
  const same = approx ? approxClose : exactClose
  if (user.every((row, i) => row.every((v, j) => same(v, expected[i][j])))) {
    return correct(approx ? MSG.approximate : undefined)
  }
  const flipped = transpose(expected)
  if (sameSize(user, flipped) && user.every((row, i) => row.every((v, j) => same(v, flipped[i][j])))) {
    return incorrect(MSG.transposed)
  }
  if (sameShapeDifferentScale(user, expected)) return incorrect(MSG.wrongScale)
  return incorrect()
}
