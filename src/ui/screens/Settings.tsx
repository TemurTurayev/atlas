import { useState } from 'react'
import { exportAll, importAll, loadWorld } from '../../data/repo'
import { db, useAtlas } from '../store'

const row = 'rounded-card border border-line bg-surface p-4 space-y-2'
const button = 'px-4 py-2 rounded-xl border border-line hover:border-accent'

export function Settings({ go }: { go: (screen: 'home') => void }) {
  const { world, updateSettings, replaceWorld } = useAtlas()
  const [message, setMessage] = useState('')
  if (!world) return null

  const download = async () => {
    const json = await exportAll(db, new Date())
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `atlas-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Резервная копия сохранена')
  }

  const upload = async (file: File | undefined) => {
    if (!file) return
    try {
      await importAll(db, await file.text())
      await replaceWorld(await loadWorld(db, new Date()))
      setMessage('Прогресс восстановлен')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось прочитать файл')
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">Настройки</h1>
        <button type="button" className="text-sm text-muted underline" onClick={() => go('home')}>
          Назад
        </button>
      </div>

      <div className={row}>
        <label className="block text-sm text-muted" htmlFor="exam-date">
          Дата экзамена
        </label>
        <input
          id="exam-date"
          type="date"
          value={world.settings.examDate}
          onChange={(e) => updateSettings({ examDate: e.target.value })}
          className="bg-raised border border-line rounded-lg px-3 py-2"
        />
        <p className="text-xs text-muted">Чем ближе экзамен, тем чаще приложение возвращает пройденное.</p>
      </div>

      <div className={row}>
        <label className="block text-sm text-muted" htmlFor="goal">
          Цель в день (XP ≈ минуты)
        </label>
        <input
          id="goal"
          type="number"
          min={10}
          max={120}
          value={world.settings.dailyGoalXp}
          onChange={(e) => updateSettings({ dailyGoalXp: Number(e.target.value) })}
          className="bg-raised border border-line rounded-lg px-3 py-2 w-28"
        />
      </div>

      <div className={row}>
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={world.settings.sound} onChange={(e) => updateSettings({ sound: e.target.checked })} />
          <span>Звуки</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={world.settings.paperNudge} onChange={(e) => updateSettings({ paperNudge: e.target.checked })} />
          <span>Напоминать решать многошаговые задачи на бумаге</span>
        </label>
      </div>

      <div className={row}>
        <p className="text-sm text-muted">Прогресс хранится только на этом устройстве. Раз в неделю делай копию.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={button} onClick={download}>
            Сохранить копию
          </button>
          <label className={`${button} cursor-pointer`}>
            Восстановить из копии
            <input type="file" accept="application/json" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          </label>
        </div>
        {message && <p className="text-sm text-good">{message}</p>}
      </div>
    </div>
  )
}
