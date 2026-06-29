import { Router } from 'express'
import OpenAI from 'openai'
import { prisma } from '../utils/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()

router.use(authenticate)

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Categorize ticket
router.post('/categorize', async (req, res, next) => {
  try {
    const { subject, description } = req.body

    if (!subject || !description) {
      throw new AppError(400, 'Subject and description are required')
    }

    // If no API key, return mock response
    if (!process.env.OPENAI_API_KEY) {
      const categories = ['BUG_REPORT', 'FEATURE_REQUEST', 'HOW_TO_QUESTION', 'BILLING_ISSUE', 'COMPLAINT', 'OTHER']
      const mockCategory = categories[Math.floor(Math.random() * categories.length)]

      return res.json({
        success: true,
        data: {
          category: mockCategory.toLowerCase().replace('_', '-'),
          confidence: 0.85 + Math.random() * 0.1,
          reasoning: 'Mock categorization (OpenAI API key not configured)',
        },
      })
    }

    const prompt = `Analyze this customer support ticket and categorize it.

Subject: ${subject}
Description: ${description}

Categories:
- BUG_REPORT: Software defects or errors
- FEATURE_REQUEST: New functionality requests
- HOW_TO_QUESTION: Usage questions
- BILLING_ISSUE: Payment or subscription issues
- COMPLAINT: Negative feedback about service
- OTHER: Doesn't fit above categories

Return JSON only: {"category": "CATEGORY_NAME", "confidence": 0.0-1.0, "reasoning": "brief explanation"}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert at categorizing customer support tickets. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')

    res.json({
      success: true,
      data: {
        category: result.category?.toLowerCase().replace('_', '-') || 'other',
        confidence: result.confidence || 0.8,
        reasoning: result.reasoning || 'Categorized based on content analysis',
      },
    })
  } catch (error) {
    next(error)
  }
})

// Analyze sentiment
router.post('/sentiment', async (req, res, next) => {
  try {
    const { text } = req.body

    if (!text) {
      throw new AppError(400, 'Text is required')
    }

    // Simple rule-based sentiment for when API key is not available
    if (!process.env.OPENAI_API_KEY) {
      const negativeWords = ['frustrated', 'angry', 'terrible', 'broken', 'urgent', 'critical', 'disappointed', 'unacceptable']
      const positiveWords = ['thank', 'great', 'love', 'amazing', 'excellent', 'helpful', 'appreciate']

      const lowerText = text.toLowerCase()
      let score = 0

      negativeWords.forEach(word => {
        if (lowerText.includes(word)) score -= 0.3
      })
      positiveWords.forEach(word => {
        if (lowerText.includes(word)) score += 0.3
      })

      score = Math.max(-1, Math.min(1, score))

      return res.json({
        success: true,
        data: {
          score,
          label: score >= 0.3 ? 'positive' : score <= -0.3 ? 'negative' : 'neutral',
          confidence: 0.75,
        },
      })
    }

    const prompt = `Analyze the sentiment of this customer support message.

Message: "${text}"

Return JSON only: {"score": -1.0 to 1.0, "label": "positive/neutral/negative", "confidence": 0.0-1.0}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert at analyzing customer sentiment. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 100,
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')

    res.json({
      success: true,
      data: {
        score: result.score || 0,
        label: result.label || 'neutral',
        confidence: result.confidence || 0.8,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Suggest response
router.post('/suggest-response', async (req, res, next) => {
  try {
    const { ticketId } = req.body

    if (!ticketId) {
      throw new AppError(400, 'Ticket ID is required')
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!ticket) {
      throw new AppError(404, 'Ticket not found')
    }

    // Mock responses for when API key is not available
    if (!process.env.OPENAI_API_KEY) {
      const templates = [
        `Hi there,\n\nThank you for reaching out to us about "${ticket.subject}". I understand this is important to you and I'm here to help.\n\nI've reviewed your message and I'll need a bit more information to assist you effectively. Could you please provide:\n1. Any error messages you're seeing\n2. Steps to reproduce the issue\n3. When this issue started\n\nI'll be happy to help resolve this as quickly as possible.\n\nBest regards,\nSupport Team`,
        `Hello,\n\nThank you for contacting SupportIQ! I've received your request regarding "${ticket.subject}".\n\nI'm looking into this right now and will get back to you with a solution shortly. In the meantime, have you tried clearing your browser cache and cookies? This often resolves similar issues.\n\nPlease let me know if you have any other questions.\n\nBest,\nSupport Team`,
        `Hi,\n\nThanks for getting in touch! I can see you're experiencing an issue with "${ticket.subject}".\n\nGood news - I've seen similar cases before and there's usually a straightforward fix. Let me walk you through the solution:\n\n1. First, log out of your account\n2. Clear your browser cache\n3. Log back in and try again\n\nIf this doesn't work, please let me know and I'll escalate this to our technical team.\n\nCheers,\nSupport Team`,
      ]

      return res.json({
        success: true,
        data: {
          suggestions: templates.map((text, i) => ({
            id: `suggestion-${i + 1}`,
            text,
            confidence: 0.9 - i * 0.1,
          })),
        },
      })
    }

    const conversationHistory = ticket.messages
      .map((m: { senderType: string; messageText: string }) => `${m.senderType}: ${m.messageText}`)
      .join('\n')

    const prompt = `Generate 3 professional response suggestions for this customer support ticket.

Ticket Subject: ${ticket.subject}
Ticket Description: ${ticket.description}
Customer: ${ticket.customer.email}
Conversation:
${conversationHistory}

Return JSON only: {"suggestions": [{"text": "response text", "confidence": 0.0-1.0}]}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful customer support agent. Generate professional, empathetic responses. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    })

    const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}')

    res.json({
      success: true,
      data: {
        suggestions: result.suggestions?.map((s: any, i: number) => ({
          id: `suggestion-${i + 1}`,
          text: s.text,
          confidence: s.confidence || 0.8,
        })) || [],
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as aiRouter }
