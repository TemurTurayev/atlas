import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'

const SEEDS = 30

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

function computeQuantiles(nums: number[]) {
  const sorted = [...nums].sort((a, b) => a - b)
  const n = sorted.length
  let lowerHalf: number[]
  let upperHalf: number[]
  if (n % 2 === 1) {
    const mid = (n - 1) / 2
    lowerHalf = sorted.slice(0, mid)
    upperHalf = sorted.slice(mid + 1)
  } else {
    const mid = n / 2
    lowerHalf = sorted.slice(0, mid)
    upperHalf = sorted.slice(mid)
  }
  const calcMed = (arr: number[]) => {
    const len = arr.length
    return len % 2 === 1 ? arr[(len - 1) / 2] : (arr[len / 2 - 1] + arr[len / 2]) / 2
  }
  const q1 = calcMed(lowerHalf)
  const q3 = calcMed(upperHalf)
  const iqr = q3 - q1
  return { q1, q3, iqr, lowerFence: q1 - 1.5 * iqr, upperFence: q3 + 1.5 * iqr }
}

describe('desc_stats', () => {
  it('tier 1: mean, median, mode checked by plain arithmetic', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('desc_stats').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/mean of the dataset/.test(p.statement)) {
        const m = matchOrThrow(p.statement, /dataset: \$([-0-9, ]+)\$/)
        const nums = m[1].split(',').map((s) => Number(s.trim()))
        const expected = nums.reduce((a, b) => a + b, 0) / nums.length
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
      } else if (/median of the dataset/.test(p.statement)) {
        const m = matchOrThrow(p.statement, /dataset: \$([-0-9, ]+)\$/)
        const nums = m[1].split(',').map((s) => Number(s.trim()))
        nums.sort((a, b) => a - b)
        const len = nums.length
        const expected = len % 2 === 1 ? nums[(len - 1) / 2] : (nums[len / 2 - 1] + nums[len / 2]) / 2
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
      } else if (/mode of the dataset/.test(p.statement)) {
        const m = matchOrThrow(p.statement, /dataset: \$([-0-9, ]+)\$/)
        const nums = m[1].split(',').map((s) => Number(s.trim()))
        const counts = new Map<number, number>()
        nums.forEach((n) => counts.set(n, (counts.get(n) ?? 0) + 1))
        let maxCount = 0
        let mode = 0
        counts.forEach((c, n) => {
          if (c > maxCount) {
            maxCount = c
            mode = n
          }
        })
        expect(val, `seed ${seed}`).toBe(mode)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: missing value, grouped mean, linear transformation checked by plain arithmetic', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('desc_stats').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/missing number/.test(p.statement)) {
        const n = Number(matchOrThrow(p.statement, /A dataset of \$(\d+)\$ numbers/)[1])
        const M = Number(matchOrThrow(p.statement, /mean of \$(\d+)\$/)[1])
        const knownStr = matchOrThrow(p.statement, /numbers are \$([0-9, ]+)\$/)[1]
        const known = knownStr.split(',').map((s) => Number(s.trim()))
        const expected = n * M - known.reduce((a, b) => a + b, 0)
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
      } else if (/combined mean score/.test(p.statement)) {
        const nA = Number(matchOrThrow(p.statement, /Group A has \$(\d+)\$/)[1])
        const mA = Number(matchOrThrow(p.statement, /Group A has \$\d+\$ students with a mean score of \$(\d+)\$/)[1])
        const nB = Number(matchOrThrow(p.statement, /Group B has \$(\d+)\$/)[1])
        const mB = Number(matchOrThrow(p.statement, /Group B has \$\d+\$ students with a mean score of \$(\d+)\$/)[1])
        const expected = (nA * mA + nB * mB) / (nA + nB)
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
      } else if (/new mean/.test(p.statement)) {
        const M = Number(matchOrThrow(p.statement, /mean of \$\\bar\{x\} = (\d+)\$/)[1])
        const a = Number(matchOrThrow(p.statement, /y_i = (-?\d+)x_i/)[1])
        const bStr = matchOrThrow(p.statement, /y_i = -?\d+x_i ([+-] \d+)/)[1]
        const b = Number(bStr.replace(/\s+/g, ''))
        const expected = a * M + b
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: corrected mean and weighted grade checked by plain arithmetic', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('desc_stats').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/corrected mean/.test(p.statement)) {
        const n = Number(matchOrThrow(p.statement, /sample of \$(\d+)\$ observations/)[1])
        const M = Number(matchOrThrow(p.statement, /initial mean of \$(\d+)\$/)[1])
        const xWrong = Number(matchOrThrow(p.statement, /recorded as \$(\d+)\$/)[1])
        const xCorrect = Number(matchOrThrow(p.statement, /actually \$(-?\d+)\$/)[1])
        const expected = (n * M - xWrong + xCorrect) / n
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
      } else if (/weighted mean/.test(p.statement)) {
        const h = Number(matchOrThrow(p.statement, /scored \$(\d+)\$ on Homework/)[1])
        const m = Number(matchOrThrow(p.statement, /scored \$\d+\$ on Homework and \$(\d+)\$ on the Midterm/)[1])
        const targetStr = matchOrThrow(p.statement, /overall grade of \$([0-9.]+)\$/)[1]
        const T = Number(targetStr)
        const expectedFinal = (100 * T - 30 * h - 30 * m) / 40
        expect(val, `seed ${seed}`).toBeCloseTo(expectedFinal, 9)
      } else if (/three sections/.test(p.statement)) {
        const n1 = Number(matchOrThrow(p.statement, /Section 1 \(\$(\d+)\$ students/)[1])
        const m1 = Number(matchOrThrow(p.statement, /Section 1 \(\$\d+\$ students, mean \$(\d+)\$\)/)[1])
        const n2 = Number(matchOrThrow(p.statement, /Section 2 \(\$(\d+)\$ students/)[1])
        const m2 = Number(matchOrThrow(p.statement, /Section 2 \(\$\d+\$ students, mean \$(\d+)\$\)/)[1])
        const n3 = Number(matchOrThrow(p.statement, /Section 3 \(\$(\d+)\$ students/)[1])
        const m3 = Number(matchOrThrow(p.statement, /Section 3 \(\$\d+\$ students, mean \$(\d+)\$\)/)[1])
        const expected = (n1 * m1 + n2 * m2 + n3 * m3) / (n1 + n2 + n3)
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })
})

describe('variance_sd', () => {
  it('tier 1: population variance and sample standard deviation checked by plain arithmetic', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('variance_sd').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/population variance/.test(p.statement)) {
        const m = matchOrThrow(p.statement, /dataset: \$([0-9, ]+)\$/)
        const nums = m[1].split(',').map((s) => Number(s.trim()))
        const n = nums.length
        const mean = nums.reduce((a, b) => a + b, 0) / n
        const expected = nums.reduce((acc, x) => acc + (x - mean) ** 2, 0) / n
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
      } else if (/sample standard deviation/.test(p.statement)) {
        const m = matchOrThrow(p.statement, /dataset: \$([0-9, ]+)\$/)
        const nums = m[1].split(',').map((s) => Number(s.trim()))
        const n = nums.length
        const mean = nums.reduce((a, b) => a + b, 0) / n
        const s2 = nums.reduce((acc, x) => acc + (x - mean) ** 2, 0) / (n - 1)
        const expected = Math.sqrt(s2)
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
      } else if (/sample variance/.test(p.statement)) {
        const m = matchOrThrow(p.statement, /dataset: \$([0-9, ]+)\$/)
        const nums = m[1].split(',').map((s) => Number(s.trim()))
        const n = nums.length
        const mean = nums.reduce((a, b) => a + b, 0) / n
        const expected = nums.reduce((acc, x) => acc + (x - mean) ** 2, 0) / (n - 1)
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: linear transformation of var/sd and sum of squares formula checked by plain arithmetic', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('variance_sd').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/population standard deviation \$\\sigma\$/.test(p.statement)) {
        const n = Number(matchOrThrow(p.statement, /n = (\d+)\$ observations/)[1])
        const sumX = Number(matchOrThrow(p.statement, /sum \$\\sum_\{i=1\}\^\{?\d+\}? x_i = (\d+)\$/)[1])
        const sumX2 = Number(matchOrThrow(p.statement, /sum of squares \$\\sum_\{i=1\}\^\{?\d+\}? x_i\^2 = (\d+)\$/)[1])
        const mean = sumX / n
        const varVal = sumX2 / n - mean * mean
        expect(val, `seed ${seed}`).toBeCloseTo(Math.sqrt(varVal), 9)
      } else if (/population variance \\sigma_Y\^2/.test(p.statement) || /population variance \\sigma_Y/.test(p.statement) || /population variance of \\\sigma_Y/.test(p.statement) || /\\sigma_Y\^2/.test(p.statement)) {
        const origVar = Number(matchOrThrow(p.statement, /\\sigma_X\^2 = (\d+)/)[1])
        const a = Number(matchOrThrow(p.statement, /y_i = (-?\d+)x_i/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(a * a * origVar, 9)
      } else if (/population standard deviation \\sigma_Y/.test(p.statement) || /\\sigma_Y/.test(p.statement)) {
        const origSD = Number(matchOrThrow(p.statement, /\\sigma_X = (\d+)/)[1])
        const a = Number(matchOrThrow(p.statement, /y_i = (-?\d+)x_i/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(Math.abs(a) * origSD, 9)
      } else if (/sum of squares/.test(p.statement)) {
        const n = Number(matchOrThrow(p.statement, /n = (\d+)\$ observations/)[1])
        const sumX = Number(matchOrThrow(p.statement, /sum \$\\sum_\{i=1\}\^\{?\d+\}? x_i = (\d+)\$/)[1])
        const sumX2 = Number(matchOrThrow(p.statement, /sum of squares \$\\sum_\{i=1\}\^\{?\d+\}? x_i\^2 = (\d+)\$/)[1])
        const mean = sumX / n
        const expected = sumX2 / n - mean * mean
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: pooled variance and temperature conversion checked by plain arithmetic', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('variance_sd').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/Group 1/.test(p.statement)) {
        const n1 = Number(matchOrThrow(p.statement, /n_1 = (\d+)/)[1])
        const v1 = Number(matchOrThrow(p.statement, /\\sigma_1\^2 = (\d+)/)[1])
        const n2 = Number(matchOrThrow(p.statement, /n_2 = (\d+)/)[1])
        const v2 = Number(matchOrThrow(p.statement, /\\sigma_2\^2 = (\d+)/)[1])
        const expected = (n1 * v1 + n2 * v2) / (n1 + n2)
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
      } else if (/degrees Celsius/.test(p.statement)) {
        const sC = Number(matchOrThrow(p.statement, /s_C = (\d+)\\/)[1])
        const expected = (9 / 5) * sC
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
      } else if (/exam raw score/.test(p.statement)) {
        const sOld = Number(matchOrThrow(p.statement, /s_X = (\d+)/)[1])
        const scale = Number(matchOrThrow(p.statement, /Y = (\d+)X/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(scale * sOld, 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })
})

describe('quantiles', () => {
  it('tier 1: quartiles and IQR checked by plain arithmetic', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('quantiles').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      const m = matchOrThrow(p.statement, /dataset: \$([0-9, ]+)\$/)
      const nums = m[1].split(',').map((s) => Number(s.trim()))
      const q = computeQuantiles(nums)

      if (/first quartile/.test(p.statement)) {
        expect(val, `seed ${seed}`).toBeCloseTo(q.q1, 9)
      } else if (/third quartile/.test(p.statement)) {
        expect(val, `seed ${seed}`).toBeCloseTo(q.q3, 9)
      } else if (/interquartile range/.test(p.statement)) {
        expect(val, `seed ${seed}`).toBeCloseTo(q.iqr, 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: outlier fences and smallest outlier checked by plain arithmetic', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('quantiles').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      const q1 = Number(matchOrThrow(p.statement, /Q_1 = (\d+)/)[1])
      const q3 = Number(matchOrThrow(p.statement, /Q_3 = (\d+)/)[1])
      const iqr = q3 - q1

      if (/upper fence/.test(p.statement)) {
        expect(val, `seed ${seed}`).toBeCloseTo(q3 + 1.5 * iqr, 9)
      } else if (/lower fence/.test(p.statement)) {
        expect(val, `seed ${seed}`).toBeCloseTo(q1 - 1.5 * iqr, 9)
      } else if (/smallest integer/.test(p.statement)) {
        const fence = q3 + 1.5 * iqr
        expect(val, `seed ${seed}`).toBe(Math.floor(fence) + 1)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: full dataset fences and boxplot outlier choice checked', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('quantiles').generate(createRng(seed), 3)

      if (p.answer.kind === 'choice') {
        expect(p.answer.correctId, `seed ${seed}`).toBe('unchanged')
      } else {
        if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
        const val = numberValue(p.answer.value)
        const m = matchOrThrow(p.statement, /dataset: \$([0-9, ]+)\$/)
        const nums = m[1].split(',').map((s) => Number(s.trim()))
        const q = computeQuantiles(nums)
        if (/upper.*fence/.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(q.upperFence, 9)
        } else if (/lower.*fence/.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(q.lowerFence, 9)
        } else {
          throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
        }
      }
    }
  })
})

describe('prob_rules', () => {
  it('tier 1: complement and disjoint addition checked by plain arithmetic', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('prob_rules').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/mutually exclusive/.test(p.statement)) {
        const pA = Number(matchOrThrow(p.statement, /P\(A\) = ([0-9.]+)\$/)[1])
        const pB = Number(matchOrThrow(p.statement, /P\(B\) = ([0-9.]+)\$/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(pA + pB, 9)
      } else if (/complement/.test(p.statement) || /P\(A\)/.test(p.statement)) {
        const pA = numberValue(matchOrThrow(p.statement, /P\(A\) = ([^$]+)\$/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(1 - pA, 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: general addition rule and neither event checked by plain arithmetic', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('prob_rules').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/neither/.test(p.statement)) {
        const pA = Number(matchOrThrow(p.statement, /P\(A\) = ([0-9.]+)/)[1])
        const pB = Number(matchOrThrow(p.statement, /P\(B\) = ([0-9.]+)/)[1])
        const pInter = Number(matchOrThrow(p.statement, /P\(A \\cap B\) = ([0-9.]+)/)[1])
        const pUnion = pA + pB - pInter
        expect(val, `seed ${seed}`).toBeCloseTo(1 - pUnion, 9)
      } else if (/Find \$P\(A \\cup B\)\$/.test(p.statement)) {
        const pA = Number(matchOrThrow(p.statement, /P\(A\) = ([0-9.]+)/)[1])
        const pB = Number(matchOrThrow(p.statement, /P\(B\) = ([0-9.]+)/)[1])
        const pInter = Number(matchOrThrow(p.statement, /P\(A \\cap B\) = ([0-9.]+)/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(pA + pB - pInter, 9)
      } else if (/Find \$P\(A \\cap B\)\$/.test(p.statement)) {
        const pA = Number(matchOrThrow(p.statement, /P\(A\) = ([0-9.]+)/)[1])
        const pB = Number(matchOrThrow(p.statement, /P\(B\) = ([0-9.]+)/)[1])
        const pUnion = Number(matchOrThrow(p.statement, /P\(A \\cup B\) = ([0-9.]+)/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(pA + pB - pUnion, 9)
      } else if (/find \$P\(B\)\$/i.test(p.statement)) {
        const pA = Number(matchOrThrow(p.statement, /P\(A\) = ([0-9.]+)/)[1])
        const pInter = Number(matchOrThrow(p.statement, /P\(A \\cap B\) = ([0-9.]+)/)[1])
        const pUnion = Number(matchOrThrow(p.statement, /P\(A \\cup B\) = ([0-9.]+)/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(pUnion - pA + pInter, 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: Venn word problem and mutually exclusive axiom choice checked', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('prob_rules').generate(createRng(seed), 3)

      if (p.answer.kind === 'choice') {
        expect(p.answer.correctId, `seed ${seed}`).toBe('exceeds_one')
      } else {
        if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
        const val = numberValue(p.answer.value)
        const nA = Number(matchOrThrow(p.statement, /(\d+)\$ take Biology/)[1])
        const nB = Number(matchOrThrow(p.statement, /(\d+)\$ take Chemistry/)[1])
        const nAB = Number(matchOrThrow(p.statement, /(\d+)\$ take both/)[1])
        if (/takes neither/.test(p.statement)) {
          const expected = (100 - (nA + nB - nAB)) / 100
          expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
        } else {
          const expected = (nA + nB - 2 * nAB) / 100
          expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
        }
      }
    }
  })
})
