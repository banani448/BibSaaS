/**
 * ============================================================
 * BibSaaS — Authentication Middleware
 * ============================================================
 *
 * File:
 * src/middlewares/auth.middleware.ts
 *
 * Description:
 * Middleware d'authentification JWT pour les routes protégées.
 *
 * Responsabilités :
 * - Récupérer le token JWT depuis Authorization: Bearer <token>
 * - Vérifier le token
 * - Extraire les informations utilisateur
 * - Ajouter l'utilisateur authentifié à req.user
 * - Bloquer les requêtes non authentifiées
 *
 * ============================================================
 */

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

/**
 * ------------------------------------------------------------
 * Types
 * ------------------------------------------------------------
 */

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

/**
 * Extension de Express Request
 *
 * Permet d'utiliser :
 *
 * req.user
 * req.user.id
 * req.user.email
 * req.user.role
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * ------------------------------------------------------------
 * JWT configuration
 * ------------------------------------------------------------
 */

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn(
    '[Auth] JWT_SECRET is not defined in environment variables.'
  );
}

/**
 * ------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------
 */

/**
 * Récupère le token JWT depuis :
 *
 * Authorization: Bearer <token>
 */
const extractToken = (req: Request): string | null => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

/**
 * Vérifie que le payload JWT contient au minimum un id.
 */
const normalizeUser = (payload: string | JwtPayload): AuthUser | null => {
  if (typeof payload === 'string') {
    return null;
  }

  const id =
    payload.id ??
    payload.userId ??
    payload.sub;

  if (!id) {
    return null;
  }

  return {
    id: String(id),
    email:
      typeof payload.email === 'string'
        ? payload.email
        : undefined,
    role:
      typeof payload.role === 'string'
        ? payload.role
        : undefined,
    ...payload,
  };
};

/**
 * ------------------------------------------------------------
 * authenticate
 * ------------------------------------------------------------
 *
 * Protège une route avec JWT.
 *
 * Exemple :
 *
 * router.get(
 *   '/profile',
 *   authenticate,
 *   controller.getProfile
 * );
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    /**
     * Vérification de la configuration
     */
    if (!JWT_SECRET) {
      res.status(500).json({
        success: false,
        message: 'Authentication service is not properly configured.',
      });
      return;
    }

    /**
     * Extraction du token
     */
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication token is required.',
      });
      return;
    }

    /**
     * Vérification du JWT
     */
    const decoded = jwt.verify(token, JWT_SECRET);

    /**
     * Normalisation du payload
     */
    const user = normalizeUser(decoded);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
      return;
    }

    /**
     * Ajout de l'utilisateur à la requête
     */
    req.user = user;

    /**
     * Continuer vers le controller
     */
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Authentication token has expired.',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
      return;
    }

    console.error('[Auth] Authentication error:', error);

    res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};

/**
 * ------------------------------------------------------------
 * optionalAuthenticate
 * ------------------------------------------------------------
 *
 * Authentification facultative.
 *
 * Si un token valide est présent :
 * req.user est rempli.
 *
 * Sinon :
 * la requête continue normalement.
 */
export const optionalAuthenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (!JWT_SECRET) {
      next();
      return;
    }

    const token = extractToken(req);

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = normalizeUser(decoded);

    if (user) {
      req.user = user;
    }

    next();
  } catch {
    /**
     * Pour une authentification facultative,
     * un token invalide ne bloque pas la requête.
     */
    next();
  }
};

/**
 * ------------------------------------------------------------
 * authorize
 * ------------------------------------------------------------
 *
 * Autorisation basée sur les rôles.
 *
 * Exemple :
 *
 * router.get(
 *   '/admin',
 *   authenticate,
 *   authorize('ADMIN'),
 *   controller.dashboard
 * );
 */
export const authorize = (...allowedRoles: string[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!req.user.role) {
      res.status(403).json({
        success: false,
        message: 'User role is not defined.',
      });
      return;
    }

    const hasPermission = allowedRoles.some(
      (role) =>
        role.toUpperCase() ===
        String(req.user?.role).toUpperCase()
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource.',
      });
      return;
    }

    next();
  };
};

/**
 * ------------------------------------------------------------
 * Aliases
 * ------------------------------------------------------------
 *
 * Compatibilité avec différents noms potentiellement utilisés
 * ailleurs dans le projet.
 */

export const authMiddleware = authenticate;
export const requireAuth = authenticate;

/**
 * ------------------------------------------------------------
 * Default export
 * ------------------------------------------------------------
 */

export default authenticate;