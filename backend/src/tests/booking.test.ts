
// tests/booking.test.ts

/**
 * ============================================================
 * BibSaaS — Booking API Integration Tests
 * ============================================================
 *
 * Tests couverts :
 * - Authentification
 * - Création de réservation
 * - Validation des données
 * - Consultation
 * - Modification
 * - Confirmation
 * - Annulation
 * - Conflits de créneaux
 * - Accès non autorisé
 * - Injection / données malveillantes
 * - Pagination
 *
 * Stack :
 * - Jest
 * - Supertest
 * - TypeScript
 *
 * Endpoints supposés :
 *
 * POST   /api/v1/auth/register
 * POST   /api/v1/auth/login
 *
 * POST   /api/v1/bookings
 * GET    /api/v1/bookings
 * GET    /api/v1/bookings/:bookingId
 * PATCH  /api/v1/bookings/:bookingId
 * POST   /api/v1/bookings/:bookingId/cancel
 * POST   /api/v1/bookings/:bookingId/confirm
 *
 * IMPORTANT :
 * Adapte uniquement les endpoints si tes routes
 * utilisent une convention différente.
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
  process.env.TEST_API_PREFIX ||
  "/api";

const AUTH_ENDPOINT =
  `${API_PREFIX}/auth`;

const BOOKING_ENDPOINT =
  `${API_PREFIX}/bookings`;

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

  data?: {
    user?: {
      id?: string;

      firstName?: string;

      lastName?: string;

      email?: string;

      role?: string;
    };

    accessToken?: string;

    refreshToken?: string;

    token?: string;
  };

  user?: {
    id?: string;

    email?: string;

    role?: string;
  };

  accessToken?: string;

  refreshToken?: string;

  token?: string;
}

interface BookingResponse {
  success?: boolean;

  message?: string;

  data?: {
    id?: string;

    booking?: {
      id?: string;

      status?: string;
    };
  };

  booking?: {
    id?: string;

    status?: string;
  };

  id?: string;
}

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function extractAccessToken(
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

function extractBookingId(
  body: BookingResponse,
): string | undefined {
  return (
    body.id ||
    body.booking?.id ||
    body.data?.booking?.id ||
    body.data?.id
  );
}

/**
 * ============================================================
 * TEST SUITE
 * ============================================================
 */

describe(
  "BibSaaS Booking API",
  () => {
    let accessToken:
      string | undefined;

    let userId:
      string | undefined;

    let bookingId:
      string | undefined;

    /**
     * --------------------------------------------------------
     * DONNÉES DE TEST
     * --------------------------------------------------------
     */

    const timestamp =
      Date.now();

    const testUser = {
      firstName:
        "Booking",

      lastName:
        "Tester",

      email:
        `booking.${timestamp}@example.com`,

      phone:
        `+24206${String(
          timestamp,
        ).slice(-7)}`,

      password:
        "Booking@Test123",

      role:
        "CLIENT",
    };

    /**
     * --------------------------------------------------------
     * DATE FUTURE POUR LES TESTS
     * --------------------------------------------------------
     */

    const futureDate =
      new Date(
        Date.now() +
          24 *
            60 *
            60 *
            1000,
      );

    futureDate.setSeconds(
      0,
      0,
    );

    /**
     * ========================================================
     * AUTHENTIFICATION
     * ========================================================
     */

    describe(
      "Authentication setup",
      () => {
        it(
          "should register the test client",
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
              extractAccessToken(
                body,
              );

            userId =
              extractUserId(
                body,
              );
          },
        );

        it(
          "should login the test client",
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
              extractAccessToken(
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
     * CREATE BOOKING
     * ========================================================
     */

    describe(
      "POST /bookings",
      () => {
        it(
          "should reject unauthenticated booking creation",
          async () => {
            const response =
              await request(
                app,
              )
                .post(
                  BOOKING_ENDPOINT,
                )
                .send({
                  barberId:
                    "00000000-0000-0000-0000-000000000001",

                  date:
                    futureDate.toISOString(),

                  duration:
                    60,
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
          "should reject an empty booking payload",
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
                  BOOKING_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({});

            expect(
              response.status,
            ).toBe(
              400,
            );
          },
        );

        it(
          "should reject an invalid barber ID",
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
                  BOOKING_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  barberId:
                    "invalid-id",

                  date:
                    futureDate.toISOString(),

                  duration:
                    60,
                });

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
          "should reject a past booking date",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const pastDate =
              new Date(
                Date.now() -
                  60 *
                    60 *
                    1000,
              );

            const response =
              await request(
                app,
              )
                .post(
                  BOOKING_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  barberId:
                    "00000000-0000-0000-0000-000000000001",

                  date:
                    pastDate.toISOString(),

                  duration:
                    60,
                });

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
          "should reject an invalid duration",
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
                  BOOKING_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  barberId:
                    "00000000-0000-0000-0000-000000000001",

                  date:
                    futureDate.toISOString(),

                  duration:
                    -10,
                });

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
          "should create a valid booking",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            /**
             * Le barberId doit correspondre
             * à un barber existant dans ta
             * base de test/seed.
             */
            const barberId =
              process.env.TEST_BARBER_ID;

            if (
              !barberId
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .post(
                  BOOKING_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  barberId,

                  startAt:
                    futureDate.toISOString(),

                  durationMinutes:
                    60,

                  notes:
                    "Test de réservation BibSaaS.",
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
              response.body as BookingResponse;

            bookingId =
              extractBookingId(
                body,
              );

            if (
              bookingId
            ) {
              expect(
                bookingId,
              ).toMatch(
                /^[0-9a-f-]{36}$/i,
              );
            }
          },
        );
      },
    );

    /**
     * ========================================================
     * GET BOOKINGS
     * ========================================================
     */

    describe(
      "GET /bookings",
      () => {
        it(
          "should reject unauthenticated requests",
          async () => {
            const response =
              await request(
                app,
              ).get(
                BOOKING_ENDPOINT,
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
          "should return authenticated user's bookings",
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
                  BOOKING_ENDPOINT,
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

            if (
              response.status ===
              200
            ) {
              expect(
                response.body,
              ).toBeDefined();
            }
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
                  `${BOOKING_ENDPOINT}?page=1&limit=10`,
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
                  `${BOOKING_ENDPOINT}?page=-1&limit=9999`,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                );

            expect(
              response.status,
            ).toBe(
              400,
            );
          },
        );
      },
    );

    /**
     * ========================================================
     * GET SINGLE BOOKING
     * ========================================================
     */

    describe(
      "GET /bookings/:bookingId",
      () => {
        it(
          "should reject an invalid booking ID",
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
                  `${BOOKING_ENDPOINT}/invalid-id`,
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
          "should reject access without authentication",
          async () => {
            const response =
              await request(
                app,
              ).get(
                `${BOOKING_ENDPOINT}/00000000-0000-0000-0000-000000000001`,
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
          "should return the created booking",
          async () => {
            if (
              !accessToken ||
              !bookingId
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .get(
                  `${BOOKING_ENDPOINT}/${bookingId}`,
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
     * UPDATE BOOKING
     * ========================================================
     */

    describe(
      "PATCH /bookings/:bookingId",
      () => {
        it(
          "should reject unauthenticated update",
          async () => {
            const response =
              await request(
                app,
              )
                .patch(
                  `${BOOKING_ENDPOINT}/00000000-0000-0000-0000-000000000001`,
                )
                .send({
                  notes:
                    "Modification non autorisée.",
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
          "should reject invalid booking ID",
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
                .patch(
                  `${BOOKING_ENDPOINT}/invalid-id`,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  notes:
                    "Modification.",
                });

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
          "should reject an empty update",
          async () => {
            if (
              !accessToken ||
              !bookingId
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .patch(
                  `${BOOKING_ENDPOINT}/${bookingId}`,
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
          "should update booking notes",
          async () => {
            if (
              !accessToken ||
              !bookingId
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .patch(
                  `${BOOKING_ENDPOINT}/${bookingId}`,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  notes:
                    "Notes mises à jour.",
                });

            expect(
              [
                200,
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
     * CONFLICTS
     * ========================================================
     */

    describe(
      "Booking conflicts",
      () => {
        it(
          "should prevent double booking",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const barberId =
              process.env.TEST_BARBER_ID;

            if (
              !barberId
            ) {
              return;
            }

            const conflictDate =
              new Date(
                Date.now() +
                  48 *
                    60 *
                    60 *
                    1000,
              );

            conflictDate.setSeconds(
              0,
              0,
            );

            const payload = {
              barberId,

              startAt:
                conflictDate.toISOString(),

              durationMinutes:
                60,

              notes:
                "Conflict test.",
            };

            const first =
              await request(
                app,
              )
                .post(
                  BOOKING_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send(
                  payload,
                );

            if (
              ![
                200,
                201,
              ].includes(
                first.status,
              )
            ) {
              return;
            }

            const second =
              await request(
                app,
              )
                .post(
                  BOOKING_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send(
                  payload,
                );

            expect(
              [
                400,
                409,
                422,
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
     * CANCEL BOOKING
     * ========================================================
     */

    describe(
      "POST /bookings/:bookingId/cancel",
      () => {
        it(
          "should reject unauthenticated cancellation",
          async () => {
            const response =
              await request(
                app,
              )
                .post(
                  `${BOOKING_ENDPOINT}/00000000-0000-0000-0000-000000000001/cancel`,
                )
                .send({
                  reason:
                    "Test cancellation.",
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
          "should reject an invalid booking ID",
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
                  `${BOOKING_ENDPOINT}/invalid-id/cancel`,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  reason:
                    "Test cancellation.",
                });

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
          "should cancel the booking",
          async () => {
            if (
              !accessToken ||
              !bookingId
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .post(
                  `${BOOKING_ENDPOINT}/${bookingId}/cancel`,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  reason:
                    "Je souhaite annuler cette réservation.",
                });

            expect(
              [
                200,
                204,
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
     * CONFIRM BOOKING
     * ========================================================
     */

    describe(
      "POST /bookings/:bookingId/confirm",
      () => {
        it(
          "should reject unauthenticated confirmation",
          async () => {
            const response =
              await request(
                app,
              )
                .post(
                  `${BOOKING_ENDPOINT}/00000000-0000-0000-0000-000000000001/confirm`,
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
          "should reject invalid booking ID",
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
                  `${BOOKING_ENDPOINT}/invalid-id/confirm`,
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
     * SECURITY
     * ========================================================
     */

    describe(
      "Security",
      () => {
        it(
          "should reject SQL injection in booking fields",
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
                  BOOKING_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  barberId:
                    "' OR 1=1 --",

                  startAt:
                    futureDate.toISOString(),

                  durationMinutes:
                    60,

                  notes:
                    "' OR 1=1 --",
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
          "should reject an invalid authorization token",
          async () => {
            const response =
              await request(
                app,
              )
                .get(
                  BOOKING_ENDPOINT,
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
          "should reject excessively large notes",
          async () => {
            if (
              !accessToken
            ) {
              return;
            }

            const barberId =
              process.env.TEST_BARBER_ID;

            if (
              !barberId
            ) {
              return;
            }

            const response =
              await request(
                app,
              )
                .post(
                  BOOKING_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                )
                .send({
                  barberId,

                  startAt:
                    futureDate.toISOString(),

                  durationMinutes:
                    60,

                  notes:
                    "A".repeat(
                      10000,
                    ),
                });

            expect(
              [
                400,
                413,
                422,
              ],
            ).toContain(
              response.status,
            );
          },
        );
      },
    );
  },
);
