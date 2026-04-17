import apiClient from './api'
import { useAuthStore } from '@/store/authStore'
import type { LoginResponse } from '@/types'

// Demo users for presentation when backend is not deployed
const DEMO_USERS: Record<string, { password: string; user: LoginResponse['user'] }> = {
  'admin@locktonorion.com': {
    password: 'Admin@1234',
    user: { id: '1', email: 'admin@locktonorion.com', name: 'Admin User', role: 'Admin' },
  },
  'supervisor@locktonorion.com': {
    password: 'Super@1234',
    user: { id: '2', email: 'supervisor@locktonorion.com', name: 'Supervisor User', role: 'Supervisor' },
  },
  'asesor@locktonorion.com': {
    password: 'Asesor@1234',
    user: { id: '3', email: 'asesor@locktonorion.com', name: 'Asesor User', role: 'Advisor' },
  },
  'cliente@locktonorion.com': {
    password: 'Cliente@1234',
    user: { id: '4', email: 'cliente@locktonorion.com', name: 'Cliente User', role: 'Client' },
  },
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password })
      useAuthStore.getState().setAuth(data.user, data.accessToken)
      return data
    } catch {
      // Fallback to demo users when API is unavailable
      const demo = DEMO_USERS[email.toLowerCase()]
      if (demo && demo.password === password) {
        const result: LoginResponse = { user: demo.user, accessToken: 'demo-token', expiresIn: 3600 }
        useAuthStore.getState().setAuth(result.user, result.accessToken)
        return result
      }
      throw new Error('Credenciales inválidas')
    }
  },

  async register(payload: {
    firstName: string
    lastName: string
    email: string
    password: string
    phone?: string
  }) {
    const { data } = await apiClient.post('/auth/register', payload)
    return data
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      useAuthStore.getState().clearAuth()
    }
  },

  async getProfile() {
    const { data } = await apiClient.get('/auth/profile')
    return data
  },
}
