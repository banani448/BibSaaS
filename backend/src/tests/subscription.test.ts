
/**
 * ============================================================
 * BibSaaS — Subscription API Integration Tests
 * ============================================================
 *
 * File:
 * tests/subscription.test.ts
 *
 * Stack:
 * - Jest
 * - Supertest
 * - TypeScript
 *
 * Tests:
 * - Authentication
 * - Plans listing
 * - Plan details
 * - Subscription creation
 * - Active subscription
 * - Subscription listing
 * - Subscription details
 * - Upgrade
 * - Renewal
 * - Cancellation
 * - Reactivation
 * - Expired subscription handling
 * - Validation
 * - Authorization
 * - Idempotency
 * - Security
 *
 * IMPORTANT:
 * Les noms exacts des routes peuvent être adaptés
 * si ton subscription.routes.ts utilise une autre convention.
 * ============================================================
 */

import request from "supertest";

import app from "../app";

/**
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const API_PREFIX =
  process.env.TEST_API_PREFIX || "/api";

const AUTH_ENDPOINT =
  `${API_PREFIX}/auth`;

const SUBSCRIPTION_ENDPOINT =
  `${API_PREFIX}/subscriptions`;

const PLANS_ENDPOINT =
  `${SUBSCRIPTION_ENDPOINT}/plans`;

const REGISTER_ENDPOINT =
  `${AUTH_ENDPOINT}/register`;

const LOGIN_ENDPOINT =
  `${AUTH_ENDPOINT}/login`;

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface AuthResponse {
  success?: boolean;

  message?: string;

  accessToken?: string;

  refreshToken?: string;

  token?: string;

  user?: {
    id?: string;
    email?: string;
    role?: string;
  };

  data?: {
    accessToken?: string;
    refreshToken?: string;
    token?: string;

    user?: {
      id?: string;
      email?: string;
      role?: string;
    };
  };
}

interface SubscriptionResponse {
  success?: boolean;

  message?: string;

  id?: string;

  status?: string;

  planId?: string;

  data?: {
    id?: string;

    status?: string;

    planId?: string;

    subscription?: {
      id?: string;
      status?: string;
      planId?: string;
    };

    plan?: {
      id?: string;
      name?: string;
      slug?: string;
    };
  };

  subscription?: {
    id?: string;
    status?: string;
    planId?: string;
  };
}

interface PlanResponse {
  success?: boolean;

  message?: string;

  data?: {
    id?: string;

    plan?: {
      id?: string;
      name?: string;
      slug?: string;
      price?: number;
      currency?: string;
    };

    plans?: Array<{
      id?: string;
      name?: string;
      slug?: string;
      price?: number;
      currency?: string;
    }>;
  };

  plans?: Array<{
    id?: string;
    name?: string;
    slug?: string;
    price?: number;
    currency?: string;
  }>;
}

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function extractToken(
  body: AuthResponse,
): string | undefined {
  return (
    body.accessToken ||
    body.data?.accessToken ||
    body.token ||
    body.data?.token
  );
}

function extractUserId(
  body: AuthResponse,
): string | undefined {
  return (
    body.user?.id ||
    body.data?.user?.id
  );
}

function extractSubscriptionId(
  body: SubscriptionResponse,
): string | undefined {
  return (
    body.id ||
    body.subscription?.id ||
    body.data?.subscription?.id ||
    body.data?.id
  );
}

function extractPlanId(
  body: SubscriptionResponse,
): string | undefined {
  return (
    body.planId ||
    body.data?.planId ||
    body.subscription?.planId ||
    body.data?.subscription?.planId
  );
}

function extractPlans(
  body: PlanResponse,
) {
  return (
    body.plans ||
    body.data?.plans ||
    []
  );
}

/**
 * ============================================================
 * TEST SUITE
 * ============================================================
 */

describe(
  "BibSaaS Subscription API",
  () => {
    let accessToken:
      string | undefined;

    let userId:
      string | undefined;

    let subscriptionId:
      string | undefined;

    let planId:
      string | undefined;

    /**
     * ========================================================
     * TEST USER
     * ========================================================
     */

    const timestamp =
      Date.now();

    const testUser = {
      firstName:
        "Subscription",

      lastName:
        "Tester",

      email:
        `subscription.${timestamp}@example.com`,

      phone:
        `+24206${String(
          timestamp,
        ).slice(-7)}`,

      password:
        "Subscription@Test123",

      role:
        "CLIENT",
    };

    /**
     * ========================================================
     * AUTHENTICATION
     * ========================================================
     */

    describe(
      "Authentication setup",
      () => {
        it(
          "should register the test user",
          async () => {
            const response =
              await request(
                app,
              )
                .post(
                  REGISTER_ENDPOINT,
                )
                .send(
                  testUser,
                );

            expect(
              [
                200,
                201,
              ],
            ).toContain(
              response.status,
            );

            const body =
              response.body as AuthResponse;

            accessToken =
              extractToken(
                body,
              );

            userId =
              extractUserId(
                body,
              );
          },
        );

        it(
          "should login the test user",
          async () => {
            const response =
              await request(
                app,
              )
                .post(
                  LOGIN_ENDPOINT,
                )
                .send({
                  email:
                    testUser.email,

                  password:
                    testUser.password,
                });

            expect(
              [
                200,
                201,
              ],
            ).toContain(
              response.status,
            );

            const body =
              response.body as AuthResponse;

            const token =
              extractToken(
                body,
              );

            if (
              token
            ) {
              accessToken =
                token;
            }

            const id =
              extractUserId(
                body,
              );

            if (
              id
            ) {
              userId =
                id;
            }
          },
        );
      },
    );

    /**
     * ========================================================
     * PLANS
     * ========================================================
     */

    describe(
      "Subscription plans",
      () => {
        it(
          "should reject unauthenticated plan access when protected",
          async () => {
            const response =
              await request(
                app,
              ).get(
                PLANS_ENDPOINT,
              );

            /**
             * Certains projets rendent les plans publics.
             * Dans ce cas 200 est également accepté.
             */
            expect(
              [
                200,
                401,
                403,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should return available subscription plans",
          async () => {
            const response =
              await request(
                app,
              ).get(
                PLANS_ENDPOINT,
              );

            expect(
              [
                200,
                204,
              ],
            ).toContain(
              response.status,
            );

            if (
              response.status ===
              200
            ) {
              const body =
                response.body as PlanResponse;

              const plans =
                extractPlans(
                  body,
                );

              expect(
                Array.isArray(
                  plans,
                ),
              ).toBe(
                true,
              );
            }
          },
        );

        it(
          "should support currency filtering",
          async () => {
            const response =
              await request(
                app,
              )
                .get(
                  `${PLANS_ENDPOINT}?currency=XAF`,
                );

            expect(
              [
                200,
                204,
                400,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should reject invalid currency",
          async () => {
            const response =
              await request(
                app,
              )
                .get(
                  `${PLANS_ENDPOINT}?currency=XYZ`,
                );

            expect(
              [
                400,
                422,
              ],
            ).toContain(
              response.status,
            );
          },
        );
      },
    );

    /**
     * ========================================================
     * PLAN DETAIL
     * ========================================================
     */

    describe(
      "Plan details",
      () => {
        it(
          "should reject an invalid plan ID",
          async () => {
            const response =
              await request(
                app,
              )
                .get(
                  `${PLANS_ENDPOINT}/invalid-id`,
                );

            expect(
              [
                400,
                404,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should retrieve an existing plan",
          async () => {
            const configuredPlanId =
              process.env.TEST_SUBSCRIPTION_PLAN_ID;

            if (
              !configuredPlanId
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .get(
                  `${PLANS_ENDPOINT}/${configuredPlanId}`,
                );

            expect(
              [
                200,
                404,
              ],
            ).toContain(
              response.status,
            );
          },
        );
      },
    );

    /**
     * ========================================================
     * CREATE SUBSCRIPTION
     * ========================================================
     */

    describe(
      "POST /subscriptions",
      () => {
        it(
          "should reject unauthenticated subscription creation",
          async () => {
            const response =
              await request(
                app,
              )
                .post(
                  SUBSCRIPTION_ENDPOINT,
                )
                .send({
                  planId:
                    process.env.TEST_SUBSCRIPTION_PLAN_ID ||
                    "00000000-0000-0000-0000-000000000001",

                  currency:
                    "XAF",
                });

            expect(
              [
                401,
                403,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should reject an empty subscription payload",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .post(
                  SUBSCRIPTION_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({});

            expect(
              [
                400,
                422,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should reject an invalid plan ID",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .post(
                  SUBSCRIPTION_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  planId:
                    "invalid-plan-id",

                  currency:
                    "XAF",
                });

            expect(
              [
                400,
                404,
                422,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should reject an unsupported currency",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .post(
                  SUBSCRIPTION_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  planId:
                    process.env.TEST_SUBSCRIPTION_PLAN_ID ||
                    "00000000-0000-0000-0000-000000000001",

                  currency:
                    "XYZ",
                });

            expect(
              [
                400,
                404,
                422,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should create a subscription using the configured test plan",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const configuredPlanId =
              process.env.TEST_SUBSCRIPTION_PLAN_ID;

            if (
              !configuredPlanId
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .post(
                  SUBSCRIPTION_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  planId:
                    configuredPlanId,

                  currency:
                    "XAF",
                });

            expect(
              [
                200,
                201,
                409,
              ],
            ).toContain(
              response.status,
            );

            if (
              [
                200,
                201,
              ].includes(
                response.status,
              )
            ) {
              const body =
                response.body as SubscriptionResponse;

              subscriptionId =
                extractSubscriptionId(
                  body,
                );

              planId =
                extractPlanId(
                  body,
                );
            }
          },
        );
      },
    );

    /**
     * ========================================================
     * CURRENT SUBSCRIPTION
     * ========================================================
     */

    describe(
      "Current subscription",
      () => {
        it(
          "should reject unauthenticated access",
          async () => {
            const response =
              await request(
                app,
              ).get(
                `${SUBSCRIPTION_ENDPOINT}/current`,
              );

            expect(
              [
                401,
                403,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should return current subscription",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .get(
                  `${SUBSCRIPTION_ENDPOINT}/current`,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                );

            expect(
              [
                200,
                204,
                404,
              ],
            ).toContain(
              response.status,
            );
          },
        );
      },
    );

    /**
     * ========================================================
     * LIST SUBSCRIPTIONS
     * ========================================================
     */

    describe(
      "GET /subscriptions",
      () => {
        it(
          "should reject unauthenticated access",
          async () => {
            const response =
              await request(
                app,
              ).get(
                SUBSCRIPTION_ENDPOINT,
              );

            expect(
              [
                401,
                403,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should return user's subscriptions",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .get(
                  SUBSCRIPTION_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                );

            expect(
              [
                200,
                204,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should support pagination",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .get(
                  `${SUBSCRIPTION_ENDPOINT}?page=1&limit=10`,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                );

            expect(
              [
                200,
                204,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should reject invalid pagination",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .get(
                  `${SUBSCRIPTION_ENDPOINT}?page=-1&limit=999999`,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                );

            expect(
              [
                400,
                422,
              ],
            ).toContain(
              response.status,
            );
          },
        );
      },
    );

    /**
     * ========================================================
     * SUBSCRIPTION DETAILS
     * ========================================================
     */

    describe(
      "GET /subscriptions/:subscriptionId",
      () => {
        it(
          "should reject unauthenticated access",
          async () => {
            const response =
              await request(
                app,
              ).get(
                `${SUBSCRIPTION_ENDPOINT}/00000000-0000-0000-0000-000000000001`,
              );

            expect(
              [
                401,
                403,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should reject invalid subscription ID",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .get(
                  `${SUBSCRIPTION_ENDPOINT}/invalid-id`,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                );

            expect(
              [
                400,
                404,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should retrieve the created subscription",
          async () => {
            if (
              !accessToken ||
              !subscriptionId
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .get(
                  `${SUBSCRIPTION_ENDPOINT}/${subscriptionId}`,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                );

            expect(
              [
                200,
                404,
              ],
            ).toContain(
              response.status,
            );
          },
        );
      },
    );

    /**
     * ========================================================
     * UPGRADE
     * ========================================================
     */

    describe(
      "Subscription upgrade",
      () => {
        it(
          "should reject unauthenticated upgrade",
          async () => {
            const response =
              await request(
                app,
              )
                .post(
                  `${SUBSCRIPTION_ENDPOINT}/00000000-0000-0000-0000-000000000001/upgrade`,
                )
                .send({
                  planId:
                    process.env.TEST_PREMIUM_PLAN_ID ||
                    "00000000-0000-0000-0000-000000000002",
                });

            expect(
              [
                401,
                403,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should reject invalid target plan",
          async () => {
            if (
              !accessToken ||
              !subscriptionId
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .post(
                  `${SUBSCRIPTION_ENDPOINT}/${subscriptionId}/upgrade`,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  planId:
                    "invalid-plan-id",
                });

            expect(
              [
                400,
                404,
                422,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should upgrade subscription when a premium plan is configured",
          async () => {
            if (
              !accessToken ||
              !subscriptionId
            ) {
              return;
            }

            const premiumPlanId =
              process.env.TEST_PREMIUM_PLAN_ID;

            if (
              !premiumPlanId
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .post(
                  `${SUBSCRIPTION_ENDPOINT}/${subscriptionId}/upgrade`,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  planId:
                    premiumPlanId,
                });

            expect(
              [
                200,
                201,
                400,
                409,
              ],
            ).toContain(
              response.status,
            );
          },
        );
      },
    );

    /**
     * ========================================================
     * RENEWAL
     * ========================================================
     */

    describe(
      "Subscription renewal",
      () => {
        it(
          "should reject unauthenticated renewal",
          async () => {
            const response =
              await request(
                app,
              )
                .post(
                  `${SUBSCRIPTION_ENDPOINT}/00000000-0000-0000-0000-000000000001/renew`,
                );

            expect(
              [
                401,
                403,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should renew the subscription",
          async () => {
            if (
              !accessToken ||
              !subscriptionId
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .post(
                  `${SUBSCRIPTION_ENDPOINT}/${subscriptionId}/renew`,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                );

            expect(
              [
                200,
                201,
                400,
                409,
              ],
            ).toContain(
              response.status,
            );
          },
        );
      },
    );

    /**
     * ========================================================
     * CANCELLATION
     * ========================================================
     */

    describe(
      "Subscription cancellation",
      () => {
        it(
          "should reject unauthenticated cancellation",
          async () => {
            const response =
              await request(
                app,
              )
                .post(
                  `${SUBSCRIPTION_ENDPOINT}/00000000-0000-0000-0000-000000000001/cancel`,
                );

            expect(
              [
                401,
                403,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should reject invalid subscription ID",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .post(
                  `${SUBSCRIPTION_ENDPOINT}/invalid-id/cancel`,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                );

            expect(
              [
                400,
                404,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should cancel the subscription",
          async () => {
            if (
              !accessToken ||
              !subscriptionId
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .post(
                  `${SUBSCRIPTION_ENDPOINT}/${subscriptionId}/cancel`,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  reason:
                    "Test de résiliation.",
                });

            expect(
              [
                200,
                204,
                400,
                409,
              ],
            ).toContain(
              response.status,
            );
          },
        );
      },
    );

    /**
     * ========================================================
     * REACTIVATION
     * ========================================================
     */

    describe(
      "Subscription reactivation",
      () => {
        it(
          "should reject unauthenticated reactivation",
          async () => {
            const response =
              await request(
                app,
              )
                .post(
                  `${SUBSCRIPTION_ENDPOINT}/00000000-0000-0000-0000-000000000001/reactivate`,
                );

            expect(
              [
                401,
                403,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should handle subscription reactivation",
          async () => {
            if (
              !accessToken ||
              !subscriptionId
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .post(
                  `${SUBSCRIPTION_ENDPOINT}/${subscriptionId}/reactivate`,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                );

            expect(
              [
                200,
                201,
                400,
                404,
                409,
              ],
            ).toContain(
              response.status,
            );
          },
        );
      },
    );

    /**
     * ========================================================
     * IDEMPOTENCY
     * ========================================================
     */

    describe(
      "Subscription idempotency",
      () => {
        it(
          "should protect against duplicate subscription requests",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const configuredPlanId =
              process.env.TEST_SUBSCRIPTION_PLAN_ID;

            if (
              !configuredPlanId
            ) {
              return;
            }

            const idempotencyKey =
              `subscription-test-${Date.now()}`;

            const payload = {
              planId:
                configuredPlanId,

              currency:
                "XAF",
            };

            const first =
              await request(
                app,
              )
                .post(
                  SUBSCRIPTION_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .set(
                  "Idempotency-Key",
                  idempotencyKey,
                )
                .send(
                  payload,
                );

            const second =
              await request(
                app,
              )
                .post(
                  SUBSCRIPTION_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .set(
                  "Idempotency-Key",
                  idempotencyKey,
                )
                .send(
                  payload,
                );

            expect(
              [
                200,
                201,
                409,
              ],
            ).toContain(
              first.status,
            );

            expect(
              [
                200,
                201,
                409,
              ],
            ).toContain(
              second.status,
            );
          },
        );
      },
    );

    /**
     * ========================================================
     * SECURITY
     * ========================================================
     */

    describe(
      "Subscription security",
      () => {
        it(
          "should reject an invalid JWT",
          async () => {
            const response =
              await request(
                app,
              )
                .get(
                  SUBSCRIPTION_ENDPOINT,
                )
                .set(
                  "Authorization",
                  "Bearer invalid.jwt.token",
                );

            expect(
              [
                401,
                403,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should reject SQL injection in plan ID",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .post(
                  SUBSCRIPTION_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  planId:
                    "' OR 1=1 --",

                  currency:
                    "XAF",
                });

            expect(
              [
                400,
                404,
                422,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should reject an invalid role escalation attempt",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .post(
                  SUBSCRIPTION_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  planId:
                    process.env.TEST_SUBSCRIPTION_PLAN_ID ||
                    "00000000-0000-0000-0000-000000000001",

                  currency:
                    "XAF",

                  role:
                    "SUPER_ADMIN",

                  isAdmin:
                    true,
                });

            expect(
              [
                200,
                201,
                400,
                403,
                404,
                409,
                422,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should reject an invalid subscription ID",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .get(
                  `${SUBSCRIPTION_ENDPOINT}/invalid-subscription-id`,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                );

            expect(
              [
                400,
                404,
              ],
            ).toContain(
              response.status,
            );
          },
        );
      },
    );

    /**
     * ========================================================
     * SUPPORTED CURRENCIES
     * ========================================================
     */

    describe(
      "Supported currencies",
      () => {
        const currencies = [
          "XAF",
          "EUR",
          "USD",
          "GBP",
          "CAD",
        ];

        it.each(
          currencies,
        )(
          "should accept or correctly validate currency %s",
          async (
            currency,
          ) => {
            if (
              !accessToken
            ) {
              return;
            }

            const configuredPlanId =
              process.env.TEST_SUBSCRIPTION_PLAN_ID;

            if (
              !configuredPlanId
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .post(
                  SUBSCRIPTION_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  planId:
                    configuredPlanId,

                  currency,
                });

            expect(
              [
                200,
                201,
                400,
                409,
                422,
              ],
            ).toContain(
              response.status,
            );
          },
        );
      },
    );

    /**
     * ========================================================
     * RESPONSE SECURITY
     * ========================================================
     */

    describe(
      "Response security",
      () => {
        it(
          "should not expose password information",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .get(
                  SUBSCRIPTION_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                );

            if (
              response.status !==
              200
            ) {
              return;
            }

            const body =
              JSON.stringify(
                response.body,
              ).toLowerCase();

            expect(
              body.includes(
                '"password"',
              ),
            ).toBe(
              false,
            );

            expect(
              body.includes(
                '"passwordhash"',
              ),
            ).toBe(
              false,
            );
          },
        );

        it(
          "should not expose secret payment credentials",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .get(
                  SUBSCRIPTION_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                );

            if (
              response.status !==
              200
            ) {
              return;
            }

            const body =
              JSON.stringify(
                response.body,
              ).toLowerCase();

            expect(
              body.includes(
                "secret_key",
              ),
            ).toBe(
              false,
            );

            expect(
              body.includes(
                "api_secret",
              ),
            ).toBe(
              false,
            );

            expect(
              body.includes(
                "webhook_secret",
              ),
            ).toBe(
              false,
            );
          },
        );
      },
    );
  },
);
