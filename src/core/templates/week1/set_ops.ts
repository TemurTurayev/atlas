import { setLatex } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { Problem, SolutionStep, SkillTemplate } from '../types'

const theory = [
  'A set is a collection of distinct elements; order does not matter.',
  '$A \\cup B$ (union) — elements that are in $A$ or in $B$.',
  '$A \\cap B$ (intersection) — elements that are in both $A$ and $B$.',
  '$A \\setminus B$ (difference) — elements of $A$ that are not in $B$.',
  '$A \\times B$ (Cartesian product) — all pairs $(a, b)$ where $a \\in A$ and $b \\in B$.',
  'The empty set is $\\emptyset$.',
].join('\n')

const HINTS = ['List the elements of each set and mark the ones needed according to the definition of the operation.', 'Order does not matter, and repeats are not written.']
const INPUT_HINT = 'Elements separated by commas, e.g. {1, 2, 3}. Empty set — none. Pairs: (1,2)'

type NumSet = readonly number[]

const sortNum = (xs: readonly number[]): number[] => [...xs].sort((a, b) => a - b)
const union = (a: NumSet, b: NumSet): number[] => sortNum([...new Set([...a, ...b])])
const intersect = (a: NumSet, b: NumSet): number[] => a.filter((x) => b.includes(x))
const difference = (a: NumSet, b: NumSet): number[] => a.filter((x) => !b.includes(x))
const randomSet = (rng: Rng, size: number, max = 9): number[] =>
  sortNum(rng.shuffle(Array.from({ length: max }, (_, i) => i + 1)).slice(0, size))

function build(given: string, target: string, result: readonly (number | string)[], solution: readonly SolutionStep[]): Problem {
  return {
    statement: `Let ${given.replace('{and}', 'and')}. Find $${target}$.`,
    answer: { kind: 'finiteSet', elements: result.map(String) },
    solution,
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

const givenTwo = (a: NumSet, b: NumSet): string => `$A = ${setLatex(a)}$ {and} $B = ${setLatex(b)}$`
const givenThree = (a: NumSet, b: NumSet, c: NumSet): string => `$A = ${setLatex(a)}$, $B = ${setLatex(b)}$, $C = ${setLatex(c)}$`

function tier1(rng: Rng): Problem {
  const a = randomSet(rng, rng.int(3, 5))
  const b = randomSet(rng, rng.int(3, 5))
  if (rng.chance(0.5)) {
    const r = union(a, b)
    return build(givenTwo(a, b), 'A \\cup B', r, [{ text: 'The union is all elements from $A$ and from $B$, with no repeats:', tex: `A \\cup B = ${setLatex(r)}` }])
  }
  const r = intersect(a, b)
  return build(givenTwo(a, b), 'A \\cap B', r, [{ text: 'The intersection is only the common elements:', tex: `A \\cap B = ${setLatex(r)}` }])
}

function tier2(rng: Rng): Problem {
  const a = randomSet(rng, rng.int(3, 5))
  const b = randomSet(rng, rng.int(3, 5))
  const c = randomSet(rng, rng.int(2, 4))
  switch (rng.int(0, 3)) {
    case 0: {
      const r = difference(a, b)
      return build(givenTwo(a, b), 'A \\setminus B', r, [{ text: 'Take the elements of $A$ and remove those that are in $B$:', tex: `A \\setminus B = ${setLatex(r)}` }])
    }
    case 1: {
      const r = difference(b, a)
      return build(givenTwo(a, b), 'B \\setminus A', r, [{ text: 'Take the elements of $B$ and remove those that are in $A$:', tex: `B \\setminus A = ${setLatex(r)}` }])
    }
    case 2: {
      const ab = union(a, b)
      const r = difference(ab, c)
      return build(givenThree(a, b, c), '(A \\cup B) \\setminus C', r, [
        { text: 'First, the parentheses:', tex: `A \\cup B = ${setLatex(ab)}` },
        { text: 'Now remove the elements of $C$:', tex: `(A \\cup B) \\setminus C = ${setLatex(r)}` },
      ])
    }
    default: {
      const bc = union(b, c)
      const r = intersect(a, bc)
      return build(givenThree(a, b, c), 'A \\cap (B \\cup C)', r, [
        { text: 'First, the parentheses:', tex: `B \\cup C = ${setLatex(bc)}` },
        { text: 'Now the common elements with $A$:', tex: `A \\cap (B \\cup C) = ${setLatex(r)}` },
      ])
    }
  }
}

function tier3(rng: Rng): Problem {
  const a = randomSet(rng, 2, 4)
  const b = randomSet(rng, rng.pick([2, 3]), 4)
  const pairs = a.flatMap((x) => b.map((y) => `(${x},${y})`))
  return build(givenTwo(a, b), 'A \\times B', pairs, [
    { text: 'Pair each element of $A$ with each element of $B$ (the first coordinate comes from $A$):', tex: `A \\times B = ${setLatex(pairs)}` },
    { text: `Total pairs: $${a.length} \\cdot ${b.length} = ${pairs.length}$.` },
  ])
}

export const template: SkillTemplate = {
  skillId: 'set_ops',
  theory,
  expectedSeconds: { 1: 40, 2: 70, 3: 90 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
