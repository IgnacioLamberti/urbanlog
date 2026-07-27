import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api'
import AddressAutocomplete from './AddressAutocomplete'
import { GOOGLE_MAPS_SCRIPT_ID, GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_API_KEY, VILLA_MARIA_CENTER } from '../lib/googleMaps'

const mapStyle = { width: '100%', height: '260px', borderRadius: '12px' }

export default function LocationPicker({ location, onChange }) {
  const { isLoaded } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  const center = location?.lat && location?.lng ? { lat: location.lat, lng: location.lng } : VILLA_MARIA_CENTER

  function handleMapClick(e) {
    onChange({ ...location, lat: e.latLng.lat(), lng: e.latLng.lng() })
  }

  return (
    <div className="space-y-3">
      <AddressAutocomplete
        value={location?.address || ''}
        onSelect={(place) => onChange(place)}
      />

      {GOOGLE_MAPS_API_KEY && isLoaded && (
        <GoogleMap mapContainerStyle={mapStyle} center={center} zoom={15} onClick={handleMapClick}>
          {location?.lat && location?.lng && <Marker position={{ lat: location.lat, lng: location.lng }} />}
        </GoogleMap>
      )}

      <p className="text-xs" style={{ color: '#374151' }}>
        Buscá una dirección o hacé click en el mapa para ajustar el pin.
      </p>
    </div>
  )
}
