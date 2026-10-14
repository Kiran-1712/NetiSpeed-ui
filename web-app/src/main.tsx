import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WEBSITE_ORIGIN, WEBSITE_PATHS } from '@shared/site'

/**
 * The About and Privacy pages used to be dashboard hash routes (#/about,
 * #/privacy). They live on the website now, so send old links there.
 */
const legacyTarget = (hash: string): string | null => {
  const route = /^#\/([a-z]*)$/.exec(hash)?.[1]
  if (route === 'about') return WEBSITE_ORIGIN + WEBSITE_PATHS.about
  if (route === 'privacy') return WEBSITE_ORIGIN + WEBSITE_PATHS.privacy
  return null
}

const redirectLegacy = () => {
  const target = legacyTarget(window.location.hash)
  if (target) window.location.replace(target)
  return target !== null
}

if (!redirectLegacy()) {
  // A hash change doesn't reload the page, so check old links again here.
  window.addEventListener('hashchange', redirectLegacy)
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
