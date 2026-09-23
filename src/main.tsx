import { MathfieldElement } from 'mathlive'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './ui/theme.css'

MathfieldElement.fontsDirectory = `${import.meta.env.BASE_URL}mathlive-fonts`
MathfieldElement.soundsDirectory = null

// A new version is deployed while a tab is open: the fresh worker takes over (autoUpdate), and the
// page is still running the old bundle until it reloads. Do it once, straight away — but not on the
// very first visit, where the same event only means the worker has just claimed a page that is
// already current.
if ('serviceWorker' in navigator) {
  const wasControlled = navigator.serviceWorker.controller !== null
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!wasControlled || reloading) return
    reloading = true
    window.location.reload()
  })
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
