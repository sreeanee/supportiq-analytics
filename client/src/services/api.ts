import axios from 'axios'
import type {
  Ticket,
  Customer,
  Agent,
  DashboardMetrics,
  SentimentTrend,
  TicketVolumeForecast,
  AgentPerformance,
  CommonIssue,
  TicketMessage,
  PaginatedResponse,
  TicketFilters,
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage')
  if (token) {
    const parsed = JSON.parse(token)
    if (parsed.state?.token) {
      config.headers.Authorization = `Bearer ${parsed.state.token}`
    }
  }
  return config
})

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },
  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },
  me: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}

// Tickets API
export const ticketsApi = {
  getAll: async (filters?: TicketFilters, page = 1, limit = 20): Promise<PaginatedResponse<Ticket>> => {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    if (filters?.status?.length) params.append('status', filters.status.join(','))
    if (filters?.priority?.length) params.append('priority', filters.priority.join(','))
    if (filters?.category?.length) params.append('category', filters.category.join(','))
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start)
      params.append('endDate', filters.dateRange.end)
    }

    const response = await api.get(`/tickets?${params.toString()}`)
    return response.data
  },

  getById: async (id: string): Promise<Ticket> => {
    const response = await api.get(`/tickets/${id}`)
    return response.data
  },

  create: async (ticket: Partial<Ticket>): Promise<Ticket> => {
    const response = await api.post('/tickets', ticket)
    return response.data
  },

  update: async (id: string, updates: Partial<Ticket>): Promise<Ticket> => {
    const response = await api.put(`/tickets/${id}`, updates)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tickets/${id}`)
  },

  getMessages: async (ticketId: string): Promise<TicketMessage[]> => {
    const response = await api.get(`/tickets/${ticketId}/messages`)
    return response.data
  },

  addMessage: async (ticketId: string, message: string): Promise<TicketMessage> => {
    const response = await api.post(`/tickets/${ticketId}/messages`, { message })
    return response.data
  },
}

// Analytics API
export const analyticsApi = {
  getDashboard: async (): Promise<DashboardMetrics> => {
    const response = await api.get('/analytics/dashboard')
    return response.data
  },

  getSentimentTrends: async (days = 30): Promise<SentimentTrend[]> => {
    const response = await api.get(`/analytics/sentiment?days=${days}`)
    return response.data
  },

  getForecast: async (days = 7): Promise<TicketVolumeForecast[]> => {
    const response = await api.get(`/analytics/forecast?days=${days}`)
    return response.data
  },

  getAgentPerformance: async (): Promise<AgentPerformance[]> => {
    const response = await api.get('/analytics/agents')
    return response.data
  },

  getCommonIssues: async (): Promise<CommonIssue[]> => {
    const response = await api.get('/analytics/common-issues')
    return response.data
  },
}

// Customers API
export const customersApi = {
  getAll: async (page = 1, limit = 20): Promise<PaginatedResponse<Customer>> => {
    const response = await api.get(`/customers?page=${page}&limit=${limit}`)
    return response.data
  },

  getById: async (id: string): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`)
    return response.data
  },

  getHealthScore: async (id: string) => {
    const response = await api.get(`/customers/${id}/health`)
    return response.data
  },
}

// Agents API
export const agentsApi = {
  getAll: async (): Promise<Agent[]> => {
    const response = await api.get('/agents')
    return response.data
  },

  getById: async (id: string): Promise<Agent> => {
    const response = await api.get(`/agents/${id}`)
    return response.data
  },
}

// AI API
export const aiApi = {
  categorize: async (subject: string, description: string) => {
    const response = await api.post('/ai/categorize', { subject, description })
    return response.data
  },

  analyzeSentiment: async (text: string) => {
    const response = await api.post('/ai/sentiment', { text })
    return response.data
  },

  suggestResponse: async (ticketId: string) => {
    const response = await api.post('/ai/suggest-response', { ticketId })
    return response.data
  },
}

export default api
