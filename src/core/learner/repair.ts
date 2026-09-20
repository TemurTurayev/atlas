import type { SkillGraph } from '../graph/graph'
import { retrievability } from '../scheduler/fsrs'
import type { SkillProgress } from './progress'

/** Direct mastered prerequisites to re-check: implicit ones first, then the weakest by recall. */
export function repairCandidates(
  graph: SkillGraph,
  skillId: string,
  progress: Readonly<Record<string, SkillProgress>>,
  now: Date,
  limit = 2,
): string[] {
  return graph
    .node(skillId)
    .prereqs.flatMap((id) => {
      const p = progress[id]
      return p && p.phase === 'mastered' ? [{ id, implicit: p.implicit, r: p.card ? retrievability(p.card, now) : 0 }] : []
    })
    .sort((a, b) => Number(b.implicit) - Number(a.implicit) || a.r - b.r)
    .slice(0, limit)
    .map((c) => c.id)
}
