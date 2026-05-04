// Ticket Types
export interface Ticket {
  id: string
  ticketNumber: string
  customerId: string
  customer?: Customer
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory | null
  sentimentScore: number | null
  assignedTo: string | null
  agent?: Agent
  createdAt: string
  firstResponseAt: string | null
  resolvedAt: string | null
  closedAt: string | null
  source: TicketSource
  tags: string[]
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketCategory = 'bug_report' | 'feature_request' | 'how_to_question' | 'billing_issue' | 'complaint' | 'other'
export type TicketSource = 'email' | 'chat' | 'phone' | 'api'

// Customer Types
export interface Customer {
  id: string
  email: string
  companyName: string | null
  healthScore: number
  totalTickets: number
  avgSentiment: number | null
  createdAt: string
  lastContactAt: string | null
}

// Agent Types
export interface Agent {
  id: string
  name: string
  email: string
  expertiseAreas: string[]
  avgResponseTimeMinutes: number | null
  ticketsResolvedCount: number
  csatScore: number | null
  isActive: boolean
}

// Analytics Types
export interface DashboardMetrics {
  totalTickets: number
  ticketsChange: number
  avgFirstResponseTime: number
  responseTimeChange: number
  resolutionRate: number
  resolutionRateChange: number
  avgSentiment: number
  sentimentChange: number
  ticketsToday: number
  openTickets: number
}

export interface SentimentTrend {
  date: string
  positive: number
  neutral: number
  negative: number
  avgScore: number
}

export interface TicketVolumeForecast {
  date: string
  predicted: number
  lower: number
  upper: number
  actual?: number
}

export interface AgentPerformance {
  id: string
  name: string
  ticketsHandled: number
  avgResponseTime: number
  resolutionRate: number
  csatScore: number
  trend: 'up' | 'down' | 'stable'
}

export interface CommonIssue {
  category: string
  count: number
  change: number
  avgSentiment: number
}

// Message Types
export interface TicketMessage {
  id: string
  ticketId: string
  senderType: 'customer' | 'agent' | 'system'
  senderId: string | null
  messageText: string
  sentimentScore: number | null
  isAiGenerated: boolean
  createdAt: string
}

// Auth Types
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'agent' | 'readonly'
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Filter Types
export interface TicketFilters {
  status?: TicketStatus[]
  priority?: TicketPriority[]
  category?: TicketCategory[]
  assignedTo?: string
  dateRange?: {
    start: string
    end: string
  }
  search?: string
}
