import axios, { type AxiosError, type AxiosResponse } from 'axios'
import { useAuthStore } from '@/store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// ─── Demo mock data (used when API is unavailable) ───────────────────
const now = new Date().toISOString()
const MOCK_DATA: Record<string, unknown> = {
  '/monitoring/dashboard': {
    quotations: { total: 142, pending: 8, processing: 3, completed: 127, failed: 4 },
    scraping: { activeJobs: 3, failedToday: 1, successRatePercent: 97.2, avgProcessingMs: 4200 },
    messaging: { queuesHealthy: true, deadLetterCount: 2, messagesProcessedToday: 318 },
    users: { active: 24, newThisMonth: 3 },
    ai: { conversationsToday: 11, avgResponseMs: 1340 },
  },
  '/quotations': {
    items: [
      { id: 'q1', referenceNumber: 'QT-2026-001', clientName: 'María González', insuranceType: 'Auto', status: 'Completed', createdAt: now, resultsCount: 4, expiresAt: null },
      { id: 'q2', referenceNumber: 'QT-2026-002', clientName: 'Carlos Mendoza', insuranceType: 'Health', status: 'Processing', createdAt: now, resultsCount: 0, expiresAt: null },
      { id: 'q3', referenceNumber: 'QT-2026-003', clientName: 'Ana Torres', insuranceType: 'Life', status: 'Completed', createdAt: now, resultsCount: 3, expiresAt: null },
      { id: 'q4', referenceNumber: 'QT-2026-004', clientName: 'Luis Ramírez', insuranceType: 'Home', status: 'Pending', createdAt: now, resultsCount: 0, expiresAt: null },
      { id: 'q5', referenceNumber: 'QT-2026-005', clientName: 'Patricia Vega', insuranceType: 'Business', status: 'Completed', createdAt: now, resultsCount: 5, expiresAt: null },
    ],
    totalCount: 142, page: 1, pageSize: 15, totalPages: 10,
  },
  '/clients': {
    items: [
      { id: 'c1', firstName: 'María', lastName: 'González', fullName: 'María González', email: 'maria@demo.com', phone: '555-0101', birthDate: null, state: 'CDMX', city: 'Ciudad de México', advisorId: null, advisorName: 'Asesor Demo', createdAt: now, quotationCount: 7 },
      { id: 'c2', firstName: 'Carlos', lastName: 'Mendoza', fullName: 'Carlos Mendoza', email: 'carlos@demo.com', phone: '555-0102', birthDate: null, state: 'NL', city: 'Monterrey', advisorId: null, advisorName: 'Asesor Demo', createdAt: now, quotationCount: 3 },
      { id: 'c3', firstName: 'Ana', lastName: 'Torres', fullName: 'Ana Torres', email: 'ana@demo.com', phone: '555-0103', birthDate: null, state: 'JAL', city: 'Guadalajara', advisorId: null, advisorName: 'Asesor Demo', createdAt: now, quotationCount: 5 },
      { id: 'c4', firstName: 'Luis', lastName: 'Ramírez', fullName: 'Luis Ramírez', email: 'luis@demo.com', phone: '555-0104', birthDate: null, state: 'CDMX', city: 'Ciudad de México', advisorId: null, advisorName: 'Asesor Demo', createdAt: now, quotationCount: 2 },
    ],
    totalCount: 24, page: 1, pageSize: 15, totalPages: 2,
  },
  '/users': {
    items: [
      { id: 'u1', firstName: 'Admin', lastName: 'User', fullName: 'Admin User', email: 'admin@locktonorion.com', role: 'Admin', isActive: true, lastLoginAt: now, createdAt: now },
      { id: 'u2', firstName: 'Supervisor', lastName: 'User', fullName: 'Supervisor User', email: 'supervisor@locktonorion.com', role: 'Supervisor', isActive: true, lastLoginAt: now, createdAt: now },
      { id: 'u3', firstName: 'Asesor', lastName: 'User', fullName: 'Asesor User', email: 'asesor@locktonorion.com', role: 'Advisor', isActive: true, lastLoginAt: now, createdAt: now },
    ],
    totalCount: 3, page: 1, pageSize: 15, totalPages: 1,
  },
  '/monitoring/audit': {
    items: [
      { id: 'a1', userId: 'u1', userEmail: 'admin@locktonorion.com', action: 'Login', resource: 'Auth', method: 'POST', statusCode: 200, ipAddress: '192.168.1.1', occurredAt: now },
      { id: 'a2', userId: 'u2', userEmail: 'supervisor@locktonorion.com', action: 'GetQuotations', resource: 'Quotations', method: 'GET', statusCode: 200, ipAddress: '192.168.1.2', occurredAt: now },
    ],
    totalCount: 2, page: 1, pageSize: 15, totalPages: 1,
  },
  '/monitoring/scraping/jobs': {
    items: [
      { id: 'j1', quotationId: 'q1', referenceNumber: 'QT-2026-001', insurerName: 'GNP Seguros', status: 'Completed', attemptNumber: 1, startedAt: now, completedAt: now, durationMs: 3200, errorMessage: null },
      { id: 'j2', quotationId: 'q2', referenceNumber: 'QT-2026-002', insurerName: 'AXA México', status: 'Processing', attemptNumber: 1, startedAt: now, completedAt: null, durationMs: null, errorMessage: null },
      { id: 'j3', quotationId: 'q3', referenceNumber: 'QT-2026-003', insurerName: 'Qualitas', status: 'Completed', attemptNumber: 1, startedAt: now, completedAt: now, durationMs: 4100, errorMessage: null },
    ],
    totalCount: 3, page: 1, pageSize: 15, totalPages: 1,
  },
  '/monitoring/scraping/simulator/status': { paused: false, runningJobs: 2 },
  '/ai/conversations': [],
  '/ai/chat': { conversationId: 'demo-conv', response: 'Hola, soy el asistente de Lockton Orion. El sistema está en modo demo.' },
  '/auth/logout': {},
  '/auth/refresh': { accessToken: 'demo-token' },
}

function getMockResponse(url: string): unknown | null {
  for (const key of Object.keys(MOCK_DATA)) {
    if (url.includes(key)) return MOCK_DATA[key]
  }
  return null
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
  withCredentials: true, // for HttpOnly cookie (refresh token)
})

// Request interceptor – attach Bearer token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor – handle 401, refresh token
let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) promise.reject(error)
    else promise.resolve(token!)
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    // If network error or DNS failure, return mock data for demo
    if (!error.response && error.config?.url) {
      const mock = getMockResponse(error.config.url)
      if (mock !== null) {
        return { data: mock, status: 200, statusText: 'OK (demo)', headers: {}, config: error.config } as AxiosResponse
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers!['Authorization'] = `Bearer ${token}`
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
        const { accessToken } = response.data
        useAuthStore.getState().updateToken(accessToken)
        processQueue(null, accessToken)
        originalRequest.headers!['Authorization'] = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
