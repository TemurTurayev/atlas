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

function verifySolutionStepNumber(p: Problem, seed: number): void {
  const lastStep = p.solution[p.solution.length - 1]
  const tex = lastStep.tex || lastStep.text
  if (p.answer.kind === 'number') {
    const m = tex.match(/=\s*(-?\d+(?:\.\d+)?(?:\\sqrt\{\d+\})?(?:\\pi)?|\\frac\{[^}]+\}\{[^}]+\}(?:\\sqrt\{\d+\})?)\s*$/)
    if (m) {
      const stepVal = numberValue(m[1])
      const ansVal = numberValue(p.answer.value)
      expect(stepVal, `seed ${seed} solution text number`).toBeCloseTo(ansVal, 3)
    }
  }
}

describe('kinematics', () => {
  it('tier 1: constant acceleration, polynomial velocity, displacement integral', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('kinematics').generate(createRng(seed), 1)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/accelerates at/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /v_0 = (\d+)\$.*?a = (\d+)\$.*?t = (\d+)\$/)
        const v0 = Number(m[1])
        const a = Number(m[2])
        const t = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo(v0 + a * t, 4)
      } else if (/position of a particle/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /x\(t\) = (.*?)\$ meters.*?t = (\d+)\$/)
        const t0 = Number(m[2])
        const polyStr = m[1]
        const mC2 = polyStr.match(/(?:(\d+))?t\^2/)
        const c2 = mC2 ? (mC2[1] ? Number(mC2[1]) : 1) : 0
        const mC1 = polyStr.match(/(?:(\d+))?t(?!\^)/)
        const c1 = mC1 ? (mC1[1] ? Number(mC1[1]) : 1) : 0
        const expectedV = 2 * c2 * t0 + c1
        expect(val, `seed ${seed}`).toBeCloseTo(expectedV, 4)
      } else if (/displacement/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /v\(t\) = (.*?)\$ m\/s.*?to \$t = (\d+)\$/)
        const t0 = Number(m[2])
        const vStr = m[1]
        const mA = vStr.match(/(?:(\d+))?t/)
        const a = mA ? (mA[1] ? Number(mA[1]) : 1) : 0
        const mB = vStr.match(/\+\s*(\d+)/)
        const b = mB ? Number(mB[1]) : 0
        const expectedDx = 0.5 * a * t0 * t0 + b * t0
        expect(val, `seed ${seed}`).toBeCloseTo(expectedDx, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 2: stopping distance, maximum height time/height, velocity zero, distance given v0 a t', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('kinematics').generate(createRng(seed), 2)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/stopping distance/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /v_0 = (\d+)\$.*?a = (\d+)\$/)
        const v0 = Number(m[1])
        const a = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo((v0 * v0) / (2 * a), 4)
      } else if (/maximum height/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /v_0 = (\d+)\$/)
        const v0 = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo((v0 * v0) / 20, 4)
      } else if (/momentarily comes to rest/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /v\(t\) = -(\d+)t \+ (\d+)\$/)
        const a = Number(m[1])
        const b = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(b / a, 4)
      } else if (/accelerates at/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /v_0 = (\d+)\$.*?a = (\d+)\$.*?t = (\d+)\$/)
        const v0 = Number(m[1])
        const a = Number(m[2])
        const t = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo(v0 * t + 0.5 * a * t * t, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 3: initial speed, two-phase motion, graph concepts', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('kinematics').generate(createRng(seed), 3)
      const ans = p.answer

      if (ans.kind === 'number') {
        const val = numberValue(ans.value)
        if (/decelerates at/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /a = (\d+)\$.*?d = (\d+)\$.*?v = (\d+)\$/)
          const a = Number(m[1])
          const d = Number(m[2])
          const v = Number(m[3])
          expect(val, `seed ${seed}`).toBeCloseTo(Math.sqrt(v * v + 2 * a * d), 4)
        } else if (/accelerates at \$a_1 = (\d+)\$/.test(p.statement)) {
          const m = matchOrThrow(p.statement, /a_1 = (\d+)\$.*?t_1 = (\d+)\$.*?a_2 = (\d+)\$/)
          const a1 = Number(m[1])
          const t1 = Number(m[2])
          const a2 = Number(m[3])
          const v1 = a1 * t1
          const expectedD = 0.5 * a1 * t1 * t1 + (v1 * v1) / (2 * a2)
          expect(val, `seed ${seed}`).toBeCloseTo(expectedD, 4)
        }
        verifySolutionStepNumber(p, seed)
      } else if (ans.kind === 'choice') {
        expect(ans.options.some((o) => o.id === ans.correctId)).toBe(true)
      }
    }
  })
})

describe('projectile', () => {
  it('tier 1: horizontal landing distance, time of flight, max height, fall time', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('projectile').generate(createRng(seed), 1)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/horizontal landing distance/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /v_0 = (\d+)\$.*?h = (\d+)\$/)
        const v0 = Number(m[1])
        const h = Number(m[2])
        const t = Math.sqrt((2 * h) / 10)
        expect(val, `seed ${seed}`).toBeCloseTo(v0 * t, 4)
      } else if (/total time of flight/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /v_0 = (\d+)\$.*?\\alpha = (\d+)\^\\circ/)
        const v0 = Number(m[1])
        const deg = Number(m[2])
        const sinA = deg === 30 ? 0.5 : 1
        expect(val, `seed ${seed}`).toBeCloseTo((2 * v0 * sinA) / 10, 4)
      } else if (/maximum height/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /v_0 = (\d+)\$.*?\\alpha = (\d+)\^\\circ/)
        const v0 = Number(m[1])
        const deg = Number(m[2])
        const sinA = deg === 30 ? 0.5 : deg === 45 ? Math.SQRT1_2 : deg === 60 ? Math.sqrt(3) / 2 : 1
        expect(val, `seed ${seed}`).toBeCloseTo((v0 * v0 * sinA * sinA) / 20, 4)
      } else if (/dropped from rest/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /h = (\d+)\$/)
        const h = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(Math.sqrt((2 * h) / 10), 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 2: range with radicals, find v0 from h and d, apex speed, vertical speed impact', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('projectile').generate(createRng(seed), 2)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/horizontal range/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /v_0 = (\d+)\$.*?\\alpha = (\d+)\^\\circ/)
        const v0 = Number(m[1])
        const deg = Number(m[2])
        const sin2A = Math.sin((2 * deg * Math.PI) / 180)
        expect(val, `seed ${seed}`).toBeCloseTo((v0 * v0 * sin2A) / 10, 4)
      } else if (/find the initial launch speed/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /h = (\d+)\$.*?d = (\d+)\$/)
        const h = Number(m[1])
        const d = Number(m[2])
        const t = Math.sqrt((2 * h) / 10)
        expect(val, `seed ${seed}`).toBeCloseTo(d / t, 4)
      } else if (/apex/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /v_0 = (\d+)\$.*?\\alpha = (\d+)\^\\circ/)
        const v0 = Number(m[1])
        const deg = Number(m[2])
        const cosA = Math.cos((deg * Math.PI) / 180)
        expect(val, `seed ${seed}`).toBeCloseTo(v0 * cosA, 4)
      } else if (/vertical velocity component/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /h = (\d+)\$/)
        const h = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(Math.sqrt(20 * h), 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 3: landing impact speed, max range angle choice, launch speed from max height, peak time', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('projectile').generate(createRng(seed), 3)
      const ans = p.answer

      if (ans.kind === 'number') {
        const val = numberValue(ans.value)
        if (/landing/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /v_0 = (\d+)\$.*?h = (\d+)\$/)
          const v0 = Number(m[1])
          const h = Number(m[2])
          const vy = Math.sqrt(20 * h)
          expect(val, `seed ${seed}`).toBeCloseTo(Math.hypot(v0, vy), 4)
        } else if (/reaches a maximum height/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /\\alpha = (\d+)\^\\circ.*?H = (\d+)\$/)
          const deg = Number(m[1])
          const H = Number(m[2])
          const sinA = Math.sin((deg * Math.PI) / 180)
          expect(val, `seed ${seed}`).toBeCloseTo(Math.sqrt(20 * H) / sinA, 4)
        } else if (/peak of its flight/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /v_0 = (\d+)\$/)
          const v0 = Number(m[1])
          expect(val, `seed ${seed}`).toBeCloseTo(v0 / 10, 4)
        }
        verifySolutionStepNumber(p, seed)
      } else if (ans.kind === 'choice') {
        expect(ans.options.some((o) => o.id === ans.correctId)).toBe(true)
      }
    }
  })
})

describe('newton', () => {
  it('tier 1: F=ma, elevator scale, action-reaction choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('newton').generate(createRng(seed), 1)
      const ans = p.answer

      if (ans.kind === 'number') {
        const val = numberValue(ans.value)
        if (/net force of/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /F = (\d+)\$.*?m = (\d+)\$/)
          const F = Number(m[1])
          const mass = Number(m[2])
          expect(val, `seed ${seed}`).toBeCloseTo(F / mass, 4)
        } else if (/elevator accelerating/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /m = (\d+)\$.*?(upward|downward) at \$a = (\d+)\$/)
          const mass = Number(m[1])
          const isUp = m[2] === 'upward'
          const a = Number(m[3])
          const expectedN = isUp ? mass * (10 + a) : mass * (10 - a)
          expect(val, `seed ${seed}`).toBeCloseTo(expectedN, 4)
        }
        verifySolutionStepNumber(p, seed)
      } else if (ans.kind === 'choice') {
        expect(ans.options.some((o) => o.id === ans.correctId)).toBe(true)
      }
    }
  })

  it('tier 2: friction acceleration, frictionless incline, connected blocks', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('newton').generate(createRng(seed), 2)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/pulled horizontally/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$.*?F = (\d+)\$.*?\\mu = (\d+(?:\.\d+)?)\$/)
        const mass = Number(m[1])
        const F = Number(m[2])
        const mu = Number(m[3])
        const fk = mu * mass * 10
        expect(val, `seed ${seed}`).toBeCloseTo((F - fk) / mass, 4)
      } else if (/frictionless incline/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /\\alpha = (\d+)\^\\circ/)
        const deg = Number(m[1])
        const sinA = Math.sin((deg * Math.PI) / 180)
        expect(val, `seed ${seed}`).toBeCloseTo(10 * sinA, 4)
      } else if (/connected by a string/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m_1 = (\d+)\$.*?m_2 = (\d+)\$.*?F = (\d+)\$/)
        const m1 = Number(m[1])
        const m2 = Number(m[2])
        const F = Number(m[3])
        const a = F / (m1 + m2)
        expect(val, `seed ${seed}`).toBeCloseTo(m1 * a, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 3: Atwood machine, incline with friction, elevator braking cable, static friction threshold', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('newton').generate(createRng(seed), 3)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/Atwood machine/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m_1 = (\d+)\$.*?m_2 = (\d+)\$/)
        const m1 = Number(m[1])
        const m2 = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(((m1 - m2) / (m1 + m2)) * 10, 4)
      } else if (/friction coefficient/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /\\mu = (\d+(?:\.\d+)?)\$/)
        const mu = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(5 * Math.sqrt(3) - 5 * mu, 4)
      } else if (/descending at/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /M = (\d+)\$.*?v_0 = (\d+)\$.*?d = (\d+)\$/)
        const M = Number(m[1])
        const v0 = Number(m[2])
        const d = Number(m[3])
        const a0 = (v0 * v0) / (2 * d)
        expect(val, `seed ${seed}`).toBeCloseTo(M * (10 + a0), 4)
      } else if (/minimum coefficient of static friction/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /\\alpha = (\d+)\^\\circ/)
        const deg = Number(m[1])
        const tanA = Math.tan((deg * Math.PI) / 180)
        expect(val, `seed ${seed}`).toBeCloseTo(tanA, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })
})

describe('energy_cons', () => {
  it('tier 1: kinetic/potential energy, work with angle, power', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('energy_cons').generate(createRng(seed), 1)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/kinetic energy/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$.*?v = (\d+)\$/)
        const mass = Number(m[1])
        const v = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(0.5 * mass * v * v, 4)
      } else if (/potential energy/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$.*?h = (\d+)\$/)
        const mass = Number(m[1])
        const h = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(mass * 10 * h, 4)
      } else if (/pulls a box/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /F = (\d+)\$.*?d = (\d+)\$.*?\\theta = (\d+)\^\\circ/)
        const F = Number(m[1])
        const d = Number(m[2])
        const deg = Number(m[3])
        const cosA = Math.cos((deg * Math.PI) / 180)
        expect(val, `seed ${seed}`).toBeCloseTo(F * d * cosA, 4)
      } else if (/performs/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /W = (\d+)\$.*?t = (\d+)\$/)
        const W = Number(m[1])
        const t = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(W / t, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 2: slide speed, spring launch, work-energy stopping', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('energy_cons').generate(createRng(seed), 2)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/frictionless ramp/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /h = (\d+)\$/)
        const h = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(Math.sqrt(20 * h), 4)
      } else if (/spring constant/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /k = (\d+)\$.*?x = (\d+(?:\.\d+)?)\$.*?m = (\d+)\$/)
        const k = Number(m[1])
        const x = Number(m[2])
        const mass = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo(Math.sqrt((k * x * x) / mass), 4)
      } else if (/brakes to a complete stop/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$.*?v_0 = (\d+)\$/)
        const mass = Number(m[1])
        const v0 = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(0.5 * mass * v0 * v0, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 3: spring vertical height, energy lost to friction, average power', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('energy_cons').generate(createRng(seed), 3)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/launches a projectile/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /k = (\d+)\$.*?x = (\d+(?:\.\d+)?)\$.*?m = (\d+)\$/)
        const k = Number(m[1])
        const x = Number(m[2])
        const mass = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo((k * x * x) / (20 * mass), 4)
      } else if (/rough ramp/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$.*?h = (\d+)\$.*?v = (\d+)\$/)
        const mass = Number(m[1])
        const h = Number(m[2])
        const v = Number(m[3])
        const Ep = mass * 10 * h
        const Ek = 0.5 * mass * v * v
        expect(val, `seed ${seed}`).toBeCloseTo(Ep - Ek, 4)
      } else if (/accelerates from rest/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$.*?v = (\d+)\$.*?t = (\d+)\$/)
        const mass = Number(m[1])
        const v = Number(m[2])
        const t = Number(m[3])
        const Ek = 0.5 * mass * v * v
        expect(val, `seed ${seed}`).toBeCloseTo(Ek / t, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })
})

describe('momentum_cons', () => {
  it('tier 1: momentum magnitude, inelastic 1D collision, recoil velocity', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('momentum_cons').generate(createRng(seed), 1)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/magnitude of its linear momentum/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$.*?v = (\d+)\$/)
        const mass = Number(m[1])
        const v = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(mass * v, 4)
      } else if (/stick together/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m_1 = (\d+)\$.*?v_1 = (\d+)\$.*?m_2 = (\d+)\$/)
        const m1 = Number(m[1])
        const v1 = Number(m[2])
        const m2 = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo((m1 * v1) / (m1 + m2), 4)
      } else if (/recoil velocity/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /M = (\d+)\$.*?m = (\d+)\$.*?v = (\d+)\$/)
        const M = Number(m[1])
        const mass = Number(m[2])
        const vBall = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo((mass * vBall) / M, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 2: elastic target rest, dEk in inelastic, impulse rebound, impulse force time', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('momentum_cons').generate(createRng(seed), 2)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/collides elastically/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m_1 = (\d+)\$.*?v_1 = (\d+)\$.*?m_2 = (\d+)\$.*?body (\d+)/)
        const m1 = Number(m[1])
        const v1 = Number(m[2])
        const m2 = Number(m[3])
        const bodyNum = Number(m[4])
        const expectedVal = bodyNum === 2 ? ((2 * m1) / (m1 + m2)) * v1 : ((m1 - m2) / (m1 + m2)) * v1
        expect(val, `seed ${seed}`).toBeCloseTo(expectedVal, 4)
      } else if (/kinetic energy lost/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m_1 = (\d+)\$.*?v_1 = (\d+)\$.*?m_2 = (\d+)\$/)
        const m1 = Number(m[1])
        const v1 = Number(m[2])
        const m2 = Number(m[3])
        const Eki = 0.5 * m1 * v1 * v1
        const vf = (m1 * v1) / (m1 + m2)
        const Ekf = 0.5 * (m1 + m2) * vf * vf
        expect(val, `seed ${seed}`).toBeCloseTo(Eki - Ekf, 4)
      } else if (/rebounds in the opposite direction/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$.*?v_1 = (\d+)\$.*?v_2 = (\d+)\$/)
        const mass = Number(m[1])
        const v1 = Number(m[2])
        const v2 = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo(mass * (v1 + v2), 4)
      } else if (/acts on an object during a collision/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /F = (\d+)\$.*?\\Delta t = (\d+(?:\.\d+)?)\$/)
        const F = Number(m[1])
        const dt = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(F * dt, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 3: ballistic pendulum, head-on elastic, collision choice, explosion fragments', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('momentum_cons').generate(createRng(seed), 3)
      const ans = p.answer

      if (ans.kind === 'number') {
        const val = numberValue(ans.value)
        if (/ballistic|pendulum/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /m = (\d+(?:\.\d+)?)\$.*?M = (\d+(?:\.\d+)?)\$.*?h = (\d+(?:\.\d+)?)\$/)
          const mass = Number(m[1])
          const M = Number(m[2])
          const h = Number(m[3])
          const vf = Math.sqrt(20 * h)
          expect(val, `seed ${seed}`).toBeCloseTo(((mass + M) / mass) * vf, 4)
        } else if (/identical bodies/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /v_1 = (\d+)\$.*?v_2 = -(\d+)\$.*?final velocity of body ([12])/i)
          const v1 = Number(m[1])
          const v2 = Number(m[2])
          const target = m[3]
          const expected = target === '2' ? v1 : -v2
          expect(val, `seed ${seed}`).toBeCloseTo(expected, 4)
        } else if (/explodes into two pieces/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /m_1 = (\d+)\$.*?m_2 = (\d+)\$.*?v_([12]) = (\d+)\$/)
          const m1 = Number(m[1])
          const m2 = Number(m[2])
          const givenIdx = m[3]
          const givenV = Number(m[4])
          const expected = givenIdx === '1' ? (m1 * givenV) / m2 : (m2 * givenV) / m1
          expect(val, `seed ${seed}`).toBeCloseTo(expected, 4)
        }
        verifySolutionStepNumber(p, seed)
      } else if (ans.kind === 'choice') {
        expect(ans.options.some((o) => o.id === ans.correctId)).toBe(true)
      }
    }
  })
})
