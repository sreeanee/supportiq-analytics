import { Router } from 'express'
import { prisma } from '../utils/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

interface TicketHealth {
  sentimentScore: number | null
  status: string
  createdAt: Date
  resolvedAt: Date | null
}

const router = Router()

router.use(authenticate)

// Get all customers
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: { lastContactAt: 'desc' },
      }),
      prisma.customer.count(),
    ])

    res.json({
      data: customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    next(error)
  }
})

// Get single customer
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        tickets: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!customer) {
      throw new AppError(404, 'Customer not found')
    }

    res.json({ success: true, data: customer })
  } catch (error) {
    next(error)
  }
})

// Get customer health score breakdown
router.get('/:id/health', async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        tickets: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            sentimentScore: true,
            status: true,
            createdAt: true,
            resolvedAt: true,
          },
        },
      },
    })

    if (!customer) {
      throw new AppError(404, 'Customer not found')
    }

    // Calculate health factors
    const tickets = customer.tickets

    // Sentiment factor (0-100)
    const avgSentiment = tickets.length > 0
      ? tickets
          .filter((t: TicketHealth) => t.sentimentScore !== null)
          .reduce((acc: number, t: TicketHealth) => acc + t.sentimentScore!, 0) / tickets.length
      : 0
    const sentimentScore = Math.round((avgSentiment + 1) * 50) // Convert -1 to 1 to 0-100

    // Resolution factor (0-100)
    const resolvedTickets = tickets.filter((t: TicketHealth) =>
      t.status === 'RESOLVED' || t.status === 'CLOSED'
    ).length
    const resolutionScore = tickets.length > 0
      ? Math.round((resolvedTickets / tickets.length) * 100)
      : 100

    // Frequency factor (0-100) - fewer recent tickets is better
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentTickets = tickets.filter((t: TicketHealth) => t.createdAt >= thirtyDaysAgo).length
    const frequencyScore = Math.max(0, 100 - (recentTickets * 10))

    // Overall health score
    const healthScore = Math.round(
      (sentimentScore * 0.4) + (resolutionScore * 0.3) + (frequencyScore * 0.3)
    )

    res.json({
      success: true,
      data: {
        overallScore: healthScore,
        factors: {
          sentiment: {
            score: sentimentScore,
            weight: 0.4,
            description: 'Average sentiment of recent tickets',
          },
          resolution: {
            score: resolutionScore,
            weight: 0.3,
            description: 'Percentage of tickets resolved',
          },
          frequency: {
            score: frequencyScore,
            weight: 0.3,
            description: 'Ticket volume in last 30 days',
          },
        },
        recentTickets: tickets.length,
        riskLevel: healthScore >= 70 ? 'low' : healthScore >= 40 ? 'medium' : 'high',
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as customersRouter }
