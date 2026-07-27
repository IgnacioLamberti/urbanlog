import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App.jsx'
import { queryClient } from './lib/queryClient'
import './index.css'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const root = ReactDOM.createRoot(document.getElementById('root'))

if (!CLERK_PUBLISHABLE_KEY) {
  root.render(
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0f1e' }}>
      <div className="card max-w-md text-center">
        <p className="text-2xl mb-3">⚙️</p>
        <p className="font-semibold text-white mb-2">Falta configurar Clerk</p>
        <p className="text-sm" style={{ color: '#94a3b8' }}>
          Creá <code className="mono">frontend/.env</code> a partir de <code className="mono">.env.example</code> y
          completá <code className="mono">VITE_CLERK_PUBLISHABLE_KEY</code> con tu clave pública de Clerk.
        </p>
      </div>
    </div>
  )
} else {
  root.render(
    <React.StrictMode>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} signInUrl="/login" signUpUrl="/register" afterSignOutUrl="/login">
        <QueryClientProvider client={queryClient}>
          <App />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ClerkProvider>
    </React.StrictMode>,
  )
}
