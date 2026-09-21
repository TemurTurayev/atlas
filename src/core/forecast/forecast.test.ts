import { describe, expect, it } from 'vitest'
import { GRAPH } from '../graph'
import { startProgress, type SkillProgress } from '../learner/progress'
import { newCard } from '../scheduler/fsrs'
import { computeForecast } from './forecast'

const NOW = new Date(2026, 8, 20, 10)
const mastered = (id: string, withCard = true): SkillProgress => ({
  ...startProgress(id, 0), phase: 'mastered', card: withCard ? newCard('good', NOW, 100) : null,
})
const masterWeek = (week: number): Record<string, SkillProgress> =>
  Object.fromEntries([...GRAPH.nodes.values()].filter((n) => n.week === week).map((n) => [n.id, mastered(n.id)]))

describe('computeForecast', () => {
  it('is zero with no progress', () => {
    expect(computeForecast(GRAPH, {}, NOW)).toMatchObject({ exam: 0, base: 0 })
  })

  it('a fully recalled exam week contributes 1/12', () => {
    const f = computeForecast(GRAPH, masterWeek(1), NOW)
    expect(f.perWeek[1]).toBeCloseTo(1, 2)
    expect(f.exam).toBeCloseTo(1 / 12, 2)
  })

  it('weights high-yield skills double within a week', () => {
    const f = computeForecast(GRAPH, { set_ops: mastered('set_ops') }, NOW)
    expect(f.perWeek[1]).toBeCloseTo(2 / 19, 3)
  })

  it('computes the base from week 0 (card-less mastery counts as 1)', () => {
    const base = Object.fromEntries(['int_neg', 'order_ops', 'fractions'].map((id) => [id, mastered(id, false)]))
    expect(computeForecast(GRAPH, base, NOW).base).toBeCloseTo(3 / 24, 5)
  })

  it('measures coverage only over the skills the app can teach', () => {
    const taught = (id: string) => ['int_neg', 'order_ops', 'set_ops'].includes(id)
    const progress = { int_neg: mastered('int_neg'), order_ops: mastered('order_ops') }
    expect(computeForecast(GRAPH, progress, NOW, taught).covered).toBeCloseTo(2 / 3, 5)
    expect(computeForecast(GRAPH, {}, NOW, taught).covered).toBe(0)
  })

  it('counts every skill in coverage when nothing is excluded', () => {
    expect(computeForecast(GRAPH, masterWeek(1), NOW).covered).toBeCloseTo(17 / GRAPH.nodes.size, 5)
  })

  it('ignores skills that are not mastered', () => {
    expect(computeForecast(GRAPH, { set_ops: startProgress('set_ops', 0) }, NOW).exam).toBe(0)
  })
})
