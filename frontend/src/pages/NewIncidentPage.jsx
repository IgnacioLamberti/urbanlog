import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateIncident } from '../hooks/useCreateIncident'
import LocationPicker from '../components/LocationPicker'
import ImageUploader from '../components/ImageUploader'
import { CATEGORY_LABELS } from '../lib/labels'

export default function NewIncidentPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '' })
  const [location, setLocation] = useState({ address: '', lat: null, lng: null })
  const [images, setImages] = useState([])
  const { mutate, isPending, error, data: result, reset } = useCreateIncident()

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    mutate({ ...form, location, images })
  }

  const priorityColors = { critica: '#f87171', alta: '#fb923c', media: '#fbbf24', baja: '#34d399' }
  const apiError = error?.response?.data?.error

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Nuevo Reporte</h1>
        <p className="text-sm mt-1" style={{ color: '#4b5563' }}>
          La IA clasificará, normalizará y priorizará el incidente automáticamente
        </p>
      </div>

      {!result ? (
        <div className="card">
          {apiError && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171'
            }}>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>Título del incidente *</label>
              <input name="title" value={form.title} onChange={handleChange} className="input-field" placeholder="Ej: Bache en calle principal" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>Descripción *</label>
              <textarea
                name="description" value={form.description} onChange={handleChange} className="input-field"
                placeholder="Describí el problema con el mayor detalle posible..." rows={5} required style={{ resize: 'vertical' }}
              />
              <p className="text-xs mt-1" style={{ color: '#374151' }}>Más detalles = mejor clasificación por IA</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>Ubicación</label>
              <LocationPicker location={location} onChange={setLocation} />
            </div>

            <ImageUploader files={images} onChange={setImages} />

            <div className="flex items-center gap-2 py-3 px-4 rounded-lg" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)' }}>
              <div className="w-2 h-2 rounded-full pulse-dot" style={{ background: '#818cf8' }}></div>
              <p className="text-xs" style={{ color: '#818cf8' }}>
                La IA analizará tu reporte, mejorará la descripción y asignará categoría y prioridad automáticamente
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate('/incidents')} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary flex-1 justify-center" disabled={isPending}>
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analizando con IA...
                  </>
                ) : 'Enviar Reporte'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="fade-in space-y-4">
          <div className="p-5 rounded-xl" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-400">✓</span>
              <p className="font-semibold text-white">Reporte creado exitosamente</p>
            </div>
            <p className="text-xs" style={{ color: '#4b5563' }}>
              {new Date(result.createdAt).toLocaleString('es-AR')} · pendiente de moderación
            </p>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full" style={{ background: '#818cf8' }}></div>
              <h2 className="font-semibold text-white text-sm">Análisis de Inteligencia Artificial</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#4b5563' }}>Descripción normalizada</p>
                <p className="text-sm text-white">{result.normalizedDescription}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg" style={{ background: '#0a0f1e' }}>
                  <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#4b5563' }}>Categoría detectada</p>
                  <p className="text-sm font-medium text-white">{CATEGORY_LABELS[result.category] || result.category}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: '#0a0f1e' }}>
                  <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#4b5563' }}>Prioridad asignada</p>
                  <p className="text-sm font-bold capitalize" style={{ color: priorityColors[result.priority] }}>● {result.priority}</p>
                </div>
              </div>

              {result.possibleDuplicateOf && (
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24' }}>
                  ⚠ La IA detectó que podría ser un reporte duplicado. Un moderador lo va a revisar.
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { reset(); setForm({ title: '', description: '' }); setLocation({ address: '', lat: null, lng: null }); setImages([]) }}
              className="btn-secondary flex-1"
            >
              Crear otro reporte
            </button>
            <button onClick={() => navigate('/incidents')} className="btn-primary flex-1 justify-center">
              Ver todos los incidentes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
