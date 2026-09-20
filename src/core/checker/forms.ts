import { evalReal, operandsOf, operatorOf, unknowns, type Expr } from './ce'

const isSum = (e: Expr): boolean => operatorOf(e) === 'Add' || operatorOf(e) === 'Subtract'
const isPowerOfSum = (e: Expr): boolean => operatorOf(e) === 'Power' && isSum(operandsOf(e)[0])
const unwrapNegate = (e: Expr): Expr => (operatorOf(e) === 'Negate' ? operandsOf(e)[0] : e)

/** A product containing a sum factor, or a power of a sum: 3x(x−2), (x−1)², −(x−2)(x+3). */
export function isFactored(expr: Expr): boolean {
  const e = unwrapNegate(expr)
  if (isPowerOfSum(e)) return true
  return operatorOf(e) === 'Multiply' && operandsOf(e).some((f) => isSum(f) || isPowerOfSum(f))
}

/** No product or power of a sum anywhere in the tree. */
export function isExpanded(expr: Expr): boolean {
  const op = operatorOf(expr)
  const ops = operandsOf(expr)
  if ((op === 'Multiply' || op === 'Negate') && ops.some(isSum)) return false
  if (isPowerOfSum(expr)) return false
  return ops.every(isExpanded)
}

function factorWeight(f: Expr): number {
  if (unknowns(f).length === 0) return 0
  if (operatorOf(f) === 'Power') {
    const exponent = evalReal(operandsOf(f)[1])
    return exponent !== null && Number.isInteger(exponent) && exponent > 0 ? exponent : 1
  }
  return 1
}

/** Non-constant factors counted with multiplicity: 3x(x−2) → 2, (x−1)²(x+2) → 3. */
export function factorCount(expr: Expr): number {
  const e = unwrapNegate(expr)
  const factors = operatorOf(e) === 'Multiply' ? operandsOf(e) : [e]
  return factors.reduce((sum, f) => sum + factorWeight(f), 0)
}
