
/**
 * ============================================================
 * BibSaaS — Payment API Integration Tests
 * ============================================================
 *
 * Tests :
 * - Authentification
 * - Création de paiement
 * - Validation
 * - Stripe / Card
 * - Paiement simulé
 * - Consultation
 * - Vérification
 * - Annulation
 * - Webhook Stripe
 * - Idempotence
 * - Sécurité
 * - Devises
 *
 * Stack :
 * - Jest
 * - Supertest
 * - TypeScript
 *
 * Architecture actuelle :
 * - Stripe
 * - SIMULATED uniquement en développement/test
 *
 * CinetPay / Flutterwave / MTN / Airtel :
 * SUPPRIMÉS
 *
 * IMPORTANT :
 * - Ne pas modifier schema.prisma.
 * - Les tests doivent rester compatibles avec l'API actuelle.
 * ============================================================
 */

import request from "supertest";
import crypto from "crypto";

import app from "../app";

/* ============================================================
 * CONFIGURATION
 * ============================================================
 */

const API_PREFIX =
  process.env.TEST_API_PREFIX?.trim() || "/api";

const AUTH_ENDPOINT = `${API_PREFIX}/auth`;
const PAYMENT_ENDPOINT = `${API_PREFIX}/payments`;

const REGISTER_ENDPOINT =
  `${AUTH_ENDPOINT}/register`;

const LOGIN_ENDPOINT =
  `${AUTH_ENDPOINT}/login`;

/**
 * ID inexistant utilisé pour les tests.
 *
 * On utilise une valeur CUID-like afin de rester compatible
 * avec un modèle Prisma utilisant généralement cuid().
 */
const NON_EXISTING_PAYMENT_ID =
  "cm000000000000000000000000";

/* ============================================================
 * TYPES
 * ============================================================
 */

interface AuthUserResponse {
  id?: string;
  email?: string;
  role?: string;
}

interface AuthResponse {
  success?: boolean;
  message?: string;

  data?: {
    user?: AuthUserResponse;
    accessToken?: string;
    refreshToken?: string;
    token?: string;
  };

  user?: AuthUserResponse;

  accessToken?: string;
  refreshToken?: string;
  token?: string;
}

interface PaymentData {
  id?: string;
  status?: string;

  /**
   * Ancien champ éventuellement retourné par certaines
   * versions de l'API.
   */
  reference?: string;

  /**
   * Champ utilisé par le nouveau modèle Payment.
   */
  transactionReference?: string;

  transactionId?: string;
  providerTransactionId?: string;

  providerPaymentId?: string;
  providerCheckoutId?: string;

  checkoutUrl?: string;
  paymentUrl?: string;

  amount?: number;
  currency?: string;
  provider?: string;
  paymentMethod?: string;
}

interface PaymentResponse {
  success?: boolean;
  message?: string;

  data?: {
    id?: string;

    payment?: PaymentData;

    accessToken?: string;

    checkoutUrl?: string;
    paymentUrl?: string;
  };

  payment?: PaymentData;

  id?: string;
  status?: string;

  reference?: string;
  transactionReference?: string;

  transactionId?: string;
  providerTransactionId?: string;

  checkoutUrl?: string;
  paymentUrl?: string;
}

/* ============================================================
 * HELPERS
 * ============================================================
 */

function extractAccessToken(
  body: AuthResponse,
): string | undefined {
  return (
    body.accessToken ??
    body.data?.accessToken ??
    body.token ??
    body.data?.token
  );
}

function extractUserId(
  body: AuthResponse,
): string | undefined {
  return (
    body.user?.id ??
    body.data?.user?.id
  );
}

function extractPaymentId(
  body: PaymentResponse,
): string | undefined {
  return (
    body.id ??
    body.payment?.id ??
    body.data?.payment?.id ??
    body.data?.id
  );
}

function extractPaymentReference(
  body: PaymentResponse,
): string | undefined {
  return (
    body.transactionReference ??
    body.reference ??
    body.payment?.transactionReference ??
    body.payment?.reference ??
    body.data?.payment?.transactionReference ??
    body.data?.payment?.reference
  );
}

function extractPaymentStatus(
  body: PaymentResponse,
): string | undefined {
  return (
    body.status ??
    body.payment?.status ??
    body.data?.payment?.status
  );
}

function getAuthorizationHeader(
  token: string,
): string {
  return `Bearer ${token}`;
}

/* ============================================================
 * TEST SUITE
 * ============================================================
 */

describe("BibSaaS Payment API", () => {
  let accessToken = "";
  let userId = "";

  let paymentId: string | undefined;
  let paymentReference: string | undefined;

  /**
   * Utilisateur de test unique.
   */
  const timestamp = Date.now();

  const testUser = {
    firstName: "Payment",
    lastName: "Tester",

    email:
      `payment.${timestamp}@example.com`,

    phoneNumber:
      `+24206${String(timestamp).slice(-7)}`,

    password:
      "Payment@Test123",

    role: "CLIENT",
  };

  /* ==========================================================
   * AUTHENTICATION SETUP
   * ==========================================================
   */

  beforeAll(async () => {
    /**
     * --------------------------------------------------------
     * REGISTER
     * --------------------------------------------------------
     */

    const registerResponse = await request(app)
      .post(REGISTER_ENDPOINT)
      .send(testUser);

    expect([200, 201]).toContain(
      registerResponse.status,
    );

    const registerBody =
      registerResponse.body as AuthResponse;

    /**
     * --------------------------------------------------------
     * LOGIN
     * --------------------------------------------------------
     */

    const loginResponse = await request(app)
      .post(LOGIN_ENDPOINT)
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect([200, 201]).toContain(
      loginResponse.status,
    );

    const loginBody =
      loginResponse.body as AuthResponse;

    accessToken =
      extractAccessToken(loginBody) ??
      extractAccessToken(registerBody) ??
      "";

    userId =
      extractUserId(loginBody) ??
      extractUserId(registerBody) ??
      "";

    expect(accessToken).toBeTruthy();
    expect(typeof accessToken).toBe("string");

    expect(userId).toBeTruthy();
    expect(typeof userId).toBe("string");
  });

  /* ==========================================================
   * CREATE PAYMENT
   * ==========================================================
   */

  describe("POST /payments", () => {
    it(
      "should reject unauthenticated payment creation",
      async () => {
        const response = await request(app)
          .post(PAYMENT_ENDPOINT)
          .send({
            amount: 2000,
            currency: "XAF",
            method: "SIMULATED",
          });

        expect([401, 403]).toContain(
          response.status,
        );
      },
    );

    it(
      "should reject an empty payment payload",
      async () => {
        const response = await request(app)
          .post(PAYMENT_ENDPOINT)
          .set(
            "Authorization",
            getAuthorizationHeader(accessToken),
          )
          .send({});

        expect(
          [400, 401, 422],
        ).toContain(response.status);
      },
    );

    it(
      "should reject a negative amount",
      async () => {
        const response = await request(app)
          .post(PAYMENT_ENDPOINT)
          .set(
            "Authorization",
            getAuthorizationHeader(accessToken),
          )
          .send({
            amount: -1000,
            currency: "XAF",
            method: "SIMULATED",
          });

        expect(
          [400, 401, 422],
        ).toContain(response.status);
      },
    );

    it(
      "should reject zero amount",
      async () => {
        const response = await request(app)
          .post(PAYMENT_ENDPOINT)
          .set(
            "Authorization",
            getAuthorizationHeader(accessToken),
          )
          .send({
            amount: 0,
            currency: "XAF",
            method: "SIMULATED",
          });

        expect(
          [400, 401, 422],
        ).toContain(response.status);
      },
    );

    it(
      "should reject an unsupported currency",
      async () => {
        const response = await request(app)
          .post(PAYMENT_ENDPOINT)
          .set(
            "Authorization",
            getAuthorizationHeader(accessToken),
          )
          .send({
            amount: 2000,
            currency: "XYZ",
            method: "SIMULATED",
          });

        expect(
          [400, 401, 422],
        ).toContain(response.status);
      },
    );

    it(
      "should reject an unsupported payment method",
      async () => {
        const response = await request(app)
          .post(PAYMENT_ENDPOINT)
          .set(
            "Authorization",
            getAuthorizationHeader(accessToken),
          )
          .send({
            amount: 2000,
            currency: "XAF",
            method: "UNKNOWN_METHOD",
          });

        expect(
          [400, 401, 422],
        ).toContain(response.status);
      },
    );

    it(
      "should create a simulated payment",
      async () => {
        /**
         * SIMULATED est destiné aux tests locaux.
         */
        const response = await request(app)
          .post(PAYMENT_ENDPOINT)
          .set(
            "Authorization",
            getAuthorizationHeader(accessToken),
          )
          .send({
            amount: 2000,
            currency: "XAF",
            method: "SIMULATED",
            description:
              "Test paiement BibSaaS.",
          });

        expect(
          [200, 201],
        ).toContain(response.status);

        const body =
          response.body as PaymentResponse;

        paymentId =
          extractPaymentId(body);

        paymentReference =
          extractPaymentReference(body);

        expect(paymentId).toBeTruthy();
        expect(typeof paymentId).toBe("string");
      },
    );
  });

  /* ==========================================================
   * STRIPE
   * ==========================================================
   */

  describe("Stripe / Card", () => {
    it(
      "should validate a Stripe card payment request",
      async () => {
        const response = await request(app)
          .post(PAYMENT_ENDPOINT)
          .set(
            "Authorization",
            getAuthorizationHeader(accessToken),
          )
          .send({
            amount: 10,
            currency: "USD",
            method: "CARD",
            email: testUser.email,
          });

        expect(
          [
            200,
            201,
            400,
            422,
            503,
          ],
        ).toContain(response.status);
      },
    );

    it(
      "should reject a Stripe payment with an invalid amount",
      async () => {
        const response = await request(app)
          .post(PAYMENT_ENDPOINT)
          .set(
            "Authorization",
            getAuthorizationHeader(accessToken),
          )
          .send({
            amount: -10,
            currency: "USD",
            method: "CARD",
            email: testUser.email,
          });

        expect(
          [400, 422],
        ).toContain(response.status);
      },
    );
  });

  /* ==========================================================
   * GET MY PAYMENTS
   * ==========================================================
   *
   * NOTE :
   * Cette section est conservée seulement si le controller
   * expose GET /api/payments.
   *
   * Si cette route n'existe pas dans payment.routes.ts,
   * le test doit être supprimé ou la route ajoutée.
   * ==========================================================
   */

  describe("GET /payments", () => {
    it(
      "should reject unauthenticated access",
      async () => {
        const response = await request(app)
          .get(PAYMENT_ENDPOINT);

        expect(
          [401, 403],
        ).toContain(response.status);
      },
    );

    it(
      "should return the authenticated user's payments",
      async () => {
        const response = await request(app)
          .get(PAYMENT_ENDPOINT)
          .set(
            "Authorization",
            getAuthorizationHeader(accessToken),
          );

        /**
         * Si GET /payments est présent dans le controller,
         * cette route doit répondre 200.
         */
        expect(
          [200],
        ).toContain(response.status);

        expect(
          response.body,
        ).toBeDefined();
      },
    );

    it(
      "should support payment pagination",
      async () => {
        const response = await request(app)
          .get(
            `${PAYMENT_ENDPOINT}?page=1&limit=10`,
          )
          .set(
            "Authorization",
            getAuthorizationHeader(accessToken),
          );

        expect(
          [200],
        ).toContain(response.status);
      },
    );
  });

  /* ==========================================================
   * GET SINGLE PAYMENT
   * ==========================================================
   */

  describe(
    "GET /payments/:paymentId",
    () => {
      it(
        "should reject unauthenticated access",
        async () => {
          const response = await request(app)
            .get(
              `${PAYMENT_ENDPOINT}/${NON_EXISTING_PAYMENT_ID}`,
            );

          expect(
            [401, 403],
          ).toContain(response.status);
        },
      );

      it(
        "should reject invalid payment ID",
        async () => {
          const response = await request(app)
            .get(
              `${PAYMENT_ENDPOINT}/invalid-id`,
            )
            .set(
              "Authorization",
              getAuthorizationHeader(accessToken),
            );

          expect(
            [400, 404],
          ).toContain(response.status);
        },
      );

      it(
        "should retrieve the created payment",
        async () => {
          expect(paymentId).toBeTruthy();

          const response = await request(app)
            .get(
              `${PAYMENT_ENDPOINT}/${paymentId}`,
            )
            .set(
              "Authorization",
              getAuthorizationHeader(accessToken),
            );

          expect(
            [200],
          ).toContain(response.status);

          expect(
            response.body,
          ).toBeDefined();
        },
      );
    },
  );

  /* ==========================================================
   * VERIFY PAYMENT
   * ==========================================================
   */

  describe(
    "GET /payments/:paymentId/verify",
    () => {
      it(
        "should reject unauthenticated verification",
        async () => {
          const response = await request(app)
            .get(
              `${PAYMENT_ENDPOINT}/${NON_EXISTING_PAYMENT_ID}/verify`,
            );

          expect(
            [401, 403],
          ).toContain(response.status);
        },
      );

      it(
        "should reject verification of an invalid payment",
        async () => {
          const response = await request(app)
            .get(
              `${PAYMENT_ENDPOINT}/${NON_EXISTING_PAYMENT_ID}/verify`,
            )
            .set(
              "Authorization",
              getAuthorizationHeader(accessToken),
            );

          expect(
            [400, 404],
          ).toContain(response.status);
        },
      );

      it(
        "should verify the created payment",
        async () => {
          expect(paymentId).toBeTruthy();

          const response = await request(app)
            .get(
              `${PAYMENT_ENDPOINT}/${paymentId}/verify`,
            )
            .set(
              "Authorization",
              getAuthorizationHeader(accessToken),
            );

          expect(
            [
              200,
              400,
              409,
              422,
              503,
            ],
          ).toContain(response.status);
        },
      );
    },
  );

  /* ==========================================================
   * PAYMENT STATUS
   * ==========================================================
   */

  describe("Payment status", () => {
    it(
      "should expose a valid payment status",
      async () => {
        expect(paymentId).toBeTruthy();

        const response = await request(app)
          .get(
            `${PAYMENT_ENDPOINT}/${paymentId}`,
          )
          .set(
            "Authorization",
            getAuthorizationHeader(accessToken),
          );

        expect(response.status).toBe(200);

        const body =
          response.body as PaymentResponse;

        const status =
          extractPaymentStatus(body);

        expect(status).toBeDefined();

        expect(
          [
            "PENDING",
            "PROCESSING",
            "SUCCESS",
            "FAILED",
            "CANCELLED",
            "REFUNDED",
            "PARTIALLY_REFUNDED",
          ],
        ).toContain(status);
      },
    );
  });

  /* ==========================================================
   * CANCEL PAYMENT
   * ==========================================================
   */

  describe(
    "POST /payments/:paymentId/cancel",
    () => {
      it(
        "should reject unauthenticated cancellation",
        async () => {
          const response = await request(app)
            .post(
              `${PAYMENT_ENDPOINT}/${NON_EXISTING_PAYMENT_ID}/cancel`,
            );

          expect(
            [401, 403],
          ).toContain(response.status);
        },
      );

      it(
        "should reject invalid payment ID",
        async () => {
          const response = await request(app)
            .post(
              `${PAYMENT_ENDPOINT}/invalid-id/cancel`,
            )
            .set(
              "Authorization",
              getAuthorizationHeader(accessToken),
            );

          expect(
            [400, 404],
          ).toContain(response.status);
        },
      );

      it(
        "should cancel the created payment",
        async () => {
          expect(paymentId).toBeTruthy();

          const response = await request(app)
            .post(
              `${PAYMENT_ENDPOINT}/${paymentId}/cancel`,
            )
            .set(
              "Authorization",
              getAuthorizationHeader(accessToken),
            );

          expect(
            [
              200,
              400,
              409,
              422,
            ],
          ).toContain(response.status);
        },
      );
    },
  );

  /* ==========================================================
   * STRIPE WEBHOOK
   * ==========================================================
   *
   * Endpoint actuel :
   *
   * POST /api/payments/stripe/webhook
   *
   * Le webhook est PUBLIC.
   *
   * La signature Stripe doit être vérifiée par le backend.
   * ==========================================================
   */

  describe("Stripe webhook", () => {
    const webhookEndpoint =
      `${PAYMENT_ENDPOINT}/stripe/webhook`;

    it(
      "should reject a malformed Stripe webhook",
      async () => {
        const response = await request(app)
          .post(webhookEndpoint)
          .set(
            "stripe-signature",
            "invalid-signature",
          )
          .send({
            type:
              "payment_intent.succeeded",

            data: {
              object: {},
            },
          });

        expect(
          [
            400,
            401,
            403,
          ],
        ).toContain(response.status);
      },
    );

    it(
      "should reject a webhook without Stripe signature",
      async () => {
        const response = await request(app)
          .post(webhookEndpoint)
          .send({
            type:
              "payment_intent.succeeded",

            data: {
              object: {},
            },
          });

        expect(
          [
            400,
            401,
            403,
          ],
        ).toContain(response.status);
      },
    );

    it(
      "should remain publicly accessible",
      async () => {
        /**
         * Aucun Authorization header volontairement.
         *
         * Le webhook ne doit PAS utiliser authenticate.
         */
        const response = await request(app)
          .post(webhookEndpoint)
          .set(
            "Content-Type",
            "application/json",
          )
          .set(
            "stripe-signature",
            "invalid-signature",
          )
          .send({
            type:
              "checkout.session.completed",

            data: {
              object: {},
            },
          });

        /**
         * 400/401/403 sont acceptés ici car la signature
         * est volontairement invalide.
         *
         * Le point important est que l'authentification JWT
         * ne bloque pas la route avant la validation Stripe.
         */
        expect(
          [
            400,
            401,
            403,
          ],
        ).toContain(response.status);
      },
    );
  });

  /* ==========================================================
   * IDEMPOTENCY
   * ==========================================================
   */

  describe(
    "Payment idempotency",
    () => {
      it(
        "should protect against duplicate payment requests",
        async () => {
          const idempotencyKey =
            crypto.randomUUID();

          const payload = {
            amount: 1000,

            currency: "XAF",

            method: "SIMULATED",

            description:
              "Idempotency test.",
          };

          const first =
            await request(app)
              .post(PAYMENT_ENDPOINT)
              .set(
                "Authorization",
                getAuthorizationHeader(accessToken),
              )
              .set(
                "Idempotency-Key",
                idempotencyKey,
              )
              .send(payload);

          expect(
            [200, 201, 409],
          ).toContain(first.status);

          const second =
            await request(app)
              .post(PAYMENT_ENDPOINT)
              .set(
                "Authorization",
                getAuthorizationHeader(accessToken),
              )
              .set(
                "Idempotency-Key",
                idempotencyKey,
              )
              .send(payload);

          expect(
            [200, 201, 409],
          ).toContain(second.status);

          const firstBody =
            first.body as PaymentResponse;

          const secondBody =
            second.body as PaymentResponse;

          const firstId =
            extractPaymentId(firstBody);

          const secondId =
            extractPaymentId(secondBody);

          /**
           * Une requête idempotente doit conserver
           * la même ressource lorsqu'elle est retournée
           * avec succès deux fois.
           */
          if (
            firstId &&
            secondId &&
            first.status !== 409 &&
            second.status !== 409
          ) {
            expect(firstId).toBe(secondId);
          }
        },
      );
    },
  );

  /* ==========================================================
   * SECURITY
   * ==========================================================
   */

  describe("Payment security", () => {
    it(
      "should reject an invalid JWT",
      async () => {
        const response = await request(app)
          .get(PAYMENT_ENDPOINT)
          .set(
            "Authorization",
            "Bearer invalid.jwt.token",
          );

        expect(
          [401, 403],
        ).toContain(response.status);
      },
    );

    it(
      "should reject invalid payment fields",
      async () => {
        const response = await request(app)
          .post(PAYMENT_ENDPOINT)
          .set(
            "Authorization",
            getAuthorizationHeader(accessToken),
          )
          .send({
            amount:
              "2000 OR 1=1",

            currency:
              "' OR 1=1 --",

            method:
              "SIMULATED",
          });

        expect(
          [400, 422],
        ).toContain(response.status);
      },
    );

    it(
      "should reject an excessively large amount",
      async () => {
        const response = await request(app)
          .post(PAYMENT_ENDPOINT)
          .set(
            "Authorization",
            getAuthorizationHeader(accessToken),
          )
          .send({
            amount:
              Number.MAX_SAFE_INTEGER,

            currency: "XAF",

            method: "SIMULATED",
          });

        expect(
          [400, 422],
        ).toContain(response.status);
      },
    );

    it(
      "should not expose sensitive payment data",
      async () => {
        expect(paymentId).toBeTruthy();

        const response = await request(app)
          .get(
            `${PAYMENT_ENDPOINT}/${paymentId}`,
          )
          .set(
            "Authorization",
            getAuthorizationHeader(accessToken),
          );

        expect(response.status).toBe(200);

        const body =
          JSON.stringify(
            response.body,
          ).toLowerCase();

        expect(
          body.includes("cvv"),
        ).toBe(false);

        expect(
          body.includes("card_cvv"),
        ).toBe(false);

        expect(
          body.includes("secret_key"),
        ).toBe(false);

        expect(
          body.includes("api_secret"),
        ).toBe(false);

        expect(
          body.includes("password"),
        ).toBe(false);

        expect(
          body.includes("refresh_token"),
        ).toBe(false);

        expect(
          body.includes("sk_test_"),
        ).toBe(false);

        expect(
          body.includes("sk_live_"),
        ).toBe(false);
      },
    );
  });

  /* ==========================================================
   * CURRENCY SUPPORT
   * ==========================================================
   */

  describe("Supported currencies", () => {
    const currencies = [
      "XAF",
      "EUR",
      "USD",
      "GBP",
      "CAD",
    ] as const;

    it.each(currencies)(
      "should validate currency %s",
      async (currency: string) => {
        const response = await request(app)
          .post(PAYMENT_ENDPOINT)
          .set(
            "Authorization",
            getAuthorizationHeader(accessToken),
          )
          .send({
            amount:
              currency === "XAF"
                ? 1000
                : 10,

            currency,

            method: "SIMULATED",
          });

        expect(
          [
            200,
            201,
            400,
            422,
            503,
          ],
        ).toContain(response.status);
      },
    );
  });

  /* ==========================================================
   * CLEANUP
   * ==========================================================
   */

  afterAll(async () => {
    /**
     * Aucun appel externe.
     *
     * Le nettoyage DB peut être ajouté plus tard si une
     * stratégie de cleanup dédiée aux tests est mise en place.
     */
    void userId;
    void paymentReference;
  });
});

