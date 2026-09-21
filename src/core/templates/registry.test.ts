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
    statement: 'e',
    answer: { kind: 'number', value: '1' },
    solution: [{ text: 's' }],
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
