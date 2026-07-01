import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyTheme, getStoredTheme } from './tokens.js'

function setVisualViewportHeight() {
  const vv = window.visualViewport
  const h = vv?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--vvh', `${Math.round(h)}px`)
}

setVisualViewportHeight()
window.visualViewport?.addEventListener('resize', setVisualViewportHeight)
window.visualViewport?.addEventListener('scroll', setVisualViewportHeight)
window.addEventListener('resize', setVisualViewportHeight)

// Apply the persisted theme BEFORE first render to avoid FOUC
applyTheme(getStoredTheme());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
