
// src/services/orange-money.service.ts

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
} from "axios";

/**
 * ============================================================
 * ORANGE MONEY SERVICE - BibSaaS
 * ============================================================
 *
 * Service de paiement Orange Money.
 *
 * Fonctionnalités :
 * - Authentification OAuth2 / Bearer
 * - Initiation de paiement
 * - Vérification du statut
 * - Gestion des callbacks / webhooks
 * - Validation des callbacks
 * - Normalisation des numéros
 * - Gestion centralisée des erreurs
 * - Mode SIMULATED pour développement
 * - Mode SANDBOX
 * - Mode LIVE
 *
 * IMPORTANT :
 *
 * Orange Money possède plusieurs APIs et plusieurs
 * configurations selon le pays et le partenaire API.
 *
 * Les endpoints sont donc configurables dans .env.
 *
 * Variables :
 *
 * ORANGE_MONEY_ENABLED=true
 * ORANGE_MONEY_MODE=SIMULATED
 * ORANGE_MONEY_BASE_URL=
 * ORANGE_MONEY_TOKEN_URL=
 * ORANGE_MONEY_CONSUMER_KEY=
 * ORANGE_MONEY_CONSUMER_SECRET=
 * ORANGE_MONEY_MERCHANT_ID=
 * ORANGE_MONEY_CALLBACK_URL=
 * ORANGE_MONEY_CURRENCY=XAF
 * ORANGE_MONEY_TIMEOUT=30000
 *
 * ============================================================
 */

export type OrangeMoneyMode =
  | "LIVE"
  | "SANDBOX"
  | "SIMULATED";

export type OrangeMoneyTransactionStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "UNKNOWN";

/**
 * ============================================================
 * REQUEST
 * ============================================================
 */

export interface OrangeMoneyPaymentRequest {
  amount: number;

  phoneNumber: string;

  reference: string;

  description?: string;

  accountReference?: string;

  transactionDescription?: string;

  currency?: string;

  customerName?: string;

  customerEmail?: string;

  metadata?: Record<string, unknown>;
}

/**
 * ============================================================
 * PAYMENT RESPONSE
 * ============================================================
 */

export interface OrangeMoneyPaymentResponse {
  success: boolean;

  mode: OrangeMoneyMode;

  message: string;

  transactionId?: string;

  paymentId?: string;

  checkoutRequestId?: string;

  status?: OrangeMoneyTransactionStatus;

  amount?: number;

  currency?: string;

  phoneNumber?: string;

  reference?: string;

  raw?: unknown;

  error?: {
    code?: string;

    message: string;

    details?: unknown;
  };
}

/**
 * ============================================================
 * STATUS RESPONSE
 * ============================================================
 */

export interface OrangeMoneyStatusResponse {
  success: boolean;

  mode: OrangeMoneyMode;

  message: string;

  transactionId?: string;

  paymentId?: string;

  status: OrangeMoneyTransactionStatus;

  resultCode?: string;

  resultDescription?: string;

  amount?: number;

  currency?: string;

  reference?: string;

  raw?: unknown;

  error?: {
    code?: string;

    message: string;

    details?: unknown;
  };
}

/**
 * ============================================================
 * CALLBACK RESULT
 * ============================================================
 */

export interface OrangeMoneyCallbackResult {
  success: boolean;

  transactionId?: string;

  paymentId?: string;

  checkoutRequestId?: string;

  amount?: number;

  currency?: string;

  phoneNumber?: string;

  reference?: string;

  receiptNumber?: string;

  resultCode?: string;

  resultDescription?: string;

  status: OrangeMoneyTransactionStatus;

  raw: unknown;
}

/**
 * ============================================================
 * TOKEN RESPONSE
 * ============================================================
 */

interface OrangeMoneyTokenResponse {
  access_token: string;

  token_type?: string;

  expires_in?: number | string;
}

/**
 * ============================================================
 * CONFIG
 * ============================================================
 */

interface OrangeMoneyConfig {
  enabled: boolean;

  mode: OrangeMoneyMode;

  baseUrl: string;

  tokenUrl: string;

  consumerKey?: string;

  consumerSecret?: string;

  merchantId?: string;

  callbackUrl?: string;

  timeout: number;

  currency: string;
}

/**
 * ============================================================
 * CUSTOM ERROR
 * ============================================================
 */

export class OrangeMoneyServiceError extends Error {
  public readonly code?: string;

  public readonly statusCode?: number;

  public readonly details?: unknown;

  constructor(
    message: string,

    options?: {
      code?: string;

      statusCode?: number;

      details?: unknown;
    },
  ) {
    super(message);

    this.name =
      "OrangeMoneyServiceError";

    this.code = options?.code;

    this.statusCode =
      options?.statusCode;

    this.details =
      options?.details;

    Object.setPrototypeOf(
      this,
      OrangeMoneyServiceError.prototype,
    );
  }
}

/**
 * ============================================================
 * SERVICE
 * ============================================================
 */

class OrangeMoneyService {
  private readonly config: OrangeMoneyConfig;

  private readonly http: AxiosInstance;

  private accessToken?: string;

  private accessTokenExpiresAt = 0;

  constructor() {
    this.config = {
      enabled: this.getBoolean(
        process.env.ORANGE_MONEY_ENABLED,
        false,
      ),

      mode: this.getMode(
        process.env.ORANGE_MONEY_MODE,
      ),

      baseUrl:
        process.env.ORANGE_MONEY_BASE_URL?.replace(
          /\/+$/,
          "",
        ) || "",

      tokenUrl:
        process.env.ORANGE_MONEY_TOKEN_URL ||
        "",

      consumerKey:
        process.env.ORANGE_MONEY_CONSUMER_KEY,

      consumerSecret:
        process.env.ORANGE_MONEY_CONSUMER_SECRET,

      merchantId:
        process.env.ORANGE_MONEY_MERCHANT_ID,

      callbackUrl:
        process.env.ORANGE_MONEY_CALLBACK_URL,

      timeout:
        Number(
          process.env.ORANGE_MONEY_TIMEOUT,
        ) || 30_000,

      currency:
        process.env.ORANGE_MONEY_CURRENCY ||
        "XAF",
    };

    this.http = axios.create({
      baseURL:
        this.config.baseUrl,

      timeout:
        this.config.timeout,

      headers: {
        Accept:
          "application/json",

        "Content-Type":
          "application/json",
      },
    });
  }

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  /**
   * Retourne uniquement les informations non sensibles.
   */
  public getConfig() {
    return {
      enabled:
        this.config.enabled,

      mode:
        this.config.mode,

      baseUrlConfigured:
        Boolean(
          this.config.baseUrl,
        ),

      tokenUrlConfigured:
        Boolean(
          this.config.tokenUrl,
        ),

      credentialsConfigured:
        Boolean(
          this.config.consumerKey &&
            this.config.consumerSecret,
        ),

      merchantConfigured:
        Boolean(
          this.config.merchantId,
        ),

      callbackConfigured:
        Boolean(
          this.config.callbackUrl,
        ),

      currency:
        this.config.currency,
    };
  }

  /**
   * Vérifie la configuration.
   */
  public isConfigured(): boolean {
    if (!this.config.enabled) {
      return false;
    }

    if (
      this.config.mode ===
      "SIMULATED"
    ) {
      return true;
    }

    return Boolean(
      this.config.baseUrl &&
        this.config.consumerKey &&
        this.config.consumerSecret,
    );
  }

  // ==========================================================
  // INITIATE PAYMENT
  // ==========================================================

  /**
   * Initialise un paiement Orange Money.
   */
  public async initiatePayment(
    request: OrangeMoneyPaymentRequest,
  ): Promise<OrangeMoneyPaymentResponse> {
    this.validatePaymentRequest(
      request,
    );

    if (!this.config.enabled) {
      throw new OrangeMoneyServiceError(
        "Orange Money est désactivé.",
        {
          code:
            "ORANGE_MONEY_DISABLED",
        },
      );
    }

    /**
     * Mode simulation.
     */
    if (
      this.config.mode ===
      "SIMULATED"
    ) {
      return this.simulatePayment(
        request,
      );
    }

    try {
      const token =
        await this.getAccessToken();

      /**
       * Payload générique.
       *
       * IMPORTANT :
       * les noms exacts des champs doivent être
       * adaptés au contrat API Orange Money fourni
       * pour le pays / agrégateur utilisé.
       */
      const payload = {
        merchantId:
          this.config.merchantId,

        amount:
          Math.round(
            request.amount,
          ),

        currency:
          request.currency ||
          this.config.currency,

        customerPhone:
          this.normalizePhoneNumber(
            request.phoneNumber,
          ),

        phoneNumber:
          this.normalizePhoneNumber(
            request.phoneNumber,
          ),

        reference:
          request.reference,

        accountReference:
          request.accountReference ||
          request.reference,

        description:
          request.transactionDescription ||
          request.description ||
          "BibSaaS Payment",

        callbackUrl:
          this.config.callbackUrl,

        customerName:
          request.customerName,

        customerEmail:
          request.customerEmail,

        metadata:
          request.metadata,
      };

      const response =
        await this.request(
          "POST",
          "/payments",
          payload,
          token,
        );

      const data =
        this.toRecord(
          response.data,
        );

      const transactionId =
        this.extractString(
          data,
          [
            "transactionId",
            "TransactionId",
            "TransactionID",
            "transaction_id",
            "id",
          ],
        );

      const paymentId =
        this.extractString(
          data,
          [
            "paymentId",
            "PaymentId",
            "payment_id",
            "id",
          ],
        );

      const checkoutRequestId =
        this.extractString(
          data,
          [
            "checkoutRequestId",
            "CheckoutRequestID",
            "checkout_request_id",
          ],
        );

      const status =
        this.mapStatus(
          data,
        );

      return {
        success:
          status !== "FAILED",

        mode:
          this.config.mode,

        message:
          this.extractString(
            data,
            [
              "message",
              "Message",
              "responseDescription",
              "ResponseDescription",
              "description",
            ],
          ) ||
          "Paiement Orange Money initié.",

        transactionId,

        paymentId,

        checkoutRequestId,

        status:
          status === "UNKNOWN"
            ? "PENDING"
            : status,

        amount:
          request.amount,

        currency:
          request.currency ||
          this.config.currency,

        phoneNumber:
          request.phoneNumber,

        reference:
          request.reference,

        raw:
          data,
      };
    } catch (error) {
      return this.handlePaymentError(
        error,
        request,
      );
    }
  }

  // ==========================================================
  // CHECK PAYMENT STATUS
  // ==========================================================

  /**
   * Vérifie le statut d'un paiement.
   */
  public async checkPaymentStatus(
    transactionId: string,
  ): Promise<OrangeMoneyStatusResponse> {
    if (
      !transactionId ||
      !transactionId.trim()
    ) {
      throw new OrangeMoneyServiceError(
        "transactionId est obligatoire.",
        {
          code:
            "INVALID_TRANSACTION_ID",
        },
      );
    }

    if (!this.config.enabled) {
      throw new OrangeMoneyServiceError(
        "Orange Money est désactivé.",
        {
          code:
            "ORANGE_MONEY_DISABLED",
        },
      );
    }

    /**
     * Simulation.
     */
    if (
      this.config.mode ===
      "SIMULATED"
    ) {
      return {
        success:
          true,

        mode:
          "SIMULATED",

        message:
          "Transaction Orange Money simulée avec succès.",

        transactionId,

        status:
          "SUCCESS",
      };
    }

    try {
      const token =
        await this.getAccessToken();

      const response =
        await this.request(
          "GET",
          `/payments/${encodeURIComponent(
            transactionId,
          )}`,
          undefined,
          token,
        );

      const data =
        this.toRecord(
          response.data,
        );

      const status =
        this.mapStatus(
          data,
        );

      return {
        success:
          status === "SUCCESS",

        mode:
          this.config.mode,

        message:
          this.extractString(
            data,
            [
              "message",
              "Message",
              "resultDescription",
              "resultDesc",
              "ResultDesc",
              "ResponseDescription",
            ],
          ) ||
          "Statut du paiement récupéré.",

        transactionId,

        paymentId:
          this.extractString(
            data,
            [
              "paymentId",
              "PaymentId",
              "payment_id",
            ],
          ),

        status,

        resultCode:
          this.extractString(
            data,
            [
              "resultCode",
              "ResultCode",
              "result_code",
              "code",
            ],
          ),

        resultDescription:
          this.extractString(
            data,
            [
              "resultDescription",
              "resultDesc",
              "ResultDesc",
              "message",
            ],
          ),

        amount:
          this.extractNumber(
            data,
            [
              "amount",
              "Amount",
              "transactionAmount",
            ],
          ),

        currency:
          this.extractString(
            data,
            [
              "currency",
              "Currency",
            ],
          ),

        reference:
          this.extractString(
            data,
            [
              "reference",
              "Reference",
              "accountReference",
            ],
          ),

        raw:
          data,
      };
    } catch (error) {
      const normalized =
        this.normalizeError(
          error,
        );

      return {
        success:
          false,

        mode:
          this.config.mode,

        message:
          normalized.message,

        transactionId,

        status:
          "UNKNOWN",

        error: {
          code:
            normalized.code,

          message:
            normalized.message,

          details:
            normalized.details,
        },
      };
    }
  }

  // ==========================================================
  // CALLBACK / WEBHOOK
  // ==========================================================

  /**
   * Traite un callback Orange Money.
   */
  public processCallback(
    payload: unknown,
  ): OrangeMoneyCallbackResult {
    if (
      !payload ||
      typeof payload !==
        "object"
    ) {
      return {
        success:
          false,

        status:
          "FAILED",

        raw:
          payload,
      };
    }

    const data =
      this.toRecord(
        payload,
      );

    /**
     * Certains providers placent les données
     * dans data / result / payment / transaction.
     */
    const nested =
      this.findNestedObject(
        data,
        [
          "data",
          "Data",
          "result",
          "Result",
          "payment",
          "Payment",
          "transaction",
          "Transaction",
        ],
      ) || data;

    const transactionId =
      this.extractString(
        nested,
        [
          "transactionId",
          "TransactionId",
          "TransactionID",
          "transaction_id",
          "id",
        ],
      );

    const paymentId =
      this.extractString(
        nested,
        [
          "paymentId",
          "PaymentId",
          "payment_id",
        ],
      );

    const checkoutRequestId =
      this.extractString(
        nested,
        [
          "checkoutRequestId",
          "CheckoutRequestID",
          "checkout_request_id",
        ],
      );

    const amount =
      this.extractNumber(
        nested,
        [
          "amount",
          "Amount",
          "transactionAmount",
        ],
      );

    const currency =
      this.extractString(
        nested,
        [
          "currency",
          "Currency",
        ],
      );

    const phoneNumber =
      this.extractString(
        nested,
        [
          "phoneNumber",
          "PhoneNumber",
          "customerPhone",
          "msisdn",
          "MSISDN",
        ],
      );

    const reference =
      this.extractString(
        nested,
        [
          "reference",
          "Reference",
          "accountReference",
          "AccountReference",
        ],
      );

    const receiptNumber =
      this.extractString(
        nested,
        [
          "receiptNumber",
          "ReceiptNumber",
          "receipt",
          "Receipt",
          "orangeMoneyReceipt",
        ],
      );

    const resultCode =
      this.extractString(
        nested,
        [
          "resultCode",
          "ResultCode",
          "result_code",
          "code",
        ],
      );

    const resultDescription =
      this.extractString(
        nested,
        [
          "resultDescription",
          "resultDesc",
          "ResultDesc",
          "message",
          "Message",
        ],
      );

    const status =
      this.mapCallbackStatus(
        resultCode,
        nested,
      );

    return {
      success:
        status === "SUCCESS",

      transactionId,

      paymentId,

      checkoutRequestId,

      amount,

      currency,

      phoneNumber,

      reference,

      receiptNumber,

      resultCode,

      resultDescription,

      status,

      raw:
        payload,
    };
  }

  // ==========================================================
  // CALLBACK VALIDATION
  // ==========================================================

  /**
   * Validation minimale du callback.
   *
   * En production :
   * utiliser la signature/HMAC ou tout autre mécanisme
   * de vérification officiellement fourni par Orange Money
   * ou par l'agrégateur utilisé.
   */
  public validateCallback(
    payload: unknown,
  ): boolean {
    if (
      !payload ||
      typeof payload !==
        "object"
    ) {
      return false;
    }

    const result =
      this.processCallback(
        payload,
      );

    return Boolean(
      result.transactionId ||
        result.paymentId ||
        result.checkoutRequestId ||
        result.resultCode,
    );
  }

  // ==========================================================
  // PHONE NUMBER
  // ==========================================================

  /**
   * Normalise un numéro de téléphone.
   *
   * Le format final doit être adapté au pays
   * et à l'API Orange Money utilisée.
   */
  public normalizePhoneNumber(
    phoneNumber: string,
  ): string {
    if (!phoneNumber) {
      throw new OrangeMoneyServiceError(
        "Numéro de téléphone obligatoire.",
        {
          code:
            "INVALID_PHONE_NUMBER",
        },
      );
    }

    let phone =
      phoneNumber
        .trim()
        .replace(
          /[\s\-().]/g,
          "",
        );

    if (
      phone.startsWith("+")
    ) {
      phone =
        phone.substring(1);
    }

    if (
      phone.startsWith("00")
    ) {
      phone =
        phone.substring(2);
    }

    if (
      !/^\d+$/.test(phone)
    ) {
      throw new OrangeMoneyServiceError(
        "Numéro de téléphone invalide.",
        {
          code:
            "INVALID_PHONE_NUMBER",
        },
      );
    }

    return phone;
  }

  // ==========================================================
  // AUTHENTICATION
  // ==========================================================

  /**
   * Obtient un access token.
   *
   * L'URL et le format exacts dépendent de l'API
   * Orange Money utilisée.
   */
  private async getAccessToken(): Promise<string> {
    if (
      this.accessToken &&
      Date.now() <
        this.accessTokenExpiresAt
    ) {
      return this.accessToken;
    }

    if (
      !this.config.consumerKey ||
      !this.config.consumerSecret
    ) {
      throw new OrangeMoneyServiceError(
        "Les credentials Orange Money sont manquants.",
        {
          code:
            "ORANGE_MONEY_CREDENTIALS_MISSING",
        },
      );
    }

    if (
      !this.config.tokenUrl
    ) {
      throw new OrangeMoneyServiceError(
        "ORANGE_MONEY_TOKEN_URL est manquant.",
        {
          code:
            "ORANGE_MONEY_TOKEN_URL_MISSING",
        },
      );
    }

    try {
      const credentials =
        Buffer.from(
          `${this.config.consumerKey}:${this.config.consumerSecret}`,
        ).toString(
          "base64",
        );

      const response =
        await axios.get<OrangeMoneyTokenResponse>(
          this.config.tokenUrl,
          {
            timeout:
              this.config.timeout,

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Basic ${credentials}`,
            },

            params: {
              grant_type:
                "client_credentials",
            },
          },
        );

      if (
        !response.data?.access_token
      ) {
        throw new OrangeMoneyServiceError(
          "Orange Money n'a pas retourné de access token.",
          {
            code:
              "ORANGE_MONEY_TOKEN_MISSING",

            details:
              response.data,
          },
        );
      }

      this.accessToken =
        response.data.access_token;

      const expiresIn =
        Number(
          response.data
            .expires_in,
        ) || 3600;

      this.accessTokenExpiresAt =
        Date.now() +
        Math.max(
          expiresIn - 60,
          60,
        ) *
          1000;

      return this.accessToken;
    } catch (error) {
      throw this.toServiceError(
        error,
        "Impossible d'obtenir le token Orange Money.",
      );
    }
  }

  // ==========================================================
  // HTTP
  // ==========================================================

  private async request(
    method:
      | "GET"
      | "POST"
      | "PUT"
      | "DELETE",

    url: string,

    data?: unknown,

    token?: string,
  ) {
    const config: AxiosRequestConfig =
      {
        method,

        url,

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",
        },
      };

    if (token) {
      config.headers = {
        ...config.headers,

        Authorization:
          `Bearer ${token}`,
      };
    }

    if (
      data !== undefined
    ) {
      config.data = data;
    }

    return this.http.request(
      config,
    );
  }

  // ==========================================================
  // VALIDATION
  // ==========================================================

  private validatePaymentRequest(
    request: OrangeMoneyPaymentRequest,
  ): void {
    if (!request) {
      throw new OrangeMoneyServiceError(
        "Les données de paiement sont obligatoires.",
        {
          code:
            "INVALID_PAYMENT_REQUEST",
        },
      );
    }

    if (
      !Number.isFinite(
        request.amount,
      ) ||
      request.amount <= 0
    ) {
      throw new OrangeMoneyServiceError(
        "Le montant doit être supérieur à zéro.",
        {
          code:
            "INVALID_AMOUNT",
        },
      );
    }

    if (
      request.amount >
      Number.MAX_SAFE_INTEGER
    ) {
      throw new OrangeMoneyServiceError(
        "Le montant est trop élevé.",
        {
          code:
            "INVALID_AMOUNT",
        },
      );
    }

    this.normalizePhoneNumber(
      request.phoneNumber,
    );

    if (
      !request.reference ||
      request.reference.trim()
        .length < 2
    ) {
      throw new OrangeMoneyServiceError(
        "La référence du paiement est obligatoire.",
        {
          code:
            "INVALID_REFERENCE",
        },
      );
    }

    if (
      request.reference.length >
      100
    ) {
      throw new OrangeMoneyServiceError(
        "La référence du paiement est trop longue.",
        {
          code:
            "INVALID_REFERENCE",
        },
      );
    }
  }

  // ==========================================================
  // SIMULATION
  // ==========================================================

  private simulatePayment(
    request: OrangeMoneyPaymentRequest,
  ): OrangeMoneyPaymentResponse {
    const timestamp =
      Date.now();

    const transactionId =
      `OM_SIM_${timestamp}_${Math.random()
        .toString(36)
        .substring(
          2,
          8,
        )
        .toUpperCase()}`;

    const paymentId =
      `OM_PAYMENT_SIM_${timestamp}`;

    const checkoutRequestId =
      `OM_CHECKOUT_SIM_${timestamp}`;

    return {
      success:
        true,

      mode:
        "SIMULATED",

      message:
        "Paiement Orange Money simulé avec succès.",

      transactionId,

      paymentId,

      checkoutRequestId,

      status:
        "SUCCESS",

      amount:
        request.amount,

      currency:
        request.currency ||
        this.config.currency,

      phoneNumber:
        request.phoneNumber,

      reference:
        request.reference,

      raw: {
        simulated:
          true,

        provider:
          "ORANGE_MONEY",

        transactionId,

        paymentId,

        checkoutRequestId,

        amount:
          request.amount,

        currency:
          request.currency ||
          this.config.currency,

        phoneNumber:
          request.phoneNumber,

        reference:
          request.reference,

        createdAt:
          new Date().toISOString(),
      },
    };
  }

  // ==========================================================
  // STATUS MAPPING
  // ==========================================================

  private mapStatus(
    data: Record<string, unknown>,
  ): OrangeMoneyTransactionStatus {
    const rawStatus =
      (
        this.extractString(
          data,
          [
            "status",
            "Status",
            "transactionStatus",
            "TransactionStatus",
            "paymentStatus",
            "PaymentStatus",
            "resultCode",
            "ResultCode",
          ],
        ) || ""
      ).toUpperCase();

    if (
      [
        "SUCCESS",
        "SUCCEEDED",
        "COMPLETED",
        "COMPLETE",
        "SUCCESSFUL",
        "PAID",
        "0",
      ].includes(rawStatus)
    ) {
      return "SUCCESS";
    }

    if (
      [
        "FAILED",
        "FAILURE",
        "REJECTED",
        "ERROR",
        "DECLINED",
      ].includes(rawStatus)
    ) {
      return "FAILED";
    }

    if (
      [
        "CANCELLED",
        "CANCELED",
      ].includes(rawStatus)
    ) {
      return "CANCELLED";
    }

    if (
      [
        "EXPIRED",
        "TIMEOUT",
      ].includes(rawStatus)
    ) {
      return "EXPIRED";
    }

    if (
      [
        "PROCESSING",
        "IN_PROGRESS",
      ].includes(rawStatus)
    ) {
      return "PROCESSING";
    }

    if (
      [
        "PENDING",
        "INITIATED",
        "CREATED",
        "ACCEPTED",
      ].includes(rawStatus)
    ) {
      return "PENDING";
    }

    return "UNKNOWN";
  }

  private mapCallbackStatus(
    resultCode?: string,

    payload?: Record<string, unknown>,
  ): OrangeMoneyTransactionStatus {
    if (
      resultCode !==
        undefined &&
      resultCode !== null
    ) {
      const code =
        String(
          resultCode,
        ).trim();

      if (code === "0") {
        return "SUCCESS";
      }

      if (
        [
          "SUCCESS",
          "SUCCESSFUL",
          "COMPLETED",
          "PAID",
        ].includes(
          code.toUpperCase(),
        )
      ) {
        return "SUCCESS";
      }

      if (
        [
          "FAILED",
          "FAILURE",
          "ERROR",
          "REJECTED",
          "DECLINED",
        ].includes(
          code.toUpperCase(),
        )
      ) {
        return "FAILED";
      }
    }

    if (payload) {
      return this.mapStatus(
        payload,
      );
    }

    return "UNKNOWN";
  }

  // ==========================================================
  // ERROR HANDLING
  // ==========================================================

  private handlePaymentError(
    error: unknown,

    request: OrangeMoneyPaymentRequest,
  ): OrangeMoneyPaymentResponse {
    const normalized =
      this.normalizeError(
        error,
      );

    return {
      success:
        false,

      mode:
        this.config.mode,

      message:
        normalized.message,

      amount:
        request.amount,

      currency:
        request.currency ||
        this.config.currency,

      phoneNumber:
        request.phoneNumber,

      reference:
        request.reference,

      status:
        "FAILED",

      error: {
        code:
          normalized.code,

        message:
          normalized.message,

        details:
          normalized.details,
      },
    };
  }

  private normalizeError(
    error: unknown,
  ): {
    code?: string;

    message: string;

    details?: unknown;
  } {
    if (
      error instanceof
      OrangeMoneyServiceError
    ) {
      return {
        code:
          error.code,

        message:
          error.message,

        details:
          error.details,
      };
    }

    if (
      axios.isAxiosError(
        error,
      )
    ) {
      const axiosError =
        error as AxiosError;

      const responseData =
        axiosError.response
          ?.data;

      let message =
        axiosError.message ||
        "Erreur Orange Money.";

      let code:
        | string
        | undefined;

      if (
        responseData &&
        typeof responseData ===
          "object"
      ) {
        const data =
          responseData as Record<
            string,
            unknown
          >;

        message =
          this.extractString(
            data,
            [
              "message",
              "Message",
              "error_description",
              "errorDescription",
              "ResponseDescription",
              "ResultDesc",
              "resultDescription",
              "error",
            ],
          ) ||
          message;

        code =
          this.extractString(
            data,
            [
              "errorCode",
              "error_code",
              "resultCode",
              "ResultCode",
              "code",
            ],
          );
      }

      return {
        code,

        message,

        details:
          responseData,
      };
    }

    if (
      error instanceof
      Error
    ) {
      return {
        message:
          error.message,
      };
    }

    return {
      message:
        "Une erreur inconnue est survenue avec Orange Money.",

      details:
        error,
    };
  }

  private toServiceError(
    error: unknown,

    fallbackMessage: string,
  ): OrangeMoneyServiceError {
    const normalized =
      this.normalizeError(
        error,
      );

    return new OrangeMoneyServiceError(
      normalized.message ||
        fallbackMessage,
      {
        code:
          normalized.code ||
          "ORANGE_MONEY_API_ERROR",

        details:
          normalized.details,
      },
    );
  }

  // ==========================================================
  // HELPERS
  // ==========================================================

  private toRecord(
    value: unknown,
  ): Record<string, unknown> {
    if (
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(value)
    ) {
      return value as Record<
        string,
        unknown
      >;
    }

    return {};
  }

  private extractString(
    object: Record<string, unknown>,

    keys: string[],
  ): string | undefined {
    for (
      const key of keys
    ) {
      const value =
        object[key];

      if (
        typeof value ===
          "string" &&
        value.trim()
      ) {
        return value.trim();
      }

      if (
        typeof value ===
          "number"
      ) {
        return String(
          value,
        );
      }
    }

    return undefined;
  }

  private extractNumber(
    object: Record<string, unknown>,

    keys: string[],
  ): number | undefined {
    for (
      const key of keys
    ) {
      const value =
        object[key];

      if (
        typeof value ===
          "number" &&
        Number.isFinite(
          value,
        )
      ) {
        return value;
      }

      if (
        typeof value ===
          "string"
      ) {
        const parsed =
          Number(
            value,
          );

        if (
          Number.isFinite(
            parsed,
          )
        ) {
          return parsed;
        }
      }
    }

    return undefined;
  }

  private findNestedObject(
    object: Record<string, unknown>,

    keys: string[],
  ):
    | Record<string, unknown>
    | undefined {
    for (
      const key of keys
    ) {
      const value =
        object[key];

      if (
        value &&
        typeof value ===
          "object" &&
        !Array.isArray(
          value,
        )
      ) {
        return value as Record<
          string,
          unknown
        >;
      }
    }

    return undefined;
  }

  private getBoolean(
    value: string | undefined,

    fallback: boolean,
  ): boolean {
    if (
      value === undefined
    ) {
      return fallback;
    }

    return [
      "true",
      "1",
      "yes",
      "on",
    ].includes(
      value.toLowerCase(),
    );
  }

  private getMode(
    value?: string,
  ): OrangeMoneyMode {
    const mode =
      value?.toUpperCase();

    if (
      mode === "LIVE" ||
      mode === "SANDBOX" ||
      mode === "SIMULATED"
    ) {
      return mode;
    }

    return "SIMULATED";
  }
}

/**
 * ============================================================
 * SINGLETON
 * ============================================================
 *
 * Utilisation :
 *
 * import orangeMoneyService
 *   from "../services/orange-money.service";
 *
 * const payment =
 *   await orangeMoneyService.initiatePayment({
 *     amount: 2000,
 *     phoneNumber: "06XXXXXXXX",
 *     reference: "SUB-BIB-123456",
 *     description: "Abonnement BibSaaS",
 *   });
 */

const orangeMoneyService =
  new OrangeMoneyService();

export default orangeMoneyService;

export {
  OrangeMoneyService,
};

