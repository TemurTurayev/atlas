import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'

const SEEDS = 60

function numberValue(latex: string): number {
  const expr = parseLatex(latex)
  const v = expr && evalReal(expr)
  if (v === null || v === undefined) throw new Error(`cannot evaluate "${latex}"`)
  return v
}

function matchOrThrow(statement: string, re: RegExp): RegExpMatchArray {
  const m = statement.match(re)
  if (!m) throw new Error(`statement did not match ${re}: ${statement}`)
  return m
}

describe('std_error', () => {
  it('tier 1: SE calculation, SE scaling, sampling distribution SD', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('std_error').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/calculate the standard error of the mean/i.test(p.statement)) {
        const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
        const n = Number(matchOrThrow(p.statement, /n = ([-0-9.]+)/)[1])
        const expected = sigma / Math.sqrt(n)
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 4)
      } else if (/what is the new standard error/i.test(p.statement)) {
        const n1 = Number(matchOrThrow(p.statement, /n_1 = ([-0-9.]+)/)[1])
        const se1 = Number(matchOrThrow(p.statement, /\\text\{SE\}_1 = ([-0-9.]+)/)[1])
        const n2 = Number(matchOrThrow(p.statement, /n_2 = ([-0-9.]+)/)[1])
        const expected = se1 / Math.sqrt(n2 / n1)
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 4)
      } else if (/standard deviation of the sampling distribution/i.test(p.statement)) {
        const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
        const n = Number(matchOrThrow(p.statement, /n = ([-0-9.]+)/)[1])
        const expected = sigma / Math.sqrt(n)
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 4)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: z-score for sample mean, required n, solve xbar', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('std_error').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/Calculate the \$?z\$?-score/i.test(p.statement)) {
        const mu = Number(matchOrThrow(p.statement, /\\mu = ([-0-9.]+)/)[1])
        const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
        const n = Number(matchOrThrow(p.statement, /n = ([-0-9.]+)/)[1])
        const xbar = Number(matchOrThrow(p.statement, /\\bar\{x\} = ([-0-9.]+)/)[1])
        const se = sigma / Math.sqrt(n)
        const expected = (xbar - mu) / se
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 4)
      } else if (/minimum sample size/i.test(p.statement)) {
        const targetE = Number(matchOrThrow(p.statement, /E = ([-0-9.]+)/)[1])
        const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
        const expected = Math.round(Math.pow(sigma / targetE, 2))
        expect(val, `seed ${seed}`).toBe(expected)
      } else if (/Find the sample mean/i.test(p.statement)) {
        const mu = Number(matchOrThrow(p.statement, /\\mu = ([-0-9.]+)/)[1])
        const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
        const n = Number(matchOrThrow(p.statement, /n = ([-0-9.]+)/)[1])
        const z = Number(matchOrThrow(p.statement, /z = ([-0-9.]+)/)[1])
        const se = sigma / Math.sqrt(n)
        const expected = mu + z * se
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 4)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: clinical SE comparison, CLT probability, CLT choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('std_error').generate(createRng(seed), 3)

      if (p.answer.kind === 'choice') {
        const ans = p.answer
        expect(typeof ans.correctId, `seed ${seed}`).toBe('string')
        expect(ans.options.some((o) => o.id === ans.correctId), `seed ${seed}`).toBe(true)
      } else if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)
        if (/exceed that of Group A/i.test(p.statement)) {
          const n1 = Number(matchOrThrow(p.statement, /n_1 = ([-0-9.]+)/)[1])
          const sigma1 = Number(matchOrThrow(p.statement, /\\sigma_1 = ([-0-9.]+)/)[1])
          const n2 = Number(matchOrThrow(p.statement, /n_2 = ([-0-9.]+)/)[1])
          const sigma2 = Number(matchOrThrow(p.statement, /\\sigma_2 = ([-0-9.]+)/)[1])
          const se1 = sigma1 / Math.sqrt(n1)
          const se2 = sigma2 / Math.sqrt(n2)
          expect(val, `seed ${seed}`).toBeCloseTo(se2 - se1, 4)
        } else if (/empirical rule/i.test(p.statement)) {
          expect([0.16, 0.025, 0.0015, 0.68, 0.95, 0.997], `seed ${seed}`).toContain(val)
        } else {
          throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
        }
      }
    }
  })
})

describe('conf_interval', () => {
  it('tier 1: margin of error, bound, width', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('conf_interval').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/compute the margin of error/i.test(p.statement)) {
        const n = Number(matchOrThrow(p.statement, /n = ([-0-9.]+)/)[1])
        const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
        const z = Number(matchOrThrow(p.statement, /z_\{\\text\{crit\}\} = ([-0-9.]+)/)[1])
        const expected = z * (sigma / Math.sqrt(n))
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 3)
      } else if (/find the (upper|lower) bound/i.test(p.statement)) {
        const n = Number(matchOrThrow(p.statement, /n = ([-0-9.]+)/)[1])
        const xbar = Number(matchOrThrow(p.statement, /\\bar\{x\} = ([-0-9.]+)/)[1])
        const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
        const z = Number(matchOrThrow(p.statement, /z_\{\\text\{crit\}\} = ([-0-9.]+)/)[1])
        const isUpper = /upper bound/i.test(p.statement)
        const E = z * (sigma / Math.sqrt(n))
        const expected = isUpper ? xbar + E : xbar - E
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 3)
      } else if (/calculate the total width/i.test(p.statement)) {
        const n = Number(matchOrThrow(p.statement, /n = ([-0-9.]+)/)[1])
        const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
        const z = Number(matchOrThrow(p.statement, /z_\{\\text\{crit\}\} = ([-0-9.]+)/)[1])
        const E = z * (sigma / Math.sqrt(n))
        expect(val, `seed ${seed}`).toBeCloseTo(2 * E, 3)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: sample size for margin, infer mean/margin, scale width', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('conf_interval').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/calculate the required minimum sample size/i.test(p.statement)) {
        const z = Number(matchOrThrow(p.statement, /z_\{\\text\{crit\}\} = ([-0-9.]+)/)[1])
        const E = Number(matchOrThrow(p.statement, /E = ([-0-9.]+)/)[1])
        const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
        const expected = Math.round(Math.pow((z * sigma) / E, 2))
        expect(val, `seed ${seed}`).toBe(expected)
      } else if (/Find the sample mean/i.test(p.statement)) {
        const bounds = matchOrThrow(p.statement, /\[([-0-9.]+),\s*([-0-9.]+)\]/)
        const L = Number(bounds[1])
        const U = Number(bounds[2])
        expect(val, `seed ${seed}`).toBeCloseTo((L + U) / 2, 3)
      } else if (/Find the margin of error/i.test(p.statement)) {
        const bounds = matchOrThrow(p.statement, /\[([-0-9.]+),\s*([-0-9.]+)\]/)
        const L = Number(bounds[1])
        const U = Number(bounds[2])
        expect(val, `seed ${seed}`).toBeCloseTo((U - L) / 2, 3)
      } else if (/by what factor is the margin of error/i.test(p.statement)) {
        const nFactor = Number(matchOrThrow(p.statement, /k\^2 = ([-0-9.]+)/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(1 / Math.sqrt(nFactor), 3)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: clinical CI limit, sample planning, CI concept choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('conf_interval').generate(createRng(seed), 3)

      if (p.answer.kind === 'choice') {
        const ans = p.answer
        expect(typeof ans.correctId, `seed ${seed}`).toBe('string')
        expect(ans.options.some((o) => o.id === ans.correctId), `seed ${seed}`).toBe(true)
      } else if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)
        if (/calculate the lower limit/i.test(p.statement)) {
          const n = Number(matchOrThrow(p.statement, /n = ([-0-9.]+)/)[1])
          const xbar = Number(matchOrThrow(p.statement, /\\bar\{x\} = ([-0-9.]+)/)[1])
          const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
          const z = Number(matchOrThrow(p.statement, /z_\{\\text\{crit\}\} = ([-0-9.]+)/)[1])
          const E = z * (sigma / Math.sqrt(n))
          expect(val, `seed ${seed}`).toBeCloseTo(xbar - E, 3)
        } else if (/what is the required sample size/i.test(p.statement)) {
          const z = Number(matchOrThrow(p.statement, /z_\{\\text\{crit\}\} = ([-0-9.]+)/)[1])
          const E = Number(matchOrThrow(p.statement, /E = ([-0-9.]+)/)[1])
          const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
          const expected = Math.round(Math.pow((z * sigma) / E, 2))
          expect(val, `seed ${seed}`).toBe(expected)
        } else {
          throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
        }
      }
    }
  })
})

describe('hypothesis_logic', () => {
  it('tier 1: p-val decision, power/beta calc, type 1 prob', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('hypothesis_logic').generate(createRng(seed), 1)

      if (p.answer.kind === 'choice') {
        const ans = p.answer
        expect(typeof ans.correctId, `seed ${seed}`).toBe('string')
        expect(ans.options.some((o) => o.id === ans.correctId), `seed ${seed}`).toBe(true)

        const pVal = Number(matchOrThrow(p.statement, /p\\text\{-value\} = ([-0-9.]+)/)[1])
        const alpha = Number(matchOrThrow(p.statement, /\\alpha = ([-0-9.]+)/)[1])
        const expectedId = pVal <= alpha ? 'reject_null' : 'fail_to_reject_null'
        expect(ans.correctId, `seed ${seed}`).toBe(expectedId)
      } else if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)
        if (/Calculate the probability of a Type II error/i.test(p.statement)) {
          const power = Number(matchOrThrow(p.statement, /\((0\.[0-9]+)\)/)[1])
          expect(val, `seed ${seed}`).toBeCloseTo(1 - power, 3)
        } else if (/Calculate the statistical power/i.test(p.statement)) {
          const beta = Number(matchOrThrow(p.statement, /\\beta = (0\.[0-9]+)/)[1])
          expect(val, `seed ${seed}`).toBeCloseTo(1 - beta, 3)
        } else if (/probability of committing a Type I error/i.test(p.statement)) {
          const alpha = Number(matchOrThrow(p.statement, /\\alpha = (0\.[0-9]+)/)[1])
          expect(val, `seed ${seed}`).toBeCloseTo(alpha, 3)
        } else {
          throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
        }
      }
    }
  })

  it('tier 2: formulate hypotheses, identify error, Bonferroni adjustment, alpha/beta def', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('hypothesis_logic').generate(createRng(seed), 2)

      if (p.answer.kind === 'choice') {
        const ans = p.answer
        expect(typeof ans.correctId, `seed ${seed}`).toBe('string')
        expect(ans.options.some((o) => o.id === ans.correctId), `seed ${seed}`).toBe(true)
      } else if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)
        if (/adjusted significance level per test/i.test(p.statement)) {
          const m = Number(matchOrThrow(p.statement, /m = ([-0-9.]+)/)[1])
          const alpha = Number(matchOrThrow(p.statement, /\\alpha_{\\text\{overall\}\} = ([-0-9.]+)/)[1])
          expect(val, `seed ${seed}`).toBeCloseTo(alpha / m, 4)
        } else {
          throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
        }
      }
    }
  })

  it('tier 3: p-val definition, clinical trial decision, power tradeoff choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('hypothesis_logic').generate(createRng(seed), 3)

      if (p.answer.kind === 'choice') {
        const ans = p.answer
        expect(typeof ans.correctId, `seed ${seed}`).toBe('string')
        expect(ans.options.some((o) => o.id === ans.correctId), `seed ${seed}`).toBe(true)
      } else {
        throw new Error(`seed ${seed}: expected choice answer`)
      }
    }
  })
})

describe('z_t_test', () => {
  it('tier 1: z statistic, t statistic, degrees of freedom', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('z_t_test').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/\$?z\$?-test statistic/i.test(p.statement)) {
        const mu0 = Number(matchOrThrow(p.statement, /H_0: \\mu = ([-0-9.]+)/)[1])
        const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
        const n = Number(matchOrThrow(p.statement, /n = ([-0-9.]+)/)[1])
        const xbar = Number(matchOrThrow(p.statement, /\\bar\{x\} = ([-0-9.]+)/)[1])
        const se = sigma / Math.sqrt(n)
        const expected = (xbar - mu0) / se
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 4)
      } else if (/\$?t\$?-test statistic/i.test(p.statement)) {
        const mu0 = Number(matchOrThrow(p.statement, /H_0: \\mu = ([-0-9.]+)/)[1])
        const n = Number(matchOrThrow(p.statement, /n = ([-0-9.]+)/)[1])
        const xbar = Number(matchOrThrow(p.statement, /\\bar\{x\} = ([-0-9.]+)/)[1])
        const s = Number(matchOrThrow(p.statement, /s = ([-0-9.]+)/)[1])
        const se = s / Math.sqrt(n)
        const expected = (xbar - mu0) / se
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 4)
      } else if (/degrees of freedom/i.test(p.statement)) {
        const n = Number(matchOrThrow(p.statement, /n = ([-0-9.]+)/)[1])
        expect(val, `seed ${seed}`).toBe(n - 1)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: z-test decision, t-test decision, z vs t choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('z_t_test').generate(createRng(seed), 2)

      if (p.answer.kind === 'choice') {
        const ans = p.answer
        expect(typeof ans.correctId, `seed ${seed}`).toBe('string')
        expect(ans.options.some((o) => o.id === ans.correctId), `seed ${seed}`).toBe(true)

        if (/test statistic z =/i.test(p.statement)) {
          const z = Number(matchOrThrow(p.statement, /test statistic z = ([-0-9.]+)/)[1])
          const zCrit = Number(matchOrThrow(p.statement, /z_\{\\text\{crit\}\} = ([-0-9.]+)/)[1])
          const expectedId = Math.abs(z) > zCrit ? 'reject_null' : 'fail_to_reject_null'
          expect(ans.correctId, `seed ${seed}`).toBe(expectedId)
        } else if (/t_\{\\text\{0\.975/i.test(p.statement)) {
          const xbar = Number(matchOrThrow(p.statement, /\\bar\{x\} = ([-0-9.]+)/)[1])
          const mu0 = Number(matchOrThrow(p.statement, /H_0: \\mu = ([-0-9.]+)/)[1])
          const s = Number(matchOrThrow(p.statement, /s = ([-0-9.]+)/)[1])
          const n = Number(matchOrThrow(p.statement, /n = ([-0-9.]+)/)[1])
          const tCrit = Number(matchOrThrow(p.statement, /t_\{0\.975,\s*\d+\} = ([-0-9.]+)/)[1])
          const tStat = (xbar - mu0) / (s / Math.sqrt(n))
          const expectedId = Math.abs(tStat) > tCrit ? 'reject_null' : 'fail_to_reject_null'
          expect(ans.correctId, `seed ${seed}`).toBe(expectedId)
        }
      } else {
        throw new Error(`seed ${seed}: expected choice answer`)
      }
    }
  })

  it('tier 3: clinical t-test calc, clinical test decision, t-distribution choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('z_t_test').generate(createRng(seed), 3)

      if (p.answer.kind === 'choice') {
        const ans = p.answer
        expect(typeof ans.correctId, `seed ${seed}`).toBe('string')
        expect(ans.options.some((o) => o.id === ans.correctId), `seed ${seed}`).toBe(true)
      } else if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)
        const xbar = Number(matchOrThrow(p.statement, /\\bar\{x\} = ([-0-9.]+)/)[1])
        const mu0 = Number(matchOrThrow(p.statement, /H_0: \\mu = ([-0-9.]+)/)[1])
        const s = Number(matchOrThrow(p.statement, /s = ([-0-9.]+)/)[1])
        const n = Number(matchOrThrow(p.statement, /n = ([-0-9.]+)/)[1])
        const se = s / Math.sqrt(n)
        const expected = (xbar - mu0) / se
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 4)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })
})
