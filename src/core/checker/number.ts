import { evalReal, parseLatex, unknowns } from './ce'
import { approxClose, exactClose, hasDecimal } from './compare'
import { normalizeLatex } from './normalize'
import { correct, incorrect, malformed, MSG, type CheckResult } from './result'
import { splitTopLevel, stripAssignment } from './split'
import { mustEvaluate } from './values'

export function checkNumber(value: string, latex: string): CheckResult {
  const input = normalizeLatex(latex)
  if (input === '') return malformed(MSG.empty)
  if (splitTopLevel(input).length > 1) return malformed(MSG.oneNumber)
  const user = parseLatex(stripAssignment(input))
  if (!user) return malformed(MSG.unparsable)
  if (unknowns(user).length > 0) return malformed(MSG.noVariables)
  const reference = mustEvaluate(value)
  const answer = evalReal(user)
  if (answer === null) return incorrect()
  const approx = hasDecimal(input)
  const same = approx ? approxClose : exactClose
  if (same(answer, reference)) return correct(approx ? MSG.approximate : undefined)
  if (reference !== 0 && same(answer, -reference)) return incorrect(MSG.sign)
  if (reference !== 0 && answer !== 0 && same(1 / answer, reference)) return incorrect(MSG.reciprocal)
  return incorrect()
}
