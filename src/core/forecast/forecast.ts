import { EXAM_WEEKS, type SkillGraph } from '../graph'
import type { SkillProgress } from '../learner/progress'
import { retrievability } from '../scheduler/fsrs'

export interface Forecast {
  /** Predicted share of exam content recalled, 0–1 (pass mark 0.45). */
  readonly exam: number
  /** Recall-weighted share of week-0 foundations, 0–1. */
  readonly base: number
  readonly perWeek: Readonly<Record<number, number>>
}

function recall(p: SkillProgress | undefined, now: Date): number {
  if (!p || p.phase !== 'mastered') return 0
  return p.card ? retrievability(p.card, now) : 1
}

function weekScore(
  graph: SkillGraph,
  progress: Readonly<Record<string, SkillProgress>>,
  week: number,
  now: Date,
  weighHighYield: boolean,
): number {
  const nodes = [...graph.nodes.values()].filter((n) => n.week === week)
  if (nodes.length === 0) return 0
  const weight = (highYield: boolean): number => (weighHighYield && highYield ? 2 : 1)
  const total = nodes.reduce((sum, n) => sum + weight(n.highYield), 0)
  return nodes.reduce((sum, n) => sum + weight(n.highYield) * recall(progress[n.id], now), 0) / total
}

export function computeForecast(graph: SkillGraph, progress: Readonly<Record<string, SkillProgress>>, now: Date): Forecast {
  const perWeek = Object.fromEntries(EXAM_WEEKS.map((w) => [w, weekScore(graph, progress, w, now, true)]))
  const exam = EXAM_WEEKS.reduce((sum, w) => sum + perWeek[w], 0) / EXAM_WEEKS.length
  return { exam, base: weekScore(graph, progress, 0, now, false), perWeek }
}
