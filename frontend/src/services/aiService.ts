import apiClient from './api'
import type { ChatResponse } from '@/types'

export const aiService = {
  async sendMessage(payload: {
    conversationId?: string
    message: string
    relatedQuotationId?: string
    relatedClientId?: string
  }): Promise<ChatResponse> {
    const { data } = await apiClient.post<ChatResponse>('/ai/chat', payload)
    return data
  },

  async getConversations() {
    const { data } = await apiClient.get('/ai/conversations')
    return data
  },

  async getConversation(conversationId: string) {
    const { data } = await apiClient.get(`/ai/conversations/${conversationId}`)
    return data
  },

  async clearConversation(conversationId: string) {
    await apiClient.delete(`/ai/conversations/${conversationId}`)
  },
}
