import { setLatex } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { Problem, SolutionStep, SkillTemplate } from '../types'

const theory = [
  'Множество (set) — набор различных элементов; порядок не важен.',
  '$A \\cup B$ (union) — элементы, которые есть в $A$ или в $B$.',
  '$A \\cap B$ (intersection) — элементы, которые есть и в $A$, и в $B$.',
  '$A \\setminus B$ (difference) — элементы $A$, которых нет в $B$.',
  '$A \\times B$ (Cartesian product) — все пары $(a, b)$, где $a \\in A$ и $b \\in B$.',
  'Пустое множество — $\\emptyset$.',
].join('\n')

const HINTS = ['Выпиши элементы каждого множества и отмечай нужные по определению операции.', 'Порядок элементов не важен, повторы не пишутся.']
const INPUT_HINT = 'Элементы через запятую, например {1, 2, 3}. Пустое множество — none. Пары: (1,2)'

type NumSet = readonly number[]

const sortNum = (xs: readonly number[]): number[] => [...xs].sort((a, b) => a - b)
const union = (a: NumSet, b: NumSet): number[] => sortNum([...new Set([...a, ...b])])
const intersect = (a: NumSet, b: NumSet): number[] => a.filter((x) => b.includes(x))
const difference = (a: NumSet, b: NumSet): number[] => a.filter((x) => !b.includes(x))
const randomSet = (rng: Rng, size: number, max = 9): number[] =>
  sortNum(rng.shuffle(Array.from({ length: max }, (_, i) => i + 1)).slice(0, size))

function build(given: string, target: string, result: readonly (number | string)[], solution: readonly SolutionStep[]): Problem {
  return {
    statement: { en: `Let ${given.replace('{and}', 'and')}. Find $${target}$.`, ru: `Пусть ${given.replace('{and}', 'и')}. Найди $${target}$.` },
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
    return build(givenTwo(a, b), 'A \\cup B', r, [{ ru: 'Объединение — все элементы из $A$ и из $B$ без повторов:', tex: `A \\cup B = ${setLatex(r)}` }])
  }
  const r = intersect(a, b)
  return build(givenTwo(a, b), 'A \\cap B', r, [{ ru: 'Пересечение — только общие элементы:', tex: `A \\cap B = ${setLatex(r)}` }])
}

function tier2(rng: Rng): Problem {
  const a = randomSet(rng, rng.int(3, 5))
  const b = randomSet(rng, rng.int(3, 5))
  const c = randomSet(rng, rng.int(2, 4))
  switch (rng.int(0, 3)) {
    case 0: {
      const r = difference(a, b)
      return build(givenTwo(a, b), 'A \\setminus B', r, [{ ru: 'Берём элементы $A$ и вычёркиваем те, что есть в $B$:', tex: `A \\setminus B = ${setLatex(r)}` }])
    }
    case 1: {
      const r = difference(b, a)
      return build(givenTwo(a, b), 'B \\setminus A', r, [{ ru: 'Берём элементы $B$ и вычёркиваем те, что есть в $A$:', tex: `B \\setminus A = ${setLatex(r)}` }])
    }
    case 2: {
      const ab = union(a, b)
      const r = difference(ab, c)
      return build(givenThree(a, b, c), '(A \\cup B) \\setminus C', r, [
        { ru: 'Сначала скобка:', tex: `A \\cup B = ${setLatex(ab)}` },
        { ru: 'Теперь вычёркиваем элементы $C$:', tex: `(A \\cup B) \\setminus C = ${setLatex(r)}` },
      ])
    }
    default: {
      const bc = union(b, c)
      const r = intersect(a, bc)
      return build(givenThree(a, b, c), 'A \\cap (B \\cup C)', r, [
        { ru: 'Сначала скобка:', tex: `B \\cup C = ${setLatex(bc)}` },
        { ru: 'Теперь общие элементы с $A$:', tex: `A \\cap (B \\cup C) = ${setLatex(r)}` },
      ])
    }
  }
}

function tier3(rng: Rng): Problem {
  const a = randomSet(rng, 2, 4)
  const b = randomSet(rng, rng.pick([2, 3]), 4)
  const pairs = a.flatMap((x) => b.map((y) => `(${x},${y})`))
  return build(givenTwo(a, b), 'A \\times B', pairs, [
    { ru: 'Каждый элемент $A$ ставим в пару с каждым элементом $B$ (первым — из $A$):', tex: `A \\times B = ${setLatex(pairs)}` },
    { ru: `Всего пар: $${a.length} \\cdot ${b.length} = ${pairs.length}$.` },
  ])
}

export const template: SkillTemplate = {
  skillId: 'set_ops',
  theory,
  expectedSeconds: { 1: 40, 2: 70, 3: 90 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
