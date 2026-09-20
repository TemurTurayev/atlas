import { evalReal, parseLatex, unknowns } from './ce'
import { exactClose } from './compare'

/** Numeric value of a constant LaTeX item; null if it has variables or no real value. */
export function evaluateItem(item: string): number | null {
  const expr = parseLatex(item)
  if (!expr || unknowns(expr).length > 0) return null
  return evalReal(expr)
}

export function mustEvaluate(latex: string): number {
  const value = evaluateItem(latex)
  if (value === null) throw new Error(`Invalid reference value: ${latex}`)
  return value
}

export function uniqueValues(values: readonly number[]): number[] {
  return values.reduce<number[]>((acc, v) => (acc.some((a) => exactClose(a, v)) ? acc : [...acc, v]), [])
}
