import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Expected value of a discrete random variable $X$: $E[X] = \\mu = \\sum_i x_i P(X = x_i)$.',
  'Variance measures spread: $\\text{Var}(X) = \\sigma^2 = E[(X - \\mu)^2] = E[X^2] - (E[X])^2$, where $E[X^2] = \\sum_i x_i^2 P(X = x_i)$.',
  'Standard deviation is the square root of variance: $\\sigma = \\sqrt{\\text{Var}(X)}$.',
  'Linear transformations of expectation: $E[aX + b] = a E[X] + b$.',
  'Linear transformations of variance: $\\text{Var}(aX + b) = a^2 \\text{Var}(X)$, where constant shift $b$ drops out.',
  'Standard deviation linear transformation: $\\text{SD}(aX + b) = |a| \\text{SD}(X)$.',
  'Common mistakes: forgetting to square $E[X]$ in $\\text{Var}(X) = E[X^2] - (E[X])^2$, or keeping constant $b$ when computing variance.',
].join('\n')

function expectedValueTable(rng: Rng): Problem {
  const xVals = rng.pick([
    [0, 1, 2, 3],
    [1, 2, 3, 4],
    [-1, 0, 1, 2],
    [0, 2, 4, 6],
    [1, 3, 5, 7],
    [-2, -1, 0, 1],
  ])

  const pNums = rng.pick([
    [1, 3, 4, 2],
    [2, 3, 3, 2],
    [1, 4, 3, 2],
    [2, 2, 4, 2],
    [1, 2, 5, 2],
    [3, 1, 2, 4],
    [1, 1, 4, 4],
    [2, 4, 1, 3],
  ])

  const exNum = xVals.reduce((acc, x, i) => acc + x * pNums[i], 0)
  const exRat = rat(exNum, 10)
  const exTex = ratToLatex(exRat)

  const unreducedTex = `\\frac{${exNum}}{10}`
  const texStep = unreducedTex === exTex ? exTex : `${unreducedTex} = ${exTex}`

  const tableRows = xVals.map((x, i) => `$P(X = ${x}) = \\frac{${pNums[i]}}{10}$`).join(', ')

  return {
    statement: `A discrete random variable $X$ has probability distribution: ${tableRows}. Find $E[X]$.`,
    answer: { kind: 'number', value: exTex },
    solution: [
      { text: 'Apply the expected value formula:', tex: 'E[X] = \\sum x_i P(X = x_i)' },
      {
        text: 'Multiply each value by its probability and sum:',
        tex: `E[X] = ${xVals.map((x, i) => `${x}\\left(\\frac{${pNums[i]}}{10}\\right)`).join(' + ')} = ${texStep}`,
      },
    ],
    hints: [
      'Multiply each value $x_i$ by its probability $P(X = x_i)$ and add them up.',
      `Evaluate $\\frac{${xVals.map((x, i) => `${x}(${pNums[i]})`).join(' + ')}}{10}$.`,
    ],
    inputHint: 'An exact fraction or decimal.',
  }
}

function expectLinearTransform(rng: Rng): Problem {
  const M = rng.int(2, 25)
  const a = rng.intExcept(-5, 8, [0])
  const b = rng.intExcept(-15, 15, [0])
  const newM = a * M + b
  const bSign = b > 0 ? `+ ${b}` : `- ${Math.abs(b)}`

  return {
    statement: `A random variable $X$ has expected value $E[X] = ${M}$. Find $E[${a}X ${bSign}]$.`,
    answer: { kind: 'number', value: String(newM) },
    solution: [
      { text: 'Apply the linearity property of expectation:', tex: 'E[aX + b] = a E[X] + b' },
      { text: `Substitute $E[X] = ${M}$, $a = ${a}$, and $b = ${b}$:`, tex: `E[${a}X ${bSign}] = ${a}(${M}) ${bSign} = ${newM}` },
    ],
    hints: [
      'Use the rule $E[aX + b] = a E[X] + b$.',
      `Multiply $${M}$ by $${a}$ and add $${b}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function gameExpectedValue(rng: Rng): Problem {
  const cost = rng.pick([2, 5, 10])
  const prize1 = rng.pick([20, 50, 100])
  const prize2 = rng.pick([5, 10, 15])
  const p1 = rng.pick([1, 2])
  const p2 = rng.pick([2, 3])
  const p0 = 10 - p1 - p2

  const net1 = prize1 - cost
  const net2 = prize2 - cost
  const net0 = -cost

  const exNum = p1 * net1 + p2 * net2 + p0 * net0
  const exRat = rat(exNum, 10)
  const exTex = ratToLatex(exRat)

  const unreducedTex = `\\frac{${exNum}}{10}`
  const texStep = unreducedTex === exTex ? exTex : `${unreducedTex} = ${exTex}`

  return {
    statement: `A game costs $${cost}$ to play. The game awards a jackpot prize of $${prize1}$ with probability $\\frac{${p1}}{10}$, a minor prize of $${prize2}$ with probability $\\frac{${p2}}{10}$, and no prize with probability $\\frac{${p0}}{10}$. Find the expected net gain (expected value minus ticket cost).`,
    answer: { kind: 'number', value: exTex },
    solution: [
      { text: 'Calculate the net gain for each outcome:', tex: `\\text{Jackpot: } ${prize1} - ${cost} = ${net1}, \\quad \\text{Minor: } ${prize2} - ${cost} = ${net2}, \\quad \\text{Loss: } -${cost}` },
      { text: 'Compute the expected net gain:', tex: `E[X] = ${net1}\\left(\\frac{${p1}}{10}\\right) + ${net2}\\left(\\frac{${p2}}{10}\\right) + (${net0})\\left(\\frac{${p0}}{10}\\right) = ${texStep}` },
    ],
    hints: [
      'Find the net payout for each outcome by subtracting the ticket cost.',
      'Multiply each net payout by its probability and sum them up.',
    ],
    inputHint: 'An exact fraction or decimal.',
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return expectedValueTable(rng)
  if (choice === 2) return expectLinearTransform(rng)
  return gameExpectedValue(rng)
}

function varianceTable(rng: Rng): Problem {
  const xVals = rng.pick([
    [0, 1, 2, 3],
    [1, 2, 3, 4],
    [-1, 0, 1, 2],
    [0, 2, 4, 6],
    [1, 3, 5, 7],
  ])

  const pNums = rng.pick([
    [1, 3, 4, 2],
    [2, 3, 3, 2],
    [1, 4, 3, 2],
    [2, 2, 4, 2],
    [1, 2, 5, 2],
    [3, 1, 2, 4],
  ])

  const exNum = xVals.reduce((acc, x, i) => acc + x * pNums[i], 0)
  const ex2Num = xVals.reduce((acc, x, i) => acc + x * x * pNums[i], 0)

  const varNum = 10 * ex2Num - exNum * exNum
  const varRat = rat(varNum, 100)
  const varTex = ratToLatex(varRat)

  const unreducedTex = `\\frac{${varNum}}{100}`
  const texStep = unreducedTex === varTex ? varTex : `${unreducedTex} = ${varTex}`

  const tableRows = xVals.map((x, i) => `$P(X = ${x}) = \\frac{${pNums[i]}}{10}$`).join(', ')

  return {
    statement: `A discrete random variable $X$ has probability distribution: ${tableRows}. Find $\\text{Var}(X)$.`,
    answer: { kind: 'number', value: varTex },
    solution: [
      { text: 'First compute $E[X]$ and $E[X^2]$:', tex: `E[X] = \\frac{${exNum}}{10}, \\quad E[X^2] = \\frac{${ex2Num}}{10}` },
      { text: 'Apply the variance formula $\\text{Var}(X) = E[X^2] - (E[X])^2$:', tex: `\\text{Var}(X) = \\frac{${ex2Num}}{10} - \\left(\\frac{${exNum}}{10}\\right)^2 = \\frac{${10 * ex2Num}}{100} - \\frac{${exNum * exNum}}{100} = ${texStep}` },
    ],
    hints: [
      'Compute $E[X]$ and $E[X^2]$ first, then use $\\text{Var}(X) = E[X^2] - (E[X])^2$.',
      `Evaluate $\\frac{${ex2Num}}{10} - \\left(\\frac{${exNum}}{10}\\right)^2$.`,
    ],
    inputHint: 'An exact fraction or decimal.',
  }
}

function varLinearTransform(rng: Rng): Problem {
  const V = rng.int(2, 20)
  const a = rng.intExcept(-6, 6, [-1, 0, 1])
  const b = rng.intExcept(-15, 15, [0])
  const bSign = b > 0 ? `+ ${b}` : `- ${Math.abs(b)}`
  const newV = a * a * V

  return {
    statement: `A random variable $X$ has variance $\\text{Var}(X) = ${V}$. Find $\\text{Var}(${a}X ${bSign})$.`,
    answer: { kind: 'number', value: String(newV) },
    solution: [
      { text: 'Apply the variance transformation rule:', tex: '\\text{Var}(aX + b) = a^2 \\text{Var}(X)' },
      { text: `Substitute $a = ${a}$ and $\\text{Var}(X) = ${V}$:`, tex: `\\text{Var}(${a}X ${bSign}) = (${a})^2 \\cdot ${V} = ${a * a} \\cdot ${V} = ${newV}` },
    ],
    hints: [
      'Recall that constant shifts do not affect variance: $\\text{Var}(aX + b) = a^2 \\text{Var}(X)$.',
      `Multiply $\\text{Var}(X) = ${V}$ by $a^2 = ${a * a}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function sdLinearTransform(rng: Rng): Problem {
  const S = rng.int(2, 15)
  const a = rng.intExcept(-8, 8, [-1, 0, 1])
  const b = rng.intExcept(-15, 15, [0])
  const bSign = b > 0 ? `+ ${b}` : `- ${Math.abs(b)}`
  const absA = Math.abs(a)
  const newS = absA * S

  return {
    statement: `A random variable $X$ has standard deviation $\\text{SD}(X) = ${S}$. Find $\\text{SD}(${a}X ${bSign})$.`,
    answer: { kind: 'number', value: String(newS) },
    solution: [
      { text: 'Apply the standard deviation transformation rule:', tex: '\\text{SD}(aX + b) = |a| \\text{SD}(X)' },
      { text: `Substitute $a = ${a}$ and $\\text{SD}(X) = ${S}$:`, tex: `\\text{SD}(${a}X ${bSign}) = |${a}| \\cdot ${S} = ${absA} \\cdot ${S} = ${newS}` },
    ],
    hints: [
      'Recall the standard deviation rule: $\\text{SD}(aX + b) = |a| \\text{SD}(X)$.',
      `Multiply $\\text{SD}(X) = ${S}$ by $|a| = ${absA}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return varianceTable(rng)
  if (choice === 2) return varLinearTransform(rng)
  return sdLinearTransform(rng)
}

function missingProbTable(rng: Rng): Problem {
  const xVals = rng.pick([
    [1, 2, 3, 4],
    [0, 1, 2, 3],
    [2, 4, 6, 8],
  ])

  const p1Int = rng.pick([1, 2, 3])
  const p2Int = rng.pick([2, 3, 4])
  const p3Int = rng.pick([1, 2, 3])
  const kInt = 10 - p1Int - p2Int - p3Int

  const p1Str = (p1Int / 10).toFixed(1)
  const p2Str = (p2Int / 10).toFixed(1)
  const p3Str = (p3Int / 10).toFixed(1)
  const kStr = (kInt / 10).toFixed(1)
  const sumKnownStr = ((p1Int + p2Int + p3Int) / 10).toFixed(1)

  const exNum = xVals[0] * p1Int + xVals[1] * p2Int + xVals[2] * p3Int + xVals[3] * kInt
  const exRat = rat(exNum, 10)
  const exTex = ratToLatex(exRat)

  const unreducedTex = `\\frac{${exNum}}{10}`
  const texStep = unreducedTex === exTex ? exTex : `${unreducedTex} = ${exTex}`

  return {
    statement: `A discrete random variable $X$ takes values $${xVals.join(', ')}$ with $P(X=${xVals[0]}) = ${p1Str}$, $P(X=${xVals[1]}) = ${p2Str}$, $P(X=${xVals[2]}) = ${p3Str}$, and $P(X=${xVals[3]}) = k$. Find $E[X]$.`,
    answer: { kind: 'number', value: exTex },
    solution: [
      { text: 'Find $k$ using the probability axiom $\\sum P(X = x_i) = 1$:', tex: `k = 1 - (${p1Str} + ${p2Str} + ${p3Str}) = 1 - ${sumKnownStr} = ${kStr}` },
      { text: 'Compute $E[X]$ with all four probabilities:', tex: `E[X] = ${xVals[0]}(${p1Str}) + ${xVals[1]}(${p2Str}) + ${xVals[2]}(${p3Str}) + ${xVals[3]}(${kStr}) = ${texStep}` },
    ],
    hints: [
      `First find $k = 1 - (${p1Str} + ${p2Str} + ${p3Str})$.`,
      `Calculate $${xVals[0]}(${p1Str}) + ${xVals[1]}(${p2Str}) + ${xVals[2]}(${p3Str}) + ${xVals[3]}(k)$.`,
    ],
    inputHint: 'An exact fraction or decimal.',
  }
}

function indepVarLinearCombo(rng: Rng): Problem {
  const vX = rng.int(2, 15)
  const vY = rng.int(2, 15)
  const a = rng.int(2, 6)
  const b = rng.int(2, 6)
  const isMinus = rng.chance(0.5)
  const signStr = isMinus ? '-' : '+'

  const val = a * a * vX + b * b * vY

  return {
    statement: `Let $X$ and $Y$ be independent random variables with variances $\\text{Var}(X) = ${vX}$ and $\\text{Var}(Y) = ${vY}$. Find $\\text{Var}(${a}X ${signStr} ${b}Y)$.`,
    answer: { kind: 'number', value: String(val) },
    solution: [
      { text: 'Apply the variance formula for independent linear combinations:', tex: '\\text{Var}(aX \\pm bY) = a^2 \\text{Var}(X) + b^2 \\text{Var}(Y)' },
      { text: `Substitute $a = ${a}$, $b = ${b}$, $\\text{Var}(X) = ${vX}$, and $\\text{Var}(Y) = ${vY}$:`, tex: `\\text{Var}(${a}X ${signStr} ${b}Y) = (${a})^2 (${vX}) + (${b})^2 (${vY}) = ${a * a} \\cdot ${vX} + ${b * b} \\cdot ${vY} = ${val}` },
    ],
    hints: [
      'For independent variables, variances add: $\\text{Var}(aX \\pm bY) = a^2 \\text{Var}(X) + b^2 \\text{Var}(Y)$.',
      `Compute $(${a})^2 (${vX}) + (${b})^2 (${vY})$.`,
    ],
    inputHint: 'An integer.',
  }
}

function expectedSumTwoVars(rng: Rng): Problem {
  const mX = rng.int(5, 30)
  const mY = rng.int(5, 30)
  const a = rng.intExcept(-5, 6, [0])
  const b = rng.intExcept(-5, 6, [0])
  const c = rng.intExcept(-10, 10, [0])
  const bSign = b > 0 ? `+ ${b}` : `- ${Math.abs(b)}`
  const cSign = c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`

  const val = a * mX + b * mY + c

  return {
    statement: `Random variables $X$ and $Y$ have expected values $E[X] = ${mX}$ and $E[Y] = ${mY}$. Find $E[${a}X ${bSign}Y ${cSign}]$.`,
    answer: { kind: 'number', value: String(val) },
    solution: [
      { text: 'Apply linearity of expectation $E[aX + bY + c] = a E[X] + b E[Y] + c$:', tex: `E[${a}X ${bSign}Y ${cSign}] = ${a}(${mX}) ${bSign}(${mY}) ${cSign} = ${val}` },
    ],
    hints: [
      'Linearity of expectation holds for any random variables: $E[aX + bY + c] = a E[X] + b E[Y] + c$.',
      `Evaluate $${a}(${mX}) + (${b})(${mY}) + (${c})$.`,
    ],
    inputHint: 'An integer.',
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return missingProbTable(rng)
  if (choice === 2) return indepVarLinearCombo(rng)
  return expectedSumTwoVars(rng)
}

export const template: SkillTemplate = {
  skillId: 'random_vars',
  theory,
  expectedSeconds: { 1: 60, 2: 75, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
