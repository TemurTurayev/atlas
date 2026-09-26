import { coefPrefix, joinTerms, linear as linearTerm } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'The order of a differential equation is the highest derivative that appears in it: one derivative present gives order 1, a second derivative anywhere gives order 2, and so on.',
  'An equation is linear when $y$ and every one of its derivatives appear only to the first power, alone — no $y^{2}$, no product like $y\\,y\'$, and no other function applied to them. The coefficients themselves are still free to depend on $t$.',
  'An equation is autonomous when the independent variable $t$ never appears by itself, only through $y$ and its derivatives; a bare $t$ anywhere (as $t$, $t^{2}$, $\\cos t$, ...) makes it not autonomous.',
  'Linearity and autonomy are independent labels — an equation can be linear and not autonomous, or nonlinear and autonomous, in any combination.',
  'The order depends only on the highest derivative present: raising $y$ itself to a power, as in $y^{2}$ or $y^{3}$, never changes the order.',
  'Common mistakes: mistaking the highest power of $y$ for the order; calling an equation nonlinear just because a coefficient depends on $t$; missing a $t$ tucked into the right-hand side when checking autonomy.',
].join('\n')

const HINTS_ORDER = [
  'Scan every term for a derivative of $y$ — the order is how many times $y$ has been differentiated in the term with the most derivatives.',
  'A power on $y$ itself, or on a lower derivative, does not count toward the order; only count prime marks on $y$.',
]
const HINTS_CLASSIFY = [
  'Look at each term with $y$ in it: does $y$ or a derivative appear squared, multiplied by another derivative, or inside another function? Any of those makes the equation nonlinear.',
  'Separately, look for a bare $t$ anywhere in the equation, not attached to $y$ — if one appears, the equation is not autonomous.',
]
const HINTS_MATCH = [
  'Check the three properties one at a time — order, then linear vs. nonlinear, then autonomous vs. not — across all four equations.',
  'Eliminate any equation that fails even one of the three required properties; exactly one equation should pass all three.',
]

const INPUT_HINT_ORDER = 'A single whole number: 1, 2, or 3'

// ---------- shared builders ----------

/** coef · body, e.g. (3, "y''") -> "3y''"; (1, "y") -> "y"; (-1, "y") -> "-y". */
const withCoef = (coef: number, body: string): string => `${coefPrefix(coef)}${body}`

/** "y" with `order` prime marks: 0 -> "y", 1 -> "y'", 2 -> "y''", 3 -> "y'''". */
const derivMark = (order: number): string => `y${"'".repeat(order)}`

type Order = 1 | 2 | 3
const ORDER_WORD: Readonly<Record<Order, string>> = { 1: 'first order', 2: 'second order', 3: 'third order' }

interface BuiltEquation {
  readonly latex: string
  /** Explains, in prose, exactly what makes the equation linear or nonlinear. */
  readonly linearNote: string
  /** Explains, in prose, exactly what makes the equation autonomous or not. */
  readonly autoNote: string
}

/** Builds one differential equation in $y$ with the requested order, linearity and autonomy. */
function buildEquation(rng: Rng, order: Order, isLinear: boolean, isAutonomous: boolean): BuiltEquation {
  const topCoef = rng.intExcept(-3, 3, [0])
  const terms: string[] = [withCoef(topCoef, derivMark(order))]
  let linearNote: string

  if (!isLinear) {
    const flavor = rng.pick(['y2', 'yyprime'] as const)
    const c = rng.intExcept(-3, 3, [0])
    if (flavor === 'y2') {
      const term = withCoef(c, 'y^{2}')
      terms.push(term)
      linearNote = `the term $${term}$ raises $y$ to a power other than one`
    } else {
      const term = withCoef(c, "y\\,y'")
      terms.push(term)
      linearNote = `the term $${term}$ multiplies $y$ by its own derivative $y'$`
    }
  } else {
    linearNote = 'every term with $y$ or a derivative of $y$ appears only to the first power, with no products between them'
    if (order >= 2 && rng.chance(0.7)) {
      const b = rng.intExcept(-3, 3, [0])
      terms.splice(1, 0, withCoef(b, derivMark(order - 1)))
    } else if (order === 1 && rng.chance(0.5)) {
      const b = rng.intExcept(-3, 3, [0])
      terms.push(withCoef(b, 'y'))
    }
  }

  const lhs = joinTerms(terms)

  let rhs: string
  let autoNote: string
  if (isAutonomous) {
    rhs = String(rng.int(-4, 4))
    autoNote = 'the right-hand side is just a constant, with no explicit $t$'
  } else {
    const e = rng.intExcept(-3, 3, [0])
    const f = rng.int(-4, 4)
    rhs = linearTerm(e, f, 't')
    autoNote = `the right-hand side, $${rhs}$, contains $t$ explicitly`
  }

  return { latex: `${lhs} = ${rhs}`, linearNote, autoNote }
}

// ---------- tier 1: order ----------

function randomRhs(rng: Rng): string {
  const kind = rng.pick(['zero', 'const', 'linearT', 'tSquared', 'trig'] as const)
  if (kind === 'zero') return '0'
  if (kind === 'const') return String(rng.intExcept(-5, 5, [0]))
  if (kind === 'linearT') return linearTerm(rng.intExcept(-3, 3, [0]), rng.int(-4, 4), 't')
  if (kind === 'tSquared') return `${coefPrefix(rng.intExcept(-3, 3, [0]))}t^{2}`
  return `${coefPrefix(rng.intExcept(-3, 3, [0]))}\\cos t`
}

function tier1(rng: Rng): Problem {
  const order = rng.pick([1, 2, 3] as const)
  const topCoef = rng.intExcept(-3, 3, [0])
  const terms: string[] = [withCoef(topCoef, derivMark(order))]

  if (order >= 2 && rng.chance(0.6)) {
    const mid = rng.int(1, order - 1)
    const b = rng.intExcept(-3, 3, [0])
    terms.splice(1, 0, withCoef(b, derivMark(mid)))
  }

  let decoyNote = ''
  if (rng.chance(0.6)) {
    const p = rng.pick([2, 3])
    const c = rng.intExcept(-3, 3, [0])
    const term = withCoef(c, `y^{${p}}`)
    terms.push(term)
    decoyNote = ` The term $${term}$ raises $y$ itself to a power — that never changes the order, which counts derivatives, not exponents.`
  }

  const lhs = joinTerms(terms)
  const eqLatex = `${lhs} = ${randomRhs(rng)}`

  return {
    statement: `What is the order of the differential equation $${eqLatex}$?`,
    answer: { kind: 'number', value: String(order) },
    solution: [
      { text: 'The order of a differential equation is the highest derivative that appears in it.' },
      { text: `Here the highest derivative present is $${derivMark(order)}$, so the order is ${order}.${decoyNote}` },
    ],
    hints: HINTS_ORDER,
    inputHint: INPUT_HINT_ORDER,
  }
}

// ---------- tier 2: linear/nonlinear, autonomous/not, as one combined choice ----------

interface Combo {
  readonly id: string
  readonly linear: boolean
  readonly autonomous: boolean
  readonly label: string
}

const COMBOS: readonly Combo[] = [
  { id: 'lin-auto', linear: true, autonomous: true, label: 'Linear and autonomous' },
  { id: 'lin-nonauto', linear: true, autonomous: false, label: 'Linear and not autonomous' },
  { id: 'nonlin-auto', linear: false, autonomous: true, label: 'Nonlinear and autonomous' },
  { id: 'nonlin-nonauto', linear: false, autonomous: false, label: 'Nonlinear and not autonomous' },
]

function tier2(rng: Rng): Problem {
  const order = rng.pick([1, 2] as const)
  const combo = rng.pick(COMBOS)
  const { latex, linearNote, autoNote } = buildEquation(rng, order, combo.linear, combo.autonomous)
  const options: readonly ChoiceOption[] = rng.shuffle(COMBOS.map((c) => ({ id: c.id, label: c.label })))

  return {
    statement: `Classify the differential equation $${latex}$: is it linear or nonlinear, and is it autonomous or not?`,
    answer: { kind: 'choice', options, correctId: combo.id },
    solution: [
      { text: `${combo.linear ? 'Linear' : 'Nonlinear'} — ${linearNote}.` },
      { text: `${combo.autonomous ? 'Autonomous' : 'Not autonomous'} — ${autoNote}.` },
    ],
    hints: HINTS_CLASSIFY,
  }
}

// ---------- tier 3: pick the equation matching a three-part description ----------

const combinedDescription = (order: Order, isLinear: boolean, isAutonomous: boolean): string =>
  `${ORDER_WORD[order]}, ${isLinear ? 'linear' : 'nonlinear'}, ${isAutonomous ? 'autonomous' : 'not autonomous'}`

function otherOrder(rng: Rng, order: Order): Order {
  const others = ([1, 2, 3] as const).filter((o) => o !== order)
  return rng.pick(others)
}

function tier3(rng: Rng): Problem {
  const target = { order: rng.pick([1, 2, 3] as const), linear: rng.chance(0.5), autonomous: rng.chance(0.5) }
  const description = combinedDescription(target.order, target.linear, target.autonomous)

  const correctEq = buildEquation(rng, target.order, target.linear, target.autonomous)
  const wrongOrder = otherOrder(rng, target.order)
  const orderDistractor = buildEquation(rng, wrongOrder, target.linear, target.autonomous)
  const linearDistractor = buildEquation(rng, target.order, !target.linear, target.autonomous)
  const autoDistractor = buildEquation(rng, target.order, target.linear, !target.autonomous)

  const options: readonly ChoiceOption[] = rng.shuffle([
    { id: 'correct', label: `$${correctEq.latex}$` },
    { id: 'order', label: `$${orderDistractor.latex}$` },
    { id: 'linear', label: `$${linearDistractor.latex}$` },
    { id: 'auto', label: `$${autoDistractor.latex}$` },
  ])

  return {
    statement: `Which of the following differential equations is ${description}?`,
    answer: { kind: 'choice', options, correctId: 'correct' },
    solution: [
      { text: `Correct: $${correctEq.latex}$ is ${description} — ${correctEq.linearNote}; ${correctEq.autoNote}.` },
      { text: `$${orderDistractor.latex}$ has order ${wrongOrder}, not ${target.order} — it does not match.` },
      {
        text: `$${linearDistractor.latex}$ is ${target.linear ? 'nonlinear' : 'linear'} instead of ${target.linear ? 'linear' : 'nonlinear'}: ${linearDistractor.linearNote}.`,
      },
      {
        text: `$${autoDistractor.latex}$ is ${target.autonomous ? 'not autonomous' : 'autonomous'} instead: ${autoDistractor.autoNote}.`,
      },
    ],
    hints: HINTS_MATCH,
  }
}

export const template: SkillTemplate = {
  skillId: 'ode_classify',
  theory,
  expectedSeconds: { 1: 35, 2: 65, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
