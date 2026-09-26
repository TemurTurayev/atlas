import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'

const SEEDS = 30

/** Numeric value of a LaTeX expression at a point (or with no variables at all). */
function evaluate(latex: string, vars: Record<string, number> = {}): number {
  const e = parseLatex(latex)
  const v = e && evalReal(e, vars)
  if (v === null || v === undefined) throw new Error(`cannot evaluate "${latex}" at ${JSON.stringify(vars)}`)
  return v
}

/** A central-difference approximation of f'(x) — independent of any symbolic differentiation rule. */
function numericDerivative(latex: string, x: number, h = 1e-4): number {
  return (evaluate(latex, { x: x + h }) - evaluate(latex, { x: x - h })) / (2 * h)
}

/** The LaTeX right after "f(x) = " up to the next "$" — the function every problem states. */
function extractF(statement: string): string {
  const m = statement.match(/f\(x\) = (.+?)\$/)
  if (!m) throw new Error(`no "f(x) = ...$" found in: ${statement}`)
  return m[1]
}

function requireMatch(text: string, re: RegExp): RegExpMatchArray {
  const m = text.match(re)
  if (!m) throw new Error(`pattern ${re} did not match: ${text}`)
  return m
}

describe('derivative_def', () => {
  it('tier 1: the secant slope matches (f(b)-f(a))/(b-a) computed from the stated function', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('derivative_def').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const fLatex = extractF(p.statement)
      const m = requireMatch(p.statement, /x=(-?\d+)\$ and \$x=(-?\d+)\$/)
      const [xa, xb] = m.slice(1).map(Number)
      const expected = (evaluate(fLatex, { x: xb }) - evaluate(fLatex, { x: xa })) / (xb - xa)
      expect(Number(p.answer.value), `seed ${seed}`).toBeCloseTo(expected, 9)
    }
  })

  it('tier 2: f\'(a) matches a central difference of the stated function at the stated point', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('derivative_def').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const fLatex = extractF(p.statement)
      const a = Number(requireMatch(p.statement, /f'\((-?\d+)\)/)[1])
      const expected = numericDerivative(fLatex, a)
      expect(Number(p.answer.value), `seed ${seed}`).toBeCloseTo(expected, 4)
    }
  })

  it('tier 3: the tangent line (or f\'(a)) matches a central difference of the stated function', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('derivative_def').generate(createRng(seed), 3)
      const fLatex = extractF(p.statement)

      if (p.answer.kind === 'vector') {
        const a = Number(requireMatch(p.statement, /at \$x=(-?\d+)\$/)[1])
        const expectedM = numericDerivative(fLatex, a)
        const expectedC = evaluate(fLatex, { x: a }) - expectedM * a
        expect(Number(p.answer.components[0]), `seed ${seed}: slope`).toBeCloseTo(expectedM, 4)
        expect(Number(p.answer.components[1]), `seed ${seed}: intercept`).toBeCloseTo(expectedC, 4)
      } else if (p.answer.kind === 'number') {
        const a = Number(requireMatch(p.statement, /f'\((-?\d+)\)/)[1])
        const expected = numericDerivative(fLatex, a)
        expect(evaluate(p.answer.value), `seed ${seed}`).toBeCloseTo(expected, 4)
      } else {
        throw new Error('expected number or vector')
      }
    }
  })
})

describe('diff_rules', () => {
  const SAMPLE_X = [-2.3, -1.1, 0.7, 1.4, 2.6]
  const SAMPLE_X_POSITIVE = [0.6, 1.1, 1.7, 2.3, 2.9]

  it('tier 1: the derivative expression matches a central difference of the stated polynomial', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('diff_rules').generate(createRng(seed), 1)
      const answer = p.answer
      if (answer.kind !== 'expression') throw new Error('expected expression')
      const fLatex = extractF(p.statement)
      SAMPLE_X.forEach((x) => {
        const expected = numericDerivative(fLatex, x)
        expect(evaluate(answer.value, { x }), `seed ${seed} at x=${x}`).toBeCloseTo(expected, 3)
      })
    }
  })

  it('tier 2: the derivative expression matches a central difference of the stated sum', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('diff_rules').generate(createRng(seed), 2)
      const answer = p.answer
      if (answer.kind !== 'expression') throw new Error('expected expression')
      const fLatex = extractF(p.statement)
      SAMPLE_X_POSITIVE.forEach((x) => {
        const expected = numericDerivative(fLatex, x)
        expect(evaluate(answer.value, { x }), `seed ${seed} at x=${x}`).toBeCloseTo(expected, 3)
      })
    }
  })

  it('tier 3: the rewritten derivative matches a central difference of the stated function', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('diff_rules').generate(createRng(seed), 3)
      const answer = p.answer
      const fLatex = extractF(p.statement)

      if (answer.kind === 'expression') {
        SAMPLE_X_POSITIVE.forEach((x) => {
          const expected = numericDerivative(fLatex, x)
          expect(evaluate(answer.value, { x }), `seed ${seed} at x=${x}`).toBeCloseTo(expected, 3)
        })
      } else if (answer.kind === 'number') {
        const a = Number(requireMatch(p.statement, /f'\((-?\d+)\)/)[1])
        const expected = numericDerivative(fLatex, a)
        expect(evaluate(answer.value), `seed ${seed}`).toBeCloseTo(expected, 3)
      } else {
        throw new Error('expected number or expression')
      }
    }
  })
})
