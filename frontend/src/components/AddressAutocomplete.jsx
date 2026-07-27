import { useRef } from 'react'
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api'
import { GOOGLE_MAPS_SCRIPT_ID, GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_API_KEY } from '../lib/googleMaps'

export default function AddressAutocomplete({ value, onSelect }) {
  const { isLoaded } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  })
  const autocompleteRef = useRef(null)

  function handlePlaceChanged() {
    const place = autocompleteRef.current?.getPlace()
    if (!place?.geometry) return
    onSelect({
      address: place.formatted_address || place.name,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    })
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <input
        className="input-field"
        placeholder="Configurá VITE_GOOGLE_MAPS_API_KEY para habilitar el autocompletado"
        value={value}
        onChange={(e) => onSelect({ address: e.target.value, lat: null, lng: null })}
      />
    )
  }

  if (!isLoaded) return <input className="input-field" disabled placeholder="Cargando Google Maps..." />

  return (
    <Autocomplete onLoad={(ac) => (autocompleteRef.current = ac)} onPlaceChanged={handlePlaceChanged}>
      <input
        className="input-field"
        placeholder="Buscá una dirección..."
        defaultValue={value}
      />
    </Autocomplete>
  )
}
