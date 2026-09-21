import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startProgress } from '../core/learner/progress'
import { newCard } from '../core/scheduler/fsrs'
import { initialWorld, type World } from '../core/session/world'
import { AtlasDb } from './db'
import { exportAll, importAll, loadWorld, logAttempt, saveWorld } from './repo'

const NOW = new Date(2026, 8, 21, 10)
let db: AtlasDb

beforeEach(() => {
  db = new AtlasDb(`atlas-test-${Math.random().toString(36).slice(2)}`)
})

afterEach(async () => {
  await db.delete()
})

const worldWithSkill = (): World => ({
  ...initialWorld(NOW),
  progress: { a: { ...startProgress('a', 1), phase: 'mastered', masteredAt: 2, card: newCard('good', NOW, 100) } },
  meta: { expressStreak: 2, jumpStride: 8, recent: [true, false] },
})

describe('repo', () => {
  it('loads defaults from an empty database', async () => {
    const w = await loadWorld(db, NOW)
    expect(w.progress).toEqual({})
    expect(w.settings.examDate).toBe('2027-01-29')
    expect(w.day.date).toBe('2026-09-21')
  })

  it('round-trips progress (with Date fields) and key-value state', async () => {
    const world = worldWithSkill()
    await saveWorld(db, null, world)
    const loaded = await loadWorld(db, NOW)
    expect(loaded.progress.a.card?.due).toBeInstanceOf(Date)
    expect(loaded.progress.a.card?.due.getTime()).toBe(world.progress.a.card?.due.getTime())
    expect(loaded.meta).toEqual(world.meta)
  })

  it('writes only changed progress rows', async () => {
    const first = worldWithSkill()
    await saveWorld(db, null, first)
    const b = startProgress('b', 3)
    const second: World = { ...first, progress: { ...first.progress, b } }
    const spy = vi.spyOn(db.progress, 'bulkPut')
    await saveWorld(db, first, second)
    expect(spy).toHaveBeenCalledWith([b])
  })

  it('logs attempts', async () => {
    await logAttempt(db, { skillId: 'a', seed: 1, tier: 2, mode: 'express', correct: true, hintsUsed: 0, seconds: 12, answer: '2', at: 5 })
    expect(await db.attempts.count()).toBe(1)
  })

  it('exports and re-imports everything, reviving dates', async () => {
    await saveWorld(db, null, worldWithSkill())
    await logAttempt(db, { skillId: 'a', seed: 1, tier: 2, mode: 'express', correct: true, hintsUsed: 0, seconds: 12, answer: '2', at: 5 })
    const json = await exportAll(db, NOW)
    const other = new AtlasDb(`atlas-import-${Math.random().toString(36).slice(2)}`)
    await importAll(other, json)
    const loaded = await loadWorld(other, NOW)
    expect(loaded.progress.a.card?.due).toBeInstanceOf(Date)
    expect(await other.attempts.count()).toBe(1)
    await other.delete()
  })

  it('rejects files that are not Atlas backups', async () => {
    await expect(importAll(db, '{"app":"other"}')).rejects.toThrow(/not an Atlas backup/)
    await expect(importAll(db, 'not json')).rejects.toThrow()
  })
})
