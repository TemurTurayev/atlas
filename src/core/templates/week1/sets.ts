import { setLatex } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'A set is a collection of distinct elements; order does not matter, and repeats are not counted.',
  'The number sets are nested: $\\mathbb{N} \\subset \\mathbb{Z} \\subset \\mathbb{Q} \\subset \\mathbb{R}$.',
  '$\\mathbb{N} = \\{0, 1, 2, \\ldots\\}$ is the natural numbers, $\\mathbb{Z}$ the integers, $\\mathbb{Q}$ fractions of the form $\\frac{a}{b}$ with integer $a, b$, and $\\mathbb{R}$ all real numbers.',
  'Irrational numbers ($\\sqrt{2}$, $\\pi$) lie in $\\mathbb{R}$, but not in $\\mathbb{Q}$.',
  'Distinguish the symbols: $\\in$ means "the element belongs to the set", $\\subseteq$ means "one set lies inside another".',
  'Common mistake: writing $\\{2\\} \\in A$ instead of $\\{2\\} \\subseteq A$ — the curly braces turn an element into a set.',
].join('\n')

const HINTS = [
  'Start with the narrowest set: natural numbers → integers → rationals → reals.',
  'Check whether the number can be written as a fraction of integers. If not, it is only in $\\mathbb{R}$.',
]

const SET_OPTIONS: readonly ChoiceOption[] = [
  { id: 'N', label: '$\\mathbb{N}$ — natural numbers' },
  { id: 'Z', label: '$\\mathbb{Z}$ — integers' },
  { id: 'Q', label: '$\\mathbb{Q}$ — rationals' },
  { id: 'R', label: '$\\mathbb{R}$ — reals' },
]

interface Sample {
  readonly latex: string
  readonly set: string
  readonly why: string
}

function sampleTier1(rng: Rng): Sample {
  const mode = rng.int(1, 4)
  if (mode === 1) {
    // Natural
    if (rng.chance(0.5)) {
      const n = rng.int(1, 30)
      return { latex: String(n), set: 'N', why: 'a positive integer' }
    }
    const k = rng.int(2, 10)
    return { latex: `\\sqrt{${k * k}}`, set: 'N', why: `$\\sqrt{${k * k}}=${k}$ is natural` }
  }
  if (mode === 2) {
    // Integer (not natural)
    if (rng.chance(0.5)) {
      const n = rng.int(-30, -1)
      return { latex: String(n), set: 'Z', why: 'an integer, but negative' }
    }
    const a = rng.int(2, 10)
    const b = rng.int(2, 6)
    return { latex: `\\frac{-${a * b}}{${b}}`, set: 'Z', why: `$\\frac{-${a * b}}{${b}}=-${a}$ is an integer` }
  }
  if (mode === 3) {
    // Rational (not integer)
    if (rng.chance(0.5)) {
      const b = rng.int(2, 9)
      const a = rng.intExcept(1, 3 * b, Array.from({ length: 4 }, (_, i) => i * b))
      const sign = rng.chance(0.5) ? '' : '-'
      return { latex: `${sign}\\frac{${a}}{${b}}`, set: 'Q', why: 'a fraction of integers, but not an integer' }
    }
    const dec = rng.pick(['0.25', '0.5', '0.75', '0.2', '0.4', '0.6', '0.8', '-0.5', '-0.25', '1.25'])
    return { latex: dec, set: 'Q', why: 'a terminating decimal, which is a fraction of integers' }
  }
  // Real (irrational)
  if (rng.chance(0.4)) {
    const NON_SQUARES = [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24]
    const k = rng.pick(NON_SQUARES)
    return { latex: `\\sqrt{${k}}`, set: 'R', why: 'irrational: it cannot be written as a fraction of integers' }
  }
  const symbol = rng.pick(['\\pi', 'e', '\\sqrt{2}+1', '\\sqrt{3}', '\\pi/2', '\\sqrt{5}'])
  return { latex: symbol, set: 'R', why: 'irrational' }
}

function tier1(rng: Rng): Problem {
  const sample = sampleTier1(rng)
  return {
    statement: `What is the smallest of the sets $\\mathbb{N}, \\mathbb{Z}, \\mathbb{Q}, \\mathbb{R}$ that contains $${sample.latex}$?`,
    answer: { kind: 'choice', options: SET_OPTIONS, correctId: sample.set },
    solution: [{ text: `The number $${sample.latex}$ is ${sample.why}.` }],
    hints: HINTS,
  }
}

function tier2(rng: Rng): Problem {
  const elements = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 3).sort((a, b) => a - b)
  const inside = rng.pick(elements)
  const outside = rng.intExcept(1, 12, elements)
  const set = setLatex(elements)
  const falseOptions: readonly ChoiceOption[] = [
    { id: 'wrong-member', label: `$${outside} \\in ${set}$` },
    { id: 'wrong-braces', label: `$\\{${inside}\\} \\in ${set}$` },
    { id: 'wrong-subset', label: `$\\{${outside}\\} \\subseteq ${set}$` },
  ]
  const wrong = rng.pick(falseOptions)
  const options = rng.shuffle([
    wrong,
    { id: 'member', label: `$${inside} \\in ${set}$` },
    { id: 'subset', label: `$\\{${inside}\\} \\subseteq ${set}$` },
    { id: 'empty', label: `$\\emptyset \\subseteq ${set}$` },
  ])
  return {
    statement: `Let $A = ${set}$. Which statement is false?`,
    answer: { kind: 'choice', options, correctId: wrong.id },
    solution: [
      { text: `The elements of $A$ are ${elements.join(', ')}; so $${inside} \\in A$, and $${outside} \\notin A$.` },
      { text: 'The notation $\\{a\\}$ is a set with one element: it can be a subset ($\\subseteq$), but not an element ($\\in$).' },
    ],
    hints: ['List the elements of the set and check each statement in turn.', 'Remember the difference: $2 \\in A$, but $\\{2\\} \\subseteq A$.'],
  }
}

function tier3(rng: Rng): Problem {
  const low = rng.int(-8, 2)
  const high = rng.int(low + 2, low + 6)
  const correct = Array.from({ length: high - low }, (_, i) => low + i)
  const options = rng.shuffle<ChoiceOption>([
    { id: 'correct', label: `$${setLatex(correct)}$` },
    { id: 'with-high', label: `$${setLatex([...correct, high])}$` },
    { id: 'without-low', label: `$${setLatex(correct.slice(1))}$` },
    { id: 'shifted', label: `$${setLatex(correct.map((n) => n + 1))}$` },
  ])
  const condition = `\\{n \\in \\mathbb{Z} : ${low} \\le n < ${high}\\}`
  return {
    statement: `Which set is $${condition}$?`,
    answer: { kind: 'choice', options, correctId: 'correct' },
    solution: [
      { text: `The condition $${low} \\le n$ includes $${low}$, while $n < ${high}$ excludes $${high}$.` },
      { text: 'So the set equals:', tex: setLatex(correct) },
    ],
    hints: [
      'The strict sign $<$ excludes the endpoint; the non-strict $\\le$ includes it.',
      `List the integers in order starting from $${low}$ and stop before reaching $${high}$.`,
    ],
  }
}

export const template: SkillTemplate = {
  skillId: 'sets',
  theory,
  expectedSeconds: { 1: 35, 2: 60, 3: 80 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
