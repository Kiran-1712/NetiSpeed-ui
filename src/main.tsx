import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import Site from './site/Site'
import { pageForPath, pathFor } from './site/pages'
import { APP_PATH } from './utils/site'

/**
 * Before the website existed, the dashboard lived at the root with hash routes
 * (/#/history, /#/privacy). Send those links to where the page lives now.
 */
const legacyTarget = (path: string, hash: string): string | null => {
  const match = /^#\/([a-z]*)$/.exec(hash)
  if (!match) return null
  const route = match[1]
  if (route === 'about') return pathFor('about')
  if (route === 'privacy') return pathFor('privacy')
  if (path !== '/') return null
  if (route === '' || route === 'dashboard') return APP_PATH
  if (route === 'history' || route === 'tools') return `${APP_PATH}#/${route}`
  return null
}

const path = window.location.pathname.replace(/\/+$/, '') || '/'
const target = legacyTarget(path, window.location.hash)
const root = document.getElementById('root')!

if (target) {
  window.location.replace(target)
} else if (path === APP_PATH) {
  // The dashboard is a fixed, non-scrolling viewport; the website scrolls.
  document.body.classList.add('app-mode')
  // A hash change doesn't reload the page, so check old links again here.
  window.addEventListener('hashchange', () => {
    const next = legacyTarget(path, window.location.hash)
    if (next) window.location.replace(next)
  })
  // Loaded on demand so the website never downloads the speed test engine or the map.
  void import('./App.tsx').then(({ default: App }) => {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
} else {
  const site = (
    <StrictMode>
      <Site page={pageForPath(path)} />
    </StrictMode>
  )
  // Built pages arrive prerendered; the dev server sends an empty root.
  if (root.hasChildNodes()) hydrateRoot(root, site)
  else createRoot(root).render(site)
}
