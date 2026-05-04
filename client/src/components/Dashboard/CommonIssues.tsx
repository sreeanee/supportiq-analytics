import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { CommonIssue } from '@/types'
import { cn } from '@/lib/utils'

interface CommonIssuesProps {
  issues: CommonIssue[]
}

export function CommonIssues({ issues }: CommonIssuesProps) {
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      bug_report: 'Bug Report',
      feature_request: 'Feature Request',
      how_to_question: 'How-To Question',
      billing_issue: 'Billing Issue',
      complaint: 'Complaint',
      other: 'Other',
    }
    return labels[category] || category
  }

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      bug_report: '🐛',
      feature_request: '✨',
      how_to_question: '❓',
      billing_issue: '💳',
      complaint: '😤',
      other: '📝',
    }
    return emojis[category] || '📝'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Top Issues This Week</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {issues.map((issue) => (
            <div
              key={issue.category}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-lg">
                  {getCategoryEmoji(issue.category)}
                </div>
                <div>
                  <p className="font-medium">{getCategoryLabel(issue.category)}</p>
                  <p className="text-sm text-muted-foreground">
                    {issue.count} tickets
                    {issue.avgSentiment && (
                      <span
                        className={cn(
                          'ml-2',
                          issue.avgSentiment >= 0 ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        (avg sentiment: {(issue.avgSentiment * 100).toFixed(0)}%)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {issue.change !== 0 && (
                  <Badge
                    variant={issue.change > 0 ? 'error' : 'success'}
                    className="flex items-center gap-1"
                  >
                    {issue.change > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(issue.change)}%
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
