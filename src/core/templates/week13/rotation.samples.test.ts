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

describe('oscillator_phase', () => {
  it('tier 1: period/frequency, max speed/accel, total energy', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('oscillator_phase').generate(createRng(seed), 1)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/Find its period/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /\\omega = (\d+)\$/)
        const omega = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo((2 * Math.PI) / omega, 4)
      } else if (/Find its frequency/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /\\omega = (\d+)\$/)
        const omega = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(omega / (2 * Math.PI), 4)
      } else if (/maximum speed/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /A = (\d+)\$.*?\\omega = (\d+)\$/)
        const A = Number(m[1])
        const omega = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(A * omega, 4)
      } else if (/maximum acceleration/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /A = (\d+)\$.*?\\omega = (\d+)\$/)
        const A = Number(m[1])
        const omega = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(A * omega * omega, 4)
      } else if (/total mechanical energy/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /k = (\d+)\$.*?A = (\d+)\$/)
        const k = Number(m[1])
        const A = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(0.5 * k * A * A, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 2: amplitude from initial, speed at position, diff eq acceleration', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('oscillator_phase').generate(createRng(seed), 2)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/initial displacement/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /\\omega = (\d+)\$.*?x\(0\) = (\d+)\$.*?v\(0\) = -(\d+)\$/)
        const omega = Number(m[1])
        const x0 = Number(m[2])
        const v0 = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo(Math.sqrt(x0 * x0 + (v0 / omega) * (v0 / omega)), 4)
      } else if (/speed in m\/s when passing/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /\\omega = (\d+)\$.*?A = (\d+)\$.*?x = (\d+)\$/)
        const omega = Number(m[1])
        const A = Number(m[2])
        const x = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo(omega * Math.sqrt(A * A - x * x), 4)
      } else if (/acceleration in m\/s\^2 at time/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /\\omega = (\d+)\$.*?x = (\d+)\$/)
        const omega = Number(m[1])
        const x = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(-omega * omega * x, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 3: phase space semi-axis, equal energy split, phase space area', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('oscillator_phase').generate(createRng(seed), 3)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/velocity axis/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /A = (\d+)\$.*?\\omega = (\d+)\$/)
        const A = Number(m[1])
        const omega = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(A * omega, 4)
      } else if (/position axis/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /\\omega = (\d+)\$.*?v_\{\\text\{max\}\} = (\d+)\$/)
        const omega = Number(m[1])
        const vmax = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(vmax / omega, 4)
      } else if (/three times the potential energy/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /A = (\d+)\$/)
        const A = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(A / 2, 4)
      } else if (/equal to the potential energy/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /A = (\d+)\$/)
        const A = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(A / Math.SQRT2, 4)
      } else if (/area enclosed by the trajectory/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /x\^2\}\{(\d+)\}.*?v\^2\}\{(\d+)\}/)
        const A2 = Number(m[1])
        const Vmax2 = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(Math.PI * Math.sqrt(A2) * Math.sqrt(Vmax2), 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })
})

describe('rotation', () => {
  it('tier 1: rpm/speed, standard moment of inertia, torque/energy', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('rotation').generate(createRng(seed), 1)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/revolutions per minute/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /(\d+) revolutions per minute/)
        const rpm = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo((Math.PI * rpm) / 30, 4)
      } else if (/rotating disk/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /r = (\d+(?:\.\d+)?)\$.*?\\omega = (\d+)\$/)
        const r = Number(m[1])
        const omega = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(omega * r, 4)
      } else if (/thin ring/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$.*?R = (\d+(?:\.\d+)?)\$/)
        const mass = Number(m[1])
        const R = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(mass * R * R, 4)
      } else if (/uniform disc/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$.*?R = (\d+(?:\.\d+)?)\$/)
        const mass = Number(m[1])
        const R = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(0.5 * mass * R * R, 4)
      } else if (/through its center of mass/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$.*?L = (\d+(?:\.\d+)?)\$/)
        const mass = Number(m[1])
        const L = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo((mass * L * L) / 12, 4)
      } else if (/through one end/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$.*?L = (\d+(?:\.\d+)?)\$/)
        const mass = Number(m[1])
        const L = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo((mass * L * L) / 3, 4)
      } else if (/solid uniform sphere/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m = (\d+)\$.*?R = (\d+(?:\.\d+)?)\$/)
        const mass = Number(m[1])
        const R = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(0.4 * mass * R * R, 4)
      } else if (/lever arm distance/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /F = (\d+)\$.*?r = (\d+(?:\.\d+)?)\$/)
        const F = Number(m[1])
        const r = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(r * F, 4)
      } else if (/rotational kinetic energy/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /I = (\d+)\$.*?\\omega = (\d+)\$/)
        const I = Number(m[1])
        const omega = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(0.5 * I * omega * omega, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 2: parallel axis, angular momentum conservation, torque vector', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('rotation').generate(createRng(seed), 2)
      const ans = p.answer

      if (ans.kind === 'number') {
        const val = numberValue(ans.value)
        if (/parallel-axis theorem/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /m = (\d+)\$.*?L = (\d+(?:\.\d+)?)\$.*?d = (\d+(?:\.\d+)?)\$/)
          const mass = Number(m[1])
          const L = Number(m[2])
          const d = Number(m[3])
          const Icm = (mass * L * L) / 12
          expect(val, `seed ${seed}`).toBeCloseTo(Icm + mass * d * d, 4)
        } else if (/figure skater/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /I_1 = (\d+)\$.*?\\omega_1 = (\d+)\$.*?I_2 = (\d+)\$/)
          const I1 = Number(m[1])
          const w1 = Number(m[2])
          const I2 = Number(m[3])
          expect(val, `seed ${seed}`).toBeCloseTo((I1 * w1) / I2, 4)
        }
        verifySolutionStepNumber(p, seed)
      } else if (ans.kind === 'vector') {
        const m = matchOrThrow(p.statement, /\\vec\{F\} = \(([^)]+)\)\$ N.*?\\vec\{r\} = \(([^)]+)\)\$ m/)
        const [Fx, Fy, Fz] = m[1].split(',').map((s) => Number(s.trim()))
        const [rx, ry, rz] = m[2].split(',').map((s) => Number(s.trim()))

        const norm = (n: number) => (Object.is(n, -0) ? 0 : n)
        const tx = norm(ry * Fz - rz * Fy)
        const ty = norm(rz * Fx - rx * Fz)
        const tz = norm(rx * Fy - ry * Fx)

        expect(ans.components.map((s) => norm(Number(s))), `seed ${seed}`).toEqual([tx, ty, tz])
      }
    }
  })

  it('tier 3: angular momentum vector, rotational work, rolling choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('rotation').generate(createRng(seed), 3)
      const ans = p.answer

      if (ans.kind === 'number') {
        const val = numberValue(ans.value)
        const m = matchOrThrow(p.statement, /I = (\d+)\$.*?\\omega_1 = (\d+)\$.*?\\omega_2 = (\d+)\$/)
        const I = Number(m[1])
        const w1 = Number(m[2])
        const w2 = Number(m[3])
        expect(val, `seed ${seed}`).toBeCloseTo(0.5 * I * (w2 * w2 - w1 * w1), 4)
        verifySolutionStepNumber(p, seed)
      } else if (ans.kind === 'vector') {
        const m = matchOrThrow(p.statement, /m = (\d+)\$.*?\\vec\{r\} = \(([^)]+)\)\$ m.*?\\vec\{v\} = \(([^)]+)\)\$ m\/s/)
        const mass = Number(m[1])
        const [rx, ry, rz] = m[2].split(',').map((s) => Number(s.trim()))
        const [vx, vy, vz] = m[3].split(',').map((s) => Number(s.trim()))

        const norm = (n: number) => (Object.is(n, -0) ? 0 : n)
        const Lx = norm(mass * (ry * vz - rz * vy))
        const Ly = norm(mass * (rz * vx - rx * vz))
        const Lz = norm(mass * (rx * vy - ry * vx))

        expect(ans.components.map((s) => norm(Number(s))), `seed ${seed}`).toEqual([Lx, Ly, Lz])
      } else if (ans.kind === 'choice') {
        expect(ans.options.some((o) => o.id === ans.correctId)).toBe(true)
      }
    }
  })
})

describe('inertia_tensor', () => {
  it('tier 1: diagonal entry, off-diagonal entry, angular momentum component', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('inertia_tensor').generate(createRng(seed), 1)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/moment of inertia entry I_\{zz\}/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m_1 = (\d+)\$.*?\((-?\d+),\s*(-?\d+),\s*0\).*?m_2 = (\d+)\$.*?\((-?\d+),\s*(-?\d+),\s*0\)/)
        const m1 = Number(m[1])
        const x1 = Number(m[2])
        const y1 = Number(m[3])
        const m2 = Number(m[4])
        const x2 = Number(m[5])
        const y2 = Number(m[6])
        expect(val, `seed ${seed}`).toBeCloseTo(m1 * (x1 * x1 + y1 * y1) + m2 * (x2 * x2 + y2 * y2), 4)
      } else if (/product of inertia entry I_\{xy\}/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /m_1 = (\d+)\$.*?\((-?\d+),\s*(-?\d+),\s*0\).*?m_2 = (\d+)\$.*?\((-?\d+),\s*(-?\d+),\s*0\)/)
        const m1 = Number(m[1])
        const x1 = Number(m[2])
        const y1 = Number(m[3])
        const m2 = Number(m[4])
        const x2 = Number(m[5])
        const y2 = Number(m[6])
        expect(val, `seed ${seed}`).toBeCloseTo(-(m1 * x1 * y1 + m2 * x2 * y2), 4)
      } else if (/angular momentum component L_z/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /I_\{zz\} = (\d+)\$.*?\\omega_z = (\d+)\$/)
        const Izz = Number(m[1])
        const wz = Number(m[2])
        expect(val, `seed ${seed}`).toBeCloseTo(Izz * wz, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 2: full matrix, angular momentum vector, principal moment', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('inertia_tensor').generate(createRng(seed), 2)
      const ans = p.answer

      if (ans.kind === 'matrix') {
        const m = matchOrThrow(p.statement, /m_1 = (\d+)\$.*?\((\d+),\s*0,\s*0\).*?m_2 = (\d+)\$.*?\(0,\s*(\d+),\s*0\).*?m_3 = (\d+)\$.*?\(0,\s*0,\s*(\d+)\)/)
        const m1 = Number(m[1])
        const a = Number(m[2])
        const m2 = Number(m[3])
        const b = Number(m[4])
        const m3 = Number(m[5])
        const c = Number(m[6])

        const Ixx = m2 * b * b + m3 * c * c
        const Iyy = m1 * a * a + m3 * c * c
        const Izz = m1 * a * a + m2 * b * b

        const expectedRows = [
          [String(Ixx), '0', '0'],
          ['0', String(Iyy), '0'],
          ['0', '0', String(Izz)],
        ]
        expect(ans.rows, `seed ${seed}`).toEqual(expectedRows)
      } else if (ans.kind === 'vector') {
        const m = matchOrThrow(p.statement, /\\operatorname\{diag\}\((\d+),\s*(\d+),\s*(\d+)\).*?\\vec\{\\omega\} = \((-?\d+),\s*(-?\d+),\s*(-?\d+)\)/)
        const Ixx = Number(m[1])
        const Iyy = Number(m[2])
        const Izz = Number(m[3])
        const wx = Number(m[4])
        const wy = Number(m[5])
        const wz = Number(m[6])

        expect(ans.components.map(Number), `seed ${seed}`).toEqual([Ixx * wx, Iyy * wy, Izz * wz])
      } else if (ans.kind === 'number') {
        const val = numberValue(ans.value)
        const m = matchOrThrow(p.statement, /\\operatorname\{diag\}\((\d+),\s*(\d+),\s*(\d+)\)/)
        const I1 = Number(m[1])
        const I2 = Number(m[2])
        const I3 = Number(m[3])
        const isMax = /maximum/i.test(p.statement)
        expect(val, `seed ${seed}`).toBeCloseTo(isMax ? Math.max(I1, I2, I3) : Math.min(I1, I2, I3), 4)
        verifySolutionStepNumber(p, seed)
      }
    }
  })

  it('tier 3: max principal moment, rotational energy, choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('inertia_tensor').generate(createRng(seed), 3)
      const ans = p.answer

      if (ans.kind === 'number') {
        const val = numberValue(ans.value)
        if (/maximum principal moment/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /m = (\d+)\$.*?\((-?\d+),\s*(-?\d+),\s*0\)/)
          const mass = Number(m[1])
          const a = Number(m[2])
          const b = Number(m[3])
          expect(val, `seed ${seed}`).toBeCloseTo(2 * mass * (a * a + b * b), 4)
        } else if (/rotational kinetic energy/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /\\operatorname\{diag\}\((\d+),\s*(\d+),\s*(\d+)\).*?\\vec\{\\omega\} = \((\d+),\s*(\d+),\s*(\d+)\)/)
          const Ixx = Number(m[1])
          const Iyy = Number(m[2])
          const Izz = Number(m[3])
          const wx = Number(m[4])
          const wy = Number(m[5])
          const wz = Number(m[6])
          expect(val, `seed ${seed}`).toBeCloseTo(0.5 * (Ixx * wx * wx + Iyy * wy * wy + Izz * wz * wz), 4)
        }
        verifySolutionStepNumber(p, seed)
      } else if (ans.kind === 'choice') {
        expect(ans.options.some((o) => o.id === ans.correctId)).toBe(true)
      }
    }
  })
})

describe('kepler', () => {
  it('tier 1: force ratio, surface gravity ratio, circular speed', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('kepler').generate(createRng(seed), 1)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/F_1 = (\d+)\$/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /F_1 = (\d+)\$.*?r_2 = (\d+)r(?:,\s*and\s*one\s*mass\s*is\s*(doubled|tripled))?/)
        const F1 = Number(m[1])
        const k = Number(m[2])
        const massFactor = m[3] === 'doubled' ? 2 : m[3] === 'tripled' ? 3 : 1
        expect(val, `seed ${seed}`).toBeCloseTo((F1 * massFactor) / (k * k), 4)
      } else if (/altitude h =/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /altitude h = (?:(\d+))?R/)
        const k = m[1] ? Number(m[1]) : 1
        expect(val, `seed ${seed}`).toBeCloseTo(10 / ((1 + k) * (1 + k)), 4)
      } else if (/GM = (\d+)/i.test(p.statement)) {
        const mGM = matchOrThrow(p.statement, /GM = (\d+)\s*\\times\s*10\^\{?(\d+)\}?/)
        const mR = matchOrThrow(p.statement, /r = 10\^\{?(\d+)\}?/)
        const kSq = Number(mGM[1])
        const muExp = Number(mGM[2])
        const rExp = Number(mR[1])
        const mu = kSq * Math.pow(10, muExp)
        const r = Math.pow(10, rExp)
        expect(val, `seed ${seed}`).toBeCloseTo(Math.sqrt(mu / r), 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 2: kepler third law ratio, orbital period, escape velocity', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('kepler').generate(createRng(seed), 2)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/a_2 = (\d+)\$/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /a_2 = (\d+)\$/)
        const a2 = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(Math.pow(a2, 1.5), 4)
      } else if (/r\^3\}\{GM\}\} = (\d+)/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /r\^3\}\{GM\}\} = (\d+)/)
        const kFactor = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(2 * Math.PI * kFactor, 4)
      } else if (/v_\{\\text\{orbit\}\} = (\d+)/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /v_\{\\text\{orbit\}\} = (\d+)/)
        const vorbit = Number(m[1])
        expect(val, `seed ${seed}`).toBeCloseTo(vorbit * Math.SQRT2, 4)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 3: perihelion/aphelion speed, semi-major axis period, energy choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('kepler').generate(createRng(seed), 3)
      const ans = p.answer

      if (ans.kind === 'number') {
        const val = numberValue(ans.value)
        if (/r_p = (\d+).*?r_a = (\d+).*?v_a = (\d+)/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /r_p = (\d+).*?r_a = (\d+).*?v_a = (\d+)/)
          const rp = Number(m[1])
          const ra = Number(m[2])
          const va = Number(m[3])
          expect(val, `seed ${seed}`).toBeCloseTo((ra * va) / rp, 4)
        } else if (/r_p = (\d+)\s*AU.*?r_a = (\d+)\s*AU/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /r_p = (\d+)\s*AU.*?r_a = (\d+)\s*AU/)
          const rp = Number(m[1])
          const ra = Number(m[2])
          const a = (rp + ra) / 2
          expect(val, `seed ${seed}`).toBeCloseTo(Math.pow(a, 1.5), 4)
        }
        verifySolutionStepNumber(p, seed)
      } else if (ans.kind === 'choice') {
        expect(ans.options.some((o) => o.id === ans.correctId)).toBe(true)
      }
    }
  })
})
