import { useEffect, useState } from 'react'
import App from './App'
import Dashboard from './dashboard/Dashboard'
import StubPage from './StubPage'
import { isAppHash, readStubSlug, STUB_ROUTES, type StubSlug } from './routes'

export type { StubSlug } from './routes'

export default function Router() {
  const [route, setRoute] = useState<'app' | StubSlug | null>(() => {
    if (isAppHash()) return 'app'
    return readStubSlug()
  })

  useEffect(() => {
    const on = () => {
      if (isAppHash()) setRoute('app')
      else setRoute(readStubSlug())
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  if (route === 'app') return <Dashboard />
  if (route && (STUB_ROUTES as readonly string[]).includes(route)) {
    return <StubPage slug={route} />
  }
  return <App />
}
