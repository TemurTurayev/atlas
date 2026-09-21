import { useEffect, useState } from 'react'
import { examRemainingMs } from '../../core/exam/state'
import type { ExamState } from '../../core/exam/types'

/**
 * Milliseconds left on the paper. Read from the clock on every render — a value kept in state
 * would report a stale zero on the render that starts the exam, and hand the paper in at once.
 */
export function useExamClock(exam: ExamState | null): number {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!exam || exam.finishedAt !== null) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [exam])
  return exam ? examRemainingMs(exam, new Date()) : 0
}

/** The clock stays visible on purpose: hiding it does not reduce exam anxiety (Maki, 2024). */
export function ExamClock({ remainingMs }: { remainingMs: number }) {
  const seconds = Math.ceil(remainingMs / 1000)
  const low = remainingMs <= 5 * 60_000
  return (
    <span className={`text-lg tabular-nums ${low ? 'text-warn' : 'text-ink'}`} aria-label="time remaining">
      {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
    </span>
  )
}
