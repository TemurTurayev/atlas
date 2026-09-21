# Atlas

A practice app for the **MQLS-CO-01 Guided Self-Study (Math/Physics)** exam — 60 minutes, 45 % to pass.
Everything is in English, the language of the exam.

## Running it

```bash
npm install     # once
npm run dev     # opens http://localhost:5173
```

## How it works

- **Start from the foundations.** Every new skill opens with an express check: two problems, no lesson. Get both and the skill counts as mastered. Miss one and the lesson starts: theory → worked example → faded example → practice.
- **Jump.** Three express checks in a row and the app offers a skill several steps ahead. Solve two problems there and everything leading up to it counts as done.
- **Repair.** Two misses in a row at the easy level, or a failed review, and the app checks the skills this one stands on and repairs the gap.
- **Reviews.** Every mastered skill comes back on an FSRS schedule: the closer the exam, the shorter the intervals. The problem is new every time.
- **Forecast.** The headline number is your predicted exam score, with the 45 % pass mark marked on the bar. The second bar is the school foundations.
- **Streak.** A day counts after five solved problems. Two freezes cover the days you miss.
- **Mock exam.** The whole paper at once, a visible clock, no hints, marked when you hand it in. Misses go straight into the review schedule.
- **Fixing mistakes.** Every miss on a mastered skill is filed with the problem itself. The next run starts with it — the same problem first, then fresh ones of the same kind.

Problems are generated from templates, built backwards from a clean answer, so they never run out.

## Your data

Progress lives in this browser only (IndexedDB) and is never sent anywhere. Once a week: **Settings → Save a backup** (downloads a JSON file).
Restoring is next to it, "Restore from a backup".

## Development

```bash
npm test          # unit tests (core, answer checking, problem generators)
npm run typecheck # tsc --noEmit
npm run build     # bundle into dist/
npm run e2e       # browser smoke test (needs npx playwright install chromium)
```

Layout:

```
src/core/graph/        125 skills: prerequisites and the learning ladder
src/core/templates/    problem generators (week0 = school foundations, week1… = course weeks)
src/core/checker/      answer checking (the single place that decides right or wrong)
src/core/learner/      per-skill state: express, lesson, tiers, jump, repair
src/core/scheduler/    spaced repetition (FSRS)
src/core/exam/         the mock exam: building a paper, grading it, filing the result
src/core/mistakes/     the error log that serves missed problems back
src/core/session/      assembling the daily run
src/data/              progress storage (Dexie/IndexedDB)
src/ui/                screens and components
docs/specs/            the design spec
docs/plans/            implementation plans
docs/research/         the skill graph, mechanics, learning science
```

A new skill is one file in `src/core/templates/week<N>/`: the shared `harness.test.ts` checks determinism, LaTeX rendering,
and that the checker accepts the reference answer and rejects a perturbed one.
