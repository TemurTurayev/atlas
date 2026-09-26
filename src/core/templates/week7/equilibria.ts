import { coefPrefix, linear } from '../../math/latex'
import { polyEval, polyFromRoots, polyToLatex, type Poly } from '../../math/poly'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  "An autonomous equation $y' = f(y)$ has a rate of change that depends only on $y$, never on $t$ directly; an equilibrium is a value $y^{*}$ with $f(y^{*}) = 0$, where the quantity stops changing.",
  "Stability is read from the sign of $f'(y^{*})$: if $f'(y^{*}) < 0$ a small displacement is pushed back toward $y^{*}$, so it is stable; if $f'(y^{*}) > 0$ the displacement grows, so it is unstable.",
  "Equivalently, sketch $f(y)$ against $y$: wherever the curve lies above the axis $y$ increases, wherever it lies below $y$ decreases, and this shows which equilibria attract or repel nearby values.",
  "In the logistic model $y' = ry(1-y/K)$ the equilibria are $y=0$ (unstable) and $y=K$ (stable, the carrying capacity); adding constant harvesting, $y' = ry(1-y/K) - h$, lowers the curve and can merge the two equilibria into one.",
  'At that critical harvesting rate the single remaining equilibrium is fragile: populations above it are still pulled toward it, but populations below it collapse — a further, small increase in harvesting drives the species to extinction.',
  'Common mistakes: assuming every root of $f(y)=0$ is stable without checking $f\'$ or a sign chart; getting the inequality backwards (treating positive $f\'$ as stable).',
].join('\n')

const HINTS_EQUILIBRIA = [
  'An equilibrium is a value of $y$ where the rate of change vanishes: solve $f(y) = 0$.',
  'Factor $f(y)$ (or use the quadratic/cubic formula) — every root is an equilibrium.',
]
const HINTS_STABILITY = [
  'A small push away from a stable equilibrium is pulled back; a small push away from an unstable one keeps growing.',
  "Differentiate $f$ and evaluate $f'$ at the equilibrium: negative means stable, positive means unstable.",
]
const HINTS_APPROACH = [
  'Find where $f(y) = 0$ first — those values split the line into regions where $y$ only increases or only decreases.',
  'Check the sign of $f(y)$ at a point in each region: a positive sign means $y$ increases toward the equilibrium above it, a negative sign means $y$ decreases toward the one below (or falls without bound if there is none).',
]
const HINTS_HARVEST = [
  'Write the equilibrium condition $ry(1-y/K) = h$ as a quadratic in $y$, then look at its discriminant.',
  'The two equilibria merge into a single one exactly when that discriminant is zero — solve for $h$.',
]

const INPUT_HINT_SET = 'Equilibria separated by commas, e.g. -1, 2'
const INPUT_HINT_NUMBER = 'A single number; it may be negative'

/** Term-by-term derivative of an ascending-coefficient polynomial: d/dy (c_k y^k) = k c_k y^{k-1}. */
function polyDeriv(p: Poly): Poly {
  return p.slice(1).map((c, i) => c * (i + 1))
}

/** "\left(y-r\right)", the bracket factor for a root r, in the variable y. */
const bracket = (r: number): string => `\\left(${linear(1, -r, 'y')}\\right)`

function quadraticEquilibria(rng: Rng): Problem {
  const r1 = rng.int(-5, 5)
  const r2 = rng.intExcept(-5, 5, [r1])
  const leading = rng.pick([1, -1, 2, -2])
  const roots = [r1, r2].sort((x, y) => x - y)
  const poly = polyFromRoots(leading, roots)
  const factored = `${coefPrefix(leading)}${bracket(roots[0])}${bracket(roots[1])}`
  return {
    statement: `A quantity $y(t)$ evolves according to the autonomous equation $y' = f(y) = ${polyToLatex(poly, 'y')}$. Find all equilibria (the values of $y$ where $y' = 0$).`,
    answer: { kind: 'numberSet', values: roots.map(String) },
    solution: [
      { text: 'Factor $f(y)$:', tex: `f(y) = ${factored}` },
      { text: 'Set each factor to zero:', tex: `y = ${roots[0]}, \\quad y = ${roots[1]}` },
    ],
    hints: HINTS_EQUILIBRIA,
    inputHint: INPUT_HINT_SET,
  }
}

function cubicEquilibria(rng: Rng): Problem {
  const r1 = rng.int(-4, 4)
  const r2 = rng.intExcept(-4, 4, [r1])
  const r3 = rng.intExcept(-4, 4, [r1, r2])
  const leading = rng.pick([1, -1])
  const roots = [r1, r2, r3].sort((x, y) => x - y)
  const poly = polyFromRoots(leading, roots)
  const factored = `${coefPrefix(leading)}${bracket(roots[0])}${bracket(roots[1])}${bracket(roots[2])}`
  return {
    statement: `A quantity $y(t)$ evolves according to the autonomous equation $y' = f(y) = ${polyToLatex(poly, 'y')}$. Find all equilibria (the values of $y$ where $y' = 0$).`,
    answer: { kind: 'numberSet', values: roots.map(String) },
    solution: [
      { text: 'Factor $f(y)$:', tex: `f(y) = ${factored}` },
      { text: 'Set each factor to zero:', tex: `y = ${roots[0]}, \\quad y = ${roots[1]}, \\quad y = ${roots[2]}` },
    ],
    hints: HINTS_EQUILIBRIA,
    inputHint: INPUT_HINT_SET,
  }
}

function tier1(rng: Rng): Problem {
  return rng.chance(0.5) ? quadraticEquilibria(rng) : cubicEquilibria(rng)
}

const STABILITY_LABELS = ['stable', 'unstable', 'cannot tell from this test']

/**
 * f'(r1) and f'(r2) always have opposite, nonzero signs at the two distinct roots of the quadratic
 * f — so the classification below is always well defined, and "cannot tell" is always a genuine,
 * if plausible-sounding, wrong answer.
 */
function tier2(rng: Rng): Problem {
  const r1 = rng.int(-4, 4)
  const r2 = rng.intExcept(-4, 4, [r1])
  const leading = rng.pick([1, -1, 2, -2])
  const poly = polyFromRoots(leading, [r1, r2])
  const chosen = rng.pick([r1, r2])
  const deriv = polyDeriv(poly)
  const slope = polyEval(deriv, chosen)
  const classification = slope < 0 ? 'stable' : 'unstable'
  const options: ChoiceOption[] = rng.shuffle(STABILITY_LABELS.map((label) => ({ id: label, label })))
  const signWord = slope < 0 ? '< 0' : '> 0'
  const pushed = slope < 0 ? 'pushed back toward it' : 'pushed further away from it'

  return {
    statement: `The autonomous equation $y' = f(y) = ${polyToLatex(poly, 'y')}$ has an equilibrium at $y^{*} = ${chosen}$. Is this equilibrium stable or unstable?`,
    answer: { kind: 'choice', options, correctId: classification },
    solution: [
      { text: 'Differentiate $f$:', tex: `f'(y) = ${polyToLatex(deriv, 'y')}` },
      { text: `Evaluate the derivative at the equilibrium $y^{*} = ${chosen}$:`, tex: `f'(${chosen}) = ${slope}` },
      { text: `Since $f'(${chosen}) ${signWord}$, a small displacement from $y^{*}$ is ${pushed}, so this equilibrium is ${classification}.` },
    ],
    hints: HINTS_STABILITY,
  }
}

/** f(y) = -a(y-yL)(y-yU): a downward-opening parabola, negative outside [yL, yU] and positive inside. */
function populationApproach(rng: Rng): Problem {
  const a = rng.pick([1, 2])
  const yL = rng.int(2, 5)
  const gap = rng.int(2, 5)
  const yU = yL + gap
  const poly = polyFromRoots(-a, [yL, yU])
  const below = yL - 1
  const mid = yL + 1
  const above = yU + 1
  const fBelow = polyEval(poly, below)
  const fMid = polyEval(poly, mid)
  const fAbove = polyEval(poly, above)
  const startsAboveLower = rng.chance(0.5)
  const y0 = startsAboveLower ? yL + rng.int(1, gap + 3) : rng.int(1, yL - 1)
  const correctId = startsAboveLower ? 'upper' : 'collapse'
  const options: ChoiceOption[] = rng.shuffle([
    { id: 'upper', label: `Approaches $y = ${yU}$` },
    { id: 'lower', label: `Approaches $y = ${yL}$` },
    { id: 'collapse', label: 'Declines toward extinction ($y \\to 0$)' },
  ])

  return {
    statement: `A population is modeled by $y' = f(y) = ${polyToLatex(poly, 'y')}$, starting from $y(0) = ${y0}$. What happens to the population as $t \\to \\infty$?`,
    answer: { kind: 'choice', options, correctId },
    solution: [
      {
        text: 'Find the equilibria by solving $f(y) = 0$:',
        tex: `f(y) = ${coefPrefix(-a)}${bracket(yL)}${bracket(yU)} = 0 \\;\\Longrightarrow\\; y = ${yL}, \\; y = ${yU}`,
      },
      {
        text: `Check the sign of $f$ below $y=${yL}$, between the two equilibria, and above $y=${yU}$:`,
        tex: `f(${below}) = ${fBelow}, \\qquad f(${mid}) = ${fMid}, \\qquad f(${above}) = ${fAbove}`,
      },
      {
        text: startsAboveLower
          ? `Since $y(0) = ${y0}$ lies above the lower equilibrium $y = ${yL}$, and $f$ points toward $y = ${yU}$ on that entire range, the population approaches $y = ${yU}$.`
          : `Since $y(0) = ${y0}$ lies below $y = ${yL}$, where $f(y) < 0$, the population keeps shrinking and declines toward extinction.`,
      },
    ],
    hints: HINTS_APPROACH,
  }
}

/** The equilibria of ry(1-y/K) = h collide (equal discriminant zero) exactly at h = rK/4. */
function harvestCollision(rng: Rng): Problem {
  const kBase = rng.int(1, 3)
  const capacity = 4 * kBase
  const r = rng.int(1, 6)
  const hCrit = r * kBase
  const peak = capacity / 2

  return {
    statement: `A population is modeled by the harvested logistic equation $y' = ry\\left(1-\\dfrac{y}{K}\\right) - h$, with $r = ${r}$ and $K = ${capacity}$. As the harvesting rate $h$ increases, the two equilibria move toward each other. At what harvesting rate $h$ do they collide into a single equilibrium (the maximum sustainable harvest rate)?`,
    answer: { kind: 'number', value: String(hCrit) },
    solution: [
      { text: 'The equilibria satisfy $ry(1-y/K) = h$, a quadratic equation in $y$:', tex: `-\\frac{${r}}{${capacity}}y^{2} + ${r}y - h = 0` },
      {
        text: 'Two equilibria exist while this quadratic has a positive discriminant; they merge into one exactly when the discriminant is zero:',
        tex: `${r}^{2} - 4\\cdot\\frac{${r}}{${capacity}}\\cdot h = 0 \\;\\Longrightarrow\\; h = \\frac{${r}\\cdot ${capacity}}{4} = ${hCrit}`,
      },
      { text: `At that harvesting rate the single remaining equilibrium sits at $y = K/2 = ${peak}$.` },
    ],
    hints: HINTS_HARVEST,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? populationApproach(rng) : harvestCollision(rng)
}

export const template: SkillTemplate = {
  skillId: 'equilibria',
  theory,
  expectedSeconds: { 1: 90, 2: 100, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
