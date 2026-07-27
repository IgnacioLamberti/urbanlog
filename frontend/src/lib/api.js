import axios from 'axios'

// En desarrollo queda vacío y las peticiones a /api las redirige el proxy de
// Vite al backend local. En producción debe apuntar a la URL pública del
// backend, ya que allí no existe tal proxy.
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export const api = axios.create({ baseURL: `${API_BASE_URL}/api/v1` })
