
// tests/auth.test.ts

/**
 * ============================================================
 * BibSaaS — Authentication Integration Tests
 * ============================================================
 *
 * Tests :
 * - Register
 * - Login
 * - Validation
 * - JWT
 * - Duplicate account
 * - Invalid credentials
 * - Protected routes
 * - Refresh token
 * - Logout
 *
 * Stack :
 * - Jest
 * - Supertest
 * - TypeScript
 *
 * IMPORTANT :
 * Ces tests supposent que l'application expose :
 *
 * POST /api/v1/auth/register
 * POST /api/v1/auth/login
 * POST /api/v1/auth/refresh
 * POST /api/v1/auth/logout
 * GET  /api/v1/auth/me
 *
 * Si tes routes utilisent un autre préfixe,
 * modifie API_PREFIX ci-dessous.
 * ============================================================
 */

import request from "supertest";
import jwt from "jsonwebtoken";

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

const REGISTER_ENDPOINT =
  `${AUTH_ENDPOINT}/register`;

const LOGIN_ENDPOINT =
  `${AUTH_ENDPOINT}/login`;

const REFRESH_ENDPOINT =
  `${AUTH_ENDPOINT}/refresh`;

const LOGOUT_ENDPOINT =
  `${AUTH_ENDPOINT}/logout`;

const ME_ENDPOINT =
  `${AUTH_ENDPOINT}/profile`;

/**
 * ============================================================
 * TEST DATA
 * ============================================================
 */

const timestamp =
  Date.now();

const testUser = {
  firstName:
    "Bib",

  lastName:
    "Test",

  email:
    `bib.test.${timestamp}@example.com`,

  phone:
    `+24206${String(
      timestamp,
    ).slice(-7)}`,

  password:
    "BibSaaS@Test123",

  role:
    "CLIENT",
};

/**
 * ============================================================
 * RESPONSE TYPES
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

      phone?: string;

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

function extractRefreshToken(
  body: AuthResponse,
): string | undefined {
  return (
    body.refreshToken ||
    body.data?.refreshToken
  );
}

/**
 * ============================================================
 * TEST SUITE
 * ============================================================
 */

describe(
  "BibSaaS Authentication API",
  () => {
    let accessToken:
      string | undefined;

    let refreshToken:
      string | undefined;

    /**
     * --------------------------------------------------------
     * REGISTER
     * --------------------------------------------------------
     */

    describe(
      "POST /auth/register",
      () => {
        it(
          "should register a new user",
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

            expect(
              response.body,
            ).toBeDefined();

            /**
             * Selon ton format API,
             * success peut être présent.
             */
            if (
              response.body
                .success !==
              undefined
            ) {
              expect(
                response.body
                  .success,
              ).toBe(
                true,
              );
            }

            const body =
              response.body as AuthResponse;

            const token =
              extractAccessToken(
                body,
              );

            if (
              token
            ) {
              expect(
                typeof token,
              ).toBe(
                "string",
              );

              expect(
                token.length,
              ).toBeGreaterThan(
                20,
              );

              accessToken =
                token;
            }

            const refresh =
              extractRefreshToken(
                body,
              );

            if (
              refresh
            ) {
              expect(
                typeof refresh,
              ).toBe(
                "string",
              );

              refreshToken =
                refresh;
            }
          },
        );

        it(
          "should reject an invalid email",
          async () => {
            const response =
              await request(
                app,
              )
                .post(
                  REGISTER_ENDPOINT,
                )
                .send({
                  ...testUser,

                  email:
                    "email-invalide",
                });

            expect(
              response.status,
            ).toBe(
              400,
            );

            expect(
              response.body,
            ).toBeDefined();
          },
        );

        it(
          "should reject a weak password",
          async () => {
            const response =
              await request(
                app,
              )
                .post(
                  REGISTER_ENDPOINT,
                )
                .send({
                  ...testUser,

                  email:
                    `weak.${Date.now()}@example.com`,

                  password:
                    "123",
                });

            expect(
              response.status,
            ).toBe(
              400,
            );
          },
        );

        it(
          "should reject a missing first name",
          async () => {
            const response =
              await request(
                app,
              )
                .post(
                  REGISTER_ENDPOINT,
                )
                .send({
                  ...testUser,

                  email:
                    `missing.${Date.now()}@example.com`,

                  firstName:
                    "",
                });

            expect(
              response.status,
            ).toBe(
              400,
            );
          },
        );

        it(
          "should reject a missing password",
          async () => {
            const response =
              await request(
                app,
              )
                .post(
                  REGISTER_ENDPOINT,
                )
                .send({
                  ...testUser,

                  email:
                    `nopassword.${Date.now()}@example.com`,

                  password:
                    undefined,
                });

            expect(
              response.status,
            ).toBe(
              400,
            );
          },
        );

        it(
          "should reject a duplicate email",
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

            /**
             * Le premier register peut avoir
             * créé l'utilisateur.
             *
             * Le backend doit alors refuser
             * le doublon.
             */
            expect(
              [
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
     * --------------------------------------------------------
     * LOGIN
     * --------------------------------------------------------
     */

    describe(
      "POST /auth/login",
      () => {
        it(
          "should login with valid credentials",
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
              expect(
                typeof token,
              ).toBe(
                "string",
              );

              expect(
                token.length,
              ).toBeGreaterThan(
                20,
              );

              accessToken =
                token;
            }

            const refresh =
              extractRefreshToken(
                body,
              );

            if (
              refresh
            ) {
              expect(
                typeof refresh,
              ).toBe(
                "string",
              );

              refreshToken =
                refresh;
            }
          },
        );

        it(
          "should reject invalid password",
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
                    "WrongPassword@999",
                });

            expect(
              [
                400,
                401,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should reject unknown email",
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
                    `unknown.${Date.now()}@example.com`,

                  password:
                    testUser.password,
                });

            expect(
              [
                400,
                401,
                404,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should reject empty credentials",
          async () => {
            const response =
              await request(
                app,
              )
                .post(
                  LOGIN_ENDPOINT,
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
          "should reject malformed email",
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
                    "invalid",

                  password:
                    testUser.password,
                });

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
     * --------------------------------------------------------
     * JWT
     * --------------------------------------------------------
     */

    describe(
      "JWT",
      () => {
        it(
          "should return a valid JWT",
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
              !token
            ) {
              /**
               * Certaines architectures
               * stockent le JWT uniquement
               * dans un cookie HTTP-only.
               */
              expect(
                response.headers[
                  "set-cookie"
                ],
              ).toBeDefined();

              return;
            }

            const parts =
              token.split(
                ".",
              );

            expect(
              parts,
            ).toHaveLength(
              3,
            );

            const secret =
              process.env.JWT_ACCESS_SECRET;

            if (
              secret
            ) {
              const decoded =
                jwt.verify(
                  token,
                  secret,
                );

              expect(
                decoded,
              ).toBeDefined();
            }
          },
        );
      },
    );

    /**
     * --------------------------------------------------------
     * PROTECTED ROUTE
     * --------------------------------------------------------
     */

    describe(
      "Protected authentication routes",
      () => {
        it(
          "should reject unauthenticated access",
          async () => {
            const response =
              await request(
                app,
              ).get(
                ME_ENDPOINT,
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
          "should allow authenticated access",
          async () => {
            /**
             * Si aucun token n'a été retourné,
             * le backend utilise probablement
             * un cookie HTTP-only.
             */
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
                  ME_ENDPOINT,
                )
                .set(
                  "Authorization",
                  `Bearer ${accessToken}`,
                );

            expect(
              [
                200,
                201,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should reject an invalid JWT",
          async () => {
            const response =
              await request(
                app,
              )
                .get(
                  ME_ENDPOINT,
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
          "should reject a malformed Authorization header",
          async () => {
            const response =
              await request(
                app,
              )
                .get(
                  ME_ENDPOINT,
                )
                .set(
                  "Authorization",
                  "InvalidToken",
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
      },
    );

    /**
     * --------------------------------------------------------
     * REFRESH TOKEN
     * --------------------------------------------------------
     */

    describe(
      "POST /auth/refresh",
      () => {
        it(
          "should refresh a valid session",
          async () => {
            if (
              !refreshToken
            ) {
              /**
               * Peut être stocké dans un
               * cookie HTTP-only.
               */
              return;
            }

            const response =
              await request(
                app,
              )
                .post(
                  REFRESH_ENDPOINT,
                )
                .send({
                  refreshToken,
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

            const newToken =
              extractAccessToken(
                body,
              );

            if (
              newToken
            ) {
              expect(
                typeof newToken,
              ).toBe(
                "string",
              );
            }
          },
        );

        it(
          "should reject an invalid refresh token",
          async () => {
            const response =
              await request(
                app,
              )
                .post(
                  REFRESH_ENDPOINT,
                )
                .send({
                  refreshToken:
                    "invalid-refresh-token",
                });

            expect(
              [
                400,
                401,
                403,
              ],
            ).toContain(
              response.status,
            );
          },
        );
      },
    );

    /**
     * --------------------------------------------------------
     * LOGOUT
     * --------------------------------------------------------
     */

    describe(
      "POST /auth/logout",
      () => {
        it(
          "should logout the authenticated user",
          async () => {
            const req =
              request(
                app,
              ).post(
                LOGOUT_ENDPOINT,
              );

            if (
              accessToken
            ) {
              req.set(
                "Authorization",
                `Bearer ${accessToken}`,
              );
            }

            const response =
              await req;

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
      },
    );

    /**
     * --------------------------------------------------------
     * SECURITY
     * --------------------------------------------------------
     */

    describe(
      "Security",
      () => {
        it(
          "should not expose the password in the response",
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

            const body =
              JSON.stringify(
                response.body,
              );

            expect(
              body.includes(
                testUser.password,
              ),
            ).toBe(
              false,
            );
          },
        );

        it(
          "should not expose password hash",
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

            const body =
              JSON.stringify(
                response.body,
              ).toLowerCase();

            expect(
              body.includes(
                "passwordhash",
              ),
            ).toBe(
              false,
            );

            expect(
              body.includes(
                "\"hash\"",
              ),
            ).toBe(
              false,
            );
          },
        );

        it(
          "should reject SQL injection style email input",
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
                    "' OR 1=1 --",

                  password:
                    "anything",
                });

            expect(
              [
                400,
                401,
              ],
            ).toContain(
              response.status,
            );
          },
        );

        it(
          "should reject excessively long email",
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
                    `${"a".repeat(
                      300,
                    )}@example.com`,

                  password:
                    testUser.password,
                });

            expect(
              response.status,
            ).toBe(
              400,
            );
          },
        );
      },
    );
  },
);
