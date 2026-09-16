import rateLimit from 'express-rate-limit';

export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 500,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      'Too many requests, please try again later',
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 20,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      'Too many authentication attempts',
  },
});

export const paymentRateLimit = rateLimit({
  windowMs: 60 * 1000,

  max: 10,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      'Too many payment requests',
  },
});

export const faceAnalysisRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,

  max: 50,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      'Face analysis limit reached',
  },
});