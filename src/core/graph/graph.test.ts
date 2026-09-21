import { describe, expect, it } from 'vitest'
import { buildGraph } from './graph'
import { GRAPH } from './index'
import { EXAM_WEEKS, NODES, type SkillNode } from './nodes'

const node = (id: string, week: number, prereqs: string[] = []): SkillNode => ({
  id,
  week,
  prereqs,
  title: id,
  highYield: false,
})

describe('skill graph data', () => {
  it('has 125 unique nodes with Russian and English titles', () => {
    expect(NODES).toHaveLength(125)
    expect(new Set(NODES.map((n) => n.id)).size).toBe(125)
    NODES.forEach((n) => {
      expect(n.title.length).toBeGreaterThan(2)
      expect(n.title.length).toBeGreaterThan(2)
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
