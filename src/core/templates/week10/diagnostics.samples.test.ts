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

describe('confusion_matrix', () => {
  it('tier 1: metrics from matrix, missing cell, FPR/FNR', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('confusion_matrix').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/table of counts/i.test(p.statement)) {
        const tp = Number(matchOrThrow(p.statement, /TP = ([-0-9.]+)/)[1])
        const fp = Number(matchOrThrow(p.statement, /FP = ([-0-9.]+)/)[1])
        const fn = Number(matchOrThrow(p.statement, /FN = ([-0-9.]+)/)[1])
        const tn = Number(matchOrThrow(p.statement, /TN = ([-0-9.]+)/)[1])

        expect(tp, `seed ${seed}`).toBeGreaterThanOrEqual(0)
        expect(fp, `seed ${seed}`).toBeGreaterThanOrEqual(0)
        expect(fn, `seed ${seed}`).toBeGreaterThanOrEqual(0)
        expect(tn, `seed ${seed}`).toBeGreaterThanOrEqual(0)

        if (/Calculate the sensitivity/i.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(tp / (tp + fn), 6)
        } else if (/Calculate the specificity/i.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(tn / (tn + fp), 6)
        } else if (/Calculate the positive predictive value/i.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(tp / (tp + fp), 6)
        } else if (/Calculate the negative predictive value/i.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(tn / (tn + fn), 6)
        } else if (/Calculate the accuracy/i.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo((tp + tn) / (tp + fp + fn + tn), 6)
        } else {
          throw new Error(`seed ${seed}: unrecognised metric statement: ${p.statement}`)
        }
      } else if (/Find the number of/i.test(p.statement)) {
        const tpMatch = p.statement.match(/TP = ([-0-9.]+)/)
        const fpMatch = p.statement.match(/FP = ([-0-9.]+)/)
        const fnMatch = p.statement.match(/FN = ([-0-9.]+)/)
        const tnMatch = p.statement.match(/TN = ([-0-9.]+)/)

        let expected: number
        if (/True Positives \(\$TP\$\)/i.test(p.statement)) {
          const fp = Number(fpMatch![1])
          const totalPos = Number(matchOrThrow(p.statement, /TP \+ FP = ([-0-9.]+)/)[1])
          expected = totalPos - fp
        } else if (/False Positives \(\$FP\$\)/i.test(p.statement)) {
          const tn = Number(tnMatch![1])
          const totalHealthy = Number(matchOrThrow(p.statement, /FP \+ TN = ([-0-9.]+)/)[1])
          expected = totalHealthy - tn
        } else if (/False Negatives \(\$FN\$\)/i.test(p.statement)) {
          const tp = Number(tpMatch![1])
          const totalDiseased = Number(matchOrThrow(p.statement, /TP \+ FN = ([-0-9.]+)/)[1])
          expected = totalDiseased - tp
        } else {
          const fn = Number(fnMatch![1])
          const totalNeg = Number(matchOrThrow(p.statement, /FN \+ TN = ([-0-9.]+)/)[1])
          expected = totalNeg - fn
        }

        expect(val, `seed ${seed}`).toBe(expected)
      } else if (/false positive rate|false negative rate/i.test(p.statement)) {
        const tp = Number(matchOrThrow(p.statement, /TP = ([-0-9.]+)/)[1])
        const fp = Number(matchOrThrow(p.statement, /FP = ([-0-9.]+)/)[1])
        const fn = Number(matchOrThrow(p.statement, /FN = ([-0-9.]+)/)[1])
        const tn = Number(matchOrThrow(p.statement, /TN = ([-0-9.]+)/)[1])

        if (/false positive rate/i.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(fp / (fp + tn), 6)
        } else {
          expect(val, `seed ${seed}`).toBeCloseTo(fn / (tp + fn), 6)
        }
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: matrix word problem, rates reconstruction, test comparison', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('confusion_matrix').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/screened\. The test yielded/i.test(p.statement)) {
        const n = Number(matchOrThrow(p.statement, /n = ([-0-9.]+)/)[1])
        const tp = Number(matchOrThrow(p.statement, /TP = ([-0-9.]+)/)[1])
        const fp = Number(matchOrThrow(p.statement, /FP = ([-0-9.]+)/)[1])
        const fn = Number(matchOrThrow(p.statement, /FN = ([-0-9.]+)/)[1])
        const tn = Number(matchOrThrow(p.statement, /TN = ([-0-9.]+)/)[1])

        expect(tp + fp + fn + tn, `seed ${seed}`).toBe(n)

        if (/Calculate the sensitivity/i.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(tp / (tp + fn), 6)
        } else if (/Calculate the specificity/i.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(tn / (tn + fp), 6)
        } else if (/Calculate the positive predictive value/i.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(tp / (tp + fp), 6)
        } else {
          throw new Error(`seed ${seed}: unrecognised word problem metric: ${p.statement}`)
        }
      } else if (/disease prevalence is/i.test(p.statement)) {
        const total = Number(matchOrThrow(p.statement, /n = ([-0-9.]+)/)[1])
        const prevP = Number(matchOrThrow(p.statement, /prevalence is ([-0-9.]+)%/)[1])
        const sensP = Number(matchOrThrow(p.statement, /sensitivity is ([-0-9.]+)%/)[1])
        const specP = Number(matchOrThrow(p.statement, /specificity is ([-0-9.]+)%/)[1])

        const diseased = (total * prevP) / 100
        const healthy = total - diseased
        const tp = (diseased * sensP) / 100
        const tn = (healthy * specP) / 100
        const fp = healthy - tn

        const expectedPPV = tp / (tp + fp)
        expect(val, `seed ${seed}`).toBeCloseTo(expectedPPV, 6)
      } else if (/exceed that of Assay B/i.test(p.statement)) {
        const tpA = Number(matchOrThrow(p.statement, /TP_A = ([-0-9.]+)/)[1])
        const fnA = Number(matchOrThrow(p.statement, /FN_A = ([-0-9.]+)/)[1])
        const tpB = Number(matchOrThrow(p.statement, /TP_B = ([-0-9.]+)/)[1])
        const fnB = Number(matchOrThrow(p.statement, /FN_B = ([-0-9.]+)/)[1])

        const sensA = (tpA / (tpA + fnA)) * 100
        const sensB = (tpB / (tpB + fnB)) * 100
        const expectedDiff = sensA - sensB
        expect(val, `seed ${seed}`).toBeCloseTo(expectedDiff, 6)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: two-stage screening, prevalence shift ratio, choices', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('confusion_matrix').generate(createRng(seed), 3)

      if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)
        if (/two-stage screening program/i.test(p.statement)) {
          const nStr = matchOrThrow(p.statement, /n = ([0-9.,\\ ]+)/)[1].split('\\,').join('').split(',').join('')
          const n = Number(nStr)
          const prevP = Number(matchOrThrow(p.statement, /prevalence ([-0-9.]+)%/)[1])
          const specP = Number(matchOrThrow(p.statement, /specificity ([-0-9.]+)%/)[1])

          const diseased = (n * prevP) / 100
          const healthy = n - diseased
          const fp1 = (healthy * (100 - specP)) / 100
          const fp2 = (fp1 * (100 - specP)) / 100
          expect(val, `seed ${seed}`).toBeCloseTo(fp2, 6)
        } else if (/Find the ratio/i.test(p.statement)) {
          const p1P = Number(matchOrThrow(p.statement, /p_1 = ([-0-9.]+)\\%/)[1])
          const p2P = Number(matchOrThrow(p.statement, /p_2 = ([-0-9.]+)\\%/)[1])
          const N = 10000
          const dis1 = (N * p1P) / 100
          const hea1 = N - dis1
          const tp1 = dis1 * 0.9
          const fp1 = hea1 * 0.1
          const ppv1 = tp1 / (tp1 + fp1)

          const dis2 = (N * p2P) / 100
          const hea2 = N - dis2
          const tp2 = dis2 * 0.9
          const fp2 = hea2 * 0.1
          const ppv2 = tp2 / (tp2 + fp2)

          expect(val, `seed ${seed}`).toBeCloseTo(ppv1 / ppv2, 6)
        } else {
          throw new Error(`seed ${seed}: unrecognised numeric statement: ${p.statement}`)
        }
      } else if (p.answer.kind === 'choice') {
        const ans = p.answer
        expect(typeof ans.correctId, `seed ${seed}`).toBe('string')
        expect(ans.options.some((o) => o.id === ans.correctId), `seed ${seed}`).toBe(true)
      } else {
        throw new Error(`seed ${seed}: unrecognised answer type`)
      }
    }
  })
})

describe('ppv_prevalence', () => {
  it('tier 1: PPV, NPV, LR+, LR- from natural frequencies', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('ppv_prevalence').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      const sensP = Number(matchOrThrow(p.statement, /sensitivity ([-0-9.]+)%/i)[1])
      const specP = Number(matchOrThrow(p.statement, /specificity ([-0-9.]+)%/i)[1])

      if (/prevalence is ([-0-9.]+)%/i.test(p.statement)) {
        const prevP = Number(matchOrThrow(p.statement, /prevalence is ([-0-9.]+)%/i)[1])
        const diseased = (10000 * prevP) / 100
        const healthy = 10000 - diseased
        const tp = (diseased * sensP) / 100
        const fn = diseased - tp
        const tn = (healthy * specP) / 100
        const fp = healthy - tn

        if (/Positive Predictive Value/i.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(tp / (tp + fp), 6)
        } else if (/Negative Predictive Value/i.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(tn / (tn + fn), 6)
        }
      } else if (/Positive Likelihood Ratio/i.test(p.statement)) {
        expect(val, `seed ${seed}`).toBeCloseTo(sensP / (100 - specP), 6)
      } else if (/Negative Likelihood Ratio/i.test(p.statement)) {
        expect(val, `seed ${seed}`).toBeCloseTo((100 - sensP) / specP, 6)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: PPV ratio, target PPV prevalence, post-test odds', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('ppv_prevalence').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/referral clinic/i.test(p.statement)) {
        const sensP = Number(matchOrThrow(p.statement, /sensitivity ([-0-9.]+)%/i)[1])
        const specP = Number(matchOrThrow(p.statement, /specificity ([-0-9.]+)%/i)[1])
        const prevC = Number(matchOrThrow(p.statement, /prevalence ([-0-9.]+)%/i)[1])
        const prevS = Number(matchOrThrow(p.statement, /prevalence ([-0-9.]+)%/g)[1].match(/\d+/)?.[0] ?? '1')

        const N = 10000
        const disC = (N * prevC) / 100
        const heaC = N - disC
        const tpC = (disC * sensP) / 100
        const fpC = (heaC * (100 - specP)) / 100
        const ppvC = tpC / (tpC + fpC)

        const disS = (N * prevS) / 100
        const heaS = N - disS
        const tpS = (disS * sensP) / 100
        const fpS = (heaS * (100 - specP)) / 100
        const ppvS = tpS / (tpS + fpS)

        expect(val, `seed ${seed}`).toBeCloseTo(ppvC / ppvS, 6)
      } else if (/at what disease prevalence/i.test(p.statement)) {
        const sensP = Number(matchOrThrow(p.statement, /sensitivity ([-0-9.]+)%/i)[1])
        const specP = Number(matchOrThrow(p.statement, /specificity ([-0-9.]+)%/i)[1])
        const targetPPVP = Number(matchOrThrow(p.statement, /equal ([-0-9.]+)%/i)[1])

        const fprP = 100 - specP
        const target = targetPPVP / 100
        const sens = sensP / 100
        const fpr = fprP / 100
        // target = (sens * p) / (sens * p + fpr * (1 - p))
        // target * sens * p + target * fpr - target * fpr * p = sens * p
        // target * fpr = p * (sens * (1 - target) + target * fpr)
        const expectedP = (target * fpr) / (sens * (1 - target) + target * fpr)
        expect(val, `seed ${seed}`).toBeCloseTo(expectedP, 6)
      } else if (/calculate the post-test odds/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /odds of \$\\frac\{(\d+)\}\{(\d+)\}\$/)
        const num = Number(m[1])
        const den = Number(m[2])
        const lr = Number(matchOrThrow(p.statement, /(?:\\text\{LR\}|LR)\^\+ = ([-0-9.]+)/)[1])

        const expectedPost = (num / den) * lr
        expect(val, `seed ${seed}`).toBeCloseTo(expectedPost, 6)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: false positive paradox numeric, choice questions', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('ppv_prevalence').generate(createRng(seed), 3)

      if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)
        const prevP = Number(matchOrThrow(p.statement, /prevalence ([-0-9.]+)%/i)[1])
        const sensP = Number(matchOrThrow(p.statement, /sensitivity ([-0-9.]+)%/i)[1])
        const specP = Number(matchOrThrow(p.statement, /specificity ([-0-9.]+)%/i)[1])

        const N = 10000
        const diseased = (N * prevP) / 100
        const healthy = N - diseased
        const tp = (diseased * sensP) / 100
        const fp = (healthy * (100 - specP)) / 100

        expect(val, `seed ${seed}`).toBeCloseTo(fp / tp, 6)
      } else if (p.answer.kind === 'choice') {
        const ans = p.answer
        expect(typeof ans.correctId, `seed ${seed}`).toBe('string')
        expect(ans.options.some((o) => o.id === ans.correctId), `seed ${seed}`).toBe(true)
      } else {
        throw new Error(`seed ${seed}: unrecognised answer type`)
      }
    }
  })
})

describe('error_propagation', () => {
  it('tier 1: add/sub error, scaled error, power law error', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('error_propagation').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/scaled to \$?f =/i.test(p.statement)) {
        const sx = Number(matchOrThrow(p.statement, /\\pm ([-0-9.]+)/)[1])
        const a = Number(matchOrThrow(p.statement, /f = ([-0-9.]+)x/)[1])
        const expected = Math.abs(a) * sx
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 6)
      } else if (/percentage relative error \$?r_f/i.test(p.statement)) {
        const rx = Number(matchOrThrow(p.statement, /r_x = .*? = ([-0-9.]+)\\%/)[1])
        const nMatch = p.statement.match(/x\^\{*(-?\d+)/)
        const n = nMatch ? Number(nMatch[1]) : 1
        const expected = Math.abs(n) * rx
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 6)
      } else if (/calculate the absolute uncertainty \$?\\sigma_f/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /x = \d+ \\pm (\d+).*?y = \d+ \\pm (\d+)/)
        const sx = Number(m[1])
        const sy = Number(m[2])
        const expected = Math.sqrt(sx * sx + sy * sy)
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 6)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: mult/div relative error, partial deriv error simple, volume/area error', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('error_propagation').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected number answer`)
      const val = numberValue(p.answer.value)

      if (/percentage relative error/i.test(p.statement)) {
        const rxMatch = p.statement.match(/r_[x1AhImQ] = ([-0-9.]+)\\%/i) ?? p.statement.match(/r_x = ([-0-9.]+)/i)
        const ryMatch = p.statement.match(/r_[y2hVvR] = ([-0-9.]+)\\%/i) ?? p.statement.match(/r_y = ([-0-9.]+)/i)
        if (!rxMatch || !ryMatch) throw new Error(`cannot match rx ry in ${p.statement}`)
        const rx = Number(rxMatch[1])
        const ry = Number(ryMatch[1])
        const expected = Math.sqrt(rx * rx + ry * ry)
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 6)
      } else if (/using partial derivatives|evaluated at/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /x = (\d+) \\pm (\d+).*?y = (\d+) \\pm (\d+)/)
        const x0 = Number(m[1])
        const sx = Number(m[2])
        const y0 = Number(m[3])
        const sy = Number(m[4])

        let dfdx: number
        let dfdy: number
        if (/f\(x, y\) = x \\cdot y/i.test(p.statement)) {
          dfdx = y0
          dfdy = x0
        } else if (/f\(x, y\) = x\^2 y/i.test(p.statement)) {
          dfdx = 2 * x0 * y0
          dfdy = x0 * x0
        } else if (/x\^2 \+ y\^2/i.test(p.statement)) {
          dfdx = 2 * x0
          dfdy = 2 * y0
        } else if (/x\^2 - y\^2/i.test(p.statement)) {
          dfdx = 2 * x0
          dfdy = -2 * y0
        } else {
          throw new Error(`unrecognised partial derivative function in statement: ${p.statement}`)
        }

        const expected = Math.sqrt(Math.pow(dfdx * sx, 2) + Math.pow(dfdy * sy, 2))
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 6)
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: clinical lab propagation, complex partial deriv, concept choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('error_propagation').generate(createRng(seed), 3)

      if (p.answer.kind === 'choice') {
        const ans = p.answer
        expect(typeof ans.correctId, `seed ${seed}`).toBe('string')
        expect(ans.options.some((o) => o.id === ans.correctId), `seed ${seed}`).toBe(true)
      } else if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)

        if (/Cardiac Output|Vascular resistance|Oxygen Delivery/i.test(p.statement)) {
          const matches = [...p.statement.matchAll(/r_{[a-zA-Z0-9_]+} = ([-0-9.]+)\\%|r_[a-zA-Z0-9_]+ = ([-0-9.]+)\\%/g)]
          if (matches.length < 2) throw new Error(`cannot match relative errors in ${p.statement}`)
          const r1 = Number(matches[0][1] || matches[0][2])
          const r2 = Number(matches[1][1] || matches[1][2])
          const expected = Math.sqrt(r1 * r1 + r2 * r2)
          expect(val, `seed ${seed}`).toBeCloseTo(expected, 6)
        } else if (/Serum Anion Gap/i.test(p.statement)) {
          const sNa = Number(matchOrThrow(p.statement, /\\sigma_\{Na\} = ([-0-9.]+)/)[1])
          const sCl = Number(matchOrThrow(p.statement, /\\sigma_\{Cl\} = ([-0-9.]+)/)[1])
          const sHCO3 = Number(matchOrThrow(p.statement, /\\sigma_\{HCO_3\} = ([-0-9.]+)/)[1])
          const expected = Math.sqrt(sNa * sNa + sCl * sCl + sHCO3 * sHCO3)
          expect(val, `seed ${seed}`).toBeCloseTo(expected, 6)
        } else if (/using partial derivatives|biophysical potential|evaluated at/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /x = (\d+) \\pm (\d+).*?y = (\d+) \\pm (\d+)/)
          const x0 = Number(m[1])
          const sx = Number(m[2])
          const y0 = Number(m[3])
          const sy = Number(m[4])

          let dfdx: number
          let dfdy: number
          if (/x\^2 \+ y\^2/i.test(p.statement)) {
            dfdx = 2 * x0
            dfdy = 2 * y0
          } else if (/x\^2 - y\^2/i.test(p.statement)) {
            dfdx = 2 * x0
            dfdy = -2 * y0
          } else if (/x \\cdot y/i.test(p.statement)) {
            dfdx = y0
            dfdy = x0
          } else if (/x\^2 y/i.test(p.statement)) {
            dfdx = 2 * x0 * y0
            dfdy = x0 * x0
          } else {
            throw new Error(`unrecognised partial deriv statement: ${p.statement}`)
          }

          const expected = Math.sqrt(Math.pow(dfdx * sx, 2) + Math.pow(dfdy * sy, 2))
          expect(val, `seed ${seed}`).toBeCloseTo(expected, 6)
        } else {
          throw new Error(`seed ${seed}: unrecognised numeric statement: ${p.statement}`)
        }
      } else {
        throw new Error(`seed ${seed}: unrecognised answer type`)
      }
    }
  })

  describe('variety target check', () => {
    const templates = ['confusion_matrix', 'ppv_prevalence', 'error_propagation']
    for (const skillId of templates) {
      for (const tier of [1, 2, 3] as const) {
        it(`${skillId} tier ${tier} has >= 40 distinct statements`, () => {
          const seen = new Set<string>()
          for (let seed = 1; seed <= SEEDS; seed += 1) {
            const p = getTemplate(skillId).generate(createRng(seed), tier)
            seen.add(p.statement)
          }
          expect(seen.size, `${skillId} tier ${tier}`).toBeGreaterThanOrEqual(40)
        })
      }
    }
  })
})
