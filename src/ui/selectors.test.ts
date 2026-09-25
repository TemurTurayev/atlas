import { describe, expect, it } from 'vitest'
import { GRAPH } from '../core/graph'
import { hasTemplate } from '../core/templates/registry'
import { startProgress, type SkillProgress } from '../core/learner/progress'
import { newCard } from '../core/scheduler/fsrs'
import { initialWorld, type World } from '../core/session/world'
import { formatPercent, plural, splitMath } from './format'
import { dueCount, frontier, skillStatus } from './selectors'

const NOW = new Date(2026, 8, 21, 10)
const mastered = (id: string, at = NOW): SkillProgress => ({ ...startProgress(id, 0), phase: 'mastered', card: newCard('good', at, 100) })

describe('selectors', () => {
  it('lists the next available skills from the base', () => {
    expect(frontier(initialWorld(NOW), 3)[0]).toBe('int_neg')
  })

  it('moves the frontier once prerequisites are mastered', () => {
    const w: World = { ...initialWorld(NOW), progress: { int_neg: mastered('int_neg') } }
    expect(frontier(w, 3)).toContain('order_ops')
    expect(frontier(w, 3)).not.toContain('int_neg')
  })

  it('counts skills due today', () => {
    const w: World = { ...initialWorld(NOW), progress: { int_neg: mastered('int_neg', new Date(2026, 8, 1)) } }
    expect(dueCount(w, NOW)).toBe(1)
    expect(dueCount(initialWorld(NOW), NOW)).toBe(0)
  })

  it('classifies skills for the map', () => {
    const w: World = { ...initialWorld(NOW), progress: { int_neg: mastered('int_neg'), order_ops: startProgress('order_ops', 0) } }
    expect(skillStatus(w, 'int_neg')).toBe('mastered')
    expect(skillStatus(w, 'order_ops')).toBe('learning')
    expect(skillStatus(w, 'quadratic_eq')).toBe('locked')
    // A skill whose week has no generators yet; pick it from the graph so writing that content
    // does not break this test the way adding week 4 once did.
    const untaught = GRAPH.ladder.find((id) => !hasTemplate(id))
    expect(untaught, 'every skill has content — drop this case').toBeDefined()
    expect(skillStatus(w, untaught as string)).toBe('soon')
  })
})

describe('format', () => {
  it('splits text into prose and math', () => {
    expect(splitMath('Solve $x+1$ now')).toEqual([
      { math: false, text: 'Solve ' },
      { math: true, text: 'x+1' },
      { math: false, text: ' now' },
    ])
  })
  it('formats percents and plurals', () => {
    expect(formatPercent(0.384)).toBe('38%')
    expect(plural(1, 'skill')).toBe('skill')
    expect(plural(3, 'skill')).toBe('skills')
    expect(plural(0, 'skill')).toBe('skills')
    expect(plural(2, 'clean answer')).toBe('clean answers')
  })
})
