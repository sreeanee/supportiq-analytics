import { Router } from 'express'
import { prisma } from '../utils/prisma.js'
import { authenticate } from '../middleware/auth.js'

interface TicketData {
  id: string
  status: string
  sentimentScore: number | null
  createdAt: Date
  firstResponseAt: Date | null
  resolvedAt?: Date | null
}

interface GroupByResult {
  category: string | null
  _count: number
  _avg?: { sentimentScore: number | null }
}

const router = Router()

router.use(authenticate)

// Get dashboard metrics
router.get('/dashboard', async (_req, res, next) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Current period metrics
    const currentPeriodTickets = await prisma.ticket.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: {
        id: true,
        status: true,
        sentimentScore: true,
        createdAt: true,
        firstResponseAt: true,
        resolvedAt: true,
      },
    })

    // Previous period metrics for comparison
    const previousPeriodTickets = await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
      select: {
        id: true,
        status: true,
        sentimentScore: true,
        createdAt: true,
        firstResponseAt: true,
      },
    })

    // Calculate metrics
    const totalTickets = currentPeriodTickets.length
    const previousTotal = previousPeriodTickets.length
    const ticketsChange = previousTotal > 0
      ? Math.round(((totalTickets - previousTotal) / previousTotal) * 100)
      : 0

    // Average first response time (in hours)
    const ticketsWithResponse = currentPeriodTickets.filter((t: TicketData) => t.firstResponseAt)
    const avgResponseTime = ticketsWithResponse.length > 0
      ? ticketsWithResponse.reduce((acc: number, t: TicketData) => {
          const diff = t.firstResponseAt!.getTime() - t.createdAt.getTime()
          return acc + diff / (1000 * 60 * 60) // Convert to hours
        }, 0) / ticketsWithResponse.length
      : 0

    const prevTicketsWithResponse = previousPeriodTickets.filter((t: TicketData) => t.firstResponseAt)
    const prevAvgResponseTime = prevTicketsWithResponse.length > 0
      ? prevTicketsWithResponse.reduce((acc: number, t: TicketData) => {
          const diff = t.firstResponseAt!.getTime() - t.createdAt.getTime()
          return acc + diff / (1000 * 60 * 60)
        }, 0) / prevTicketsWithResponse.length
      : 0

    const responseTimeChange = prevAvgResponseTime > 0
      ? Math.round(((avgResponseTime - prevAvgResponseTime) / prevAvgResponseTime) * 100)
      : 0

    // Resolution rate
    const resolvedTickets = currentPeriodTickets.filter((t: TicketData) =>
      t.status === 'RESOLVED' || t.status === 'CLOSED'
    ).length
    const resolutionRate = totalTickets > 0
      ? Math.round((resolvedTickets / totalTickets) * 100)
      : 0

    const prevResolved = previousPeriodTickets.filter((t: TicketData) =>
      t.status === 'RESOLVED' || t.status === 'CLOSED'
    ).length
    const prevResolutionRate = previousTotal > 0
      ? Math.round((prevResolved / previousTotal) * 100)
      : 0
    const resolutionRateChange = resolutionRate - prevResolutionRate

    // Average sentiment
    const ticketsWithSentiment = currentPeriodTickets.filter((t: TicketData) => t.sentimentScore !== null)
    const avgSentiment = ticketsWithSentiment.length > 0
      ? Math.round(((ticketsWithSentiment.reduce((acc: number, t: TicketData) => acc + t.sentimentScore!, 0)
          / ticketsWithSentiment.length) + 1) * 50) // Convert -1 to 1 range to 0-100
      : 50

    const prevTicketsWithSentiment = previousPeriodTickets.filter((t: TicketData) => t.sentimentScore !== null)
    const prevAvgSentiment = prevTicketsWithSentiment.length > 0
      ? Math.round(((prevTicketsWithSentiment.reduce((acc: number, t: TicketData) => acc + t.sentimentScore!, 0)
          / prevTicketsWithSentiment.length) + 1) * 50)
      : 50
    const sentimentChange = avgSentiment - prevAvgSentiment

    // Today's tickets
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const ticketsToday = currentPeriodTickets.filter((t: TicketData) => t.createdAt >= today).length

    // Open tickets
    const openTickets = currentPeriodTickets.filter((t: TicketData) =>
      t.status === 'OPEN' || t.status === 'IN_PROGRESS'
    ).length

    res.json({
      totalTickets,
      ticketsChange,
      avgFirstResponseTime: Math.round(avgResponseTime * 10) / 10,
      responseTimeChange,
      resolutionRate,
      resolutionRateChange,
      avgSentiment,
      sentimentChange,
      ticketsToday,
      openTickets,
    })
  } catch (error) {
    next(error)
  }
})

// Get sentiment trends
router.get('/sentiment', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: { gte: startDate },
        sentimentScore: { not: null },
      },
      select: {
        createdAt: true,
        sentimentScore: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by date
    const dailyData: Record<string, { positive: number; neutral: number; negative: number; total: number; sum: number }> = {}

    tickets.forEach((ticket: { createdAt: Date; sentimentScore: number | null }) => {
      const date = ticket.createdAt.toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = { positive: 0, neutral: 0, negative: 0, total: 0, sum: 0 }
      }

      dailyData[date].total++
      dailyData[date].sum += ticket.sentimentScore!

      if (ticket.sentimentScore! >= 0.3) {
        dailyData[date].positive++
      } else if (ticket.sentimentScore! <= -0.3) {
        dailyData[date].negative++
      } else {
        dailyData[date].neutral++
      }
    })

    const result = Object.entries(dailyData).map(([date, data]) => ({
      date,
      positive: Math.round((data.positive / data.total) * 100),
      neutral: Math.round((data.neutral / data.total) * 100),
      negative: Math.round((data.negative / data.total) * 100),
      avgScore: data.sum / data.total,
    }))

    res.json(result)
  } catch (error) {
    next(error)
  }
})

// Get ticket volume forecast
router.get('/forecast', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 7

    // Get historical data for the past 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const historicalTickets = await prisma.ticket.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    })

    // Simple moving average forecast (in production, use Prophet or similar)
    const dailyCounts: Record<string, number> = {}
    historicalTickets.forEach((t: { createdAt: Date; _count: number }) => {
      const date = t.createdAt.toISOString().split('T')[0]
      dailyCounts[date] = (dailyCounts[date] || 0) + t._count
    })

    const avgDaily = Object.values(dailyCounts).reduce((a, b) => a + b, 0) /
      Math.max(Object.keys(dailyCounts).length, 1)

    // Generate forecast
    const forecast = []
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)

      // Add day-of-week seasonality (weekends have fewer tickets)
      const dayOfWeek = date.getDay()
      const seasonality = dayOfWeek === 0 || dayOfWeek === 6 ? 0.6 : 1.1

      const predicted = Math.round(avgDaily * seasonality)
      const variance = predicted * 0.2

      forecast.push({
        date: date.toISOString().split('T')[0],
        predicted,
        lower: Math.round(predicted - variance),
        upper: Math.round(predicted + variance),
      })
    }

    res.json(forecast)
  } catch (error) {
    next(error)
  }
})

// Get agent performance
router.get('/agents', async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const agents = await prisma.agent.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: { name: true },
        },
        tickets: {
          where: { createdAt: { gte: thirtyDaysAgo } },
          select: {
            id: true,
            status: true,
            firstResponseAt: true,
            createdAt: true,
            sentimentScore: true,
          },
        },
      },
    })

    const performance = agents.map((agent: { id: string; user: { name: string }; tickets: TicketData[]; csatScore: number | null }) => {
      const tickets = agent.tickets
      const ticketsHandled = tickets.length

      const ticketsWithResponse = tickets.filter((t: TicketData) => t.firstResponseAt)
      const avgResponseTime = ticketsWithResponse.length > 0
        ? ticketsWithResponse.reduce((acc: number, t: TicketData) => {
            const diff = t.firstResponseAt!.getTime() - t.createdAt.getTime()
            return acc + diff / (1000 * 60 * 60)
          }, 0) / ticketsWithResponse.length
        : 0

      const resolvedTickets = tickets.filter((t: TicketData) =>
        t.status === 'RESOLVED' || t.status === 'CLOSED'
      ).length
      const resolutionRate = ticketsHandled > 0
        ? Math.round((resolvedTickets / ticketsHandled) * 100)
        : 0

      return {
        id: agent.id,
        name: agent.user.name,
        ticketsHandled,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        resolutionRate,
        csatScore: agent.csatScore || 4.5,
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
      }
    })

    // Sort by tickets handled
    performance.sort((a: { ticketsHandled: number }, b: { ticketsHandled: number }) => b.ticketsHandled - a.ticketsHandled)

    res.json(performance)
  } catch (error) {
    next(error)
  }
})

// Get common issues
router.get('/common-issues', async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    // Current week
    const currentWeek = await prisma.ticket.groupBy({
      by: ['category'],
      where: {
        createdAt: { gte: sevenDaysAgo },
        category: { not: null },
      },
      _count: true,
      _avg: { sentimentScore: true },
    })

    // Previous week
    const previousWeek = await prisma.ticket.groupBy({
      by: ['category'],
      where: {
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        category: { not: null },
      },
      _count: true,
    })

    const previousCounts: Record<string, number> = {}
    previousWeek.forEach((p: GroupByResult) => {
      if (p.category) previousCounts[p.category] = p._count
    })

    const issues = currentWeek
      .filter((c: GroupByResult) => c.category)
      .map((c: GroupByResult) => {
        const prevCount = previousCounts[c.category!] || 0
        const change = prevCount > 0
          ? Math.round(((c._count - prevCount) / prevCount) * 100)
          : 100

        return {
          category: c.category!.toLowerCase().replace('_', '-'),
          count: c._count,
          change,
          avgSentiment: c._avg?.sentimentScore || 0,
        }
      })
      .sort((a: { count: number }, b: { count: number }) => b.count - a.count)

    res.json(issues)
  } catch (error) {
    next(error)
  }
})

export { router as analyticsRouter }
