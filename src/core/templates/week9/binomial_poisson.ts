import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Binomial distribution $X \\sim \\text{Bin}(n, p)$: $P(X = k) = \\binom{n}{k} p^k (1-p)^{n-k}$ for $k = 0, 1, \\dots, n$.',
  'Binomial expectation $E[X] = np$ and variance $\\text{Var}(X) = np(1-p)$.',
  'Poisson distribution $X \\sim \\text{Poi}(\\lambda)$: $P(X = k) = \\dfrac{\\lambda^k e^{-\\lambda}}{k!}$ for $k = 0, 1, 2, \\dots$.',
  'Poisson expectation $E[X] = \\lambda$ and variance $\\text{Var}(X) = \\lambda$.',
  'Complement rule for "at least one": $P(X \\ge 1) = 1 - P(X = 0)$.',
  'Common mistakes: confusing $p$ with $1-p$ in the Binomial formula, or using $np(1-p)$ for Poisson variance.',
].join('\n')

function nCr(n: number, r: number): number {
  if (r < 0 || r > n) return 0
  let num = 1
  let den = 1
  for (let i = 1; i <= r; i += 1) {
    num *= n - i + 1
    den *= i
  }
  return num / den
}

function fact(n: number): number {
  let res = 1
  for (let i = 2; i <= n; i += 1) res *= i
  return res
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y) {
    const t = y
    y = x % y
    x = t
  }
  return x
}

const P_OPTIONS: readonly (readonly [number, number])[] = [
  [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5],
]

function binomProb(rng: Rng): Problem {
  const n = rng.int(2, 6)
  const k = rng.int(0, n)
  const [a, b] = rng.pick(P_OPTIONS)
  const pRat = rat(a, b)
  const pTex = ratToLatex(pRat)

  const num = nCr(n, k) * (a ** k) * ((b - a) ** (n - k))
  const den = b ** n
  const ansRat = rat(num, den)
  const ansTex = ratToLatex(ansRat)

  return {
    statement: `A random variable $X$ follows a Binomial distribution $X \\sim \\text{Bin}(${n}, ${pTex})$. Find $P(X = ${k})$.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: 'Apply the Binomial probability mass function:', tex: `P(X = ${k}) = \\binom{${n}}{${k}} \\left(${pTex}\\right)^{${k}} \\left(1 - ${pTex}\\right)^{${n - k}}` },
      { text: 'Evaluate the powers and combination:', tex: `P(X = ${k}) = ${nCr(n, k)} \\cdot \\frac{${a ** k}}{${b ** k}} \\cdot \\frac{${(b - a) ** (n - k)}}{${b ** (n - k)}}` },
      { text: 'Simplify the fraction:', tex: `P(X = ${k}) = ${ansTex}` },
    ],
    hints: [
      `Use the formula $P(X = k) = \\binom{n}{k} p^k (1-p)^{n-k}$ with $n = ${n}$ and $k = ${k}$.`,
      `Calculate $\\binom{${n}}{${k}} = ${nCr(n, k)}$, $p^{${k}} = (${pTex})^{${k}}$, and $(1-p)^{${n - k}} = \\left(${ratToLatex(rat(b - a, b))}\\right)^{${n - k}}$.`,
    ],
    inputHint: 'An exact fraction.',
  }
}

function binomMeanVar(rng: Rng): Problem {
  const n = rng.int(5, 40)
  const [a, b] = rng.pick(P_OPTIONS)
  const pTex = ratToLatex(rat(a, b))
  const findMean = rng.chance(0.5)

  if (findMean) {
    const ansRat = rat(n * a, b)
    const ansTex = ratToLatex(ansRat)
    return {
      statement: `Let $X \\sim \\text{Bin}(${n}, ${pTex})$. Find the expected value $E[X]$.`,
      answer: { kind: 'number', value: ansTex },
      solution: [
        { text: 'The expected value of a Binomial distribution is given by:', tex: 'E[X] = np' },
        { text: 'Substitute the given parameters:', tex: `E[X] = ${n} \\cdot ${pTex} = ${ansTex}` },
      ],
      hints: [
        'Recall that $E[X] = np$ for a Binomial distribution.',
        `Multiply $n = ${n}$ by $p = ${pTex}$.`,
      ],
      inputHint: 'An exact fraction or simplified integer.',
    }
  }

  const ansRat = rat(n * a * (b - a), b * b)
  const ansTex = ratToLatex(ansRat)
  return {
    statement: `Let $X \\sim \\text{Bin}(${n}, ${pTex})$. Find the variance $\\text{Var}(X)$.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: 'The variance of a Binomial distribution is given by:', tex: '\\text{Var}(X) = np(1-p)' },
      { text: 'Substitute the given parameters:', tex: `\\text{Var}(X) = ${n} \\cdot ${pTex} \\cdot ${ratToLatex(rat(b - a, b))} = ${ansTex}` },
    ],
    hints: [
      'Recall that $\\text{Var}(X) = np(1-p)$ for a Binomial distribution.',
      `Multiply $n = ${n}$, $p = ${pTex}$, and $1-p = ${ratToLatex(rat(b - a, b))}$.`,
    ],
    inputHint: 'An exact fraction or simplified integer.',
  }
}

function poiMeanVar(rng: Rng): Problem {
  const lambda = rng.int(2, 15)
  const askMean = rng.chance(0.5)

  if (askMean) {
    return {
      statement: `A random variable $X$ has a Poisson distribution $X \\sim \\text{Poi}(${lambda})$. Find the expected value $E[X]$.`,
      answer: { kind: 'number', value: String(lambda) },
      solution: [
        { text: 'For a Poisson distribution $X \\sim \\text{Poi}(\\lambda)$, the expectation equals the parameter:', tex: 'E[X] = \\lambda' },
        { text: 'Substitute the parameter value:', tex: `E[X] = ${lambda}` },
      ],
      hints: [
        'Recall that for a Poisson distribution, $E[X] = \\lambda$.',
        `The parameter $\\lambda$ is $${lambda}$.`,
      ],
    }
  }

  return {
    statement: `A random variable $X$ has a Poisson distribution $X \\sim \\text{Poi}(${lambda})$. Find the variance $\\text{Var}(X)$.`,
    answer: { kind: 'number', value: String(lambda) },
    solution: [
      { text: 'For a Poisson distribution $X \\sim \\text{Poi}(\\lambda)$, the variance equals the parameter:', tex: '\\text{Var}(X) = \\lambda' },
      { text: 'Substitute the parameter value:', tex: `\\text{Var}(X) = ${lambda}` },
    ],
    hints: [
      'Recall that for a Poisson distribution, $\\text{Var}(X) = \\lambda$.',
      `The parameter $\\lambda$ is $${lambda}$.`,
    ],
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return binomProb(rng)
  if (choice === 2) return binomMeanVar(rng)
  return poiMeanVar(rng)
}

function formatPoiTex(u: number, v: number, lambda: number): string {
  if (u === 1 && v === 1) return `e^{-${lambda}}`
  if (v === 1) return `${u}e^{-${lambda}}`
  return `\\frac{${u}}{${v}}e^{-${lambda}}`
}

function poiProb(rng: Rng): Problem {
  const lambda = rng.int(2, 8)
  const k = rng.int(0, 4)
  const numPow = lambda ** k
  const denFact = fact(k)
  const r = rat(numPow, denFact)
  const ansTex = formatPoiTex(r.n, r.d, lambda)

  const isUnreduced = gcd(numPow, denFact) > 1

  const sol = [
    { text: 'Apply the Poisson probability mass function:', tex: `P(X = ${k}) = \\frac{${lambda}^{${k}} e^{-${lambda}}}{${k}!}` },
    { text: 'Evaluate the power and factorial:', tex: `P(X = ${k}) = \\frac{${numPow}}{${denFact}} e^{-${lambda}}` },
  ]
  if (isUnreduced) {
    sol.push({ text: 'Simplify the coefficient:', tex: `P(X = ${k}) = ${ansTex}` })
  }

  return {
    statement: `A random variable $X$ follows a Poisson distribution $X \\sim \\text{Poi}(${lambda})$. Find $P(X = ${k})$ in exact form.`,
    answer: { kind: 'number', value: ansTex },
    solution: sol,
    hints: [
      `Use $P(X = k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}$ with $\\lambda = ${lambda}$ and $k = ${k}$.`,
      `Calculate $\\frac{${lambda}^${k}}{${k}!} = \\frac{${numPow}}{${denFact}}$.`,
    ],
    inputHint: 'Exact form such as \\frac{9}{2}e^{-3} or e^{-2}',
  }
}

function binomAtLeastOne(rng: Rng): Problem {
  const n = rng.int(2, 6)
  const [a, b] = rng.pick(P_OPTIONS)
  const pTex = ratToLatex(rat(a, b))

  const num = b ** n - (b - a) ** n
  const den = b ** n
  const ansRat = rat(num, den)
  const ansTex = ratToLatex(ansRat)

  return {
    statement: `An experiment with success probability $p = ${pTex}$ is repeated independently $n = ${n}$ times. Find the probability of at least one success, $P(X \\ge 1)$.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: 'Use the complement rule for "at least one":', tex: 'P(X \\ge 1) = 1 - P(X = 0)' },
      { text: 'Calculate $P(X = 0) = (1-p)^n$:', tex: `P(X = 0) = \\left(${ratToLatex(rat(b - a, b))}\\right)^{${n}} = \\frac{${(b - a) ** n}}{${b ** n}}` },
      { text: 'Subtract from $1$:', tex: `P(X \\ge 1) = 1 - \\frac{${(b - a) ** n}}{${b ** n}} = ${ansTex}` },
    ],
    hints: [
      'Apply the complement rule: $P(X \\ge 1) = 1 - P(X = 0)$.',
      `Calculate $P(X = 0) = (1-p)^{${n}}$ and subtract from $1$.`,
    ],
    inputHint: 'An exact fraction.',
  }
}

function poiAtLeastOne(rng: Rng): Problem {
  const lambda = rng.int(1, 6)
  const ansTex = `1 - e^{-${lambda}}`

  return {
    statement: `Events occur according to a Poisson process $X \\sim \\text{Poi}(${lambda})$. Find the probability of observing at least one event, $P(X \\ge 1)$.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: 'Use the complement rule:', tex: 'P(X \\ge 1) = 1 - P(X = 0)' },
      { text: 'Substitute $P(X = 0) = e^{-\\lambda}$:', tex: `P(X \\ge 1) = 1 - e^{-${lambda}}` },
    ],
    hints: [
      'Apply the complement rule: $P(X \\ge 1) = 1 - P(X = 0)$.',
      `For a Poisson distribution, $P(X = 0) = e^{-\\lambda} = e^{-${lambda}}$.`,
    ],
    inputHint: 'Exact form such as 1 - e^(-2)',
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return poiProb(rng)
  if (choice === 2) return binomAtLeastOne(rng)
  return poiAtLeastOne(rng)
}

interface BinomScenario {
  readonly context: string
  readonly nounSingular: string
  readonly nounPlural: string
  readonly verbSingular: string
  readonly verbPlural: string
}

const BINOM_SCENARIOS: readonly BinomScenario[] = [
  { context: 'A clinical trial tests a therapy with response rate', nounSingular: 'patient', nounPlural: 'patients', verbSingular: 'responds', verbPlural: 'respond' },
  { context: 'A quality control inspector tests items with defect rate', nounSingular: 'item', nounPlural: 'items', verbSingular: 'is defective', verbPlural: 'are defective' },
  { context: 'A medical study tests a vaccine with efficacy rate', nounSingular: 'subject', nounPlural: 'subjects', verbSingular: 'develops immunity', verbPlural: 'develop immunity' },
  { context: 'An agricultural trial tests seeds with germination rate', nounSingular: 'seed', nounPlural: 'seeds', verbSingular: 'germinates', verbPlural: 'germinate' },
  { context: 'An archery test evaluates a marksman with hit rate', nounSingular: 'shot', nounPlural: 'shots', verbSingular: 'hits the target', verbPlural: 'hit the target' },
]

function binomWord(rng: Rng): Problem {
  const scenario = rng.pick(BINOM_SCENARIOS)
  const n = rng.int(3, 8)
  const k = rng.int(1, n - 1)
  const [a, b] = rng.pick([[1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5]] as const)
  const pTex = ratToLatex(rat(a, b))

  const num = nCr(n, k) * (a ** k) * ((b - a) ** (n - k))
  const den = b ** n
  const ansRat = rat(num, den)
  const ansTex = ratToLatex(ansRat)

  const nounStr = k === 1 ? scenario.nounSingular : scenario.nounPlural
  const verbStr = k === 1 ? scenario.verbSingular : scenario.verbPlural

  return {
    statement: `${scenario.context} $p = ${pTex}$ on $n = ${n}$ ${scenario.nounPlural}. Assuming independent outcomes, find the probability that exactly $k = ${k}$ ${nounStr} ${verbStr}.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: 'Model the number of successful outcomes as $X \\sim \\text{Bin}(' + n + ', ' + pTex + ')$:', tex: `P(X = ${k}) = \\binom{${n}}{${k}} (${pTex})^{${k}} \\left(${ratToLatex(rat(b - a, b))}\\right)^{${n - k}}` },
      { text: 'Evaluate the powers and combination:', tex: `P(X = ${k}) = ${nCr(n, k)} \\cdot \\frac{${a ** k}}{${b ** k}} \\cdot \\frac{${(b - a) ** (n - k)}}{${b ** (n - k)}}` },
      { text: 'Simplify the fraction:', tex: `P(X = ${k}) = ${ansTex}` },
    ],
    hints: [
      `Model the count as $X \\sim \\text{Bin}(${n}, ${pTex})$.`,
      `Use $P(X = ${k}) = \\binom{${n}}{${k}} p^{${k}} (1-p)^{${n - k}}$.`,
    ],
    inputHint: 'An exact fraction.',
  }
}

interface PoiScenario {
  readonly context: string
  readonly timeUnit: string
  readonly itemSingular: string
  readonly itemPlural: string
}

const POI_SCENARIOS: readonly PoiScenario[] = [
  { context: 'In an emergency ward, patient admissions occur at a mean rate of', timeUnit: 'hour', itemSingular: 'admission', itemPlural: 'admissions' },
  { context: 'At a customer support desk, phone calls arrive at an average rate of', timeUnit: '10-minute period', itemSingular: 'call', itemPlural: 'calls' },
  { context: 'A web server receives HTTP requests at an average rate of', timeUnit: 'minute', itemSingular: 'request', itemPlural: 'requests' },
  { context: 'A traffic monitoring station records vehicle accidents at a rate of', timeUnit: 'month', itemSingular: 'accident', itemPlural: 'accidents' },
  { context: 'An astronomical observatory detects meteors at a mean rate of', timeUnit: 'hour', itemSingular: 'meteor', itemPlural: 'meteors' },
]

function poiWord(rng: Rng): Problem {
  const scenario = rng.pick(POI_SCENARIOS)
  const lambda = rng.int(2, 8)
  const k = rng.int(1, 5)
  const numPow = lambda ** k
  const denFact = fact(k)
  const r = rat(numPow, denFact)
  const ansTex = formatPoiTex(r.n, r.d, lambda)

  const isUnreduced = gcd(numPow, denFact) > 1

  const itemStr = k === 1 ? scenario.itemSingular : scenario.itemPlural

  const sol = [
    { text: `Apply the Poisson probability formula for $X \\sim \\text{Poi}(${lambda})$:`, tex: `P(X = ${k}) = \\frac{${lambda}^{${k}} e^{-${lambda}}}{${k}!}` },
    { text: 'Evaluate power and factorial:', tex: `P(X = ${k}) = \\frac{${numPow}}{${denFact}} e^{-${lambda}}` },
  ]
  if (isUnreduced) {
    sol.push({ text: 'Simplify the fraction:', tex: `P(X = ${k}) = ${ansTex}` })
  }

  return {
    statement: `${scenario.context} $\\lambda = ${lambda}$ per ${scenario.timeUnit} following a Poisson distribution. Find $P(X = ${k})$ for observing exactly $k = ${k}$ ${itemStr} in a given ${scenario.timeUnit}.`,
    answer: { kind: 'number', value: ansTex },
    solution: sol,
    hints: [
      `Use $P(X = k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}$ with $\\lambda = ${lambda}$ and $k = ${k}$.`,
      `Evaluate $\\frac{${lambda}^${k}}{${k}!}$.`,
    ],
    inputHint: 'Exact form such as \\frac{9}{2}e^{-3}',
  }
}

function conceptChoice(rng: Rng): Problem {
  const isBinomCondition = rng.chance(0.5)

  if (isBinomCondition) {
    const options = rng.shuffle([
      { id: 'independent_constant_p', label: 'Trials are independent with a constant probability of success $p$.' },
      { id: 'increasing_success_prob', label: 'The probability of success increases with each successive trial.' },
      { id: 'random_trials_count', label: 'The total number of trials $n$ is randomly distributed.' },
      { id: 'equal_mean_and_variance', label: 'The mean and variance of the distribution must be equal.' },
    ])
    return {
      statement: 'Which of the following is a defining assumption of a Binomial distribution $\\text{Bin}(n, p)$?',
      answer: { kind: 'choice', options, correctId: 'independent_constant_p' },
      solution: [
        { text: 'A Binomial distribution requires $n$ fixed, independent trials, each with the same success probability $p$.' },
      ],
      hints: [
        'Recall the Bernoulli trials assumptions.',
        'Consider trial independence and constant probability.',
      ],
    }
  }

  const options = rng.shuffle([
    { id: 'large_n_small_p', label: 'When $n$ is large and $p$ is small, with $\\lambda = np$.' },
    { id: 'small_n_large_p', label: 'When $n$ is small and $p$ is close to $1$.' },
    { id: 'n_equals_p', label: 'When $n$ equals $p$ exactly.' },
    { id: 'variance_exceeds_n', label: 'When the variance of the Binomial distribution exceeds $n$.' },
  ])
  return {
    statement: 'When does a Poisson distribution $\\text{Poi}(\\lambda)$ serve as a good approximation to a Binomial distribution $\\text{Bin}(n, p)$?',
    answer: { kind: 'choice', options, correctId: 'large_n_small_p' },
    solution: [
      { text: 'The Poisson distribution is the limit of a Binomial distribution as $n \\to \\infty$ and $p \\to 0$ with $np = \\lambda$.' },
    ],
    hints: [
      'Think about rare events in large populations.',
      'Consider the conditions on $n$ and $p$.',
    ],
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return binomWord(rng)
  if (choice === 2) return poiWord(rng)
  return conceptChoice(rng)
}

export const template: SkillTemplate = {
  skillId: 'binomial_poisson',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
