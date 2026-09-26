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

function parseAndEval(latex: string, vars?: Record<string, number>): number {
  const trimmed = latex.trim()
  if (trimmed === '0') return 0
  if (trimmed === '') return 0
  const parsed = parseLatex(trimmed)
  if (!parsed) throw new Error(`cannot parse "${latex}"`)
  const val = evalReal(parsed, vars)
  if (val === null || val === undefined) throw new Error(`cannot evaluate "${latex}" with vars`)
  return val
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
    const m = tex.match(/=\s*(-?\d+(?:\.\d+)?(?:\\pi)?|\\frac\{[^}]+\}\{[^}]+\}\\pi)\s*$/)
    if (m) {
      const stepVal = numberValue(m[1])
      const ansVal = numberValue(p.answer.value)
      expect(stepVal, `seed ${seed} solution text number`).toBeCloseTo(ansVal, 3)
    }
  } else if (p.answer.kind === 'vector') {
    const m = tex.match(/\\begin\{pmatrix\}\s*([^\\\s]+)\s*\\\\\s*([^\\\s]+)\s*\\\\\s*([^\\\s]+)\s*\\end\{pmatrix\}/)
    if (m) {
      for (let i = 0; i < 3; i += 1) {
        const stepComp = numberValue(m[i + 1])
        const ansComp = numberValue(p.answer.components[i])
        expect(stepComp, `seed ${seed} solution vector comp ${i}`).toBeCloseTo(ansComp, 3)
      }
    }
  }
}

describe('cyl_spherical', () => {
  it('tier 1: coordinate conversions and surface recognition', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('cyl_spherical').generate(createRng(seed), 1)
      const ans = p.answer

      if (ans.kind === 'vector') {
        const c = ans.components
        if (/Convert the cylindrical point/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /P\\left\(([^,]+),\s*([^,]+),\s*([^)]+)\\right\)/)
          const rho = numberValue(m[1])
          const phi = numberValue(m[2])
          const z = numberValue(m[3])
          const expX = rho * Math.cos(phi)
          const expY = rho * Math.sin(phi)
          expect(numberValue(c[0]), `seed ${seed}`).toBeCloseTo(expX, 4)
          expect(numberValue(c[1]), `seed ${seed}`).toBeCloseTo(expY, 4)
          expect(numberValue(c[2]), `seed ${seed}`).toBeCloseTo(z, 4)
        } else if (/Convert the Cartesian point.*cylindrical/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /P\\left\(([^,]+),\s*([^,]+),\s*([^)]+)\\right\)/)
          const x = numberValue(m[1])
          const y = numberValue(m[2])
          const z = numberValue(m[3])
          const expRho = Math.hypot(x, y)
          let expPhi = Math.atan2(y, x)
          if (expPhi < 0) expPhi += 2 * Math.PI
          expect(numberValue(c[0]), `seed ${seed}`).toBeCloseTo(expRho, 4)
          expect(numberValue(c[1]), `seed ${seed}`).toBeCloseTo(expPhi, 4)
          expect(numberValue(c[2]), `seed ${seed}`).toBeCloseTo(z, 4)
        } else if (/Convert the spherical point/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /P\\left\(([^,]+),\s*([^,]+),\s*([^)]+)\\right\)/)
          const r = numberValue(m[1])
          const theta = numberValue(m[2])
          const phi = numberValue(m[3])
          const expX = r * Math.sin(theta) * Math.cos(phi)
          const expY = r * Math.sin(theta) * Math.sin(phi)
          const expZ = r * Math.cos(theta)
          expect(numberValue(c[0]), `seed ${seed}`).toBeCloseTo(expX, 4)
          expect(numberValue(c[1]), `seed ${seed}`).toBeCloseTo(expY, 4)
          expect(numberValue(c[2]), `seed ${seed}`).toBeCloseTo(expZ, 4)
        } else {
          throw new Error(`seed ${seed}: unrecognised vector statement: ${p.statement}`)
        }
      } else if (ans.kind === 'choice') {
        expect(ans.options.some((o) => o.id === ans.correctId)).toBe(true)
      } else {
        throw new Error(`seed ${seed}: unrecognised tier 1 answer type`)
      }
    }
  })

  it('tier 2: volume element choice and region volumes', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('cyl_spherical').generate(createRng(seed), 2)
      const ans = p.answer

      if (ans.kind === 'choice') {
        expect(ans.options.some((o) => o.id === ans.correctId)).toBe(true)
      } else if (ans.kind === 'number') {
        const val = numberValue(ans.value)
        if (/cylindrical region/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /0 \\le \\rho \\le (\d+)\$,\s*\$0 \\le \\phi \\le ([^$]+)\$,\s*\$0 \\le z \\le (\d+)/)
          const R = Number(m[1])
          const phiMax = numberValue(m[2])
          const H = Number(m[3])
          const expectedV = 0.5 * R * R * phiMax * H
          expect(val, `seed ${seed}`).toBeCloseTo(expectedV, 4)
        } else if (/shell/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /(\d+) \\le r \\le (\d+)/)
          const R1 = Number(m[1])
          const R2 = Number(m[2])
          const factor = /upper hemisphere/i.test(p.statement) ? (2 / 3) : (4 / 3)
          const expectedV = factor * Math.PI * (R2 ** 3 - R1 ** 3)
          expect(val, `seed ${seed}`).toBeCloseTo(expectedV, 4)
        } else {
          throw new Error(`seed ${seed}: unrecognised number statement: ${p.statement}`)
        }
      } else {
        throw new Error(`seed ${seed}: unrecognised tier 2 answer type`)
      }
    }
  })

  it('tier 3: mixed transformations, triple integrals, and surface area', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('cyl_spherical').generate(createRng(seed), 3)
      const ans = p.answer

      if (ans.kind === 'vector') {
        const c = ans.components
        const m = matchOrThrow(p.statement, /P\\left\(([^,]+),\s*([^,]+),\s*([^)]+)\\right\)/)
        const rho = numberValue(m[1])
        const phi = numberValue(m[2])
        const z = numberValue(m[3])
        const expR = Math.hypot(rho, z)
        let expTheta = Math.atan2(rho, z)
        if (expTheta < 0) expTheta += 2 * Math.PI
        expect(numberValue(c[0]), `seed ${seed}`).toBeCloseTo(expR, 4)
        expect(numberValue(c[1]), `seed ${seed}`).toBeCloseTo(expTheta, 4)
        expect(numberValue(c[2]), `seed ${seed}`).toBeCloseTo(phi, 4)
      } else if (ans.kind === 'number') {
        const val = numberValue(ans.value)
        if (/iiint_V/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /0 \\le \\rho \\le (\d+)\$,\s*\$0 \\le z \\le (\d+)/)
          const R = Number(m[1])
          const H = Number(m[2])
          const hasZ = /z\(x\^2\+y\^2\)/.test(p.statement)
          const expectedInt = hasZ ? 0.25 * Math.PI * (H ** 2) * (R ** 4) : 0.5 * Math.PI * H * (R ** 4)
          expect(val, `seed ${seed}`).toBeCloseTo(expectedInt, 4)
        } else if (/spherical cap/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /r = (\d+)\$,\s*\$0 \\le \\theta \\le ([^$]+)/)
          const R = Number(m[1])
          const theta0 = numberValue(m[2])
          const expectedArea = 2 * Math.PI * (R ** 2) * (1 - Math.cos(theta0))
          expect(val, `seed ${seed}`).toBeCloseTo(expectedArea, 4)
        } else {
          throw new Error(`seed ${seed}: unrecognised number statement: ${p.statement}`)
        }
      } else {
        throw new Error(`seed ${seed}: unrecognised tier 3 answer type`)
      }
    }
  })
})

describe('divergence', () => {
  it('tier 1: basic 2D/3D divergence at a point and position field', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('divergence').generate(createRng(seed), 1)
      const ans = p.answer
      expect(ans.kind).toBe('number')
      if (ans.kind !== 'number') return
      const val = numberValue(ans.value)

      if (/F\(x,y\) = \\left\((.*?),\s*(.*?)\\right\)/.test(p.statement)) {
        const m = matchOrThrow(p.statement, /F\(x,y\) = \\left\((.*?),\s*(.*?)\\right\)\$? at the point \$?\((.*?),\s*(.*?)\)\$?/)
        const x0 = numberValue(m[3])
        const y0 = numberValue(m[4])
        const h = 1e-5
        const dPdx = (parseAndEval(m[1], { x: x0 + h, y: y0 }) - parseAndEval(m[1], { x: x0 - h, y: y0 })) / (2 * h)
        const dQdy = (parseAndEval(m[2], { x: x0, y: y0 + h }) - parseAndEval(m[2], { x: x0, y: y0 - h })) / (2 * h)
        expect(val, `seed ${seed}`).toBeCloseTo(dPdx + dQdy, 3)
      } else if (/position field/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /F\(x,y,z\) = \\left\((.*?),\s*(.*?),\s*(.*?)\\right\)/)
        const dPdx = parseAndEval(m[1], { x: 1, y: 0, z: 0 })
        const dQdy = parseAndEval(m[2], { x: 0, y: 1, z: 0 })
        const dRdz = parseAndEval(m[3], { x: 0, y: 0, z: 1 })
        expect(val, `seed ${seed}`).toBeCloseTo(dPdx + dQdy + dRdz, 3)
      } else if (/F\(x,y,z\) = \\left\((.*?),\s*(.*?),\s*(.*?)\\right\)/.test(p.statement)) {
        const m = matchOrThrow(p.statement, /F\(x,y,z\) = \\left\((.*?),\s*(.*?),\s*(.*?)\\right\)\$? at the point \$?\((.*?),\s*(.*?),\s*(.*?)\)\$?/)
        const x0 = numberValue(m[4])
        const y0 = numberValue(m[5])
        const z0 = numberValue(m[6])
        const h = 1e-5
        const dPdx = (parseAndEval(m[1], { x: x0 + h, y: y0, z: z0 }) - parseAndEval(m[1], { x: x0 - h, y: y0, z: z0 })) / (2 * h)
        const dQdy = (parseAndEval(m[2], { x: x0, y: y0 + h, z: z0 }) - parseAndEval(m[2], { x: x0, y: y0 - h, z: z0 })) / (2 * h)
        const dRdz = (parseAndEval(m[3], { x: x0, y: y0, z: z0 + h }) - parseAndEval(m[3], { x: x0, y: y0, z: z0 - h })) / (2 * h)
        expect(val, `seed ${seed}`).toBeCloseTo(dPdx + dQdy + dRdz, 3)
      } else {
        throw new Error(`seed ${seed}: unrecognised tier 1 divergence statement: ${p.statement}`)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 2: divergence expressions, incompressible parameter, source/sink choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('divergence').generate(createRng(seed), 2)
      const ans = p.answer

      if (ans.kind === 'expression') {
        const m = matchOrThrow(p.statement, /F\(x,y,z\) = \\left\((.*?),\s*(.*?),\s*(.*?)\\right\)/)
        const x = 2
        const y = 3
        const z = 4
        const h = 1e-5
        const dPdx = (parseAndEval(m[1], { x: x + h, y, z }) - parseAndEval(m[1], { x: x - h, y, z })) / (2 * h)
        const dQdy = (parseAndEval(m[2], { x, y: y + h, z }) - parseAndEval(m[2], { x, y: y - h, z })) / (2 * h)
        const dRdz = (parseAndEval(m[3], { x, y, z: z + h }) - parseAndEval(m[3], { x, y, z: z - h })) / (2 * h)
        const expectedDiv = dPdx + dQdy + dRdz

        const ansVal = parseAndEval(ans.value, { x, y, z })
        expect(ansVal, `seed ${seed}`).toBeCloseTo(expectedDiv, 3)
      } else if (ans.kind === 'number') {
        const m = matchOrThrow(p.statement, /F\(x,y,z\) = \\left\((.*?),\s*(.*?),\s*(.*?)\\right\)/)
        const x = 1
        const y = 1
        const z = 1
        const h = 1e-5
        const dPdx = (parseAndEval(m[1], { x: x + h, y, z }) - parseAndEval(m[1], { x: x - h, y, z })) / (2 * h)
        const dQdy = (parseAndEval(m[2], { x, y: y + h, z }) - parseAndEval(m[2], { x, y: y - h, z })) / (2 * h)
        const expectedK = -(dPdx + dQdy)
        expect(numberValue(ans.value), `seed ${seed}`).toBeCloseTo(expectedK, 3)
      } else if (ans.kind === 'choice') {
        expect(ans.options.some((o) => o.id === ans.correctId)).toBe(true)
      } else {
        throw new Error(`seed ${seed}: unrecognised tier 2 divergence answer type`)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 3: high degree polynomial point, divergence of curl, mixed expressions', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('divergence').generate(createRng(seed), 3)
      const ans = p.answer

      if (ans.kind === 'number') {
        const val = numberValue(ans.value)
        if (/divergence of its curl/i.test(p.statement)) {
          expect(val).toBe(0)
        } else {
          const m = matchOrThrow(p.statement, /F\(x,y,z\) = \\left\((.*?),\s*(.*?),\s*(.*?)\\right\)\$? at the point \$?\((.*?),\s*(.*?),\s*(.*?)\)\$?/)
          const x0 = numberValue(m[4])
          const y0 = numberValue(m[5])
          const z0 = numberValue(m[6])
          const h = 1e-5
          const dPdx = (parseAndEval(m[1], { x: x0 + h, y: y0, z: z0 }) - parseAndEval(m[1], { x: x0 - h, y: y0, z: z0 })) / (2 * h)
          const dQdy = (parseAndEval(m[2], { x: x0, y: y0 + h, z: z0 }) - parseAndEval(m[2], { x: x0, y: y0 - h, z: z0 })) / (2 * h)
          const dRdz = (parseAndEval(m[3], { x: x0, y: y0, z: z0 + h }) - parseAndEval(m[3], { x: x0, y: y0, z: z0 - h })) / (2 * h)
          expect(val, `seed ${seed}`).toBeCloseTo(dPdx + dQdy + dRdz, 3)
        }
      } else if (ans.kind === 'expression') {
        const m = matchOrThrow(p.statement, /F\(x,y,z\) = \\left\((.*?),\s*(.*?),\s*(.*?)\\right\)/)
        const x = 2
        const y = 3
        const z = 4
        const h = 1e-5
        const dPdx = (parseAndEval(m[1], { x: x + h, y, z }) - parseAndEval(m[1], { x: x - h, y, z })) / (2 * h)
        const dQdy = (parseAndEval(m[2], { x, y: y + h, z }) - parseAndEval(m[2], { x, y: y - h, z })) / (2 * h)
        const dRdz = (parseAndEval(m[3], { x, y, z: z + h }) - parseAndEval(m[3], { x, y, z: z - h })) / (2 * h)
        const expectedDiv = dPdx + dQdy + dRdz

        const ansVal = parseAndEval(ans.value, { x, y, z })
        expect(ansVal, `seed ${seed}`).toBeCloseTo(expectedDiv, 3)
      } else {
        throw new Error(`seed ${seed}: unrecognised tier 3 divergence answer type`)
      }
      verifySolutionStepNumber(p, seed)
    }
  })
})

describe('curl', () => {
  it('tier 1: rotation field, simple 3D point, and z-component expression', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('curl').generate(createRng(seed), 1)
      const ans = p.answer

      if (ans.kind === 'vector') {
        const c = ans.components.map(numberValue)
        const m = matchOrThrow(p.statement, /F\(x,y,z\) = \\left\((.*?),\s*(.*?),\s*(.*?)\\right\)/)

        let x0 = 1
        let y0 = 1
        let z0 = 1
        if (/at the point \$?\((.*?),\s*(.*?),\s*(.*?)\)\$?/.test(p.statement)) {
          const ptMatch = matchOrThrow(p.statement, /at the point \$?\((.*?),\s*(.*?),\s*(.*?)\)\$?/)
          x0 = numberValue(ptMatch[1])
          y0 = numberValue(ptMatch[2])
          z0 = numberValue(ptMatch[3])
        }

        const h = 1e-5
        const dRdy = (parseAndEval(m[3], { x: x0, y: y0 + h, z: z0 }) - parseAndEval(m[3], { x: x0, y: y0 - h, z: z0 })) / (2 * h)
        const dQdz = (parseAndEval(m[2], { x: x0, y: y0, z: z0 + h }) - parseAndEval(m[2], { x: x0, y: y0, z: z0 - h })) / (2 * h)
        const dPdz = (parseAndEval(m[1], { x: x0, y: y0, z: z0 + h }) - parseAndEval(m[1], { x: x0, y: y0, z: z0 - h })) / (2 * h)
        const dRdx = (parseAndEval(m[3], { x: x0 + h, y: y0, z: z0 }) - parseAndEval(m[3], { x: x0 - h, y: y0, z: z0 })) / (2 * h)
        const dQdx = (parseAndEval(m[2], { x: x0 + h, y: y0, z: z0 }) - parseAndEval(m[2], { x: x0 - h, y: y0, z: z0 })) / (2 * h)
        const dPdy = (parseAndEval(m[1], { x: x0, y: y0 + h, z: z0 }) - parseAndEval(m[1], { x: x0, y: y0 - h, z: z0 })) / (2 * h)

        expect(c[0], `seed ${seed}`).toBeCloseTo(dRdy - dQdz, 3)
        expect(c[1], `seed ${seed}`).toBeCloseTo(dPdz - dRdx, 3)
        expect(c[2], `seed ${seed}`).toBeCloseTo(dQdx - dPdy, 3)
      } else if (ans.kind === 'expression') {
        const m = matchOrThrow(p.statement, /F\(x,y,z\) = \\left\((.*?),\s*(.*?),\s*(.*?)\\right\)/)
        const x = 2
        const y = 3
        const z = 4
        const h = 1e-5
        const dQdx = (parseAndEval(m[2], { x: x + h, y, z }) - parseAndEval(m[2], { x: x - h, y, z })) / (2 * h)
        const dPdy = (parseAndEval(m[1], { x, y: y + h, z }) - parseAndEval(m[1], { x, y: y - h, z })) / (2 * h)
        const expectedCz = dQdx - dPdy

        const ansVal = parseAndEval(ans.value, { x, y, z })
        expect(ansVal, `seed ${seed}`).toBeCloseTo(expectedCz, 3)
      } else {
        throw new Error(`seed ${seed}: unrecognised tier 1 curl answer type`)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 2: polynomial point curl, irrotational choice, curl of gradient', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('curl').generate(createRng(seed), 2)
      const ans = p.answer

      if (ans.kind === 'vector') {
        const c = ans.components.map(numberValue)
        if (/curl of its gradient field/i.test(p.statement)) {
          expect(c[0]).toBe(0)
          expect(c[1]).toBe(0)
          expect(c[2]).toBe(0)
        } else {
          const m = matchOrThrow(p.statement, /F\(x,y,z\) = \\left\((.*?),\s*(.*?),\s*(.*?)\\right\)\$? at the point \$?\((.*?),\s*(.*?),\s*(.*?)\)\$?/)
          const x0 = numberValue(m[4])
          const y0 = numberValue(m[5])
          const z0 = numberValue(m[6])

          const h = 1e-5
          const dRdy = (parseAndEval(m[3], { x: x0, y: y0 + h, z: z0 }) - parseAndEval(m[3], { x: x0, y: y0 - h, z: z0 })) / (2 * h)
          const dQdz = (parseAndEval(m[2], { x: x0, y: y0, z: z0 + h }) - parseAndEval(m[2], { x: x0, y: y0, z: z0 - h })) / (2 * h)
          const dPdz = (parseAndEval(m[1], { x: x0, y: y0, z: z0 + h }) - parseAndEval(m[1], { x: x0, y: y0, z: z0 - h })) / (2 * h)
          const dRdx = (parseAndEval(m[3], { x: x0 + h, y: y0, z: z0 }) - parseAndEval(m[3], { x: x0 - h, y: y0, z: z0 })) / (2 * h)
          const dQdx = (parseAndEval(m[2], { x: x0 + h, y: y0, z: z0 }) - parseAndEval(m[2], { x: x0 - h, y: y0, z: z0 })) / (2 * h)
          const dPdy = (parseAndEval(m[1], { x: x0, y: y0 + h, z: z0 }) - parseAndEval(m[1], { x: x0, y: y0 - h, z: z0 })) / (2 * h)

          expect(c[0], `seed ${seed}`).toBeCloseTo(dRdy - dQdz, 3)
          expect(c[1], `seed ${seed}`).toBeCloseTo(dPdz - dRdx, 3)
          expect(c[2], `seed ${seed}`).toBeCloseTo(dQdx - dPdy, 3)
        }
      } else if (ans.kind === 'choice') {
        expect(ans.options.some((o) => o.id === ans.correctId)).toBe(true)
      } else {
        throw new Error(`seed ${seed}: unrecognised tier 2 curl answer type`)
      }
      verifySolutionStepNumber(p, seed)
    }
  })

  it('tier 3: parameter for irrotational field, component expressions, quadratic point curl', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('curl').generate(createRng(seed), 3)
      const ans = p.answer

      if (ans.kind === 'number') {
        const aVal = numberValue(ans.value)
        const m = matchOrThrow(p.statement, /F\(x,y,z\) = \\left\((.*?),\s*(.*?),\s*(.*?)\\right\)/)
        const pLatex = m[1].replace(/\ba\b/, String(aVal))
        const x = 1
        const y = 2
        const z = 3
        const h = 1e-5
        const dQdx = (parseAndEval(m[2], { x: x + h, y, z }) - parseAndEval(m[2], { x: x - h, y, z })) / (2 * h)
        const dPdy = (parseAndEval(pLatex, { x, y: y + h, z }) - parseAndEval(pLatex, { x, y: y - h, z })) / (2 * h)
        expect(dQdx - dPdy, `seed ${seed}`).toBeCloseTo(0, 3)
      } else if (ans.kind === 'expression') {
        const compMatch = matchOrThrow(p.statement, /Find the (\d+)(?:st|nd|rd|th) component/)
        const compIndex = Number(compMatch[1])
        const m = matchOrThrow(p.statement, /F\(x,y,z\) = \\left\((.*?),\s*(.*?),\s*(.*?)\\right\)/)
        const x = 2
        const y = 3
        const z = 4
        const h = 1e-5

        let expectedComp = 0
        if (compIndex === 1) {
          const dRdy = (parseAndEval(m[3], { x, y: y + h, z }) - parseAndEval(m[3], { x, y: y - h, z })) / (2 * h)
          const dQdz = (parseAndEval(m[2], { x, y, z: z + h }) - parseAndEval(m[2], { x, y, z: z - h })) / (2 * h)
          expectedComp = dRdy - dQdz
        } else if (compIndex === 2) {
          const dPdz = (parseAndEval(m[1], { x, y, z: z + h }) - parseAndEval(m[1], { x, y, z: z - h })) / (2 * h)
          const dRdx = (parseAndEval(m[3], { x: x + h, y, z }) - parseAndEval(m[3], { x: x - h, y, z })) / (2 * h)
          expectedComp = dPdz - dRdx
        } else {
          const dQdx = (parseAndEval(m[2], { x: x + h, y, z }) - parseAndEval(m[2], { x: x - h, y, z })) / (2 * h)
          const dPdy = (parseAndEval(m[1], { x, y: y + h, z }) - parseAndEval(m[1], { x, y: y - h, z })) / (2 * h)
          expectedComp = dQdx - dPdy
        }

        const ansVal = parseAndEval(ans.value, { x, y, z })
        expect(ansVal, `seed ${seed}`).toBeCloseTo(expectedComp, 3)
      } else if (ans.kind === 'vector') {
        const c = ans.components.map(numberValue)
        const m = matchOrThrow(p.statement, /F\(x,y,z\) = \\left\((.*?),\s*(.*?),\s*(.*?)\\right\)\$? at the point \$?\((.*?),\s*(.*?),\s*(.*?)\)\$?/)
        const x0 = numberValue(m[4])
        const y0 = numberValue(m[5])
        const z0 = numberValue(m[6])

        const h = 1e-5
        const dRdy = (parseAndEval(m[3], { x: x0, y: y0 + h, z: z0 }) - parseAndEval(m[3], { x: x0, y: y0 - h, z: z0 })) / (2 * h)
        const dQdz = (parseAndEval(m[2], { x: x0, y: y0, z: z0 + h }) - parseAndEval(m[2], { x: x0, y: y0, z: z0 - h })) / (2 * h)
        const dPdz = (parseAndEval(m[1], { x: x0, y: y0, z: z0 + h }) - parseAndEval(m[1], { x: x0, y: y0, z: z0 - h })) / (2 * h)
        const dRdx = (parseAndEval(m[3], { x: x0 + h, y: y0, z: z0 }) - parseAndEval(m[3], { x: x0 - h, y: y0, z: z0 })) / (2 * h)
        const dQdx = (parseAndEval(m[2], { x: x0 + h, y: y0, z: z0 }) - parseAndEval(m[2], { x: x0 - h, y: y0, z: z0 })) / (2 * h)
        const dPdy = (parseAndEval(m[1], { x: x0, y: y0 + h, z: z0 }) - parseAndEval(m[1], { x: x0, y: y0 - h, z: z0 })) / (2 * h)

        expect(c[0], `seed ${seed}`).toBeCloseTo(dRdy - dQdz, 3)
        expect(c[1], `seed ${seed}`).toBeCloseTo(dPdz - dRdx, 3)
        expect(c[2], `seed ${seed}`).toBeCloseTo(dQdx - dPdy, 3)
      } else {
        throw new Error(`seed ${seed}: unrecognised tier 3 curl answer type`)
      }
      verifySolutionStepNumber(p, seed)
    }
  })
})
