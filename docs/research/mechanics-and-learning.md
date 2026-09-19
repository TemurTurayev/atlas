# Research notes: learning science, mechanics, tech (2026-09-19)

## Learning science — evidence-backed principles
1. Retrieval practice > restudy (g≈0.5–0.6; math-specific smaller). Whole-problem retrieval, not formula flashcards.
2. Spacing (g≈0.74). Optimal gap ≈ 10–20 % of retention interval for a ~4-month horizon.
3. Interleaving after initial acquisition (Rohrer 2020: 61 % vs 38 %, d=0.83); best for similar-looking, different-method problems.
4. Worked → faded (backward fading) → independent; drop examples once competent (expertise reversal).
5. Self-explanation prompts (g≈0.55): one "why this step?" per example.
6. Mastery gating (+0.52 SD). Math Academy: failed lesson → pause, repair prerequisites.
7. ~80–85 % success target.
8. Task-focused feedback, never about the person.
9. Intrinsic integration (Zombie Division: 7× voluntary play). DragonBox warning: game-notation skills didn't transfer to paper → always end in exam notation.
10. Informational rewards good, expected tangible rewards undermine intrinsic motivation. Gamification motivation effect fades after ~4 weeks.

Sources: Adesope 2017; Pan & Rickard 2018; Latimier 2021; Cepeda 2008; Rohrer 2020; Brunmair & Richter 2019; Barbieri 2023;
Kalyuga 2009; Bisra 2018; Kulik 1990; mathacademy.com/how-our-ai-works; Wilson 2019; Kluger & DeNisi 1996;
Habgood & Ainsworth 2011; Long & Aleven 2017; Deci/Koestner/Ryan 1999; Sailer & Homner 2020; Rodrigues 2022;
justinmath.com (FIRe, sustainable XP); expertium.github.io/Benchmark.html (FSRS); Duolingo streak blog posts;
Silverman & Barasch 2023; Kao 2020 (juiciness); Hanus & Fox 2015 (leaderboards hurt); Ramirez & Beilock 2011 (expressive writing before exams).

### Include
Knowledge map as world map; exam-readiness meter; low-bar streak + 2 freezes + planned rest day; bosses = timed exam-format quizzes;
personal-best ghost instead of leagues; occasional surprise rewards; moderate juice; medical contexts (SIR, half-life, Michaelis–Menten);
typed symbolic answers; reminder ~23.5 h after last session.
### Avoid
Leaderboards; XP farming; visible XP during problems; MC-only; idle accumulation; hearts/lives; guilt notifications;
minigame-as-reward; extreme juice; sessions > 60 min.

## Mechanics per topic (for phases 2–5)
- W1 functions: Graph Rider (SineRider-like), Tile Divider (algebra tiles for long division), Graph Guess-Who, ε–δ duel, Growth Idle (log equations).
- W2 vectors: Vector Racer, Shadow Caster (projection/dot product), Plane Slicer (3D).
- W3 matrices: Transform Match (drag basis vectors, area gauge = det), Row-Op Puzzle (Gauss–Jordan with par score).
- W4 eigen: Eigen Hunt (drag v until Av ∥ v), Power Iteration, Line Fitter (residual squares area = SSE, ridge λ slider).
- W5 calculus: Slope Sketcher, Riemann Builder, Box Optimizer, Technique Deck (integration roguelike cards).
- W6 multivariable: Fog Hiker (gradient compass), Slice Cutter (partials), Contour Detective (Hessian).
- W7 ODE: Epidemic Control Room (SIR, R₀, capacity line), Ball Drop (phase line stability), Harvest Farm (logistic + harvesting), Separation Workbench.
- W9 stats: Screening Clinic (1000 patients → PPV), Galton/Poisson board, Guess the Stat.
- W10 inference: CI Fishing, Hypothesis Court, Cutoff Slider (ROC), Lab Bench (error propagation vs Monte Carlo).
- W12: Radar Station (polar/spherical), Paddle-Wheel Probe (div/curl), Complex Compass.
- W13: Orbit Slingshot (Δv, E & L conserved, Kepler), Phase-Space Pendulum, Spin Lab (inertia tensor, Dzhanibekov).
- W14: Molecule Box (PV=nRT, Maxwell–Boltzmann), Engine Designer (PV cycles, ΔU=Q−W ledger), Entropy Shuffle (Einstein solid).
Signature: Equation Workbench (drag-to-solve algebra), Clinic/Epidemic Lab hub, Orbital Sandbox, Predict→Play→Prove.
References: sinerider.com, setosa.io, ncase.me/covid-19, seeing-theory.brown.edu, rpsychologist.com/d3/ci, mlu-explain.github.io,
phet.colorado.edu, ciechanow.ski, complex-analysis.com, physics.weber.edu/schroeder/md, graspablemath.com.

## Tech notes
- Compute Engine: pin exact version; spike (0.131.3) confirmed numeric-sampling equivalence works for polynomials, rationals,
  roots, logs, trig special values, exponentials; parses Tuple for "2, 3", Union/Interval for interval notation, raw form keeps
  InvisibleOperator/Delimiter for form checks. `\ln 4 \cdot 5` → Ln(20) (function binds the product).
- MathLive bundles an old CE — don't use `mf.expression`; parse `mf.getValue('latex')` with our CE. Serve fonts locally.
- Desmos API unsuitable (online key, licensing). Use JSXGraph for 2D, three.js/r3f for 3D in later phases.
- FSRS: one card per skill; first graded attempt per day updates the card; later attempts = practice.
- Claude tutor (phase 2): Haiku 4.5, user-entered key stored locally, never in VITE_* env; checker decides correctness; leak guard.
- Problem generation: construct from the answer backwards (integer roots → expand; A = P D P⁻¹ with det P = ±1; pick F then differentiate).
