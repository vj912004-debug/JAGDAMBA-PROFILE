import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Load profile ERP styles with the first page paint (fixes Party Master GST fields on fresh Chrome open).
import './projects/profile/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
