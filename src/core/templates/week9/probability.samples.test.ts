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

function fact(n: number): number {
  let res = 1
  for (let i = 2; i <= n; i += 1) res *= i
  return res
}

function nPr(n: number, r: number): number {
  return fact(n) / fact(n - r)
}

function nCr(n: number, r: number): number {
  return fact(n) / (fact(r) * fact(n - r))
}

describe('counting', () => {
  it('tier 1: basic combinations/permutations and committee selection', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('counting').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/combination/.test(p.statement)) {
        const n = Number(matchOrThrow(p.statement, /\\binom\{(\d+)\}/)[1])
        const k = Number(matchOrThrow(p.statement, /\\binom\{\d+\}\{(\d+)\}/)[1])
        expect(val, `seed ${seed}`).toBe(nCr(n, k))
      } else if (/permutation/.test(p.statement)) {
        const n = Number(matchOrThrow(p.statement, /P\((\d+),/)[1])
        const k = Number(matchOrThrow(p.statement, /P\(\d+, (\d+)\)/)[1])
        expect(val, `seed ${seed}`).toBe(nPr(n, k))
      } else if (/researchers/.test(p.statement)) {
        const k = Number(matchOrThrow(p.statement, /team of \$(\d+)\$ researchers/)[1])
        const n = Number(matchOrThrow(p.statement, /from \$(\d+)\$ candidates/)[1])
        expect(val, `seed ${seed}`).toBe(nCr(n, k))
      } else if (/books/.test(p.statement)) {
        const n = Number(matchOrThrow(p.statement, /has \$(\d+)\$ distinct books/)[1])
        const k = Number(matchOrThrow(p.statement, /ways can \$(\d+)\$ books/)[1])
        expect(val, `seed ${seed}`).toBe(nPr(n, k))
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: repeated letters and two-group committees', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('counting').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/permutations of the letters/.test(p.statement)) {
        const word = matchOrThrow(p.statement, /word \$([A-Z]+)\$/)[1]
        const totals: Record<string, number> = {
          CHEESE: 120,
          BANANA: 60,
          PEPPER: 60,
          LETTER: 180,
          COFFEE: 180,
          MEMBER: 180,
          SUCCESS: 420,
          ARRANGE: 1260,
          PARALLEL: 3360,
          BALLOON: 1260,
        }
        expect(val, `seed ${seed}`).toBe(totals[word])
      } else if (/hospital committee/.test(p.statement)) {
        const k1 = Number(matchOrThrow(p.statement, /consist of \$(\d+)\$ doctors/)[1])
        const n1 = Number(matchOrThrow(p.statement, /from \$(\d+)\$ doctors/)[1])
        const k2 = Number(matchOrThrow(p.statement, /and \$(\d+)\$ nurses/)[1])
        const n2 = Number(matchOrThrow(p.statement, /from \$(\d+)\$ nurses/)[1])
        expect(val, `seed ${seed}`).toBe(nCr(n1, k1) * nCr(n2, k2))
      } else if (/passcodes/.test(p.statement)) {
        const k = Number(matchOrThrow(p.statement, /different \$(\d+)\$-digit/)[1])
        expect(val, `seed ${seed}`).toBe(nPr(10, k))
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: at least one complement and adjacent block ordering', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('counting').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/at least one woman/.test(p.statement)) {
        const k = Number(matchOrThrow(p.statement, /committee of \$(\d+)\$ people/)[1])
        const m = Number(matchOrThrow(p.statement, /from \$(\d+)\$ men/)[1])
        const w = Number(matchOrThrow(p.statement, /and \$(\d+)\$ women/)[1])
        const expected = m < k ? nCr(m + w, k) : nCr(m + w, k) - nCr(m, k)
        expect(val, `seed ${seed}`).toBe(expected)
      } else if (/must stand next to each other/.test(p.statement)) {
        const n = Number(matchOrThrow(p.statement, /ways can \$(\d+)\$ students/)[1])
        const expected = 2 * fact(n - 1)
        expect(val, `seed ${seed}`).toBe(expected)
      } else if (/circular conference table/.test(p.statement)) {
        const n = Number(matchOrThrow(p.statement, /ways can \$(\d+)\$ executives/)[1])
        const expected = fact(n - 1)
        expect(val, `seed ${seed}`).toBe(expected)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })
})

describe('cond_prob', () => {
  it('tier 1: direct conditional probability and multiplication rule', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('cond_prob').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/find the conditional probability of the complement/.test(p.statement)) {
        const pB = numberValue(matchOrThrow(p.statement, /P\(B\) = ([^$]+)\$/)[1])
        const pInter = numberValue(matchOrThrow(p.statement, /P\(A \\cap B\) = ([^$]+)\$/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(1 - pInter / pB, 9)
      } else if (/find the conditional probability/.test(p.statement)) {
        const pB = numberValue(matchOrThrow(p.statement, /P\(B\) = ([^$]+)\$/)[1])
        const pInter = numberValue(matchOrThrow(p.statement, /P\(A \\cap B\) = ([^$]+)\$/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(pInter / pB, 9)
      } else if (/find the joint probability/.test(p.statement)) {
        const pB = Number(matchOrThrow(p.statement, /P\(B\) = ([0-9.]+)/)[1])
        const pCond = Number(matchOrThrow(p.statement, /P\(A\|B\) = ([0-9.]+)/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(pB * pCond, 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: contingency table and independence test', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('cond_prob').generate(createRng(seed), 2)

      if (p.answer.kind === 'choice') {
        const pA = Number(matchOrThrow(p.statement, /P\(A\) = ([0-9.]+)/)[1])
        const pB = Number(matchOrThrow(p.statement, /P\(B\) = ([0-9.]+)/)[1])
        const pInter = Number(matchOrThrow(p.statement, /P\(A \\cap B\) = ([0-9.]+)/)[1])
        const expectedId = Math.abs(pInter - pA * pB) < 1e-4 ? 'yes_indep' : 'no_dep'
        expect(p.answer.correctId, `seed ${seed}`).toBe(expectedId)
      } else {
        if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
        const val = numberValue(p.answer.value)
        const a = Number(matchOrThrow(p.statement, /trial, \$(\d+)\$ treated patients improved/)[1])
        const c = Number(matchOrThrow(p.statement, /\$(\d+)\$ control patients improved/)[1])

        if (/P\(\\text\{Improved\} \\mid \\text\{Treated\}\)/.test(p.statement)) {
          const b = Number(matchOrThrow(p.statement, /\$(\d+)\$ treated patients did not improve/)[1])
          expect(val, `seed ${seed}`).toBeCloseTo(a / (a + b), 9)
        } else if (/P\(\\text\{Treated\} \\mid \\text\{Improved\}\)/.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(a / (a + c), 9)
        } else {
          throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
        }
      }
    }
  })

  it('tier 3: reverse conditional and diagnostic joint probability', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('cond_prob').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/P\(B\\|A\)/.test(p.statement)) {
        const pA = Number(matchOrThrow(p.statement, /P\(A\) = ([0-9.]+)/)[1])
        const pInter = Number(matchOrThrow(p.statement, /P\(A \\cap B\) = ([0-9.]+)/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(pInter / pA, 9)
      } else if (/P\(D\^\+ \\cap T\^\+\)/.test(p.statement)) {
        const pPrev = Number(matchOrThrow(p.statement, /prevalence \$P\(D\^\+\) = ([0-9.]+)/)[1])
        const pSens = Number(matchOrThrow(p.statement, /sensitivity \$P\(T\^\+ \\mid D\^\+\) = ([0-9.]+)/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(pPrev * pSens, 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })
})

describe('bayes', () => {
  it('tier 1: total probability and direct Bayes formula', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('bayes').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/(Factory A|Supplier X|Assembly Line 1)/.test(p.statement)) {
        const pA = Number(matchOrThrow(p.statement, /(?:Factory A|Supplier X|Assembly Line 1) produces \$([0-9.]+)\$/)[1])
        const dA = Number(matchOrThrow(p.statement, /defect rate of \$([0-9.]+)\$/)[1])
        const pB = Number(matchOrThrow(p.statement, /(?:Factory B|Supplier Y|Assembly Line 2) produces the remaining \$([0-9.]+)\$/)[1])
        const dB = Number(matchOrThrow(p.statement, /(?:Factory B|Supplier Y|Assembly Line 2).*defect rate of \$([0-9.]+)\$/)[1])
        const expected = pA * dA + pB * dB
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
      } else if (/Machine A/.test(p.statement)) {
        const pA = Number(matchOrThrow(p.statement, /Machine A produces \$([0-9.]+)\$/)[1])
        const eA = Number(matchOrThrow(p.statement, /P\(E \\mid A\) = ([0-9.]+)/)[1])
        const pB = Number(matchOrThrow(p.statement, /Machine B produces the remaining \$([0-9.]+)\$/)[1])
        const eB = Number(matchOrThrow(p.statement, /P\(E \\mid B\) = ([0-9.]+)/)[1])
        const num = pA * eA
        const den = pA * eA + pB * eB
        expect(val, `seed ${seed}`).toBeCloseTo(num / den, 9)
      } else if (/P\(C \\mid T\^\+\)/.test(p.statement)) {
        const pTot = Number(matchOrThrow(p.statement, /P\(T\^\+\) = ([0-9.]+)/)[1])
        const pSens = Number(matchOrThrow(p.statement, /P\(T\^\+ \\mid C\) = ([0-9.]+)/)[1])
        const pPrev = Number(matchOrThrow(p.statement, /P\(C\) = ([0-9.]+)/)[1])
        const expected = (pSens * pPrev) / pTot
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: medical PPV and NPV', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('bayes').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/Positive Predictive Value/.test(p.statement)) {
        const prev = Number(matchOrThrow(p.statement, /prevalence \$P\(D\^\+\) = ([0-9.]+)/)[1])
        const sens = Number(matchOrThrow(p.statement, /sensitivity \$P\(T\^\+ \\mid D\^\+\) = ([0-9.]+)/)[1])
        const fpr = Number(matchOrThrow(p.statement, /false positive rate \$P\(T\^\+ \\mid D\^-\) = ([0-9.]+)/)[1])
        const tp = prev * sens
        const fp = (1 - prev) * fpr
        expect(val, `seed ${seed}`).toBeCloseTo(tp / (tp + fp), 9)
      } else if (/Negative Predictive Value/.test(p.statement)) {
        const prev = Number(matchOrThrow(p.statement, /prevalence \$P\(D\^\+\) = ([0-9.]+)/)[1])
        const spec = Number(matchOrThrow(p.statement, /specificity \$P\(T\^- \\mid D\^-\) = ([0-9.]+)/)[1])
        const fnr = Number(matchOrThrow(p.statement, /false negative rate \$P\(T\^- \\mid D\^\+\) = ([0-9.]+)/)[1])
        const tn = (1 - prev) * spec
        const fn = prev * fnr
        expect(val, `seed ${seed}`).toBeCloseTo(tn / (tn + fn), 9)
      } else if (/P\(\\text\{Spam\} \\mid \\text\{Flagged\}\)/.test(p.statement)) {
        const spam = Number(matchOrThrow(p.statement, /P\(\\text\{Spam\}\) = ([0-9.]+)/)[1])
        const sens = Number(matchOrThrow(p.statement, /P\(\\text\{Flagged\} \\mid \\text\{Spam\}\) = ([0-9.]+)/)[1])
        const fpr = Number(matchOrThrow(p.statement, /P\(\\text\{Flagged\} \\mid \\text\{Ham\}\) = ([0-9.]+)/)[1])
        const tp = spam * sens
        const fp = (1 - spam) * fpr
        expect(val, `seed ${seed}`).toBeCloseTo(tp / (tp + fp), 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: three-branch Bayes and false positive paradox choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('bayes').generate(createRng(seed), 3)

      if (p.answer.kind === 'choice') {
        expect(p.answer.correctId, `seed ${seed}`).toBe('low_prevalence')
      } else {
        if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
        const val = numberValue(p.answer.value)
        const matchSupply = matchOrThrow(p.statement, /supply \$(\d+)[^$]*\$, \$(\d+)[^$]*\$, and \$(\d+)/)
        const pA = Number(matchSupply[1])
        const pB = Number(matchSupply[2])
        const pC = Number(matchSupply[3])
        const dA = Number(matchOrThrow(p.statement, /Line A has a \$(\d+)\\%/)[1])
        const dB = Number(matchOrThrow(p.statement, /Line B has a \$(\d+)\\%/)[1])
        const dC = Number(matchOrThrow(p.statement, /Line C has a \$(\d+)\\%/)[1])
        const targetLine = matchOrThrow(p.statement, /came from Line ([ABC])\?/)[1]

        const defA = (pA / 100) * (dA / 100)
        const defB = (pB / 100) * (dB / 100)
        const defC = (pC / 100) * (dC / 100)
        const totDefect = defA + defB + defC
        const targetDefect = targetLine === 'A' ? defA : targetLine === 'B' ? defB : defC
        expect(val, `seed ${seed}`).toBeCloseTo(targetDefect / totDefect, 9)
      }
    }
  })
})

describe('random_vars', () => {
  it('tier 1: expected value table and linearity of expectation', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('random_vars').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/Find \$E\[X\]\$/.test(p.statement)) {
        const matches = [...p.statement.matchAll(/P\(X = (-?\d+)\) = \\frac\{(\d+)\}\{10\}/g)]
        const ex = matches.reduce((acc, m) => acc + (Number(m[1]) * Number(m[2])) / 10, 0)
        expect(val, `seed ${seed}`).toBeCloseTo(ex, 9)
      } else if (/expected value \$E\[X\]/.test(p.statement)) {
        const M = Number(matchOrThrow(p.statement, /E\[X\] = (\d+)/)[1])
        const a = Number(matchOrThrow(p.statement, /E\[(-?\d+)X/)[1])
        const bStr = matchOrThrow(p.statement, /E\[-?\d+X ([+-] \d+)\]/)[1]
        const b = Number(bStr.replace(/\s+/g, ''))
        expect(val, `seed ${seed}`).toBeCloseTo(a * M + b, 9)
      } else if (/expected net gain/.test(p.statement)) {
        const cost = Number(matchOrThrow(p.statement, /game costs \$(\d+)\$/)[1])
        const jackpot = Number(matchOrThrow(p.statement, /jackpot prize of \$(\d+)\$/)[1])
        const minor = Number(matchOrThrow(p.statement, /minor prize of \$(\d+)\$/)[1])
        const pJackpot = Number(matchOrThrow(p.statement, /jackpot prize of \$\d+\$ with probability \$\\frac\{(\d+)\}\{10\}\$/)[1])
        const pMinor = Number(matchOrThrow(p.statement, /minor prize of \$\d+\$ with probability \$\\frac\{(\d+)\}\{10\}\$/)[1])
        const pNo = Number(matchOrThrow(p.statement, /no prize with probability \$\\frac\{(\d+)\}\{10\}\$/)[1])
        const expectedNet = ((jackpot - cost) * pJackpot + (minor - cost) * pMinor + -cost * pNo) / 10
        expect(val, `seed ${seed}`).toBeCloseTo(expectedNet, 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: variance table and linearity of variance', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('random_vars').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/Find \$\\text\{Var\}\(X\)\$/.test(p.statement)) {
        const matches = [...p.statement.matchAll(/P\(X = (-?\d+)\) = \\frac\{(\d+)\}\{10\}/g)]
        const ex = matches.reduce((acc, m) => acc + (Number(m[1]) * Number(m[2])) / 10, 0)
        const ex2 = matches.reduce((acc, m) => acc + (Number(m[1]) ** 2 * Number(m[2])) / 10, 0)
        const varX = ex2 - ex * ex
        expect(val, `seed ${seed}`).toBeCloseTo(varX, 9)
      } else if (/variance \$\\text\{Var\}\(X\)/.test(p.statement)) {
        const V = Number(matchOrThrow(p.statement, /\\text\{Var\}\(X\) = (\d+)/)[1])
        const a = Number(matchOrThrow(p.statement, /\\text\{Var\}\((-?\d+)X/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(a * a * V, 9)
      } else if (/standard deviation \$\\text\{SD\}\(X\)/.test(p.statement)) {
        const S = Number(matchOrThrow(p.statement, /\\text\{SD\}\(X\) = (\d+)/)[1])
        const a = Number(matchOrThrow(p.statement, /\\text\{SD\}\((-?\d+)X/)[1])
        expect(val, `seed ${seed}`).toBeCloseTo(Math.abs(a) * S, 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: missing probability table and independent variance combinations', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('random_vars').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/and \$P\(X=(-?\d+)\) = k\$/.test(p.statement)) {
        const matches = [...p.statement.matchAll(/P\(X=(-?\d+)\) = ([0-9.]+)/g)]
        const xLast = Number(matchOrThrow(p.statement, /and \$P\(X=(-?\d+)\) = k\$/)[1])
        const sumKnownP = matches.reduce((acc, m) => acc + Number(m[2]), 0)
        const k = 1 - sumKnownP
        const ex = matches.reduce((acc, m) => acc + Number(m[1]) * Number(m[2]), 0) + xLast * k
        expect(val, `seed ${seed}`).toBeCloseTo(ex, 9)
      } else if (/independent random variables/.test(p.statement)) {
        const vX = Number(matchOrThrow(p.statement, /\\text\{Var\}\(X\) = (\d+)/)[1])
        const vY = Number(matchOrThrow(p.statement, /\\text\{Var\}\(Y\) = (\d+)/)[1])
        const a = Number(matchOrThrow(p.statement, /\\text\{Var\}\((\d+)X/)[1])
        const b = Number(matchOrThrow(p.statement, /X [+-] (\d+)Y\)/)[1])
        const expected = a * a * vX + b * b * vY
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 9)
      } else if (/Random variables \$X\$ and \$Y\$/.test(p.statement)) {
        const mX = Number(matchOrThrow(p.statement, /E\[X\] = (\d+)/)[1])
        const mY = Number(matchOrThrow(p.statement, /E\[Y\] = (\d+)/)[1])
        const a = Number(matchOrThrow(p.statement, /E\[(-?\d+)X/)[1])
        const bStr = matchOrThrow(p.statement, /E\[-?\d+X ([+-] \d+)Y/)[1]
        const b = Number(bStr.replace(/\s+/g, ''))
        const cStr = matchOrThrow(p.statement, /Y ([+-] \d+)\]/)[1]
        const c = Number(cStr.replace(/\s+/g, ''))
        expect(val, `seed ${seed}`).toBeCloseTo(a * mX + b * mY + c, 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })
})

describe('stated probabilities are possible', () => {
  // P(A ∩ B) must lie between max(0, P(A) + P(B) − 1) and min(P(A), P(B)); a problem that breaks this
  // still has a computable "answer", which is exactly why only a direct check catches it.
  const stated = (statement: string, event: string): number | null => {
    const m = statement.match(new RegExp(`\\$P\\(${event}\\) = ([^$]+)\\$`))
    return m ? numberValue(m[1]) : null
  }
  it.each(['prob_rules', 'cond_prob', 'bayes'])('%s', (skillId) => {
    for (const tier of [1, 2, 3] as const) {
      for (let seed = 1; seed <= 60; seed += 1) {
        const s = getTemplate(skillId).generate(createRng(seed), tier).statement
        const label = `T${tier} seed ${seed}: ${s}`
        const values = [...s.matchAll(/\$P\([^$]*?\) = ([^$]+)\$/g)].map((m) => numberValue(m[1]))
        values.forEach((v) => expect(v >= 0 && v <= 1, label).toBe(true))
        const [a, b, both] = [stated(s, 'A'), stated(s, 'B'), stated(s, 'A \\\\cap B')]
        if (a !== null && b !== null && both !== null) {
          expect(both, label).toBeLessThanOrEqual(Math.min(a, b) + 1e-9)
          expect(both, label).toBeGreaterThanOrEqual(a + b - 1 - 1e-9)
        }
      }
    }
  })
})
