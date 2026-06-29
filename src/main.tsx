import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { TooltipProvider } from '@/components/ui/tooltip'
import Router from './Router'

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
    <TooltipProvider delayDuration={120}>
      <Router />
    </TooltipProvider>
  </StrictMode>,
)

