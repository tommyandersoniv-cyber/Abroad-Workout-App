import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'

// registerType: 'autoUpdate' makes this reload the page the moment a new
// service worker activates — no stale install waiting for a manual relaunch.
// Installed PWAs (esp. iOS home-screen) rarely reopen often enough to notice
// an update on their own, so also poll for one periodically while open.
registerSW({
  onRegisteredSW(_url, registration) {
    if (!registration) return
    setInterval(() => registration.update(), 60 * 60 * 1000)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
