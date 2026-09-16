
// src/services/mpesa.service.ts

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
} from "axios";

/**
 * ============================================================
 * M-PESA SERVICE - BibSaaS
 * ============================================================
 *
 * Responsabilités :
 * - Authentification API M-Pesa
 * - Initiation d'un paiement STK / C2B selon le provider
 * - Vérification du statut d'une transaction
 * - Validation des callbacks
 * - Gestion des erreurs
 * - Mode SIMULATED pour développement
 *
 * IMPORTANT :
 * M-Pesa possède plusieurs APIs selon le pays/opérateur.
 * Les endpoints ci-dessous sont donc configurables via .env.
 *
 * Variables recommandées :
 *
 * MPESA_ENABLED=true
 * MPESA_MODE=LIVE
 * MPESA_BASE_URL=https://...
 * MPESA_CONSUMER_KEY=...
 * MPESA_CONSUMER_SECRET=...
 * MPESA_SHORT_CODE=...
 * MPESA_PASSKEY=...
 * MPESA_CALLBACK_URL=https://api.example.com/api/payments/webhooks/mpesa
 *
 * Pour développement :
 *
 * MPESA_ENABLED=true
 * MPESA_MODE=SIMULATED
 */

export type MpesaMode = "LIVE" | "SANDBOX" | "SIMULATED";

export type MpesaTransactionStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "UNKNOWN";

export interface MpesaPaymentRequest {
  amount: number;
  phoneNumber: string;
  reference: string;
  description?: string;
  accountReference?: string;
  transactionDesc?: string;
  currency?: string;
  customerName?: string;
  customerEmail?: string;
}

export interface MpesaPaymentResponse {
  success: boolean;
  mode: MpesaMode;
  message: string;

  transactionId?: string;
  checkoutRequestId?: string;
  merchantRequestId?: string;

  status?: MpesaTransactionStatus;

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

export interface MpesaStatusResponse {
  success: boolean;
  mode: MpesaMode;
  message: string;

  transactionId?: string;
  checkoutRequestId?: string;
  status: MpesaTransactionStatus;

  resultCode?: string;
  resultDesc?: string;

  raw?: unknown;

  error?: {
    code?: string;
    message: string;
    details?: unknown;
  };
}

export interface MpesaCallbackResult {
  success: boolean;

  transactionId?: string;
  checkoutRequestId?: string;
  merchantRequestId?: string;

  amount?: number;
  phoneNumber?: string;
  reference?: string;
  receiptNumber?: string;

  resultCode?: string;
  resultDesc?: string;

  status: MpesaTransactionStatus;

  raw: unknown;
}

interface MpesaTokenResponse {
  access_token: string;
  expires_in?: string | number;
}

interface MpesaConfig {
  enabled: boolean;
  mode: MpesaMode;

  baseUrl: string;

  consumerKey?: string;
  consumerSecret?: string;

  shortCode?: string;
  passKey?: string;

  callbackUrl?: string;

  timeout: number;

  currency: string;
}

/**
 * Custom error.
 */
export class MpesaServiceError extends Error {
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

    this.name = "MpesaServiceError";
    this.code = options?.code;
    this.statusCode = options?.statusCode;
    this.details = options?.details;

    Object.setPrototypeOf(this, MpesaServiceError.prototype);
  }
}

/**
 * M-Pesa Service.
 */
class MpesaService {
  private readonly config: MpesaConfig;

  private readonly http: AxiosInstance;

  private accessToken?: string;

  private accessTokenExpiresAt = 0;

  constructor() {
    this.config = {
      enabled: this.getBoolean(
        process.env.MPESA_ENABLED,
        false,
      ),

      mode: this.getMode(
        process.env.MPESA_MODE,
      ),

      baseUrl:
        process.env.MPESA_BASE_URL?.replace(/\/+$/, "") ||
        "",

      consumerKey:
        process.env.MPESA_CONSUMER_KEY,

      consumerSecret:
        process.env.MPESA_CONSUMER_SECRET,

      shortCode:
        process.env.MPESA_SHORT_CODE,

      passKey:
        process.env.MPESA_PASSKEY,

      callbackUrl:
        process.env.MPESA_CALLBACK_URL,

      timeout:
        Number(process.env.MPESA_TIMEOUT) || 30_000,

      currency:
        process.env.MPESA_CURRENCY || "XAF",
    };

    this.http = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,

      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
  }

  // ==========================================================
  // PUBLIC
  // ==========================================================

  /**
   * Retourne la configuration publique du service.
   */
  public getConfig() {
    return {
      enabled: this.config.enabled,
      mode: this.config.mode,
      baseUrlConfigured: Boolean(this.config.baseUrl),
      credentialsConfigured:
        Boolean(this.config.consumerKey) &&
        Boolean(this.config.consumerSecret),
      shortCodeConfigured:
        Boolean(this.config.shortCode),
      callbackConfigured:
        Boolean(this.config.callbackUrl),
      currency: this.config.currency,
    };
  }

  /**
   * Vérifie si M-Pesa est correctement configuré.
   */
  public isConfigured(): boolean {
    if (!this.config.enabled) {
      return false;
    }

    if (this.config.mode === "SIMULATED") {
      return true;
    }

    return Boolean(
      this.config.baseUrl &&
        this.config.consumerKey &&
        this.config.consumerSecret,
    );
  }

  /**
   * Initie un paiement.
   */
  public async initiatePayment(
    request: MpesaPaymentRequest,
  ): Promise<MpesaPaymentResponse> {
    this.validatePaymentRequest(request);

    if (!this.config.enabled) {
      throw new MpesaServiceError(
        "M-Pesa est désactivé.",
        {
          code: "MPESA_DISABLED",
        },
      );
    }

    /**
     * Mode simulation.
     */
    if (this.config.mode === "SIMULATED") {
      return this.simulatePayment(request);
    }

    try {
      const token = await this.getAccessToken();

      /**
       * Payload générique.
       *
       * IMPORTANT :
       * adapter les noms de champs à l'API M-Pesa
       * réellement utilisée.
       */
      const payload = {
        BusinessShortCode:
          this.config.shortCode,

        Amount: Math.round(request.amount),

        PartyA: this.normalizePhoneNumber(
          request.phoneNumber,
        ),

        PartyB:
          this.config.shortCode,

        PhoneNumber:
          this.normalizePhoneNumber(
            request.phoneNumber,
          ),

        AccountReference:
          request.accountReference ||
          request.reference,

        TransactionDesc:
          request.transactionDesc ||
          request.description ||
          "BibSaaS Payment",

        CallBackURL:
          this.config.callbackUrl,

        Reference:
          request.reference,

        Currency:
          request.currency ||
          this.config.currency,
      };

      const response = await this.request(
        "POST",
        "/payments",
        payload,
        token,
      );

      const data = response.data as Record<
        string,
        unknown
      >;

      const transactionId =
        this.extractString(
          data,
          [
            "TransactionID",
            "transactionId",
            "transaction_id",
            "id",
          ],
        );

      const checkoutRequestId =
        this.extractString(
          data,
          [
            "CheckoutRequestID",
            "checkoutRequestId",
            "checkout_request_id",
          ],
        );

      const merchantRequestId =
        this.extractString(
          data,
          [
            "MerchantRequestID",
            "merchantRequestId",
            "merchant_request_id",
          ],
        );

      return {
        success: true,

        mode: this.config.mode,

        message:
          this.extractString(
            data,
            [
              "ResponseDescription",
              "responseDescription",
              "message",
            ],
          ) ||
          "Paiement M-Pesa initié.",

        transactionId,

        checkoutRequestId,

        merchantRequestId,

        status: "PENDING",

        amount: request.amount,

        currency:
          request.currency ||
          this.config.currency,

        phoneNumber:
          request.phoneNumber,

        reference:
          request.reference,

        raw: data,
      };
    } catch (error) {
      return this.handlePaymentError(
        error,
        request,
      );
    }
  }

  /**
   * Vérifie le statut d'une transaction.
   */
  public async checkPaymentStatus(
    transactionId: string,
  ): Promise<MpesaStatusResponse> {
    if (!transactionId?.trim()) {
      throw new MpesaServiceError(
        "transactionId est obligatoire.",
        {
          code: "INVALID_TRANSACTION_ID",
        },
      );
    }

    if (!this.config.enabled) {
      throw new MpesaServiceError(
        "M-Pesa est désactivé.",
        {
          code: "MPESA_DISABLED",
        },
      );
    }

    /**
     * Simulation.
     */
    if (this.config.mode === "SIMULATED") {
      return {
        success: true,

        mode: "SIMULATED",

        message:
          "Transaction simulée avec succès.",

        transactionId,

        status: "SUCCESS",
      };
    }

    try {
      const token = await this.getAccessToken();

      const response = await this.request(
        "GET",
        `/payments/${encodeURIComponent(
          transactionId,
        )}`,
        undefined,
        token,
      );

      const data = response.data as Record<
        string,
        unknown
      >;

      const status = this.mapStatus(data);

      return {
        success: status === "SUCCESS",

        mode: this.config.mode,

        message:
          this.extractString(
            data,
            [
              "message",
              "resultDesc",
              "ResultDesc",
              "ResponseDescription",
            ],
          ) ||
          "Statut de la transaction récupéré.",

        transactionId,

        status,

        resultCode:
          this.extractString(
            data,
            [
              "ResultCode",
              "resultCode",
              "result_code",
            ],
          ),

        resultDesc:
          this.extractString(
            data,
            [
              "ResultDesc",
              "resultDesc",
              "result_desc",
            ],
          ),

        raw: data,
      };
    } catch (error) {
      const normalized =
        this.normalizeError(error);

      return {
        success: false,

        mode: this.config.mode,

        message:
          normalized.message,

        transactionId,

        status: "UNKNOWN",

        error: {
          code: normalized.code,
          message:
            normalized.message,
          details:
            normalized.details,
        },
      };
    }
  }

  /**
   * Traite un callback M-Pesa.
   *
   * Le controller webhook doit lui transmettre req.body.
   */
  public processCallback(
    payload: unknown,
  ): MpesaCallbackResult {
    if (
      !payload ||
      typeof payload !== "object"
    ) {
      return {
        success: false,
        status: "FAILED",
        raw: payload,
      };
    }

    const data =
      payload as Record<string, unknown>;

    /**
     * Certains providers encapsulent le résultat
     * dans Body / stkCallback / Result.
     */
    const nested =
      this.findNestedObject(data, [
        "Body",
        "body",
        "stkCallback",
        "Result",
        "result",
        "data",
      ]) || data;

    const resultCode =
      this.extractString(
        nested,
        [
          "ResultCode",
          "resultCode",
          "result_code",
          "statusCode",
        ],
      );

    const resultDesc =
      this.extractString(
        nested,
        [
          "ResultDesc",
          "resultDesc",
          "result_desc",
          "message",
        ],
      );

    const transactionId =
      this.extractString(
        nested,
        [
          "TransactionID",
          "transactionId",
          "transaction_id",
          "id",
        ],
      );

    const checkoutRequestId =
      this.extractString(
        nested,
        [
          "CheckoutRequestID",
          "checkoutRequestId",
          "checkout_request_id",
        ],
      );

    const merchantRequestId =
      this.extractString(
        nested,
        [
          "MerchantRequestID",
          "merchantRequestId",
          "merchant_request_id",
        ],
      );

    const receiptNumber =
      this.extractString(
        nested,
        [
          "MpesaReceiptNumber",
          "mpesaReceiptNumber",
          "receiptNumber",
          "receipt",
        ],
      );

    const amount =
      this.extractNumber(
        nested,
        [
          "Amount",
          "amount",
          "TransactionAmount",
        ],
      );

    const phoneNumber =
      this.extractString(
        nested,
        [
          "PhoneNumber",
          "phoneNumber",
          "MSISDN",
          "msisdn",
        ],
      );

    const reference =
      this.extractString(
        nested,
        [
          "AccountReference",
          "accountReference",
          "reference",
          "Reference",
        ],
      );

    const status =
      this.mapCallbackStatus(
        resultCode,
        data,
      );

    return {
      success:
        status === "SUCCESS",

      transactionId,

      checkoutRequestId,

      merchantRequestId,

      amount,

      phoneNumber,

      reference,

      receiptNumber,

      resultCode,

      resultDesc,

      status,

      raw: payload,
    };
  }

  /**
   * Valide un callback minimalement.
   *
   * Pour une vraie production, il faut appliquer
   * la méthode de signature/HMAC fournie par le
   * provider M-Pesa concerné.
   */
  public validateCallback(
    payload: unknown,
  ): boolean {
    if (
      !payload ||
      typeof payload !== "object"
    ) {
      return false;
    }

    const result =
      this.processCallback(payload);

    /**
     * Un callback peut être valide même si le
     * paiement a échoué.
     */
    return Boolean(
      result.transactionId ||
        result.checkoutRequestId ||
        result.merchantRequestId ||
        result.resultCode,
    );
  }

  /**
   * Normalise un numéro de téléphone.
   */
  public normalizePhoneNumber(
    phoneNumber: string,
  ): string {
    if (!phoneNumber) {
      throw new MpesaServiceError(
        "Numéro de téléphone obligatoire.",
        {
          code: "INVALID_PHONE_NUMBER",
        },
      );
    }

    let phone =
      phoneNumber
        .trim()
        .replace(/[\s\-().]/g, "");

    /**
     * Exemple :
     * +242064487803
     * 00242064487803
     * 064487803
     *
     * Le comportement exact doit être adapté
     * au pays M-Pesa utilisé.
     */
    if (phone.startsWith("+")) {
      phone = phone.substring(1);
    }

    if (phone.startsWith("00")) {
      phone = phone.substring(2);
    }

    if (!/^\d+$/.test(phone)) {
      throw new MpesaServiceError(
        "Numéro de téléphone invalide.",
        {
          code: "INVALID_PHONE_NUMBER",
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
   * L'endpoint d'authentification dépend du provider M-Pesa.
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
      throw new MpesaServiceError(
        "Les credentials M-Pesa sont manquants.",
        {
          code: "MPESA_CREDENTIALS_MISSING",
        },
      );
    }

    if (!this.config.baseUrl) {
      throw new MpesaServiceError(
        "MPESA_BASE_URL est manquant.",
        {
          code: "MPESA_BASE_URL_MISSING",
        },
      );
    }

    try {
      const credentials = Buffer.from(
        `${this.config.consumerKey}:${this.config.consumerSecret}`,
      ).toString("base64");

      const response =
        await this.http.get<MpesaTokenResponse>(
          "/oauth/v1/generate?grant_type=client_credentials",
          {
            headers: {
              Authorization:
                `Basic ${credentials}`,
            },
          },
        );

      if (
        !response.data?.access_token
      ) {
        throw new MpesaServiceError(
          "L'API M-Pesa n'a pas retourné de token.",
          {
            code: "MPESA_TOKEN_MISSING",
            details:
              response.data,
          },
        );
      }

      this.accessToken =
        response.data.access_token;

      const expiresIn =
        Number(
          response.data.expires_in,
        ) || 3600;

      /**
       * On retire 60 secondes afin d'éviter
       * l'expiration pendant une requête.
       */
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
        "Impossible d'obtenir le token M-Pesa.",
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
    const config: AxiosRequestConfig = {
      method,
      url,

      headers: {
        Accept: "application/json",
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

    if (data !== undefined) {
      config.data = data;
    }

    return this.http.request(config);
  }

  // ==========================================================
  // VALIDATION
  // ==========================================================

  private validatePaymentRequest(
    request: MpesaPaymentRequest,
  ): void {
    if (!request) {
      throw new MpesaServiceError(
        "Les données de paiement sont obligatoires.",
        {
          code: "INVALID_PAYMENT_REQUEST",
        },
      );
    }

    if (
      !Number.isFinite(request.amount) ||
      request.amount <= 0
    ) {
      throw new MpesaServiceError(
        "Le montant doit être supérieur à zéro.",
        {
          code: "INVALID_AMOUNT",
        },
      );
    }

    if (
      !Number.isSafeInteger(
        Math.round(request.amount),
      )
    ) {
      throw new MpesaServiceError(
        "Montant invalide.",
        {
          code: "INVALID_AMOUNT",
        },
      );
    }

    this.normalizePhoneNumber(
      request.phoneNumber,
    );

    if (
      !request.reference ||
      request.reference.trim().length < 2
    ) {
      throw new MpesaServiceError(
        "La référence de paiement est obligatoire.",
        {
          code: "INVALID_REFERENCE",
        },
      );
    }
  }

  // ==========================================================
  // SIMULATION
  // ==========================================================

  private simulatePayment(
    request: MpesaPaymentRequest,
  ): MpesaPaymentResponse {
    const transactionId =
      `MPESA_SIM_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

    const checkoutRequestId =
      `CHECKOUT_SIM_${Date.now()}`;

    return {
      success: true,

      mode: "SIMULATED",

      message:
        "Paiement M-Pesa simulé avec succès.",

      transactionId,

      checkoutRequestId,

      merchantRequestId:
        `MERCHANT_SIM_${Date.now()}`,

      status: "SUCCESS",

      amount: request.amount,

      currency:
        request.currency ||
        this.config.currency,

      phoneNumber:
        request.phoneNumber,

      reference:
        request.reference,

      raw: {
        simulated: true,

        transactionId,

        amount: request.amount,

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
  // STATUS
  // ==========================================================

  private mapStatus(
    data: Record<string, unknown>,
  ): MpesaTransactionStatus {
    const rawStatus =
      (
        this.extractString(
          data,
          [
            "status",
            "Status",
            "transactionStatus",
            "TransactionStatus",
            "ResultCode",
            "resultCode",
          ],
        ) || ""
      ).toUpperCase();

    if (
      [
        "SUCCESS",
        "COMPLETED",
        "COMPLETE",
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
      ].includes(rawStatus)
    ) {
      return "PENDING";
    }

    return "UNKNOWN";
  }

  private mapCallbackStatus(
    resultCode?: string,
    payload?: Record<string, unknown>,
  ): MpesaTransactionStatus {
    if (
      resultCode !== undefined &&
      resultCode !== null
    ) {
      const normalized =
        String(resultCode).trim();

      if (normalized === "0") {
        return "SUCCESS";
      }

      if (
        [
          "1032",
          "1037",
          "1",
          "2",
          "3",
          "4",
        ].includes(normalized)
      ) {
        return "FAILED";
      }
    }

    if (payload) {
      return this.mapStatus(payload);
    }

    return "UNKNOWN";
  }

  // ==========================================================
  // ERROR HANDLING
  // ==========================================================

  private handlePaymentError(
    error: unknown,
    request: MpesaPaymentRequest,
  ): MpesaPaymentResponse {
    const normalized =
      this.normalizeError(error);

    return {
      success: false,

      mode: this.config.mode,

      message:
        normalized.message,

      amount: request.amount,

      currency:
        request.currency ||
        this.config.currency,

      phoneNumber:
        request.phoneNumber,

      reference:
        request.reference,

      status: "FAILED",

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
      error instanceof MpesaServiceError
    ) {
      return {
        code: error.code,
        message: error.message,
        details: error.details,
      };
    }

    if (axios.isAxiosError(error)) {
      const axiosError =
        error as AxiosError;

      const responseData =
        axiosError.response?.data;

      let message =
        axiosError.message ||
        "Erreur M-Pesa.";

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
              "error_description",
              "ResponseDescription",
              "ResultDesc",
              "error",
            ],
          ) || message;

        code =
          this.extractString(
            data,
            [
              "errorCode",
              "error_code",
              "ResultCode",
              "resultCode",
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

    if (error instanceof Error) {
      return {
        message: error.message,
      };
    }

    return {
      message:
        "Une erreur inconnue est survenue avec M-Pesa.",
      details: error,
    };
  }

  private toServiceError(
    error: unknown,
    fallbackMessage: string,
  ): MpesaServiceError {
    const normalized =
      this.normalizeError(error);

    return new MpesaServiceError(
      normalized.message ||
        fallbackMessage,
      {
        code:
          normalized.code ||
          "MPESA_API_ERROR",

        details:
          normalized.details,
      },
    );
  }

  // ==========================================================
  // HELPERS
  // ==========================================================

  private extractString(
    object: Record<string, unknown>,
    keys: string[],
  ): string | undefined {
    for (const key of keys) {
      const value = object[key];

      if (
        typeof value === "string" &&
        value.trim()
      ) {
        return value.trim();
      }

      if (
        typeof value === "number"
      ) {
        return String(value);
      }
    }

    return undefined;
  }

  private extractNumber(
    object: Record<string, unknown>,
    keys: string[],
  ): number | undefined {
    for (const key of keys) {
      const value = object[key];

      if (
        typeof value === "number" &&
        Number.isFinite(value)
      ) {
        return value;
      }

      if (
        typeof value === "string"
      ) {
        const parsed =
          Number(value);

        if (
          Number.isFinite(parsed)
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
  ): Record<string, unknown> | undefined {
    for (const key of keys) {
      const value = object[key];

      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
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
    if (value === undefined) {
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
  ): MpesaMode {
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
 * Singleton.
 *
 * Utilisation :
 *
 * import mpesaService from "../services/mpesa.service";
 *
 * const payment =
 *   await mpesaService.initiatePayment(...);
 */
const mpesaService =
  new MpesaService();

export default mpesaService;

export { MpesaService };

