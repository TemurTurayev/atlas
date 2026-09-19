# Atlas 1A — Core, part 1: foundation (scaffold, time, rng, math, graph)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Project scaffold plus the pure building blocks every other module uses: day keys, seeded RNG, exact rational/polynomial helpers with LaTeX output, and the 125-node skill graph.

**Architecture:** Pure TypeScript modules under `src/core/`, no React, each with a colocated `*.test.ts` (Vitest, node environment). Immutable data (`readonly`), small files, no `console.log`.

**Tech Stack:** Vite 8, React 19, TypeScript 5.9 strict, Vitest 5, fast-check 4.

Spec: `docs/specs/2026-09-19-atlas-design.md`. Research: `docs/research/`.

**Plan series:** part1 (this) → part2 (checker + templates) → part3 (learner, scheduler, session engine, data). Parts 2 and 3 depend on part 1.

**Conventions for every task**
- Working directory: `/Users/temur/Desktop/Claude/atlas`.
- Do **not** commit — the orchestrator reviews and commits. Only touch the files listed in your task.
- Run the exact test command given; paste the final PASS/FAIL summary in your report.
- Immutability: never mutate inputs; return new objects/arrays. Local scratch arrays inside a function are fine.

---

## File structure (whole 1A)

```
atlas/
  package.json, tsconfig.json, vite.config.ts, index.html, .gitignore
  src/main.tsx, src/App.tsx                      placeholder UI (replaced in plan 1B)
  src/core/
    time/day.ts                                  day keys, day arithmetic
    random/rng.ts                                seeded PRNG (mulberry32)
    math/latex.ts, rational.ts, poly.ts          exact helpers + LaTeX formatting
    graph/nodes.ts, graph.ts, index.ts           125-node skill graph, ladder, ancestors
    templates/types.ts, registry.ts              template contract + auto-registry   (part 2)
    templates/week0/*.ts, week1/*.ts             generators                           (part 2 samples, plan 1C rest)
    checker/*.ts                                 answer checking                      (part 2)
    scheduler/fsrs.ts                            ts-fsrs wrapper                      (part 3)
    learner/progress.ts, meta.ts, jump.ts, repair.ts                                  (part 3)
    streak/streak.ts, forecast/forecast.ts                                            (part 3)
    session/world.ts, start.ts, next.ts, submit.ts                                    (part 3)
  src/data/db.ts, repo.ts                        Dexie persistence                    (part 3)
```

---

### Task 1: Scaffold

**Files:**
- Create: `package.json` (via npm), `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/core/sanity.test.ts`

- [ ] **Step 1: Initialise npm and install dependencies**

```bash
cd /Users/temur/Desktop/Claude/atlas
npm init -y >/dev/null
npm pkg set name=atlas version=0.1.0 private=true type=module
npm pkg set scripts.dev="vite" scripts.build="tsc --noEmit && vite build" scripts.preview="vite preview" scripts.test="vitest run" scripts.coverage="vitest run --coverage" scripts.typecheck="tsc --noEmit"
npm pkg delete main keywords author license description
npm install react@^19.3.0 react-dom@^19.3.0 zustand@^5.0.15 dexie@^4.4.6 katex@^0.18.7 motion@^13.4.0
npm install --save-exact ts-fsrs@5.4.2 @cortex-js/compute-engine@0.131.3 mathlive@0.110.0
npm install -D vite@^8.3.0 @vitejs/plugin-react@^6.1.1 typescript@~5.9.3 @types/react @types/react-dom @types/node vitest@^5.0.1 @vitest/coverage-v8@^5.0.1 fast-check@^4.10.1 fake-indexeddb@^6 tailwindcss@^4.3.3 @tailwindcss/vite@^4.3.3 vite-plugin-pwa@^1.3.0 @playwright/test@^1.63.0
```

(katex 0.18 bundles its own types — do not install `@types/katex`. Keep TypeScript on 5.9.x even though 7.x exists.) If npm reports an unmet **required** peer dependency of `@vitejs/plugin-react` (optional ones like `babel-plugin-react-compiler` can be ignored), install that peer.

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 3: Write `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    testTimeout: 60_000,
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/data/**'],
      exclude: ['**/*.test.ts'],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 75 },
    },
  },
})
```

- [ ] **Step 4: Write `index.html`, `src/main.tsx`, `src/App.tsx`, `.gitignore`**

`index.html`:
```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Атлас</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`src/App.tsx`:
```tsx
export function App() {
  return <h1>Атлас</h1>
}
```

`.gitignore`:
```
node_modules
dist
coverage
playwright-report
test-results
.DS_Store
*.local
```

- [ ] **Step 5: Sanity test** — `src/core/sanity.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

describe('toolchain', () => {
  it('runs vitest', () => {
    expect([1, 2, 3].map((n) => n * 2)).toEqual([2, 4, 6])
  })
})
```

- [ ] **Step 6: Verify**

Run: `npm test && npm run typecheck && npx vite build`
Expected: 1 test passed; typecheck exits 0; build writes `dist/`.

---

### Task 2: Day keys and seeded RNG

**Files:**
- Create: `src/core/time/day.ts`, `src/core/time/day.test.ts`, `src/core/random/rng.ts`, `src/core/random/rng.test.ts`

- [ ] **Step 1: Write failing tests** — `src/core/time/day.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { addDays, dayKey, daysBetween, endOfDay } from './day'

describe('day keys', () => {
  it('formats the local day with zero padding', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })

  it('counts whole days between keys across month and year boundaries', () => {
    expect(daysBetween('2026-09-19', '2026-09-20')).toBe(1)
    expect(daysBetween('2026-12-31', '2027-01-02')).toBe(2)
    expect(daysBetween('2026-09-20', '2026-09-19')).toBe(-1)
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
  })

  it('adds days to a key', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
  })

  it('returns the last millisecond of the local day', () => {
    const end = endOfDay(new Date(2026, 8, 19, 8, 0))
    expect([end.getDate(), end.getHours(), end.getMinutes(), end.getMilliseconds()]).toEqual([19, 23, 59, 999])
  })
})
```

`src/core/random/rng.test.ts`:
```ts
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { createRng } from './rng'

describe('createRng', () => {
  it('is deterministic for a seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    const seqA = Array.from({ length: 5 }, () => a.next())
    const seqB = Array.from({ length: 5 }, () => b.next())
    expect(seqA).toEqual(seqB)
    expect(createRng(43).next()).not.toBe(seqA[0])
  })

  it('int stays inside the inclusive range', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: -50, max: 50 }), fc.integer({ min: 0, max: 30 }), (seed, min, span) => {
        const rng = createRng(seed)
        for (let i = 0; i < 50; i += 1) {
          const v = rng.int(min, min + span)
          if (v < min || v > min + span || !Number.isInteger(v)) return false
        }
        return true
      }),
    )
  })

  it('int reaches both ends of a small range', () => {
    const rng = createRng(7)
    const seen = new Set(Array.from({ length: 400 }, () => rng.int(1, 3)))
    expect([...seen].sort()).toEqual([1, 2, 3])
  })

  it('intExcept never returns an excluded value', () => {
    const rng = createRng(1)
    for (let i = 0; i < 500; i += 1) expect([0, 1, -1]).not.toContain(rng.intExcept(-3, 3, [0, 1, -1]))
  })

  it('shuffle returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5] as const
    const out = createRng(9).shuffle(input)
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5])
    expect(input).toEqual([1, 2, 3, 4, 5])
  })

  it('rejects invalid input', () => {
    const rng = createRng(1)
    expect(() => rng.int(3, 1)).toThrow()
    expect(() => rng.pick([])).toThrow()
    expect(() => rng.intExcept(0, 0, [0])).toThrow()
  })

  it('seed produces 32-bit unsigned integers', () => {
    const rng = createRng(5)
    for (let i = 0; i < 100; i += 1) {
      const s = rng.seed()
      expect(Number.isInteger(s) && s >= 0 && s < 2 ** 32).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run src/core/time src/core/random`
Expected: FAIL — cannot resolve `./day` / `./rng`.

- [ ] **Step 3: Implement** — `src/core/time/day.ts`:

```ts
const MS_PER_DAY = 86_400_000

const pad = (n: number): string => String(n).padStart(2, '0')

/** Local calendar day key, e.g. "2026-09-19". */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function keyToUtcMs(key: string): number {
  const [year, month, day] = key.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((keyToUtcMs(to) - keyToUtcMs(from)) / MS_PER_DAY)
}

export function addDays(key: string, days: number): string {
  const d = new Date(keyToUtcMs(key) + days * MS_PER_DAY)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** Last millisecond of the local day containing `date`. */
export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}
```

`src/core/random/rng.ts`:
```ts
export interface Rng {
  /** Float in [0, 1). */
  next(): number
  /** Integer in [min, max], inclusive. */
  int(min: number, max: number): number
  /** Integer in [min, max] that is not in `excluded`. */
  intExcept(min: number, max: number, excluded: readonly number[]): number
  pick<T>(items: readonly T[]): T
  /** New shuffled array; the input is not modified. */
  shuffle<T>(items: readonly T[]): T[]
  chance(probability: number): boolean
  /** Fresh unsigned 32-bit seed. */
  seed(): number
}

/** Deterministic PRNG (mulberry32): the same seed always yields the same sequence. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const int = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new Error(`rng.int: invalid range [${min}, ${max}]`)
    }
    return min + Math.floor(next() * (max - min + 1))
  }

  return {
    next,
    int,
    intExcept(min, max, excluded) {
      for (let i = 0; i < 1000; i += 1) {
        const value = int(min, max)
        if (!excluded.includes(value)) return value
      }
      throw new Error(`rng.intExcept: nothing in [${min}, ${max}] outside [${excluded.join(', ')}]`)
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error('rng.pick: empty list')
      return items[int(0, items.length - 1)]
    },
    shuffle<T>(items: readonly T[]): T[] {
      const copy = [...items]
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = int(0, i)
        const tmp = copy[i]
        copy[i] = copy[j]
        copy[j] = tmp
      }
      return copy
    },
    chance: (probability) => next() < probability,
    seed: () => Math.floor(next() * 4294967296) >>> 0,
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/core/time src/core/random`
Expected: PASS (11 tests).

---

### Task 3: Exact math helpers with LaTeX output

**Files:**
- Create: `src/core/math/latex.ts`, `src/core/math/rational.ts`, `src/core/math/poly.ts`, `src/core/math/math.test.ts`

- [ ] **Step 1: Write failing tests** — `src/core/math/math.test.ts`:

```ts
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { coefPrefix, joinTerms, linear, paren, setLatex } from './latex'
import { degree, polyAdd, polyEval, polyFromRoots, polyMul, polyScale, polyToLatex } from './poly'
import { add, div, gcd, lcm, mul, neg, rat, ratToLatex, sub, toNumber } from './rational'

describe('latex helpers', () => {
  it('coefPrefix hides ±1', () => {
    expect([coefPrefix(1), coefPrefix(-1), coefPrefix(3), coefPrefix(-4)]).toEqual(['', '-', '3', '-4'])
  })
  it('joinTerms inserts plus signs and drops zeros', () => {
    expect(joinTerms(['3x^{2}', '-5x', '6'])).toBe('3x^{2}-5x+6')
    expect(joinTerms(['', '0', '-x'])).toBe('-x')
    expect(joinTerms([])).toBe('0')
  })
  it('linear formats a·v + b', () => {
    expect(linear(3, -7)).toBe('3x-7')
    expect(linear(1, 2)).toBe('x+2')
    expect(linear(-1, 0, 't')).toBe('-t')
    expect(linear(0, 5)).toBe('5')
  })
  it('paren wraps negatives only', () => {
    expect(paren(-3)).toBe('\\left(-3\\right)')
    expect(paren(4)).toBe('4')
    expect(paren('-\\frac{1}{2}')).toBe('\\left(-\\frac{1}{2}\\right)')
  })
  it('setLatex lists elements or shows the empty set', () => {
    expect(setLatex([1, 2, 3])).toBe('\\{1, 2, 3\\}')
    expect(setLatex([])).toBe('\\emptyset')
  })
})

describe('rational', () => {
  it('normalises sign and lowest terms', () => {
    expect(rat(6, -8)).toEqual({ n: -3, d: 4 })
    expect(rat(0, -5)).toEqual({ n: 0, d: 1 })
  })
  it('does arithmetic', () => {
    expect(add(rat(1, 2), rat(1, 3))).toEqual(rat(5, 6))
    expect(sub(rat(3, 4), rat(2, 3))).toEqual(rat(1, 12))
    expect(mul(rat(2, 3), rat(9, 4))).toEqual(rat(3, 2))
    expect(div(rat(2, 3), rat(4, 9))).toEqual(rat(3, 2))
    expect(neg(rat(1, 2))).toEqual(rat(-1, 2))
    expect(toNumber(rat(3, 4))).toBe(0.75)
  })
  it('formats LaTeX', () => {
    expect(ratToLatex(rat(5))).toBe('5')
    expect(ratToLatex(rat(-3, 4))).toBe('-\\frac{3}{4}')
    expect(ratToLatex(rat(3, 4))).toBe('\\frac{3}{4}')
  })
  it('rejects bad input', () => {
    expect(() => rat(1, 0)).toThrow()
    expect(() => rat(1.5, 2)).toThrow()
    expect(() => div(rat(1), rat(0))).toThrow()
  })
  it('gcd and lcm', () => {
    expect(gcd(12, -18)).toBe(6)
    expect(lcm(4, 6)).toBe(12)
  })
})

describe('polynomials (ascending coefficients)', () => {
  it('builds from roots', () => {
    expect(polyFromRoots(1, [2, 3])).toEqual([6, -5, 1])
    expect(polyFromRoots(2, [1])).toEqual([-2, 2])
  })
  it('multiplies, adds, scales', () => {
    expect(polyMul([1, 1], [-1, 1])).toEqual([-1, 0, 1])
    expect(polyAdd([1, 2, 3], [-1, -2])).toEqual([0, 0, 3])
    expect(polyScale([1, -2], 3)).toEqual([3, -6])
    expect(degree([0, 0, 3, 0])).toBe(2)
  })
  it('formats LaTeX in descending order', () => {
    expect(polyToLatex([6, -5, 1])).toBe('x^{2}-5x+6')
    expect(polyToLatex([-4, 8, -6, 2])).toBe('2x^{3}-6x^{2}+8x-4')
    expect(polyToLatex([0, -1])).toBe('-x')
    expect(polyToLatex([0])).toBe('0')
    expect(polyToLatex([4, 0, -5, 0, 1], 't')).toBe('t^{4}-5t^{2}+4')
  })
  it('every root evaluates to zero', () => {
    fc.assert(
      fc.property(fc.integer({ min: -5, max: 5 }).filter((a) => a !== 0), fc.array(fc.integer({ min: -6, max: 6 }), { maxLength: 4 }), (a, roots) =>
        roots.every((r) => polyEval(polyFromRoots(a, roots), r) === 0),
      ),
    )
  })
})
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run src/core/math`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement** — `src/core/math/latex.ts`:

```ts
/** Coefficient prefix for a term: 1 → "", -1 → "-", 3 → "3". */
export function coefPrefix(c: number): string {
  if (c === 1) return ''
  if (c === -1) return '-'
  return String(c)
}

/** Joins signed terms: ["3x^{2}", "-5x", "6"] → "3x^{2}-5x+6". Drops "" and "0"; empty → "0". */
export function joinTerms(terms: readonly string[]): string {
  const parts = terms.filter((t) => t !== '' && t !== '0')
  if (parts.length === 0) return '0'
  return parts.map((t, i) => (i === 0 || t.startsWith('-') ? t : `+${t}`)).join('')
}

/** a·v + b, e.g. linear(3, -7) → "3x-7". */
export function linear(a: number, b: number, v = 'x'): string {
  return joinTerms([a === 0 ? '' : `${coefPrefix(a)}${v}`, String(b)])
}

/** Wraps negative numbers/LaTeX in \left( \right): -3 → "\left(-3\right)". */
export function paren(value: number | string): string {
  const text = String(value)
  return text.startsWith('-') ? `\\left(${text}\\right)` : text
}

/** "\{1, 2, 3\}" or "\emptyset". */
export function setLatex(elements: readonly (string | number)[]): string {
  return elements.length === 0 ? '\\emptyset' : `\\{${elements.join(', ')}\\}`
}
```

`src/core/math/rational.ts`:
```ts
export interface Rational {
  readonly n: number
  readonly d: number
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const t = x % y
    x = y
    y = t
  }
  return x
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b)
}

/** Normalised fraction: positive denominator, lowest terms. */
export function rat(n: number, d = 1): Rational {
  if (!Number.isInteger(n) || !Number.isInteger(d)) throw new Error(`rat: non-integer ${n}/${d}`)
  if (d === 0) throw new Error('rat: zero denominator')
  const g = gcd(n, d) || 1
  const sign = d < 0 ? -1 : 1
  return { n: (sign * n) / g + 0, d: (sign * d) / g }
}

export const add = (a: Rational, b: Rational): Rational => rat(a.n * b.d + b.n * a.d, a.d * b.d)
export const sub = (a: Rational, b: Rational): Rational => rat(a.n * b.d - b.n * a.d, a.d * b.d)
export const mul = (a: Rational, b: Rational): Rational => rat(a.n * b.n, a.d * b.d)
export const neg = (a: Rational): Rational => rat(-a.n, a.d)
export const isInteger = (a: Rational): boolean => a.d === 1
export const toNumber = (a: Rational): number => a.n / a.d
export const equals = (a: Rational, b: Rational): boolean => a.n === b.n && a.d === b.d

export function div(a: Rational, b: Rational): Rational {
  if (b.n === 0) throw new Error('div: division by zero')
  return rat(a.n * b.d, a.d * b.n)
}

export function ratToLatex(a: Rational): string {
  if (a.d === 1) return String(a.n)
  return a.n < 0 ? `-\\frac{${-a.n}}{${a.d}}` : `\\frac{${a.n}}{${a.d}}`
}
```

`src/core/math/poly.ts`:
```ts
import { coefPrefix, joinTerms } from './latex'

/** Polynomial as ascending coefficients: [c0, c1, c2, …] = c0 + c1·x + c2·x². */
export type Poly = readonly number[]

export function trim(p: Poly): Poly {
  let end = p.length
  while (end > 1 && p[end - 1] === 0) end -= 1
  return p.length === 0 ? [0] : p.slice(0, end)
}

export const degree = (p: Poly): number => trim(p).length - 1

export function polyAdd(a: Poly, b: Poly): Poly {
  return Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] ?? 0) + (b[i] ?? 0))
}

export function polyMul(a: Poly, b: Poly): Poly {
  const out = new Array<number>(a.length + b.length - 1).fill(0)
  a.forEach((x, i) => b.forEach((y, j) => (out[i + j] += x * y)))
  return out
}

export const polyScale = (p: Poly, k: number): Poly => p.map((c) => c * k)

/** leading · Π (x − r). */
export function polyFromRoots(leading: number, roots: readonly number[]): Poly {
  return roots.reduce<Poly>((acc, r) => polyMul(acc, [-r, 1]), [leading])
}

export function polyEval(p: Poly, x: number): number {
  return p.reduceRight((acc, c) => acc * x + c, 0)
}

/** Descending LaTeX, e.g. [6, -5, 1] → "x^{2}-5x+6". */
export function polyToLatex(p: Poly, v = 'x'): string {
  const c = trim(p)
  const terms: string[] = []
  for (let k = c.length - 1; k >= 0; k -= 1) {
    const a = c[k]
    if (a === 0) continue
    if (k === 0) terms.push(String(a))
    else terms.push(`${coefPrefix(a)}${k === 1 ? v : `${v}^{${k}}`}`)
  }
  return joinTerms(terms)
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/core/math`
Expected: PASS.

---

### Task 4: Skill graph (125 nodes)

**Files:**
- Create: `src/core/graph/nodes.ts`, `src/core/graph/graph.ts`, `src/core/graph/index.ts`, `src/core/graph/graph.test.ts`

- [ ] **Step 1: Write failing tests** — `src/core/graph/graph.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildGraph } from './graph'
import { GRAPH } from './index'
import { EXAM_WEEKS, NODES, type SkillNode } from './nodes'

const node = (id: string, week: number, prereqs: string[] = []): SkillNode => ({
  id,
  week,
  prereqs,
  title: { en: id, ru: id },
  highYield: false,
})

describe('skill graph data', () => {
  it('has 125 unique nodes with Russian and English titles', () => {
    expect(NODES).toHaveLength(125)
    expect(new Set(NODES.map((n) => n.id)).size).toBe(125)
    NODES.forEach((n) => {
      expect(n.title.en.length).toBeGreaterThan(2)
      expect(n.title.ru.length).toBeGreaterThan(2)
    })
  })

  it('has 24 foundation nodes and 17 week-1 nodes', () => {
    expect(NODES.filter((n) => n.week === 0)).toHaveLength(24)
    expect(NODES.filter((n) => n.week === 1)).toHaveLength(17)
  })

  it('only uses exam weeks (plus week 0)', () => {
    NODES.forEach((n) => expect([0, ...EXAM_WEEKS]).toContain(n.week))
  })

  it('marks high-yield nodes', () => {
    const hy = NODES.filter((n) => n.highYield).map((n) => n.id)
    expect(hy).toContain('set_ops')
    expect(hy).toContain('char_poly')
    expect(hy.length).toBe(21)
  })

  it('builds: ladder is topological', () => {
    GRAPH.ladder.forEach((id, index) => {
      GRAPH.node(id).prereqs.forEach((p) => expect(GRAPH.ladderIndex.get(p)).toBeLessThan(index))
    })
    expect(GRAPH.ladder[0]).toBe('int_neg')
  })

  it('computes transitive ancestors', () => {
    const a = GRAPH.ancestors('quadratic_eq')
    expect(a.has('fractions')).toBe(true)
    expect(a.has('int_neg')).toBe(true)
    expect(a.has('quadratic_eq')).toBe(false)
    expect(GRAPH.ancestors('int_neg').size).toBe(0)
  })
})

describe('buildGraph validation', () => {
  it('rejects unknown prerequisites', () => {
    expect(() => buildGraph([node('a', 0, ['missing'])])).toThrow(/Unknown prerequisite/)
  })
  it('rejects cycles', () => {
    expect(() => buildGraph([node('a', 0, ['b']), node('b', 0, ['a'])])).toThrow(/Cycle/)
  })
  it('rejects prerequisites from a later week', () => {
    expect(() => buildGraph([node('a', 1), node('b', 0, ['a'])])).toThrow(/later week/)
  })
  it('rejects duplicate ids', () => {
    expect(() => buildGraph([node('a', 0), node('a', 0)])).toThrow(/Duplicate/)
  })
  it('throws for unknown ids at lookup', () => {
    expect(() => GRAPH.node('nope')).toThrow()
  })
})
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run src/core/graph`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `src/core/graph/nodes.ts`**

```ts
export interface SkillNode {
  readonly id: string
  /** Course week (0 = school foundations). */
  readonly week: number
  readonly title: { readonly en: string; readonly ru: string }
  readonly prereqs: readonly string[]
  readonly highYield: boolean
}

/** Weeks that appear in the exam (8 and 11 excluded per Winkler, 14.09.2026). */
export const EXAM_WEEKS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 9, 10, 12, 13, 14]

const HIGH_YIELD: ReadonlySet<string> = new Set([
  'set_ops', 'functions', 'vec_angle', 'matrix_mult', 'det_3x3', 'gauss_elim', 'char_poly',
  'chain_rule', 'product_quotient', 'extrema_1d', 'by_parts', 'substitution', 'gradient',
  'separation', 'equilibria', 'ppv_prevalence', 'bayes', 'conf_interval', 'complex_arith',
  'ideal_gas', 'first_law',
])

type Row = readonly [id: string, week: number, en: string, ru: string, prereqs: readonly string[]]

const ROWS: readonly Row[] = [
  ['int_neg', 0, 'Integers & negative numbers', 'Целые и отрицательные числа', []],
  ['order_ops', 0, 'Order of operations', 'Порядок действий', ['int_neg']],
  ['fractions', 0, 'Fraction arithmetic', 'Действия с дробями', ['order_ops']],
  ['percent_ratio', 0, 'Decimals, percent, ratios', 'Десятичные дроби, проценты, пропорции', ['fractions']],
  ['powers', 0, 'Integer exponents, exponent laws', 'Степени и их свойства', ['fractions']],
  ['roots', 0, 'Roots, rational exponents', 'Корни и дробные степени', ['powers']],
  ['sci_notation', 0, 'Scientific notation, sig figs', 'Научная запись числа', ['powers', 'percent_ratio']],
  ['units', 0, 'SI prefixes, unit conversion', 'Единицы СИ и перевод единиц', ['sci_notation']],
  ['algebra_expr', 0, 'Substitution, like terms', 'Подстановка и подобные слагаемые', ['order_ops', 'fractions']],
  ['expand', 0, 'Expanding, binomial formulas', 'Раскрытие скобок, формулы сокращённого умножения', ['algebra_expr', 'powers']],
  ['factor', 0, 'Factoring', 'Разложение на множители', ['expand']],
  ['alg_fractions', 0, 'Algebraic fractions', 'Алгебраические дроби', ['factor']],
  ['linear_eq', 0, 'Linear equations', 'Линейные уравнения', ['algebra_expr']],
  ['rearrange', 0, 'Rearranging formulas', 'Выражение переменной из формулы', ['linear_eq', 'alg_fractions']],
  ['quadratic_eq', 0, 'Quadratic formula, discriminant', 'Квадратные уравнения, дискриминант', ['factor', 'roots']],
  ['sim_eq_2x2', 0, '2×2 simultaneous equations', 'Системы двух линейных уравнений', ['linear_eq']],
  ['inequalities', 0, 'Linear, quadratic, abs-value inequalities', 'Неравенства', ['linear_eq', 'quadratic_eq']],
  ['sigma_notation', 0, 'Summation notation', 'Знак суммы Σ', ['order_ops']],
  ['geometry', 0, 'Angles, areas, volumes', 'Углы, площади, объёмы', ['order_ops']],
  ['pythagoras', 0, 'Pythagoras', 'Теорема Пифагора', ['roots', 'geometry']],
  ['lines_2d', 0, 'Coordinates, distance, straight lines', 'Координаты, расстояние, прямые', ['linear_eq', 'pythagoras']],
  ['graphs_basic', 0, 'Reading graphs: line, parabola, 1/x', 'Графики: прямая, парабола, гипербола', ['lines_2d', 'quadratic_eq']],
  ['trig_triangle', 0, 'Right-triangle trigonometry', 'Тригонометрия прямоугольного треугольника', ['pythagoras', 'fractions']],
  ['radians', 0, 'Radians, unit circle', 'Радианы и единичная окружность', ['trig_triangle', 'geometry']],

  ['sets', 1, 'Sets, ℕ ℤ ℚ ℝ', 'Множества и числовые множества', ['int_neg']],
  ['intervals', 1, 'Interval notation', 'Интервалы', ['sets', 'inequalities']],
  ['set_ops', 1, 'Union, intersection, difference', 'Операции над множествами', ['sets']],
  ['product_powerset', 1, 'Cartesian product, power set', 'Декартово произведение и булеан', ['set_ops']],
  ['functions', 1, 'Domain, codomain, image', 'Функция: область определения и значений', ['sets', 'intervals', 'alg_fractions']],
  ['injective', 1, 'Injective, surjective, bijective', 'Инъекция, сюръекция, биекция', ['functions']],
  ['composition', 1, 'Composite functions', 'Композиция функций', ['functions']],
  ['inverse_fn', 1, 'Inverse functions', 'Обратная функция', ['injective', 'composition', 'rearrange']],
  ['transformations', 1, 'Shifts, stretches, reflections', 'Сдвиги и растяжения графиков', ['graphs_basic', 'composition']],
  ['polynomials', 1, 'Degree, roots, factor theorem', 'Многочлены и их корни', ['factor', 'quadratic_eq']],
  ['poly_division', 1, 'Polynomial long division', 'Деление многочленов столбиком', ['polynomials']],
  ['exp_fn', 1, 'Exponential functions, e', 'Показательная функция, число e', ['roots', 'graphs_basic']],
  ['log_laws', 1, 'Logarithms, log laws', 'Логарифмы и их свойства', ['exp_fn']],
  ['exp_log_eq', 1, 'Exponential and log equations', 'Показательные и логарифмические уравнения', ['log_laws', 'rearrange']],
  ['trig_fns', 1, 'Trig graphs, exact values, identities', 'Тригонометрические функции', ['radians', 'transformations']],
  ['limits', 1, 'Limits (0/0, x→∞)', 'Пределы', ['alg_fractions', 'polynomials']],
  ['continuity', 1, 'Continuity, piecewise functions', 'Непрерывность', ['limits']],

  ['vectors', 2, 'Components, addition, scaling', 'Векторы: координаты, сложение', ['lines_2d']],
  ['vec_length', 2, 'Length, unit vector', 'Длина вектора, единичный вектор', ['vectors', 'pythagoras']],
  ['dot_product', 2, 'Dot product, orthogonality', 'Скалярное произведение', ['vectors']],
  ['vec_angle', 2, 'Angle between vectors', 'Угол между векторами', ['dot_product', 'vec_length', 'trig_fns']],
  ['cross_product', 2, 'Cross product', 'Векторное произведение', ['vectors']],
  ['lines_param', 2, 'Parametric lines in 2D/3D', 'Параметрическое уравнение прямой', ['vectors', 'lines_2d']],
  ['planes', 2, 'Plane equations, line–plane intersection', 'Уравнение плоскости', ['dot_product', 'cross_product', 'lines_param']],
  ['linsys_geometry', 2, 'Systems: 0, 1 or ∞ solutions', 'Системы уравнений: 0, 1 или ∞ решений', ['sim_eq_2x2', 'planes']],

  ['matrix_basics', 3, 'Matrix notation, sum, transpose', 'Матрицы: сумма, транспонирование', ['vectors']],
  ['matrix_mult', 3, 'Matrix products', 'Умножение матриц', ['matrix_basics', 'dot_product']],
  ['det_2x2', 3, '2×2 determinant', 'Определитель 2×2', ['matrix_basics']],
  ['det_3x3', 3, '3×3 determinant', 'Определитель 3×3', ['det_2x2']],
  ['inverse_2x2', 3, '2×2 inverse', 'Обратная матрица 2×2', ['det_2x2', 'matrix_mult']],
  ['gauss_elim', 3, 'Gaussian elimination', 'Метод Гаусса', ['linsys_geometry', 'matrix_basics']],
  ['gauss_jordan_inv', 3, 'Inverse via Gauss–Jordan', 'Обратная матрица методом Гаусса–Жордана', ['gauss_elim', 'matrix_mult']],
  ['solvability', 3, 'Rank, singularity, parameter cases', 'Ранг и разрешимость систем', ['gauss_elim', 'det_3x3']],

  ['eigen_check', 4, 'Eigenvector definition, checking', 'Собственный вектор: проверка', ['matrix_mult']],
  ['char_poly', 4, 'Characteristic polynomial, eigenvalues', 'Характеристический многочлен, собственные значения', ['det_2x2', 'det_3x3', 'quadratic_eq', 'polynomials']],
  ['eigenvectors', 4, 'Eigenvectors, eigenspaces', 'Собственные векторы', ['char_poly', 'gauss_elim', 'eigen_check']],
  ['diagonalization', 4, 'Diagonalization, matrix powers', 'Диагонализация, степени матрицы', ['eigenvectors', 'inverse_2x2']],
  ['least_squares', 4, 'Least squares, normal equations', 'Метод наименьших квадратов', ['matrix_mult', 'inverse_2x2', 'sigma_notation']],
  ['regularization', 4, 'Ridge regularization', 'Регуляризация (ridge)', ['least_squares']],

  ['derivative_def', 5, 'Derivative as slope', 'Производная как наклон', ['limits', 'lines_2d']],
  ['diff_rules', 5, 'Differentiation rules', 'Правила дифференцирования', ['derivative_def', 'exp_fn', 'log_laws', 'trig_fns']],
  ['product_quotient', 5, 'Product and quotient rules', 'Производная произведения и частного', ['diff_rules']],
  ['chain_rule', 5, 'Chain rule', 'Производная сложной функции', ['diff_rules', 'composition']],
  ['extrema_1d', 5, 'Critical points, optimisation', 'Экстремумы и оптимизация', ['chain_rule', 'product_quotient', 'quadratic_eq']],
  ['antiderivatives', 5, 'Antiderivatives', 'Первообразные', ['diff_rules']],
  ['definite_integral', 5, 'Definite integral, area', 'Определённый интеграл', ['antiderivatives']],
  ['substitution', 5, 'Integration by substitution', 'Интегрирование заменой', ['definite_integral', 'chain_rule']],
  ['by_parts', 5, 'Integration by parts', 'Интегрирование по частям', ['definite_integral', 'product_quotient']],

  ['multivar_fns', 6, 'f(x,y), level curves', 'Функции двух переменных, линии уровня', ['functions', 'graphs_basic']],
  ['partial_derivs', 6, 'Partial derivatives', 'Частные производные', ['chain_rule', 'product_quotient', 'multivar_fns']],
  ['gradient', 6, 'Gradient vector', 'Градиент', ['partial_derivs', 'vectors']],
  ['directional_deriv', 6, 'Directional derivative', 'Производная по направлению', ['gradient', 'vec_length', 'dot_product']],
  ['critical_2d', 6, 'Critical points in ℝ², Hessian test', 'Экстремумы в ℝ², гессиан', ['partial_derivs', 'sim_eq_2x2', 'det_2x2']],

  ['ode_classify', 7, 'Order, linearity, autonomy', 'Классификация ОДУ', ['derivative_def']],
  ['ode_verify_ivp', 7, 'Verify solutions, initial values', 'Проверка решения, задача Коши', ['chain_rule']],
  ['separation', 7, 'Separation of variables', 'Разделение переменных', ['substitution', 'exp_log_eq', 'ode_verify_ivp']],
  ['exp_model', 7, 'Exponential growth/decay, half-life', 'Экспоненциальный рост и распад', ['separation']],
  ['logistic_model', 7, 'Logistic growth', 'Логистический рост', ['exp_model', 'alg_fractions']],
  ['equilibria', 7, 'Equilibria and stability', 'Равновесия и устойчивость', ['logistic_model', 'diff_rules', 'inequalities']],
  ['euler_method', 7, "Euler's method", 'Метод Эйлера', ['ode_verify_ivp']],
  ['sir_model', 7, 'SIR model, R₀', 'Модель SIR', ['equilibria', 'euler_method']],

  ['desc_stats', 9, 'Mean, median, mode', 'Среднее, медиана, мода', ['sigma_notation', 'percent_ratio']],
  ['variance_sd', 9, 'Variance, standard deviation', 'Дисперсия и стандартное отклонение', ['desc_stats', 'roots']],
  ['quantiles', 9, 'Quantiles, IQR, boxplot', 'Квантили, IQR, боксплот', ['desc_stats']],
  ['prob_rules', 9, 'Events, complement, addition rule', 'Правила вероятностей', ['set_ops', 'fractions']],
  ['counting', 9, 'Permutations, combinations', 'Перестановки и сочетания', ['prob_rules']],
  ['cond_prob', 9, 'Conditional probability, independence', 'Условная вероятность', ['prob_rules']],
  ['bayes', 9, 'Total probability, Bayes', 'Формула Байеса', ['cond_prob']],
  ['random_vars', 9, 'E[X], Var[X], moments', 'Случайные величины: E и Var', ['prob_rules', 'variance_sd']],
  ['binomial_poisson', 9, 'Binomial and Poisson', 'Биномиальное и пуассоновское распределения', ['random_vars', 'counting', 'exp_fn']],
  ['normal_dist', 9, 'Normal distribution, z-scores', 'Нормальное распределение, z-оценки', ['random_vars', 'variance_sd']],
  ['normal_quantiles', 9, 'Normal quantiles, 68–95–99.7', 'Квантили нормального распределения', ['normal_dist', 'quantiles']],
  ['correlation', 9, 'Covariance, Pearson r', 'Ковариация и корреляция Пирсона', ['variance_sd', 'sigma_notation']],

  ['std_error', 10, 'Standard error, CLT', 'Стандартная ошибка, ЦПТ', ['normal_dist']],
  ['conf_interval', 10, 'Confidence intervals', 'Доверительные интервалы', ['std_error', 'normal_quantiles']],
  ['hypothesis_logic', 10, 'H₀/H₁, p-value, errors', 'Логика проверки гипотез', ['std_error']],
  ['z_t_test', 10, 'z and t tests', 'z- и t-тесты', ['hypothesis_logic', 'normal_quantiles']],
  ['confusion_matrix', 10, 'Sensitivity, specificity, PPV', 'Чувствительность, специфичность, PPV', ['percent_ratio', 'cond_prob']],
  ['ppv_prevalence', 10, 'PPV from prevalence', 'PPV и распространённость', ['confusion_matrix', 'bayes']],
  ['error_propagation', 10, 'Error propagation', 'Распространение ошибок', ['partial_derivs', 'variance_sd']],

  ['polar', 12, 'Polar coordinates', 'Полярные координаты', ['trig_fns', 'pythagoras']],
  ['cyl_spherical', 12, 'Cylindrical and spherical coordinates', 'Цилиндрические и сферические координаты', ['polar', 'vec_length']],
  ['divergence', 12, 'Divergence', 'Дивергенция', ['partial_derivs', 'dot_product']],
  ['curl', 12, 'Curl', 'Ротор', ['partial_derivs', 'cross_product']],
  ['complex_arith', 12, 'Complex arithmetic', 'Комплексные числа: арифметика', ['expand', 'quadratic_eq']],
  ['complex_polar', 12, "Exponential form, Euler's formula", 'Показательная форма, формула Эйлера', ['complex_arith', 'polar', 'exp_fn']],
  ['complex_powers', 12, 'De Moivre, complex roots', 'Формула Муавра, корни', ['complex_polar']],

  ['kinematics', 13, 'Kinematics: x, v, a', 'Кинематика: x, v, a', ['diff_rules', 'definite_integral', 'units']],
  ['projectile', 13, 'Projectile motion', 'Движение тела, брошенного под углом', ['kinematics', 'vectors', 'trig_triangle', 'quadratic_eq']],
  ['newton', 13, "Newton's laws", 'Законы Ньютона', ['kinematics', 'vectors']],
  ['energy_cons', 13, 'Work, energy conservation', 'Работа и закон сохранения энергии', ['newton', 'dot_product']],
  ['momentum_cons', 13, 'Momentum, collisions', 'Импульс и столкновения', ['newton']],
  ['oscillator_phase', 13, 'Oscillator, phase space', 'Осциллятор и фазовое пространство', ['energy_cons', 'trig_fns', 'ode_verify_ivp']],
  ['rotation', 13, 'Rotation, angular momentum', 'Вращение, момент импульса', ['cross_product', 'radians', 'newton']],
  ['inertia_tensor', 13, 'Inertia tensor', 'Тензор инерции', ['rotation', 'matrix_basics', 'eigenvectors']],
  ['kepler', 13, "Gravitation, Kepler's laws", 'Гравитация и законы Кеплера', ['rotation', 'roots', 'rearrange']],

  ['ideal_gas', 14, 'Ideal gas law', 'Уравнение идеального газа', ['rearrange', 'units']],
  ['maxwell_boltzmann', 14, 'Maxwell–Boltzmann distribution', 'Распределение Максвелла–Больцмана', ['ideal_gas', 'exp_fn', 'roots']],
  ['first_law', 14, 'First law, heat capacity', 'Первое начало термодинамики', ['ideal_gas', 'energy_cons']],
  ['processes', 14, 'Thermodynamic processes, pV work', 'Термодинамические процессы', ['first_law', 'definite_integral', 'log_laws']],
  ['entropy_2nd_law', 14, 'Second law, entropy, Carnot', 'Второе начало, энтропия, цикл Карно', ['processes']],
]

export const NODES: readonly SkillNode[] = ROWS.map(([id, week, en, ru, prereqs]) => ({
  id,
  week,
  title: { en, ru },
  prereqs,
  highYield: HIGH_YIELD.has(id),
}))
```

- [ ] **Step 4: Implement `src/core/graph/graph.ts` and `index.ts`**

`graph.ts`:
```ts
import type { SkillNode } from './nodes'

export interface SkillGraph {
  readonly nodes: ReadonlyMap<string, SkillNode>
  /** Topological order: week, then depth in the graph, then declaration order. */
  readonly ladder: readonly string[]
  readonly ladderIndex: ReadonlyMap<string, number>
  node(id: string): SkillNode
  /** All transitive prerequisites (excluding the node itself). */
  ancestors(id: string): ReadonlySet<string>
}

function validate(list: readonly SkillNode[], nodes: ReadonlyMap<string, SkillNode>): void {
  if (nodes.size !== list.length) throw new Error('Duplicate skill id in graph')
  for (const n of list) {
    for (const p of n.prereqs) {
      const prereq = nodes.get(p)
      if (!prereq) throw new Error(`Unknown prerequisite "${p}" of "${n.id}"`)
      if (prereq.week > n.week) throw new Error(`Prerequisite "${p}" of "${n.id}" is from a later week`)
    }
  }
}

function computeDepths(list: readonly SkillNode[], nodes: ReadonlyMap<string, SkillNode>): ReadonlyMap<string, number> {
  const depth = new Map<string, number>()
  const visiting = new Set<string>()
  const depthOf = (id: string): number => {
    const known = depth.get(id)
    if (known !== undefined) return known
    if (visiting.has(id)) throw new Error(`Cycle in skill graph at "${id}"`)
    visiting.add(id)
    const prereqs = nodes.get(id)?.prereqs ?? []
    const d = prereqs.length === 0 ? 0 : Math.max(...prereqs.map(depthOf)) + 1
    visiting.delete(id)
    depth.set(id, d)
    return d
  }
  list.forEach((n) => depthOf(n.id))
  return depth
}

export function buildGraph(list: readonly SkillNode[]): SkillGraph {
  const nodes: ReadonlyMap<string, SkillNode> = new Map(list.map((n) => [n.id, n]))
  validate(list, nodes)
  const depth = computeDepths(list, nodes)
  const order = new Map(list.map((n, i) => [n.id, i]))
  const ladder = [...list]
    .sort((a, b) => a.week - b.week || (depth.get(a.id) ?? 0) - (depth.get(b.id) ?? 0) || (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((n) => n.id)
  const ladderIndex: ReadonlyMap<string, number> = new Map(ladder.map((id, i) => [id, i]))

  const node = (id: string): SkillNode => {
    const found = nodes.get(id)
    if (!found) throw new Error(`Unknown skill "${id}"`)
    return found
  }

  const cache = new Map<string, ReadonlySet<string>>()
  const ancestors = (id: string): ReadonlySet<string> => {
    const cached = cache.get(id)
    if (cached) return cached
    const out = new Set<string>()
    for (const p of node(id).prereqs) {
      out.add(p)
      ancestors(p).forEach((a) => out.add(a))
    }
    cache.set(id, out)
    return out
  }

  return { nodes, ladder, ladderIndex, node, ancestors }
}
```

`index.ts`:
```ts
import { buildGraph } from './graph'
import { NODES } from './nodes'

export const GRAPH = buildGraph(NODES)
export type { SkillGraph } from './graph'
export type { SkillNode } from './nodes'
export { EXAM_WEEKS } from './nodes'
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/core/graph`
Expected: PASS (11 tests). If the node count assertion fails, compare against `docs/research/knowledge-graph.md`.

- [ ] **Step 6: Full check**

Run: `npm test && npm run typecheck`
Expected: all green.
