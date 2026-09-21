import { MathfieldElement } from 'mathlive'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './ui/theme.css'

MathfieldElement.fontsDirectory = `${import.meta.env.BASE_URL}mathlive-fonts`
MathfieldElement.soundsDirectory = null

// A new version is deployed while a tab is open: the fresh worker takes over (autoUpdate), and the
// page is still running the old bundle until it reloads. Do it once, straight away.
if ('serviceWorker' in navigator) {
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
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
