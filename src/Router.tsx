import { useEffect, useState } from 'react'
import App from './App'
import Dashboard from './dashboard/Dashboard'
import StubPage from './StubPage'
import SupportPage from './SupportPage'
import { isAppHash, isSupportHash, readStubSlug, STUB_ROUTES, type StubSlug } from './routes'

export type { StubSlug } from './routes'

export default function Router() {
  const [route, setRoute] = useState<'app' | 'support' | StubSlug | null>(() => {
    // Support takes precedence over the dashboard so /app/support resolves to
    // the standalone SupportPage rather than the app shell.
    if (isSupportHash()) return 'support'
    if (isAppHash()) return 'app'
    return readStubSlug()
  })

  useEffect(() => {
    const on = () => {
      if (isSupportHash()) setRoute('support')
      else if (isAppHash()) setRoute('app')
      else setRoute(readStubSlug())
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  if (route === 'app') return <Dashboard />
  if (route === 'support') return <SupportPage />
  if (route && (STUB_ROUTES as readonly string[]).includes(route)) {
    return <StubPage slug={route} />
  }
  return <App />
}
