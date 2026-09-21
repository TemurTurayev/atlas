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

const SAMPLES: readonly Sample[] = [
  { latex: '7', set: 'N', why: 'an integer and nonnegative' },
  { latex: '\\sqrt{9}', set: 'N', why: '$\\sqrt{9}=3$ is natural' },
  { latex: '-4', set: 'Z', why: 'an integer, but negative' },
  { latex: '\\frac{-10}{5}', set: 'Z', why: '$\\frac{-10}{5}=-2$ is an integer' },
  { latex: '\\frac{3}{4}', set: 'Q', why: 'a fraction of integers, but not an integer' },
  { latex: '0.25', set: 'Q', why: '$0.25=\\frac{1}{4}$ is a fraction of integers' },
  { latex: '-\\frac{7}{3}', set: 'Q', why: 'a fraction of integers' },
  { latex: '\\sqrt{2}', set: 'R', why: 'irrational: it cannot be written as a fraction of integers' },
  { latex: '\\pi', set: 'R', why: 'irrational' },
  { latex: '\\sqrt{7}', set: 'R', why: 'irrational' },
]

function tier1(rng: Rng): Problem {
  const sample = rng.pick(SAMPLES)
  return {
    statement: `What is the smallest of the sets $\\mathbb{N}, \\mathbb{Z}, \\mathbb{Q}, \\mathbb{R}$ that contains $${sample.latex}$?`,
    answer: { kind: 'choice', options: SET_OPTIONS, correctId: sample.set },
    solution: [{ text: `The number $${sample.latex}$ is ${sample.why}.` }],
    hints: HINTS,
  }
}

function tier2(rng: Rng): Problem {
  const elements = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 3).sort((a, b) => a - b)
  const inside = rng.pick(elements)
  const outside = rng.intExcept(1, 9, elements)
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
  const low = rng.int(-4, 0)
  const high = rng.int(low + 2, low + 5)
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
