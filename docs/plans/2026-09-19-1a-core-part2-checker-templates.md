# Atlas 1A — Core, part 2: template contract, answer checker, sample templates

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define the problem-template contract, build the answer checker (the only code that decides right/wrong), and ship four sample templates plus a generic test harness that every future template must pass.

**Architecture:** Templates are pure `(rng, tier) → Problem` generators auto-registered via `import.meta.glob`. The checker parses MathLive LaTeX with a pinned Compute Engine (`@cortex-js/compute-engine@0.131.3`) and compares **numerically at sampled points** (expressions) or by value (numbers, sets, intervals). Form rules (factored/expanded) run on the canonical expression tree.

**Tech Stack:** TypeScript, Vitest, @cortex-js/compute-engine 0.131.3 (exact), KaTeX (render check in tests).

**Prerequisite:** part 1 done and committed (`src/core/random/rng.ts`, `src/core/math/*`, `src/core/graph/*`).

**Conventions:** work in `/Users/temur/Desktop/Claude/atlas`; do not commit; touch only listed files; no `console.log`; never mutate inputs.

**Verified facts about Compute Engine 0.131.3** (from a spike):
- `ce.parse(latex)` → canonical boxed expression; `.isValid` false on syntax errors; `.operator` gives the head (`'Add'`, `'Multiply'`, `'Power'`, `'Negate'`, `'Integer'`, `'Symbol'` …); `.ops` gives operands; `.unknowns` lists free variables; `.subs({x: 1.2})`; `.N()` → numeric with `.re`, `.im`.
- `x(x-1)` → `Multiply(x, Add(x,-1))`; `-(x-2)(x+3)` → `Negate(Multiply(Add,Add))`; `(x-1)^2` → `Power(Add, 2)`; `4x^2-12x+9` → `Add(Multiply(4,Power(x,2)), Multiply(-12,x), 9)`.
- `\ln(-2)` → complex; `\frac{1}{0}` → ComplexInfinity (re = Infinity); `\emptyset` → `EmptySet`; `1\pm\sqrt{2}` parses **wrongly** as `Measurement` — so ± is expanded by our own string code before parsing.
- `\log(100)` = 2 (base 10), `\lg`, `\operatorname{ln}`, `\mathrm{e}`, `e^{2}` all work. `\ln 4 \cdot 5` parses as `ln(20)` (known; UI tells users to put coefficients first).

---

### Task 5: Template contract and registry

**Files:**
- Create: `src/core/templates/types.ts`, `src/core/templates/registry.ts`, `src/core/templates/testing.ts`, `src/core/templates/registry.test.ts`

- [ ] **Step 1: Write `src/core/templates/types.ts`**

```ts
import type { Rng } from '../random/rng'

export type Tier = 1 | 2 | 3
export const TIERS: readonly Tier[] = [1, 2, 3]

/** One interval of a union. `lo: null` means −∞, `hi: null` means +∞. Endpoints are LaTeX. */
export interface IntervalPart {
  readonly lo: string | null
  readonly hi: string | null
  readonly loClosed: boolean
  readonly hiClosed: boolean
}

export type ExprForm = 'any' | 'factored' | 'expanded'

export interface ChoiceOption {
  readonly id: string
  /** Label, may contain $…$ LaTeX. */
  readonly label: string
}

export interface ExpressionSpec {
  readonly kind: 'expression'
  readonly value: string
  readonly variables: readonly string[]
  readonly form?: ExprForm
  /** Sampling range per variable; default [-3, 3]. Must keep the reference defined on most points. */
  readonly domain?: Readonly<Record<string, readonly [number, number]>>
}

export type AnswerSpec =
  | { readonly kind: 'number'; readonly value: string }
  | ExpressionSpec
  | { readonly kind: 'numberSet'; readonly values: readonly string[] }
  | { readonly kind: 'finiteSet'; readonly elements: readonly string[] }
  | { readonly kind: 'interval'; readonly parts: readonly IntervalPart[] }
  | { readonly kind: 'choice'; readonly options: readonly ChoiceOption[]; readonly correctId: string }

export interface SolutionStep {
  /** Russian explanation, may contain $…$ LaTeX. */
  readonly ru: string
  /** Optional display formula (LaTeX without $ delimiters). */
  readonly tex?: string
}

export interface Problem {
  /** Statement with $…$ LaTeX. English is the default (exam language). */
  readonly statement: { readonly en: string; readonly ru: string }
  readonly answer: AnswerSpec
  readonly solution: readonly SolutionStep[]
  /** Russian hints, from gentle to specific. */
  readonly hints: readonly string[]
  /** Plain-text tip on how to type the answer. */
  readonly inputHint?: string
}

export interface SkillTemplate {
  readonly skillId: string
  /** Short Russian theory card, 3–8 lines separated by \n, with $…$ LaTeX. */
  readonly theory: string
  readonly expectedSeconds: Readonly<Record<Tier, number>>
  generate(rng: Rng, tier: Tier): Problem
}
```

- [ ] **Step 2: Write the failing test** — `src/core/templates/registry.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createRng } from '../random/rng'
import { collectTemplates, getTemplate, TEMPLATES } from './registry'
import { mathSegments } from './testing'
import type { SkillTemplate } from './types'

const fake = (skillId: string): SkillTemplate => ({
  skillId,
  theory: 'x',
  expectedSeconds: { 1: 1, 2: 1, 3: 1 },
  generate: () => ({
    statement: { en: 'e', ru: 'r' },
    answer: { kind: 'number', value: '1' },
    solution: [{ ru: 's' }],
    hints: ['h'],
  }),
})

describe('template registry', () => {
  it('collects templates keyed by skill id', () => {
    const map = collectTemplates({ './week0/a.ts': { template: fake('a') }, './week0/b.ts': { template: fake('b') } })
    expect([...map.keys()]).toEqual(['a', 'b'])
    expect(map.get('a')?.generate(createRng(1), 1).answer).toEqual({ kind: 'number', value: '1' })
  })

  it('rejects duplicates and modules without a template export', () => {
    expect(() => collectTemplates({ './week0/a.ts': { template: fake('a') }, './week0/a2.ts': { template: fake('a') } })).toThrow(/Duplicate/)
    expect(() => collectTemplates({ './week0/x.ts': {} })).toThrow(/must export/)
  })

  it('exposes the auto-collected registry', () => {
    expect(TEMPLATES).toBeInstanceOf(Map)
    expect(() => getTemplate('no_such_skill')).toThrow(/No template/)
  })

  it('extracts $…$ math segments', () => {
    expect(mathSegments('Solve $x+1=2$ and $y$.')).toEqual(['x+1=2', 'y'])
    expect(mathSegments('no math')).toEqual([])
  })
})
```

- [ ] **Step 3: Run to see it fail**

Run: `npx vitest run src/core/templates/registry.test.ts`
Expected: FAIL — `./registry` not found.

- [ ] **Step 4: Implement** — `src/core/templates/registry.ts`:

```ts
import { createRng } from '../random/rng'
import type { Problem, SkillTemplate, Tier } from './types'

interface TemplateModule {
  readonly template?: SkillTemplate
}

const modules = import.meta.glob<TemplateModule>(['./week*/*.ts', '!./week*/*.test.ts'], { eager: true })

export function collectTemplates(entries: Readonly<Record<string, TemplateModule>>): ReadonlyMap<string, SkillTemplate> {
  const map = new Map<string, SkillTemplate>()
  for (const [path, mod] of Object.entries(entries)) {
    const template = mod.template
    if (!template) throw new Error(`${path} must export "template"`)
    if (map.has(template.skillId)) throw new Error(`Duplicate template for "${template.skillId}"`)
    map.set(template.skillId, template)
  }
  return map
}

export const TEMPLATES: ReadonlyMap<string, SkillTemplate> = collectTemplates(modules)

export const hasTemplate = (skillId: string): boolean => TEMPLATES.has(skillId)

export function getTemplate(skillId: string): SkillTemplate {
  const template = TEMPLATES.get(skillId)
  if (!template) throw new Error(`No template for skill "${skillId}"`)
  return template
}

export function generateProblem(skillId: string, seed: number, tier: Tier): Problem {
  return getTemplate(skillId).generate(createRng(seed), tier)
}

export function expectedSeconds(skillId: string, tier: Tier): number {
  return getTemplate(skillId).expectedSeconds[tier]
}
```

`src/core/templates/testing.ts` (test helpers, not a template):
```ts
/** Contents of every $…$ segment in a text. */
export function mathSegments(text: string): string[] {
  return [...text.matchAll(/\$([^$]+)\$/g)].map((m) => m[1])
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/core/templates/registry.test.ts && npm run typecheck`
Expected: PASS; typecheck clean.

---

### Task 6: LaTeX normalisation, list splitting, Compute Engine wrapper

**Files:**
- Create: `src/core/checker/normalize.ts`, `src/core/checker/split.ts`, `src/core/checker/ce.ts`, `src/core/checker/text.test.ts`, `src/core/checker/ce.test.ts`

- [ ] **Step 1: Write failing tests** — `src/core/checker/text.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { normalizeLatex } from './normalize'
import { expandPlusMinus, isEmptySetLatex, splitAnswerList, splitTopLevel, stripAssignment, stripSetBraces } from './split'

describe('normalizeLatex', () => {
  it('removes \\left/\\right but keeps arrows', () => {
    expect(normalizeLatex('\\left(x+1\\right)^2')).toBe('(x+1)^2')
    expect(normalizeLatex('a\\leftarrow b\\rightarrow c')).toBe('a\\leftarrow b\\rightarrow c')
  })
  it('maps brace/bracket commands and strips spacing', () => {
    expect(normalizeLatex('\\left\\lbrace 1,2\\right\\rbrace')).toBe('\\{ 1,2\\}')
    expect(normalizeLatex('\\lbrack 1, 2\\rbrack')).toBe('[ 1, 2]')
    expect(normalizeLatex('x\\,+\\;1\\!')).toBe('x + 1')
    expect(normalizeLatex('  2 \\placeholder{} ')).toBe('2')
  })
})

describe('list splitting', () => {
  it('splits at top-level commas and semicolons only', () => {
    expect(splitTopLevel('2, 3')).toEqual(['2', '3'])
    expect(splitTopLevel('(1,2),(3,4)')).toEqual(['(1,2)', '(3,4)'])
    expect(splitTopLevel('\\frac{1}{2}; -1')).toEqual(['\\frac{1}{2}', '-1'])
    expect(splitTopLevel('x_{1}=2', ['='])).toEqual(['x_{1}', '2'])
  })
  it('strips outer set braces only when they wrap everything', () => {
    expect(stripSetBraces('\\{1, 2\\}')).toBe('1, 2')
    expect(stripSetBraces('{1, 2}')).toBe('1, 2')
    expect(stripSetBraces('\\{1\\},\\{2\\}')).toBe('\\{1\\},\\{2\\}')
    expect(stripSetBraces('1, 2')).toBe('1, 2')
  })
  it('recognises the empty set', () => {
    ;['\\emptyset', '\\varnothing', '\\{\\}', 'none', '\\text{none}', ' \\emptyset ', '∅'].forEach((s) => expect(isEmptySetLatex(s)).toBe(true))
    ;['0', '\\{0\\}', 'x'].forEach((s) => expect(isEmptySetLatex(s)).toBe(false))
  })
  it('drops assignments', () => {
    expect(stripAssignment('x=2')).toBe('2')
    expect(stripAssignment('x_{1}=-3')).toBe('-3')
    expect(stripAssignment('2')).toBe('2')
  })
  it('expands ± and ∓', () => {
    expect(expandPlusMinus('1\\pm\\sqrt{2}')).toEqual(['1+\\sqrt{2}', '1-\\sqrt{2}'])
    expect(expandPlusMinus('\\mp 2')).toEqual(['- 2', '+ 2'])
    expect(expandPlusMinus('\\pm1\\pm2')).toHaveLength(4)
    expect(expandPlusMinus('5')).toEqual(['5'])
  })
  it('runs the whole pipeline', () => {
    expect(splitAnswerList('x=1\\pm\\sqrt{2}, x=0')).toEqual(['1+\\sqrt{2}', '1-\\sqrt{2}', '0'])
    expect(splitAnswerList('\\left\\{2,3\\right\\}')).toEqual(['2', '3'])
  })
})
```

`src/core/checker/ce.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { evalReal, operandsOf, operatorOf, parseLatex, unknowns } from './ce'

describe('Compute Engine wrapper', () => {
  it('parses valid LaTeX and rejects invalid or empty input', () => {
    expect(parseLatex('\\frac{1}{2}')).not.toBeNull()
    expect(parseLatex('\\frac{x}{')).toBeNull()
    expect(parseLatex('   ')).toBeNull()
  })
  it('evaluates real values and returns null otherwise', () => {
    const sq = parseLatex('x^2')
    expect(sq && evalReal(sq, { x: 3 })).toBe(9)
    const bad = ['\\sqrt{-4}', '\\frac{1}{0}', '\\emptyset'].map((s) => parseLatex(s))
    bad.forEach((e) => expect(e && evalReal(e)).toBeNull())
    const ln = parseLatex('\\ln x')
    expect(ln && evalReal(ln, { x: -1 })).toBeNull()
    const pi = parseLatex('\\frac{\\pi}{3}')
    expect(pi && evalReal(pi)).toBeCloseTo(Math.PI / 3, 12)
  })
  it('exposes tree structure', () => {
    const e = parseLatex('xy+1')
    expect(e && [...unknowns(e)].sort()).toEqual(['x', 'y'])
    expect(e && operatorOf(e)).toBe('Add')
    const m = parseLatex('3x(x-2)')
    expect(m && operandsOf(m).map(operatorOf)).toEqual(['Integer', 'Symbol', 'Add'])
  })
})
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run src/core/checker`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement** — `src/core/checker/normalize.ts`:

```ts
/** Normalises MathLive LaTeX so it can be split and parsed reliably. */
export function normalizeLatex(latex: string): string {
  return latex
    .replace(/\\left(?![a-zA-Z])|\\right(?![a-zA-Z])/g, '')
    .replace(/\\lbrace/g, '\\{')
    .replace(/\\rbrace/g, '\\}')
    .replace(/\\lbrack/g, '[')
    .replace(/\\rbrack/g, ']')
    .replace(/\\placeholder\{[^}]*\}/g, '')
    .replace(/\\[,;:!]|\\ |~/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
```

`src/core/checker/split.ts`:
```ts
import { normalizeLatex } from './normalize'

const OPENERS = new Set(['(', '[', '{'])
const CLOSERS = new Set([')', ']', '}'])

/** Splits at separators that are not inside (), [] or {}. Empty parts are dropped. */
export function splitTopLevel(latex: string, separators: readonly string[] = [',', ';']): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const ch of latex) {
    if (OPENERS.has(ch)) depth += 1
    else if (CLOSERS.has(ch)) depth -= 1
    if (depth === 0 && separators.includes(ch)) {
      parts.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  parts.push(current.trim())
  return parts.filter((p) => p !== '')
}

function wrapsWhole(s: string, open: string, close: string): boolean {
  if (!s.startsWith(open) || !s.endsWith(close)) return false
  let depth = 0
  for (let i = 0; i < s.length; i += 1) {
    if (s.startsWith(open, i)) {
      depth += 1
      i += open.length - 1
    } else if (s.startsWith(close, i)) {
      depth -= 1
      if (depth === 0 && i + close.length < s.length) return false
      i += close.length - 1
    }
  }
  return depth === 0
}

/** Removes outer "\{ … \}" (or "{ … }") when it wraps the whole string. */
export function stripSetBraces(latex: string): string {
  const s = latex.trim()
  if (wrapsWhole(s, '\\{', '\\}')) return s.slice(2, -2).trim()
  if (!s.startsWith('\\') && wrapsWhole(s, '{', '}')) return s.slice(1, -1).trim()
  return s
}

const EMPTY_SET_SPELLINGS: ReadonlySet<string> = new Set(['\\emptyset', '\\varnothing', '∅', '\\{\\}', '{}', 'none', 'нет', 'empty'])

export function isEmptySetLatex(latex: string): boolean {
  const s = normalizeLatex(latex)
    .replace(/\\(?:text|mathrm)\{([^}]*)\}/g, '$1')
    .replace(/\s+/g, '')
    .toLowerCase()
  return EMPTY_SET_SPELLINGS.has(s)
}

/** "x=2" → "2", "x_{1}=-3" → "-3". */
export function stripAssignment(item: string): string {
  const parts = splitTopLevel(item, ['='])
  return parts.length > 1 ? parts[parts.length - 1] : item
}

/** Expands every \pm / \mp into two alternatives: "1\pm\sqrt{2}" → ["1+\sqrt{2}", "1-\sqrt{2}"]. */
export function expandPlusMinus(item: string): string[] {
  const match = item.match(/\\pm|\\mp/)
  if (!match || match.index === undefined) return [item]
  const before = item.slice(0, match.index)
  const after = item.slice(match.index + match[0].length)
  const [first, second] = match[0] === '\\pm' ? ['+', '-'] : ['-', '+']
  return [...expandPlusMinus(`${before}${first}${after}`), ...expandPlusMinus(`${before}${second}${after}`)]
}

/** Normalise → strip set braces → split → drop "x=" → expand ±. */
export function splitAnswerList(latex: string): string[] {
  const inner = stripSetBraces(normalizeLatex(latex))
  return splitTopLevel(inner).map(stripAssignment).flatMap(expandPlusMinus)
}
```

`src/core/checker/ce.ts`:
```ts
import { ComputeEngine } from '@cortex-js/compute-engine'

const engine = new ComputeEngine()

export type Expr = ReturnType<ComputeEngine['parse']>

/** Canonical parse; null for empty or invalid LaTeX. */
export function parseLatex(latex: string): Expr | null {
  if (latex.trim() === '') return null
  try {
    const expr = engine.parse(latex)
    return expr.isValid ? expr : null
  } catch {
    return null
  }
}

/** Real numeric value with variables substituted; null when undefined, infinite or complex. */
export function evalReal(expr: Expr, vars: Readonly<Record<string, number>> = {}): number | null {
  try {
    const target = Object.keys(vars).length > 0 ? expr.subs(vars) : expr
    const value = target.N()
    const re = value.re
    const im = value.im
    if (typeof re !== 'number' || !Number.isFinite(re)) return null
    if (typeof im === 'number' && Math.abs(im) > 1e-9 * Math.max(1, Math.abs(re))) return null
    return re
  } catch {
    return null
  }
}

export const unknowns = (expr: Expr): readonly string[] => expr.unknowns ?? []
export const operatorOf = (expr: Expr): string => expr.operator
export const operandsOf = (expr: Expr): readonly Expr[] => expr.ops ?? []
```

If TypeScript rejects `expr.subs(vars)` because it expects boxed values or a different signature, cast minimally (`expr.subs(vars as Record<string, number>)`) and note it in the report; if `.re`/`.im` are typed as possibly undefined, the `typeof` guards already handle it.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/core/checker && npm run typecheck`
Expected: PASS.

---

### Task 7: Number and expression checking (with form rules)

**Files:**
- Create: `src/core/checker/result.ts`, `src/core/checker/compare.ts`, `src/core/checker/values.ts`, `src/core/checker/number.ts`, `src/core/checker/forms.ts`, `src/core/checker/expression.ts`, `src/core/checker/scalar.test.ts`

- [ ] **Step 1: Write failing tests** — `src/core/checker/scalar.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseLatex } from './ce'
import { checkExpression } from './expression'
import { factorCount, isExpanded, isFactored } from './forms'
import { checkNumber } from './number'
import type { ExpressionSpec } from '../templates/types'

const num = (value: string, answer: string) => checkNumber(value, answer)
const expr = (value: string, answer: string, extra: Partial<ExpressionSpec> = {}) =>
  checkExpression({ kind: 'expression', value, variables: ['x'], ...extra }, answer)
const tree = (latex: string) => {
  const e = parseLatex(latex)
  if (!e) throw new Error(`bad test latex ${latex}`)
  return e
}

describe('checkNumber', () => {
  it.each([
    ['4', '4'], ['4', '2+2'], ['4', '4.0'], ['-\\frac{3}{4}', '-0.75'], ['-\\frac{3}{4}', '\\frac{-3}{4}'],
    ['5\\ln 4', '6.93'], ['2\\sqrt{10}', '\\sqrt{40}'], ['\\frac{3\\pi}{4}', '\\frac{3}{4}\\pi'], ['9', '27^{\\frac{2}{3}}'],
    ['5', 'x=5'], ['\\frac{1}{3}', '0.333'], ['0', '0'], ['\\frac{1}{2}', '\\left(\\frac{1}{2}\\right)'],
  ])('accepts %s ← %s', (value, answer) => expect(num(value, answer).status).toBe('correct'))

  it.each([['5\\ln 4', '6.9'], ['\\frac{1}{3}', '0.33'], ['7', '8']])('rejects %s ← %s', (value, answer) =>
    expect(num(value, answer).status).toBe('incorrect'),
  )

  it('diagnoses sign and reciprocal slips', () => {
    expect(num('-\\frac{3}{4}', '\\frac{3}{4}')).toEqual({ status: 'incorrect', diagnosis: 'Похоже, ошибка в знаке' })
    expect(num('\\frac{2}{3}', '\\frac{3}{2}')).toEqual({ status: 'incorrect', diagnosis: 'Похоже, дробь перевёрнута' })
  })

  it('flags malformed input without counting it as wrong', () => {
    expect(num('10', '').status).toBe('malformed')
    expect(num('10', 'x+1').status).toBe('malformed')
    expect(num('2.5', '2,5').status).toBe('malformed')
    expect(num('1', '\\frac{1}{').status).toBe('malformed')
  })

  it('notes approximate answers', () => {
    expect(num('\\sqrt{2}', '1.414')).toEqual({ status: 'correct', note: 'Верно (приближённо)' })
  })
})

describe('checkExpression', () => {
  it.each([
    ['x^2-x', 'x(x-1)'], ['\\frac{3x+1}{x-2}', '\\frac{1+3x}{x-2}'], ['e^{-3x}(2x-3x^2)', '(2x-3x^2)e^{-3x}'],
    ['\\frac{3x+1}{x-2}', 'f^{-1}(x)=\\frac{3x+1}{x-2}'], ['2x+6', '2(x+3)'],
  ])('accepts %s ← %s', (value, answer) => expect(expr(value, answer).status).toBe('correct'))

  it('respects a sampling domain', () => {
    expect(expr('\\ln x', '\\ln(x)', { domain: { x: [0.5, 4] } }).status).toBe('correct')
    expect(expr('\\ln x', '\\ln(2x)', { domain: { x: [0.5, 4] } }).status).toBe('incorrect')
  })

  it('rejects wrong expressions and diagnoses sign', () => {
    expect(expr('\\frac{3x+1}{x-2}', '\\frac{3x-1}{x-2}').status).toBe('incorrect')
    expect(expr('x^2-x', '-x^2+x')).toEqual({ status: 'incorrect', diagnosis: 'Похоже, ошибка в знаке' })
  })

  it('refuses foreign variables', () => {
    expect(expr('x^2', 't^2')).toEqual({ status: 'malformed', message: 'Используй только переменные: x' })
  })

  it('enforces factored form', () => {
    const spec = { form: 'factored' as const }
    expect(expr('(x-2)(x-3)', '(x-3)(x-2)', spec).status).toBe('correct')
    expect(expr('(x-2)(x-3)', 'x^2-5x+6', spec).status).toBe('malformed')
    expect(expr('3x(x-2)', '3(x^2-2x)', spec)).toEqual({ status: 'malformed', message: 'Значение верное, но разложено не до конца' })
    expect(expr('3x(x-2)', 'x(3x-6)', spec).status).toBe('correct')
  })

  it('enforces expanded form', () => {
    const spec = { form: 'expanded' as const }
    expect(expr('4x^2-12x+9', '9-12x+4x^2', spec).status).toBe('correct')
    expect(expr('4x^2-12x+9', '(2x-3)^2', spec).status).toBe('malformed')
  })
})

describe('form predicates', () => {
  it('isFactored', () => {
    expect(isFactored(tree('(x-2)(x+3)'))).toBe(true)
    expect(isFactored(tree('-(x-2)(x+3)'))).toBe(true)
    expect(isFactored(tree('(x-1)^2'))).toBe(true)
    expect(isFactored(tree('x^2-1'))).toBe(false)
  })
  it('isExpanded', () => {
    expect(isExpanded(tree('4x^2-12x+9'))).toBe(true)
    expect(isExpanded(tree('2(x+1)'))).toBe(false)
    expect(isExpanded(tree('(x+1)^2'))).toBe(false)
  })
  it('factorCount counts non-constant factors with multiplicity', () => {
    expect(factorCount(tree('3x(x-2)'))).toBe(2)
    expect(factorCount(tree('(x-1)^2(x+2)'))).toBe(3)
    expect(factorCount(tree('3(x^2-2x)'))).toBe(1)
  })
})
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run src/core/checker/scalar.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement** — `src/core/checker/result.ts`:

```ts
export type CheckResult =
  | { readonly status: 'correct'; readonly note?: string }
  | { readonly status: 'incorrect'; readonly diagnosis?: string }
  | { readonly status: 'malformed'; readonly message: string }

export const correct = (note?: string): CheckResult => (note ? { status: 'correct', note } : { status: 'correct' })
export const incorrect = (diagnosis?: string): CheckResult => (diagnosis ? { status: 'incorrect', diagnosis } : { status: 'incorrect' })
export const malformed = (message: string): CheckResult => ({ status: 'malformed', message })

export const MSG = {
  empty: 'Введи ответ',
  unparsable: 'Не получилось разобрать формулу — проверь скобки и дроби',
  oneNumber: 'Нужно одно число. Десятичную дробь пиши через точку: 2.5',
  noVariables: 'Здесь нужно число, без переменных',
  wrongInput: 'Этот ответ вводится по-другому',
  sign: 'Похоже, ошибка в знаке',
  reciprocal: 'Похоже, дробь перевёрнута',
  approximate: 'Верно (приближённо)',
  notFactored: 'Значение верное, но нужно записать как произведение множителей',
  notFullyFactored: 'Значение верное, но разложено не до конца',
  notExpanded: 'Значение верное, но нужно раскрыть скобки',
} as const
```

`src/core/checker/compare.ts`:
```ts
/** Exact answers: floating-point noise only. */
export const exactClose = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b))

/** Decimal answers: about 3 significant figures (0.2 % relative). */
export const approxClose = (a: number, b: number): boolean => Math.abs(a - b) <= 2e-3 * Math.max(Math.abs(b), 1e-3)

/** Sampled expression values. */
export const sampleClose = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(b))

/** Equality that also treats equal infinities as equal. */
export const sameEndpoint = (a: number, b: number): boolean => a === b || (Number.isFinite(a) && Number.isFinite(b) && exactClose(a, b))

export const hasDecimal = (latex: string): boolean => /\.\d/.test(latex)
```

`src/core/checker/values.ts`:
```ts
import { evalReal, parseLatex, unknowns } from './ce'
import { exactClose } from './compare'

/** Numeric value of a constant LaTeX item; null if it has variables or no real value. */
export function evaluateItem(item: string): number | null {
  const expr = parseLatex(item)
  if (!expr || unknowns(expr).length > 0) return null
  return evalReal(expr)
}

export function mustEvaluate(latex: string): number {
  const value = evaluateItem(latex)
  if (value === null) throw new Error(`Invalid reference value: ${latex}`)
  return value
}

export function uniqueValues(values: readonly number[]): number[] {
  return values.reduce<number[]>((acc, v) => (acc.some((a) => exactClose(a, v)) ? acc : [...acc, v]), [])
}
```

`src/core/checker/number.ts`:
```ts
import { evalReal, parseLatex, unknowns } from './ce'
import { approxClose, exactClose, hasDecimal } from './compare'
import { normalizeLatex } from './normalize'
import { correct, incorrect, malformed, MSG, type CheckResult } from './result'
import { splitTopLevel, stripAssignment } from './split'
import { mustEvaluate } from './values'

export function checkNumber(value: string, latex: string): CheckResult {
  const input = normalizeLatex(latex)
  if (input === '') return malformed(MSG.empty)
  if (splitTopLevel(input).length > 1) return malformed(MSG.oneNumber)
  const user = parseLatex(stripAssignment(input))
  if (!user) return malformed(MSG.unparsable)
  if (unknowns(user).length > 0) return malformed(MSG.noVariables)
  const reference = mustEvaluate(value)
  const answer = evalReal(user)
  if (answer === null) return incorrect()
  const approx = hasDecimal(input)
  const same = approx ? approxClose : exactClose
  if (same(answer, reference)) return correct(approx ? MSG.approximate : undefined)
  if (reference !== 0 && same(answer, -reference)) return incorrect(MSG.sign)
  if (reference !== 0 && answer !== 0 && same(1 / answer, reference)) return incorrect(MSG.reciprocal)
  return incorrect()
}
```

`src/core/checker/forms.ts`:
```ts
import { evalReal, operandsOf, operatorOf, unknowns, type Expr } from './ce'

const isSum = (e: Expr): boolean => operatorOf(e) === 'Add' || operatorOf(e) === 'Subtract'
const isPowerOfSum = (e: Expr): boolean => operatorOf(e) === 'Power' && isSum(operandsOf(e)[0])
const unwrapNegate = (e: Expr): Expr => (operatorOf(e) === 'Negate' ? operandsOf(e)[0] : e)

/** A product containing a sum factor, or a power of a sum: 3x(x−2), (x−1)², −(x−2)(x+3). */
export function isFactored(expr: Expr): boolean {
  const e = unwrapNegate(expr)
  if (isPowerOfSum(e)) return true
  return operatorOf(e) === 'Multiply' && operandsOf(e).some((f) => isSum(f) || isPowerOfSum(f))
}

/** No product or power of a sum anywhere in the tree. */
export function isExpanded(expr: Expr): boolean {
  const op = operatorOf(expr)
  const ops = operandsOf(expr)
  if ((op === 'Multiply' || op === 'Negate') && ops.some(isSum)) return false
  if (isPowerOfSum(expr)) return false
  return ops.every(isExpanded)
}

function factorWeight(f: Expr): number {
  if (unknowns(f).length === 0) return 0
  if (operatorOf(f) === 'Power') {
    const exponent = evalReal(operandsOf(f)[1])
    return exponent !== null && Number.isInteger(exponent) && exponent > 0 ? exponent : 1
  }
  return 1
}

/** Non-constant factors counted with multiplicity: 3x(x−2) → 2, (x−1)²(x+2) → 3. */
export function factorCount(expr: Expr): number {
  const e = unwrapNegate(expr)
  const factors = operatorOf(e) === 'Multiply' ? operandsOf(e) : [e]
  return factors.reduce((sum, f) => sum + factorWeight(f), 0)
}
```

`src/core/checker/expression.ts`:
```ts
import { createRng, type Rng } from '../random/rng'
import type { ExpressionSpec } from '../templates/types'
import { evalReal, parseLatex, unknowns, type Expr } from './ce'
import { sampleClose } from './compare'
import { factorCount, isExpanded, isFactored } from './forms'
import { normalizeLatex } from './normalize'
import { correct, incorrect, malformed, MSG, type CheckResult } from './result'
import { stripAssignment } from './split'

type Verdict = 'equal' | 'negated' | 'different'

const DEFAULT_RANGE: readonly [number, number] = [-3, 3]
const TARGET_POINTS = 10
const MAX_ATTEMPTS = 80

function sampleValue(rng: Rng, lo: number, hi: number): number {
  const draw = () => lo + rng.next() * (hi - lo)
  const risky = (v: number) => Math.abs(v) < 0.15 || Math.abs(Math.abs(v) - 1) < 0.15
  let value = draw()
  for (let i = 0; i < 20 && risky(value); i += 1) value = draw()
  return value
}

function samplePoint(rng: Rng, spec: ExpressionSpec): Record<string, number> {
  return Object.fromEntries(
    spec.variables.map((v) => {
      const [lo, hi] = spec.domain?.[v] ?? DEFAULT_RANGE
      return [v, sampleValue(rng, lo, hi)]
    }),
  )
}

/** Compares two expressions at seeded random points inside the spec's domain. */
export function compareOnSamples(reference: Expr, user: Expr, spec: ExpressionSpec): Verdict {
  const rng = createRng(0x5eed)
  let valid = 0
  let equal = true
  let negated = true
  for (let attempt = 0; attempt < MAX_ATTEMPTS && valid < TARGET_POINTS; attempt += 1) {
    const point = samplePoint(rng, spec)
    const r = evalReal(reference, point)
    if (r === null) continue
    valid += 1
    const u = evalReal(user, point)
    if (u === null) return 'different'
    equal = equal && sampleClose(u, r)
    negated = negated && sampleClose(u, -r)
    if (!equal && !negated) return 'different'
  }
  if (valid < 3) throw new Error(`Reference "${spec.value}" is undefined on its sampling domain`)
  if (equal) return 'equal'
  return negated ? 'negated' : 'different'
}

function checkForm(spec: ExpressionSpec, reference: Expr, user: Expr): CheckResult {
  const form = spec.form ?? 'any'
  if (form === 'factored') {
    if (!isFactored(user)) return malformed(MSG.notFactored)
    if (factorCount(user) < factorCount(reference)) return malformed(MSG.notFullyFactored)
  }
  if (form === 'expanded' && !isExpanded(user)) return malformed(MSG.notExpanded)
  return correct()
}

export function checkExpression(spec: ExpressionSpec, latex: string): CheckResult {
  const input = normalizeLatex(latex)
  if (input === '') return malformed(MSG.empty)
  const user = parseLatex(stripAssignment(input))
  if (!user) return malformed(MSG.unparsable)
  const foreign = unknowns(user).filter((v) => !spec.variables.includes(v))
  if (foreign.length > 0) return malformed(`Используй только переменные: ${spec.variables.join(', ')}`)
  const reference = parseLatex(spec.value)
  if (!reference) throw new Error(`Invalid reference expression: ${spec.value}`)
  const verdict = compareOnSamples(reference, user, spec)
  if (verdict === 'negated') return incorrect(MSG.sign)
  if (verdict === 'different') return incorrect()
  return checkForm(spec, reference, user)
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/core/checker && npm run typecheck`
Expected: PASS. If a specific parse differs from the verified facts (e.g., canonical form reorders factors into `Power`), adapt the predicate — not the test intent — and report it.

---

### Task 8: Sets, intervals, dispatcher, reference answers, golden set

**Files:**
- Create: `src/core/checker/sets.ts`, `src/core/checker/interval.ts`, `src/core/checker/check.ts`, `src/core/checker/reference.ts`, `src/core/checker/golden.test.ts`

- [ ] **Step 1: Write the failing golden test** — `src/core/checker/golden.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { AnswerSpec, IntervalPart } from '../templates/types'
import { checkAnswer, type UserAnswer } from './check'
import { answerToLatex, intervalLatex, perturbedAnswer, referenceAnswer } from './reference'

type Case = readonly [AnswerSpec, UserAnswer, 'correct' | 'incorrect' | 'malformed']

const latex = (s: string): UserAnswer => ({ kind: 'latex', latex: s })
const iv = (lo: string | null, hi: string | null, loClosed = false, hiClosed = false): IntervalPart => ({ lo, hi, loClosed, hiClosed })
const numberSet = (...values: string[]): AnswerSpec => ({ kind: 'numberSet', values })
const finiteSet = (...elements: string[]): AnswerSpec => ({ kind: 'finiteSet', elements })
const interval = (...parts: IntervalPart[]): AnswerSpec => ({ kind: 'interval', parts })
const choice: AnswerSpec = { kind: 'choice', options: [{ id: 'a', label: 'yes' }, { id: 'b', label: 'no' }], correctId: 'a' }

const CASES: readonly Case[] = [
  [numberSet('2', '3'), latex('2, 3'), 'correct'],
  [numberSet('2', '3'), latex('3,2'), 'correct'],
  [numberSet('2', '3'), latex('x=2, x=3'), 'correct'],
  [numberSet('2', '3'), latex('\\{2, 3\\}'), 'correct'],
  [numberSet('2', '3'), latex('2'), 'incorrect'],
  [numberSet('2', '3'), latex('2, 3, 4'), 'incorrect'],
  [numberSet('1+\\sqrt{2}', '1-\\sqrt{2}'), latex('1\\pm\\sqrt{2}'), 'correct'],
  [numberSet(), latex('\\emptyset'), 'correct'],
  [numberSet(), latex('none'), 'correct'],
  [numberSet(), latex('0'), 'incorrect'],
  [numberSet('\\frac{3}{2}'), latex('1.5'), 'correct'],
  [numberSet('\\frac{3}{2}'), latex('1.5, 1.5'), 'correct'],
  [numberSet('-\\frac{5}{2}', '\\frac{1}{2}'), latex('\\frac{1}{2},-2.5'), 'correct'],
  [numberSet('2'), latex('x+1'), 'malformed'],
  [numberSet('2'), latex(''), 'malformed'],
  [finiteSet('1', '2', '3'), latex('\\{1,2,3\\}'), 'correct'],
  [finiteSet('1', '2', '3'), latex('1,2,3'), 'correct'],
  [finiteSet('1', '2', '3'), latex('\\left\\lbrace3,1,2\\right\\rbrace'), 'correct'],
  [finiteSet('1', '2', '3'), latex('\\{1,2\\}'), 'incorrect'],
  [finiteSet(), latex('\\emptyset'), 'correct'],
  [finiteSet('(1,2)', '(1,3)', '(2,2)', '(2,3)'), latex('\\{(1,2),(1,3),(2,2),(2,3)\\}'), 'correct'],
  [finiteSet('(1,2)', '(1,3)', '(2,2)', '(2,3)'), latex('\\{(1,2),(2,2),(2,3)\\}'), 'incorrect'],
  [finiteSet('(1,2)'), latex('\\{(2,1)\\}'), 'incorrect'],
  [interval(iv(null, '-4'), iv('4', null)), { kind: 'interval', parts: [iv(null, '-4'), iv('4', null)] }, 'correct'],
  [interval(iv(null, '-4'), iv('4', null)), { kind: 'interval', parts: [iv('4', null), iv(null, '-4')] }, 'correct'],
  [interval(iv(null, '-4'), iv('4', null)), { kind: 'interval', parts: [iv(null, '-4', false, true), iv('4', null, true)] }, 'incorrect'],
  [interval(iv('2', '5', true, false)), { kind: 'interval', parts: [iv('2', '5', true, true)] }, 'incorrect'],
  [interval(iv('2', '5', true, false)), { kind: 'interval', parts: [iv('5', '2', true, false)] }, 'malformed'],
  [interval(iv('1', '5')), { kind: 'interval', parts: [iv('1', '3', false, true), iv('3', '5')] }, 'correct'],
  [interval(), { kind: 'interval', parts: [] }, 'correct'],
  [interval(iv('-\\sqrt{2}', '\\sqrt{2}')), { kind: 'interval', parts: [iv('-1.4142135623730951', '1.4142135623730951')] }, 'correct'],
  [choice, { kind: 'choice', id: 'a' }, 'correct'],
  [choice, { kind: 'choice', id: 'b' }, 'incorrect'],
  [choice, latex('a'), 'malformed'],
  [{ kind: 'number', value: '3' }, { kind: 'choice', id: 'a' }, 'malformed'],
]

describe('golden answer set', () => {
  it.each(CASES.map((c, i) => [i, ...c] as const))('case %i', (_i, spec, answer, expected) => {
    expect(checkAnswer(spec, answer).status).toBe(expected)
  })

  it('gives helpful set diagnostics', () => {
    expect(checkAnswer(numberSet('2', '3'), latex('2'))).toEqual({ status: 'incorrect', diagnosis: 'Найдено 1 из 2' })
    expect(checkAnswer(numberSet('2', '3'), latex('2,3,4'))).toEqual({ status: 'incorrect', diagnosis: 'Есть лишние значения' })
    expect(checkAnswer(interval(iv('2', '5', true)), { kind: 'interval', parts: [iv('2', '5')] })).toEqual({
      status: 'incorrect',
      diagnosis: 'Концы верные — проверь скобки: ( не включает конец, [ включает',
    })
  })
})

describe('reference answers', () => {
  const specs: readonly AnswerSpec[] = [
    { kind: 'number', value: '-\\frac{3}{4}' },
    { kind: 'expression', value: '(x-2)(x-3)', variables: ['x'], form: 'factored' },
    numberSet('2', '3'),
    numberSet(),
    finiteSet('(1,2)', '(2,1)'),
    finiteSet(),
    interval(iv(null, '-4'), iv('4', null)),
    interval(iv('2', '5', true)),
    interval(),
    interval(iv(null, null)),
    choice,
  ]
  it.each(specs.map((s, i) => [i, s] as const))('spec %i: reference is correct, perturbation is not', (_i, spec) => {
    expect(checkAnswer(spec, referenceAnswer(spec)).status).toBe('correct')
    expect(checkAnswer(spec, perturbedAnswer(spec)).status).not.toBe('correct')
  })

  it('renders answers as LaTeX', () => {
    expect(intervalLatex([iv(null, '-4'), iv('4', null)])).toBe('(-\\infty, -4) \\cup (4, \\infty)')
    expect(intervalLatex([iv('2', '5', true)])).toBe('[2, 5)')
    expect(intervalLatex([])).toBe('\\emptyset')
    expect(answerToLatex(numberSet())).toBe('\\emptyset')
    expect(answerToLatex(numberSet('2', '3'))).toBe('2, 3')
    expect(answerToLatex(finiteSet('1', '2'))).toBe('\\{1, 2\\}')
    expect(answerToLatex(choice)).toBe('yes')
  })
})
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run src/core/checker/golden.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement** — `src/core/checker/sets.ts`:

```ts
import { approxClose, exactClose, hasDecimal } from './compare'
import { normalizeLatex } from './normalize'
import { correct, incorrect, malformed, MSG, type CheckResult } from './result'
import { isEmptySetLatex, splitAnswerList, splitTopLevel } from './split'
import { evaluateItem, mustEvaluate, uniqueValues } from './values'

type Tuple = readonly number[]

export function setDiagnosis(refCount: number, userCount: number, missing: number, extra: number): string | undefined {
  if (refCount === 0) return 'Здесь решений нет — ответ ∅'
  if (userCount === 0) return 'Решения есть'
  if (extra === 0) return `Найдено ${refCount - missing} из ${refCount}`
  if (missing === 0) return 'Есть лишние значения'
  return undefined
}

function userItems(input: string): string[] {
  return isEmptySetLatex(input) ? [] : splitAnswerList(input)
}

export function checkNumberSet(reference: readonly string[], latex: string): CheckResult {
  const input = normalizeLatex(latex)
  if (input === '') return malformed(MSG.empty)
  const values: number[] = []
  for (const item of userItems(input)) {
    const v = evaluateItem(item)
    if (v === null) return malformed(`Не получилось вычислить «${item}»`)
    values.push(v)
  }
  const user = uniqueValues(values)
  const ref = uniqueValues(reference.map(mustEvaluate))
  const same = hasDecimal(input) ? approxClose : exactClose
  const missing = ref.filter((r) => !user.some((u) => same(u, r))).length
  const extra = user.filter((u) => !ref.some((r) => same(u, r))).length
  if (missing === 0 && extra === 0) return correct()
  return incorrect(setDiagnosis(ref.length, user.length, missing, extra))
}

function parseElement(item: string): Tuple | null {
  const s = item.trim()
  if (s.startsWith('(') && s.endsWith(')')) {
    const parts = splitTopLevel(s.slice(1, -1))
    if (parts.length > 1) {
      const values = parts.map(evaluateItem)
      return values.every((v): v is number => v !== null) ? values : null
    }
  }
  const v = evaluateItem(s)
  return v === null ? null : [v]
}

const sameTuple = (a: Tuple, b: Tuple): boolean => a.length === b.length && a.every((x, i) => exactClose(x, b[i]))

export function checkFiniteSet(reference: readonly string[], latex: string): CheckResult {
  const input = normalizeLatex(latex)
  if (input === '') return malformed(MSG.empty)
  const user: Tuple[] = []
  for (const item of userItems(input)) {
    const element = parseElement(item)
    if (!element) return malformed(`Не получилось разобрать элемент «${item}»`)
    if (!user.some((u) => sameTuple(u, element))) user.push(element)
  }
  const ref = reference.map((r) => {
    const element = parseElement(r)
    if (!element) throw new Error(`Invalid reference element: ${r}`)
    return element
  })
  const missing = ref.filter((r) => !user.some((u) => sameTuple(u, r))).length
  const extra = user.filter((u) => !ref.some((r) => sameTuple(u, r))).length
  if (missing === 0 && extra === 0) return correct()
  return incorrect(setDiagnosis(ref.length, user.length, missing, extra))
}
```

`src/core/checker/interval.ts`:
```ts
import type { IntervalPart } from '../templates/types'
import { sameEndpoint } from './compare'
import { normalizeLatex } from './normalize'
import { correct, incorrect, malformed, type CheckResult } from './result'
import { evaluateItem } from './values'

interface NumericPart {
  readonly lo: number
  readonly hi: number
  readonly loClosed: boolean
  readonly hiClosed: boolean
}

const BRACKETS_HINT = 'Концы верные — проверь скобки: ( не включает конец, [ включает'

function endpoint(latex: string | null, side: 'lo' | 'hi'): number | null {
  if (latex === null) return side === 'lo' ? -Infinity : Infinity
  return evaluateItem(normalizeLatex(latex))
}

function toNumeric(parts: readonly IntervalPart[]): NumericPart[] | null {
  const out: NumericPart[] = []
  for (const p of parts) {
    const lo = endpoint(p.lo, 'lo')
    const hi = endpoint(p.hi, 'hi')
    if (lo === null || hi === null) return null
    const loClosed = Number.isFinite(lo) && p.loClosed
    const hiClosed = Number.isFinite(hi) && p.hiClosed
    if (lo > hi || (sameEndpoint(lo, hi) && !(loClosed && hiClosed))) return null
    out.push({ lo, hi, loClosed, hiClosed })
  }
  return out
}

const compareLo = (a: NumericPart, b: NumericPart): number =>
  sameEndpoint(a.lo, b.lo) ? Number(b.loClosed) - Number(a.loClosed) : a.lo < b.lo ? -1 : 1

function touches(last: NumericPart, next: NumericPart): boolean {
  return next.lo < last.hi || (sameEndpoint(next.lo, last.hi) && (last.hiClosed || next.loClosed))
}

/** Sorts and merges overlapping or touching parts into a canonical union. */
export function mergeParts(parts: readonly NumericPart[]): NumericPart[] {
  return [...parts].sort(compareLo).reduce<NumericPart[]>((acc, part) => {
    const last = acc[acc.length - 1]
    if (!last || !touches(last, part)) return [...acc, part]
    const hi = Math.max(last.hi, part.hi)
    const hiClosed = sameEndpoint(part.hi, last.hi) ? last.hiClosed || part.hiClosed : part.hi > last.hi ? part.hiClosed : last.hiClosed
    return [...acc.slice(0, -1), { ...last, hi, hiClosed }]
  }, [])
}

export function checkInterval(reference: readonly IntervalPart[], answer: readonly IntervalPart[]): CheckResult {
  const user = toNumeric(answer)
  if (!user) return malformed('Проверь концы: левый должен быть меньше правого, и оба — числа')
  const ref = toNumeric(reference)
  if (!ref) throw new Error('Invalid reference interval')
  const u = mergeParts(user)
  const r = mergeParts(ref)
  if (u.length !== r.length) return incorrect()
  const valuesMatch = u.every((p, i) => sameEndpoint(p.lo, r[i].lo) && sameEndpoint(p.hi, r[i].hi))
  if (!valuesMatch) return incorrect()
  const bracketsMatch = u.every((p, i) => p.loClosed === r[i].loClosed && p.hiClosed === r[i].hiClosed)
  return bracketsMatch ? correct() : incorrect(BRACKETS_HINT)
}
```

`src/core/checker/check.ts`:
```ts
import type { AnswerSpec, IntervalPart } from '../templates/types'
import { checkExpression } from './expression'
import { checkInterval } from './interval'
import { checkNumber } from './number'
import { correct, incorrect, malformed, MSG, type CheckResult } from './result'
import { checkFiniteSet, checkNumberSet } from './sets'

export type { CheckResult } from './result'

export type UserAnswer =
  | { readonly kind: 'latex'; readonly latex: string }
  | { readonly kind: 'interval'; readonly parts: readonly IntervalPart[] }
  | { readonly kind: 'choice'; readonly id: string }

/** The single place that decides whether an answer is right. */
export function checkAnswer(spec: AnswerSpec, answer: UserAnswer): CheckResult {
  switch (spec.kind) {
    case 'number':
      return answer.kind === 'latex' ? checkNumber(spec.value, answer.latex) : malformed(MSG.wrongInput)
    case 'expression':
      return answer.kind === 'latex' ? checkExpression(spec, answer.latex) : malformed(MSG.wrongInput)
    case 'numberSet':
      return answer.kind === 'latex' ? checkNumberSet(spec.values, answer.latex) : malformed(MSG.wrongInput)
    case 'finiteSet':
      return answer.kind === 'latex' ? checkFiniteSet(spec.elements, answer.latex) : malformed(MSG.wrongInput)
    case 'interval':
      return answer.kind === 'interval' ? checkInterval(spec.parts, answer.parts) : malformed(MSG.wrongInput)
    case 'choice':
      if (answer.kind !== 'choice') return malformed(MSG.wrongInput)
      return answer.id === spec.correctId ? correct() : incorrect()
  }
}
```

`src/core/checker/reference.ts`:
```ts
import { setLatex } from '../math/latex'
import type { AnswerSpec, IntervalPart } from '../templates/types'
import type { UserAnswer } from './check'

export function intervalLatex(parts: readonly IntervalPart[]): string {
  if (parts.length === 0) return '\\emptyset'
  return parts
    .map((p) => {
      const open = p.lo !== null && p.loClosed ? '[' : '('
      const close = p.hi !== null && p.hiClosed ? ']' : ')'
      return `${open}${p.lo ?? '-\\infty'}, ${p.hi ?? '\\infty'}${close}`
    })
    .join(' \\cup ')
}

/** The correct answer, as the UI would submit it. */
export function referenceAnswer(spec: AnswerSpec): UserAnswer {
  switch (spec.kind) {
    case 'number':
    case 'expression':
      return { kind: 'latex', latex: spec.value }
    case 'numberSet':
      return { kind: 'latex', latex: spec.values.length > 0 ? spec.values.join(', ') : '\\emptyset' }
    case 'finiteSet':
      return { kind: 'latex', latex: setLatex(spec.elements) }
    case 'interval':
      return { kind: 'interval', parts: spec.parts }
    case 'choice':
      return { kind: 'choice', id: spec.correctId }
  }
}

function perturbIntervals(parts: readonly IntervalPart[]): IntervalPart[] {
  if (parts.length === 0) return [{ lo: '0', hi: '1', loClosed: true, hiClosed: true }]
  const [first, ...rest] = parts
  if (first.lo !== null) return [{ ...first, loClosed: !first.loClosed }, ...rest]
  if (first.hi !== null) return [{ ...first, hiClosed: !first.hiClosed }, ...rest]
  return [{ lo: '0', hi: null, loClosed: true, hiClosed: false }]
}

/** A plausible wrong answer — used by tests to prove the checker is not trivially permissive. */
export function perturbedAnswer(spec: AnswerSpec): UserAnswer {
  switch (spec.kind) {
    case 'number':
    case 'expression':
      return { kind: 'latex', latex: `\\left(${spec.value}\\right)+1` }
    case 'numberSet':
      return { kind: 'latex', latex: [...spec.values, '1000'].join(', ') }
    case 'finiteSet':
      return { kind: 'latex', latex: setLatex([...spec.elements, '1000']) }
    case 'interval':
      return { kind: 'interval', parts: perturbIntervals(spec.parts) }
    case 'choice':
      return { kind: 'choice', id: spec.options.find((o) => o.id !== spec.correctId)?.id ?? `${spec.correctId}-wrong` }
  }
}

/** LaTeX (or label text for choices) to display the correct answer. */
export function answerToLatex(spec: AnswerSpec): string {
  switch (spec.kind) {
    case 'number':
    case 'expression':
      return spec.value
    case 'numberSet':
      return spec.values.length > 0 ? spec.values.join(', ') : '\\emptyset'
    case 'finiteSet':
      return setLatex(spec.elements)
    case 'interval':
      return intervalLatex(spec.parts)
    case 'choice':
      return spec.options.find((o) => o.id === spec.correctId)?.label ?? ''
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/core/checker && npm run typecheck`
Expected: PASS (all checker tests).

---

### Task 9: Four sample templates and the generic harness

**Files:**
- Create: `src/core/templates/week0/linear_eq.ts`, `src/core/templates/week0/quadratic_eq.ts`, `src/core/templates/week0/factor.ts`, `src/core/templates/week1/set_ops.ts`, `src/core/templates/harness.test.ts`, `src/core/templates/samples.test.ts`

- [ ] **Step 1: Write the generic harness** — `src/core/templates/harness.test.ts`:

```ts
import katex from 'katex'
import { describe, expect, it } from 'vitest'
import { checkAnswer } from '../checker/check'
import { perturbedAnswer, referenceAnswer } from '../checker/reference'
import { GRAPH } from '../graph'
import { createRng } from '../random/rng'
import { TEMPLATES } from './registry'
import { mathSegments } from './testing'
import { TIERS } from './types'

const GEN_SEEDS = 300
const CHECK_SEEDS = 25

const renders = (tex: string): boolean => {
  katex.renderToString(tex, { throwOnError: true })
  return true
}

const entries = [...TEMPLATES.values()].map((t) => [t.skillId, t] as const)

describe('template registry is populated', () => {
  it('has at least one template', () => expect(entries.length).toBeGreaterThan(0))
})

describe.each(entries)('template %s', (skillId, template) => {
  it('belongs to a known skill and has theory and timings', () => {
    expect(GRAPH.nodes.has(skillId)).toBe(true)
    expect(template.theory.trim().length).toBeGreaterThan(40)
    TIERS.forEach((t) => expect(template.expectedSeconds[t]).toBeGreaterThan(0))
    mathSegments(template.theory).forEach((tex) => expect(renders(tex)).toBe(true))
  })

  it.each(TIERS)('tier %i: deterministic and complete', (tier) => {
    for (let seed = 1; seed <= GEN_SEEDS; seed += 1) {
      const a = template.generate(createRng(seed), tier)
      expect(template.generate(createRng(seed), tier)).toEqual(a)
      expect(a.statement.en.length, `seed ${seed}`).toBeGreaterThan(5)
      expect(a.statement.ru.length, `seed ${seed}`).toBeGreaterThan(5)
      expect(a.solution.length, `seed ${seed}`).toBeGreaterThan(0)
      expect(a.hints.length, `seed ${seed}`).toBeGreaterThan(0)
    }
  })

  it.each(TIERS)('tier %i: all LaTeX renders', (tier) => {
    for (let seed = 1; seed <= CHECK_SEEDS; seed += 1) {
      const p = template.generate(createRng(seed), tier)
      const texts = [p.statement.en, p.statement.ru, ...p.hints, ...p.solution.map((s) => s.ru)]
      texts.flatMap(mathSegments).forEach((tex) => expect(renders(tex), `seed ${seed}: ${tex}`).toBe(true))
      p.solution.forEach((s) => s.tex && expect(renders(s.tex), `seed ${seed}: ${s.tex}`).toBe(true))
    }
  })

  it.each(TIERS)('tier %i: checker accepts the reference and rejects a perturbation', (tier) => {
    for (let seed = 1; seed <= CHECK_SEEDS; seed += 1) {
      const p = template.generate(createRng(seed), tier)
      expect(checkAnswer(p.answer, referenceAnswer(p.answer)).status, `seed ${seed}`).toBe('correct')
      expect(checkAnswer(p.answer, perturbedAnswer(p.answer)).status, `seed ${seed}`).not.toBe('correct')
    }
  })
})
```

- [ ] **Step 2: Write template-specific tests** — `src/core/templates/samples.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../checker/ce'
import { checkAnswer } from '../checker/check'
import { createRng } from '../random/rng'
import { getTemplate } from './registry'
import { mathSegments } from './testing'
import { TIERS } from './types'

const evaluate = (latex: string, x: number): number => {
  const e = parseLatex(latex)
  const v = e && evalReal(e, { x })
  if (v === null || v === undefined) throw new Error(`cannot evaluate ${latex} at ${x}`)
  return v
}

const constant = (latex: string): number => {
  const e = parseLatex(latex)
  const v = e && evalReal(e)
  if (v === null || v === undefined) throw new Error(`cannot evaluate ${latex}`)
  return v
}

const lastMath = (text: string): string => {
  const segs = mathSegments(text)
  return segs[segs.length - 1]
}

describe('linear_eq', () => {
  it.each(TIERS)('tier %i: the answer satisfies the equation', (tier) => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const p = getTemplate('linear_eq').generate(createRng(seed), tier)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const x = Number(p.answer.value)
      expect(Number.isInteger(x)).toBe(true)
      const [lhs, rhs] = lastMath(p.statement.en).split('=')
      expect(evaluate(lhs, x)).toBeCloseTo(evaluate(rhs, x), 9)
    }
  })
})

describe('quadratic_eq', () => {
  it.each(TIERS)('tier %i: every listed value is a zero of f', (tier) => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const p = getTemplate('quadratic_eq').generate(createRng(seed), tier)
      if (p.answer.kind !== 'numberSet') throw new Error('expected numberSet')
      const f = lastMath(p.statement.en).replace('f(x) =', '').trim()
      p.answer.values.forEach((v) => {
        expect(Math.abs(evaluate(f, constant(v))), `seed ${seed} root ${v}`).toBeLessThan(1e-9)
      })
    }
  })

  it('tier 2 sometimes has no real roots and sometimes a double root', () => {
    const sizes = new Set(
      Array.from({ length: 80 }, (_, seed) => {
        const p = getTemplate('quadratic_eq').generate(createRng(seed + 1), 2)
        return p.answer.kind === 'numberSet' ? p.answer.values.length : -1
      }),
    )
    expect(sizes).toEqual(new Set([0, 1, 2]))
  })
})

describe('factor', () => {
  it.each(TIERS)('tier %i: the expanded statement itself is not accepted', (tier) => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const p = getTemplate('factor').generate(createRng(seed), tier)
      const expanded = lastMath(p.statement.en)
      expect(checkAnswer(p.answer, { kind: 'latex', latex: expanded }).status, `seed ${seed}`).toBe('malformed')
    }
  })
})

describe('set_ops', () => {
  it('tier 3 asks for a Cartesian product of pairs', () => {
    const p = getTemplate('set_ops').generate(createRng(3), 3)
    expect(p.answer.kind).toBe('finiteSet')
    if (p.answer.kind === 'finiteSet') expect(p.answer.elements.every((e) => /^\(\d+,\d+\)$/.test(e))).toBe(true)
  })
})
```

- [ ] **Step 3: Run to see them fail**

Run: `npx vitest run src/core/templates`
Expected: FAIL — "has at least one template" fails and `getTemplate('linear_eq')` throws.

- [ ] **Step 4: Implement `src/core/templates/week0/linear_eq.ts`**

```ts
import { coefPrefix, joinTerms, linear } from '../../math/latex'
import { lcm, rat, ratToLatex, sub } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Линейное уравнение (linear equation) — уравнение вида $ax + b = c$. Цель — оставить $x$ одного.',
  '1. Раскрой скобки и приведи подобные слагаемые.',
  '2. Слагаемые с $x$ перенеси влево, числа — вправо; при переносе знак меняется.',
  '3. Раздели обе части на коэффициент при $x$.',
  'Типичные ошибки: не сменить знак при переносе; умножить минус перед скобкой только на первое слагаемое.',
].join('\n')

const HINTS = [
  'Сначала раскрой скобки и собери всё, что с $x$, в одной части.',
  'Числа перенеси в другую часть (со сменой знака), потом раздели на коэффициент при $x$.',
]

const INPUT_HINT = 'Введи число. Дробь набирается через /'

function problem(equation: string, x: number, solution: Problem['solution']): Problem {
  return {
    statement: { en: `Solve for $x$: $${equation}$`, ru: `Реши уравнение: $${equation}$` },
    answer: { kind: 'number', value: String(x) },
    solution,
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const a = rng.int(2, 9)
  const x = rng.int(-9, 9)
  const b = rng.intExcept(-15, 15, [0])
  const c = a * x + b
  return problem(`${linear(a, b)} = ${c}`, x, [
    { ru: 'Перенесём свободный член вправо, сменив знак:', tex: `${a}x = ${c} ${b > 0 ? '-' : '+'} ${Math.abs(b)} = ${c - b}` },
    { ru: `Разделим обе части на $${a}$:`, tex: `x = \\frac{${c - b}}{${a}} = ${x}` },
  ])
}

function tier2(rng: Rng): Problem {
  const a = rng.pick([2, 3, 4, 5, -2, -3])
  const p = rng.intExcept(-6, 6, [0])
  const q = rng.intExcept(-9, 9, [0])
  const r = rng.intExcept(-5, 5, [0, a])
  const x = rng.int(-6, 6)
  const s = a * (x + p) + q - r * x
  const lhs = joinTerms([`${coefPrefix(a)}\\left(${linear(1, p)}\\right)`, String(q)])
  const rhs = linear(r, s)
  const k = a - r
  const constant = s - a * p - q
  return problem(`${lhs} = ${rhs}`, x, [
    { ru: 'Раскроем скобки:', tex: `${linear(a, a * p + q)} = ${rhs}` },
    { ru: 'Слагаемые с $x$ — влево, числа — вправо:', tex: `${linear(k, 0)} = ${constant}` },
    { ru: 'Разделим на коэффициент при $x$:', tex: Math.abs(k) === 1 ? `x = ${x}` : `x = \\frac{${constant}}{${k}} = ${x}` },
  ])
}

function tier3(rng: Rng): Problem {
  const [m, n] = rng.shuffle([2, 3, 4, 5, 6]).slice(0, 2)
  const x = rng.int(-8, 8)
  const p = rng.intExcept(-6, 6, [0])
  const q = rng.intExcept(-6, 6, [0])
  const k = sub(rat(x + p, m), rat(x - q, n))
  const multiple = lcm(m, n)
  const cm = multiple / m
  const cn = multiple / n
  const right = (k.n * multiple) / k.d
  const coefX = cm - cn
  const constant = cm * p + cn * q
  const equation = `\\frac{${linear(1, p)}}{${m}} - \\frac{${linear(1, -q)}}{${n}} = ${ratToLatex(k)}`
  return problem(equation, x, [
    {
      ru: `Умножим обе части на общий знаменатель $${multiple}$:`,
      tex: `${coefPrefix(cm)}\\left(${linear(1, p)}\\right) - ${coefPrefix(cn)}\\left(${linear(1, -q)}\\right) = ${right}`,
    },
    { ru: 'Раскроем скобки — минус перед второй скобкой меняет оба знака:', tex: `${linear(coefX, constant)} = ${right}` },
    { ru: 'Перенесём число и разделим:', tex: `${linear(coefX, 0)} = ${right - constant} \\Rightarrow x = ${x}` },
  ])
}

export const template: SkillTemplate = {
  skillId: 'linear_eq',
  theory,
  expectedSeconds: { 1: 45, 2: 100, 3: 180 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
```

- [ ] **Step 5: Implement `src/core/templates/week0/quadratic_eq.ts`**

```ts
import { paren } from '../../math/latex'
import { polyFromRoots, polyMul, polyToLatex, type Poly } from '../../math/poly'
import { gcd, rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SolutionStep, SkillTemplate } from '../types'

const theory = [
  'Квадратное уравнение (quadratic equation): $ax^2 + bx + c = 0$.',
  'Дискриминант (discriminant): $D = b^2 - 4ac$.',
  '$D > 0$ — два корня $x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}$; $D = 0$ — один двойной корень $x = -\\frac{b}{2a}$; $D < 0$ — действительных корней нет.',
  'Если $c = 0$, вынеси $x$ за скобки. Уравнение $x^4 + px^2 + q = 0$ решай заменой $z = x^2$.',
  'Типичные ошибки: потерять минус в $-b$; делить на $2a$ только $\\sqrt{D}$.',
].join('\n')

const HINTS = ['Вычисли дискриминант $D = b^2 - 4ac$.', 'Подставь в формулу $x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}$.']
const INPUT_HINT = 'Корни через запятую: 2, -3. Если корней нет — напиши none'

const coprimeTo = (rng: Rng, a: number): number =>
  rng.intExcept(-9, 9, Array.from({ length: 19 }, (_, i) => i - 9).filter((n) => gcd(n, a) !== 1))

/** Discriminant walk-through for integer a, b, c whose discriminant is a perfect square or negative. */
export function quadraticSteps(a: number, b: number, c: number): SolutionStep[] {
  const d = b * b - 4 * a * c
  const dStep: SolutionStep = { ru: 'Дискриминант:', tex: `D = ${paren(b)}^2 - 4 \\cdot ${paren(a)} \\cdot ${paren(c)} = ${d}` }
  if (d < 0) return [dStep, { ru: '$D < 0$, поэтому действительных корней нет.', tex: '\\emptyset' }]
  if (d === 0) {
    return [dStep, { ru: '$D = 0$ — один двойной корень:', tex: `x = \\frac{${-b}}{${2 * a}} = ${ratToLatex(rat(-b, 2 * a))}` }]
  }
  const s = Math.round(Math.sqrt(d))
  return [
    dStep,
    { ru: 'Два корня:', tex: `x_{1,2} = \\frac{${-b} \\pm ${s}}{${2 * a}}` },
    { ru: 'Итого:', tex: `x_1 = ${ratToLatex(rat(-b + s, 2 * a))}, \\quad x_2 = ${ratToLatex(rat(-b - s, 2 * a))}` },
  ]
}

function build(poly: Poly, values: readonly string[], solution: readonly SolutionStep[]): Problem {
  const f = polyToLatex(poly)
  return {
    statement: { en: `Determine the real zeros of $f(x) = ${f}$.`, ru: `Найди действительные нули функции $f(x) = ${f}$.` },
    answer: { kind: 'numberSet', values },
    solution,
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const r1 = rng.int(-7, 7)
  const r2 = rng.intExcept(-7, 7, [r1])
  const poly = polyFromRoots(1, [r1, r2])
  return build(poly, [String(r1), String(r2)], quadraticSteps(1, poly[1], poly[0]))
}

function tier2(rng: Rng): Problem {
  const roll = rng.next()
  if (roll < 0.6) {
    const a = rng.int(2, 5)
    const r1 = rng.int(-5, 5)
    const m = coprimeTo(rng, a)
    const poly = polyMul([-r1, 1], [-m, a])
    return build(poly, [String(r1), ratToLatex(rat(m, a))], quadraticSteps(poly[2], poly[1], poly[0]))
  }
  if (roll < 0.8) {
    const k = rng.int(1, 3)
    const m = coprimeTo(rng, k)
    const poly = polyMul([-m, k], [-m, k])
    return build(poly, [ratToLatex(rat(m, k))], quadraticSteps(poly[2], poly[1], poly[0]))
  }
  const a = rng.int(1, 4)
  const b = rng.int(-6, 6)
  const c = Math.floor((b * b) / (4 * a)) + rng.int(1, 5)
  return build([c, b, a], [], quadraticSteps(a, b, c))
}

function biquadratic(rng: Rng): Problem {
  const [p, q] = rng.shuffle([1, 2, 3, 4]).slice(0, 2)
  const poly = [p * p * q * q, 0, -(p * p + q * q), 0, 1]
  return build(poly, [String(p), String(-p), String(q), String(-q)], [
    { ru: 'Замена $z = x^2$:', tex: `${polyToLatex([p * p * q * q, -(p * p + q * q), 1], 'z')} = 0` },
    { ru: 'Корни по $z$ (оба положительны):', tex: `z_1 = ${p * p}, \\quad z_2 = ${q * q}` },
    { ru: 'Обратная замена $x = \\pm\\sqrt{z}$:', tex: `x = \\pm ${p}, \\quad x = \\pm ${q}` },
  ])
}

function biquadraticOneBranch(rng: Rng): Problem {
  const p = rng.int(1, 4)
  const q = rng.int(1, 3)
  const poly = [-p * p * q * q, 0, q * q - p * p, 0, 1]
  return build(poly, [String(p), String(-p)], [
    { ru: 'Замена $z = x^2$:', tex: `${polyToLatex([-p * p * q * q, q * q - p * p, 1], 'z')} = 0` },
    { ru: 'Корни по $z$:', tex: `z_1 = ${p * p}, \\quad z_2 = ${-q * q}` },
    { ru: '$z_2 < 0$ не даёт действительных $x$; из $z_1$:', tex: `x = \\pm ${p}` },
  ])
}

function cubicWithZero(rng: Rng): Problem {
  const a = rng.pick([1, 2, -1])
  const r1 = rng.intExcept(-5, 5, [0])
  const r2 = rng.intExcept(-5, 5, [0, r1])
  const quad = polyFromRoots(a, [r1, r2])
  return build(polyMul(quad, [0, 1]), ['0', String(r1), String(r2)], [
    { ru: 'Вынесем $x$ за скобки:', tex: `x\\left(${polyToLatex(quad)}\\right) = 0` },
    { ru: 'Один корень $x = 0$; остальные — из квадратного уравнения:', tex: `${polyToLatex(quad)} = 0` },
    ...quadraticSteps(quad[2], quad[1], quad[0]),
  ])
}

function tier3(rng: Rng): Problem {
  const roll = rng.next()
  if (roll < 0.35) return biquadratic(rng)
  if (roll < 0.55) return biquadraticOneBranch(rng)
  return cubicWithZero(rng)
}

export const template: SkillTemplate = {
  skillId: 'quadratic_eq',
  theory,
  expectedSeconds: { 1: 60, 2: 120, 3: 200 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
```

- [ ] **Step 6: Implement `src/core/templates/week0/factor.ts`**

```ts
import { linear } from '../../math/latex'
import { polyFromRoots, polyToLatex, type Poly } from '../../math/poly'
import { gcd } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SolutionStep, SkillTemplate } from '../types'

const theory = [
  'Разложить на множители (factor) — записать выражение как произведение.',
  '1. Вынеси общий множитель: $6x^2 - 9x = 3x(2x - 3)$.',
  '2. Разность квадратов (difference of squares): $a^2 - b^2 = (a - b)(a + b)$.',
  '3. Трёхчлен: $x^2 + bx + c = (x - x_1)(x - x_2)$, где $x_1 + x_2 = -b$ и $x_1 x_2 = c$.',
  'Проверка — раскрой скобки обратно. Ответ вводи произведением, например (x-2)(x+3).',
].join('\n')

const HINTS = ['Есть ли общий множитель у всех слагаемых?', 'Для $x^2 + bx + c$ найди два числа: их сумма $-b$, произведение $c$.']
const INPUT_HINT = 'Запиши произведение, например 3x(x-2) или (x-1)(x+4)'

const bracket = (a: number, b: number): string => `\\left(${linear(a, b)}\\right)`

function build(poly: Poly, value: string, solution: readonly SolutionStep[]): Problem {
  const expanded = polyToLatex(poly)
  return {
    statement: { en: `Factor completely: $${expanded}$`, ru: `Разложи на множители: $${expanded}$` },
    answer: { kind: 'expression', value, variables: ['x'], form: 'factored' },
    solution,
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const k = rng.int(2, 6)
  const p = rng.intExcept(-7, 7, [0])
  if (rng.chance(0.6)) {
    const poly = [0, k * p, k]
    const value = `${k}x${bracket(1, p)}`
    return build(poly, value, [{ ru: `Общий множитель — $${k}x$:`, tex: `${polyToLatex(poly)} = ${value}` }])
  }
  const poly = [k * p, k]
  const value = `${k}${bracket(1, p)}`
  return build(poly, value, [{ ru: `Общий множитель — $${k}$:`, tex: `${polyToLatex(poly)} = ${value}` }])
}

function tier2(rng: Rng): Problem {
  const r1 = rng.intExcept(-8, 8, [0])
  const r2 = rng.intExcept(-8, 8, [0, r1])
  const poly = polyFromRoots(1, [r1, r2])
  const value = `${bracket(1, -r1)}${bracket(1, -r2)}`
  return build(poly, value, [
    { ru: `Ищем два числа с суммой $${r1 + r2}$ и произведением $${r1 * r2}$: это $${r1}$ и $${r2}$.` },
    { ru: 'Значит:', tex: `${polyToLatex(poly)} = ${value}` },
  ])
}

function tier3(rng: Rng): Problem {
  if (rng.chance(0.5)) {
    const a = rng.int(1, 5)
    const b = rng.intExcept(1, 9, [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => gcd(n, a) !== 1))
    const poly = [-b * b, 0, a * a]
    const value = `${bracket(a, -b)}${bracket(a, b)}`
    return build(poly, value, [
      { ru: `Разность квадратов: $${polyToLatex(poly)} = (${linear(a, 0)})^2 - ${b}^2$.` },
      { ru: 'По формуле $a^2 - b^2 = (a-b)(a+b)$:', tex: value },
    ])
  }
  const k = rng.pick([2, 3, 5])
  const r1 = rng.intExcept(-6, 6, [0])
  const r2 = rng.intExcept(-6, 6, [0, r1])
  const poly = polyFromRoots(k, [r1, r2])
  const inner = polyFromRoots(1, [r1, r2])
  const value = `${k}${bracket(1, -r1)}${bracket(1, -r2)}`
  return build(poly, value, [
    { ru: `Вынесем общий множитель $${k}$:`, tex: `${k}\\left(${polyToLatex(inner)}\\right)` },
    { ru: `Числа с суммой $${r1 + r2}$ и произведением $${r1 * r2}$ — это $${r1}$ и $${r2}$:`, tex: value },
  ])
}

export const template: SkillTemplate = {
  skillId: 'factor',
  theory,
  expectedSeconds: { 1: 45, 2: 90, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
```

- [ ] **Step 7: Implement `src/core/templates/week1/set_ops.ts`**

```ts
import { setLatex } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { Problem, SolutionStep, SkillTemplate } from '../types'

const theory = [
  'Множество (set) — набор различных элементов; порядок не важен.',
  '$A \\cup B$ (union) — элементы, которые есть в $A$ или в $B$.',
  '$A \\cap B$ (intersection) — элементы, которые есть и в $A$, и в $B$.',
  '$A \\setminus B$ (difference) — элементы $A$, которых нет в $B$.',
  '$A \\times B$ (Cartesian product) — все пары $(a, b)$, где $a \\in A$ и $b \\in B$.',
  'Пустое множество — $\\emptyset$.',
].join('\n')

const HINTS = ['Выпиши элементы каждого множества и отмечай нужные по определению операции.', 'Порядок элементов не важен, повторы не пишутся.']
const INPUT_HINT = 'Элементы через запятую, например {1, 2, 3}. Пустое множество — none. Пары: (1,2)'

type NumSet = readonly number[]

const sortNum = (xs: readonly number[]): number[] => [...xs].sort((a, b) => a - b)
const union = (a: NumSet, b: NumSet): number[] => sortNum([...new Set([...a, ...b])])
const intersect = (a: NumSet, b: NumSet): number[] => a.filter((x) => b.includes(x))
const difference = (a: NumSet, b: NumSet): number[] => a.filter((x) => !b.includes(x))
const randomSet = (rng: Rng, size: number, max = 9): number[] =>
  sortNum(rng.shuffle(Array.from({ length: max }, (_, i) => i + 1)).slice(0, size))

function build(given: string, target: string, result: readonly (number | string)[], solution: readonly SolutionStep[]): Problem {
  return {
    statement: { en: `Let ${given.replace('{and}', 'and')}. Find $${target}$.`, ru: `Пусть ${given.replace('{and}', 'и')}. Найди $${target}$.` },
    answer: { kind: 'finiteSet', elements: result.map(String) },
    solution,
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

const givenTwo = (a: NumSet, b: NumSet): string => `$A = ${setLatex(a)}$ {and} $B = ${setLatex(b)}$`
const givenThree = (a: NumSet, b: NumSet, c: NumSet): string => `$A = ${setLatex(a)}$, $B = ${setLatex(b)}$, $C = ${setLatex(c)}$`

function tier1(rng: Rng): Problem {
  const a = randomSet(rng, rng.int(3, 5))
  const b = randomSet(rng, rng.int(3, 5))
  if (rng.chance(0.5)) {
    const r = union(a, b)
    return build(givenTwo(a, b), 'A \\cup B', r, [{ ru: 'Объединение — все элементы из $A$ и из $B$ без повторов:', tex: `A \\cup B = ${setLatex(r)}` }])
  }
  const r = intersect(a, b)
  return build(givenTwo(a, b), 'A \\cap B', r, [{ ru: 'Пересечение — только общие элементы:', tex: `A \\cap B = ${setLatex(r)}` }])
}

function tier2(rng: Rng): Problem {
  const a = randomSet(rng, rng.int(3, 5))
  const b = randomSet(rng, rng.int(3, 5))
  const c = randomSet(rng, rng.int(2, 4))
  switch (rng.int(0, 3)) {
    case 0: {
      const r = difference(a, b)
      return build(givenTwo(a, b), 'A \\setminus B', r, [{ ru: 'Берём элементы $A$ и вычёркиваем те, что есть в $B$:', tex: `A \\setminus B = ${setLatex(r)}` }])
    }
    case 1: {
      const r = difference(b, a)
      return build(givenTwo(a, b), 'B \\setminus A', r, [{ ru: 'Берём элементы $B$ и вычёркиваем те, что есть в $A$:', tex: `B \\setminus A = ${setLatex(r)}` }])
    }
    case 2: {
      const ab = union(a, b)
      const r = difference(ab, c)
      return build(givenThree(a, b, c), '(A \\cup B) \\setminus C', r, [
        { ru: 'Сначала скобка:', tex: `A \\cup B = ${setLatex(ab)}` },
        { ru: 'Теперь вычёркиваем элементы $C$:', tex: `(A \\cup B) \\setminus C = ${setLatex(r)}` },
      ])
    }
    default: {
      const bc = union(b, c)
      const r = intersect(a, bc)
      return build(givenThree(a, b, c), 'A \\cap (B \\cup C)', r, [
        { ru: 'Сначала скобка:', tex: `B \\cup C = ${setLatex(bc)}` },
        { ru: 'Теперь общие элементы с $A$:', tex: `A \\cap (B \\cup C) = ${setLatex(r)}` },
      ])
    }
  }
}

function tier3(rng: Rng): Problem {
  const a = randomSet(rng, 2, 4)
  const b = randomSet(rng, rng.pick([2, 3]), 4)
  const pairs = a.flatMap((x) => b.map((y) => `(${x},${y})`))
  return build(givenTwo(a, b), 'A \\times B', pairs, [
    { ru: 'Каждый элемент $A$ ставим в пару с каждым элементом $B$ (первым — из $A$):', tex: `A \\times B = ${setLatex(pairs)}` },
    { ru: `Всего пар: $${a.length} \\cdot ${b.length} = ${pairs.length}$.` },
  ])
}

export const template: SkillTemplate = {
  skillId: 'set_ops',
  theory,
  expectedSeconds: { 1: 40, 2: 70, 3: 90 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
```

- [ ] **Step 8: Run tests**

Run: `npx vitest run src/core/templates`
Expected: PASS. Typical fixes if something fails: a statement segment KaTeX cannot render (fix the LaTeX), or a reference answer the checker rejects (fix the generator, never loosen the checker without a golden case).

- [ ] **Step 9: Full check**

Run: `npm test && npm run typecheck`
Expected: all green. Note total test time in the report (the harness should stay under ~60 s).
