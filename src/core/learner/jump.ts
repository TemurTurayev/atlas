import type { SkillGraph } from '../graph/graph'

/** Unmastered candidate within `stride` ladder steps after the first unmastered skill that skips the most. */
export function pickJumpTarget(
  graph: SkillGraph,
  mastered: ReadonlySet<string>,
  stride: number,
  hasTemplate: (id: string) => boolean,
): string | null {
  const first = graph.ladder.findIndex((id) => !mastered.has(id))
  if (first < 0) return null
  let best: { readonly id: string; readonly score: number } | null = null
  const last = Math.min(first + stride, graph.ladder.length - 1)
  for (let i = first + 1; i <= last; i += 1) {
    const id = graph.ladder[i]
    if (mastered.has(id) || !hasTemplate(id)) continue
    const score = [...graph.ancestors(id)].filter((a) => !mastered.has(a)).length
    // A candidate must skip more than just the frontier skill itself to be worth a jump.
    if (score > 1 && (!best || score >= best.score)) best = { id, score }
  }
  return best?.id ?? null
}

/** Skills credited by a successful jump: the target plus its unmastered ancestors, in ladder order. */
export function jumpCredits(
  graph: SkillGraph,
  target: string,
  mastered: ReadonlySet<string>,
  hasTemplate: (id: string) => boolean,
): string[] {
  return [...graph.ancestors(target), target]
    .filter((id) => !mastered.has(id) && hasTemplate(id))
    .sort((a, b) => (graph.ladderIndex.get(a) ?? 0) - (graph.ladderIndex.get(b) ?? 0))
}
