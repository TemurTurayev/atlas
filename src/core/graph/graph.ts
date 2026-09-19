import type { SkillNode } from './nodes'

export interface SkillGraph {
  readonly nodes: ReadonlyMap<string, SkillNode>
  /** Topological order: week, then depth in the graph, then declaration order. */
  readonly ladder: readonly string[]
  readonly ladderIndex: ReadonlyMap<string, number>
  node(id: string): SkillNode
  /** All transitive prerequisites (excluding the node itself). */
  ancestors(id: string): ReadonlySet<string>
}

function validate(list: readonly SkillNode[], nodes: ReadonlyMap<string, SkillNode>): void {
  if (nodes.size !== list.length) throw new Error('Duplicate skill id in graph')
  for (const n of list) {
    for (const p of n.prereqs) {
      const prereq = nodes.get(p)
      if (!prereq) throw new Error(`Unknown prerequisite "${p}" of "${n.id}"`)
      if (prereq.week > n.week) throw new Error(`Prerequisite "${p}" of "${n.id}" is from a later week`)
    }
  }
}

function computeDepths(list: readonly SkillNode[], nodes: ReadonlyMap<string, SkillNode>): ReadonlyMap<string, number> {
  const depth = new Map<string, number>()
  const visiting = new Set<string>()
  const depthOf = (id: string): number => {
    const known = depth.get(id)
    if (known !== undefined) return known
    if (visiting.has(id)) throw new Error(`Cycle in skill graph at "${id}"`)
    visiting.add(id)
    const prereqs = nodes.get(id)?.prereqs ?? []
    const d = prereqs.length === 0 ? 0 : Math.max(...prereqs.map(depthOf)) + 1
    visiting.delete(id)
    depth.set(id, d)
    return d
  }
  list.forEach((n) => depthOf(n.id))
  return depth
}

export function buildGraph(list: readonly SkillNode[]): SkillGraph {
  const nodes: ReadonlyMap<string, SkillNode> = new Map(list.map((n) => [n.id, n]))
  validate(list, nodes)
  const depth = computeDepths(list, nodes)
  const order = new Map(list.map((n, i) => [n.id, i]))
  const ladder = [...list]
    .sort((a, b) => a.week - b.week || (depth.get(a.id) ?? 0) - (depth.get(b.id) ?? 0) || (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((n) => n.id)
  const ladderIndex: ReadonlyMap<string, number> = new Map(ladder.map((id, i) => [id, i]))

  const node = (id: string): SkillNode => {
    const found = nodes.get(id)
    if (!found) throw new Error(`Unknown skill "${id}"`)
    return found
  }

  const cache = new Map<string, ReadonlySet<string>>()
  const ancestors = (id: string): ReadonlySet<string> => {
    const cached = cache.get(id)
    if (cached) return cached
    const out = new Set<string>()
    for (const p of node(id).prereqs) {
      out.add(p)
      ancestors(p).forEach((a) => out.add(a))
    }
    cache.set(id, out)
    return out
  }

  return { nodes, ladder, ladderIndex, node, ancestors }
}
