import { useState } from 'react'
import { Header } from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Filter, Plus, MessageSquare, Clock, User } from 'lucide-react'
import { cn, formatRelativeTime, getPriorityColor, getStatusColor, getSentimentColor } from '@/lib/utils'
import type { Ticket, TicketStatus, TicketPriority } from '@/types'

// Mock tickets data
const mockTickets: Ticket[] = [
  {
    id: '1',
    ticketNumber: 'TKT-2024-001',
    customerId: 'c1',
    subject: 'Payment failed - card declined',
    description: 'I tried to upgrade my plan but my payment keeps getting declined.',
    status: 'open',
    priority: 'high',
    category: 'billing_issue',
    sentimentScore: -0.6,
    assignedTo: 'a1',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    firstResponseAt: null,
    resolvedAt: null,
    closedAt: null,
    source: 'email',
    tags: ['billing', 'urgent'],
    customer: { id: 'c1', email: 'sarah.j@techcorp.com', companyName: 'TechCorp', healthScore: 65, totalTickets: 5, avgSentiment: -0.2, createdAt: '', lastContactAt: '' },
    agent: { id: 'a1', name: 'Sarah Johnson', email: 'sarah@support.com', expertiseAreas: ['billing'], avgResponseTimeMinutes: 45, ticketsResolvedCount: 234, csatScore: 4.8, isActive: true },
  },
  {
    id: '2',
    ticketNumber: 'TKT-2024-002',
    customerId: 'c2',
    subject: 'Feature request: Dark mode',
    description: 'Love your product! Would be amazing if you could add a dark mode option.',
    status: 'in_progress',
    priority: 'low',
    category: 'feature_request',
    sentimentScore: 0.8,
    assignedTo: 'a2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    firstResponseAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    resolvedAt: null,
    closedAt: null,
    source: 'chat',
    tags: ['feature', 'ui'],
    customer: { id: 'c2', email: 'mike.chen@startup.io', companyName: 'StartupIO', healthScore: 85, totalTickets: 2, avgSentiment: 0.6, createdAt: '', lastContactAt: '' },
    agent: { id: 'a2', name: 'Mike Chen', email: 'mike@support.com', expertiseAreas: ['product'], avgResponseTimeMinutes: 30, ticketsResolvedCount: 187, csatScore: 4.7, isActive: true },
  },
  {
    id: '3',
    ticketNumber: 'TKT-2024-003',
    customerId: 'c3',
    subject: 'Dashboard not loading',
    description: 'Dashboard has been stuck on loading screen for 20 minutes. Tried refreshing and clearing cache.',
    status: 'open',
    priority: 'urgent',
    category: 'bug_report',
    sentimentScore: -0.9,
    assignedTo: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    firstResponseAt: null,
    resolvedAt: null,
    closedAt: null,
    source: 'email',
    tags: ['bug', 'critical'],
    customer: { id: 'c3', email: 'alex.rivera@enterprise.com', companyName: 'Enterprise Inc', healthScore: 45, totalTickets: 8, avgSentiment: -0.4, createdAt: '', lastContactAt: '' },
  },
  {
    id: '4',
    ticketNumber: 'TKT-2024-004',
    customerId: 'c4',
    subject: 'How to export data to CSV?',
    description: 'I need to export my analytics data for a presentation. How can I do this?',
    status: 'resolved',
    priority: 'medium',
    category: 'how_to_question',
    sentimentScore: 0.3,
    assignedTo: 'a1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    firstResponseAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    closedAt: null,
    source: 'chat',
    tags: ['export', 'how-to'],
    customer: { id: 'c4', email: 'jamie@company.com', companyName: 'Company LLC', healthScore: 78, totalTickets: 3, avgSentiment: 0.4, createdAt: '', lastContactAt: '' },
    agent: { id: 'a1', name: 'Sarah Johnson', email: 'sarah@support.com', expertiseAreas: ['billing'], avgResponseTimeMinutes: 45, ticketsResolvedCount: 234, csatScore: 4.8, isActive: true },
  },
]

const statusFilters: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']
const priorityFilters: TicketPriority[] = ['urgent', 'high', 'medium', 'low']

export function TicketsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | null>(null)

  const filteredTickets = mockTickets.filter((ticket) => {
    if (searchQuery && !ticket.subject.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (selectedStatus && ticket.status !== selectedStatus) {
      return false
    }
    if (selectedPriority && ticket.priority !== selectedPriority) {
      return false
    }
    return true
  })

  return (
    <div className="flex flex-col">
      <Header title="Tickets" subtitle={`${filteredTickets.length} tickets`} />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {statusFilters.map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                className="capitalize"
              >
                {status.replace('_', ' ')}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {priorityFilters.map((priority) => (
              <Button
                key={priority}
                variant={selectedPriority === priority ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPriority(selectedPriority === priority ? null : priority)}
                className={cn('capitalize', selectedPriority === priority ? '' : getPriorityColor(priority))}
              >
                {priority}
              </Button>
            ))}
          </div>

          <Button className="ml-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>

        {/* Ticket List */}
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-muted-foreground font-mono">{ticket.ticketNumber}</span>
                      <Badge className={cn(getStatusColor(ticket.status), 'capitalize')}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={cn(getPriorityColor(ticket.priority), 'capitalize')}>
                        {ticket.priority}
                      </Badge>
                      {ticket.category && (
                        <Badge variant="outline" className="capitalize">
                          {ticket.category.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium truncate">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground truncate mt-1">{ticket.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.customer?.companyName || ticket.customer?.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(ticket.createdAt)}
                      </span>
                      {ticket.agent && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {ticket.agent.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {ticket.sentimentScore !== null && (
                      <div className={cn('text-sm font-medium', getSentimentColor(ticket.sentimentScore))}>
                        {ticket.sentimentScore >= 0 ? '+' : ''}{(ticket.sentimentScore * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
