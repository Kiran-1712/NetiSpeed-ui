import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './base.css'
import Site from './Site'
import { pageForPath, pathFor } from './pages'
import { APP_HREF } from '@shared/site'

/**
 * Before the website existed, the dashboard lived at the root with hash routes
 * (/#/history, /#/privacy). Send those links to where the page lives now: the
 * website's own pages, or the speed test app on its subdomain.
 */
const legacyTarget = (path: string, hash: string): string | null => {
  const match = /^#\/([a-z]*)$/.exec(hash)
  if (!match) return null
  const route = match[1]
  if (route === 'about') return pathFor('about')
  if (route === 'privacy') return pathFor('privacy')
  if (path !== '/') return null
  if (route === '' || route === 'dashboard') return APP_HREF
  if (route === 'history' || route === 'tools') return `${APP_HREF}#/${route}`
  return null
}

const path = window.location.pathname.replace(/\/+$/, '') || '/'
const target = legacyTarget(path, window.location.hash)
const root = document.getElementById('root')!

if (target) {
  window.location.replace(target)
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
