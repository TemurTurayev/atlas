import { useEffect, useState } from 'react'
import { Home } from './ui/screens/Home'
import { MapScreen } from './ui/screens/MapScreen'
import { Run } from './ui/screens/Run'
import { Settings } from './ui/screens/Settings'
import { useAtlas } from './ui/store'

type Screen = 'home' | 'run' | 'map' | 'settings'

export function App() {
  const ready = useAtlas((state) => state.ready)
  const init = useAtlas((state) => state.init)
  const [screen, setScreen] = useState<Screen>('home')

  useEffect(() => {
    void init()
  }, [init])

  if (!ready) return <div className="p-6 text-muted">Загрузка…</div>
  if (screen === 'run') return <Run go={setScreen} />
  if (screen === 'map') return <MapScreen go={setScreen} />
  if (screen === 'settings') return <Settings go={setScreen} />
  return <Home go={setScreen} />
}
