import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()

// Apply auth to all routes
router.use(authenticate)

const createTicketSchema = z.object({
  subject: z.string().min(1).max(255),
  description: z.string().min(1),
  customerEmail: z.string().email(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  source: z.enum(['EMAIL', 'CHAT', 'PHONE', 'API']).optional(),
  tags: z.array(z.string()).optional(),
})

const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: z.enum(['BUG_REPORT', 'FEATURE_REQUEST', 'HOW_TO_QUESTION', 'BILLING_ISSUE', 'COMPLAINT', 'OTHER']).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
})

// Generate ticket number
function generateTicketNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `TKT-${year}-${random}`
}

// Get all tickets
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    // Parse filters
    const statusFilter = req.query.status ? (req.query.status as string).split(',') : undefined
    const priorityFilter = req.query.priority ? (req.query.priority as string).split(',') : undefined
    const categoryFilter = req.query.category ? (req.query.category as string).split(',') : undefined
    const search = req.query.search as string | undefined

    const where: any = {}

    if (statusFilter) {
      where.status = { in: statusFilter.map(s => s.toUpperCase()) }
    }
    if (priorityFilter) {
      where.priority = { in: priorityFilter.map(p => p.toUpperCase()) }
    }
    if (categoryFilter) {
      where.category = { in: categoryFilter.map(c => c.toUpperCase()) }
    }
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          agent: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ])

    res.json({
      data: tickets.map((ticket: any) => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        customerId: ticket.customerId,
        customer: ticket.customer,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status.toLowerCase(),
        priority: ticket.priority.toLowerCase(),
        category: ticket.category?.toLowerCase().replace('_', '-') || null,
        sentimentScore: ticket.sentimentScore,
        assignedTo: ticket.assignedTo,
        agent: ticket.agent ? {
          id: ticket.agent.id,
          name: ticket.agent.user.name,
          email: ticket.agent.user.email,
        } : null,
        createdAt: ticket.createdAt.toISOString(),
        firstResponseAt: ticket.firstResponseAt?.toISOString() || null,
        resolvedAt: ticket.resolvedAt?.toISOString() || null,
        closedAt: ticket.closedAt?.toISOString() || null,
        source: ticket.source.toLowerCase(),
        tags: ticket.tags,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    next(error)
  }
})

// Get single ticket
router.get('/:id', async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        agent: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!ticket) {
      throw new AppError(404, 'Ticket not found')
    }

    res.json({
      success: true,
      data: {
        ...ticket,
        status: ticket.status.toLowerCase(),
        priority: ticket.priority.toLowerCase(),
        category: ticket.category?.toLowerCase() || null,
        source: ticket.source.toLowerCase(),
      },
    })
  } catch (error) {
    next(error)
  }
})

// Create ticket
router.post('/', async (req, res, next) => {
  try {
    const data = createTicketSchema.parse(req.body)

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { email: data.customerEmail },
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          email: data.customerEmail,
        },
      })
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        customerId: customer.id,
        subject: data.subject,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        source: data.source || 'EMAIL',
        tags: data.tags || [],
      },
      include: {
        customer: true,
      },
    })

    // Update customer ticket count
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalTickets: { increment: 1 },
        lastContactAt: new Date(),
      },
    })

    // Emit real-time update
    const io = req.app.get('io')
    io.to('dashboard').emit('ticket:new', {
      ticket: {
        ...ticket,
        status: ticket.status.toLowerCase(),
        priority: ticket.priority.toLowerCase(),
      },
    })

    res.status(201).json({
      success: true,
      data: {
        ...ticket,
        status: ticket.status.toLowerCase(),
        priority: ticket.priority.toLowerCase(),
      },
    })
  } catch (error) {
    next(error)
  }
})

// Update ticket
router.put('/:id', async (req, res, next) => {
  try {
    const data = updateTicketSchema.parse(req.body)

    const updateData: any = {}

    if (data.status) {
      updateData.status = data.status
      if (data.status === 'RESOLVED') {
        updateData.resolvedAt = new Date()
      } else if (data.status === 'CLOSED') {
        updateData.closedAt = new Date()
      }
    }
    if (data.priority) updateData.priority = data.priority
    if (data.category) updateData.category = data.category
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo
    if (data.tags) updateData.tags = data.tags

    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        customer: true,
        agent: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    })

    // Emit real-time update
    const io = req.app.get('io')
    io.to('dashboard').emit('ticket:updated', {
      ticketId: ticket.id,
      updates: data,
    })
    io.to(`ticket:${ticket.id}`).emit('ticket:updated', {
      ticketId: ticket.id,
      updates: data,
    })

    res.json({
      success: true,
      data: {
        ...ticket,
        status: ticket.status.toLowerCase(),
        priority: ticket.priority.toLowerCase(),
        category: ticket.category?.toLowerCase() || null,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Delete ticket
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.ticket.delete({
      where: { id: req.params.id },
    })

    res.json({ success: true, message: 'Ticket deleted' })
  } catch (error) {
    next(error)
  }
})

// Get ticket messages
router.get('/:id/messages', async (req, res, next) => {
  try {
    const messages = await prisma.ticketMessage.findMany({
      where: { ticketId: req.params.id },
      orderBy: { createdAt: 'asc' },
    })

    res.json({
      success: true,
      data: messages.map((m: any) => ({
        ...m,
        senderType: m.senderType.toLowerCase(),
      })),
    })
  } catch (error) {
    next(error)
  }
})

// Add message to ticket
router.post('/:id/messages', async (req, res, next) => {
  try {
    const { message } = req.body

    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
    })

    if (!ticket) {
      throw new AppError(404, 'Ticket not found')
    }

    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: req.params.id,
        senderType: 'AGENT',
        senderId: req.user!.userId,
        messageText: message,
      },
    })

    // Update first response time if this is the first agent response
    if (!ticket.firstResponseAt) {
      await prisma.ticket.update({
        where: { id: req.params.id },
        data: {
          firstResponseAt: new Date(),
          status: 'IN_PROGRESS',
        },
      })
    }

    // Emit real-time update
    const io = req.app.get('io')
    io.to(`ticket:${req.params.id}`).emit('message:new', ticketMessage)

    res.status(201).json({
      success: true,
      data: {
        ...ticketMessage,
        senderType: ticketMessage.senderType.toLowerCase(),
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as ticketsRouter }
