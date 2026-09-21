import { joinTerms, linear } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'Vertex form of a parabola: $y=(x-h)^2+k$ — the vertex is at the point $(h,k)$.',
  'Factored form: $y=a(x-r_1)(x-r_2)$ — the x-intercepts are at $x=r_1$ and $x=r_2$.',
  'The sign of the coefficient $a$ determines the direction the parabola opens: $a>0$ upward, $a<0$ downward.',
  'To find the zeros, solve $y=0$: a product is zero when one of its factors is zero.',
  'Common mistake: mixing up the sign of $h$ inside the bracket $(x-h)$ — the vertex is shifted in the direction opposite to the sign inside the bracket.',
].join('\n')

function factorBracket(r: number): string {
  return `\\left(${linear(1, -r)}\\right)`
}

function coefPrefixOf(a: number): string {
  return a === 1 ? '' : a === -1 ? '-' : String(a)
}

function tier1(rng: Rng): Problem {
  const h = rng.int(-6, 6)
  const k = rng.int(-8, 8)
  const eq = joinTerms([`\\left(${linear(1, -h)}\\right)^2`, String(k)])
  return {
    statement: `Find the vertex of the parabola $y = ${eq}$.`,
    answer: { kind: 'finiteSet', elements: [`(${h},${k})`] },
    solution: [
      { text: 'A parabola in vertex form $y=(x-h)^2+k$ has vertex $(h,k)$:', tex: `h=${h}, \\quad k=${k}` },
      { text: 'Vertex:', tex: `(${h}, ${k})` },
    ],
    hints: ['Compare the equation with the vertex form $y=(x-h)^2+k$.', 'The vertex of the parabola is the point $(h, k)$.'],
    inputHint: 'The answer is a pair (x, y), e.g. (2,-3)',
  }
}

function tier2(rng: Rng): Problem {
  const a = rng.pick([1, 1, 1, 2, -1, 3])
  const aPrefix = coefPrefixOf(a)
  if (rng.chance(0.75)) {
    const r1 = rng.int(-7, 7)
    const r2 = rng.intExcept(-7, 7, [r1])
    const [lo, hi] = r1 < r2 ? [r1, r2] : [r2, r1]
    const eq = `${aPrefix}${factorBracket(r1)}${factorBracket(r2)}`
    return {
      statement: `Find the x-intercepts of the parabola $y = ${eq}$.`,
      answer: { kind: 'numberSet', values: [String(lo), String(hi)] },
      solution: [
        { text: 'On the x-axis, $y=0$:', tex: `${eq} = 0` },
        { text: 'A product is zero when one of its factors is zero:', tex: `x = ${r1}, \\quad x = ${r2}` },
      ],
      hints: ['The x-intercepts are the points where $y=0$.', 'A product is zero when at least one factor is zero.'],
      inputHint: 'List the roots separated by commas, e.g. -2, 3',
    }
  }
  const r = rng.intExcept(-7, 7, [0])
  const eq = `${aPrefix}${factorBracket(r)}^2`
  return {
    statement: `Find the x-intercepts of the parabola $y = ${eq}$.`,
    answer: { kind: 'numberSet', values: [String(r)] },
    solution: [
      { text: 'On the x-axis, $y=0$:', tex: `${eq} = 0` },
      { text: 'The factor repeats twice — there is one (double) root:', tex: `x = ${r}` },
    ],
    hints: ['The x-intercepts are the points where $y=0$.', 'Here the factor repeats twice — there is only one root.'],
    inputHint: 'If there is only one root, enter just that: e.g. 3',
  }
}

function describeParabola(a: number, h: number, k: number): string {
  const dir = a > 0 ? 'upward' : 'downward'
  return `Opens ${dir}; vertex $(${h}, ${k})$`
}

function tier3(rng: Rng): Problem {
  const a = rng.pick([1, 2, -1, -2])
  const h = rng.int(-5, 5)
  const k = rng.int(-6, 6)
  const bracket = `\\left(${linear(1, -h)}\\right)^2`
  const aTerm = a === 1 ? bracket : a === -1 ? `-${bracket}` : `${a}${bracket}`
  const eq = joinTerms([aTerm, String(k)])
  const flip = (n: number): number => (n === 0 ? n + 1 : -n)
  const options: ChoiceOption[] = rng.shuffle([
    { id: 'correct', label: describeParabola(a, h, k) },
    { id: 'flip-dir', label: describeParabola(flip(a), h, k) },
    { id: 'flip-h', label: describeParabola(a, flip(h), k) },
    { id: 'flip-k', label: describeParabola(a, h, flip(k)) },
  ])
  return {
    statement: `Which statement correctly describes the graph of $y = ${eq}$?`,
    answer: { kind: 'choice', options, correctId: 'correct' },
    solution: [
      { text: `The sign of the coefficient in front of the bracket determines the direction the parabola opens: ${a > 0 ? 'upward' : 'downward'}.` },
      { text: 'The vertex of the parabola $y=a(x-h)^2+k$ is the point $(h,k)$:', tex: `(${h}, ${k})` },
    ],
    hints: [
      'The sign of $a$ in front of the bracket determines which way the parabola opens.',
      'In the form $y=a(x-h)^2+k$, the vertex is the point $(h,k)$: pay attention to the signs inside the bracket.',
    ],
  }
}

export const template: SkillTemplate = {
  skillId: 'graphs_basic',
  theory,
  expectedSeconds: { 1: 40, 2: 80, 3: 130 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
