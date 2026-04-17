// ─── Auth ────────────────────────────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
  role: 'Client' | 'Advisor' | 'Supervisor' | 'Admin'
}

export interface LoginResponse {
  accessToken: string
  expiresIn: number
  user: User
}

// ─── Quotations ──────────────────────────────────────────────────────
export type QuotationStatus =
  | 'Pending'
  | 'Processing'
  | 'Completed'
  | 'PartiallyCompleted'
  | 'Failed'
  | 'Cancelled'
  | 'Expired'
  | 'Draft'

export type InsuranceType = 'Auto' | 'Life' | 'Health' | 'Home' | 'Business' | 'Travel' | 'Liability'

export interface QuotationListItem {
  id: string
  referenceNumber: string
  clientName: string
  insuranceType: InsuranceType
  status: QuotationStatus
  createdAt: string
  resultsCount: number
  expiresAt: string | null
}

export interface QuotationResult {
  id: string
  insurerName: string
  insurerLogoUrl: string | null
  insurerRating: number
  insurerPortalUrl: string | null
  insurerWebsite: string | null
  productName: string
  annualPremium: number
  monthlyPremium: number
  deductible: number
  coverage: Record<string, unknown>
  isRecommended: boolean
  recommendationScore: number
  recommendationReason: string | null
  validUntil: string | null
  scrapedAt: string
  screenshotUrl: string | null
}

export interface QuotationDetail {
  id: string
  referenceNumber: string
  clientName: string
  clientId: string
  insuranceType: InsuranceType
  status: QuotationStatus
  requestData: Record<string, unknown>
  advisorNotes: string | null
  createdAt: string
  processingStartedAt: string | null
  processingCompletedAt: string | null
  expiresAt: string | null
  retryCount: number
  lastErrorMessage: string | null
  results: QuotationResult[]
  history: StatusHistory[]
}

export interface StatusHistory {
  previousStatus: QuotationStatus
  newStatus: QuotationStatus
  reason: string | null
  changedBy: string
  changedAt: string
}

// ─── Clients ─────────────────────────────────────────────────────────
export interface Client {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string | null
  birthDate: string | null
  state: string | null
  city: string | null
  advisorId: string | null
  advisorName: string | null
  createdAt: string
  quotationCount: number
}

// ─── Users ───────────────────────────────────────────────────────────
export interface AppUser {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  role: 'Client' | 'Advisor' | 'Supervisor' | 'Admin'
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

// ─── Monitoring ──────────────────────────────────────────────────────
export interface ScrapingJob {
  id: string
  quotationId: string
  referenceNumber: string
  insurerName: string
  status: 'Queued' | 'Processing' | 'Completed' | 'Failed' | 'Retrying' | 'DeadLettered' | 'Cancelled'
  attemptNumber: number
  startedAt: string | null
  completedAt: string | null
  durationMs: number | null
  errorMessage: string | null
}

export interface MonitoringDashboard {
  quotations: { total: number; pending: number; processing: number; completed: number; failed: number }
  scraping: { activeJobs: number; failedToday: number; successRatePercent: number; avgProcessingMs: number }
  messaging: { queuesHealthy: boolean; deadLetterCount: number; messagesProcessedToday: number }
  users: { active: number; newThisMonth: number }
  ai: { conversationsToday: number; avgResponseMs: number }
}

// ─── AI Chat ─────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  tokensUsed?: number
  responseMs?: number
}

export interface ChatResponse {
  conversationId: string
  response: string
  model: string
  tokensUsed: number
  timestamp: string
}

// ─── Pagination ──────────────────────────────────────────────────────
export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

// ─── API Error ───────────────────────────────────────────────────────
export interface ApiError {
  type: string
  title: string
  status: number
  traceId: string
  errors?: Record<string, string[]>
}
