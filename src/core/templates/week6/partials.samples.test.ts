import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'
import { mathSegments } from '../testing'
import { TIERS, type Problem } from '../types'

// Every answer here is recomputed from the statement alone: the function is parsed back out of the
// LaTeX and differentiated numerically, so a slip in a template's hand-written derivative shows up.

const SEEDS = 30
const H = 1e-4
const PROBES: readonly (readonly [number, number])[] = [
  [0.7, -1.3],
  [-1.6, 0.4],
  [1.2, 1.9],
  [-0.5, -0.8],
]

type Fn = (vars: Record<string, number>) => number

function compile(latex: string): Fn {
  const expr = parseLatex(latex)
  if (!expr) throw new Error(`cannot parse "${latex}"`)
  return (vars) => {
    const v = evalReal(expr, vars)
    if (v === null) throw new Error(`cannot evaluate "${latex}" at ${JSON.stringify(vars)}`)
    return v
  }
}

const numberOf = (latex: string): number => compile(latex)({})

/** The body of the `$f(x,y) = …$` segment — the longest one, since "$f(x,y) = c$" can come first. */
function fOf(statement: string): Fn {
  const seg = mathSegments(statement)
    .filter((s) => s.startsWith('f(x,y) = '))
    .sort((a, b) => b.length - a.length)[0]
  if (!seg) throw new Error(`no f(x,y) in: ${statement}`)
  return compile(seg.slice('f(x,y) = '.length))
}

/** The first `$(a, b)$` segment. */
function pointOf(statement: string): [number, number] {
  const seg = mathSegments(statement).find((s) => /^\(-?\d+, -?\d+\)$/.test(s))
  if (!seg) throw new Error(`no point in: ${statement}`)
  const [a, b] = seg.slice(1, -1).split(', ').map(Number)
  return [a, b]
}

/** Entries of the first pmatrix in the statement. */
function vectorOf(statement: string): number[] {
  const m = statement.match(/\\begin\{pmatrix\}(.+?)\\end\{pmatrix\}/)
  if (!m) throw new Error(`no vector in: ${statement}`)
  return m[1].split('\\\\').map((entry) => numberOf(entry.trim()))
}

const fx = (f: Fn, x: number, y: number): number => (f({ x: x + H, y }) - f({ x: x - H, y })) / (2 * H)
const fy = (f: Fn, x: number, y: number): number => (f({ x, y: y + H }) - f({ x, y: y - H })) / (2 * H)
const grad = (f: Fn, x: number, y: number): [number, number] => [fx(f, x, y), fy(f, x, y)]

/** Second derivatives by central differences; exact for the quadratics these templates use. */
function hessian(f: Fn, x: number, y: number): { xx: number; yy: number; xy: number } {
  const h = 1e-3
  const at = (dx: number, dy: number) => f({ x: x + dx, y: y + dy })
  return {
    xx: (at(h, 0) - 2 * at(0, 0) + at(-h, 0)) / (h * h),
    yy: (at(0, h) - 2 * at(0, 0) + at(0, -h)) / (h * h),
    xy: (at(h, h) - at(h, -h) - at(-h, h) + at(-h, -h)) / (4 * h * h),
  }
}

/** The one critical point of a quadratic: a Newton step from the origin lands on it. */
function criticalPoint(f: Fn): [number, number] {
  const [gx, gy] = grad(f, 0, 0)
  const { xx, yy, xy } = hessian(f, 0, 0)
  const det = xx * yy - xy * xy
  return [-(yy * gx - xy * gy) / det, -(-xy * gx + xx * gy) / det]
}

function classify(f: Fn, x: number, y: number): string {
  const { xx, yy, xy } = hessian(f, x, y)
  const d = xx * yy - xy * xy
  if (Math.abs(d) < 1e-6) return 'inconclusive'
  if (d < 0) return 'saddle'
  return xx > 0 ? 'min' : 'max'
}

const close = (actual: number, expected: number, label: string): void => {
  expect(actual, label).toBeCloseTo(expected, 3)
}

function run(skillId: string, check: (p: Problem, label: string) => void): void {
  it.each(TIERS)('tier %i: every answer matches an independent recomputation', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate(skillId).generate(createRng(seed), tier)
      check(p, `seed ${seed}: ${p.statement}`)
    }
  })
}

describe('multivar_fns', () => {
  run('multivar_fns', (p, label) => {
    const s = p.statement
    const f = fOf(s)
    if (p.answer.kind === 'number') {
      const at = mathSegments(s).find((seg) => /^f\(-?\d+, -?\d+\)$/.test(seg))
      const [x, y] = at ? at.slice(2, -1).split(', ').map(Number) : pointOf(s)
      close(numberOf(p.answer.value), f({ x, y }), label)
    } else if (p.answer.kind === 'expression') {
      const c = Number(s.match(/level curve \$f\(x,y\) = (-?\d+)\$/)?.[1])
      const curve = compile(p.answer.value)
      ;[-2, -0.5, 1, 2.5].forEach((x) => close(f({ x, y: curve({ x }) }), c, label))
    } else if (p.answer.kind === 'choice') {
      if (/level curves of/.test(s)) {
        const src = mathSegments(s).find((seg) => seg.startsWith('f(x,y) = ')) ?? ''
        const squares = /x\^\{2\}/.test(src) && /y\^\{2\}/.test(src)
        // x² and y² with the same sign give circles (the templates keep the coefficients equal), opposite signs hyperbolas.
        const [ax, ay] = [f({ x: 1, y: 0 }) - f({ x: 0, y: 0 }), f({ x: 0, y: 1 }) - f({ x: 0, y: 0 })]
        const expected = squares ? (ax * ay > 0 ? 'circle' : 'hyperbola') : /xy/.test(src) ? 'hyperbola' : /\^\{2\}/.test(src) ? 'parabola' : 'line'
        if (expected === 'circle') close(ax, ay, `${label} (equal coefficients)`)
        expect(p.answer.correctId, label).toBe(expected)
      } else if (/domain/.test(s)) {
        // The correct option must describe exactly the points where f is defined.
        const { options, correctId } = p.answer
        const correct = options.find((o) => o.id === correctId)
        expect(correct, label).toBeDefined()
        const body = parseLatex(mathSegments(s)[0].slice('f(x,y) = '.length))
        if (!body) throw new Error(`cannot parse f in: ${s}`)
        const inside = (x: number, y: number): boolean => {
          const v = evalReal(body, { x, y })
          return v !== null && Number.isFinite(v)
        }
        const condition = mathSegments(correct?.label ?? '')[0]
        const [lhs, rhs] = condition.split(/<|\\le/)
        const strict = condition.includes('<') && !condition.includes('\\le')
        PROBES.concat([[3, -4], [-5, 2], [6, 1]]).forEach(([x, y]) => {
          const l = compile(lhs)({ x, y })
          const r = compile(rhs)({ x, y })
          const holds = strict ? l < r : l <= r
          if (Math.abs(l - r) > 1e-9) expect(inside(x, y), `${label} at (${x}, ${y})`).toBe(holds)
        })
      } else {
        throw new Error(`unrecognised statement: ${s}`)
      }
    }
  })
})

describe('partial_derivs', () => {
  run('partial_derivs', (p, label) => {
    const s = p.statement
    const f = fOf(s)
    if (p.answer.kind === 'number') {
      const m = s.match(/f_\{([xy])\}\((-?\d+), (-?\d+)\)/)
      if (!m) throw new Error(`unrecognised statement: ${s}`)
      const [x, y] = [Number(m[2]), Number(m[3])]
      close(numberOf(p.answer.value), m[1] === 'x' ? fx(f, x, y) : fy(f, x, y), label)
      return
    }
    if (p.answer.kind !== 'expression') throw new Error(`${label}: unexpected answer kind ${p.answer.kind}`)
    const answer = compile(p.answer.value)
    const second = s.match(/f_\{(xx|yy|xy)\}/)?.[1]
    const wrt = s.match(/\\partial ([xy])\}\$ for/)?.[1]
    PROBES.forEach(([x, y]) => {
      let expected: number
      if (second) {
        const hs = hessian(f, x, y)
        expected = second === 'xx' ? hs.xx : second === 'yy' ? hs.yy : hs.xy
      } else if (wrt) {
        expected = wrt === 'x' ? fx(f, x, y) : fy(f, x, y)
      } else {
        throw new Error(`unrecognised statement: ${s}`)
      }
      expect(answer({ x, y }), `${label} at (${x}, ${y})`).toBeCloseTo(expected, 2)
    })
  })
})

describe('directional_deriv', () => {
  run('directional_deriv', (p, label) => {
    const s = p.statement
    const f = fOf(s)
    const [a, b] = pointOf(s)
    const [gx, gy] = grad(f, a, b)
    if (p.answer.kind === 'vector') {
      // A direction of zero change: orthogonal to the gradient, and not the zero vector.
      const [u, v] = p.answer.components.map(numberOf)
      expect(Math.hypot(u, v), label).toBeGreaterThan(0)
      close(gx * u + gy * v, 0, label)
    } else if (p.answer.kind === 'number') {
      const value = numberOf(p.answer.value)
      if (/largest possible/.test(s)) {
        close(value, Math.hypot(gx, gy), label)
      } else {
        const [u, v] = vectorOf(s)
        const n = Math.hypot(u, v)
        if (/the unit vector/.test(s)) close(n, 1, `${label} (unit vector)`)
        close(value, (gx * u + gy * v) / n, label)
      }
    } else {
      throw new Error(`${label}: unexpected answer kind ${p.answer.kind}`)
    }
  })
})

describe('critical_2d', () => {
  run('critical_2d', (p, label) => {
    const s = p.statement
    const f = fOf(s)
    const [cx, cy] = criticalPoint(f)
    const [gx, gy] = grad(f, cx, cy)
    close(Math.hypot(gx, gy), 0, `${label} (recomputed point is critical)`)
    if (/^The point/.test(s)) {
      const [a, b] = pointOf(s)
      close(a, cx, label)
      close(b, cy, label)
    }
    if (p.answer.kind === 'vector') {
      const [x, y] = p.answer.components.map(numberOf)
      close(x, cx, label)
      close(y, cy, label)
    } else if (p.answer.kind === 'number') {
      close(numberOf(p.answer.value), f({ x: cx, y: cy }), label)
    } else if (p.answer.kind === 'choice') {
      expect(p.answer.correctId, label).toBe(classify(f, cx, cy))
    } else {
      throw new Error(`${label}: unexpected answer kind ${p.answer.kind}`)
    }
  })
})
