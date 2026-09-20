import { describe, expect, it } from 'vitest'
import { gradeFor, isDue, maxIntervalFor, newCard, retrievability, reviewCard, reviewedToday } from './fsrs'

const NOW = new Date(2026, 8, 20, 10, 0)
const daysLater = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)

describe('fsrs wrapper', () => {
  it('caps intervals at 21 days and at a third of the time left', () => {
    expect(maxIntervalFor(130)).toBe(21)
    expect(maxIntervalFor(30)).toBe(10)
    expect(maxIntervalFor(0)).toBe(1)
  })

  it('creates a fresh Good card a few days out, fully recalled now', () => {
    const card = newCard('good', NOW, 130)
    expect(card.scheduled_days).toBeGreaterThanOrEqual(2)
    expect(card.scheduled_days).toBeLessThanOrEqual(4)
    expect(retrievability(card, NOW)).toBeCloseTo(1, 2)
    expect(isDue(card, NOW)).toBe(false)
    expect(isDue(card, card.due)).toBe(true)
    expect(reviewedToday(card, NOW)).toBe(true)
    expect(reviewedToday(card, daysLater(NOW, 1))).toBe(false)
  })

  it('orders first intervals hard < good < easy', () => {
    const [hard, good, easy] = (['hard', 'good', 'easy'] as const).map((g) => newCard(g, NOW, 130).scheduled_days)
    expect(hard).toBeLessThan(good)
    expect(good).toBeLessThan(easy)
  })

  it('decays retrievability over time', () => {
    const card = newCard('good', NOW, 130)
    expect(retrievability(card, daysLater(NOW, 10))).toBeLessThan(0.9)
  })

  it('records lapses on Again and respects the cap', () => {
    const card = newCard('good', NOW, 130)
    expect(reviewCard(card, 'again', card.due, 130).lapses).toBe(1)
    expect(newCard('easy', NOW, 9).scheduled_days).toBeLessThanOrEqual(maxIntervalFor(9) + 1)
  })

  it('grades attempts', () => {
    expect(gradeFor({ correct: false, hintsUsed: 0, seconds: 10 }, 60)).toBe('again')
    expect(gradeFor({ correct: true, hintsUsed: 1, seconds: 10 }, 60)).toBe('hard')
    expect(gradeFor({ correct: true, hintsUsed: 0, seconds: 30 }, 60)).toBe('easy')
    expect(gradeFor({ correct: true, hintsUsed: 0, seconds: 50 }, 60)).toBe('good')
  })
})
