import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import config from './config/env';
import logger from './config/logger';
import swaggerSpec from './config/swagger';
import { testDatabaseConnection } from './config/database';

// Import routes (will be implemented)
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import subscriptionRoutes from './routes/subscription.routes';
import paymentRoutes from './routes/payment.routes';
import invoiceRoutes from './routes/invoice.routes';
import bookingRoutes from './routes/booking.routes';
import barberRoutes from './routes/barber.routes';
import salonRoutes from './routes/salon.routes';
import hairstyleRoutes from './routes/hairstyle.routes';
import faceAnalysisRoutes from './routes/face-analysis.routes';
import recommendationRoutes from './routes/recommendation.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import webhookRoutes from './routes/webhook.routes';

// Import middleware (will be implemented)
import { errorHandler } from './middlewares/error.middleware';
import { notFoundHandler } from './middlewares/error.middleware';

const createApp = (): Application => {
  const app: Application = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Compression
  app.use(compression());

  // Logging
  if (config.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/', limiter);

  // Health check endpoint
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      const dbHealth = await testDatabaseConnection();
      
      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: config.NODE_ENV,
          version: '1.0.0',
          database: dbHealth ? 'connected' : 'disconnected',
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Health check failed',
        error: 'HEALTH_CHECK_ERROR',
      });
    }
  });

  // API documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/barbers', barberRoutes);
  app.use('/api/salons', salonRoutes);
  app.use('/api/hairstyles', hairstyleRoutes);
  app.use('/api/face-analysis', faceAnalysisRoutes);
  app.use('/api/recommendations', recommendationRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/webhooks', webhookRoutes);

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'BibSaaS Premium API',
      version: '1.0.0',
      documentation: '/api/docs',
      health: '/api/health',
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
};

export default createApp;
