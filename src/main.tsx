import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Assicura a TypeScript che l'elemento esiste e non è nullo
const container = document.getElementById('root') as HTMLElement

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)