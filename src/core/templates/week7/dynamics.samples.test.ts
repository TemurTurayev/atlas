import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex, type Expr } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'

const SEEDS = 30

function mustParse(latex: string, context: string): Expr {
  const expr = parseLatex(latex)
  if (!expr) throw new Error(`could not parse "${latex}" (${context})`)
  return expr
}

function numberValue(latex: string): number {
  const expr = parseLatex(latex)
  const v = expr && evalReal(expr)
  if (v === null || v === undefined) throw new Error(`cannot evaluate "${latex}"`)
  return v
}

/**
 * After stripping every `$...$` math span, prose must contain no leftover `$`, no LaTeX command
 * (`\foo`), and no bare sub/superscript (`_{`, `^{`) — those all belong inside `$...$`, never in
 * plain English text.
 */
function assertNoStrayLatex(text: string, context: string): void {
  const stripped = text.replace(/\$[^$]*\$/g, '')
  expect(stripped.includes('$'), `${context}: unmatched "$" in "${text}"`).toBe(false)
  expect(/\\[a-zA-Z]/.test(stripped), `${context}: LaTeX command outside $...$ in "${text}"`).toBe(false)
  expect(/[_^]\{/.test(stripped), `${context}: sub/superscript outside $...$ in "${text}"`).toBe(false)
}

describe('week7: no LaTeX leaks outside $...$', () => {
  const SKILLS = ['equilibria', 'euler_method', 'sir_model'] as const
  const TIERS = [1, 2, 3] as const

  it('theory for every week7 skill is plain prose outside its $...$ spans', () => {
    for (const skillId of SKILLS) {
      assertNoStrayLatex(getTemplate(skillId).theory, skillId)
    }
  })

  it('every generated statement, hint, solution step, and choice label is plain prose outside its $...$ spans', () => {
    for (const skillId of SKILLS) {
      for (const tier of TIERS) {
        for (let seed = 1; seed <= SEEDS; seed += 1) {
          const p = getTemplate(skillId).generate(createRng(seed), tier)
          const context = `${skillId} tier ${tier} seed ${seed}`
          assertNoStrayLatex(p.statement, `${context}: statement`)
          p.hints.forEach((h, i) => assertNoStrayLatex(h, `${context}: hint ${i}`))
          p.solution.forEach((s, i) => assertNoStrayLatex(s.text, `${context}: solution step ${i} text`))
          if (p.answer.kind === 'choice') {
            p.answer.options.forEach((o) => assertNoStrayLatex(o.label, `${context}: choice option "${o.id}"`))
          }
          if (p.inputHint) assertNoStrayLatex(p.inputHint, `${context}: inputHint`)
        }
      }
    }
  })
})

/** The "f(y) = ...$" polynomial every equilibria statement carries, whichever tier it comes from. */
function extractFOfY(statement: string): string {
  const match = statement.match(/f\(y\) = ([^$]+)\$/)
  if (!match) throw new Error(`no f(y) found in: ${statement}`)
  return match[1]
}

describe('equilibria', () => {
  it('tier 1: every claimed equilibrium is a genuine root of f(y)', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('equilibria').generate(createRng(seed), 1)
      if (p.answer.kind !== 'numberSet') throw new Error(`seed ${seed}: expected a numberSet answer`)
      expect(p.answer.values.length, `seed ${seed}`).toBeGreaterThan(0)
      const f = mustParse(extractFOfY(p.statement), `seed ${seed}`)
      for (const raw of p.answer.values) {
        const y = numberValue(raw)
        const fy = evalReal(f, { y })
        expect(fy, `seed ${seed}: f(${y}) should vanish`).not.toBeNull()
        expect(Math.abs(fy as number), `seed ${seed}: f(${y})`).toBeLessThan(1e-6)
      }
    }
  })

  it("tier 2: the stability verdict matches the sign of a numerically estimated f'(y*)", () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('equilibria').generate(createRng(seed), 2)
      if (p.answer.kind !== 'choice') throw new Error(`seed ${seed}: expected a choice answer`)
      const f = mustParse(extractFOfY(p.statement), `seed ${seed}`)
      const match = p.statement.match(/y\^\{\*\} = (-?\d+)\$ is an equilibrium|y\^\{\*\} = (-?\d+)/)
      if (!match) throw new Error(`seed ${seed}: no stated equilibrium in: ${p.statement}`)
      const yStar = Number(match[1] ?? match[2])
      const h = 1e-3
      const plus = evalReal(f, { y: yStar + h })
      const minus = evalReal(f, { y: yStar - h })
      if (plus === null || minus === null) throw new Error(`seed ${seed}: f undefined near y*=${yStar}`)
      const slope = (plus - minus) / (2 * h)
      expect(Math.abs(slope), `seed ${seed}: f'(y*) should be clearly nonzero`).toBeGreaterThan(0.05)
      expect(p.answer.correctId, `seed ${seed}`).toBe(slope < 0 ? 'stable' : 'unstable')
    }
  })

  it('tier 3: the population-approach verdict matches the sign of f in each region, and the harvest rate matches rK/4', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('equilibria').generate(createRng(seed), 3)

      if (p.statement.includes('harvested logistic equation')) {
        const rkMatch = p.statement.match(/r = (-?\d+)\$ and \$K = (-?\d+)\$/)
        if (!rkMatch) throw new Error(`seed ${seed}: no r, K found in: ${p.statement}`)
        const r = Number(rkMatch[1])
        const capacity = Number(rkMatch[2])
        if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected a number answer`)
        const hCrit = Number(p.answer.value)
        // The equilibria of r*y*(1-y/K) = h collide exactly when the discriminant of the
        // quadratic -(r/K)y^2 + r*y - h vanishes: r^2 - 4*(r/K)*h = 0.
        const discriminant = r * r - 4 * (r / capacity) * hCrit
        expect(Math.abs(discriminant), `seed ${seed}: discriminant at the claimed h`).toBeLessThan(1e-9)
        expect(hCrit, `seed ${seed}: h = rK/4`).toBeCloseTo((r * capacity) / 4, 9)
        continue
      }

      if (p.answer.kind !== 'choice') throw new Error(`seed ${seed}: expected a choice answer`)
      const f = mustParse(extractFOfY(p.statement), `seed ${seed}`)
      const y0Match = p.statement.match(/y\(0\) = (-?\d+)/)
      if (!y0Match) throw new Error(`seed ${seed}: no y(0) found in: ${p.statement}`)
      const y0 = Number(y0Match[1])

      const upperLabel = p.answer.options.find((o) => o.id === 'upper')?.label
      const lowerLabel = p.answer.options.find((o) => o.id === 'lower')?.label
      if (!upperLabel || !lowerLabel) throw new Error(`seed ${seed}: missing upper/lower options`)
      const a = Number(upperLabel.match(/y = (-?\d+)/)?.[1])
      const b = Number(lowerLabel.match(/y = (-?\d+)/)?.[1])
      const lo = Math.min(a, b)
      const hi = Math.max(a, b)

      // Confirm the two labelled candidates really are roots of f, and that f has the expected
      // downward-parabola shape: negative below lo, positive between, negative above hi.
      expect(Math.abs(evalReal(f, { y: lo }) ?? NaN), `seed ${seed}: f(${lo})`).toBeLessThan(1e-6)
      expect(Math.abs(evalReal(f, { y: hi }) ?? NaN), `seed ${seed}: f(${hi})`).toBeLessThan(1e-6)
      const mid = (lo + hi) / 2
      expect(evalReal(f, { y: mid }) ?? 0, `seed ${seed}: f(mid) > 0`).toBeGreaterThan(0)
      expect(evalReal(f, { y: lo - 1 }) ?? 0, `seed ${seed}: f(below lo) < 0`).toBeLessThan(0)
      expect(evalReal(f, { y: hi + 1 }) ?? 0, `seed ${seed}: f(above hi) < 0`).toBeLessThan(0)

      const expected = y0 > lo ? 'upper' : 'collapse'
      expect(p.answer.correctId, `seed ${seed}: y0=${y0}, lo=${lo}, hi=${hi}`).toBe(expected)
      expect(p.answer.correctId, `seed ${seed}: "lower" should never be the correct answer`).not.toBe('lower')
    }
  })
})

/** The "y' = ...$" ODE expression carried by every euler_method statement. */
function extractYPrime(statement: string): string {
  const match = statement.match(/y' = ([^$]+)\$/)
  if (!match) throw new Error(`no y' found in: ${statement}`)
  return match[1]
}

describe('euler_method', () => {
  it('tier 1: one Euler step, recomputed independently from the parsed slope function', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('euler_method').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected a number answer`)
      const match = p.statement.match(/step size \$h = (-?[\d.]+)\$ to estimate \$y\((-?[\d.]+)\)\$ for \$y' = ([^$]+)\$, \$y\((-?[\d.]+)\) = (-?[\d.]+)\$/)
      if (!match) throw new Error(`seed ${seed}: could not parse statement: ${p.statement}`)
      const [, hStr, t1Str, fLatex, t0Str, y0Str] = match
      const h = Number(hStr)
      const t0 = Number(t0Str)
      const y0 = Number(y0Str)
      const f = mustParse(fLatex, `seed ${seed}: slope function`)
      const f0 = evalReal(f, { t: t0, y: y0 })
      if (f0 === null) throw new Error(`seed ${seed}: f undefined at (${t0}, ${y0})`)
      expect(Number(t1Str), `seed ${seed}: t1 = t0 + h`).toBeCloseTo(t0 + h, 9)
      const y1 = y0 + h * f0
      expect(Number(p.answer.value), `seed ${seed}`).toBeCloseTo(y1, 6)
    }
  })

  it('tier 2: the multi-step table, rebuilt from scratch from the parsed autonomous slope function', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('euler_method').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected a number answer`)
      const match = p.statement.match(/y\((-?\d+)\) = (-?\d+)\$, take (\d+) Euler steps of size \$h = 0\.5\$ for \$y' = ([^$]+)\$/)
      if (!match) throw new Error(`seed ${seed}: could not parse statement: ${p.statement}`)
      const [, t0Str, y0Str, stepsStr, fLatex] = match
      const steps = Number(stepsStr)
      const f = mustParse(fLatex, `seed ${seed}: slope function`)
      let y = Number(y0Str)
      let t = Number(t0Str)
      for (let i = 0; i < steps; i += 1) {
        const slope = evalReal(f, { y })
        if (slope === null) throw new Error(`seed ${seed}: f undefined at y=${y}`)
        y += 0.5 * slope
        t += 0.5
      }
      const finalMatch = p.statement.match(/estimate for \$y\((-?[\d.]+)\)\$\?/)
      if (!finalMatch) throw new Error(`seed ${seed}: no final time found in: ${p.statement}`)
      expect(Number(finalMatch[1]), `seed ${seed}: final t`).toBeCloseTo(t, 9)
      expect(Number(p.answer.value), `seed ${seed}`).toBeCloseTo(y, 6)
    }
  })

  it('tier 3: the Euler-vs-exact comparison matches an independent recomputation from the parsed expressions', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('euler_method').generate(createRng(seed), 3)
      const common = p.statement.match(/y\((-?\d+)\) = (-?\d+)\$ has exact solution \$y\(t\) = ([^$]+)\$\./)
      if (!common) throw new Error(`seed ${seed}: could not parse the IVP from: ${p.statement}`)
      const [, t0Str, y0Str, exactLatex] = common
      const yPrimeLatex = extractYPrime(p.statement)
      const t0 = Number(t0Str)
      const y0 = Number(y0Str)
      const yPrime = mustParse(yPrimeLatex, `seed ${seed}: y'`)
      const exact = mustParse(exactLatex, `seed ${seed}: exact solution`)

      const f0 = evalReal(yPrime, { t: t0 })
      if (f0 === null) throw new Error(`seed ${seed}: y' undefined at t0=${t0}`)

      if (p.answer.kind === 'number') {
        const stepMatch = p.statement.match(/size \$h = ([\d.]+)\$, find the error in the Euler estimate for \$y\((-?[\d.]+)\)\$/)
        if (!stepMatch) throw new Error(`seed ${seed}: could not parse the error-variant statement: ${p.statement}`)
        const h = Number(stepMatch[1])
        const t1 = Number(stepMatch[2])
        expect(t1, `seed ${seed}: t1 = t0 + h`).toBeCloseTo(t0 + h, 9)
        const eulerEstimate = y0 + h * f0
        const exactValue = evalReal(exact, { t: t1 })
        if (exactValue === null) throw new Error(`seed ${seed}: exact solution undefined at t=${t1}`)
        const error = eulerEstimate - exactValue
        expect(Number(p.answer.value), `seed ${seed}`).toBeCloseTo(error, 6)
      } else if (p.answer.kind === 'choice') {
        const stepMatch = p.statement.match(/size \$h = ([\d.]+)\$ overestimate or underestimate the true value of \$y\((-?[\d.]+)\)\$\?/)
        if (!stepMatch) throw new Error(`seed ${seed}: could not parse the choice-variant statement: ${p.statement}`)
        const h = Number(stepMatch[1])
        const t1 = Number(stepMatch[2])
        const eulerEstimate = y0 + h * f0
        const exactValue = evalReal(exact, { t: t1 })
        if (exactValue === null) throw new Error(`seed ${seed}: exact solution undefined at t=${t1}`)
        const error = eulerEstimate - exactValue
        expect(Math.abs(error), `seed ${seed}: error should be clearly nonzero`).toBeGreaterThan(1e-6)
        expect(p.answer.correctId, `seed ${seed}`).toBe(error < 0 ? 'underestimates' : 'overestimates')
      } else {
        throw new Error(`seed ${seed}: expected a number or choice answer`)
      }
    }
  })
})

describe('sir_model', () => {
  it('tier 1: R0 = beta/gamma, or I = N - S - R, recomputed independently', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('sir_model').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected a number answer`)

      const r0Match = p.statement.match(/\\beta = ([\d.]+)\$ per day and the recovery rate is \$\\gamma = ([\d.]+)\$/)
      const compartmentMatch = p.statement.match(/\$N = (\d+)\$ people\.[\s\S]*?\$S = (\d+)\$ susceptible and \$R = (\d+)\$ recovered/)

      if (r0Match) {
        const beta = Number(r0Match[1])
        const gamma = Number(r0Match[2])
        expect(Number(p.answer.value), `seed ${seed}`).toBeCloseTo(beta / gamma, 6)
      } else if (compartmentMatch) {
        const n = Number(compartmentMatch[1])
        const s = Number(compartmentMatch[2])
        const r = Number(compartmentMatch[3])
        expect(Number(p.answer.value), `seed ${seed}`).toBe(n - s - r)
      } else {
        throw new Error(`seed ${seed}: unrecognised tier-1 statement: ${p.statement}`)
      }
    }
  })

  it('tier 2: growth/decline verdict matches R0*S/N compared with 1, recomputed independently', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('sir_model').generate(createRng(seed), 2)
      if (p.answer.kind !== 'choice') throw new Error(`seed ${seed}: expected a choice answer`)
      const match = p.statement.match(/\\beta = ([\d.]+)\$ per day, recovery rate \$\\gamma = ([\d.]+)\$ per day, and total population \$N = (\d+)\$, there are currently \$S = (\d+)\$/)
      if (!match) throw new Error(`seed ${seed}: could not parse statement: ${p.statement}`)
      const [, betaStr, gammaStr, nStr, sStr] = match
      const beta = Number(betaStr)
      const gamma = Number(gammaStr)
      const n = Number(nStr)
      const s = Number(sStr)
      const r0 = beta / gamma
      const growthFactor = r0 * (s / n)
      expect(Math.abs(growthFactor - 1), `seed ${seed}: R0*S/N should be clearly off 1`).toBeGreaterThan(0.01)
      const expected = growthFactor > 1 ? 'the epidemic is growing' : 'the epidemic is dying out'
      expect(p.answer.correctId, `seed ${seed}`).toBe(expected)
    }
  })

  it('tier 3: herd-immunity and peak fractions equal 1-1/R0 and 1/R0, recomputed independently', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('sir_model').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected a number answer`)
      const match = p.statement.match(/R_\{0\} = ([\d.]+)\$/)
      if (!match) throw new Error(`seed ${seed}: no R0 found in: ${p.statement}`)
      const r0 = Number(match[1])
      const claimed = numberValue(p.answer.value)
      const isPeak = p.statement.includes('peak susceptible fraction')
      const expected = isPeak ? 1 / r0 : 1 - 1 / r0
      expect(claimed, `seed ${seed}`).toBeCloseTo(expected, 6)
    }
  })
})
