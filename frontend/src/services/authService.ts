import apiClient from './api'
import { useAuthStore } from '@/store/authStore'
import type { LoginResponse } from '@/types'

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password })
    useAuthStore.getState().setAuth(data.user, data.accessToken)
    return data
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
