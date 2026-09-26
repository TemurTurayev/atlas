import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'
import type { Problem } from '../types'

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

function checkCleanFraction(latex: string, seed: number): void {
  const m = latex.match(/\\frac\{(-?\d+)\}\{(\d+)\}/)
  if (m) {
    const den = Number(m[2])
    expect(den, `seed ${seed} fraction denominator of "${latex}"`).toBeLessThanOrEqual(20)
  }
}

function verifySolutionStepNumber(p: Problem, seed: number): void {
  const lastStep = p.solution[p.solution.length - 1]
  const tex = lastStep.tex || lastStep.text
  if (p.answer.kind === 'number') {
    checkCleanFraction(p.answer.value, seed)
    const m = tex.match(/=\s*(-?\d+(?:\.\d+)?(?:\\sqrt\{\d+\})?(?:\\pi)?(?:\\ln\(\d+\))?|\\frac\{[^}]+\}\{[^}]+\}(?:\\sqrt\{\d+\})?(?:\\ln\(\d+\))?|e^\{-[^}]+\}|\\frac\{1\}\{1\+e\^\{[^}]+\}\})\s*$/)
    if (m) {
      const stepVal = numberValue(m[1])
      const ansVal = numberValue(p.answer.value)
      expect(stepVal, `seed ${seed} solution text number`).toBeCloseTo(ansVal, 3)
    }
  }
}

describe('ideal_gas', () => {
  it('tier 1: ideal gas law pV=nRT, Boyle, Charles', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('ideal_gas').generate(createRng(seed), 1)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/find the pressure p/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /n = (\d+)\$.*?V = ([\d.]+)\$.*?t = (\d+)/)
        const n = Number(m[1])
        const V = Number(m[2])
        const t = Number(m[3])
        const T = t + 273
        expect(val, `seed ${seed}`).toBeCloseTo((n * 8.3 * T) / V, 2)
      } else if (/find its volume V/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /n = (\d+)\$.*?p = (\d+)\$.*?t = (\d+)/)
        const n = Number(m[1])
        const pPa = Number(m[2])
        const t = Number(m[3])
        const T = t + 273
        expect(val, `seed ${seed}`).toBeCloseTo((n * 8.3 * T) / pPa, 4)
      } else if (/find the amount of gas n/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /p = (\d+)\$.*?V = ([\d.]+)\$.*?t = (\d+)/)
        const pPa = Number(m[1])
        const V = Number(m[2])
        const t = Number(m[3])
        const T = t + 273
        expect(val, `seed ${seed}`).toBeCloseTo((pPa * V) / (8.3 * T), 4)
      } else if (/isothermal process/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /\$V_1 = ([\d.]+)\$ m\$\^3\$ at pressure \$p_1 = (\d+)\$ Pa to volume \$V_2 = ([\d.]+)\$/)
        const V1 = Number(m[1])
        const p1 = Number(m[2])
        const V2 = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo((p1 * V1) / V2, 2)
      } else if (/constant pressure/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /t_1 = (-?\d+)\^{\\circ}\$C to \$t_2 = (-?\d+)\^{\\circ}\$C.*?V_1 = (\d+)\$/)
        const t1 = Number(m[1])
        const t2 = Number(m[2])
        const V1 = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo((V1 * (t2 + 273)) / (t1 + 273), 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 2: combined gas law, Gay-Lussac, gas density', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('ideal_gas').generate(createRng(seed), 2)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/combined gas law|changes state from/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /p_1 = (\d+)\$ Pa, \$V_1 = (\d+)\$ L, \$t_1 = (-?\d+)\^{\\circ}\$C to \$p_2 = (\d+)\$ Pa, \$t_2 = (-?\d+)\^{\\circ}\$C/)
        const p1 = Number(m[1])
        const V1 = Number(m[2])
        const t1 = Number(m[3])
        const p2 = Number(m[4])
        const t2 = Number(m[5])
        expect(val, `seed ${seed}`).toBeCloseTo((p1 * V1 * (t2 + 273)) / (p2 * (t1 + 273)), 4)
      } else if (/find final temperature t_2/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /p_1 = (\d+)\$ Pa and \$t_1 = (-?\d+)\^{\\circ}\$C.*?p_2 = (\d+)\$/)
        const p1 = Number(m[1])
        const t1 = Number(m[2])
        const p2 = Number(m[3])
        const T2 = ((t1 + 273) * p2) / p1
        expect(val, `seed ${seed}`).toBeCloseTo(T2 - 273, 4)
      } else if (/find final pressure p_2/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /p_1 = (\d+)\$ Pa and \$t_1 = (-?\d+)\^{\\circ}\$C.*?t_2 = (-?\d+)\^{\\circ}\$C/)
        const p1 = Number(m[1])
        const t1 = Number(m[2])
        const t2 = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo((p1 * (t2 + 273)) / (t1 + 273), 4)
      } else if (/density/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /M = ([\d.]+).*?p = (\d+)\$.*?t = (\d+)/)
        const M = Number(m[1])
        const pPa = Number(m[2])
        const t = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo((pPa * M) / (8.3 * (t + 273)), 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 3: connecting two vessels, isobaric temp change, gas law choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('ideal_gas').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') {
        if (p.answer.kind === 'choice') {
          expect(p.answer.options.length).toBe(4)
          expect(p.answer.correctId).toBe('correct')
        }
        continue
      }
      const val = numberValue(p.answer.value)

      if (/equilibrium pressure p_f/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /V_1 = (\d+)\$ L and \$V_2 = (\d+)\$ L.*?p_1 = (\d+)\$ kPa and \$p_2 = (\d+)\$ kPa/)
        const V1 = Number(m[1])
        const V2 = Number(m[2])
        const p1 = Number(m[3])
        const p2 = Number(m[4])
        expect(val, `seed ${seed}`).toBeCloseTo((p1 * V1 + p2 * V2) / (V1 + V2), 4)
      } else if (/final temperature t_2/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /V_1 = (\d+)\$.*?t_1 = (\d+)\$.*?V_2 = (\d+)\$/)
        const V1 = Number(m[1])
        const t1 = Number(m[2])
        const V2 = Number(m[3])
        const T2 = ((t1 + 273) * V2) / V1
        expect(val, `seed ${seed}`).toBeCloseTo(T2 - 273, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })
})

describe('maxwell_boltzmann', () => {
  it('tier 1: RMS speed scaling, molar mass ratio, kinetic energy', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('maxwell_boltzmann').generate(createRng(seed), 1)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/increased to T_2 = (\d+)/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /v_\{?\\text\{rms\},1\} = (\d+)\$.*?T_1 = (\d+)\$.*?T_2 = (\d+)\$/)
        const v1 = Number(m[1])
        const T1 = Number(m[2])
        const T2 = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo(v1 * Math.sqrt(T2 / T1), 4)
      } else if (/RMS speed v_1/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /M = (\d+).*?M = (\d+).*?v_2 = (\d+)\$/)
        const M1 = Number(m[1])
        const M2 = Number(m[2])
        const v2 = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo(v2 * Math.sqrt(M2 / M1), 4)
      } else if (/mean translational kinetic energy/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /t = (\d+)/)
        const t = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(1.5 * 8.3 * (t + 273), 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 2: speed ratios, Boltzmann factor, v_rms value', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('maxwell_boltzmann').generate(createRng(seed), 2)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/v_\{?\\text\{rms\}\}\^2/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /v_p = (\d+)\$/)
        const vp = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo((1.5 * vp * vp), 4)
      } else if (/root-mean-square speed v_\{?\\text\{rms\}\}/i.test(p.statement) && /most probable speed/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /v_p = (\d+)\$/)
        const vp = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(vp * Math.sqrt(1.5), 4)
      } else if (/Boltzmann distribution/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /\\Delta E = (\d+) kT\$/)
        const c = Number(m[1])
        if (/N_2.*N_1/.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(Math.exp(-c), 4)
        } else {
          expect(val, `seed ${seed}`).toBeCloseTo(Math.exp(c), 4)
        }
      } else if (/3kT\/m = (\d+)/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /3kT\/m = (\d+)/)
        const v2 = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(Math.sqrt(v2), 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 3: distribution curve choice, two-state energy, kinetic pressure relation', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('maxwell_boltzmann').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') {
        if (p.answer.kind === 'choice') {
          expect(p.answer.options.length).toBe(4)
          expect(p.answer.correctId).toBe('correct')
        }
        continue
      }
      const val = numberValue(p.answer.value)

      if (/fraction of molecules in the upper state/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /\\Delta E = (\d+) kT\$/)
        const c = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(1 / (1 + Math.exp(c)), 4)
      } else if (/units of kT/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /e\^\{-(\d+)\}/)
        const c = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(c, 4)
      } else if (/exerts pressure p = (\d+)/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /\\rho = (\d+)\$.*?p = (\d+)\$/)
        const rho = Number(m[1])
        const pPa = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(Math.sqrt((3 * pPa) / rho), 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })
})

describe('first_law', () => {
  it('tier 1: first law delta U, water heating, water mixing', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('first_law').generate(createRng(seed), 1)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/internal energy \\Delta U/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /Q = (\d+)\$.*?W = (\d+)\$/)
        const Q = Number(m[1])
        const W = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(Q - W, 4)
      } else if (/heat Q absorbed by the gas/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /W = (\d+)\$.*?\\Delta U = (\d+)\$/)
        const W = Number(m[1])
        const dU = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(dU + W, 4)
      } else if (/work W done by the gas/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /Q = (\d+)\$.*?\\Delta U = (\d+)\$/)
        const Q = Number(m[1])
        const dU = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(Q - dU, 4)
      } else if (/raise the temperature of m = (\d+)/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$.*?\\Delta T = (\d+)/)
        const mass = Number(m[1])
        const dt = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(mass * 4200 * dt, 4)
      } else if (/final equilibrium temperature t_f/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m_1 = (\d+)\$.*?t_1 = (\d+)\$.*?m_2 = (\d+)\$.*?t_2 = (\d+)\$/)
        const m1 = Number(m[1])
        const t1 = Number(m[2])
        const m2 = Number(m[3])
        const t2 = Number(m[4])
        expect(val, `seed ${seed}`).toBeCloseTo((m1 * t1 + m2 * t2) / (m1 + m2), 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 2: monatomic gas heat capacities, latent heat, isothermal/isochoric process', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('first_law').generate(createRng(seed), 2)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/constant volume.*Q_V/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /n = (\d+)\$.*?\\Delta T = (\d+)/)
        const n = Number(m[1])
        const dT = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(1.5 * n * 8.3 * dT, 4)
      } else if (/constant pressure.*Q_p/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /n = (\d+)\$.*?\\Delta T = (\d+)/)
        const n = Number(m[1])
        const dT = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(2.5 * n * 8.3 * dT, 4)
      } else if (/melt m = (\d+)/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$/)
        const mass = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(mass * 330000, 4)
      } else if (/vaporize m = (\d+)/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$/)
        const mass = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(mass * 2260000, 4)
      } else if (/isothermal expansion/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /W = (\d+)\$/)
        const W = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(W, 4)
      } else if (/isochoric process/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /Q = (\d+)\$/)
        const Q = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(Q, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 3: calorimeter metal water, isobaric expansion, first law sign choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('first_law').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') {
        if (p.answer.kind === 'choice') {
          expect(p.answer.options.length).toBe(4)
          expect(p.answer.correctId).toBe('correct')
        }
        continue
      }
      const val = numberValue(p.answer.value)

      if (/specific heat capacity c_m/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m_m = (\d+)\$.*?t_m = (\d+)\$.*?m_w = (\d+)\$.*?t_w = (\d+)\$.*?t_f = (\d+)\$/)
        const mm = Number(m[1])
        const tm = Number(m[2])
        const mw = Number(m[3])
        const tw = Number(m[4])
        const tf = Number(m[5])
        expect(val, `seed ${seed}`).toBeCloseTo((mw * 4200 * (tf - tw)) / (mm * (tm - tf)), 4)
      } else if (/work done W BY the gas/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /p = (\d+)\$.*?\\Delta V = ([\d.]+)\$/)
        const pPa = Number(m[1])
        const dV = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(pPa * dV, 4)
      } else if (/internal energy \\Delta U in Joules/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /p = (\d+)\$.*?\\Delta V = ([\d.]+)\$/)
        const pPa = Number(m[1])
        const dV = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(1.5 * pPa * dV, 4)
      } else if (/total heat Q absorbed/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /p = (\d+)\$.*?\\Delta V = ([\d.]+)\$/)
        const pPa = Number(m[1])
        const dV = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(2.5 * pPa * dV, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })
})

describe('processes', () => {
  it('tier 1: isobaric work, pV trapezoid work, isochoric work', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('processes').generate(createRng(seed), 1)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/expands isobarically/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /p = (\d+)\$.*?V_1 = (\d+)\$.*?V_2 = (\d+)\$/)
        const pPa = Number(m[1])
        const V1 = Number(m[2])
        const V2 = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo(pPa * (V2 - V1), 4)
      } else if (/linearly from state/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /V_1, p_1\)[^]*?\(([\d.]+)\\text\{ m\}\^3, (\d+)\\text\{ Pa\}\)[^]*?\(([\d.]+)\\text\{ m\}\^3, (\d+)\\text\{ Pa\}\)/)
        const V1 = Number(m[1])
        const p1 = Number(m[2])
        const V2 = Number(m[3])
        const p2 = Number(m[4])
        expect(val, `seed ${seed}`).toBeCloseTo(0.5 * (p1 + p2) * (V2 - V1), 4)
      } else if (/rigid container of constant volume/i.test(p.statement)) {
        expect(val, `seed ${seed}`).toBe(0)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 2: isothermal work ln, adiabatic pV gamma, trapezoid work', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('processes').generate(createRng(seed), 2)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/expands isothermally/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /p_1 = (\d+)\$.*?V_1 = (\d+)\$.*?V_2 = (\d+)\$/)
        const p1 = Number(m[1])
        const V1 = Number(m[2])
        const V2 = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo(p1 * V1 * Math.log(V2 / V1), 4)
      } else if (/final pressure p_2 in Pascals/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /p_1 = (\d+)\$.*?factor of (\d+)/)
        const p1 = Number(m[1])
        const r = Number(m[2])
        const mult = r === 8 ? 32 : 243
        expect(val, `seed ${seed}`).toBeCloseTo(p1 * mult, 4)
      } else if (/final temperature t_2/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /t_1 = (\d+)\$.*?factor of (\d+)/)
        const t1 = Number(m[1])
        const r = Number(m[2])
        const tempMult = r === 8 ? 4 : 9
        const T2 = (t1 + 273) * tempMult
        expect(val, `seed ${seed}`).toBeCloseTo(T2 - 273, 4)
      } else if (/straight-line path on a pV diagram/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /V_1, p_1\)[^]*?\(([\d.]+)\\text\{ m\}\^3, (\d+)\\text\{ Pa\}\)[^]*?\(([\d.]+)\\text\{ m\}\^3, (\d+)\\text\{ Pa\}\)/)
        const V1 = Number(m[1])
        const p1 = Number(m[2])
        const V2 = Number(m[3])
        const p2 = Number(m[4])
        expect(val, `seed ${seed}`).toBeCloseTo(0.5 * (p1 + p2) * (V2 - V1), 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 3: rectangular cycle, triangular cycle, adiabatic work', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('processes').generate(createRng(seed), 3)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/rectangular cycle/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /p_1 = (\d+)\$.*?p_2 = (\d+)\$.*?V_1 = (\d+)\$.*?V_2 = (\d+)\$/)
        const p1 = Number(m[1])
        const p2 = Number(m[2])
        const V1 = Number(m[3])
        const V2 = Number(m[4])
        expect(val, `seed ${seed}`).toBeCloseTo((p2 - p1) * (V2 - V1), 4)
      } else if (/triangular cyclic process/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /V_1, p_1\)[^]*?\((\d+)\\text\{ m\}\^3, (\d+)\\text\{ Pa\}\)[^]*?\)\s*=\s*\(([\d.]+)\\text\{ m\}\^3, (\d+)\\text\{ Pa\}\)[^]*?\)\s*=\s*\(([\d.]+)\\text\{ m\}\^3, (\d+)\\text\{ Pa\}\)/)
        const V1 = Number(m[1])
        const p1 = Number(m[2])
        const V2 = Number(m[3])
        const p2 = Number(m[6])
        expect(val, `seed ${seed}`).toBeCloseTo(0.5 * (p2 - p1) * (V2 - V1), 4)
      } else if (/adiabatic expansion of a monatomic gas/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /p_1 V_1 = (\d+)\$.*?p_2 V_2 = (\d+)\$/)
        const p1V1 = Number(m[1])
        const p2V2 = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(1.5 * (p1V1 - p2V2), 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })
})

describe('entropy_2nd_law', () => {
  it('tier 1: Carnot efficiency, work/heat engine, isothermal entropy', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('entropy_2nd_law').generate(createRng(seed), 1)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/theoretical efficiency \\eta/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /t_h = (\d+)\^{\\circ}\$C.*?t_c = (\d+)\^{\\circ}\$C/)
        const th = Number(m[1])
        const tc = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(1 - (tc + 273) / (th + 273), 4)
      } else if (/work output W per cycle/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /Q_h = (\d+)\$.*?\\eta = \\frac\{(\d+)\}\{(\d+)\}\$/)
        const Qh = Number(m[1])
        const num = Number(m[2])
        const den = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo((Qh * num) / den, 4)
      } else if (/heat Q_c rejected/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /Q_h = (\d+)\$.*?\\eta = \\frac\{(\d+)\}\{(\d+)\}\$/)
        const Qh = Number(m[1])
        const num = Number(m[2])
        const den = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo(Qh * (1 - num / den), 4)
      } else if (/entropy change \\Delta S in J\/K/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /Q = (\d+)\$.*?t = (\d+)/)
        const Q = Number(m[1])
        const t = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(Q / (t + 273), 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 2: refrigerator COP, heating entropy ln, entropy mixing', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('entropy_2nd_law').generate(createRng(seed), 2)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/coefficient of performance/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /t_c = (-?\d+)\^{\\circ}\$C.*?t_h = (-?\d+)\^{\\circ}\$C/)
        const tc = Number(m[1])
        const th = Number(m[2])
        const Tc = tc + 273
        const Th = th + 273
        expect(val, `seed ${seed}`).toBeCloseTo(Tc / (Th - Tc), 4)
      } else if (/entropy change \\Delta S in J\/K in terms of \\ln/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$.*?c = (\d+)\$.*?T_1 = (\d+)\$.*?T_2 = (\d+)\$/)
        const mMass = Number(m[1])
        const c = Number(m[2])
        const T1 = Number(m[3])
        const T2 = Number(m[4])
        expect(val, `seed ${seed}`).toBeCloseTo(mMass * c * Math.log(T2 / T1), 4)
      } else if (/net entropy change of the universe/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /Q = (\d+)\$.*?T_h = (\d+)\$.*?T_c = (\d+)\$/)
        const Q = Number(m[1])
        const Th = Number(m[2])
        const Tc = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo(-Q / Th + Q / Tc, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 3: entropy heating ln, ice melting, Carnot work/heat, net entropy flow, Carnot improvement', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('entropy_2nd_law').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') {
        if (p.answer.kind === 'choice') {
          expect(p.answer.options.length).toBe(4)
          expect(p.answer.correctId).toBe('correct')
        }
        continue
      }
      const val = numberValue(p.answer.value)

      if (/entropy change \\Delta S in J\/K in terms of \\ln/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$.*?c = (\d+)\$.*?T_1 = (\d+)\$.*?T_2 = (\d+)\$/)
        const mMass = Number(m[1])
        const c = Number(m[2])
        const T1 = Number(m[3])
        const T2 = Number(m[4])
        expect(val, `seed ${seed}`).toBeCloseTo(mMass * c * Math.log(T2 / T1), 4)
      } else if (/melt ice isothermally/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /Q = (\d+)\$/)
        const Q = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(Q / 273, 4)
      } else if (/work output W per cycle/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /Q_h = (\d+)\$.*?T_h = (\d+)\$.*?T_c = (\d+)\$/)
        const Qh = Number(m[1])
        const Th = Number(m[2])
        const Tc = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo(Qh * (1 - Tc / Th), 4)
      } else if (/heat Q_c rejected to the cold reservoir/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /Q_h = (\d+)\$.*?T_h = (\d+)\$.*?T_c = (\d+)\$/)
        const Qh = Number(m[1])
        const Th = Number(m[2])
        const Tc = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo(Qh * (Tc / Th), 4)
      } else if (/net entropy change of the universe/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /Q = (\d+)\$.*?T_h = (\d+)\$.*?T_c = (\d+)\$/)
        const Q = Number(m[1])
        const Th = Number(m[2])
        const Tc = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo(-Q / Th + Q / Tc, 4)
      } else if (/by how many Kelvin must T_c be reduced/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /T_h = (\d+)\$.*?T_c = (\d+)\$.*?\\eta_2 = \\frac\{(\d+)\}\{(\d+)\}\$/)
        const Th = Number(m[1])
        const Tc = Number(m[2])
        const num = Number(m[3])
        const den = Number(m[4])
        const newTc = (1 - num / den) * Th
        expect(val, `seed ${seed}`).toBeCloseTo(Tc - newTc, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })
})

