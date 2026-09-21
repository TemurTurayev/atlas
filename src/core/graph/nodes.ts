export interface SkillNode {
  readonly id: string
  /** Course week (0 = school foundations). */
  readonly week: number
  readonly title: string
  readonly prereqs: readonly string[]
  readonly highYield: boolean
}

/** Weeks that appear in the exam (8 and 11 excluded per Winkler, 14.09.2026). */
export const EXAM_WEEKS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 9, 10, 12, 13, 14]

const HIGH_YIELD: ReadonlySet<string> = new Set([
  'set_ops', 'functions', 'vec_angle', 'matrix_mult', 'det_3x3', 'gauss_elim', 'char_poly',
  'chain_rule', 'product_quotient', 'extrema_1d', 'by_parts', 'substitution', 'gradient',
  'separation', 'equilibria', 'ppv_prevalence', 'bayes', 'conf_interval', 'complex_arith',
  'ideal_gas', 'first_law',
])

type Row = readonly [id: string, week: number, title: string, prereqs: readonly string[]]

const ROWS: readonly Row[] = [
  ['int_neg', 0, 'Integers & negative numbers', []],
  ['order_ops', 0, 'Order of operations', ['int_neg']],
  ['fractions', 0, 'Fraction arithmetic', ['order_ops']],
  ['percent_ratio', 0, 'Decimals, percent, ratios', ['fractions']],
  ['powers', 0, 'Integer exponents, exponent laws', ['fractions']],
  ['roots', 0, 'Roots, rational exponents', ['powers']],
  ['sci_notation', 0, 'Scientific notation, sig figs', ['powers', 'percent_ratio']],
  ['units', 0, 'SI prefixes, unit conversion', ['sci_notation']],
  ['algebra_expr', 0, 'Substitution, like terms', ['order_ops', 'fractions']],
  ['expand', 0, 'Expanding, binomial formulas', ['algebra_expr', 'powers']],
  ['factor', 0, 'Factoring', ['expand']],
  ['alg_fractions', 0, 'Algebraic fractions', ['factor']],
  ['linear_eq', 0, 'Linear equations', ['algebra_expr']],
  ['rearrange', 0, 'Rearranging formulas', ['linear_eq', 'alg_fractions']],
  ['quadratic_eq', 0, 'Quadratic formula, discriminant', ['factor', 'roots']],
  ['sim_eq_2x2', 0, '2×2 simultaneous equations', ['linear_eq']],
  ['inequalities', 0, 'Linear, quadratic, abs-value inequalities', ['linear_eq', 'quadratic_eq']],
  ['sigma_notation', 0, 'Summation notation', ['order_ops']],
  ['geometry', 0, 'Angles, areas, volumes', ['order_ops']],
  ['pythagoras', 0, 'Pythagoras', ['roots', 'geometry']],
  ['lines_2d', 0, 'Coordinates, distance, straight lines', ['linear_eq', 'pythagoras']],
  ['graphs_basic', 0, 'Reading graphs: line, parabola, 1/x', ['lines_2d', 'quadratic_eq']],
  ['trig_triangle', 0, 'Right-triangle trigonometry', ['pythagoras', 'fractions']],
  ['radians', 0, 'Radians, unit circle', ['trig_triangle', 'geometry']],

  ['sets', 1, 'Sets, ℕ ℤ ℚ ℝ', ['int_neg']],
  ['intervals', 1, 'Interval notation', ['sets', 'inequalities']],
  ['set_ops', 1, 'Union, intersection, difference', ['sets']],
  ['product_powerset', 1, 'Cartesian product, power set', ['set_ops']],
  ['functions', 1, 'Domain, codomain, image', ['sets', 'intervals', 'alg_fractions']],
  ['injective', 1, 'Injective, surjective, bijective', ['functions']],
  ['composition', 1, 'Composite functions', ['functions']],
  ['inverse_fn', 1, 'Inverse functions', ['injective', 'composition', 'rearrange']],
  ['transformations', 1, 'Shifts, stretches, reflections', ['graphs_basic', 'composition']],
  ['polynomials', 1, 'Degree, roots, factor theorem', ['factor', 'quadratic_eq']],
  ['poly_division', 1, 'Polynomial long division', ['polynomials']],
  ['exp_fn', 1, 'Exponential functions, e', ['roots', 'graphs_basic']],
  ['log_laws', 1, 'Logarithms, log laws', ['exp_fn']],
  ['exp_log_eq', 1, 'Exponential and log equations', ['log_laws', 'rearrange']],
  ['trig_fns', 1, 'Trig graphs, exact values, identities', ['radians', 'transformations']],
  ['limits', 1, 'Limits (0/0, x→∞)', ['alg_fractions', 'polynomials']],
  ['continuity', 1, 'Continuity, piecewise functions', ['limits']],

  ['vectors', 2, 'Components, addition, scaling', ['lines_2d']],
  ['vec_length', 2, 'Length, unit vector', ['vectors', 'pythagoras']],
  ['dot_product', 2, 'Dot product, orthogonality', ['vectors']],
  ['vec_angle', 2, 'Angle between vectors', ['dot_product', 'vec_length', 'trig_fns']],
  ['cross_product', 2, 'Cross product', ['vectors']],
  ['lines_param', 2, 'Parametric lines in 2D/3D', ['vectors', 'lines_2d']],
  ['planes', 2, 'Plane equations, line–plane intersection', ['dot_product', 'cross_product', 'lines_param']],
  ['linsys_geometry', 2, 'Systems: 0, 1 or ∞ solutions', ['sim_eq_2x2', 'planes']],

  ['matrix_basics', 3, 'Matrix notation, sum, transpose', ['vectors']],
  ['matrix_mult', 3, 'Matrix products', ['matrix_basics', 'dot_product']],
  ['det_2x2', 3, '2×2 determinant', ['matrix_basics']],
  ['det_3x3', 3, '3×3 determinant', ['det_2x2']],
  ['inverse_2x2', 3, '2×2 inverse', ['det_2x2', 'matrix_mult']],
  ['gauss_elim', 3, 'Gaussian elimination', ['linsys_geometry', 'matrix_basics']],
  ['gauss_jordan_inv', 3, 'Inverse via Gauss–Jordan', ['gauss_elim', 'matrix_mult']],
  ['solvability', 3, 'Rank, singularity, parameter cases', ['gauss_elim', 'det_3x3']],

  ['eigen_check', 4, 'Eigenvector definition, checking', ['matrix_mult']],
  ['char_poly', 4, 'Characteristic polynomial, eigenvalues', ['det_2x2', 'det_3x3', 'quadratic_eq', 'polynomials']],
  ['eigenvectors', 4, 'Eigenvectors, eigenspaces', ['char_poly', 'gauss_elim', 'eigen_check']],
  ['diagonalization', 4, 'Diagonalization, matrix powers', ['eigenvectors', 'inverse_2x2']],
  ['least_squares', 4, 'Least squares, normal equations', ['matrix_mult', 'inverse_2x2', 'sigma_notation']],
  ['regularization', 4, 'Ridge regularization', ['least_squares']],

  ['derivative_def', 5, 'Derivative as slope', ['limits', 'lines_2d']],
  ['diff_rules', 5, 'Differentiation rules', ['derivative_def', 'exp_fn', 'log_laws', 'trig_fns']],
  ['product_quotient', 5, 'Product and quotient rules', ['diff_rules']],
  ['chain_rule', 5, 'Chain rule', ['diff_rules', 'composition']],
  ['extrema_1d', 5, 'Critical points, optimisation', ['chain_rule', 'product_quotient', 'quadratic_eq']],
  ['antiderivatives', 5, 'Antiderivatives', ['diff_rules']],
  ['definite_integral', 5, 'Definite integral, area', ['antiderivatives']],
  ['substitution', 5, 'Integration by substitution', ['definite_integral', 'chain_rule']],
  ['by_parts', 5, 'Integration by parts', ['definite_integral', 'product_quotient']],

  ['multivar_fns', 6, 'f(x,y), level curves', ['functions', 'graphs_basic']],
  ['partial_derivs', 6, 'Partial derivatives', ['chain_rule', 'product_quotient', 'multivar_fns']],
  ['gradient', 6, 'Gradient vector', ['partial_derivs', 'vectors']],
  ['directional_deriv', 6, 'Directional derivative', ['gradient', 'vec_length', 'dot_product']],
  ['critical_2d', 6, 'Critical points in ℝ², Hessian test', ['partial_derivs', 'sim_eq_2x2', 'det_2x2']],

  ['ode_classify', 7, 'Order, linearity, autonomy', ['derivative_def']],
  ['ode_verify_ivp', 7, 'Verify solutions, initial values', ['chain_rule']],
  ['separation', 7, 'Separation of variables', ['substitution', 'exp_log_eq', 'ode_verify_ivp']],
  ['exp_model', 7, 'Exponential growth/decay, half-life', ['separation']],
  ['logistic_model', 7, 'Logistic growth', ['exp_model', 'alg_fractions']],
  ['equilibria', 7, 'Equilibria and stability', ['logistic_model', 'diff_rules', 'inequalities']],
  ['euler_method', 7, "Euler's method", ['ode_verify_ivp']],
  ['sir_model', 7, 'SIR model, R₀', ['equilibria', 'euler_method']],

  ['desc_stats', 9, 'Mean, median, mode', ['sigma_notation', 'percent_ratio']],
  ['variance_sd', 9, 'Variance, standard deviation', ['desc_stats', 'roots']],
  ['quantiles', 9, 'Quantiles, IQR, boxplot', ['desc_stats']],
  ['prob_rules', 9, 'Events, complement, addition rule', ['set_ops', 'fractions']],
  ['counting', 9, 'Permutations, combinations', ['prob_rules']],
  ['cond_prob', 9, 'Conditional probability, independence', ['prob_rules']],
  ['bayes', 9, 'Total probability, Bayes', ['cond_prob']],
  ['random_vars', 9, 'E[X], Var[X], moments', ['prob_rules', 'variance_sd']],
  ['binomial_poisson', 9, 'Binomial and Poisson', ['random_vars', 'counting', 'exp_fn']],
  ['normal_dist', 9, 'Normal distribution, z-scores', ['random_vars', 'variance_sd']],
  ['normal_quantiles', 9, 'Normal quantiles, 68–95–99.7', ['normal_dist', 'quantiles']],
  ['correlation', 9, 'Covariance, Pearson r', ['variance_sd', 'sigma_notation']],

  ['std_error', 10, 'Standard error, CLT', ['normal_dist']],
  ['conf_interval', 10, 'Confidence intervals', ['std_error', 'normal_quantiles']],
  ['hypothesis_logic', 10, 'H₀/H₁, p-value, errors', ['std_error']],
  ['z_t_test', 10, 'z and t tests', ['hypothesis_logic', 'normal_quantiles']],
  ['confusion_matrix', 10, 'Sensitivity, specificity, PPV', ['percent_ratio', 'cond_prob']],
  ['ppv_prevalence', 10, 'PPV from prevalence', ['confusion_matrix', 'bayes']],
  ['error_propagation', 10, 'Error propagation', ['partial_derivs', 'variance_sd']],

  ['polar', 12, 'Polar coordinates', ['trig_fns', 'pythagoras']],
  ['cyl_spherical', 12, 'Cylindrical and spherical coordinates', ['polar', 'vec_length']],
  ['divergence', 12, 'Divergence', ['partial_derivs', 'dot_product']],
  ['curl', 12, 'Curl', ['partial_derivs', 'cross_product']],
  ['complex_arith', 12, 'Complex arithmetic', ['expand', 'quadratic_eq']],
  ['complex_polar', 12, "Exponential form, Euler's formula", ['complex_arith', 'polar', 'exp_fn']],
  ['complex_powers', 12, 'De Moivre, complex roots', ['complex_polar']],

  ['kinematics', 13, 'Kinematics: x, v, a', ['diff_rules', 'definite_integral', 'units']],
  ['projectile', 13, 'Projectile motion', ['kinematics', 'vectors', 'trig_triangle', 'quadratic_eq']],
  ['newton', 13, "Newton's laws", ['kinematics', 'vectors']],
  ['energy_cons', 13, 'Work, energy conservation', ['newton', 'dot_product']],
  ['momentum_cons', 13, 'Momentum, collisions', ['newton']],
  ['oscillator_phase', 13, 'Oscillator, phase space', ['energy_cons', 'trig_fns', 'ode_verify_ivp']],
  ['rotation', 13, 'Rotation, angular momentum', ['cross_product', 'radians', 'newton']],
  ['inertia_tensor', 13, 'Inertia tensor', ['rotation', 'matrix_basics', 'eigenvectors']],
  ['kepler', 13, "Gravitation, Kepler's laws", ['rotation', 'roots', 'rearrange']],

  ['ideal_gas', 14, 'Ideal gas law', ['rearrange', 'units']],
  ['maxwell_boltzmann', 14, 'Maxwell–Boltzmann distribution', ['ideal_gas', 'exp_fn', 'roots']],
  ['first_law', 14, 'First law, heat capacity', ['ideal_gas', 'energy_cons']],
  ['processes', 14, 'Thermodynamic processes, pV work', ['first_law', 'definite_integral', 'log_laws']],
  ['entropy_2nd_law', 14, 'Second law, entropy, Carnot', ['processes']],
]

export const NODES: readonly SkillNode[] = ROWS.map(([id, week, title, prereqs]) => ({
  id,
  week,
  title,
  prereqs,
  highYield: HIGH_YIELD.has(id),
}))
