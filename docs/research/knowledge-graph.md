# Knowledge graph (research output, 2026-09-19)

125 nodes, validated: all prereq ids exist, acyclic, no prereq from a later course week.
Answer types: num, expr, vec, mat, set, ivl (interval), mc (multiple choice), inter (interactive).

Format: `id | title | week | prereqs | example | answer_type`

```
int_neg | Integers & negative numbers | 0 | - | −3−(−5)·2 | num
order_ops | Order of operations | 0 | int_neg | 2+3(4−6)²÷2 | num
fractions | Fraction arithmetic | 0 | order_ops | 3/4 − 2/3 ÷ 4/9 | num
percent_ratio | Decimals, percent, ratios | 0 | fractions | % increase 80→92 | num
powers | Integer exponents, exponent laws | 0 | fractions | simplify (x³y⁻²)²/x⁴ | expr
roots | Roots, rational exponents | 0 | powers | 27^(2/3); √50 | num
sci_notation | Scientific notation, sig figs | 0 | powers, percent_ratio | (3×10⁵)(4×10⁻⁸) | num
units | SI prefixes, unit conversion | 0 | sci_notation | 72 km/h → m/s | num
algebra_expr | Substitution, like terms | 0 | order_ops, fractions | 3a²−2ab at a=−2,b=3 | num
expand | Expanding, binomial formulas | 0 | algebra_expr, powers | (2x−3)² | expr
factor | Factoring (common, a²−b², trinomial) | 0 | expand | x²−5x+6 | expr
alg_fractions | Algebraic fractions | 0 | factor | (x²−1)/(x²+x) | expr
linear_eq | Linear equations | 0 | algebra_expr | 3x−7=11 | num
rearrange | Rearranging formulas | 0 | linear_eq, alg_fractions | 1/f=1/a+1/b for b | expr
quadratic_eq | Quadratic formula, discriminant | 0 | factor, roots | 2x²−3x−2=0 | set
sim_eq_2x2 | 2×2 simultaneous equations | 0 | linear_eq | x+y=5, 2x−y=1 | vec
inequalities | Linear, quadratic, abs-value inequalities | 0 | linear_eq, quadratic_eq | x²−4<0 | ivl
sigma_notation | Summation notation | 0 | order_ops | Σ_{i=1..4} i² | num
geometry | Angles, areas, volumes | 0 | order_ops | sphere volume, r=3 | num
pythagoras | Pythagoras | 0 | roots, geometry | legs 5,12 → hypotenuse | num
lines_2d | Coordinates, distance, straight lines | 0 | linear_eq, pythagoras | line through (1,2),(3,8) | expr
graphs_basic | Reading/sketching graphs (line, parabola, 1/x) | 0 | lines_2d, quadratic_eq | drag parabola to y=(x−1)²−2 | inter
trig_triangle | Right-triangle trig | 0 | pythagoras, fractions | opposite side, hyp 10, 30° | num
radians | Radians, unit circle | 0 | trig_triangle, geometry | 135° in rad | expr

sets | Sets, ℕ ℤ ℚ ℝ | 1 | int_neg | is √2∈ℚ? | mc
intervals | Interval notation | 1 | sets, inequalities | {x: −2<x≤5} | ivl
set_ops | Union, intersection, difference, complement | 1 | sets | A\B, A∩B | set
product_powerset | Cartesian product, power set | 1 | set_ops | P({a,b,c}); A×B | set
functions | Domain, codomain, image | 1 | sets, intervals, alg_fractions | domain of √(x−2)/(x−5) | ivl
injective | Injective/surjective/bijective | 1 | functions | is x² on ℝ injective? | mc
composition | Composite functions | 1 | functions | f∘g, f=x², g=x+1 | expr
inverse_fn | Inverse functions | 1 | injective, composition, rearrange | inverse of (2x+1)/(x−3) | expr
transformations | Shifts, stretches, reflections | 1 | graphs_basic, composition | drag graph to f(x−2)+1 | inter
polynomials | Degree, roots, factor theorem | 1 | factor, quadratic_eq | roots of x³−6x²+11x−6 | set
poly_division | Polynomial long division | 1 | polynomials | (x³−2x+1)÷(x−1) | expr
exp_fn | Exponential functions, e | 1 | roots, graphs_basic | 200·2^(t/3) at t=9 | num
log_laws | Logarithms, log laws | 1 | exp_fn | log₂32; ln(a²b)−ln(ab) | expr
exp_log_eq | Exponential/log equations | 1 | log_laws, rearrange | 5e^(0.2t)=20 | num
trig_fns | Trig graphs, exact values, identities | 1 | radians, transformations | sin x=½ on [0,2π) | set
limits | Limits (0/0, x→∞) | 1 | alg_fractions, polynomials | lim_{x→2}(x²−4)/(x−2) | num
continuity | Continuity, piecewise | 1 | limits | a making piecewise f continuous | num

vectors | Components, addition, scaling | 2 | lines_2d | 2(1,−1,3)−(0,2,1) | vec
vec_length | Length, unit vector | 2 | vectors, pythagoras | ‖(2,−1,2)‖ | num
dot_product | Dot product, orthogonality | 2 | vectors | (1,2,3)·(4,−5,6) | num
vec_angle | Angle between vectors | 2 | dot_product, vec_length, trig_fns | ∠((1,0,1),(0,1,1)) | num
cross_product | Cross product | 2 | vectors | (1,2,0)×(0,1,3) | vec
lines_param | Parametric lines 2D/3D | 2 | vectors, lines_2d | line through (1,0,2),(3,1,0) | expr
planes | Plane equations, line–plane intersection | 2 | dot_product, cross_product, lines_param | plane through 3 points | expr
linsys_geometry | 2D/3D systems: 0/1/∞ solutions | 2 | sim_eq_2x2, planes | solution count for 3 given planes | mc

matrix_basics | Matrix notation, sum, transpose | 3 | vectors | 2A−Bᵀ | mat
matrix_mult | Matrix and matrix–vector products | 3 | matrix_basics, dot_product | (2×3)(3×2) | mat
det_2x2 | 2×2 determinant | 3 | matrix_basics | det[[3,1],[4,2]] | num
det_3x3 | 3×3 determinant, properties | 3 | det_2x2 | 3×3 with integer entries | num
inverse_2x2 | 2×2 inverse formula | 3 | det_2x2, matrix_mult | [[2,1],[5,3]]⁻¹ | mat
gauss_elim | Gaussian elimination | 3 | linsys_geometry, matrix_basics | 3×3 system | vec
gauss_jordan_inv | Inverse via Gauss–Jordan | 3 | gauss_elim, matrix_mult | invert 3×3 | mat
solvability | Rank, singularity, parameter cases | 3 | gauss_elim, det_3x3 | k giving a unique solution | set

eigen_check | Eigenvector definition, checking | 4 | matrix_mult | is (1,1) an eigenvector? λ? | mc
char_poly | Characteristic polynomial, eigenvalues | 4 | det_2x2, det_3x3, quadratic_eq, polynomials | eigenvalues of [[4,1],[2,3]] | set
eigenvectors | Eigenvectors, eigenspaces | 4 | char_poly, gauss_elim, eigen_check | eigenvector for λ=5 | vec
diagonalization | A=PDP⁻¹, powers Aⁿ | 4 | eigenvectors, inverse_2x2 | A¹⁰ | mat
least_squares | Least squares, normal equations | 4 | matrix_mult, inverse_2x2, sigma_notation | best line through (0,1),(1,3),(2,4) | vec
regularization | Ridge regularization | 4 | least_squares | (AᵀA+λI)x=Aᵀb, λ=1 | vec

derivative_def | Derivative as slope; difference quotient | 5 | limits, lines_2d | f′(2) of x² from definition | num
diff_rules | Power rule; derivatives of eˣ, ln, sin, cos | 5 | derivative_def, exp_fn, log_laws, trig_fns | d/dx(3x⁴−2eˣ+ln x) | expr
product_quotient | Product and quotient rules | 5 | diff_rules | d/dx(x² sin x) | expr
chain_rule | Chain rule | 5 | diff_rules, composition | d/dx e^(−x²/2) | expr
extrema_1d | Critical points, max/min, optimization | 5 | chain_rule, product_quotient, quadratic_eq | extrema of x³−3x on [−2,3] | set
antiderivatives | Antiderivatives | 5 | diff_rules | ∫(3x²+1/x)dx | expr
definite_integral | Definite integral, FTC, area | 5 | antiderivatives | ∫₀² x² dx | num
substitution | Integration by substitution | 5 | definite_integral, chain_rule | ∫x e^(x²)dx | expr
by_parts | Integration by parts | 5 | definite_integral, product_quotient | ∫x eˣ dx | expr

multivar_fns | f(x,y), level curves | 6 | functions, graphs_basic | level set x²+y²=4 | mc
partial_derivs | Partial derivatives (1st, 2nd) | 6 | chain_rule, product_quotient, multivar_fns | ∂/∂y (x²y³+sin xy) | expr
gradient | Gradient vector | 6 | partial_derivs, vectors | ∇f at (1,2) | vec
directional_deriv | Directional derivative | 6 | gradient, vec_length, dot_product | D_u f toward (3,4) | num
critical_2d | Critical points in ℝ², Hessian test | 6 | partial_derivs, sim_eq_2x2, det_2x2 | classify points of x³−3x+y² | mc

ode_classify | Order, linearity, autonomy | 7 | derivative_def | classify y″+y·y′=0 | mc
ode_verify_ivp | Verify solution, initial values | 7 | chain_rule | C in y=Ce^{2t}, y(0)=3 | num
separation | Separation of variables | 7 | substitution, exp_log_eq, ode_verify_ivp | dy/dt=ty, y(0)=1 | expr
exp_model | Exponential growth/decay, half-life | 7 | separation | t½ for k=0.1/h | num
logistic_model | Logistic growth: r, K | 7 | exp_model, alg_fractions | K, max rate of P′=0.5P(1−P/100) | num
equilibria | Equilibria & stability (phase line) | 7 | logistic_model, diff_rules, inequalities | classify equilibria of y′=y(1−y)(y−2) | set
euler_method | Euler's method (numerical solving is a stated learning goal) | 7 | ode_verify_ivp | 2 steps, h=0.1, y′=y+t | num
sir_model | SIR model, R₀, threshold | 7 | equilibria, euler_method | R₀=βN/γ; does I grow? | num

desc_stats | Mean, median, mode | 9 | sigma_notation, percent_ratio | median of 7 values | num
variance_sd | Variance, SD | 9 | desc_stats, roots | SD of 2,4,4,4,5,5,7,9 | num
quantiles | Quantiles, IQR, boxplot | 9 | desc_stats | Q1, Q3, IQR | num
prob_rules | Events, complement, addition rule | 9 | set_ops, fractions | P(A∪B) | num
counting | Permutations, combinations | 9 | prob_rules | C(10,3) | num
cond_prob | Conditional probability, independence, trees | 9 | prob_rules | P(A∣B) from 2×2 table | num
bayes | Total probability, Bayes, prior→posterior | 9 | cond_prob | P(disease∣+) | num
random_vars | E[X], Var[X], moments | 9 | prob_rules, variance_sd | E, Var from pmf table | num
binomial_poisson | Binomial & Poisson | 9 | random_vars, counting, exp_fn | P(X=2), λ=3 | num
normal_dist | Normal distribution, z-scores | 9 | random_vars, variance_sd | P(X<130), N(100,15²) | num
normal_quantiles | Normal quantiles, 68–95–99.7 | 9 | normal_dist, quantiles | 97.5th percentile of N(100,15²) | num
correlation | Covariance, Pearson r | 9 | variance_sd, sigma_notation | match scatterplot to r | mc

std_error | Sampling distribution, SE, CLT | 10 | normal_dist | SE for s=12, n=36 | num
conf_interval | Confidence intervals | 10 | std_error, normal_quantiles | 95% CI, x̄=50, s=10, n=25 | ivl
hypothesis_logic | H₀/H₁, p-value, α, type I/II | 10 | std_error | correct reading of p=0.03 | mc
z_t_test | z/t tests | 10 | hypothesis_logic, normal_quantiles | t statistic and decision | num
confusion_matrix | Sens, spec, PPV, NPV, accuracy | 10 | percent_ratio, cond_prob | PPV from 2×2 table | num
ppv_prevalence | PPV from sens/spec/prevalence | 10 | confusion_matrix, bayes | sens 90%, spec 95%, prev 2% | num
error_propagation | Error propagation | 10 | partial_derivs, variance_sd | σ_V for V=πr²h | num

polar | Polar coordinates | 12 | trig_fns, pythagoras | (1,√3) → (r,θ) | vec
cyl_spherical | Cylindrical & spherical coordinates | 12 | polar, vec_length | (r,θ,φ)=(2,π/2,0) → xyz | vec
divergence | Divergence | 12 | partial_derivs, dot_product | div(x²y, yz, xz) | expr
curl | Curl | 12 | partial_derivs, cross_product | curl(−y,x,0) | vec
complex_arith | Complex arithmetic, conjugate, modulus | 12 | expand, quadratic_eq | (2+3i)(1−i); 1/(1+i) | expr
complex_polar | Exponential form, Euler's formula | 12 | complex_arith, polar, exp_fn | 1+i as re^{iθ} | expr
complex_powers | De Moivre, roots, complex quadratic roots | 12 | complex_polar | (1+i)⁸; z²+2z+5=0 | set

kinematics | x, v, a via d/dt and ∫ | 13 | diff_rules, definite_integral, units | v(t), a(t) of x=4t−t³ | expr
projectile | 2D trajectories, projectiles | 13 | kinematics, vectors, trig_triangle, quadratic_eq | range at 30°, 20 m/s | num
newton | Newton's laws, F=ma | 13 | kinematics, vectors | a on a frictionless 30° incline | num
energy_cons | Work, KE, PE, energy conservation | 13 | newton, dot_product | speed after 5 m drop | num
momentum_cons | Momentum, collisions | 13 | newton | final v, perfectly inelastic | num
oscillator_phase | Harmonic oscillator, phase space | 13 | energy_cons, trig_fns, ode_verify_ivp | period for m=0.5 kg, k=200 N/m | num
rotation | Angular velocity, torque, angular momentum | 13 | cross_product, radians, newton | L=r×p | vec
inertia_tensor | Moment of inertia, inertia tensor | 13 | rotation, matrix_basics, eigenvectors | tensor of 2 point masses | mat
kepler | Gravitation, Kepler's laws | 13 | rotation, roots, rearrange | T at 4× orbital radius | num

ideal_gas | Ideal gas law, moles, kelvin | 14 | rearrange, units | p after 300→450 K, constant V | num
maxwell_boltzmann | Kinetic theory, Maxwell–Boltzmann | 14 | ideal_gas, exp_fn, roots | v_rms of N₂ at 300 K | num
first_law | ΔU=Q−W, heat capacity | 14 | ideal_gas, energy_cons | heat to warm 2 kg water by 10 K | num
processes | Isothermal/isobaric/isochoric/adiabatic, pV work | 14 | first_law, definite_integral, log_laws | W for isothermal V→2V | num
entropy_2nd_law | Second law, entropy, Carnot | 14 | processes | ΔS isothermal doubling; η at 300/500 K | num
```

Bottleneck foundations (descendant counts of 124): fractions 117, powers 104, algebra_expr 91, linear_eq 81, factor 68, quadratic_eq 64.

## High-yield nodes (for a 45 % pass mark)
set_ops + functions (domain), vec_angle, matrix_mult, det_3x3, gauss_elim, char_poly, chain_rule (+product_quotient),
extrema_1d, by_parts + substitution, gradient, separation, equilibria, ppv_prevalence (+bayes), conf_interval,
complex_arith, ideal_gas + first_law.

Low yield per hour: inertia_tensor, maxwell_boltzmann, regularization, cyl_spherical, kepler, curl, gauss_jordan_inv.

## Handout reference (week 1, gsm_functions.pdf, Winkler)
Exam-style items seen: real zeros of quadratics/cubics/biquadratics (x⁴−5x²+4 via z=x²), x⁵−2x⁴ (multiplicity),
interval of parameter b so x²+bx+4 has two distinct real roots → b∈(−∞,−4)∪(4,∞),
irreducible factorisation of cubics given one root via long division, long division of rational functions
((x³+2x²+x+1)/(x²+1) = x+2 − 1/(x²+1)), set ops with A={1,2}, B={2,3} incl. A×B and P(A).
