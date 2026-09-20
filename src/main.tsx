import { MathfieldElement } from 'mathlive'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './ui/theme.css'

MathfieldElement.fontsDirectory = `${import.meta.env.BASE_URL}mathlive-fonts`
MathfieldElement.soundsDirectory = null

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
