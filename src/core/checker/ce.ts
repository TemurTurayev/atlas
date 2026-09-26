import { ComputeEngine, isFunction, type Expression } from '@cortex-js/compute-engine'

const engine = new ComputeEngine()

/** Boxed expression. In 0.131.3 `parse` is overloaded, so ReturnType would pick the nullable overload. */
export type Expr = Expression

/** Canonical parse; null for empty or invalid LaTeX. */
export function parseLatex(latex: string): Expr | null {
  if (latex.trim() === '') return null
  try {
    const expr = engine.parse(latex)
    return expr.isValid ? expr : null
  } catch {
    return null
  }
}

/** Real numeric value with variables substituted; null when undefined, infinite or complex. */
export function evalReal(expr: Expr, vars: Readonly<Record<string, number>> = {}): number | null {
  try {
    const target = Object.keys(vars).length > 0 ? expr.subs(vars) : expr
    const value = target.N()
    const re = value.re
    const im = value.im
    if (typeof re !== 'number' || !Number.isFinite(re)) return null
    if (typeof im === 'number' && Math.abs(im) > 1e-9 * Math.max(1, Math.abs(re))) return null
    return re
  } catch {
    return null
  }
}

/** Complex numeric value (a + bi); null when undefined or infinite. */
export function evalComplex(expr: Expr): { readonly re: number; readonly im: number } | null {
  try {
    const value = expr.N()
    const re = value.re
    const im = typeof value.im === 'number' ? value.im : 0
    if (typeof re !== 'number' || !Number.isFinite(re) || !Number.isFinite(im)) return null
    return { re, im }
  } catch {
    return null
  }
}

export const unknowns = (expr: Expr): readonly string[] => expr.unknowns ?? []
export const operatorOf = (expr: Expr): string => expr.operator
/** Operands of a function expression; `ops` only exists after narrowing with `isFunction` in 0.131.3. */
export const operandsOf = (expr: Expr): readonly Expr[] => (isFunction(expr) ? expr.ops : [])
