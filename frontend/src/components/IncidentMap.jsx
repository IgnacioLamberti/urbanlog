import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api'
import { GOOGLE_MAPS_SCRIPT_ID, GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_API_KEY, VILLA_MARIA_CENTER } from '../lib/googleMaps'
import { CATEGORY_LABELS, STATUS_LABELS } from '../lib/labels'

const mapStyle = { width: '100%', height: '100%', borderRadius: '12px' }

const PRIORITY_COLORS = {
  critica: '#f87171',
  alta: '#fb923c',
  media: '#fbbf24',
  baja: '#34d399',
}

export default function IncidentMap({ incidents }) {
  const { isLoaded } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  })
  const [selected, setSelected] = useState(null)

  const withCoords = incidents.filter((i) => i.location?.coordinates?.coordinates?.length === 2)

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="card flex items-center justify-center" style={{ height: '500px' }}>
        <p className="text-sm text-center" style={{ color: '#4b5563' }}>
          Configurá <code className="mono">VITE_GOOGLE_MAPS_API_KEY</code> en el frontend para ver el mapa.
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="card flex items-center justify-center" style={{ height: '500px' }}>
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div style={{ height: '500px' }}>
      <GoogleMap mapContainerStyle={mapStyle} center={VILLA_MARIA_CENTER} zoom={13}>
        {withCoords.map((incident) => {
          const [lng, lat] = incident.location.coordinates.coordinates
          return (
            <Marker
              key={incident._id}
              position={{ lat, lng }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: PRIORITY_COLORS[incident.priority] || '#38bdf8',
                fillOpacity: 1,
                strokeColor: '#0a0f1e',
                strokeWeight: 2,
                scale: 9,
              }}
              onClick={() => setSelected(incident)}
            />
          )
        })}

        {selected && (
          <InfoWindow
            position={{
              lat: selected.location.coordinates.coordinates[1],
              lng: selected.location.coordinates.coordinates[0],
            }}
            onCloseClick={() => setSelected(null)}
          >
            <div style={{ color: '#0a0f1e', maxWidth: '220px' }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>{selected.title}</p>
              <p style={{ fontSize: 12, marginBottom: 4 }}>{CATEGORY_LABELS[selected.category] || selected.category}</p>
              <p style={{ fontSize: 12, marginBottom: 6 }}>{STATUS_LABELS[selected.status]} · {selected.priority}</p>
              <Link to={`/incidents/${selected._id}`} style={{ fontSize: 12, color: '#0284c7' }}>Ver detalle →</Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}
