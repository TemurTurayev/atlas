import katex from 'katex'
import { describe, expect, it } from 'vitest'
import { checkAnswer } from '../checker/check'
import { perturbedAnswer, referenceAnswer } from '../checker/reference'
import { GRAPH } from '../graph'
import { createRng } from '../random/rng'
import { TEMPLATES } from './registry'
import { mathSegments, repeatedValues, signSlips, strayLatex } from './testing'
import { TIERS, type AnswerSpec } from './types'

const GEN_SEEDS = 300
const CHECK_SEEDS = 25
// A skill is practised many times; a generator with a handful of problems gets memorised, not learned.
// 15 of 60 leaves room for topics with a naturally short list, such as the standard angles.
const VARIETY_SEEDS = 60
const MIN_DISTINCT = 15

const renders = (tex: string): boolean => {
  katex.renderToString(tex, { throwOnError: true })
  return true
}

/** An answer's identity for the variety check: shuffling the options of one question does not make a new one. */
function problemKey(answer: AnswerSpec): string {
  if (answer.kind !== 'choice') return JSON.stringify(answer)
  const labels = answer.options.map((o) => o.label).sort()
  return JSON.stringify({ labels, correct: answer.options.find((o) => o.id === answer.correctId)?.label })
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
      expect(a.statement.length, `seed ${seed}`).toBeGreaterThan(5)
      expect(a.solution.length, `seed ${seed}`).toBeGreaterThan(0)
      expect(a.hints.length, `seed ${seed}`).toBeGreaterThan(0)
    }
  })

  it.each(TIERS)('tier %i: varied enough that answers cannot be memorised', (tier) => {
    const seen = new Set<string>()
    for (let seed = 1; seed <= VARIETY_SEEDS; seed += 1) {
      const p = template.generate(createRng(seed), tier)
      seen.add(`${p.statement}\n${problemKey(p.answer)}`)
    }
    expect(seen.size, `${skillId} tier ${tier}`).toBeGreaterThanOrEqual(MIN_DISTINCT)
  })

  it('theory keeps its LaTeX inside $…$', () => {
    expect(strayLatex(template.theory), skillId).toEqual([])
  })

  it.each(TIERS)('tier %i: every formula lives inside $…$', (tier) => {
    for (let seed = 1; seed <= CHECK_SEEDS; seed += 1) {
      const p = template.generate(createRng(seed), tier)
      const prose = [p.statement, ...p.hints, ...p.solution.map((s) => s.text), ...(p.alternative?.steps ?? []).map((s) => s.text)]
      const options = p.answer.kind === 'choice' ? p.answer.options.map((o) => o.label) : []
      ;[...prose, ...options].forEach((text) => expect(strayLatex(text), `seed ${seed}: ${text}`).toEqual([]))
    }
  })

  it.each(TIERS)('tier %i: no doubled signs or repeated values in formulas', (tier) => {
    for (let seed = 1; seed <= CHECK_SEEDS; seed += 1) {
      const p = template.generate(createRng(seed), tier)
      const prose = [p.statement, ...p.hints, ...p.solution.map((s) => s.text), ...(p.alternative?.steps ?? []).map((s) => s.text)]
      const display = [...p.solution, ...(p.alternative?.steps ?? [])].map((s) => s.tex ?? '')
      ;[...prose.flatMap(mathSegments), ...display].forEach((tex) => expect(signSlips(tex), `seed ${seed}: ${tex}`).toEqual([]))
      ;[...prose.flatMap(mathSegments), ...display].forEach((tex) => expect(repeatedValues(tex), `seed ${seed}: ${tex}`).toEqual([]))
    }
  })

  it.each(TIERS)('tier %i: all LaTeX renders', (tier) => {
    for (let seed = 1; seed <= CHECK_SEEDS; seed += 1) {
      const p = template.generate(createRng(seed), tier)
      const texts = [p.statement, ...p.hints, ...p.solution.map((s) => s.text)]
      texts.flatMap(mathSegments).forEach((tex) => expect(renders(tex), `seed ${seed}: ${tex}`).toBe(true))
      p.solution.forEach((s) => s.tex && expect(renders(s.tex), `seed ${seed}: ${s.tex}`).toBe(true))
      if (p.alternative) {
        expect(p.alternative.title.length).toBeGreaterThan(5)
        p.alternative.steps.forEach((s) => {
          mathSegments(s.text).forEach((tex) => expect(renders(tex), `seed ${seed}: ${tex}`).toBe(true))
          if (s.tex) expect(renders(s.tex), `seed ${seed}: ${s.tex}`).toBe(true)
        })
      }
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
