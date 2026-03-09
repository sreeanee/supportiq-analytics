import { Router } from 'express'
import { prisma } from '../utils/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

interface AgentWithUser {
  id: string
  user: { name: string; email: string }
  expertiseAreas: string[]
  avgResponseTimeMinutes: number | null
  ticketsResolvedCount: number
  csatScore: number | null
  isActive: boolean
}

const router = Router()

router.use(authenticate)

// Get all agents
router.get('/', async (_req, res, next) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    res.json(agents.map((agent: AgentWithUser) => ({
      id: agent.id,
      name: agent.user.name,
      email: agent.user.email,
      expertiseAreas: agent.expertiseAreas,
      avgResponseTimeMinutes: agent.avgResponseTimeMinutes,
      ticketsResolvedCount: agent.ticketsResolvedCount,
      csatScore: agent.csatScore,
      isActive: agent.isActive,
    })))
  } catch (error) {
    next(error)
  }
})

// Get single agent
router.get('/:id', async (req, res, next) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        tickets: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            customer: true,
          },
        },
      },
    })

    if (!agent) {
      throw new AppError(404, 'Agent not found')
    }

    res.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.user.name,
        email: agent.user.email,
        expertiseAreas: agent.expertiseAreas,
        avgResponseTimeMinutes: agent.avgResponseTimeMinutes,
        ticketsResolvedCount: agent.ticketsResolvedCount,
        csatScore: agent.csatScore,
        isActive: agent.isActive,
        recentTickets: agent.tickets,
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as agentsRouter }
