import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './errorHandler.js'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'Authentication required')
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as JwtPayload

    req.user = decoded
    next()
  } catch (error) {
    throw new AppError(401, 'Invalid or expired token')
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required')
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'Insufficient permissions')
    }

    next()
  }
}
