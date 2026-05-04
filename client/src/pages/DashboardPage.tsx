import { Header } from '@/components/Layout'
import {
  MetricCard,
  SentimentChart,
  ForecastChart,
  AgentLeaderboard,
  AlertsPanel,
  CommonIssues,
} from '@/components/Dashboard'
import { Ticket, Clock, CheckCircle, Smile } from 'lucide-react'
import type { SentimentTrend, TicketVolumeForecast, AgentPerformance, CommonIssue } from '@/types'

// Mock data for demonstration
const mockMetrics = {
  totalTickets: 1247,
  ticketsChange: 15,
  avgFirstResponseTime: 2.3,
  responseTimeChange: -17,
  resolutionRate: 89,
  resolutionRateChange: 3,
  avgSentiment: 73,
  sentimentChange: 5,
}

const mockSentimentData: SentimentTrend[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (29 - i))
  return {
    date: date.toISOString(),
    positive: 50 + Math.random() * 20,
    neutral: 20 + Math.random() * 15,
    negative: 5 + Math.random() * 15,
    avgScore: 0.3 + Math.random() * 0.4,
  }
})

const mockForecastData: TicketVolumeForecast[] = Array.from({ length: 7 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() + i)
  const base = 40 + Math.random() * 30
  return {
    date: date.toISOString(),
    predicted: base,
    lower: base - 10,
    upper: base + 15,
    actual: i < 2 ? base + (Math.random() - 0.5) * 10 : undefined,
  }
})

const mockAgents: AgentPerformance[] = [
  { id: '1', name: 'Sarah Johnson', ticketsHandled: 87, avgResponseTime: 1.2, resolutionRate: 94, csatScore: 4.8, trend: 'up' },
  { id: '2', name: 'Mike Chen', ticketsHandled: 76, avgResponseTime: 1.8, resolutionRate: 91, csatScore: 4.7, trend: 'stable' },
  { id: '3', name: 'Alex Rivera', ticketsHandled: 65, avgResponseTime: 2.1, resolutionRate: 89, csatScore: 4.6, trend: 'up' },
  { id: '4', name: 'Jamie Lee', ticketsHandled: 58, avgResponseTime: 3.2, resolutionRate: 85, csatScore: 4.4, trend: 'down' },
]

const mockAlerts = [
  {
    id: '1',
    type: 'negative_sentiment' as const,
    severity: 'high' as const,
    title: 'Customer: Acme Corp',
    description: '3 tickets, avg sentiment: -0.85. Last: "Still not working!"',
    action: 'Escalate to Customer Success Manager',
  },
  {
    id: '2',
    type: 'agent_performance' as const,
    severity: 'medium' as const,
    title: 'Agent: Jamie Lee',
    description: 'Sentiment trend declining. Last 10 tickets avg: -0.3',
    action: 'Schedule coaching session',
  },
]

const mockIssues: CommonIssue[] = [
  { category: 'bug_report', count: 23, change: 150, avgSentiment: -0.4 },
  { category: 'feature_request', count: 45, change: 12, avgSentiment: 0.2 },
  { category: 'how_to_question', count: 18, change: -5, avgSentiment: 0.1 },
  { category: 'billing_issue', count: 12, change: 8, avgSentiment: -0.3 },
]

export function DashboardPage() {
  return (
    <div className="flex flex-col">
      <Header title="Dashboard" subtitle="Last 30 Days" />

      <div className="p-6 space-y-6">
        {/* Metrics Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Tickets"
            value={mockMetrics.totalTickets.toLocaleString()}
            change={mockMetrics.ticketsChange}
            changeLabel="MoM"
            icon={<Ticket className="h-6 w-6" />}
          />
          <MetricCard
            title="Avg First Response"
            value={`${mockMetrics.avgFirstResponseTime}h`}
            change={mockMetrics.responseTimeChange}
            changeLabel="vs last month"
            icon={<Clock className="h-6 w-6" />}
          />
          <MetricCard
            title="Resolution Rate"
            value={`${mockMetrics.resolutionRate}%`}
            change={mockMetrics.resolutionRateChange}
            icon={<CheckCircle className="h-6 w-6" />}
          />
          <MetricCard
            title="Avg Sentiment"
            value={`${mockMetrics.avgSentiment}/100`}
            change={mockMetrics.sentimentChange}
            changeLabel="points"
            icon={<Smile className="h-6 w-6" />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SentimentChart data={mockSentimentData} />
          <ForecastChart
            data={mockForecastData}
            insight="Expect 30% spike on Wednesday (Product Launch)"
            recommendation="Add 2 agents to Wednesday afternoon shift"
          />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <AlertsPanel alerts={mockAlerts} />
          <CommonIssues issues={mockIssues} />
          <AgentLeaderboard agents={mockAgents} />
        </div>
      </div>
    </div>
  )
}
