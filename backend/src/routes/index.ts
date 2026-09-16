import { Router } from 'express';

import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import subscriptionRoutes from './subscription.routes';
import paymentRoutes from './payment.routes';
import bookingRoutes from './booking.routes';
import salonRoutes from './salon.routes';
import barberRoutes from './barber.routes';
import hairstyleRoutes from './hairstyle.routes';
import recommendationRoutes from './recommendation.routes';
import faceAnalysisRoutes from './face-analysis.routes';
import notificationRoutes from './notification.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

/**
 * Health Check
 */
router.get('/health', (_, res) => {
  res.status(200).json({
    success: true,
    message: 'BibSaaS API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

/**
 * API Routes
 */
router.use('/auth', authRoutes);

router.use('/users', userRoutes);

router.use('/admin', adminRoutes);

router.use('/subscriptions', subscriptionRoutes);

router.use('/payments', paymentRoutes);

router.use('/bookings', bookingRoutes);

router.use('/salons', salonRoutes);

router.use('/barbers', barberRoutes);

router.use('/hairstyles', hairstyleRoutes);

router.use('/recommendations', recommendationRoutes);

router.use('/face-analysis', faceAnalysisRoutes);

router.use('/notifications', notificationRoutes);

router.use('/dashboard', dashboardRoutes);

export default router;