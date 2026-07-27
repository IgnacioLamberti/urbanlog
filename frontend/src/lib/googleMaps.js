// Referencia estable requerida por @react-google-maps/api para no re-disparar
// la carga del script en cada render. El mismo `id` en useJsApiLoader dedupe
// la carga entre distintos componentes (mapa, autocomplete, picker).
export const GOOGLE_MAPS_SCRIPT_ID = 'urbanlog-google-maps'
export const GOOGLE_MAPS_LIBRARIES = ['places']
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

export const VILLA_MARIA_CENTER = { lat: -32.4076, lng: -63.2304 }
