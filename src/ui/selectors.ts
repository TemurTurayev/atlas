import { GRAPH } from '../core/graph'
import { isDue } from '../core/scheduler/fsrs'
import type { World } from '../core/session/world'
import { hasTemplate } from '../core/templates/registry'

export type SkillStatus = 'mastered' | 'learning' | 'available' | 'locked' | 'soon'

const masteredIds = (world: World): Set<string> =>
  new Set(Object.values(world.progress).filter((p) => p.phase === 'mastered').map((p) => p.skillId))

/** Skills that can be started right now, in ladder order. */
export function frontier(world: World, limit = 3): string[] {
  const mastered = masteredIds(world)
  return GRAPH.ladder
    .filter((id) => !world.progress[id] && hasTemplate(id) && GRAPH.node(id).prereqs.every((p) => mastered.has(p)))
    .slice(0, limit)
}

/** Every skill the app can teach today. */
export const taughtCount = (): number => GRAPH.ladder.filter((id) => hasTemplate(id)).length

/** Mastered skills that can actually be asked about. */
export function masteredCount(world: World): number {
  return Object.values(world.progress).filter((p) => p.phase === 'mastered' && hasTemplate(p.skillId)).length
}

export function dueCount(world: World, now: Date): number {
  return Object.values(world.progress).filter((p) => p.phase === 'mastered' && p.card && hasTemplate(p.skillId) && isDue(p.card, now)).length
}

export function skillStatus(world: World, skillId: string): SkillStatus {
  const p = world.progress[skillId]
  if (p?.phase === 'mastered') return 'mastered'
  if (p) return 'learning'
  if (!hasTemplate(skillId)) return 'soon'
  const mastered = masteredIds(world)
  return GRAPH.node(skillId).prereqs.every((id) => mastered.has(id)) ? 'available' : 'locked'
}
