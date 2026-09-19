import { buildGraph } from './graph'
import { NODES } from './nodes'

export const GRAPH = buildGraph(NODES)
export type { SkillGraph } from './graph'
export type { SkillNode } from './nodes'
export { EXAM_WEEKS } from './nodes'
