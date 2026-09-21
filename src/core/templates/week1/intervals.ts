import type { Rng } from '../../random/rng'
import type { IntervalPart, Problem, SkillTemplate } from '../types'

const theory = [
  'An interval is a piece of the number line.',
  'A round bracket excludes the endpoint: $(a, b) = \\{x \\in \\mathbb{R} : a < x < b\\}$.',
  'A square bracket includes it: $[a, b] = \\{x : a \\le x \\le b\\}$; mixed forms also occur — $[a, b)$, $(a, b]$.',
  'Next to infinity the bracket is always round: $(-\\infty, 3]$, $(2, \\infty)$.',
  'The symbol $\\cup$ (union) joins pieces together: "everything except 2" on the segment $[0,5]$ is $[0,2) \\cup (2,5]$.',
  'Common mistake — mixing up the brackets: a strict inequality $<$ gives a round bracket, a non-strict $\\le$ gives a square one.',
].join('\n')

const HINTS = [
  'A strict sign ($<$, $>$) gives a round bracket; a non-strict one ($\\le$, $\\ge$) gives a square bracket.',
  'Next to $\\infty$ the bracket is always round.',
]
const INPUT_HINT = 'Build the answer with the buttons: ( excludes the endpoint, [ includes it. Several pieces — use the ∪ button'

const part = (lo: string | null, hi: string | null, loClosed: boolean, hiClosed: boolean): IntervalPart => ({ lo, hi, loClosed, hiClosed })

function tier1(rng: Rng): Problem {
  const a = rng.int(-8, 3)
  const b = rng.int(a + 2, a + 9)
  const loClosed = rng.chance(0.5)
  const hiClosed = rng.chance(0.5)
  const loSign = loClosed ? '\\le' : '<'
  const hiSign = hiClosed ? '\\le' : '<'
  const condition = `\\{x \\in \\mathbb{R} : ${a} ${loSign} x ${hiSign} ${b}\\}`
  return {
    statement: `Write $${condition}$ as an interval.`,
    answer: { kind: 'interval', parts: [part(String(a), String(b), loClosed, hiClosed)] },
    solution: [
      { text: `The left endpoint $${a}$ is ${loClosed ? 'included' : 'not included'}, the right endpoint $${b}$ is ${hiClosed ? 'included' : 'not included'}.` },
      { text: 'So the answer is:', tex: `${loClosed ? '[' : '('}${a}, ${b}${hiClosed ? ']' : ')'}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const k = rng.int(2, 9)
  const strict = rng.chance(0.5)
  const less = rng.chance(0.5)
  const sign = less ? (strict ? '<' : '\\le') : strict ? '>' : '\\ge'
  const condition = `|x| ${sign} ${k}`
  const parts = less
    ? [part(String(-k), String(k), !strict, !strict)]
    : [part(null, String(-k), false, !strict), part(String(k), null, !strict, false)]
  return {
    statement: `Write the solution set of $${condition}$ as an interval.`,
    answer: { kind: 'interval', parts },
    solution: [
      {
        text: less
          ? `The absolute value is less than ${k} — so $x$ lies between $-${k}$ and $${k}$.`
          : `The absolute value is greater than ${k} — so $x$ is farther than ${k} from zero in either direction, giving two pieces.`,
      },
      { text: 'Answer:', tex: less ? `${strict ? '(' : '['}-${k}, ${k}${strict ? ')' : ']'}` : `(-\\infty, -${k}${strict ? ')' : ']'} \\cup ${strict ? '(' : '['}${k}, \\infty)` },
    ],
    hints: [`$|x| ${sign} ${k}$ is the distance from zero to $x$.`, 'For "greater than" you get two intervals, joined by the $\\cup$ symbol.'],
    inputHint: INPUT_HINT,
  }
}

function tier3(rng: Rng): Problem {
  const a = rng.int(-6, 2)
  const gap = rng.int(a + 1, a + 4)
  const b = rng.int(gap + 1, gap + 5)
  const condition = `\\{x \\in \\mathbb{R} : ${a} \\le x \\le ${b},\\ x \\ne ${gap}\\}`
  return {
    statement: `Write $${condition}$ as a union of intervals.`,
    answer: {
      kind: 'interval',
      parts: [part(String(a), String(gap), true, false), part(String(gap), String(b), false, true)],
    },
    solution: [
      { text: `Take the segment $[${a}, ${b}]$ and remove the point $${gap}$.` },
      { text: 'This gives two pieces — the brackets next to the removed point are round:', tex: `[${a}, ${gap}) \\cup (${gap}, ${b}]` },
    ],
    hints: ['The removed point cuts the segment into two pieces.', 'Next to the removed point the brackets are round, while the outer endpoints stay included.'],
    inputHint: INPUT_HINT,
  }
}

export const template: SkillTemplate = {
  skillId: 'intervals',
  theory,
  expectedSeconds: { 1: 40, 2: 70, 3: 95 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
