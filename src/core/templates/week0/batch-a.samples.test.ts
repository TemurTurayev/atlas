import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { exactClose } from '../../checker/compare'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'
import { mathSegments } from '../testing'
import { TIERS } from '../types'

const SEEDS = 60

function evaluate(latex: string, vars: Record<string, number> = {}): number {
  const e = parseLatex(latex)
  const v = e && evalReal(e, vars)
  if (v === null || v === undefined) throw new Error(`cannot evaluate ${latex}`)
  return v
}

/** The last (or only) $…$ segment of a text — the arithmetic expression to compute. */
const lastMath = (text: string): string => {
  const segs = mathSegments(text)
  return segs[segs.length - 1]
}

function closeEnough(a: number, b: number, seed: number, label: string): void {
  expect(exactClose(a, b), `seed ${seed} ${label}: ${a} vs ${b}`).toBe(true)
}

function requireMatch(text: string, re: RegExp): RegExpMatchArray {
  const m = text.match(re)
  if (!m) throw new Error(`pattern ${re} did not match: ${text}`)
  return m
}

describe('int_neg', () => {
  it.each(TIERS)('tier %i: evaluating the raw expression matches the stored answer', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('int_neg').generate(createRng(seed), tier)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const raw = evaluate(lastMath(p.statement.en))
      closeEnough(raw, evaluate(p.answer.value), seed, 'int_neg')
    }
  })
})

describe('order_ops', () => {
  it.each(TIERS)('tier %i: evaluating the raw expression matches the stored answer', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('order_ops').generate(createRng(seed), tier)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const raw = evaluate(lastMath(p.statement.en))
      closeEnough(raw, evaluate(p.answer.value), seed, 'order_ops')
    }
  })
})

describe('fractions', () => {
  it.each(TIERS)('tier %i: evaluating the raw expression matches the stored answer', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('fractions').generate(createRng(seed), tier)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const raw = evaluate(lastMath(p.statement.en))
      closeEnough(raw, evaluate(p.answer.value), seed, 'fractions')
    }
  })
})

describe('percent_ratio', () => {
  it('tier 2: old value grown by the answer percent equals the stated new value', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('percent_ratio').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const [, oldText, newText] = requireMatch(p.statement.en, /changes from \$(-?\d+(?:\.\d+)?)\$ to \$(-?\d+(?:\.\d+)?)\$/)
      const oldValue = Number(oldText)
      const newValue = Number(newText)
      const change = evaluate(p.answer.value)
      closeEnough(oldValue * (1 + change / 100), newValue, seed, 'percent_ratio tier2')
    }
  })
})

const SAMPLE_POINT: Record<string, number> = { x: 2, y: -1.5, a: 2, b: 2.5 }

describe('powers', () => {
  it.each(TIERS)('tier %i: the original expression and the simplified answer agree at a sample point', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('powers').generate(createRng(seed), tier)
      if (p.answer.kind !== 'expression') throw new Error('expected expression')
      const point = Object.fromEntries(p.answer.variables.map((v) => [v, SAMPLE_POINT[v]]))
      const original = evaluate(lastMath(p.statement.en), point)
      const simplified = evaluate(p.answer.value, point)
      closeEnough(original, simplified, seed, `powers tier${tier}`)
    }
  })
})

describe('roots', () => {
  it.each(TIERS)('tier %i: evaluating the raw expression matches the stored answer', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('roots').generate(createRng(seed), tier)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const raw = evaluate(lastMath(p.statement.en))
      closeEnough(raw, evaluate(p.answer.value), seed, 'roots')
    }
  })
})

describe('sci_notation', () => {
  it.each(TIERS)('tier %i: evaluating the raw expression matches the stored answer', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('sci_notation').generate(createRng(seed), tier)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const raw = evaluate(lastMath(p.statement.en))
      closeEnough(raw, evaluate(p.answer.value), seed, 'sci_notation')
    }
  })
})

describe('units', () => {
  it('tier 1: km/h converted with the exact 5/18 factor matches the stored answer', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('units').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const [, kmhText] = requireMatch(p.statement.en, /Convert \$(-?\d+(?:\.\d+)?)\$ km\/h to m\/s/)
      const kmh = Number(kmhText)
      closeEnough(evaluate(p.answer.value) * 18, kmh * 5, seed, 'units tier1')
    }
  })

  it('tier 2: µL→mL divides by 1000, g→mg multiplies by 1000', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('units').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const answer = evaluate(p.answer.value)
      if (p.statement.en.includes('µL')) {
        const [, ulText] = requireMatch(p.statement.en, /Convert \$(-?\d+(?:\.\d+)?)\$ µL to mL/)
        closeEnough(answer * 1000, Number(ulText), seed, 'units tier2 µL→mL')
      } else {
        const [, gText] = requireMatch(p.statement.en, /Convert \$(-?\d+(?:\.\d+)?)\$ g to mg/)
        closeEnough(answer, Number(gText) * 1000, seed, 'units tier2 g→mg')
      }
    }
  })

  it('tier 3: density×1000→kg/m³, dose×weight→total mg', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('units').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const answer = evaluate(p.answer.value)
      if (p.statement.en.includes('density')) {
        const [, dText] = requireMatch(p.statement.en, /density \$(-?\d+(?:\.\d+)?)\$ g\/cm/)
        closeEnough(answer, Number(dText) * 1000, seed, 'units tier3 density')
      } else {
        const [, doseText, weightText] = requireMatch(p.statement.en, /dosed at \$(-?\d+(?:\.\d+)?)\$ mg\/kg.*weighing \$(-?\d+(?:\.\d+)?)\$ kg/)
        closeEnough(answer, Number(doseText) * Number(weightText), seed, 'units tier3 dose')
      }
    }
  })
})
