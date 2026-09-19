export interface SkillNode {
  readonly id: string
  /** Course week (0 = school foundations). */
  readonly week: number
  readonly title: { readonly en: string; readonly ru: string }
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

type Row = readonly [id: string, week: number, en: string, ru: string, prereqs: readonly string[]]

const ROWS: readonly Row[] = [
  ['int_neg', 0, 'Integers & negative numbers', 'Целые и отрицательные числа', []],
  ['order_ops', 0, 'Order of operations', 'Порядок действий', ['int_neg']],
  ['fractions', 0, 'Fraction arithmetic', 'Действия с дробями', ['order_ops']],
  ['percent_ratio', 0, 'Decimals, percent, ratios', 'Десятичные дроби, проценты, пропорции', ['fractions']],
  ['powers', 0, 'Integer exponents, exponent laws', 'Степени и их свойства', ['fractions']],
  ['roots', 0, 'Roots, rational exponents', 'Корни и дробные степени', ['powers']],
  ['sci_notation', 0, 'Scientific notation, sig figs', 'Научная запись числа', ['powers', 'percent_ratio']],
  ['units', 0, 'SI prefixes, unit conversion', 'Единицы СИ и перевод единиц', ['sci_notation']],
  ['algebra_expr', 0, 'Substitution, like terms', 'Подстановка и подобные слагаемые', ['order_ops', 'fractions']],
  ['expand', 0, 'Expanding, binomial formulas', 'Раскрытие скобок, формулы сокращённого умножения', ['algebra_expr', 'powers']],
  ['factor', 0, 'Factoring', 'Разложение на множители', ['expand']],
  ['alg_fractions', 0, 'Algebraic fractions', 'Алгебраические дроби', ['factor']],
  ['linear_eq', 0, 'Linear equations', 'Линейные уравнения', ['algebra_expr']],
  ['rearrange', 0, 'Rearranging formulas', 'Выражение переменной из формулы', ['linear_eq', 'alg_fractions']],
  ['quadratic_eq', 0, 'Quadratic formula, discriminant', 'Квадратные уравнения, дискриминант', ['factor', 'roots']],
  ['sim_eq_2x2', 0, '2×2 simultaneous equations', 'Системы двух линейных уравнений', ['linear_eq']],
  ['inequalities', 0, 'Linear, quadratic, abs-value inequalities', 'Неравенства', ['linear_eq', 'quadratic_eq']],
  ['sigma_notation', 0, 'Summation notation', 'Знак суммы Σ', ['order_ops']],
  ['geometry', 0, 'Angles, areas, volumes', 'Углы, площади, объёмы', ['order_ops']],
  ['pythagoras', 0, 'Pythagoras', 'Теорема Пифагора', ['roots', 'geometry']],
  ['lines_2d', 0, 'Coordinates, distance, straight lines', 'Координаты, расстояние, прямые', ['linear_eq', 'pythagoras']],
  ['graphs_basic', 0, 'Reading graphs: line, parabola, 1/x', 'Графики: прямая, парабола, гипербола', ['lines_2d', 'quadratic_eq']],
  ['trig_triangle', 0, 'Right-triangle trigonometry', 'Тригонометрия прямоугольного треугольника', ['pythagoras', 'fractions']],
  ['radians', 0, 'Radians, unit circle', 'Радианы и единичная окружность', ['trig_triangle', 'geometry']],

  ['sets', 1, 'Sets, ℕ ℤ ℚ ℝ', 'Множества и числовые множества', ['int_neg']],
  ['intervals', 1, 'Interval notation', 'Интервалы', ['sets', 'inequalities']],
  ['set_ops', 1, 'Union, intersection, difference', 'Операции над множествами', ['sets']],
  ['product_powerset', 1, 'Cartesian product, power set', 'Декартово произведение и булеан', ['set_ops']],
  ['functions', 1, 'Domain, codomain, image', 'Функция: область определения и значений', ['sets', 'intervals', 'alg_fractions']],
  ['injective', 1, 'Injective, surjective, bijective', 'Инъекция, сюръекция, биекция', ['functions']],
  ['composition', 1, 'Composite functions', 'Композиция функций', ['functions']],
  ['inverse_fn', 1, 'Inverse functions', 'Обратная функция', ['injective', 'composition', 'rearrange']],
  ['transformations', 1, 'Shifts, stretches, reflections', 'Сдвиги и растяжения графиков', ['graphs_basic', 'composition']],
  ['polynomials', 1, 'Degree, roots, factor theorem', 'Многочлены и их корни', ['factor', 'quadratic_eq']],
  ['poly_division', 1, 'Polynomial long division', 'Деление многочленов столбиком', ['polynomials']],
  ['exp_fn', 1, 'Exponential functions, e', 'Показательная функция, число e', ['roots', 'graphs_basic']],
  ['log_laws', 1, 'Logarithms, log laws', 'Логарифмы и их свойства', ['exp_fn']],
  ['exp_log_eq', 1, 'Exponential and log equations', 'Показательные и логарифмические уравнения', ['log_laws', 'rearrange']],
  ['trig_fns', 1, 'Trig graphs, exact values, identities', 'Тригонометрические функции', ['radians', 'transformations']],
  ['limits', 1, 'Limits (0/0, x→∞)', 'Пределы', ['alg_fractions', 'polynomials']],
  ['continuity', 1, 'Continuity, piecewise functions', 'Непрерывность', ['limits']],

  ['vectors', 2, 'Components, addition, scaling', 'Векторы: координаты, сложение', ['lines_2d']],
  ['vec_length', 2, 'Length, unit vector', 'Длина вектора, единичный вектор', ['vectors', 'pythagoras']],
  ['dot_product', 2, 'Dot product, orthogonality', 'Скалярное произведение', ['vectors']],
  ['vec_angle', 2, 'Angle between vectors', 'Угол между векторами', ['dot_product', 'vec_length', 'trig_fns']],
  ['cross_product', 2, 'Cross product', 'Векторное произведение', ['vectors']],
  ['lines_param', 2, 'Parametric lines in 2D/3D', 'Параметрическое уравнение прямой', ['vectors', 'lines_2d']],
  ['planes', 2, 'Plane equations, line–plane intersection', 'Уравнение плоскости', ['dot_product', 'cross_product', 'lines_param']],
  ['linsys_geometry', 2, 'Systems: 0, 1 or ∞ solutions', 'Системы уравнений: 0, 1 или ∞ решений', ['sim_eq_2x2', 'planes']],

  ['matrix_basics', 3, 'Matrix notation, sum, transpose', 'Матрицы: сумма, транспонирование', ['vectors']],
  ['matrix_mult', 3, 'Matrix products', 'Умножение матриц', ['matrix_basics', 'dot_product']],
  ['det_2x2', 3, '2×2 determinant', 'Определитель 2×2', ['matrix_basics']],
  ['det_3x3', 3, '3×3 determinant', 'Определитель 3×3', ['det_2x2']],
  ['inverse_2x2', 3, '2×2 inverse', 'Обратная матрица 2×2', ['det_2x2', 'matrix_mult']],
  ['gauss_elim', 3, 'Gaussian elimination', 'Метод Гаусса', ['linsys_geometry', 'matrix_basics']],
  ['gauss_jordan_inv', 3, 'Inverse via Gauss–Jordan', 'Обратная матрица методом Гаусса–Жордана', ['gauss_elim', 'matrix_mult']],
  ['solvability', 3, 'Rank, singularity, parameter cases', 'Ранг и разрешимость систем', ['gauss_elim', 'det_3x3']],

  ['eigen_check', 4, 'Eigenvector definition, checking', 'Собственный вектор: проверка', ['matrix_mult']],
  ['char_poly', 4, 'Characteristic polynomial, eigenvalues', 'Характеристический многочлен, собственные значения', ['det_2x2', 'det_3x3', 'quadratic_eq', 'polynomials']],
  ['eigenvectors', 4, 'Eigenvectors, eigenspaces', 'Собственные векторы', ['char_poly', 'gauss_elim', 'eigen_check']],
  ['diagonalization', 4, 'Diagonalization, matrix powers', 'Диагонализация, степени матрицы', ['eigenvectors', 'inverse_2x2']],
  ['least_squares', 4, 'Least squares, normal equations', 'Метод наименьших квадратов', ['matrix_mult', 'inverse_2x2', 'sigma_notation']],
  ['regularization', 4, 'Ridge regularization', 'Регуляризация (ridge)', ['least_squares']],

  ['derivative_def', 5, 'Derivative as slope', 'Производная как наклон', ['limits', 'lines_2d']],
  ['diff_rules', 5, 'Differentiation rules', 'Правила дифференцирования', ['derivative_def', 'exp_fn', 'log_laws', 'trig_fns']],
  ['product_quotient', 5, 'Product and quotient rules', 'Производная произведения и частного', ['diff_rules']],
  ['chain_rule', 5, 'Chain rule', 'Производная сложной функции', ['diff_rules', 'composition']],
  ['extrema_1d', 5, 'Critical points, optimisation', 'Экстремумы и оптимизация', ['chain_rule', 'product_quotient', 'quadratic_eq']],
  ['antiderivatives', 5, 'Antiderivatives', 'Первообразные', ['diff_rules']],
  ['definite_integral', 5, 'Definite integral, area', 'Определённый интеграл', ['antiderivatives']],
  ['substitution', 5, 'Integration by substitution', 'Интегрирование заменой', ['definite_integral', 'chain_rule']],
  ['by_parts', 5, 'Integration by parts', 'Интегрирование по частям', ['definite_integral', 'product_quotient']],

  ['multivar_fns', 6, 'f(x,y), level curves', 'Функции двух переменных, линии уровня', ['functions', 'graphs_basic']],
  ['partial_derivs', 6, 'Partial derivatives', 'Частные производные', ['chain_rule', 'product_quotient', 'multivar_fns']],
  ['gradient', 6, 'Gradient vector', 'Градиент', ['partial_derivs', 'vectors']],
  ['directional_deriv', 6, 'Directional derivative', 'Производная по направлению', ['gradient', 'vec_length', 'dot_product']],
  ['critical_2d', 6, 'Critical points in ℝ², Hessian test', 'Экстремумы в ℝ², гессиан', ['partial_derivs', 'sim_eq_2x2', 'det_2x2']],

  ['ode_classify', 7, 'Order, linearity, autonomy', 'Классификация ОДУ', ['derivative_def']],
  ['ode_verify_ivp', 7, 'Verify solutions, initial values', 'Проверка решения, задача Коши', ['chain_rule']],
  ['separation', 7, 'Separation of variables', 'Разделение переменных', ['substitution', 'exp_log_eq', 'ode_verify_ivp']],
  ['exp_model', 7, 'Exponential growth/decay, half-life', 'Экспоненциальный рост и распад', ['separation']],
  ['logistic_model', 7, 'Logistic growth', 'Логистический рост', ['exp_model', 'alg_fractions']],
  ['equilibria', 7, 'Equilibria and stability', 'Равновесия и устойчивость', ['logistic_model', 'diff_rules', 'inequalities']],
  ['euler_method', 7, "Euler's method", 'Метод Эйлера', ['ode_verify_ivp']],
  ['sir_model', 7, 'SIR model, R₀', 'Модель SIR', ['equilibria', 'euler_method']],

  ['desc_stats', 9, 'Mean, median, mode', 'Среднее, медиана, мода', ['sigma_notation', 'percent_ratio']],
  ['variance_sd', 9, 'Variance, standard deviation', 'Дисперсия и стандартное отклонение', ['desc_stats', 'roots']],
  ['quantiles', 9, 'Quantiles, IQR, boxplot', 'Квантили, IQR, боксплот', ['desc_stats']],
  ['prob_rules', 9, 'Events, complement, addition rule', 'Правила вероятностей', ['set_ops', 'fractions']],
  ['counting', 9, 'Permutations, combinations', 'Перестановки и сочетания', ['prob_rules']],
  ['cond_prob', 9, 'Conditional probability, independence', 'Условная вероятность', ['prob_rules']],
  ['bayes', 9, 'Total probability, Bayes', 'Формула Байеса', ['cond_prob']],
  ['random_vars', 9, 'E[X], Var[X], moments', 'Случайные величины: E и Var', ['prob_rules', 'variance_sd']],
  ['binomial_poisson', 9, 'Binomial and Poisson', 'Биномиальное и пуассоновское распределения', ['random_vars', 'counting', 'exp_fn']],
  ['normal_dist', 9, 'Normal distribution, z-scores', 'Нормальное распределение, z-оценки', ['random_vars', 'variance_sd']],
  ['normal_quantiles', 9, 'Normal quantiles, 68–95–99.7', 'Квантили нормального распределения', ['normal_dist', 'quantiles']],
  ['correlation', 9, 'Covariance, Pearson r', 'Ковариация и корреляция Пирсона', ['variance_sd', 'sigma_notation']],

  ['std_error', 10, 'Standard error, CLT', 'Стандартная ошибка, ЦПТ', ['normal_dist']],
  ['conf_interval', 10, 'Confidence intervals', 'Доверительные интервалы', ['std_error', 'normal_quantiles']],
  ['hypothesis_logic', 10, 'H₀/H₁, p-value, errors', 'Логика проверки гипотез', ['std_error']],
  ['z_t_test', 10, 'z and t tests', 'z- и t-тесты', ['hypothesis_logic', 'normal_quantiles']],
  ['confusion_matrix', 10, 'Sensitivity, specificity, PPV', 'Чувствительность, специфичность, PPV', ['percent_ratio', 'cond_prob']],
  ['ppv_prevalence', 10, 'PPV from prevalence', 'PPV и распространённость', ['confusion_matrix', 'bayes']],
  ['error_propagation', 10, 'Error propagation', 'Распространение ошибок', ['partial_derivs', 'variance_sd']],

  ['polar', 12, 'Polar coordinates', 'Полярные координаты', ['trig_fns', 'pythagoras']],
  ['cyl_spherical', 12, 'Cylindrical and spherical coordinates', 'Цилиндрические и сферические координаты', ['polar', 'vec_length']],
  ['divergence', 12, 'Divergence', 'Дивергенция', ['partial_derivs', 'dot_product']],
  ['curl', 12, 'Curl', 'Ротор', ['partial_derivs', 'cross_product']],
  ['complex_arith', 12, 'Complex arithmetic', 'Комплексные числа: арифметика', ['expand', 'quadratic_eq']],
  ['complex_polar', 12, "Exponential form, Euler's formula", 'Показательная форма, формула Эйлера', ['complex_arith', 'polar', 'exp_fn']],
  ['complex_powers', 12, 'De Moivre, complex roots', 'Формула Муавра, корни', ['complex_polar']],

  ['kinematics', 13, 'Kinematics: x, v, a', 'Кинематика: x, v, a', ['diff_rules', 'definite_integral', 'units']],
  ['projectile', 13, 'Projectile motion', 'Движение тела, брошенного под углом', ['kinematics', 'vectors', 'trig_triangle', 'quadratic_eq']],
  ['newton', 13, "Newton's laws", 'Законы Ньютона', ['kinematics', 'vectors']],
  ['energy_cons', 13, 'Work, energy conservation', 'Работа и закон сохранения энергии', ['newton', 'dot_product']],
  ['momentum_cons', 13, 'Momentum, collisions', 'Импульс и столкновения', ['newton']],
  ['oscillator_phase', 13, 'Oscillator, phase space', 'Осциллятор и фазовое пространство', ['energy_cons', 'trig_fns', 'ode_verify_ivp']],
  ['rotation', 13, 'Rotation, angular momentum', 'Вращение, момент импульса', ['cross_product', 'radians', 'newton']],
  ['inertia_tensor', 13, 'Inertia tensor', 'Тензор инерции', ['rotation', 'matrix_basics', 'eigenvectors']],
  ['kepler', 13, "Gravitation, Kepler's laws", 'Гравитация и законы Кеплера', ['rotation', 'roots', 'rearrange']],

  ['ideal_gas', 14, 'Ideal gas law', 'Уравнение идеального газа', ['rearrange', 'units']],
  ['maxwell_boltzmann', 14, 'Maxwell–Boltzmann distribution', 'Распределение Максвелла–Больцмана', ['ideal_gas', 'exp_fn', 'roots']],
  ['first_law', 14, 'First law, heat capacity', 'Первое начало термодинамики', ['ideal_gas', 'energy_cons']],
  ['processes', 14, 'Thermodynamic processes, pV work', 'Термодинамические процессы', ['first_law', 'definite_integral', 'log_laws']],
  ['entropy_2nd_law', 14, 'Second law, entropy, Carnot', 'Второе начало, энтропия, цикл Карно', ['processes']],
]

export const NODES: readonly SkillNode[] = ROWS.map(([id, week, en, ru, prereqs]) => ({
  id,
  week,
  title: { en, ru },
  prereqs,
  highYield: HIGH_YIELD.has(id),
}))
