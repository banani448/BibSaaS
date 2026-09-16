import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };

export const isAdmin = authorize(
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
);

export const isSuperAdmin = authorize(
  UserRole.SUPER_ADMIN,
);

export const isSalonOwner = authorize(
  UserRole.SALON,
  UserRole.SALON_CHAIN,
);

export const isBarber = authorize(
  UserRole.BARBER,
);

export const isClient = authorize(
  UserRole.CLIENT,
);