import { describe, expect, it } from 'vitest'
import { countDay, INITIAL_STREAK, rollover } from './streak'

describe('streak', () => {
  it('counts each day once and tracks the best', () => {
    const one = countDay(INITIAL_STREAK, '2026-09-20')
    expect(countDay(one, '2026-09-20')).toBe(one)
    const two = countDay(one, '2026-09-21')
    expect(two).toMatchObject({ current: 2, best: 2, lastDay: '2026-09-21' })
  })

  it('earns a freeze every 7 days, up to 2', () => {
    let s = { ...INITIAL_STREAK, freezes: 0 }
    for (let d = 1; d <= 21; d += 1) s = countDay(s, `2026-10-${String(d).padStart(2, '0')}`)
    expect(s.current).toBe(21)
    expect(s.freezes).toBe(2)
  })

  it('rolls over: consecutive days are untouched', () => {
    const s = countDay(INITIAL_STREAK, '2026-09-20')
    expect(rollover(s, '2026-09-21')).toBe(s)
    expect(rollover(INITIAL_STREAK, '2026-09-21')).toBe(INITIAL_STREAK)
  })

  it('spends freezes on missed days and keeps the streak', () => {
    const s = { current: 5, best: 5, freezes: 1, lastDay: '2026-09-20' }
    const r = rollover(s, '2026-09-22')
    expect(r).toMatchObject({ current: 5, freezes: 0, lastDay: '2026-09-21' })
    expect(rollover(r, '2026-09-22')).toBe(r)
    expect(countDay(r, '2026-09-22').current).toBe(6)
  })

  it('resets when there are not enough freezes', () => {
    const s = { current: 5, best: 5, freezes: 1, lastDay: '2026-09-20' }
    expect(rollover(s, '2026-09-24')).toMatchObject({ current: 0, best: 5, freezes: 1 })
  })
})
