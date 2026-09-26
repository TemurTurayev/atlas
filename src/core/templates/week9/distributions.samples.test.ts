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

function fact(n: number): number {
  let res = 1
  for (let i = 2; i <= n; i += 1) res *= i
  return res
}

function nCr(n: number, r: number): number {
  return fact(n) / (fact(r) * fact(n - r))
}

function parsePoiVal(valStr: string): number {
  if (valStr.startsWith('1 - e^{-')) {
    const l = Number(matchOrThrow(valStr, /^1 - e\^\{-(\d+)\}$/)[1])
    return 1 - Math.exp(-l)
  }

  const mSimple = valStr.match(/^e\^\{-(\d+)\}$/)
  if (mSimple) return Math.exp(-Number(mSimple[1]))

  const mCoef = valStr.match(/^(\d+)e\^\{-(\d+)\}$/)
  if (mCoef) return Number(mCoef[1]) * Math.exp(-Number(mCoef[2]))

  const mFrac = valStr.match(/^\\frac\{(\d+)\}\{(\d+)\}e\^\{-(\d+)\}$/)
  if (mFrac) return (Number(mFrac[1]) / Number(mFrac[2])) * Math.exp(-Number(mFrac[3]))

  throw new Error(`cannot parse Poisson answer format "${valStr}"`)
}

describe('binomial_poisson', () => {
  it('tier 1: basic Binomial & Poisson formulas', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('binomial_poisson').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/Find \$P\(X = \d+\)\$/.test(p.statement)) {
        const n = Number(matchOrThrow(p.statement, /Bin\}?\((\d+),/)[1])
        const pTex = matchOrThrow(p.statement, /Bin\}?\(\d+,\s*([^)]+)\)/)[1]
        const pVal = numberValue(pTex)
        const k = Number(matchOrThrow(p.statement, /Find \$P\(X = (\d+)\)\$/)[1])
        const expected = nCr(n, k) * (pVal ** k) * ((1 - pVal) ** (n - k))
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 5)
      } else if (/expected value/.test(p.statement) && /Bin/.test(p.statement)) {
        const n = Number(matchOrThrow(p.statement, /Bin\}?\((\d+),/)[1])
        const pTex = matchOrThrow(p.statement, /Bin\}?\(\d+,\s*([^)]+)\)/)[1]
        const pVal = numberValue(pTex)
        expect(val, `seed ${seed}`).toBeCloseTo(n * pVal, 5)
      } else if (/variance/.test(p.statement) && /Bin/.test(p.statement)) {
        const n = Number(matchOrThrow(p.statement, /Bin\}?\((\d+),/)[1])
        const pTex = matchOrThrow(p.statement, /Bin\}?\(\d+,\s*([^)]+)\)/)[1]
        const pVal = numberValue(pTex)
        expect(val, `seed ${seed}`).toBeCloseTo(n * pVal * (1 - pVal), 5)
      } else if (/Poi/.test(p.statement)) {
        const l = Number(matchOrThrow(p.statement, /Poi\}?\((\d+)\)/)[1])
        expect(val, `seed ${seed}`).toBe(l)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: exact Poisson probs & at least one complement', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('binomial_poisson').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)

      if (/P\(X = \d+\)/.test(p.statement)) {
        const l = Number(matchOrThrow(p.statement, /Poi\}?\((\d+)\)/)[1])
        const k = Number(matchOrThrow(p.statement, /P\(X = (\d+)\)/)[1])
        const val = parsePoiVal(p.answer.value)
        const expected = (l ** k * Math.exp(-l)) / fact(k)
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 5)
      } else if (/experiment with success probability/.test(p.statement)) {
        const pTex = matchOrThrow(p.statement, /p = (.*?)\$/)[1]
        const pVal = numberValue(pTex)
        const n = Number(matchOrThrow(p.statement, /n = (\d+)\$/)[1])
        const val = numberValue(p.answer.value)
        const expected = 1 - (1 - pVal) ** n
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 5)
      } else if (/at least one event/.test(p.statement)) {
        const l = Number(matchOrThrow(p.statement, /Poi\}?\((\d+)\)/)[1])
        const val = parsePoiVal(p.answer.value)
        const expected = 1 - Math.exp(-l)
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 5)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: word problems & conceptual choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('binomial_poisson').generate(createRng(seed), 3)

      if (p.answer.kind === 'choice') {
        const ans = p.answer
        expect(typeof ans.correctId, `seed ${seed}`).toBe('string')
        expect(ans.options.some((o) => o.id === ans.correctId), `seed ${seed}`).toBe(true)
      } else if (p.answer.kind === 'number') {
        if (/clinical trial|quality control|medical study|agricultural trial|archery test/i.test(p.statement)) {
          const pTex = matchOrThrow(p.statement, /p = (.*?)\$/)[1]
          const pVal = numberValue(pTex)
          const n = Number(matchOrThrow(p.statement, /n = (\d+)\$/)[1])
          const k = Number(matchOrThrow(p.statement, /k = (\d+)\$/)[1])
          const val = numberValue(p.answer.value)
          const expected = nCr(n, k) * (pVal ** k) * ((1 - pVal) ** (n - k))
          expect(val, `seed ${seed}`).toBeCloseTo(expected, 5)
        } else if (/emergency ward|support desk|web server|monitoring station|observatory/i.test(p.statement)) {
          const l = Number(matchOrThrow(p.statement, /\\lambda = (\d+)/)[1])
          const k = Number(matchOrThrow(p.statement, /P\(X = (\d+)\)/)[1])
          const val = parsePoiVal(p.answer.value)
          const expected = (l ** k * Math.exp(-l)) / fact(k)
          expect(val, `seed ${seed}`).toBeCloseTo(expected, 5)
        } else {
          throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
        }
      }
    }
  })
})

describe('normal_dist', () => {
  it('tier 1: z-score, x from z, and empirical rule', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('normal_dist').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = Number(p.answer.value)

      if (/Find the \$?z\$-score/i.test(p.statement)) {
        const mu = Number(matchOrThrow(p.statement, /\\mu = ([-0-9.]+)/)[1])
        const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
        const x = Number(matchOrThrow(p.statement, /x = ([-0-9.]+)/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo((x - mu) / sigma, 5)
      } else if (/corresponding to a \$?z\$-score/i.test(p.statement)) {
        const mu = Number(matchOrThrow(p.statement, /\\mu = ([-0-9.]+)/)[1])
        const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
        const z = Number(matchOrThrow(p.statement, /z = ([-0-9.]+)/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(mu + z * sigma, 5)
      } else if (/68–95–99\.7 rule|P\(X/i.test(p.statement)) {
        expect([0.5, 0.68, 0.95, 0.997, 0.16, 0.025], `seed ${seed}`).toContain(val)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: compare z, empirical tail probs, scaled sum dist', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('normal_dist').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = Number(p.answer.value)

      if (/Patient A scores/.test(p.statement)) {
        const x1 = Number(matchOrThrow(p.statement, /x_1 = ([-0-9.]+)/)[1])
        const m1 = Number(matchOrThrow(p.statement, /\\mu_1 = ([-0-9.]+)/)[1])
        const s1 = Number(matchOrThrow(p.statement, /\\sigma_1 = ([-0-9.]+)/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo((x1 - m1) / s1, 5)
      } else if (/68–95–99\.7 rule|rule to find/i.test(p.statement)) {
        expect([0.84, 0.975, 0.815], `seed ${seed}`).toContain(val)
      } else if (/linear transformation is defined by/.test(p.statement)) {
        const mu = Number(matchOrThrow(p.statement, /\\mathcal\{N\}\(([-0-9.]+),/)[1])
        const sigma = Number(matchOrThrow(p.statement, /([0-9.]+)\^2\)/)[1])
        const a = Number(matchOrThrow(p.statement, /Y = ([0-9]+)X/)[1])
        if (/mean of/i.test(p.statement)) {
          const mB = p.statement.match(/X \+ ([0-9]+)/)
          const b = mB ? Number(mB[1]) : 0
          expect(val, `seed ${seed}`).toBeCloseTo(a * mu + b, 5)
        } else {
          expect(val, `seed ${seed}`).toBeCloseTo(a * sigma, 5)
        }
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: clinical screening, solve sigma/mu, conceptual choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('normal_dist').generate(createRng(seed), 3)

      if (p.answer.kind === 'choice') {
        const ans = p.answer
        expect(typeof ans.correctId, `seed ${seed}`).toBe('string')
        expect(ans.options.some((o) => o.id === ans.correctId), `seed ${seed}`).toBe(true)
      } else if (p.answer.kind === 'number') {
        if (/high risk/.test(p.statement)) {
          const val = Number(p.answer.value)
          expect([0.16, 0.025], `seed ${seed}`).toContain(val)
        } else if (/Find the standard deviation/.test(p.statement)) {
          const x = Number(matchOrThrow(p.statement, /x = ([-0-9.]+)/)[1])
          const z = Number(matchOrThrow(p.statement, /z = ([-0-9.]+)/)[1])
          const mu = Number(matchOrThrow(p.statement, /\\mu = ([-0-9.]+)/)[1])
          const val = Number(p.answer.value)
          expect(val, `seed ${seed}`).toBeCloseTo((x - mu) / z, 5)
        } else if (/Find the mean/.test(p.statement)) {
          const x = Number(matchOrThrow(p.statement, /x = ([-0-9.]+)/)[1])
          const z = Number(matchOrThrow(p.statement, /z = ([-0-9.]+)/)[1])
          const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
          const val = Number(p.answer.value)
          expect(val, `seed ${seed}`).toBeCloseTo(x - z * sigma, 5)
        } else {
          throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
        }
      }
    }
  })
})

describe('normal_quantiles', () => {
  it('tier 1: quantile given z, empirical interval & percentile', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('normal_quantiles').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = Number(p.answer.value)

      if (/find the .* quantile/.test(p.statement)) {
        const mu = Number(matchOrThrow(p.statement, /\\mu = ([-0-9.]+)/)[1])
        const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
        const z = Number(matchOrThrow(p.statement, /z_\{[0-9.]+\} = ([-0-9.]+)/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(mu + z * sigma, 3)
      } else if (/upper bound of the symmetric interval/.test(p.statement)) {
        const mu = Number(matchOrThrow(p.statement, /\\mu = ([-0-9.]+)/)[1])
        const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
        const pct = Number(matchOrThrow(p.statement, /containing \$?([0-9.]+)\\%/)[1])
        const k = pct === 68 ? 1 : pct === 95 ? 2 : 3
        expect(val, `seed ${seed}`).toBeCloseTo(mu + k * sigma, 3)
      } else if (/at the .*th percentile/.test(p.statement)) {
        const mu = Number(matchOrThrow(p.statement, /\\mu = ([-0-9.]+)/)[1])
        const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
        const percentile = Number(matchOrThrow(p.statement, /at the \$?([0-9.]+)\$?th percentile/)[1])
        const delta = percentile === 84 ? sigma : percentile === 16 ? -sigma : percentile === 97.5 ? 2 * sigma : -2 * sigma
        expect(val, `seed ${seed}`).toBeCloseTo(mu + delta, 3)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: 95% central interval, lower tail & solve mu/sigma', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('normal_quantiles').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = Number(p.answer.value)

      if (/95% symmetric central interval/.test(p.statement)) {
        const mu = Number(matchOrThrow(p.statement, /\\mathcal\{N\}\(([-0-9.]+),/)[1])
        const sigma = Number(matchOrThrow(p.statement, /([0-9.]+)\^2\)/)[1])
        if (/lower bound/.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(mu - 1.96 * sigma, 3)
        } else if (/upper bound/.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(mu + 1.96 * sigma, 3)
        } else {
          expect(val, `seed ${seed}`).toBeCloseTo(2 * 1.96 * sigma, 3)
        }
      } else if (/percentile \$x_/.test(p.statement)) {
        const mNorm = p.statement.match(/\\mathcal\{N\}\(([-0-9.]+),\s*([0-9.]+)\^2\)/)
        const mu = mNorm ? Number(mNorm[1]) : Number(matchOrThrow(p.statement, /\\mu = ([-0-9.]+)/)[1])
        const sigma = mNorm ? Number(mNorm[2]) : Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
        const z = Number(matchOrThrow(p.statement, /z_\{[0-9.]+\} = ([-0-9.]+)/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(mu - z * sigma, 3)
      } else if (/find the mean/i.test(p.statement)) {
        const x = Number(matchOrThrow(p.statement, /x = ([-0-9.]+)/)[1])
        const sigma = Number(matchOrThrow(p.statement, /\\mathcal\{N\}\(\\mu, ([0-9.]+)\^2\)/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(x - 1.96 * sigma, 3)
      } else if (/find the standard deviation/i.test(p.statement)) {
        const x = Number(matchOrThrow(p.statement, /x = ([-0-9.]+)/)[1])
        const mu = Number(matchOrThrow(p.statement, /\\mathcal\{N\}\(([-0-9.]+),/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo((x - mu) / 1.96, 3)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: clinical reference range, percentile rank & choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('normal_quantiles').generate(createRng(seed), 3)

      if (p.answer.kind === 'choice') {
        const ans = p.answer
        expect(typeof ans.correctId, `seed ${seed}`).toBe('string')
        expect(ans.options.some((o) => o.id === ans.correctId), `seed ${seed}`).toBe(true)
      } else if (p.answer.kind === 'number') {
        if (/laboratory defines/.test(p.statement)) {
          const mu = Number(matchOrThrow(p.statement, /\\mu = ([-0-9.]+)/)[1])
          const sigma = Number(matchOrThrow(p.statement, /\\sigma = ([-0-9.]+)/)[1])
          const val = Number(p.answer.value)
          if (/upper reference limit/.test(p.statement)) {
            expect(val, `seed ${seed}`).toBeCloseTo(mu + 1.96 * sigma, 3)
          } else {
            expect(val, `seed ${seed}`).toBeCloseTo(mu - 1.96 * sigma, 3)
          }
        } else if (/what percentage of the population/.test(p.statement)) {
          const val = Number(p.answer.value)
          expect([84, 16, 97.5, 2.5], `seed ${seed}`).toContain(val)
        } else {
          throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
        }
      }
    }
  })
})

describe('correlation', () => {
  it('tier 1: Pearson r, covariance & linear transformation', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('correlation').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/sample covariance/.test(p.statement)) {
        const ptsStr = matchOrThrow(p.statement, /\\\{([^}]+)\\\}/)[1]
        const pairs = [...ptsStr.matchAll(/\(([-0-9.]+),\s*([-0-9.]+)\)/g)]
        const xs = pairs.map((m) => Number(m[1]))
        const ys = pairs.map((m) => Number(m[2]))

        const mx = xs.reduce((a, b) => a + b, 0) / xs.length
        const my = ys.reduce((a, b) => a + b, 0) / ys.length
        let sxy = 0
        for (let i = 0; i < xs.length; i += 1) {
          sxy += (xs[i] - mx) * (ys[i] - my)
        }
        const expected = sxy / (xs.length - 1)
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 4)
      } else if (/dataset/.test(p.statement)) {
        const ptsStr = matchOrThrow(p.statement, /\\\{([^}]+)\\\}/)[1]
        const pairs = [...ptsStr.matchAll(/\(([-0-9.]+),\s*([-0-9.]+)\)/g)]
        const xs = pairs.map((m) => Number(m[1]))
        const ys = pairs.map((m) => Number(m[2]))

        const mx = xs.reduce((a, b) => a + b, 0) / xs.length
        const my = ys.reduce((a, b) => a + b, 0) / ys.length
        let sxy = 0
        let sxx = 0
        let syy = 0
        for (let i = 0; i < xs.length; i += 1) {
          const dx = xs[i] - mx
          const dy = ys[i] - my
          sxy += dx * dy
          sxx += dx * dx
          syy += dy * dy
        }
        const expected = sxx * syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy)
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 4)
      } else if (/r\(U, V\)|r\(X, Y\)/.test(p.statement)) {
        const r0 = Number(matchOrThrow(p.statement, /r\(X, Y\) = ([-0-9.]+)/)[1])
        const mU = matchOrThrow(p.statement, /U = ([-0-9]*)X/)
        const a = mU[1] === '' ? 1 : mU[1] === '-' ? -1 : Number(mU[1])
        const mV = matchOrThrow(p.statement, /V = ([-0-9]*)Y/)
        const c = mV[1] === '' ? 1 : mV[1] === '-' ? -1 : Number(mV[1])
        const expected = (a * c) > 0 ? r0 : -r0
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 4)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: r from deviations, covariance/SD & properties choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('correlation').generate(createRng(seed), 2)

      if (p.answer.kind === 'choice') {
        const ans = p.answer
        expect(typeof ans.correctId, `seed ${seed}`).toBe('string')
        expect(ans.options.some((o) => o.id === ans.correctId), `seed ${seed}`).toBe(true)
      } else if (p.answer.kind === 'number') {
        if (/\\sum \(x_i - \\bar\{x\}\)\^2|In a sample of/.test(p.statement)) {
          const Sxx = Number(matchOrThrow(p.statement, /\\sum \(x_i - \\bar\{x\}\)\^2 = ([-0-9.]+)/)[1])
          const Syy = Number(matchOrThrow(p.statement, /\\sum \(y_i - \\bar\{y\}\)\^2 = ([-0-9.]+)/)[1])
          const Sxy = Number(matchOrThrow(p.statement, /\\sum \(x_i - \\bar\{x\}\)\(y_i - \\bar\{y\}\) = ([-0-9.]+)/)[1])
          const val = numberValue(p.answer.value)
          const expected = Sxy / Math.sqrt(Sxx * Syy)
          expect(val, `seed ${seed}`).toBeCloseTo(expected, 4)
        } else if (/sample covariance/.test(p.statement)) {
          const cov = Number(matchOrThrow(p.statement, /\\text\{Cov\}\(X, Y\) = ([-0-9.]+)/)[1])
          const sX = Number(matchOrThrow(p.statement, /s_X = ([-0-9.]+)/)[1])
          const sY = Number(matchOrThrow(p.statement, /s_Y = ([-0-9.]+)/)[1])
          const val = numberValue(p.answer.value)
          expect(val, `seed ${seed}`).toBeCloseTo(cov / (sX * sY), 4)
        } else {
          throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
        }
      }
    }
  })

  it('tier 3: non-linear quadratic r, negative scale & causation choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('correlation').generate(createRng(seed), 3)

      if (p.answer.kind === 'choice') {
        const ans = p.answer
        expect(typeof ans.correctId, `seed ${seed}`).toBe('string')
        expect(ans.options.some((o) => o.id === ans.correctId), `seed ${seed}`).toBe(true)
      } else if (p.answer.kind === 'number') {
        if (/y = \(x -|non-linear/i.test(p.statement)) {
          const val = Number(p.answer.value)
          expect(val, `seed ${seed}`).toBe(0)
        } else if (/r\(U, V\)/.test(p.statement)) {
          const r0 = Number(matchOrThrow(p.statement, /r\(X, Y\) = ([-0-9.]+)/)[1])
          const val = Number(p.answer.value)
          expect(val, `seed ${seed}`).toBeCloseTo(-r0, 4)
        } else {
          throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
        }
      }
    }
  })
})
