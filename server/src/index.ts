import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'

import { authRouter } from './routes/auth.js'
import { ticketsRouter } from './routes/tickets.js'
import { analyticsRouter } from './routes/analytics.js'
import { customersRouter } from './routes/customers.js'
import { agentsRouter } from './routes/agents.js'
import { aiRouter } from './routes/ai.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

// Make io available in routes
app.set('io', io)

// Routes
app.use('/api/auth', authRouter)
app.use('/api/tickets', ticketsRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/customers', customersRouter)
app.use('/api/agents', agentsRouter)
app.use('/api/ai', aiRouter)

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling
app.use(errorHandler)

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('subscribe:dashboard', () => {
    socket.join('dashboard')
    console.log('Client subscribed to dashboard:', socket.id)
  })

  socket.on('subscribe:ticket', (ticketId: string) => {
    socket.join(`ticket:${ticketId}`)
    console.log(`Client subscribed to ticket ${ticketId}:`, socket.id)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Start server
const PORT = process.env.PORT || 4000

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

export { app, io }
