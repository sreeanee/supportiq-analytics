import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { TicketVolumeForecast } from '@/types'
import { Lightbulb } from 'lucide-react'

interface ForecastChartProps {
  data: TicketVolumeForecast[]
  insight?: string
  recommendation?: string
}

export function ForecastChart({ data, insight, recommendation }: ForecastChartProps) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Ticket Volume Forecast (7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) =>
                  new Date(value).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                }
              />
              <Area
                type="monotone"
                dataKey="upper"
                stackId="1"
                stroke="none"
                fill="#3B82F6"
                fillOpacity={0.1}
                name="Upper Bound"
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stackId="2"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="#3B82F6"
                fillOpacity={0.3}
                name="Predicted"
              />
              <Area
                type="monotone"
                dataKey="lower"
                stackId="3"
                stroke="none"
                fill="white"
                fillOpacity={1}
                name="Lower Bound"
              />
              {data.some((d) => d.actual !== undefined) && (
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="none"
                  name="Actual"
                  strokeDasharray="5 5"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {(insight || recommendation) && (
          <div className="mt-4 space-y-2">
            {insight && (
              <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  <strong>Insight:</strong> {insight}
                </span>
              </div>
            )}
            {recommendation && (
              <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  <strong>Recommendation:</strong> {recommendation}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
