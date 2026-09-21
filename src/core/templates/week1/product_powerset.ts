import { setLatex } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'The power set $P(A)$ is the set of all subsets of $A$, including $\\emptyset$ and $A$ itself.',
  'If $|A| = n$, then $|P(A)| = 2^n$ — each element either belongs to a subset or does not.',
  'The Cartesian product $A \\times B$ is the set of all pairs $(a, b)$, $a \\in A$, $b \\in B$; $|A \\times B| = |A| \\cdot |B|$.',
  'Elements of $P(A)$ are sets, not elements of $A$ themselves: for example $\\{1\\} \\in P(\\{1,2\\})$, but $1 \\notin P(\\{1,2\\})$.',
  'Common mistake: confusing an element $a \\in A$ with the singleton subset $\\{a\\} \\in P(A)$.',
].join('\n')

function randomDistinctPair(rng: Rng, max: number): readonly [number, number] {
  const a = rng.int(1, max)
  const b = rng.intExcept(1, max, [a])
  return a < b ? [a, b] : [b, a]
}

function tier1(rng: Rng): Problem {
  const n = rng.int(2, 6)
  return {
    statement: `Let $|A| = ${n}$. Find $|P(A)|$, the number of subsets of $A$.`,
    answer: { kind: 'number', value: String(2 ** n) },
    solution: [
      { text: `Each of the $${n}$ elements independently either belongs to a subset or does not: $2^{${n}}$ possibilities.` },
      { text: 'So:', tex: `|P(A)| = 2^{${n}} = ${2 ** n}` },
    ],
    hints: ['For each element there are 2 choices: include it or not.', `Multiply $${n}$ twos together: $2^{${n}}$.`],
    inputHint: 'Enter an integer',
  }
}

function tier2(rng: Rng): Problem {
  const [a, b] = randomDistinctPair(rng, 6)
  const setText = setLatex([a, b])
  const correctLabels: readonly ChoiceOption[] = [
    { id: 'empty', label: '$\\emptyset$' },
    { id: 'a', label: `$\\{${a}\\}$` },
    { id: 'b', label: `$\\{${b}\\}$` },
    { id: 'both', label: `$\\{${a}, ${b}\\}$` },
  ]
  const c = rng.intExcept(1, 9, [a, b])
  const wrongCandidates: readonly ChoiceOption[] = [
    { id: 'bare-a', label: `$${a}$` },
    { id: 'bare-b', label: `$${b}$` },
    { id: 'outside', label: `$\\{${a}, ${c}\\}$` },
    { id: 'pair', label: `$(${a}, ${b})$` },
  ]
  const wrong = rng.pick(wrongCandidates)
  const kept = rng.shuffle(correctLabels).slice(0, 3)
  const options = rng.shuffle([wrong, ...kept])
  return {
    statement: `Let $A = ${setText}$. Which of the following is NOT an element of $P(A)$?`,
    answer: { kind: 'choice', options, correctId: wrong.id },
    solution: [
      { text: 'The elements of $P(A)$ are all the subsets of $A$:', tex: `P(A) = \\{\\emptyset, \\{${a}\\}, \\{${b}\\}, \\{${a}, ${b}\\}\\}` },
      { text: 'Elements of a power set are sets, not individual numbers or ordered pairs.' },
    ],
    hints: ['List all 4 subsets of $A$: the empty set, two singletons, and $A$ itself.', 'An element of a power set is always written in curly braces — it is a set.'],
  }
}

function tier3(rng: Rng): Problem {
  const askPowerset = rng.chance(0.4)
  const [sizeA, sizeB] = askPowerset ? [rng.int(2, 3), rng.int(2, 3)] : [rng.int(2, 6), rng.int(2, 5)]
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const setA = rng.shuffle(pool).slice(0, sizeA).sort((x, y) => x - y)
  const setB = rng.shuffle(pool.filter((n) => !setA.includes(n)))
    .slice(0, sizeB)
    .sort((x, y) => x - y)
  const product = setA.length * setB.length
  const target = askPowerset ? 'P(A \\times B)' : 'A \\times B'
  const answerValue = askPowerset ? 2 ** product : product
  const solution = askPowerset
    ? [
        { text: `First, the size of the product: $|A \\times B| = ${setA.length} \\cdot ${setB.length} = ${product}$.` },
        { text: 'A power set of a set with $n$ elements has $2^n$ elements:', tex: `|P(A \\times B)| = 2^{${product}} = ${answerValue}` },
      ]
    : [{ text: `Each element of $A$ pairs with each element of $B$:`, tex: `|A \\times B| = |A| \\cdot |B| = ${setA.length} \\cdot ${setB.length} = ${product}` }]
  return {
    statement: `Let $A = ${setLatex(setA)}$ and $B = ${setLatex(setB)}$. Find $|${target}|$.`,
    answer: { kind: 'number', value: String(answerValue) },
    solution,
    hints: askPowerset
      ? ['First find $|A \\times B|$ — that is $|A| \\cdot |B|$.', 'Then raise 2 to the power equal to that number.']
      : ['The number of pairs in the Cartesian product equals $|A| \\cdot |B|$.'],
    inputHint: 'Enter an integer',
  }
}

export const template: SkillTemplate = {
  skillId: 'product_powerset',
  theory,
  expectedSeconds: { 1: 35, 2: 70, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
