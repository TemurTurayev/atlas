import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = `Projectile motion decomposes into independent horizontal ($v_x = v_0 \\cos\\alpha$) and vertical ($v_y = v_0 \\sin\\alpha - gt$) components.
Time of flight: $T = \\frac{2 v_0 \\sin\\alpha}{g}$. Maximum height: $H = \\frac{v_0^2 \\sin^2\\alpha}{2g}$. Range: $R = \\frac{v_0^2 \\sin 2\\alpha}{g}$.
For horizontal launch from height $h$: falling time $t = \\sqrt{\\frac{2h}{g}}$ and range $d = v_0 \\sqrt{\\frac{2h}{g}}$.
(Throughout physics problems, use $g = 10\\text{ m/s}^2$ unless stated otherwise.)
Common mistakes: Forgetting to resolve initial velocity into horizontal and vertical components before applying kinematic equations.`

function tier1(rng: Rng): Problem {
  const shape = rng.pick(['horizontal_time_distance', 'time_of_flight', 'max_height', 'vertical_fall_time'] as const)

  if (shape === 'horizontal_time_distance') {
    const tFall = rng.pick([1, 2, 3, 4, 5, 6, 7, 8])
    const h = 5 * tFall * tFall
    const v0 = 5 * rng.int(2, 12)
    const d = v0 * tFall

    return {
      statement: `A projectile is launched horizontally at $v_0 = ${v0}$ m/s from a cliff of height $h = ${h}$ m. Find the horizontal landing distance in meters. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: String(d) },
      solution: [
        { text: 'Find falling time $t = \\sqrt{\\frac{2h}{g}}$ and horizontal distance $d = v_0 t$:' },
        { text: 'Compute distance:', tex: `t = \\sqrt{\\frac{2 \\cdot ${h}}{10}} = ${tFall} \\text{ s}, \\quad d = ${v0} \\cdot ${tFall} = ${d}` },
      ],
      hints: [
        'Calculate vertical fall time using $h = \\frac{1}{2}gt^2$.',
        `$t = \\sqrt{\\frac{2 \\cdot ${h}}{10}} = ${tFall}$ s. Then $d = v_0 t$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'time_of_flight') {
    const angleDeg = rng.pick([30, 90])
    const v0 = 10 * rng.int(1, 12)
    const sinAlpha = angleDeg === 30 ? 0.5 : 1
    const T = (2 * v0 * sinAlpha) / 10

    return {
      statement: `A ball is launched from ground level at $v_0 = ${v0}$ m/s at an angle of $\\alpha = ${angleDeg}^\\circ$ above the horizontal. Find its total time of flight in seconds. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: String(T) },
      solution: [
        { text: 'Use the total time of flight formula $T = \\frac{2 v_0 \\sin\\alpha}{g}$:' },
        { text: 'Compute:', tex: `T = \\frac{2 \\cdot ${v0} \\cdot \\sin(${angleDeg}^\\circ)}{10} = ${T}` },
      ],
      hints: [
        'Recall $T = \\frac{2 v_0 \\sin\\alpha}{g}$.',
        `For $\\alpha = ${angleDeg}^\\circ$, $\\sin(${angleDeg}^\\circ) = ${sinAlpha}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'max_height') {
    const angleDeg = rng.pick([30, 45, 60, 90])
    let v0: number
    let H: number
    if (angleDeg === 30) {
      v0 = 20 * rng.int(1, 6)
      H = (v0 * v0) / 80
    } else if (angleDeg === 45) {
      v0 = 20 * rng.int(1, 6)
      H = (v0 * v0) / 40
    } else if (angleDeg === 60) {
      v0 = 20 * rng.int(1, 5)
      H = (3 * v0 * v0) / 80
    } else {
      v0 = 10 * rng.int(1, 10)
      H = (v0 * v0) / 20
    }

    return {
      statement: `A projectile is launched from ground level with speed $v_0 = ${v0}$ m/s at an angle of $\\alpha = ${angleDeg}^\\circ$. Find the maximum height $H$ reached in meters. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: String(H) },
      solution: [
        { text: 'Use the maximum height formula $H = \\frac{v_0^2 \\sin^2\\alpha}{2g}$:' },
        { text: 'Compute maximum height:', tex: `H = \\frac{${v0}^2 \\cdot \\sin^2(${angleDeg}^\\circ)}{20} = ${H}` },
      ],
      hints: [
        'Recall $H = \\frac{v_0^2 \\sin^2\\alpha}{2g}$.',
        'Square the vertical component of velocity and divide by $2g = 20$.',
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const tFall = rng.pick([1, 2, 3, 4, 5, 6, 7, 8])
  const h = 5 * tFall * tFall

  return {
    statement: `An object is dropped from rest from a height of $h = ${h}$ m. Find the time it takes to reach the ground in seconds. (Use $g = 10$ m/s$^2$.)`,
    answer: { kind: 'number', value: String(tFall) },
    solution: [
      { text: 'Use $h = \\frac{1}{2}gt^2$:' },
      { text: 'Compute time:', tex: `t = \\sqrt{\\frac{2h}{g}} = \\sqrt{\\frac{2 \\cdot ${h}}{10}} = ${tFall}` },
    ],
    hints: [
      'Recall $h = \\frac{1}{2} g t^2$.',
      `$t = \\sqrt{\\frac{2h}{g}} = \\sqrt{\\frac{${2 * h}}{10}} = ${tFall}$.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier2(rng: Rng): Problem {
  const shape = rng.pick(['range_with_radicals', 'find_initial_speed_from_h_and_d', 'speed_at_max_height', 'vertical_speed_before_impact'] as const)

  if (shape === 'range_with_radicals') {
    const angleDeg = rng.pick([30, 45, 60])
    const k = rng.int(1, 10)
    const v0 = 10 * k
    let valLatex: string
    if (angleDeg === 45) {
      const R = 10 * k * k
      valLatex = String(R)
    } else {
      const coeff = 5 * k * k
      valLatex = `${coeff}\\sqrt{3}`
    }

    return {
      statement: `A projectile is launched from ground level at $v_0 = ${v0}$ m/s at an angle of $\\alpha = ${angleDeg}^\\circ$. Find its horizontal range $R$ in meters. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: valLatex },
      solution: [
        { text: 'Use the range formula $R = \\frac{v_0^2 \\sin(2\\alpha)}{g}$:' },
        { text: 'Substitute values:', tex: `R = \\frac{${v0}^2 \\cdot \\sin(${2 * angleDeg}^\\circ)}{10} = ${valLatex}` },
      ],
      hints: [
        'Recall $R = \\frac{v_0^2 \\sin(2\\alpha)}{g}$.',
        `For $\\alpha = ${angleDeg}^\\circ$, $\\sin(2\\alpha) = \\sin(${2 * angleDeg}^\\circ)$.`,
      ],
      inputHint: 'Enter an exact expression like 15\\sqrt{3} or an integer.',
    }
  }

  if (shape === 'find_initial_speed_from_h_and_d') {
    const tFall = rng.pick([1, 2, 3, 4, 5, 6])
    const h = 5 * tFall * tFall
    const v0 = 10 * rng.int(1, 8)
    const d = v0 * tFall

    return {
      statement: `A projectile is launched horizontally from a cliff of height $h = ${h}$ m and lands a horizontal distance of $d = ${d}$ m away. Find the initial launch speed $v_0$ in m/s. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: String(v0) },
      solution: [
        { text: 'First calculate fall time $t = \\sqrt{\\frac{2h}{g}}$, then $v_0 = \\frac{d}{t}$:' },
        { text: 'Compute launch speed:', tex: `t = \\sqrt{\\frac{2 \\cdot ${h}}{10}} = ${tFall} \\text{ s}, \\quad v_0 = \\frac{${d}}{${tFall}} = ${v0}` },
      ],
      hints: [
        'Find fall time $t$ from vertical height $h$.',
        `$t = ${tFall}$ s. Divide horizontal distance $d = ${d}$ m by $t$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'speed_at_max_height') {
    const angleDeg = rng.pick([30, 45, 60])
    const k = 2 * rng.int(1, 8)
    const v0 = 10 * k
    let valLatex: string
    if (angleDeg === 60) {
      valLatex = String(5 * k)
    } else if (angleDeg === 30) {
      valLatex = `${5 * k}\\sqrt{3}`
    } else {
      valLatex = `${5 * k}\\sqrt{2}`
    }

    return {
      statement: `A projectile is launched at $v_0 = ${v0}$ m/s at an angle of $\\alpha = ${angleDeg}^\\circ$ above the horizontal. Find its speed at the apex (maximum height) of its trajectory in m/s. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: valLatex },
      solution: [
        { text: 'At maximum height, vertical velocity is zero ($v_y = 0$), so total speed is $v_x = v_0 \\cos\\alpha$:' },
        { text: 'Compute apex speed:', tex: `v_{\\text{apex}} = ${v0} \\cdot \\cos(${angleDeg}^\\circ) = ${valLatex}` },
      ],
      hints: [
        'At the highest point, vertical velocity $v_y = 0$.',
        'The speed is simply the horizontal component $v_x = v_0 \\cos\\alpha$.',
      ],
      inputHint: 'Enter an exact expression like 10\\sqrt{3} or an integer.',
    }
  }

  const tFall = rng.pick([1, 2, 3, 4, 5, 6])
  const h = 5 * tFall * tFall
  const v0 = 5 * rng.int(2, 10)
  const vy = 10 * tFall

  return {
    statement: `A ball is launched horizontally at $v_0 = ${v0}$ m/s from height $h = ${h}$ m. Find the magnitude of its vertical velocity component just before landing, in m/s. (Use $g = 10$ m/s$^2$.)`,
    answer: { kind: 'number', value: String(vy) },
    solution: [
      { text: 'Vertical speed at ground depends only on fall height: $v_y = \\sqrt{2gh}$:' },
      { text: 'Compute vertical speed:', tex: `v_y = \\sqrt{20 \\cdot ${h}} = ${vy}` },
    ],
    hints: [
      'Use $v_y = \\sqrt{2gh}$.',
      `$v_y = \\sqrt{20 \\cdot ${h}} = ${vy}$ m/s.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier3(rng: Rng): Problem {
  const shape = rng.pick(['impact_speed', 'max_range_angle_choice', 'find_v0_from_H', 'time_to_reach_height'] as const)

  if (shape === 'impact_speed') {
    const tFall = rng.pick([1, 2, 3, 4, 5, 6])
    const h = 5 * tFall * tFall
    const vy = 10 * tFall
    const v0 = rng.pick([5, 10, 15, 20, 24, 25, 30, 35, 40, 45, 50, 60])
    const v2 = v0 * v0 + vy * vy
    const vInt = Math.round(Math.sqrt(v2))
    const isExactInt = vInt * vInt === v2

    let valLatex: string
    if (isExactInt) {
      valLatex = String(vInt)
    } else {
      let d = 1
      for (let i = 2; i * i <= v2; i += 1) {
        if (v2 % (i * i) === 0) d = i
      }
      const rem = v2 / (d * d)
      valLatex = d === 1 ? `\\sqrt{${v2}}` : `${d}\\sqrt{${rem}}`
    }

    return {
      statement: `A projectile is launched horizontally at $v_0 = ${v0}$ m/s from a cliff of height $h = ${h}$ m. Find its speed upon landing in m/s. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: valLatex },
      solution: [
        { text: 'Landing speed is $v = \\sqrt{v_0^2 + v_y^2}$ where vertical speed at ground is $v_y = \\sqrt{2gh}$:' },
        { text: 'Compute landing speed:', tex: `v_y = \\sqrt{20 \\cdot ${h}} = ${vy} \\text{ m/s}, \\quad v = \\sqrt{${v0}^2 + ${vy}^2} = ${valLatex}` },
      ],
      hints: [
        'Compute vertical impact velocity $v_y = \\sqrt{2gh}$.',
        `Combine horizontal $v_0 = ${v0}$ and vertical $v_y = ${vy}$ using Pythagoras $v = \\sqrt{v_0^2 + v_y^2}$.`,
      ],
      inputHint: 'Enter an exact radical or integer.',
    }
  }

  if (shape === 'max_range_angle_choice') {
    const conceptKind = rng.pick(['max_range', 'equal_range'] as const)
    let statementText: string
    let correctId: string
    let correctLabel: string
    let options: ChoiceOption[]

    if (conceptKind === 'max_range') {
      statementText = 'For a given initial launch speed $v_0$ on flat ground, which launch angle $\\alpha$ maximizes the horizontal range? (Use $g = 10$ m/s$^2$.)'
      correctId = 'a45'
      correctLabel = '$45^\\circ$'
      options = rng.shuffle([
        { id: 'a30', label: '$30^\\circ$' },
        { id: 'a45', label: '$45^\\circ$' },
        { id: 'a60', label: '$60^\\circ$' },
        { id: 'a90', label: '$90^\\circ$' },
      ])
    } else {
      statementText = 'Which pair of launch angles yields the exact same horizontal range for a given initial speed $v_0$? (Use $g = 10$ m/s$^2$.)'
      correctId = 'pair3060'
      correctLabel = '$30^\\circ$ and $60^\\circ$'
      options = rng.shuffle([
        { id: 'pair3060', label: '$30^\\circ$ and $60^\\circ$' },
        { id: 'pair1545', label: '$15^\\circ$ and $45^\\circ$' },
        { id: 'pair4590', label: '$45^\\circ$ and $90^\\circ$' },
        { id: 'pair2050', label: '$20^\\circ$ and $50^\\circ$' },
      ])
    }

    return {
      statement: statementText,
      answer: { kind: 'choice', options, correctId },
      solution: [
        { text: `Range depends on $\\sin(2\\alpha)$, which is maximized or symmetric around $\\alpha = 45^\\circ$, giving ${correctLabel}.` },
      ],
      hints: [
        'Consider the term $\\sin(2\\alpha)$ in the range formula.',
      ],
    }
  }

  if (shape === 'find_v0_from_H') {
    const angleDeg = rng.pick([30, 45, 60, 90])
    let v0: number
    let H: number
    if (angleDeg === 30) {
      v0 = 20 * rng.int(1, 15)
      H = (v0 * v0) / 80
    } else if (angleDeg === 45) {
      v0 = 20 * rng.int(1, 15)
      H = (v0 * v0) / 40
    } else if (angleDeg === 60) {
      v0 = 20 * rng.int(1, 12)
      H = (3 * v0 * v0) / 80
    } else {
      v0 = 10 * rng.int(1, 20)
      H = (v0 * v0) / 20
    }

    return {
      statement: `A projectile launched at an angle of $\\alpha = ${angleDeg}^\\circ$ reaches a maximum height of $H = ${H}$ m. Find its initial launch speed $v_0$ in m/s. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: String(v0) },
      solution: [
        { text: 'Rearrange $H = \\frac{v_0^2 \\sin^2\\alpha}{2g}$ for launch speed $v_0$:' },
        { text: 'Compute launch speed:', tex: `v_0 = \\frac{\\sqrt{2gH}}{\\sin\\alpha} = \\sqrt{\\frac{20 \\cdot ${H}}{\\sin^2(${angleDeg}^\\circ)}} = ${v0}` },
      ],
      hints: [
        'Use $H = \\frac{v_0^2 \\sin^2\\alpha}{2g}$.',
        `Solve $v_0 = \\frac{\\sqrt{20H}}{\\sin(${angleDeg}^\\circ)}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const v0 = 10 * rng.int(1, 20)
  const tTop = v0 / 10

  return {
    statement: `A ball is thrown vertically upward from ground level at $v_0 = ${v0}$ m/s. Find the time in seconds it takes to reach the peak of its flight. (Use $g = 10$ m/s$^2$.)`,
    answer: { kind: 'number', value: String(tTop) },
    solution: [
      { text: 'At peak height, $v = 0 = v_0 - gt \\implies t = \\frac{v_0}{g}$:' },
      { text: 'Compute time:', tex: `t = \\frac{${v0}}{10} = ${tTop}` },
    ],
    hints: [
      'At the highest point, vertical speed is 0.',
      `$t = \\frac{v_0}{g} = \\frac{${v0}}{10} = ${tTop}$ s.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

export const template: SkillTemplate = {
  skillId: 'projectile',
  theory,
  expectedSeconds: { 1: 45, 2: 70, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
