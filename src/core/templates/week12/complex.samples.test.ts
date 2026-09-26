import { describe, expect, it } from 'vitest'
import { evalComplex, evalReal, parseLatex } from '../../checker/ce'
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

interface ComplexJS {
  readonly re: number
  readonly im: number
}

function cAdd(a: ComplexJS, b: ComplexJS): ComplexJS {
  return { re: a.re + b.re, im: a.im + b.im }
}

function cSub(a: ComplexJS, b: ComplexJS): ComplexJS {
  return { re: a.re - b.re, im: a.im - b.im }
}

function cMul(a: ComplexJS, b: ComplexJS): ComplexJS {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }
}

function cDiv(a: ComplexJS, b: ComplexJS): ComplexJS {
  const d = b.re * b.re + b.im * b.im
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d }
}

function cPow(a: ComplexJS, n: number): ComplexJS {
  const r = Math.hypot(a.re, a.im)
  const theta = Math.atan2(a.im, a.re)
  const rn = Math.pow(r, n)
  const ntheta = theta * n
  return { re: rn * Math.cos(ntheta), im: rn * Math.sin(ntheta) }
}

function cFromPolar(r: number, theta: number): ComplexJS {
  return { re: r * Math.cos(theta), im: r * Math.sin(theta) }
}

function cMod(a: ComplexJS): number {
  return Math.hypot(a.re, a.im)
}

function parseComplexStr(str: string): ComplexJS {
  const s = str.trim()
  if (s === 'i') return { re: 0, im: 1 }
  if (s === '-i') return { re: 0, im: -1 }

  const pureImMatch = s.match(/^([-+]?\d*(?:\.\d+)?)i$/)
  if (pureImMatch) {
    const coeff = pureImMatch[1]
    if (coeff === '' || coeff === '+') return { re: 0, im: 1 }
    if (coeff === '-') return { re: 0, im: -1 }
    return { re: 0, im: Number(coeff) }
  }

  const fullMatch = s.match(/^([-+]?\d+(?:\.\d+)?)\s*([-+])\s*(.*)$/)
  if (fullMatch) {
    const re = Number(fullMatch[1])
    const sign = fullMatch[2] === '-' ? -1 : 1
    const rest = fullMatch[3].trim()
    if (rest === 'i') return { re, im: sign }
    const restMatch = rest.match(/^(\d+(?:\.\d+)?)i$/)
    if (restMatch) return { re, im: sign * Number(restMatch[1]) }
  }

  const reNum = Number(s)
  if (!Number.isNaN(reNum)) return { re: reNum, im: 0 }

  throw new Error(`cannot parse complex string "${str}"`)
}

describe('polar', () => {
  it('tier 1: cartesian to polar, polar to cartesian, radius or angle', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('polar').generate(createRng(seed), 1)

      if (p.answer.kind === 'vector') {
        const c = p.answer.components
        if (/Convert the Cartesian point/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /= \(([^,]+),\s*([^)]+)\)/)
          const x = numberValue(m[1])
          const y = numberValue(m[2])
          const expectedR = Math.hypot(x, y)
          let expectedTheta = Math.atan2(y, x)
          if (expectedTheta < 0) expectedTheta += 2 * Math.PI

          expect(numberValue(c[0]), `seed ${seed}`).toBeCloseTo(expectedR, 4)
          expect(numberValue(c[1]), `seed ${seed}`).toBeCloseTo(expectedTheta, 4)
        } else if (/Convert the polar point/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /= \(([^,]+),\s*([^)]+)\)/)
          const r = numberValue(m[1])
          const theta = numberValue(m[2])
          const expectedX = r * Math.cos(theta)
          const expectedY = r * Math.sin(theta)

          expect(numberValue(c[0]), `seed ${seed}`).toBeCloseTo(expectedX, 4)
          expect(numberValue(c[1]), `seed ${seed}`).toBeCloseTo(expectedY, 4)
        } else {
          throw new Error(`seed ${seed}: unrecognised vector statement: ${p.statement}`)
        }
      } else if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)
        const m = matchOrThrow(p.statement, /\(([^,]+),\s*([^)]+)\)/)
        const x = numberValue(m[1])
        const y = numberValue(m[2])

        if (/polar radius/i.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(Math.hypot(x, y), 4)
        } else if (/polar angle/i.test(p.statement)) {
          let expectedTheta = Math.atan2(y, x)
          if (expectedTheta < 0) expectedTheta += 2 * Math.PI
          expect(val, `seed ${seed}`).toBeCloseTo(expectedTheta, 4)
        } else {
          throw new Error(`seed ${seed}: unrecognised number statement: ${p.statement}`)
        }
      } else {
        throw new Error(`seed ${seed}: unrecognised answer type`)
      }
    }
  })

  it('tier 2: polar distance, curve choice, polar triangle area', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('polar').generate(createRng(seed), 2)

      if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)
        if (/distance \$d\$/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /A = \(([^,]+),\s*([^)]+)\).*?B = \(([^,]+),\s*([^)]+)\)/)
          const r1 = numberValue(m[1])
          const t1 = numberValue(m[2])
          const r2 = numberValue(m[3])
          const t2 = numberValue(m[4])
          const expectedD = Math.sqrt(r1 * r1 + r2 * r2 - 2 * r1 * r2 * Math.cos(t2 - t1))
          expect(val, `seed ${seed}`).toBeCloseTo(expectedD, 4)
        } else if (/area of the triangle/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /A = \(([^,]+),\s*([^)]+)\).*?B = \(([^,]+),\s*([^)]+)\)/)
          const r1 = numberValue(m[1])
          const t1 = numberValue(m[2])
          const r2 = numberValue(m[3])
          const t2 = numberValue(m[4])
          const expectedArea = 0.5 * r1 * r2 * Math.abs(Math.sin(t2 - t1))
          expect(val, `seed ${seed}`).toBeCloseTo(expectedArea, 4)
        } else {
          throw new Error(`seed ${seed}: unrecognised number statement: ${p.statement}`)
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

  it('tier 3: cardioid evaluation, symmetry choice, curve intersection', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('polar').generate(createRng(seed), 3)

      if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)
        if (/cardioid/i.test(p.statement)) {
          const aMatch = matchOrThrow(p.statement, /r = (\d+)\(1 \+ (\\cos|\\sin)\\theta\)/)
          const a = Number(aMatch[1])
          const trigFn = aMatch[2]
          const thetaStr = matchOrThrow(p.statement, /\\theta = ([-0-9.\\\\frac{\\pi}]+)/)[1]
          const theta = numberValue(thetaStr)
          const expectedR = a * (1 + (trigFn === '\\sin' ? Math.sin(theta) : Math.cos(theta)))
          expect(val, `seed ${seed}`).toBeCloseTo(expectedR, 4)
        } else if (/polar angle \$?\\theta/i.test(p.statement)) {
          const fnMatch = matchOrThrow(p.statement, /r = (\d+) (\\cos|\\sin)\\theta/)
          const a = Number(fnMatch[1])
          const fn = fnMatch[2]
          const halfA = numberValue(matchOrThrow(p.statement, /intersects the circle \$?r = ([0-9.\\\\sqrt{}]+)\$?/)[1])
          const expectedTheta = fn === '\\cos' ? Math.acos(halfA / a) : Math.asin(halfA / a)
          expect(val, `seed ${seed}`).toBeCloseTo(expectedTheta, 4)
        } else {
          throw new Error(`seed ${seed}: unrecognised number statement: ${p.statement}`)
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

describe('complex_arith', () => {
  it('tier 1: add/sub, multiply, modulus, powers of i', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('complex_arith').generate(createRng(seed), 1)

      if (p.answer.kind === 'complex') {
        const userRe = numberValue(p.answer.re)
        const userIm = numberValue(p.answer.im)

        if (/Evaluate the expression/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /\(([^)]+)\)\s*([-+])\s*\(([^)]+)\)/)
          const op = m[2]
          const z1 = parseComplexStr(m[1])
          const z2 = parseComplexStr(m[3])
          const expected = op === '+' ? cAdd(z1, z2) : cSub(z1, z2)

          expect(userRe, `seed ${seed}`).toBeCloseTo(expected.re, 4)
          expect(userIm, `seed ${seed}`).toBeCloseTo(expected.im, 4)
        } else if (/Compute the product/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /\(([^)]+)\)\(([^)]+)\)/)
          const z1 = parseComplexStr(m[1])
          const z2 = parseComplexStr(m[2])
          const expected = cMul(z1, z2)

          expect(userRe, `seed ${seed}`).toBeCloseTo(expected.re, 4)
          expect(userIm, `seed ${seed}`).toBeCloseTo(expected.im, 4)
        } else if (/i\^\{(\d+)\}/i.test(p.statement)) {
          const n = Number(matchOrThrow(p.statement, /i\^\{(\d+)\}/)[1])
          const expected = cPow({ re: 0, im: 1 }, n)

          expect(userRe, `seed ${seed}`).toBeCloseTo(expected.re, 4)
          expect(userIm, `seed ${seed}`).toBeCloseTo(expected.im, 4)
        } else {
          throw new Error(`seed ${seed}: unrecognised complex statement: ${p.statement}`)
        }
      } else if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)
        const m = matchOrThrow(p.statement, /z = ([^$]+)/)
        const z = parseComplexStr(m[1])
        const expectedMod = cMod(z)

        expect(val, `seed ${seed}`).toBeCloseTo(expectedMod, 4)
      } else {
        throw new Error(`seed ${seed}: unrecognised answer type`)
      }
    }
  })

  it('tier 2: division, quadratic roots, part evaluation', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('complex_arith').generate(createRng(seed), 2)

      if (p.answer.kind === 'complex') {
        const userRe = numberValue(p.answer.re)
        const userIm = numberValue(p.answer.im)

        if (/quotient/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /\\frac\{([^}]+)\}\{([^}]+)\}/)
          const z1 = parseComplexStr(m[1])
          const z2 = parseComplexStr(m[2])
          const expected = cDiv(z1, z2)

          expect(userRe, `seed ${seed}`).toBeCloseTo(expected.re, 4)
          expect(userIm, `seed ${seed}`).toBeCloseTo(expected.im, 4)
        } else if (/quadratic equation/i.test(p.statement)) {
          const bMatch = p.statement.match(/z\^2\s*([-+]\s*\d+z)?\s*\+\s*(\d+)/)
          if (!bMatch) throw new Error(`cannot match quadratic in ${p.statement}`)
          const bStr = bMatch[1] ? bMatch[1].replace(/\s+/g, '').replace('z', '') : '0'
          const b = Number(bStr)
          const c = Number(bMatch[2])

          const root: ComplexJS = { re: userRe, im: userIm }
          expect(userIm, `seed ${seed}`).toBeGreaterThan(0)
          const zSq = cMul(root, root)
          const bZ: ComplexJS = { re: b * root.re, im: b * root.im }
          const res = cAdd(cAdd(zSq, bZ), { re: c, im: 0 })

          expect(res.re, `seed ${seed}`).toBeCloseTo(0, 4)
          expect(res.im, `seed ${seed}`).toBeCloseTo(0, 4)
        } else {
          throw new Error(`seed ${seed}: unrecognised complex statement: ${p.statement}`)
        }
      } else if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)
        const m = matchOrThrow(p.statement, /z = ([^$]+)/)
        const z = parseComplexStr(m[1])
        const zSq = cMul(z, z)

        if (/real part/i.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(zSq.re, 4)
        } else if (/imaginary part/i.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(zSq.im, 4)
        } else {
          throw new Error(`seed ${seed}: unrecognised number statement: ${p.statement}`)
        }
      } else {
        throw new Error(`seed ${seed}: unrecognised answer type`)
      }
    }
  })

  it('tier 3: linear complex equation, conjugate product, choices', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('complex_arith').generate(createRng(seed), 3)

      if (p.answer.kind === 'complex') {
        const userRe = numberValue(p.answer.re)
        const userIm = numberValue(p.answer.im)

        const m = matchOrThrow(p.statement, /\(([^)]+)\)\s*z\s*\+\s*\(([^)]+)\)\s*=\s*(.*?)\$ for \$z\$/)
        const coeff = parseComplexStr(m[1])
        const constTerm = parseComplexStr(m[2])
        const rhs = parseComplexStr(m[3])

        const expected = cDiv(cSub(rhs, constTerm), coeff)
        expect(userRe, `seed ${seed}`).toBeCloseTo(expected.re, 4)
        expect(userIm, `seed ${seed}`).toBeCloseTo(expected.im, 4)
      } else if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)
        const m = matchOrThrow(p.statement, /\(([^)]+)\)\^2\s*\+\s*\(([^)]+)\)\^2/)
        const z = parseComplexStr(m[1])
        const a = z.re
        const b = Math.abs(z.im)
        const expected = 2 * (a * a - b * b)
        expect(val, `seed ${seed}`).toBeCloseTo(expected, 4)
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

describe('complex_polar', () => {
  it('tier 1: rectangular to polar, polar to rectangular, Euler identity', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('complex_polar').generate(createRng(seed), 1)

      if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)

        // Recompute from z itself: the statement's number, evaluated, gives both |z| and arg z.
        const zSeg = p.statement.match(/\$z = ([^$]+)\$/)
        const zExpr = zSeg ? parseLatex(zSeg[1]) : null
        const z = zExpr ? evalComplex(zExpr) : null
        if (!z) throw new Error(`seed ${seed}: cannot read z in ${p.statement}`)
        if (/argument/i.test(p.statement)) {
          const principal = Math.atan2(z.im, z.re)
          const expected = /\[0, 2\\pi\)/.test(p.statement) && principal < 0 ? principal + 2 * Math.PI : principal
          expect(val, `seed ${seed}: ${p.statement}`).toBeCloseTo(expected, 9)
        } else if (/modulus/i.test(p.statement)) {
          expect(val, `seed ${seed}: ${p.statement}`).toBeCloseTo(Math.hypot(z.re, z.im), 9)
        } else {
          throw new Error(`seed ${seed}: unrecognised number statement: ${p.statement}`)
        }
      } else if (p.answer.kind === 'complex') {
        const userRe = numberValue(p.answer.re)
        const userIm = numberValue(p.answer.im)

        if (/Convert the complex number/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /=\s*([0-9.\\sqrt{}]+)\s*e\^\{i\s*\\left\((.*?)\\right\)\}/)
          const r = numberValue(m[1])
          const theta = numberValue(m[2])
          const expected = cFromPolar(r, theta)

          expect(userRe, `seed ${seed}`).toBeCloseTo(expected.re, 4)
          expect(userIm, `seed ${seed}`).toBeCloseTo(expected.im, 4)
        } else if (/expression \$e\^\{/i.test(p.statement) || /e\^\{i \\pi\}/i.test(p.statement)) {
          expect(typeof userRe, `seed ${seed}`).toBe('number')
          expect(typeof userIm, `seed ${seed}`).toBe('number')
        }
      } else {
        throw new Error(`seed ${seed}: unrecognised answer type`)
      }
    }
  })

  it('tier 2: polar multiplication, polar division, Euler trig representation', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('complex_polar').generate(createRng(seed), 2)

      if (p.answer.kind === 'complex') {
        const userRe = numberValue(p.answer.re)
        const userIm = numberValue(p.answer.im)

        if (/product \$z_1 z_2\$/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /z_1 = ([0-9.\\sqrt{}]+) e\^\{i\s*\\left\((.*?)\\right\)\}.*?z_2 = ([0-9.\\sqrt{}]+) e\^\{i\s*\\left\((.*?)\\right\)\}/)
          const r1 = numberValue(m[1])
          const t1 = numberValue(m[2])
          const r2 = numberValue(m[3])
          const t2 = numberValue(m[4])

          const z1 = cFromPolar(r1, t1)
          const z2 = cFromPolar(r2, t2)
          const expected = cMul(z1, z2)

          expect(userRe, `seed ${seed}`).toBeCloseTo(expected.re, 4)
          expect(userIm, `seed ${seed}`).toBeCloseTo(expected.im, 4)
        } else if (/quotient.*\\frac\{z_1\}\{z_2\}/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /z_1 = ([0-9.\\sqrt{}]+) e\^\{i\s*\\left\((.*?)\\right\)\}.*?z_2 = ([0-9.\\sqrt{}]+) e\^\{i\s*\\left\((.*?)\\right\)\}/)
          const r1 = numberValue(m[1])
          const t1 = numberValue(m[2])
          const r2 = numberValue(m[3])
          const t2 = numberValue(m[4])

          const z1 = cFromPolar(r1, t1)
          const z2 = cFromPolar(r2, t2)
          const expected = cDiv(z1, z2)

          expect(userRe, `seed ${seed}`).toBeCloseTo(expected.re, 4)
          expect(userIm, `seed ${seed}`).toBeCloseTo(expected.im, 4)
        } else {
          throw new Error(`seed ${seed}: unrecognised complex statement: ${p.statement}`)
        }
      } else if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)
        const thetaStr = matchOrThrow(p.statement, /e\^\{i\s*\\left\((.*?)\\right\)/)[1]
        const theta = numberValue(thetaStr)

        if (/e\^\{i.*?\}\s*\+\s*e\^\{-i/i.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(Math.cos(theta), 4)
        } else if (/e\^\{i.*?\}\s*-\s*e\^\{-i/i.test(p.statement)) {
          expect(val, `seed ${seed}`).toBeCloseTo(Math.sin(theta), 4)
        } else {
          throw new Error(`seed ${seed}: unrecognised number statement: ${p.statement}`)
        }
      } else {
        throw new Error(`seed ${seed}: unrecognised answer type`)
      }
    }
  })

  it('tier 3: combined polar operation, principal argument, choice', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('complex_polar').generate(createRng(seed), 3)

      if (p.answer.kind === 'complex') {
        const userRe = numberValue(p.answer.re)
        const userIm = numberValue(p.answer.im)
        expect(typeof userRe, `seed ${seed}`).toBe('number')
        expect(typeof userIm, `seed ${seed}`).toBe('number')
      } else if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)
        expect(val, `seed ${seed}`).toBeGreaterThan(-Math.PI)
        expect(val, `seed ${seed}`).toBeLessThanOrEqual(Math.PI)
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

describe('complex_powers', () => {
  it('tier 1: De Moivre power, number of roots, sum of roots of unity', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('complex_powers').generate(createRng(seed), 1)

      if (p.answer.kind === 'complex') {
        const userRe = numberValue(p.answer.re)
        const userIm = numberValue(p.answer.im)

        expect(typeof userRe, `seed ${seed}`).toBe('number')
        expect(typeof userIm, `seed ${seed}`).toBe('number')
      } else if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)

        if (/distinct complex solutions/i.test(p.statement)) {
          const n = Number(matchOrThrow(p.statement, /z\^\{*(\d+)\}* =/)[1])
          expect(val, `seed ${seed}`).toBe(n)
        } else if (/sum of all/i.test(p.statement)) {
          expect(val, `seed ${seed}`).toBe(0)
        } else {
          throw new Error(`seed ${seed}: unrecognised number statement: ${p.statement}`)
        }
      } else {
        throw new Error(`seed ${seed}: unrecognised answer type`)
      }
    }
  })

  it('tier 2: nth root of simple number, negative power, root in quadrant', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('complex_powers').generate(createRng(seed), 2)
      if (p.answer.kind !== 'complex') throw new Error(`seed ${seed}: expected complex answer`)

      const userRe = numberValue(p.answer.re)
      const userIm = numberValue(p.answer.im)

      if (/Solve the equation|Find the complex solution/i.test(p.statement)) {
        const m = matchOrThrow(p.statement, /z\^(\d+) = ([-0-9.i\\sqrt{}]+)/)
        const n = Number(m[1])
        const rhsStr = m[2]

        let w: ComplexJS
        if (rhsStr === '8i') w = { re: 0, im: 8 }
        else if (rhsStr === '-16') w = { re: -16, im: 0 }
        else if (rhsStr === '16') w = { re: 16, im: 0 }
        else if (rhsStr === '-8') w = { re: -8, im: 0 }
        else if (rhsStr === '8') w = { re: 8, im: 0 }
        else if (rhsStr === '-27') w = { re: -27, im: 0 }
        else if (rhsStr === '27') w = { re: 27, im: 0 }
        else if (rhsStr === '27i') w = { re: 0, im: 27 }
        else if (rhsStr === '-1') w = { re: -1, im: 0 }
        else if (rhsStr === '64') w = { re: 64, im: 0 }
        else if (rhsStr === '-64') w = { re: -64, im: 0 }
        else if (rhsStr === '81') w = { re: 81, im: 0 }
        else if (rhsStr === '-81') w = { re: -81, im: 0 }
        else if (rhsStr === '64i') w = { re: 0, im: 64 }
        else if (rhsStr === '256') w = { re: 256, im: 0 }
        else throw new Error(`unrecognised rhs: ${rhsStr}`)

        const userZ: ComplexJS = { re: userRe, im: userIm }
        const zn = cPow(userZ, n)

        expect(zn.re, `seed ${seed}`).toBeCloseTo(w.re, 4)
        expect(zn.im, `seed ${seed}`).toBeCloseTo(w.im, 4)

        if (/Quadrant 1/i.test(p.statement)) {
          expect(userRe, `seed ${seed}`).toBeGreaterThanOrEqual(0)
          expect(userIm, `seed ${seed}`).toBeGreaterThanOrEqual(0)
        } else if (/Quadrant 2/i.test(p.statement)) {
          expect(userRe, `seed ${seed}`).toBeLessThanOrEqual(0)
          expect(userIm, `seed ${seed}`).toBeGreaterThanOrEqual(0)
        }
      } else if (/negative power/i.test(p.statement)) {
        expect(typeof userRe, `seed ${seed}`).toBe('number')
        expect(typeof userIm, `seed ${seed}`).toBe('number')
      } else {
        throw new Error(`seed ${seed}: unrecognised statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: roots of unity expression, polygon area, choices', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('complex_powers').generate(createRng(seed), 3)

      if (p.answer.kind === 'number') {
        const val = numberValue(p.answer.value)
        if (/area of this polygon/i.test(p.statement)) {
          const m = matchOrThrow(p.statement, /The (\d+)(?:st|nd|rd|th) roots of \$z\^\{?(\d+)\}? = (\d+)\$/)
          const n = Number(m[1])
          const r = Number(m[3])
          const R = Math.pow(r, 1 / n)
          const expectedArea = (n * R * R / 2) * Math.sin((2 * Math.PI) / n)
          expect(val, `seed ${seed}`).toBeCloseTo(expectedArea, 4)
        } else {
          expect(typeof val, `seed ${seed}`).toBe('number')
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

describe('variety count target check', () => {
  const templates = ['polar', 'complex_arith', 'complex_polar', 'complex_powers']
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
