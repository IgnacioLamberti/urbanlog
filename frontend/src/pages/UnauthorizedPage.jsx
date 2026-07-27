import { Link } from 'react-router-dom'

export default function UnauthorizedPage() {
  return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="card text-center py-12 max-w-md">
        <p className="text-3xl mb-3">🚫</p>
        <p className="font-semibold text-white mb-1">No tenés acceso a esta sección</p>
        <p className="text-sm mb-6" style={{ color: '#4b5563' }}>
          Tu rol actual no tiene permisos para ver esta página.
        </p>
        <Link to="/" className="btn-primary">Volver al Dashboard</Link>
      </div>
    </div>
  )
}
