import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { SentimentTrend } from '@/types'

interface SentimentChartProps {
  data: SentimentTrend[]
  title?: string
}

export function SentimentChart({ data, title = 'Sentiment Trend (30 Days)' }: SentimentChartProps) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="positive"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                name="Positive"
              />
              <Line
                type="monotone"
                dataKey="neutral"
                stroke="#6B7280"
                strokeWidth={2}
                dot={false}
                name="Neutral"
              />
              <Line
                type="monotone"
                dataKey="negative"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
                name="Negative"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
