let context: AudioContext | null = null

function blip(frequency: number, seconds: number): void {
  context = context ?? new AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.frequency.value = frequency
  oscillator.type = 'sine'
  gain.gain.setValueAtTime(0.06, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + seconds)
  oscillator.connect(gain).connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + seconds)
}

/** Short feedback sounds; silently ignored when the browser blocks audio. */
export function play(kind: 'correct' | 'incorrect' | 'mastered', enabled: boolean): void {
  if (!enabled) return
  try {
    if (kind === 'correct') blip(880, 0.12)
    else if (kind === 'incorrect') blip(220, 0.18)
    else {
      blip(660, 0.12)
      setTimeout(() => blip(990, 0.16), 120)
    }
  } catch {
    /* audio unavailable */
  }
}
