import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'
import { mathSegments } from '../testing'
import { TIERS } from '../types'

// A rearranged formula is right when it puts the original relationship back together: pick values for
// every other variable, compute the target from the answer, and the formula must balance.

const SEEDS = 60
const DEFAULT_RANGE: readonly [number, number] = [1, 5]

function evaluate(latex: string, vars: Record<string, number>): number {
  const expr = parseLatex(latex)
  const v = expr && evalReal(expr, vars)
  if (v === null || v === undefined) throw new Error(`cannot evaluate "${latex}" at ${JSON.stringify(vars)}`)
  return v
}

describe('rearrange', () => {
  it.each(TIERS)('tier %i: the answer balances the original formula', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('rearrange').generate(createRng(seed), tier)
      const label = `seed ${seed}: ${p.statement}`
      if (p.answer.kind !== 'expression') throw new Error(`${label}: expected an expression`)
      const formula = mathSegments(p.statement).find((seg) => seg.includes('='))
      const target = p.statement.match(/(?:solve for|make|express [a-z ]*?)\s*\$([^$]+)\$/i)?.[1]
      if (!formula || !target) throw new Error(`unrecognised statement: ${label}`)
      const [lhs, rhs] = formula.split('=')
      const { variables, domain, value: answer } = p.answer
      ;[0.2, 0.5, 0.8].forEach((k) => {
        const vars = Object.fromEntries(
          variables.map((v) => {
            const [lo, hi] = domain?.[v] ?? DEFAULT_RANGE
            return [v, lo + k * (hi - lo)]
          }),
        )
        const value = evaluate(answer, vars)
        // "Solve for V^2" names a square: the variable itself is its root.
        const squared = target.match(/^(.+)\^2$/)
        const full = squared ? { ...vars, [squared[1]]: Math.sqrt(value) } : { ...vars, [target]: value }
        const gap = evaluate(lhs, full) - evaluate(rhs, full)
        expect(Math.abs(gap) / Math.max(1, Math.abs(evaluate(lhs, full))), `${label} at ${JSON.stringify(full)}`).toBeLessThan(1e-9)
      })
    }
  })
})
