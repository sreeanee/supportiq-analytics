import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const categories = ['BUG_REPORT', 'FEATURE_REQUEST', 'HOW_TO_QUESTION', 'BILLING_ISSUE', 'COMPLAINT', 'OTHER'] as const
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const
const sources = ['EMAIL', 'CHAT', 'PHONE', 'API'] as const

const ticketSubjects = [
  { subject: 'Payment failed - card declined', category: 'BILLING_ISSUE', sentiment: -0.6, priority: 'HIGH' },
  { subject: 'Feature request: Dark mode', category: 'FEATURE_REQUEST', sentiment: 0.8, priority: 'LOW' },
  { subject: 'Dashboard not loading', category: 'BUG_REPORT', sentiment: -0.9, priority: 'URGENT' },
  { subject: 'How to export data to CSV?', category: 'HOW_TO_QUESTION', sentiment: 0.3, priority: 'MEDIUM' },
  { subject: 'Unable to reset password', category: 'BUG_REPORT', sentiment: -0.5, priority: 'HIGH' },
  { subject: 'Subscription renewal issue', category: 'BILLING_ISSUE', sentiment: -0.4, priority: 'HIGH' },
  { subject: 'Love the new update!', category: 'OTHER', sentiment: 0.9, priority: 'LOW' },
  { subject: 'API rate limiting errors', category: 'BUG_REPORT', sentiment: -0.7, priority: 'URGENT' },
  { subject: 'Add integration with Slack', category: 'FEATURE_REQUEST', sentiment: 0.5, priority: 'MEDIUM' },
  { subject: 'Mobile app crashes on startup', category: 'BUG_REPORT', sentiment: -0.8, priority: 'URGENT' },
  { subject: 'How to set up webhooks?', category: 'HOW_TO_QUESTION', sentiment: 0.2, priority: 'MEDIUM' },
  { subject: 'Refund request for last month', category: 'BILLING_ISSUE', sentiment: -0.3, priority: 'MEDIUM' },
  { subject: 'Great customer support experience', category: 'OTHER', sentiment: 0.95, priority: 'LOW' },
  { subject: 'Two-factor authentication not working', category: 'BUG_REPORT', sentiment: -0.6, priority: 'HIGH' },
  { subject: 'Request for bulk data import feature', category: 'FEATURE_REQUEST', sentiment: 0.4, priority: 'MEDIUM' },
]

const companies = [
  'TechCorp', 'StartupIO', 'Enterprise Inc', 'Digital Solutions', 'CloudFirst',
  'DataDrive', 'InnovateTech', 'Nexus Systems', 'Quantum Labs', 'CyberSec Ltd'
]

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data
  await prisma.ticketMessage.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.agent.deleteMany()
  await prisma.user.deleteMany()
  await prisma.analyticsCache.deleteMany()

  // Create admin user
  const adminPassword = await bcrypt.hash('demo123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@supportiq.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  })
  console.log('✅ Created admin user')

  // Create agent users
  const agentData = [
    { name: 'Sarah Johnson', email: 'sarah@supportiq.com', expertise: ['billing', 'general'] },
    { name: 'Mike Chen', email: 'mike@supportiq.com', expertise: ['technical', 'api'] },
    { name: 'Alex Rivera', email: 'alex@supportiq.com', expertise: ['product', 'feature-requests'] },
    { name: 'Jamie Lee', email: 'jamie@supportiq.com', expertise: ['general', 'onboarding'] },
  ]

  const agents = []
  for (const data of agentData) {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: adminPassword,
        name: data.name,
        role: 'AGENT',
      },
    })

    const agent = await prisma.agent.create({
      data: {
        userId: user.id,
        expertiseAreas: data.expertise,
        avgResponseTimeMinutes: Math.floor(Math.random() * 60) + 30,
        ticketsResolvedCount: Math.floor(Math.random() * 200) + 50,
        csatScore: 4 + Math.random() * 0.9,
      },
    })

    agents.push(agent)
  }
  console.log('✅ Created agents')

  // Create customers
  const customers = []
  for (let i = 0; i < 20; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)]
    const customer = await prisma.customer.create({
      data: {
        email: `customer${i + 1}@${company.toLowerCase().replace(' ', '')}.com`,
        companyName: company,
        healthScore: Math.floor(Math.random() * 50) + 50,
        avgSentiment: (Math.random() * 2) - 1,
      },
    })
    customers.push(customer)
  }
  console.log('✅ Created customers')

  // Create tickets
  const tickets = []
  for (let i = 0; i < 100; i++) {
    const template = ticketSubjects[Math.floor(Math.random() * ticketSubjects.length)]
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const createdDaysAgo = Math.floor(Math.random() * 30)

    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - createdDaysAgo)
    createdAt.setHours(Math.floor(Math.random() * 12) + 8) // Business hours

    let firstResponseAt = null
    let resolvedAt = null
    let closedAt = null
    let assignedTo = null

    if (status !== 'OPEN') {
      const agent = agents[Math.floor(Math.random() * agents.length)]
      assignedTo = agent.id

      firstResponseAt = new Date(createdAt)
      firstResponseAt.setHours(firstResponseAt.getHours() + Math.floor(Math.random() * 4) + 1)

      if (status === 'RESOLVED' || status === 'CLOSED') {
        resolvedAt = new Date(firstResponseAt)
        resolvedAt.setHours(resolvedAt.getHours() + Math.floor(Math.random() * 24) + 1)

        if (status === 'CLOSED') {
          closedAt = new Date(resolvedAt)
          closedAt.setHours(closedAt.getHours() + Math.floor(Math.random() * 48))
        }
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2024-${String(i + 1).padStart(4, '0')}`,
        customerId: customer.id,
        subject: template.subject,
        description: `${template.subject}. This is a detailed description of the issue that the customer is experiencing. They have provided context and are waiting for assistance.`,
        status,
        priority: template.priority as any,
        category: template.category as any,
        sentimentScore: template.sentiment + (Math.random() * 0.2 - 0.1),
        assignedTo,
        createdAt,
        firstResponseAt,
        resolvedAt,
        closedAt,
        source: sources[Math.floor(Math.random() * sources.length)],
        tags: [template.category.toLowerCase().replace('_', '-')],
      },
    })

    tickets.push(ticket)

    // Add some messages
    if (status !== 'OPEN') {
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderType: 'CUSTOMER',
          messageText: `Hi, I'm experiencing an issue with ${template.subject.toLowerCase()}. Can you please help?`,
          sentimentScore: template.sentiment,
          createdAt,
        },
      })

      if (firstResponseAt) {
        await prisma.ticketMessage.create({
          data: {
            ticketId: ticket.id,
            senderType: 'AGENT',
            senderId: assignedTo,
            messageText: `Hello! Thank you for contacting us. I understand you're having trouble with ${template.subject.toLowerCase()}. I'm here to help and will look into this right away.`,
            sentimentScore: 0.5,
            createdAt: firstResponseAt,
          },
        })
      }

      if (resolvedAt) {
        await prisma.ticketMessage.create({
          data: {
            ticketId: ticket.id,
            senderType: 'AGENT',
            senderId: assignedTo,
            messageText: `Great news! I've resolved the issue. Please let me know if you need any further assistance.`,
            sentimentScore: 0.8,
            createdAt: resolvedAt,
          },
        })

        await prisma.ticketMessage.create({
          data: {
            ticketId: ticket.id,
            senderType: 'CUSTOMER',
            messageText: `Thank you so much for your help! The issue is now fixed.`,
            sentimentScore: 0.9,
            createdAt: new Date(resolvedAt.getTime() + 1000 * 60 * 30),
          },
        })
      }
    }
  }
  console.log('✅ Created tickets')

  // Update customer stats
  for (const customer of customers) {
    const customerTickets = await prisma.ticket.findMany({
      where: { customerId: customer.id },
      select: { sentimentScore: true },
    })

    const avgSentiment = customerTickets.length > 0
      ? customerTickets.reduce((acc, t) => acc + (t.sentimentScore || 0), 0) / customerTickets.length
      : 0

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalTickets: customerTickets.length,
        avgSentiment,
        lastContactAt: new Date(),
      },
    })
  }
  console.log('✅ Updated customer stats')

  console.log('🎉 Seed completed!')
  console.log('\n📋 Login credentials:')
  console.log('   Email: admin@supportiq.com')
  console.log('   Password: demo123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
