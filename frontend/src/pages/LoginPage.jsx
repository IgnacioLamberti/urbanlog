import { SignIn } from '@clerk/clerk-react'

const appearance = {
  variables: {
    colorPrimary: '#38bdf8',
    colorBackground: '#111827',
    colorText: '#e2e8f0',
    colorInputBackground: 'rgba(255,255,255,0.04)',
    colorInputText: '#e2e8f0',
    fontFamily: "'Space Grotesk', sans-serif",
    borderRadius: '8px',
  },
  elements: {
    card: { boxShadow: 'none', border: '1px solid #1f2937' },
  },
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0f1e' }}>
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
            UL
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">UrbanLog</h1>
          <p className="mt-1 text-sm" style={{ color: '#4b5563' }}>Plataforma de gestión de incidentes urbanos</p>
        </div>

        <SignIn path="/login" routing="path" signUpUrl="/register" appearance={appearance} />
      </div>
    </div>
  )
}
