import { useState } from 'react'
import type { Problem, SolutionStep } from '../../core/templates/types'
import { RichText, Tex } from './Tex'

function Steps({ steps }: { steps: readonly SolutionStep[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="border-l-2 border-line pl-4">
          <RichText text={step.text} />
          {step.tex && <Tex tex={step.tex} display />}
        </li>
      ))}
    </ol>
  )
}

/** The worked solution, plus a second method when the template offers one. */
export function Solution({ problem }: { problem: Problem }) {
  const [showAlternative, setShowAlternative] = useState(false)
  return (
    <div className="space-y-4">
      <Steps steps={problem.solution} />
      {problem.alternative &&
        (showAlternative ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">{problem.alternative.title}</p>
            <Steps steps={problem.alternative.steps} />
          </div>
        ) : (
          <button type="button" className="text-sm text-accent underline" onClick={() => setShowAlternative(true)}>
            Another method
          </button>
        ))}
    </div>
  )
}
