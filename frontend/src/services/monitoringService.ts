// Lockton ORION – monorepo monitoring service
import apiClient from './api'
import type { MonitoringDashboard, ScrapingJob, PagedResult } from '@/types'

export const monitoringService = {
  async getDashboard(): Promise<MonitoringDashboard> {
    const { data } = await apiClient.get<MonitoringDashboard>('/monitoring/dashboard')
    return data
  },

  async getScrapingJobs(params: { page?: number; pageSize?: number; search?: string }): Promise<PagedResult<ScrapingJob>> {
    const { data } = await apiClient.get('/monitoring/scraping/jobs', { params })
    return data
  },

  async retryJob(jobId: string) {
    const { data } = await apiClient.post(`/monitoring/scraping/jobs/${jobId}/retry`)
    return data
  },

  async getAuditLogs(params: { page?: number; pageSize?: number; search?: string; method?: string }) {
    const { data } = await apiClient.get('/monitoring/audit', { params })
    return data
  },

  async getDeadLetterMessages() {
    const { data } = await apiClient.get('/monitoring/messaging/dead-letter')
    return data
  },

  async redriveDeadLetter(messageId: string) {
    const { data } = await apiClient.post(`/monitoring/messaging/dead-letter/${messageId}/redrive`)
    return data
  },
}
