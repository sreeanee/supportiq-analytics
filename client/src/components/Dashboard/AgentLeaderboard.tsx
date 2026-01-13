import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { AgentPerformance } from '@/types'

interface AgentLeaderboardProps {
  agents: AgentPerformance[]
}

export function AgentLeaderboard({ agents }: AgentLeaderboardProps) {
  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0:
        return '🥇'
      case 1:
        return '🥈'
      case 2:
        return '🥉'
      default:
        return `${index + 1}`
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Agent Performance Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="grid grid-cols-7 gap-2 border-b pb-2 text-xs font-medium text-muted-foreground">
            <div>Rank</div>
            <div className="col-span-2">Agent</div>
            <div className="text-right">Tickets</div>
            <div className="text-right">Avg Response</div>
            <div className="text-right">CSAT</div>
            <div className="text-right">Trend</div>
          </div>
          {agents.map((agent, index) => (
            <div
              key={agent.id}
              className="grid grid-cols-7 gap-2 py-3 text-sm hover:bg-muted/50 rounded-lg px-1"
            >
              <div className="flex items-center">{getRankEmoji(index)}</div>
              <div className="col-span-2 font-medium truncate">{agent.name}</div>
              <div className="text-right">{agent.ticketsHandled}</div>
              <div className="text-right">{agent.avgResponseTime.toFixed(1)}h</div>
              <div className="text-right">
                <Badge variant={agent.csatScore >= 4.5 ? 'success' : agent.csatScore >= 4 ? 'warning' : 'error'}>
                  {agent.csatScore.toFixed(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-end">{getTrendIcon(agent.trend)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
