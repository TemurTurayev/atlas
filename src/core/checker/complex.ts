import { evalComplex, parseLatex, unknowns } from './ce'
import { approxClose, exactClose, hasDecimal } from './compare'
import { normalizeLatex } from './normalize'
import { correct, incorrect, malformed, MSG, type CheckResult } from './result'
import { splitTopLevel, stripAssignment } from './split'
import { mustEvaluate } from './values'

/** a + bi as written by hand: "3-2i", "2i", "-i", "5". The parts are LaTeX. */
export function complexLatex(re: string, im: string): string {
  const reZero = mustEvaluate(re) === 0
  const imValue = mustEvaluate(im)
  if (imValue === 0) return re
  const negative = im.trim().startsWith('-')
  const magnitude = negative ? im.trim().slice(1) : im.trim()
  const imTerm = `${magnitude === '1' ? '' : magnitude}i`
  if (reZero) return `${negative ? '-' : ''}${imTerm}`
  return `${re}${negative ? '-' : '+'}${imTerm}`
}

/** Compares a typed complex number with re + i·im; accepts any form that evaluates to it (a+bi, polar, e^{iθ}). */
export function checkComplex(re: string, im: string, latex: string): CheckResult {
  const input = normalizeLatex(latex)
  if (input === '') return malformed(MSG.empty)
  if (splitTopLevel(input).length > 1) return malformed(MSG.oneNumber)
  const user = parseLatex(stripAssignment(input))
  if (!user) return malformed(MSG.unparsable)
  if (unknowns(user).length > 0) return malformed(MSG.noVariables)
  const answer = evalComplex(user)
  if (answer === null) return incorrect()
  const ref = { re: mustEvaluate(re), im: mustEvaluate(im) }
  const approx = hasDecimal(input)
  const same = approx ? approxClose : exactClose
  const is = (a: number, b: number) => same(a, b)
  if (is(answer.re, ref.re) && is(answer.im, ref.im)) return correct(approx ? MSG.approximate : undefined)
  if (ref.im !== 0 && is(answer.re, ref.re) && is(answer.im, -ref.im)) return incorrect(MSG.conjugate)
  if (is(answer.re, -ref.re) && is(answer.im, -ref.im)) return incorrect(MSG.sign)
  if (ref.re !== ref.im && is(answer.re, ref.im) && is(answer.im, ref.re)) return incorrect(MSG.swappedParts)
  if (ref.im !== 0 && is(answer.re, ref.re) && answer.im === 0) return incorrect(MSG.missingImaginary)
  return incorrect()
}
