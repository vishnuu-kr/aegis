/* eslint-disable react-refresh/only-export-components */
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

declare global {
  interface Window {
    __react_root__?: ReturnType<typeof createRoot>;
  }
}

const container = document.getElementById('root')!;
let root = window.__react_root__;
if (!root) {
  root = createRoot(container);
  window.__react_root__ = root;
}

root.render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

