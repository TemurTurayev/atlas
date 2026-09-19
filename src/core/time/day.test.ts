import { describe, expect, it } from 'vitest'
import { addDays, dayKey, daysBetween, endOfDay } from './day'

describe('day keys', () => {
  it('formats the local day with zero padding', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })

  it('counts whole days between keys across month and year boundaries', () => {
    expect(daysBetween('2026-09-19', '2026-09-20')).toBe(1)
    expect(daysBetween('2026-12-31', '2027-01-02')).toBe(2)
    expect(daysBetween('2026-09-20', '2026-09-19')).toBe(-1)
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
  })

  it('adds days to a key', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
  })

  it('returns the last millisecond of the local day', () => {
    const end = endOfDay(new Date(2026, 8, 19, 8, 0))
    expect([end.getDate(), end.getHours(), end.getMinutes(), end.getMilliseconds()]).toEqual([19, 23, 59, 999])
  })
})
