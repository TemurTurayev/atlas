import type { Rng } from '../../random/rng'
import { joinTerms, paren } from '../../math/latex'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = `The inertia tensor of a system of point masses $m_\\alpha$ at positions $(x_\\alpha, y_\\alpha, z_\\alpha)$ is defined by $I_{ij} = \\sum_\\alpha m_\\alpha (r_\\alpha^2 \\delta_{ij} - x_{\\alpha,i} x_{\\alpha,j})$.
Diagonal elements represent moments of inertia about axes: $I_{xx} = \\sum m (y^2 + z^2)$, $I_{yy} = \\sum m (x^2 + z^2)$, $I_{zz} = \\sum m (x^2 + y^2)$.
Off-diagonal elements are products of inertia: $I_{xy} = -\\sum m x y$, $I_{xz} = -\\sum m x z$, $I_{yz} = -\\sum m y z$.
Angular momentum for 3D rotation is $\\vec{L} = \\mathbf{I} \\vec{\\omega}$, and rotational kinetic energy is $E_k = \\frac{1}{2} \\vec{\\omega} \\cdot \\vec{L}$.
Principal moments of inertia are the eigenvalues of the inertia tensor $\\mathbf{I}$.
Common mistakes: Forgetting the negative sign in off-diagonal products of inertia $I_{ij} = -\\sum m x_i x_j$ ($i \\neq j$).`

function tier1(rng: Rng): Problem {
  const shape = rng.pick(['single_diagonal_entry', 'single_off_diagonal_entry', 'angular_momentum_single_axis'] as const)

  if (shape === 'single_diagonal_entry') {
    const m1 = rng.int(1, 6)
    const x1 = rng.int(-4, 4)
    const y1 = rng.int(-4, 4)
    const m2 = rng.int(1, 6)
    const x2 = rng.int(-4, 4)
    const y2 = rng.int(-4, 4)

    const Izz = m1 * (x1 * x1 + y1 * y1) + m2 * (x2 * x2 + y2 * y2)

    return {
      statement: `Two point masses $m_1 = ${m1}$ kg at $(${x1}, ${y1}, 0)$ m and $m_2 = ${m2}$ kg at $(${x2}, ${y2}, 0)$ m lie in the $xy$-plane. Find the moment of inertia entry $I_{zz} = \\sum m (x^2 + y^2)$ about the $z$-axis in kg$\\cdot$m$^2$.`,
      answer: { kind: 'number', value: String(Izz) },
      solution: [
        { text: 'Use $I_{zz} = m_1 (x_1^2 + y_1^2) + m_2 (x_2^2 + y_2^2)$:' },
        { text: 'Compute entry:', tex: `I_{zz} = ${m1} \\cdot (${x1 * x1 + y1 * y1}) + ${m2} \\cdot (${x2 * x2 + y2 * y2}) = ${Izz}` },
      ],
      hints: [
        'Calculate squared distances to $z$-axis $r^2 = x^2 + y^2$ for each mass.',
        `$I_{zz} = ${m1} \\cdot ${x1 * x1 + y1 * y1} + ${m2} \\cdot ${x2 * x2 + y2 * y2} = ${Izz}$ kg$\\cdot$m$^2$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'single_off_diagonal_entry') {
    const m1 = rng.int(1, 6)
    const x1 = rng.int(-4, 4)
    const y1 = rng.int(-4, 4)
    const m2 = rng.int(1, 6)
    const x2 = rng.int(-4, 4)
    const y2 = rng.int(-4, 4)

    const term1 = m1 * x1 * y1
    const term2 = m2 * x2 * y2
    const Ixy = -(term1 + term2)
    const sumInner = joinTerms([String(term1), String(term2)])

    return {
      statement: `Two point masses $m_1 = ${m1}$ kg at $(${x1}, ${y1}, 0)$ m and $m_2 = ${m2}$ kg at $(${x2}, ${y2}, 0)$ m lie in the $xy$-plane. Find the product of inertia entry $I_{xy} = -\\sum m x y$ in kg$\\cdot$m$^2$.`,
      answer: { kind: 'number', value: String(Ixy) },
      solution: [
        { text: 'Off-diagonal inertia tensor entry is $I_{xy} = -(m_1 x_1 y_1 + m_2 x_2 y_2)$:' },
        { text: 'Compute entry:', tex: `I_{xy} = -\\left(${sumInner}\\right) = ${Ixy}` },
      ],
      hints: [
        'Recall $I_{xy} = -\\sum m x y$. Remember the negative sign.',
        `$I_{xy} = -\\left(${sumInner}\\right) = ${Ixy}$ kg$\\cdot$m$^2$.`,
      ],
      inputHint: 'Enter a signed integer.',
    }
  }

  const Izz = rng.int(2, 20)
  const wz = rng.int(2, 12)
  const Lz = Izz * wz

  return {
    statement: `A body with inertia tensor entry $I_{zz} = ${Izz}$ kg$\\cdot$m$^2$ rotates about the $z$-axis with angular velocity $\\vec{\\omega} = (0, 0, ${wz})$ rad/s. Find the magnitude of its angular momentum component $L_z$ in kg$\\cdot$m$^2$/s.`,
    answer: { kind: 'number', value: String(Lz) },
    solution: [
      { text: 'For rotation about a principal axis $z$, angular momentum component is $L_z = I_{zz} \\omega_z$:' },
      { text: 'Compute angular momentum:', tex: `L_z = ${Izz} \\cdot ${wz} = ${Lz}` },
    ],
    hints: [
      'Use $L_z = I_{zz} \\omega_z$.',
      `$L_z = ${Izz} \\cdot ${wz} = ${Lz}$ kg$\\cdot$m$^2$/s.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier2(rng: Rng): Problem {
  const shape = rng.pick(['full_3x3_matrix_on_axes', 'angular_momentum_vector_from_matrix', 'principal_moment_diagonal'] as const)

  if (shape === 'full_3x3_matrix_on_axes') {
    const m1 = rng.int(1, 5)
    const a = rng.int(1, 4)
    const m2 = rng.int(1, 5)
    const b = rng.int(1, 4)
    const m3 = rng.int(1, 5)
    const c = rng.int(1, 4)

    const Ixx = m2 * b * b + m3 * c * c
    const Iyy = m1 * a * a + m3 * c * c
    const Izz = m1 * a * a + m2 * b * b

    return {
      statement: `Three point masses $m_1 = ${m1}$ kg at $(${a}, 0, 0)$ m, $m_2 = ${m2}$ kg at $(0, ${b}, 0)$ m, and $m_3 = ${m3}$ kg at $(0, 0, ${c})$ m are placed on the coordinate axes. Find the $3 \\times 3$ inertia tensor matrix $\\mathbf{I}$ in kg$\\cdot$m$^2$.`,
      answer: {
        kind: 'matrix',
        rows: [
          [String(Ixx), '0', '0'],
          ['0', String(Iyy), '0'],
          ['0', '0', String(Izz)],
        ],
      },
      solution: [
        { text: 'Since masses are on the axes, off-diagonal entries are 0 ($I_{xy} = I_{xz} = I_{yz} = 0$). Diagonal elements are $I_{xx} = m_2 b^2 + m_3 c^2$, $I_{yy} = m_1 a^2 + m_3 c^2$, $I_{zz} = m_1 a^2 + m_2 b^2$:' },
        { text: 'Compute matrix elements:', tex: `\\mathbf{I} = \\begin{pmatrix} ${Ixx} & 0 & 0 \\\\ 0 & ${Iyy} & 0 \\\\ 0 & 0 & ${Izz} \\end{pmatrix}` },
      ],
      hints: [
        'Off-diagonal entries are zero because product of coordinates is zero on axes.',
        `Compute diagonal elements: $I_{xx} = ${Ixx}$, $I_{yy} = ${Iyy}$, $I_{zz} = ${Izz}$.`,
      ],
    }
  }

  if (shape === 'angular_momentum_vector_from_matrix') {
    const Ixx = rng.int(2, 10)
    const Iyy = rng.int(2, 10)
    const Izz = rng.int(2, 10)
    const wx = rng.int(-4, 4)
    const wy = rng.int(-4, 4)
    const wz = rng.int(-4, 4)

    const Lx = Ixx * wx
    const Ly = Iyy * wy
    const Lz = Izz * wz

    return {
      statement: `A body has diagonal inertia tensor $\\mathbf{I} = \\operatorname{diag}(${Ixx}, ${Iyy}, ${Izz})$ kg$\\cdot$m$^2$ and angular velocity $\\vec{\\omega} = (${wx}, ${wy}, ${wz})$ rad/s. Find its angular momentum vector $\\vec{L} = \\mathbf{I} \\vec{\\omega}$ in kg$\\cdot$m$^2$/s.`,
      answer: { kind: 'vector', components: [String(Lx), String(Ly), String(Lz)] },
      solution: [
        { text: 'Multiply diagonal matrix $\\mathbf{I}$ by angular velocity vector $\\vec{\\omega}$:' },
        { text: 'Compute vector:', tex: `\\vec{L} = (${Ixx} \\cdot ${paren(wx)},\\; ${Iyy} \\cdot ${paren(wy)},\\; ${Izz} \\cdot ${paren(wz)}) = (${Lx}, ${Ly}, ${Lz})` },
      ],
      hints: [
        'For diagonal $\\mathbf{I}$, $L_x = I_{xx} \\omega_x$, $L_y = I_{yy} \\omega_y$, $L_z = I_{zz} \\omega_z$.',
        `Components are $(${Lx}, ${Ly}, ${Lz})$.`,
      ],
      inputHint: 'Enter 3 vector components.',
    }
  }

  const I1 = rng.int(2, 8)
  const I2 = I1 + rng.int(2, 8)
  const I3 = I2 + rng.int(2, 8)
  const askMax = rng.pick([true, false])
  const ansVal = askMax ? I3 : I1
  const labelText = askMax ? 'maximum' : 'minimum'

  return {
    statement: `A rigid body has a diagonal inertia tensor $\\mathbf{I} = \\operatorname{diag}(${I1}, ${I2}, ${I3})$ kg$\\cdot$m$^2$. Find its ${labelText} principal moment of inertia (eigenvalue of $\\mathbf{I}$) in kg$\\cdot$m$^2$.`,
    answer: { kind: 'number', value: String(ansVal) },
    solution: [
      { text: 'For a diagonal matrix, the principal moments of inertia are the diagonal entries themselves:' },
      { text: `Identify ${labelText} principal moment:`, tex: `I_{\\text{principal}} = ${ansVal}` },
    ],
    hints: [
      'Eigenvalues of a diagonal matrix are simply its diagonal entries.',
      `The diagonal values are ${I1}, ${I2}, ${I3}. The ${labelText} is ${ansVal}.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier3(rng: Rng): Problem {
  const shape = rng.pick(['block_diagonal_eigenvalues', 'rotational_energy_tensor', 'symmetric_top_choice'] as const)

  if (shape === 'block_diagonal_eigenvalues') {
    const m = rng.int(1, 4)
    const a = rng.int(1, 4)
    const b = rng.int(1, 4)
    const Imax = 2 * m * (a * a + b * b)

    return {
      statement: `Two identical point masses of mass $m = ${m}$ kg are placed at $(${a}, ${b}, 0)$ m and $(-${a}, -${b}, 0)$ m. Find the maximum principal moment of inertia (largest eigenvalue of $\\mathbf{I}$) in kg$\\cdot$m$^2$.`,
      answer: { kind: 'number', value: String(Imax) },
      solution: [
        { text: 'For two point masses forming a line through the origin, the principal moment about the perpendicular axis is $I_{\\text{max}} = \\sum m r^2 = 2 m (a^2 + b^2)$:' },
        { text: 'Compute maximum principal moment:', tex: `I_{\\text{max}} = 2 \\cdot ${m} \\cdot (${a}^2 + ${b}^2) = ${Imax}` },
      ],
      hints: [
        'Maximum principal moment of inertia equals total moment of inertia about the axis perpendicular to the mass alignment line.',
        `$I_{\\text{max}} = 2 m (a^2 + b^2) = 2 \\cdot ${m} \\cdot (${a * a + b * b}) = ${Imax}$ kg$\\cdot$m$^2$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'rotational_energy_tensor') {
    const Ixx = 2 * rng.int(1, 6)
    const Iyy = 2 * rng.int(1, 6)
    const Izz = 2 * rng.int(1, 6)
    const wx = rng.int(1, 5)
    const wy = rng.int(1, 5)
    const wz = rng.int(1, 5)

    const Ek = 0.5 * (Ixx * wx * wx + Iyy * wy * wy + Izz * wz * wz)

    return {
      statement: `A body with diagonal inertia tensor $\\mathbf{I} = \\operatorname{diag}(${Ixx}, ${Iyy}, ${Izz})$ kg$\\cdot$m$^2$ rotates with angular velocity $\\vec{\\omega} = (${wx}, ${wy}, ${wz})$ rad/s. Find its rotational kinetic energy $E_k$ in Joules.`,
      answer: { kind: 'number', value: String(Ek) },
      solution: [
        { text: 'Rotational kinetic energy is $E_k = \\frac{1}{2} \\vec{\\omega} \\cdot (\\mathbf{I} \\vec{\\omega}) = \\frac{1}{2} (I_{xx} \\omega_x^2 + I_{yy} \\omega_y^2 + I_{zz} \\omega_z^2)$:' },
        { text: 'Compute energy:', tex: `E_k = \\frac{1}{2} \\left(${Ixx} \\cdot ${wx}^2 + ${Iyy} \\cdot ${wy}^2 + ${Izz} \\cdot ${wz}^2\\right) = ${Ek}` },
      ],
      hints: [
        'Use $E_k = \\frac{1}{2} (I_{xx} \\omega_x^2 + I_{yy} \\omega_y^2 + I_{zz} \\omega_z^2)$.',
        `Evaluate $\\frac{1}{2} (${Ixx * wx * wx} + ${Iyy * wy * wy} + ${Izz * wz * wz}) = ${Ek}$ J.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const allOpts: ChoiceOption[] = [
    { id: 'correct', label: 'Symmetric top: exactly two principal moments of inertia are equal ($I_1 = I_2 \\neq I_3$)' },
    { id: 'opt2', label: 'Spherical top: all three principal moments of inertia are distinct ($I_1 \\neq I_2 \\neq I_3$)' },
    { id: 'opt3', label: 'Asymmetric top: all three principal moments of inertia are equal ($I_1 = I_2 = I_3$)' },
    { id: 'opt4', label: 'Rotor: all three principal moments of inertia are zero' },
  ]

  return {
    statement: 'Which statement correctly classifies rigid bodies based on their principal moments of inertia $I_1, I_2, I_3$?',
    answer: { kind: 'choice', options: rng.shuffle(allOpts), correctId: 'correct' },
    solution: [
      { text: 'A body with two equal principal moments ($I_1 = I_2 \\neq I_3$) is classified as a symmetric top.' },
    ],
    hints: [
      'Spherical top has $I_1 = I_2 = I_3$; symmetric top has $I_1 = I_2 \\neq I_3$; asymmetric top has $I_1 \\neq I_2 \\neq I_3$.',
    ],
  }
}

export const template: SkillTemplate = {
  skillId: 'inertia_tensor',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 105 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
