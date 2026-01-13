import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  className?: string
}

export function MetricCard({ title, value, change, changeLabel, icon, className }: MetricCardProps) {
  const getTrendIcon = () => {
    if (change === undefined) return null
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getTrendColor = () => {
    if (change === undefined) return ''
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
                {getTrendIcon()}
                <span>
                  {change > 0 ? '+' : ''}
                  {change}%
                </span>
                {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
              </div>
            )}
          </div>
          {icon && <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
