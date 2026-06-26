import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Dashboard from './dashboard/Dashboard.tsx'

const isAppHash = () => window.location.hash.startsWith('#/app')

function Root() {
  const [showApp, setShowApp] = useState(isAppHash)
  useEffect(() => {
    const on = () => setShowApp(isAppHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return showApp ? <Dashboard /> : <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
