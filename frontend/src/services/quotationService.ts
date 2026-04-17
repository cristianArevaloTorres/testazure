import apiClient from './api'
import type { QuotationListItem, QuotationDetail, PagedResult, QuotationStatus, InsuranceType } from '@/types'

export const quotationService = {
  async getQuotations(params: {
    page?: number
    pageSize?: number
    search?: string
    status?: QuotationStatus
    clientId?: string
  }): Promise<PagedResult<QuotationListItem>> {
    const { data } = await apiClient.get('/quotations', { params })
    return data
  },

  async getQuotation(id: string): Promise<QuotationDetail> {
    const { data } = await apiClient.get(`/quotations/${id}`)
    return data
  },

  async createQuotation(payload: {
    clientId: string
    insuranceType: InsuranceType
    productId?: string
    requestData: Record<string, unknown>
    notes?: string
  }) {
    const { data } = await apiClient.post('/quotations', payload)
    return data
  },

  async getComparison(id: string) {
    const { data } = await apiClient.get(`/quotations/${id}/comparison`)
    return data
  },

  async updateStatus(id: string, status: string, reason?: string) {
    const { data } = await apiClient.put(`/quotations/${id}/status`, { status, reason })
    return data
  },

  async addNote(id: string, note: string) {
    const { data } = await apiClient.post(`/quotations/${id}/notes`, { note })
    return data
  },

  async retryQuotation(id: string) {
    const { data } = await apiClient.post(`/monitoring/scraping/jobs/${id}/retry`)
    return data
  },
}
