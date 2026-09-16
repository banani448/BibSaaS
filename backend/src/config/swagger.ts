
/**
 * ============================================================
 * BibSaaS — Swagger / OpenAPI Configuration
 * ============================================================
 *
 * File:
 * src/config/swagger.ts
 *
 * Stack:
 * - Express
 * - TypeScript
 * - OpenAPI 3.0
 * - Swagger UI
 * - JWT Bearer Authentication
 *
 * ============================================================
 */

import swaggerJSDoc, {
  Options,
} from "swagger-jsdoc";

import swaggerUi from "swagger-ui-express";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

import type {
  Express,
} from "express";

/**
 * ============================================================
 * ENVIRONMENT
 * ============================================================
 */

const NODE_ENV =
  process.env.NODE_ENV ??
  "development";

const PORT =
  Number(
    process.env.PORT ??
      3000,
  );

const API_VERSION =
  process.env.API_VERSION ??
  "v1";

const API_URL =
  process.env.API_URL ??
  `http://localhost:${PORT}`;

/**
 * ============================================================
 * OPENAPI DEFINITION
 * ============================================================
 */

export const swaggerDefinition = {
  openapi: "3.0.3",

  info: {
    title:
      "BibSaaS API",

    version:
      process.env.APP_VERSION ??
      "1.0.0",

    description: `
# BibSaaS API

API REST officielle de la plateforme **BibSaaS**.

BibSaaS permet de gérer :

- 👤 Clients
- 💈 Barbiers
- 🏪 Salons
- 🏢 Chaînes de salons
- 📅 Réservations
- 💳 Abonnements
- 💰 Paiements Mobile Money
- 🧾 Factures
- 🤖 Analyse de visage
- 💇 Recommandations de coiffures
- 🔔 Notifications
- 📊 Dashboards
- 🛡️ Administration
- 📝 Audit Logs

## Authentification

La majorité des endpoints protégés utilisent :

\`Authorization: Bearer <JWT>\`

Le token est généré lors de la connexion et doit être transmis
dans l'en-tête HTTP \`Authorization\`.

## Environnements

- Development
- Staging
- Production

## Versioning

L'API utilise un versioning via :

\`/api/v1\`
    `,

    contact: {
      name:
        "BibSaaS API Team",

      email:
        process.env.API_CONTACT_EMAIL ??
        "support@bibsaas.com",

      url:
        process.env.API_CONTACT_URL ??
        API_URL,
    },

    license: {
      name:
        "Proprietary",
    },
  },

  /**
   * ==========================================================
   * SERVERS
   * ==========================================================
   */

  servers: [
    {
      url:
        `${API_URL}/api/${API_VERSION}`,

      description:
        `BibSaaS ${NODE_ENV} API`,
    },

    ...(process.env.PRODUCTION_API_URL
      ? [
          {
            url:
              `${process.env.PRODUCTION_API_URL}/api/${API_VERSION}`,

            description:
              "BibSaaS Production API",
          },
        ]
      : []),

    ...(process.env.STAGING_API_URL
      ? [
          {
            url:
              `${process.env.STAGING_API_URL}/api/${API_VERSION}`,

            description:
              "BibSaaS Staging API",
          },
        ]
      : []),
  ],

  /**
   * ==========================================================
   * TAGS
   * ==========================================================
   */

  tags: [
    {
      name:
        "Authentication",

      description:
        "Inscription, connexion, tokens et sessions.",
    },

    {
      name:
        "Users",

      description:
        "Gestion du profil utilisateur.",
    },

    {
      name:
        "Subscriptions",

      description:
        "Gestion des abonnements et plans.",
    },

    {
      name:
        "Payments",

      description:
        "Paiements, transactions et webhooks.",
    },

    {
      name:
        "Bookings",

      description:
        "Réservations clients et gestion des rendez-vous.",
    },

    {
      name:
        "Barbers",

      description:
        "Gestion des barbiers.",
    },

    {
      name:
        "Salons",

      description:
        "Gestion des salons et établissements.",
    },

    {
      name:
        "Hairstyles",

      description:
        "Catalogue des coiffures.",
    },

    {
      name:
        "Face Analysis",

      description:
        "Analyse faciale et traitement des recommandations.",
    },

    {
      name:
        "Recommendations",

      description:
        "Recommandations personnalisées de coiffures.",
    },

    {
      name:
        "Notifications",

      description:
        "Notifications utilisateur.",
    },

    {
      name:
        "Invoices",

      description:
        "Factures et documents financiers.",
    },

    {
      name:
        "Dashboard",

      description:
        "Statistiques et indicateurs des dashboards.",
    },

    {
      name:
        "Admin",

      description:
        "Administration de la plateforme.",
    },

    {
      name:
        "Health",

      description:
        "État de santé des services.",
    },
  ],

  /**
   * ==========================================================
   * SECURITY
   * ==========================================================
   */

  components: {
    securitySchemes: {
      bearerAuth: {
        type:
          "http",

        scheme:
          "bearer",

        bearerFormat:
          "JWT",

        description:
          "JWT Access Token. Format : Bearer <token>",
      },
    },

    /**
     * ========================================================
     * SCHEMAS
     * ========================================================
     */

    schemas: {
      /**
       * ------------------------------------------------------
       * Generic API response
       * ------------------------------------------------------
       */

      ApiResponse: {
        type:
          "object",

        properties: {
          success: {
            type:
              "boolean",

            example:
              true,
          },

          message: {
            type:
              "string",

            example:
              "Operation completed successfully.",
          },

          data: {
            nullable:
              true,

            example:
              {},
          },

          timestamp: {
            type:
              "string",

            format:
              "date-time",

            example:
              "2026-08-31T20:00:00.000Z",
          },

          requestId: {
            type:
              "string",

            example:
              "req_01JEXAMPLE",
          },
        },
      },

      /**
       * ------------------------------------------------------
       * Pagination
       * ------------------------------------------------------
       */

      Pagination: {
        type:
          "object",

        properties: {
          page: {
            type:
              "integer",

            minimum:
              1,

            example:
              1,
          },

          limit: {
            type:
              "integer",

            minimum:
              1,

            maximum:
              100,

            example:
              20,
          },

          total: {
            type:
              "integer",

            example:
              120,
          },

          totalPages: {
            type:
              "integer",

            example:
              6,
          },

          hasNextPage: {
            type:
              "boolean",

            example:
              true,
          },

          hasPreviousPage: {
            type:
              "boolean",

            example:
              false,
          },
        },
      },

      /**
       * ------------------------------------------------------
       * Error
       * ------------------------------------------------------
       */

      Error: {
        type:
          "object",

        properties: {
          success: {
            type:
              "boolean",

            example:
              false,
          },

          message: {
            type:
              "string",

            example:
              "An error occurred.",
          },

          code: {
            type:
              "string",

            example:
              "VALIDATION_ERROR",
          },

          requestId: {
            type:
              "string",

            example:
              "req_01JEXAMPLE",
          },

          timestamp: {
            type:
              "string",

            format:
              "date-time",
          },

          errors: {
            type:
              "array",

            items: {
              type:
                "object",
            },
          },
        },
      },

      /**
       * ------------------------------------------------------
       * User
       * ------------------------------------------------------
       */

      User: {
        type:
          "object",

        required: [
          "id",
          "email",
          "role",
        ],

        properties: {
          id: {
            type:
              "string",

            format:
              "uuid",
          },

          email: {
            type:
              "string",

            format:
              "email",

            example:
              "client@example.com",
          },

          firstName: {
            type:
              "string",

            example:
              "Jean",
          },

          lastName: {
            type:
              "string",

            example:
              "Dupont",
          },

          phone: {
            type:
              "string",

            example:
              "+242060000000",
          },

          role: {
            type:
              "string",

            enum: [
              "CLIENT",
              "BARBER",
              "SALON",
              "SALON_CHAIN",
              "ADMIN",
              "SUPER_ADMIN",
            ],

            example:
              "CLIENT",
          },

          isActive: {
            type:
              "boolean",

            example:
              true,
          },

          createdAt: {
            type:
              "string",

            format:
              "date-time",
          },

          updatedAt: {
            type:
              "string",

            format:
              "date-time",
          },
        },
      },

      /**
       * ------------------------------------------------------
       * Auth Tokens
       * ------------------------------------------------------
       */

      AuthTokens: {
        type:
          "object",

        properties: {
          accessToken: {
            type:
              "string",

            example:
              "eyJhbGciOiJIUzI1NiIs...",
          },

          refreshToken: {
            type:
              "string",

            example:
              "eyJhbGciOiJIUzI1NiIs...",
          },

          expiresIn: {
            type:
              "integer",

            example:
              900,
          },

          tokenType: {
            type:
              "string",

            example:
              "Bearer",
          },
        },
      },

      /**
       * ------------------------------------------------------
       * Subscription
       * ------------------------------------------------------
       */

      Subscription: {
        type:
          "object",

        properties: {
          id: {
            type:
              "string",

            format:
              "uuid",
          },

          planId: {
            type:
              "string",

            format:
              "uuid",
          },

          status: {
            type:
              "string",

            enum: [
              "PENDING",
              "ACTIVE",
              "EXPIRED",
              "CANCELLED",
              "PAUSED",
            ],
          },

          currency: {
            type:
              "string",

            enum: [
              "XAF",
              "EUR",
              "USD",
              "GBP",
              "CAD",
            ],

            example:
              "XAF",
          },

          amount: {
            type:
              "number",

            example:
              2000,
          },

          startsAt: {
            type:
              "string",

            format:
              "date-time",
          },

          expiresAt: {
            type:
              "string",

            format:
              "date-time",
          },
        },
      },

      /**
       * ------------------------------------------------------
       * Payment
       * ------------------------------------------------------
       */

      Payment: {
        type:
          "object",

        properties: {
          id: {
            type:
              "string",

            format:
              "uuid",
          },

          reference: {
            type:
              "string",

            example:
              "PAY-2026-000001",
          },

          amount: {
            type:
              "number",

            example:
              2000,
          },

          currency: {
            type:
              "string",

            enum: [
              "XAF",
              "EUR",
              "USD",
              "GBP",
              "CAD",
            ],
          },

          method: {
            type:
              "string",

            enum: [
              "MTN_MOBILE_MONEY",
              "AIRTEL_MONEY",
              "ORANGE_MONEY",
              "MPESA",
              "CINETPAY",
              "STRIPE",
              "CARD",
              "SIMULATED",
            ],
          },

          status: {
            type:
              "string",

            enum: [
              "PENDING",
              "PROCESSING",
              "SUCCESS",
              "FAILED",
              "CANCELLED",
              "REFUNDED",
            ],
          },

          transactionId: {
            type:
              "string",

            nullable:
              true,
          },

          paidAt: {
            type:
              "string",

            format:
              "date-time",

            nullable:
              true,
          },
        },
      },

      /**
       * ------------------------------------------------------
       * Booking
       * ------------------------------------------------------
       */

      Booking: {
        type:
          "object",

        properties: {
          id: {
            type:
              "string",

            format:
              "uuid",
          },

          clientId: {
            type:
              "string",

            format:
              "uuid",
          },

          barberId: {
            type:
              "string",

            format:
              "uuid",
          },

          salonId: {
            type:
              "string",

            format:
              "uuid",
          },

          startsAt: {
            type:
              "string",

            format:
              "date-time",
          },

          endsAt: {
            type:
              "string",

            format:
              "date-time",
          },

          status: {
            type:
              "string",

            enum: [
              "PENDING",
              "CONFIRMED",
              "COMPLETED",
              "CANCELLED",
              "NO_SHOW",
            ],
          },

          price: {
            type:
              "number",

            example:
              2500,
          },

          currency: {
            type:
              "string",

            example:
              "XAF",
          },
        },
      },

      /**
       * ------------------------------------------------------
       * Face Analysis
       * ------------------------------------------------------
       */

      FaceAnalysis: {
        type:
          "object",

        properties: {
          id: {
            type:
              "string",

            format:
              "uuid",
          },

          status: {
            type:
              "string",

            enum: [
              "PENDING",
              "PROCESSING",
              "COMPLETED",
              "FAILED",
            ],
          },

          faceShape: {
            type:
              "string",

            nullable:
              true,

            example:
              "OVAL",
          },

          confidence: {
            type:
              "number",

            format:
              "float",

            minimum:
              0,

            maximum:
              1,

            example:
              0.94,
          },

          createdAt: {
            type:
              "string",

            format:
              "date-time",
          },
        },
      },

      /**
       * ------------------------------------------------------
       * Hairstyle
       * ------------------------------------------------------
       */

      Hairstyle: {
        type:
          "object",

        properties: {
          id: {
            type:
              "string",

            format:
              "uuid",
          },

          name: {
            type:
              "string",

            example:
              "Low Fade",
          },

          description: {
            type:
              "string",

            example:
              "Coupe moderne avec dégradé bas.",
          },

          category: {
            type:
              "string",

            example:
              "FADE",
          },

          isActive: {
            type:
              "boolean",

            example:
              true,
          },
        },
      },

      /**
       * ------------------------------------------------------
       * Notification
       * ------------------------------------------------------
       */

      Notification: {
        type:
          "object",

        properties: {
          id: {
            type:
              "string",

            format:
              "uuid",
          },

          type: {
            type:
              "string",

            example:
              "BOOKING_CONFIRMED",
          },

          title: {
            type:
              "string",

            example:
              "Réservation confirmée",
          },

          message: {
            type:
              "string",

            example:
              "Votre rendez-vous est confirmé.",
          },

          read: {
            type:
              "boolean",

            example:
              false,
          },

          createdAt: {
            type:
              "string",

            format:
              "date-time",
          },
        },
      },
    },

    /**
     * ========================================================
     * COMMON RESPONSES
     * ========================================================
     */

    responses: {
      Unauthorized: {
        description:
          "Authentification requise ou token invalide.",

        content: {
          "application/json": {
            schema: {
              $ref:
                "#/components/schemas/Error",
            },
          },
        },
      },

      Forbidden: {
        description:
          "Permissions insuffisantes.",

        content: {
          "application/json": {
            schema: {
              $ref:
                "#/components/schemas/Error",
            },
          },
        },
      },

      NotFound: {
        description:
          "Ressource introuvable.",

        content: {
          "application/json": {
            schema: {
              $ref:
                "#/components/schemas/Error",
            },
          },
        },
      },

      ValidationError: {
        description:
          "Données invalides.",

        content: {
          "application/json": {
            schema: {
              $ref:
                "#/components/schemas/Error",
            },
          },
        },
      },

      InternalServerError: {
        description:
          "Erreur interne du serveur.",

        content: {
          "application/json": {
            schema: {
              $ref:
                "#/components/schemas/Error",
            },
          },
        },
      },

      RateLimitExceeded: {
        description:
          "Trop de requêtes.",

        headers: {
          "Retry-After": {
            description:
              "Nombre de secondes avant nouvelle tentative.",

            schema: {
              type:
                "integer",
            },
          },
        },

        content: {
          "application/json": {
            schema: {
              $ref:
                "#/components/schemas/Error",
            },
          },
        },
      },
    },
  },

  /**
   * ==========================================================
   * GLOBAL SECURITY
   * ==========================================================
   */

  security: [
    {
      bearerAuth: [],
    },
  ],
};

/**
 * ============================================================
 * SWAGGER OPTIONS
 * ============================================================
 */

export const swaggerOptions: Options = {
  definition:
    swaggerDefinition,

  /**
   * Swagger cherche les annotations JSDoc dans les routes
   * et contrôleurs.
   */
  apis: [
    "./src/routes/**/*.ts",
    "./src/controllers/**/*.ts",
    "./src/modules/**/*.ts",
  ],
};

/**
 * ============================================================
 * GENERATE OPENAPI DOCUMENT
 * ============================================================
 */

export const swaggerSpec =
  swaggerJSDoc(
    swaggerOptions,
  );

/**
 * ============================================================
 * SWAGGER UI OPTIONS
 * ============================================================
 */

export const swaggerUiOptions = {
  explorer: true,

  customSiteTitle:
    "BibSaaS API Documentation",

  customCss: `
    .swagger-ui .topbar {
      display: none;
    }

    .swagger-ui .info {
      margin-bottom: 30px;
    }

    .swagger-ui .info .title {
      font-size: 32px;
    }

    .swagger-ui .scheme-container {
      box-shadow: none;
    }
  `,

  swaggerOptions: {
    persistAuthorization:
      true,

    displayRequestDuration:
      true,

    filter:
      true,

    docExpansion:
      "none",

    defaultModelsExpandDepth:
      1,

    defaultModelExpandDepth:
      2,

    tryItOutEnabled:
      NODE_ENV !==
      "production",

    displayOperationId:
      true,

    syntaxHighlight: {
      activate:
        true,

      theme:
        "agate",
    },
  },
};

/**
 * ============================================================
 * REGISTER SWAGGER
 * ============================================================
 */

export function setupSwagger(
  app: Express,
): void {
  const swaggerPath =
    process.env.SWAGGER_PATH ??
    `/api/${API_VERSION}/docs`;

  app.use(
    swaggerPath,
    swaggerUi.serve,
    swaggerUi.setup(
      swaggerSpec,
      swaggerUiOptions,
    ),
  );

  /**
   * JSON OpenAPI specification.
   */
  app.get(
    `${swaggerPath}.json`,
    (_req, res) => {
      res.json(
        swaggerSpec,
      );
    },
  );

  /**
   * YAML n'est volontairement pas généré ici.
   * swagger-jsdoc produit directement l'objet OpenAPI.
   */

  console.log(
    `[SWAGGER] Documentation available at ${swaggerPath}`,
  );
}

/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

export default {
  definition:
    swaggerDefinition,

  options:
    swaggerOptions,

  spec:
    swaggerSpec,

  uiOptions:
    swaggerUiOptions,

  setup:
    setupSwagger,
};

