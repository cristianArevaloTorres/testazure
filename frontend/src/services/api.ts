import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
  withCredentials: false,
})

// Request interceptor – attach Bearer token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token && token !== 'demo-token') {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient
