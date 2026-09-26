import { coefPrefix } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'In cylindrical coordinates $(\\rho, \\phi, z)$, $\\rho = \\sqrt{x^2+y^2}$ is the radial distance in the $xy$-plane, ' +
    '$\\phi \\in [0, 2\\pi)$ is the azimuth angle, and $z$ is height.',
  'Physics convention for spherical $(r, \\theta, \\phi)$: $r = \\sqrt{x^2+y^2+z^2} \\ge 0$ is the distance from origin, ' +
    '$\\theta \\in [0, \\pi]$ is the polar angle from $+z$-axis, and $\\phi \\in [0, 2\\pi)$ is azimuth in $xy$-plane.',
  'Transformations: $x = r \\sin\\theta \\cos\\phi$, $y = r \\sin\\theta \\sin\\phi$, $z = r \\cos\\theta$, $\\rho = r \\sin\\theta$.',
  'Volume elements: $dV = \\rho \\, d\\rho \\, d\\phi \\, dz$ in cylindrical; $dV = r^2 \\sin\\theta \\, dr \\, d\\theta \\, d\\phi$ in spherical.',
  'Standard surfaces: $r = c$ is a sphere of radius $c$, $\\rho = c$ is a cylinder of radius $c$, $\\theta = c$ is a cone.',
  'Common mistakes: confusing polar angle $\\theta$ (from $+z$-axis) with azimuth $\\phi$ (in $xy$-plane); forgetting $r^2 \\sin\\theta$.',
].join('\n')

const HINTS_CONVERT = [
  'Recall the physics convention: theta is the polar angle from the +z axis, phi is the azimuth angle in the xy-plane.',
  'Use x = r sin(theta) cos(phi), y = r sin(theta) sin(phi), z = r cos(theta) for spherical, or x = rho cos(phi), y = rho sin(phi) for cylindrical.',
]
const HINTS_SURFACE = [
  'In spherical coordinates (physics convention), r is distance to origin, theta is angle from +z axis, phi is angle in xy-plane.',
  'Fixing r = c gives points at fixed distance c from origin (a sphere); fixing rho = c gives points at fixed distance in xy-plane (a cylinder).',
]
const HINTS_VOLUME_ELEM = [
  'The volume element includes scale factors for curved coordinate grid lines.',
  'In spherical coordinates, dV = r^2 sin(theta) dr dtheta dphi; in cylindrical, dV = rho drho dphi dz.',
]
const HINTS_INTEGRAL = [
  'Set up the triple integral with the appropriate volume element dV.',
  'Integrate each variable within its given bounds and multiply by any constant factors.',
]

const VECTOR_HINT = 'Three components (x, y, z) or (rho, phi, z) or (r, theta, phi)'
const NUMBER_HINT = 'A single number; write as a multiple of pi if needed, e.g. 18pi'

interface AngleSpec {
  readonly latex: string
  readonly rad: number
  readonly sin: number
  readonly cos: number
  readonly sinLatex: string
  readonly cosLatex: string
}

const ANGLES: readonly AngleSpec[] = [
  { latex: '0', rad: 0, sin: 0, cos: 1, sinLatex: '0', cosLatex: '1' },
  { latex: '\\frac{\\pi}{6}', rad: Math.PI / 6, sin: 0.5, cos: Math.sqrt(3) / 2, sinLatex: '\\frac{1}{2}', cosLatex: '\\frac{\\sqrt{3}}{2}' },
  { latex: '\\frac{\\pi}{4}', rad: Math.PI / 4, sin: Math.SQRT1_2, cos: Math.SQRT1_2, sinLatex: '\\frac{\\sqrt{2}}{2}', cosLatex: '\\frac{\\sqrt{2}}{2}' },
  { latex: '\\frac{\\pi}{3}', rad: Math.PI / 3, sin: Math.sqrt(3) / 2, cos: 0.5, sinLatex: '\\frac{\\sqrt{3}}{2}', cosLatex: '\\frac{1}{2}' },
  { latex: '\\frac{\\pi}{2}', rad: Math.PI / 2, sin: 1, cos: 0, sinLatex: '1', cosLatex: '0' },
  { latex: '\\frac{2\\pi}{3}', rad: (2 * Math.PI) / 3, sin: Math.sqrt(3) / 2, cos: -0.5, sinLatex: '\\frac{\\sqrt{3}}{2}', cosLatex: '-\\frac{1}{2}' },
  { latex: '\\frac{3\\pi}{4}', rad: (3 * Math.PI) / 4, sin: Math.SQRT1_2, cos: -Math.SQRT1_2, sinLatex: '\\frac{\\sqrt{2}}{2}', cosLatex: '-\\frac{\\sqrt{2}}{2}' },
  { latex: '\\frac{5\\pi}{6}', rad: (5 * Math.PI) / 6, sin: 0.5, cos: -Math.sqrt(3) / 2, sinLatex: '\\frac{1}{2}', cosLatex: '-\\frac{\\sqrt{3}}{2}' },
  { latex: '\\pi', rad: Math.PI, sin: 0, cos: -1, sinLatex: '0', cosLatex: '-1' },
]

function formatProd(c: number, term: string): string {
  if (c === 0 || term === '0') return '0'
  if (term === '1') return String(c)
  if (term === '-1') return String(-c)
  if (c === 1) return term
  if (c === -1) return term.startsWith('-') ? term.slice(1) : `-${term}`
  return `${coefPrefix(c)}${term}`
}

function dotTerm(c: number, term: string): string {
  if (term.startsWith('-')) return `${c}\\cdot\\left(${term}\\right)`
  return `${c}\\cdot${term}`
}

function formatRadical(k: number, radLatex: string): string {
  if (k === 0 || radLatex === '0') return '0'
  if (radLatex === '1') return String(2 * k)
  if (radLatex === '-1') return String(-2 * k)
  if (radLatex === '\\frac{1}{2}') return k === 1 ? '1' : k === -1 ? '-1' : String(k)
  if (radLatex === '-\\frac{1}{2}') return k === 1 ? '-1' : k === -1 ? '1' : String(-k)
  if (radLatex === '\\frac{\\sqrt{3}}{2}') return k === 1 ? '\\sqrt{3}' : k === -1 ? '-\\sqrt{3}' : `${k}\\sqrt{3}`
  if (radLatex === '-\\frac{\\sqrt{3}}{2}') return k === 1 ? '-\\sqrt{3}' : k === -1 ? '\\sqrt{3}' : `${-k}\\sqrt{3}`
  if (radLatex === '\\frac{\\sqrt{2}}{2}') return k === 1 ? '\\sqrt{2}' : k === -1 ? '-\\sqrt{2}' : `${k}\\sqrt{2}`
  if (radLatex === '-\\frac{\\sqrt{2}}{2}') return k === 1 ? '-\\sqrt{2}' : k === -1 ? '\\sqrt{2}' : `${-k}\\sqrt{2}`
  return formatProd(k, radLatex)
}

function tier1(rng: Rng): Problem {
  const shape = rng.pick(['cyl_to_cart', 'cart_to_cyl', 'sph_to_cart', 'surface_choice'] as const)
  const conventionPreamble = 'Physics convention: $\\theta$ is the polar angle from $+z$-axis, $\\phi$ the azimuth in $xy$-plane.'

  if (shape === 'cyl_to_cart') {
    const rho = rng.pick([2, 4, 6])
    const phiSpec = rng.pick(ANGLES)
    const z = rng.int(-5, 5)
    const k = rho / 2
    const xLatex = formatRadical(k, phiSpec.cosLatex)
    const yLatex = formatRadical(k, phiSpec.sinLatex)

    return {
      statement: `${conventionPreamble} Convert the cylindrical point $P\\left(${rho}, ${phiSpec.latex}, ${z}\\right)$ to Cartesian coordinates $(x,y,z)$.`,
      answer: { kind: 'vector', components: [xLatex, yLatex, String(z)] },
      solution: [
        { text: 'Use $x = \\rho \\cos\\phi$, $y = \\rho \\sin\\phi$, and $z$ unchanged:' },
        { text: 'Compute components:', tex: `x = ${dotTerm(rho, phiSpec.cosLatex)} = ${xLatex}, \\quad y = ${dotTerm(rho, phiSpec.sinLatex)} = ${yLatex}, \\quad z = ${z}` },
      ],
      hints: HINTS_CONVERT,
      inputHint: VECTOR_HINT,
    }
  }

  if (shape === 'cart_to_cyl') {
    const rho = rng.pick([2, 4, 6])
    const phiSpec = rng.pick(ANGLES.filter((a) => a.rad <= Math.PI))
    const z = rng.int(-4, 4)
    const k = rho / 2
    const xLatex = formatRadical(k, phiSpec.cosLatex)
    const yLatex = formatRadical(k, phiSpec.sinLatex)

    return {
      statement: `${conventionPreamble} Convert the Cartesian point $P\\left(${xLatex}, ${yLatex}, ${z}\\right)$ to cylindrical coordinates $(\\rho, \\phi, z)$.`,
      answer: { kind: 'vector', components: [String(rho), phiSpec.latex, String(z)] },
      solution: [
        { text: 'Use $\\rho = \\sqrt{x^2+y^2}$ and $\\phi = \\operatorname{atan2}(y,x)$:' },
        { text: 'Compute:', tex: `\\rho = ${rho}, \\quad \\phi = ${phiSpec.latex}, \\quad z = ${z}` },
      ],
      hints: HINTS_CONVERT,
      inputHint: VECTOR_HINT,
    }
  }

  if (shape === 'sph_to_cart') {
    const r = rng.pick([2, 4])
    const thetaSpec = rng.pick(ANGLES.filter((a) => a.rad > 0 && a.rad < Math.PI))
    const phiSpec = rng.pick([ANGLES[0], ANGLES[4], ANGLES[8]])
    const k = r / 2
    let xLatex: string
    let yLatex: string
    if (phiSpec.cos === 0) xLatex = '0'
    else if (phiSpec.cos === 1) xLatex = formatRadical(k, thetaSpec.sinLatex)
    else xLatex = formatRadical(-k, thetaSpec.sinLatex)

    if (phiSpec.sin === 0) yLatex = '0'
    else if (phiSpec.sin === 1) yLatex = formatRadical(k, thetaSpec.sinLatex)
    else yLatex = formatRadical(-k, thetaSpec.sinLatex)

    const zLatex = formatRadical(k, thetaSpec.cosLatex)

    return {
      statement: `${conventionPreamble} Convert the spherical point $P\\left(${r}, ${thetaSpec.latex}, ${phiSpec.latex}\\right)$ to Cartesian coordinates $(x,y,z)$.`,
      answer: { kind: 'vector', components: [xLatex, yLatex, zLatex] },
      solution: [
        { text: 'Use $x = r \\sin\\theta \\cos\\phi$, $y = r \\sin\\theta \\sin\\phi$, $z = r \\cos\\theta$:' },
        { text: 'Compute components:', tex: `x = ${xLatex}, \\quad y = ${yLatex}, \\quad z = ${zLatex}` },
      ],
      hints: HINTS_CONVERT,
      inputHint: VECTOR_HINT,
    }
  }

  const surfaceKind = rng.pick(['sphere', 'cylinder', 'cone'] as const)
  let eq: string
  let correctId: string
  let correctLabel: string
  if (surfaceKind === 'sphere') {
    const c = rng.int(2, 6)
    eq = `r = ${c}`
    correctId = 'sphere'
    correctLabel = `A sphere of radius ${c} centered at the origin`
  } else if (surfaceKind === 'cylinder') {
    const c = rng.int(2, 6)
    eq = `\\rho = ${c}`
    correctId = 'cylinder'
    correctLabel = `A cylinder of radius ${c} centered on the z-axis`
  } else {
    eq = '\\theta = \\frac{\\pi}{4}'
    correctId = 'cone'
    correctLabel = 'A cone opening along the positive z-axis at angle $\\frac{\\pi}{4}$'
  }

  const allOptions: ChoiceOption[] = [
    { id: 'sphere', label: 'A sphere of radius 3 centered at the origin' },
    { id: 'cylinder', label: 'A cylinder of radius 3 centered on the z-axis' },
    { id: 'cone', label: 'A cone opening along the positive z-axis at angle $\\frac{\\pi}{4}$' },
    { id: 'plane', label: 'A horizontal plane' },
  ]
  const options = rng.shuffle(allOptions.map((o) => (o.id === correctId ? { id: correctId, label: correctLabel } : o)))

  return {
    statement: `${conventionPreamble} Which geometric surface is described by the equation $${eq}$?`,
    answer: { kind: 'choice', options, correctId },
    solution: [
      { text: `In spherical/cylindrical coordinates, $${eq}$ fixes one coordinate, describing ${correctLabel.toLowerCase()}.` },
    ],
    hints: HINTS_SURFACE,
  }
}

function tier2(rng: Rng): Problem {
  const shape = rng.pick(['vol_elem_choice', 'cyl_volume', 'sph_shell_volume'] as const)
  const conventionPreamble = 'Physics convention: $\\theta$ is the polar angle from $+z$-axis, $\\phi$ the azimuth in $xy$-plane.'

  if (shape === 'vol_elem_choice') {
    const sys = rng.pick(['spherical', 'cylindrical'] as const)
    const isSph = sys === 'spherical'
    const correctId = isSph ? 'r2_sin' : 'rho_drho'
    const options: ChoiceOption[] = rng.shuffle([
      { id: 'r2_sin', label: '$r^2 \\sin\\theta \\, dr \\, d\\theta \\, d\\phi$' },
      { id: 'rho_drho', label: '$\\rho \\, d\\rho \\, d\\phi \\, dz$' },
      { id: 'r_sin', label: '$r \\sin\\theta \\, dr \\, d\\theta \\, d\\phi$' },
      { id: 'r2_cos', label: '$r^2 \\cos\\theta \\, dr \\, d\\theta \\, d\\phi$' },
    ])

    return {
      statement: `${conventionPreamble} Which is the correct volume element $dV$ in ${sys} coordinates?`,
      answer: { kind: 'choice', options, correctId },
      solution: [
        { text: `The volume element in ${sys} coordinates is $${options.find((o) => o.id === correctId)?.label.replace(/\$/g, '')}$.` },
      ],
      hints: HINTS_VOLUME_ELEM,
    }
  }

  if (shape === 'cyl_volume') {
    const R = rng.pick([1, 2, 3, 4, 5, 6])
    const H = rng.int(1, 6)
    const phiChoice = rng.pick([
      { latex: '2\\pi', num: 2, den: 1 },
      { latex: '\\pi', num: 1, den: 1 },
      { latex: '\\frac{\\pi}{2}', num: 1, den: 2 },
      { latex: '\\frac{3\\pi}{2}', num: 3, den: 2 },
    ])
    const num = R * R * H * phiChoice.num
    const den = 2 * phiChoice.den
    let valLatex: string
    if (num % den === 0) {
      valLatex = `${num / den}\\pi`
    } else {
      const g = (a: number, b: number): number => (b === 0 ? a : g(b, a % b))
      const gcd = g(num, den)
      valLatex = `\\frac{${num / gcd}}{${den / gcd}}\\pi`
    }

    return {
      statement: `${conventionPreamble} Find the volume of the cylindrical region $0 \\le \\rho \\le ${R}$, $0 \\le \\phi \\le ${phiChoice.latex}$, $0 \\le z \\le ${H}$.`,
      answer: { kind: 'number', value: valLatex },
      solution: [
        { text: 'Integrate the volume element $dV = \\rho \\, d\\rho \\, d\\phi \\, dz$:' },
        { text: 'Compute:', tex: `V = \\int_0^{${H}} dz \\int_0^{${phiChoice.latex}} d\\phi \\int_0^{${R}} \\rho \\, d\\rho = ${valLatex}` },
      ],
      hints: HINTS_INTEGRAL,
      inputHint: NUMBER_HINT,
    }
  }

  const R1 = rng.pick([1, 2, 3])
  const R2 = R1 + rng.pick([1, 2, 3, 4])
  const diff3 = R2 ** 3 - R1 ** 3
  const thetaChoice = rng.pick([
    { latex: '0 \\le \\theta \\le \\pi', factorNum: 4, label: 'spherical shell' },
    { latex: '0 \\le \\theta \\le \\frac{\\pi}{2}', factorNum: 2, label: 'upper hemisphere shell' },
  ])
  const num = thetaChoice.factorNum * diff3
  const den = 3
  const valLatex = num % den === 0 ? `${num / den}\\pi` : `\\frac{${num}}{3}\\pi`

  return {
    statement: `${conventionPreamble} Find the volume of the ${thetaChoice.label} $${R1} \\le r \\le ${R2}$, $${thetaChoice.latex}$, $0 \\le \\phi \\le 2\\pi$.`,
    answer: { kind: 'number', value: valLatex },
    solution: [
      { text: 'Integrate the volume element $dV = r^2 \\sin\\theta \\, dr \\, d\\theta \\, d\\phi$:' },
      { text: 'Compute:', tex: `V = ${valLatex}` },
    ],
    hints: HINTS_INTEGRAL,
    inputHint: NUMBER_HINT,
  }
}

function tier3(rng: Rng): Problem {
  const shape = rng.pick(['cyl_to_sph', 'triple_integral', 'sph_cap_area'] as const)
  const conventionPreamble = 'Physics convention: $\\theta$ is the polar angle from $+z$-axis, $\\phi$ the azimuth in $xy$-plane.'

  if (shape === 'cyl_to_sph') {
    const pair = rng.pick([
      { rho: 2, z: 2, rLatex: '2\\sqrt{2}', thetaLatex: '\\frac{\\pi}{4}' },
      { rho: 3, z: 0, rLatex: '3', thetaLatex: '\\frac{\\pi}{2}' },
      { rho: 0, z: 4, rLatex: '4', thetaLatex: '0' },
      { rho: 1, z: 1, rLatex: '\\sqrt{2}', thetaLatex: '\\frac{\\pi}{4}' },
      { rho: 2, z: 0, rLatex: '2', thetaLatex: '\\frac{\\pi}{2}' },
      { rho: 0, z: 3, rLatex: '3', thetaLatex: '0' },
      { rho: 1, z: 0, rLatex: '1', thetaLatex: '\\frac{\\pi}{2}' },
    ])
    const phiSpec = rng.pick(ANGLES)

    return {
      statement: `${conventionPreamble} Convert the cylindrical point $P\\left(${pair.rho}, ${phiSpec.latex}, ${pair.z}\\right)$ to spherical coordinates $(r,\\theta,\\phi)$.`,
      answer: { kind: 'vector', components: [pair.rLatex, pair.thetaLatex, phiSpec.latex] },
      solution: [
        { text: 'Use $r = \\sqrt{\\rho^2+z^2}$, $\\theta = \\operatorname{atan2}(\\rho, z)$, and $\\phi$ unchanged:' },
        { text: 'Compute:', tex: `r = ${pair.rLatex}, \\quad \\theta = ${pair.thetaLatex}, \\quad \\phi = ${phiSpec.latex}` },
      ],
      hints: HINTS_CONVERT,
      inputHint: VECTOR_HINT,
    }
  }

  if (shape === 'triple_integral') {
    const R = rng.pick([1, 2, 3, 4, 5])
    const H = rng.pick([1, 2, 3, 4, 5])
    const mode = rng.pick(['x2_y2', 'z_x2_y2'] as const)
    let integrandTex: string
    let valLatex: string
    if (mode === 'x2_y2') {
      integrandTex = 'x^2+y^2'
      const num = H * (R ** 4)
      valLatex = num % 2 === 0 ? `${num / 2}\\pi` : `\\frac{${num}}{2}\\pi`
    } else {
      integrandTex = 'z(x^2+y^2)'
      const num = (H ** 2) * (R ** 4)
      valLatex = num % 4 === 0 ? `${num / 4}\\pi` : `\\frac{${num}}{4}\\pi`
    }

    return {
      statement: `${conventionPreamble} Evaluate $\\iiint_V (${integrandTex})\\,dV$ over the cylinder $0 \\le \\rho \\le ${R}$, $0 \\le z \\le ${H}$, $0 \\le \\phi \\le 2\\pi$.`,
      answer: { kind: 'number', value: valLatex },
      solution: [
        { text: 'In cylindrical coordinates $dV = \\rho \\, d\\rho \\, d\\phi \\, dz$:' },
        { text: 'Evaluate:', tex: `\\iiint_V (${integrandTex})\\,dV = ${valLatex}` },
      ],
      hints: HINTS_INTEGRAL,
      inputHint: NUMBER_HINT,
    }
  }

  const R = rng.pick([1, 2, 3, 4, 5, 6])
  const cap = rng.pick([
    { thetaLatex: '\\frac{\\pi}{3}', areaCoef: R * R },
    { thetaLatex: '\\frac{\\pi}{2}', areaCoef: 2 * R * R },
    { thetaLatex: '\\frac{2\\pi}{3}', areaCoef: 3 * R * R },
  ])
  const valLatex = `${cap.areaCoef}\\pi`

  return {
    statement: `${conventionPreamble} Find the surface area of the spherical cap $r = ${R}$, $0 \\le \\theta \\le ${cap.thetaLatex}$, $0 \\le \\phi \\le 2\\pi$.`,
    answer: { kind: 'number', value: valLatex },
    solution: [
      { text: 'Use area element $dA = R^2 \\sin\\theta \\, d\\theta \\, d\\phi$:' },
      { text: 'Compute:', tex: `A = 2\\pi R^2 \\left(1 - \\cos${cap.thetaLatex}\\right) = ${valLatex}` },
    ],
    hints: HINTS_INTEGRAL,
    inputHint: NUMBER_HINT,
  }
}

export const template: SkillTemplate = {
  skillId: 'cyl_spherical',
  theory,
  expectedSeconds: { 1: 50, 2: 80, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
