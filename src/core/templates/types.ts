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
  | { readonly kind: 'vector'; readonly components: readonly string[] }
  | { readonly kind: 'choice'; readonly options: readonly ChoiceOption[]; readonly correctId: string }

export interface SolutionStep {
  /** The explanation, may contain $…$ LaTeX. */
  readonly text: string
  /** Optional display formula (LaTeX without $ delimiters). */
  readonly tex?: string
}

export interface Problem {
  /** Statement with $…$ LaTeX. */
  readonly statement: string
  readonly answer: AnswerSpec
  readonly solution: readonly SolutionStep[]
  /** Hints, from gentle to specific. */
  readonly hints: readonly string[]
  /** A second way to solve the same problem, shown on request. */
  readonly alternative?: { readonly title: string; readonly steps: readonly SolutionStep[] }
  /** Plain-text tip on how to type the answer. */
  readonly inputHint?: string
}

export interface SkillTemplate {
  readonly skillId: string
  /** Short theory card, 3–8 lines separated by \n, with $…$ LaTeX. */
  readonly theory: string
  readonly expectedSeconds: Readonly<Record<Tier, number>>
  generate(rng: Rng, tier: Tier): Problem
}
