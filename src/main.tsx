import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import FitnessApp from './FitnessApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FitnessApp />
  </StrictMode>,
)
