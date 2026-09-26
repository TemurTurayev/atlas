import { useMemo } from 'react'
import { getTemplate } from '../../core/templates/registry'
import { RichText } from './Tex'

const MISTAKES = /^(Common mistakes?:)\s*/i

/** A topic's theory: the ideas as paragraphs, the common mistakes set apart so they are not skimmed over. */
export function TheoryCard({ skillId, compact = false }: { skillId: string; compact?: boolean }) {
  const lines = useMemo(() => getTemplate(skillId).theory.split('\n'), [skillId])
  const size = compact ? 'text-sm' : 'text-base'
  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        const mistakes = line.match(MISTAKES)
        if (!mistakes) {
          return (
            <p key={i} className={`${size} leading-relaxed`}>
              <RichText text={line} />
            </p>
          )
        }
        return (
          <p key={i} className={`${size} leading-relaxed rounded-xl border border-warn/40 bg-warn/10 px-3 py-2`}>
            <span className="font-medium text-warn">{mistakes[1]} </span>
            <RichText text={line.slice(mistakes[0].length)} />
          </p>
        )
      })}
    </div>
  )
}
