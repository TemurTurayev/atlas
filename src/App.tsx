import { useEffect, useState } from 'react'
import { Home } from './ui/screens/Home'
import { MapScreen } from './ui/screens/MapScreen'
import { Practice } from './ui/screens/Practice'
import { Run } from './ui/screens/Run'
import { Settings } from './ui/screens/Settings'
import { useAtlas } from './ui/store'

type Screen = 'home' | 'run' | 'map' | 'settings' | 'practice'

export function App() {
  const ready = useAtlas((state) => state.ready)
  const init = useAtlas((state) => state.init)
  const [screen, setScreen] = useState<Screen>('home')
  const [practiceSkill, setPracticeSkill] = useState<string | null>(null)

  useEffect(() => {
    void init()
  }, [init])

  const startPractice = (skillId: string) => {
    setPracticeSkill(skillId)
    setScreen('practice')
  }

  if (!ready) return <div className="p-6 text-muted">Загрузка…</div>
  if (screen === 'run') return <Run go={setScreen} />
  if (screen === 'map') return <MapScreen go={setScreen} onPractice={startPractice} />
  if (screen === 'practice' && practiceSkill) return <Practice skillId={practiceSkill} go={setScreen} />
  if (screen === 'settings') return <Settings go={setScreen} />
  return <Home go={setScreen} />
}
