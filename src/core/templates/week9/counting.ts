import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Permutations $P(n,k) = \\frac{n!}{(n-k)!}$ count ordered arrangements of $k$ items selected from $n$ distinct items.',
  'Combinations $C(n,k) = \\binom{n}{k} = \\frac{n!}{k!(n-k)!}$ count unordered selections of $k$ items from $n$ distinct items.',
  'Arrangements with repeated items: for $n$ items with multiplicities $n_1, n_2, \\dots, n_r$, the number of distinct permutations is $\\frac{n!}{n_1! n_2! \\dots n_r!}$.',
  'Complement trick ("at least one"): $N(\\text{at least one}) = N(\\text{total}) - N(\\text{none})$.',
  'Handy identity: $\\binom{n}{k} = \\binom{n}{n-k}$ and $\\binom{n}{0} = \\binom{n}{n} = 1$.',
  'Common mistakes: using permutations when order does not matter (or vice versa), or forgetting to divide by factorials for repeated letters.',
].join('\n')

function fact(n: number): number {
  let res = 1
  for (let i = 2; i <= n; i += 1) res *= i
  return res
}

function nPr(n: number, r: number): number {
  return fact(n) / fact(n - r)
}

function nCr(n: number, r: number): number {
  return fact(n) / (fact(r) * fact(n - r))
}

function basicEval(rng: Rng): Problem {
  const isComb = rng.chance(0.5)
  if (isComb) {
    const n = rng.int(5, 12)
    const k = rng.int(2, Math.min(5, n - 1))
    const val = nCr(n, k)
    return {
      statement: `Calculate the combination $\\binom{${n}}{${k}}$.`,
      answer: { kind: 'number', value: String(val) },
      solution: [
        { text: 'Apply the combinations formula:', tex: `\\binom{n}{k} = \\frac{n!}{k!(n-k)!}` },
        { text: `Substitute $n = ${n}$ and $k = ${k}$:`, tex: `\\binom{${n}}{${k}} = \\frac{${n}!}{${k}! ${n - k}!} = ${val}` },
      ],
      hints: [
        'Recall the formula $\\binom{n}{k} = \\frac{n!}{k!(n-k)!}$.',
        `Evaluate $\\frac{${n}!}{${k}! ${n - k}!}$.`,
      ],
      inputHint: 'An integer.',
    }
  }

  const n = rng.int(4, 9)
  const k = rng.int(2, Math.min(5, n))
  const val = nPr(n, k)
  return {
    statement: `Calculate the permutation $P(${n}, ${k})$.`,
    answer: { kind: 'number', value: String(val) },
    solution: [
      { text: 'Apply the permutations formula:', tex: `P(n, k) = \\frac{n!}{(n-k)!}` },
      { text: `Substitute $n = ${n}$ and $k = ${k}$:`, tex: `P(${n}, ${k}) = \\frac{${n}!}{${n - k}!} = ${val}` },
    ],
    hints: [
      'Recall the formula $P(n, k) = \\frac{n!}{(n-k)!}$.',
      `Multiply $${k}$ decreasing factors starting from $${n}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function committeeSelection(rng: Rng): Problem {
  const n = rng.int(6, 12)
  const k = rng.int(2, 5)
  const val = nCr(n, k)

  return {
    statement: `A research group must select a team of $${k}$ researchers from $${n}$ candidates. In how many different ways can the team be chosen?`,
    answer: { kind: 'number', value: String(val) },
    solution: [
      { text: 'Since the order of selection does not matter, use combinations:', tex: `\\binom{n}{k} = \\binom{${n}}{${k}}` },
      { text: 'Evaluate the combination:', tex: `\\binom{${n}}{${k}} = \\frac{${n}!}{${k}! ${n - k}!} = ${val}` },
    ],
    hints: [
      'Determining a committee is an unordered selection, so use combinations $\\binom{n}{k}$.',
      `Calculate $\\binom{${n}}{${k}}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function bookshelfArrangement(rng: Rng): Problem {
  const n = rng.int(5, 10)
  const k = rng.int(2, Math.min(4, n))
  const val = nPr(n, k)

  return {
    statement: `A librarian has $${n}$ distinct books available. In how many ways can $${k}$ books be arranged in order on a display shelf?`,
    answer: { kind: 'number', value: String(val) },
    solution: [
      { text: 'Since the arrangement order matters, use permutations:', tex: `P(n, k) = P(${n}, ${k})` },
      { text: 'Evaluate the permutation:', tex: `P(${n}, ${k}) = \\frac{${n}!}{${n - k}!} = ${val}` },
    ],
    hints: [
      'Arranging books in order is a permutation problem.',
      `Calculate $P(${n}, ${k})$.`,
    ],
    inputHint: 'An integer.',
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return basicEval(rng)
  if (choice === 2) return committeeSelection(rng)
  return bookshelfArrangement(rng)
}

interface WordCase {
  readonly word: string
  readonly n: number
  readonly counts: readonly number[]
  readonly total: number
}

const WORD_CASES: readonly WordCase[] = [
  { word: 'CHEESE', n: 6, counts: [1, 1, 3, 1], total: 120 },
  { word: 'BANANA', n: 6, counts: [1, 3, 2], total: 60 },
  { word: 'PEPPER', n: 6, counts: [3, 2, 1], total: 60 },
  { word: 'LETTER', n: 6, counts: [1, 2, 2, 1], total: 180 },
  { word: 'COFFEE', n: 6, counts: [1, 1, 2, 2], total: 180 },
  { word: 'MEMBER', n: 6, counts: [2, 2, 1, 1], total: 180 },
  { word: 'SUCCESS', n: 7, counts: [3, 2, 1, 1], total: 420 },
  { word: 'ARRANGE', n: 7, counts: [2, 2, 1, 1, 1], total: 1260 },
  { word: 'PARALLEL', n: 8, counts: [2, 3, 1, 1, 1], total: 3360 },
  { word: 'BALLOON', n: 7, counts: [2, 2, 1, 1, 1], total: 1260 },
]

function repeatedLetters(rng: Rng): Problem {
  const item = rng.pick(WORD_CASES)
  const multTex = item.counts.map((c) => `${c}!`).join(' ')

  return {
    statement: `Find the number of distinct permutations of the letters in the word $${item.word}$.`,
    answer: { kind: 'number', value: String(item.total) },
    solution: [
      { text: `Count the total number of letters ($n = ${item.n}$) and the frequency of each distinct letter.`, tex: `\\text{Multiplicities: } ${item.counts.join(', ')}` },
      { text: 'Apply the formula for permutations with repetitions:', tex: `\\frac{n!}{n_1! n_2! \\dots n_r!} = \\frac{${item.n}!}{${multTex}} = ${item.total}` },
    ],
    hints: [
      'Divide $n!$ by the factorials of the letter frequencies.',
      `Compute $\\frac{${item.n}!}{${multTex}}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function twoGroupCommittee(rng: Rng): Problem {
  const n1 = rng.int(4, 9)
  const k1 = rng.int(2, 4)
  const n2 = rng.int(4, 9)
  const k2 = rng.int(2, 4)
  const c1 = nCr(n1, k1)
  const c2 = nCr(n2, k2)
  const val = c1 * c2

  return {
    statement: `A hospital committee must consist of $${k1}$ doctors chosen from $${n1}$ doctors, and $${k2}$ nurses chosen from $${n2}$ nurses. How many different committees can be formed?`,
    answer: { kind: 'number', value: String(val) },
    solution: [
      { text: 'Calculate the number of ways to choose doctors and nurses separately:', tex: `\\text{Doctors: } \\binom{${n1}}{${k1}} = ${c1}, \\quad \\text{Nurses: } \\binom{${n2}}{${k2}} = ${c2}` },
      { text: 'Multiply the counts by the multiplication principle:', tex: `${c1} \\cdot ${c2} = ${val}` },
    ],
    hints: [
      'Calculate $\\binom{n_1}{k_1}$ for doctors and $\\binom{n_2}{k_2}$ for nurses.',
      `Multiply $\\binom{${n1}}{${k1}} = ${c1}$ by $\\binom{${n2}}{${k2}} = ${c2}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function passcodeDigits(rng: Rng): Problem {
  const k = rng.pick([4, 5, 6])
  const val = nPr(10, k)

  return {
    statement: `How many different $${k}$-digit security passcodes can be formed using the digits $0$ through $9$ if no digit can be repeated?`,
    answer: { kind: 'number', value: String(val) },
    solution: [
      { text: `Selecting $${k}$ distinct digits in order from $10$ available digits is a permutation:`, tex: `P(10, ${k}) = \\frac{10!}{(10 - ${k})!} = ${val}` },
    ],
    hints: [
      'Since order matters and digits cannot repeat, use permutations $P(10, k)$.',
      `Calculate $P(10, ${k})$.`,
    ],
    inputHint: 'An integer.',
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return repeatedLetters(rng)
  if (choice === 2) return twoGroupCommittee(rng)
  return passcodeDigits(rng)
}

function atLeastOne(rng: Rng): Problem {
  const m = rng.int(3, 8)
  const w = rng.int(3, 8)
  const k = rng.pick([3, 4, 5])

  if (m < k) {
    const totalC = nCr(m + w, k)
    const val = totalC
    return {
      statement: `A committee of $${k}$ people is chosen at random from $${m}$ men and $${w}$ women. How many possible committees contain at least one woman?`,
      answer: { kind: 'number', value: String(val) },
      solution: [
        { text: 'Calculate the total possible committees:', tex: `\\binom{${m + w}}{${k}} = ${val}` },
        { text: `Since there are only $${m}$ men, every committee of size $${k}$ must contain at least one woman.` },
      ],
      hints: [
        'Notice that a committee with zero women is impossible when $m < k$.',
        `Calculate total committees $\\binom{${m + w}}{${k}}$.`,
      ],
      inputHint: 'An integer.',
    }
  }

  const totalC = nCr(m + w, k)
  const menOnlyC = nCr(m, k)
  const val = totalC - menOnlyC

  return {
    statement: `A committee of $${k}$ people is chosen at random from $${m}$ men and $${w}$ women. How many possible committees contain at least one woman?`,
    answer: { kind: 'number', value: String(val) },
    solution: [
      { text: 'Use the complement counting method:', tex: 'N(\\text{at least one woman}) = N(\\text{total}) - N(\\text{only men})' },
      { text: 'Calculate total committees and men-only committees:', tex: `N(\\text{total}) = \\binom{${m + w}}{${k}} = ${totalC}, \\quad N(\\text{only men}) = \\binom{${m}}{${k}} = ${menOnlyC}` },
      { text: 'Subtract to find the result:', tex: `${totalC} - ${menOnlyC} = ${val}` },
    ],
    hints: [
      'Use the complement rule: subtract the number of committees with no women from the total number of committees.',
      `Calculate $\\binom{${m + w}}{${k}} - \\binom{${m}}{${k}}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function adjacentBlock(rng: Rng): Problem {
  const n = rng.int(4, 8)
  const val = 2 * fact(n - 1)
  const pair = rng.pick([
    { p1: 'Alice', p2: 'Bob' },
    { p1: 'Carlos', p2: 'Diana' },
    { p1: 'Emma', p2: 'Frank' },
  ])

  return {
    statement: `In how many different ways can $${n}$ students line up in a single file if $2$ specific students (${pair.p1} and ${pair.p2}) must stand next to each other?`,
    answer: { kind: 'number', value: String(val) },
    solution: [
      { text: `Treat ${pair.p1} and ${pair.p2} as a single block. There are now $n-1 = ${n - 1}$ blocks to arrange:`, tex: `${n - 1}! = ${fact(n - 1)}` },
      { text: `${pair.p1} and ${pair.p2} can be arranged in $2! = 2$ ways within their block:`, tex: `2 \\cdot ${n - 1}! = 2 \\cdot ${fact(n - 1)} = ${val}` },
    ],
    hints: [
      'Treat the two adjacent individuals as 1 single block, giving $(n-1)!$ arrangements.',
      `Multiply $(n-1)! = ${fact(n - 1)}$ by $2! = 2$.`,
    ],
    inputHint: 'An integer.',
  }
}

function circularTable(rng: Rng): Problem {
  const n = rng.int(4, 8)
  const val = fact(n - 1)

  return {
    statement: `In how many distinct ways can $${n}$ executives sit around a circular conference table, where rotations are considered identical?`,
    answer: { kind: 'number', value: String(val) },
    solution: [
      { text: `Fix one person's position to eliminate rotational symmetry. The remaining $n-1 = ${n - 1}$ people can be arranged in:`, tex: `(${n} - 1)! = ${n - 1}! = ${val}` },
    ],
    hints: [
      'Circular permutations fix 1 position to break symmetry, giving $(n-1)!$ ways.',
      `Calculate $(${n}-1)! = ${n - 1}!$.`,
    ],
    inputHint: 'An integer.',
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return atLeastOne(rng)
  if (choice === 2) return adjacentBlock(rng)
  return circularTable(rng)
}

export const template: SkillTemplate = {
  skillId: 'counting',
  theory,
  expectedSeconds: { 1: 60, 2: 75, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
