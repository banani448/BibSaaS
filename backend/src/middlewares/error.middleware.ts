import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import config from '../config/env';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || 'unknown';

  if (err instanceof AppError) {
    logger.error(`AppError: ${err.message}`, {
      code: err.code,
      statusCode: err.statusCode,
      requestId,
      path: req.path,
    });

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      requestId,
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    logger.error('Prisma Error:', err);
    return res.status(400).json({
      success: false,
      message: 'Database operation failed',
      code: 'DATABASE_ERROR',
      requestId,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    logger.error('JWT Error:', err);
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
      requestId,
    });
  }

  if (err.name === 'TokenExpiredError') {
    logger.error('Token Expired Error:', err);
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
      requestId,
    });
  }

  // Generic error
  logger.error('Unhandled Error:', err);
  return res.status(500).json({
    success: false,
    message: config.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
    requestId,
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string || 'unknown';

  logger.warn(`404 Not Found: ${req.method} ${req.path}`, { requestId });

  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
    requestId,
  });
};
