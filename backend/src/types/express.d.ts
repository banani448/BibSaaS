
/**
 * ============================================================
 * BibSaaS — Express Type Definitions
 * ============================================================
 *
 * Extensions globales des types Express.
 *
 * Ce fichier ne contient que les extensions de Request.
 * Les types d'authentification sont centralisés dans
 * auth.types.ts et les types généraux dans common.types.ts.
 * ============================================================
 */

import type { Request } from "express";

import type {
  AuthUser,
  JwtPayload,
} from "./auth.types";

import type {
  RequestContext,
} from "./common.types";

/**
 * ============================================================
 * EXPRESS REQUEST EXTENSION
 * ============================================================
 */

declare global {
  namespace Express {
    interface Request {
      /**
       * Utilisateur authentifié.
       *
       * Disponible après le middleware JWT.
       */
      user?: AuthUser;

      /**
       * Identifiant utilisateur.
       */
      userId?: string;

      /**
       * Tenant courant.
       */
      tenantId?: string;

      /**
       * Salon courant.
       */
      salonId?: string;

      /**
       * Barber courant.
       */
      barberId?: string;

      /**
       * Rôles de l'utilisateur.
       */
      roles?: string[];

      /**
       * Permissions de l'utilisateur.
       */
      permissions?: string[];

      /**
       * Payload JWT décodé.
       */
      auth?: JwtPayload;

      /**
       * Identifiant unique de requête.
       */
      requestId?: string;

      /**
       * Identifiant de corrélation.
       */
      correlationId?: string;

      /**
       * Contexte de requête.
       */
      context?: RequestContext;

      /**
       * Indique si la requête est authentifiée.
       */
      isAuthenticated?: boolean;

      /**
       * Timestamp de début.
       */
      startedAt?: number;

      /**
       * Trace ID.
       */
      traceId?: string;

      /**
       * Temps de réponse.
       */
      responseTime?: number;

      /**
       * Fichier uploadé.
       */
      file?: Express.Multer.File;

      /**
       * Plusieurs fichiers uploadés.
       */
      files?:
        | Express.Multer.File[]
        | {
            [fieldname: string]:
              Express.Multer.File[];
          };

      /**
       * Métadonnées d'upload.
       */
      uploadMetadata?: {
        bucket?: string;
        path?: string;
        size?: number;
        mimeType?: string;
        url?: string;
      };

      /**
       * Adresse IP réelle du client.
       */
      clientIp?: string;

      /**
       * Informations concernant le device.
       */
      device?: {
        type?:
          | "mobile"
          | "tablet"
          | "desktop"
          | "unknown";

        os?: string;

        browser?: string;

        userAgent?: string;
      };

      /**
       * Pagination normalisée.
       */
      pagination?: {
        page: number;
        limit: number;
        offset: number;
        total?: number;
        pages?: number;
      };

      /**
       * Filtres normalisés.
       */
      filters?: Record<string, unknown>;

      /**
       * Données validées par les middlewares.
       */
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
        headers?: unknown;
      };
    }

    /**
     * ========================================================
     * MULTER
     * ========================================================
     */

    namespace Multer {
      interface File {
        /**
         * Identifiant interne BibSaaS.
         */
        id?: string;

        /**
         * URL publique Supabase Storage.
         */
        publicUrl?: string;

        /**
         * Chemin Supabase Storage.
         */
        storagePath?: string;

        /**
         * Bucket Supabase.
         */
        bucket?: string;

        /**
         * Hash du fichier.
         */
        hash?: string;

        /**
         * Métadonnées personnalisées.
         */
        metadata?: Record<string, unknown>;
      }
    }
  }
}

/**
 * ============================================================
 * AUTHENTICATED REQUEST
 * ============================================================
 *
 * Utiliser ce type uniquement dans les controllers/middlewares
 * où l'authentification a déjà été vérifiée.
 */

export interface AuthenticatedRequest
  extends Request {
  user: AuthUser & {
    id: string;
  };

  userId: string;
}

/**
 * ============================================================
 * TYPE GUARD
 * ============================================================
 */

export function isAuthenticatedRequest(
  req: Request,
): req is AuthenticatedRequest {
  return Boolean(
    req.user?.id &&
      req.userId,
  );
}

/**
 * ============================================================
 * ROLE CHECK
 * ============================================================
 */

export function hasRole(
  req: Request,
  role: string,
): boolean {
  if (!req.user) {
    return false;
  }

  if (req.user.role === role) {
    return true;
  }

  return Boolean(
    req.user.roles?.includes(
      role as AuthUser["role"],
    ),
  );
}

/**
 * ============================================================
 * PERMISSION CHECK
 * ============================================================
 */

export function hasPermission(
  req: Request,
  permission: string,
): boolean {
  if (!req.user) {
    return false;
  }

  return Boolean(
    req.user.permissions?.includes(
      permission as NonNullable<
        AuthUser["permissions"]
      >[number],
    ),
  );
}

/**
 * ============================================================
 * MODULE MARKER
 * ============================================================
 */

export {};

