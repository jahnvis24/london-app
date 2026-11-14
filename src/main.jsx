import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ConsentBanner from './ConsentBanner.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <ConsentBanner />
  </StrictMode>,
)
