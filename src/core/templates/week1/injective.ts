import { linear } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'An injective function (one-to-one): different $x$ values map to different $y$ values, that is, $f(x_1) = f(x_2)$ implies $x_1 = x_2$.',
  'Graphical test: any horizontal line crosses the graph at most once.',
  'Even powers and the absolute value ($x^2$, $|x|$) are not injective on $\\mathbb{R}$ — for example $f(-2) = f(2)$.',
  'Strictly monotonic functions (linear functions with $a \\ne 0$, odd powers such as $x^3$) are injective on $\\mathbb{R}$.',
  'A bijection is both injective and surjective at once; the function must be defined on all of $\\mathbb{R}$.',
  'Common mistake: confusing "each $x$ has one value of $y$" (this is just the definition of a function) with "each $y$ has at most one $x$" (this is injectivity).',
].join('\n')

const HINTS = ['Check whether the graph is symmetric about a vertical line — that indicates repeated values.', 'A strictly increasing or strictly decreasing function on $\\mathbb{R}$ is always injective.']

const cubeLabel = (a: number, c: number): string => `${a === 1 ? '' : a === -1 ? '-' : a}x^{3}${c === 0 ? '' : c > 0 ? `+${c}` : c}`
const quadLabel = (h: number, k: number): string => `\\left(${linear(1, -h)}\\right)^{2}${k === 0 ? '' : k > 0 ? `+${k}` : k}`
const absLabel = (h: number, k: number): string => `\\left|${linear(1, -h)}\\right|${k === 0 ? '' : k > 0 ? `+${k}` : k}`
const quarticLabel = (h: number, k: number): string => `\\left(${linear(1, -h)}\\right)^{4}${k === 0 ? '' : k > 0 ? `+${k}` : k}`

function injectiveCandidate(rng: Rng): { readonly label: string; readonly explanation: string } {
  if (rng.chance(0.5)) {
    const a = rng.pick([-3, -2, -1, 1, 2, 3])
    const b = rng.int(-5, 5)
    return { label: `$${linear(a, b)}$`, explanation: `the linear function $${linear(a, b)}$ is strictly monotonic (coefficient $${a} \\ne 0$)` }
  }
  const a = rng.pick([-2, -1, 1, 2])
  const c = rng.int(-5, 5)
  return { label: `$${cubeLabel(a, c)}$`, explanation: `the odd power $${cubeLabel(a, c)}$ is strictly monotonic on the whole real line` }
}

function nonInjectiveCandidates(rng: Rng, count: number): readonly { readonly label: string; readonly explanation: string }[] {
  const shifts = rng.shuffle([-4, -3, -2, -1, 0, 1, 2, 3, 4]).slice(0, count)
  const kinds: readonly ((h: number, k: number) => string)[] = [quadLabel, absLabel, quarticLabel]
  return shifts.map((h, i) => {
    const k = rng.int(-4, 4)
    const kind = kinds[i % kinds.length]
    const label = kind(h, k)
    return { label: `$${label}$`, explanation: `$${label}$ takes the same value on both sides of $x = ${h}$` }
  })
}

function buildChoice(rng: Rng, statement: string, distractorCount: number, correct: { readonly label: string; readonly explanation: string }): Problem {
  const wrong = nonInjectiveCandidates(rng, distractorCount)
  const options: readonly ChoiceOption[] = rng.shuffle([
    { id: 'correct', label: correct.label },
    ...wrong.map((w, i) => ({ id: `wrong-${i}`, label: w.label })),
  ])
  return {
    statement,
    answer: { kind: 'choice', options, correctId: 'correct' },
    solution: [
      { text: `Correct answer: ${correct.explanation}.` },
      { text: `The other options are not injective: ${wrong.map((w) => w.explanation).join('; ')}.` },
    ],
    hints: HINTS,
  }
}

function tier1(rng: Rng): Problem {
  const correct = injectiveCandidate(rng)
  const en = 'Which of the following functions is injective (one-to-one) on $\\mathbb{R}$?'
  return buildChoice(rng, en, 3, correct)
}

function tier2(rng: Rng): Problem {
  const correct = injectiveCandidate(rng)
  const formula = correct.label.replace(/\$/g, '')
  const en = `Is $f(x) = ${formula}$ injective on $\\mathbb{R}$? Choose the option below that matches this function.`
  return buildChoice(rng, en, 3, correct)
}

function tier3(rng: Rng): Problem {
  const correct = injectiveCandidate(rng)
  const reciprocalShift = rng.int(-4, 4)
  const question = 'Which of the following functions is a bijection $\\mathbb{R} \\to \\mathbb{R}$?'
  const wrong = nonInjectiveCandidates(rng, 2)
  const reciprocal = {
    label: `$\\dfrac{1}{${linear(1, -reciprocalShift)}}$`,
    explanation: `$\\dfrac{1}{${linear(1, -reciprocalShift)}}$ is undefined at $x = ${reciprocalShift}$, so it is not a function on all of $\\mathbb{R}$`,
  }
  const options: readonly ChoiceOption[] = rng.shuffle([
    { id: 'correct', label: correct.label },
    { id: 'wrong-0', label: wrong[0].label },
    { id: 'wrong-1', label: wrong[1].label },
    { id: 'wrong-2', label: reciprocal.label },
  ])
  return {
    statement: question,
    answer: { kind: 'choice', options, correctId: 'correct' },
    solution: [
      { text: `Correct answer: ${correct.explanation}, and on all of $\\mathbb{R}$ such a function is also surjective.` },
      { text: `The others do not qualify: ${wrong.map((w) => w.explanation).join('; ')}; ${reciprocal.explanation}.` },
    ],
    hints: [...HINTS, 'Check that the function is defined for every $x \\in \\mathbb{R}$ — otherwise it is not a function $\\mathbb{R} \\to \\mathbb{R}$.'],
  }
}

export const template: SkillTemplate = {
  skillId: 'injective',
  theory,
  expectedSeconds: { 1: 40, 2: 70, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
