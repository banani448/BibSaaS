import config from "../../config/env";

interface InitiatePaymentParams {
  payment: any;
  amount: number;
  currency: string;
  idempotencyKey: string;
  phone?: string;
  metadata?: Record<string, any>;
}

interface WebhookParams {
  body: any;
  rawBody: Buffer;
  headers?: Record<string, string>;
}

interface PaymentResult {
  status: string;
  providerPaymentId?: string;
  providerTransactionId?: string;
  providerStatus?: string;
  clientSecret?: string;
  instructions?: string;
}

interface WebhookResult {
  providerTransactionId?: string;
  providerEventId?: string;
  transactionReference?: string;
  status?: string;
  amount?: number;
  currency?: string;
  providerStatus?: string;
  payload?: any;
  signatureVerified?: boolean;
}

type OpenPayOperator = "MTN" | "AIRTEL";

type OpenPayResponse = {
  reference?: string;
  amount?: number | string;
  currency?: string;
  paymentPhoneNumber?: string;
  provider?: string;
  type?: string;
  status?: string;
  message?: string;
  metadata?: Record<string, any> | null;
  error?: string;
  data?: any;
};

class OpenPayProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly enabled: boolean;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = (
      process.env.OPENPAY_BASE_URL ||
      "https://api.openpay-cg.com"
    ).replace(/\/+$/, "");

    this.apiKey = process.env.OPENPAY_API_KEY || "";

    this.enabled =
      process.env.OPENPAY_ENABLED === "true" ||
      Boolean(this.apiKey);

    this.timeout = Number(
      process.env.OPENPAY_TIMEOUT || "60000"
    );
  }

  // ============================================================
  // CONFIGURATION
  // ============================================================

  private ensureConfigured() {
    if (!this.enabled) {
      throw new Error(
        "OpenPay payments are disabled."
      );
    }

    if (!this.apiKey) {
      throw new Error(
        "OPENPAY_API_KEY is not configured."
      );
    }
  }

  // ============================================================
  // HTTP REQUEST
  // ============================================================

  private async request<T = OpenPayResponse>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    this.ensureConfigured();

    const controller =
      new AbortController();

    const timeoutId =
      setTimeout(
        () => controller.abort(),
        this.timeout
      );

    try {
      const response = await fetch(
        `${this.baseUrl}${path}`,
        {
          ...options,
          signal: controller.signal,
          headers: {
            "XO-API-KEY": this.apiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(options.headers || {}),
          },
        }
      );

      const text =
        await response.text();

      let data: any = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = {
            message: text,
          };
        }
      }

      if (!response.ok) {
        const message =
          data?.error ||
          data?.message ||
          `OpenPay API error (${response.status})`;

        throw new Error(
          `OpenPay: ${message}`
        );
      }

      return data as T;
    } catch (error: any) {
      if (error?.name === "AbortError") {
        throw new Error(
          "OpenPay request timeout."
        );
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ============================================================
  // OPERATOR
  // ============================================================

  private resolveOperator(
    metadata: Record<string, any> = {}
  ): OpenPayOperator {
    const raw =
      metadata.operator ||
      metadata.provider ||
      metadata.mobileOperator;

    const operator =
      String(raw || "")
        .trim()
        .toUpperCase();

    if (
      operator !== "MTN" &&
      operator !== "AIRTEL"
    ) {
      throw new Error(
        "L'opérateur Mobile Money est obligatoire. Utilisez MTN ou AIRTEL."
      );
    }

    return operator;
  }

  // ============================================================
  // PHONE NORMALIZATION
  // ============================================================

  private normalizePhone(
    phone?: string
  ): string {
    if (!phone) {
      throw new Error(
        "Le numéro de téléphone est obligatoire pour OpenPay."
      );
    }

    let normalized =
      String(phone).trim();

    normalized =
      normalized.replace(
        /[\s().-]/g,
        ""
      );

    if (normalized.startsWith("+242")) {
      normalized =
        normalized.substring(1);
    }

    if (
      normalized.startsWith("00242")
    ) {
      normalized =
        normalized.substring(2);
    }

    if (
      normalized.startsWith("06") ||
      normalized.startsWith("05")
    ) {
      normalized =
        `242${normalized}`;
    }

    if (
      !/^242(05|06)\d{7}$/.test(
        normalized
      )
    ) {
      throw new Error(
        "Numéro OpenPay invalide. Utilisez un numéro congolais au format 242XXXXXXXXX."
      );
    }

    return normalized;
  }

  // ============================================================
  // STATUS MAPPING
  // ============================================================

  private mapStatus(
    status?: string
  ): string {
    const normalized =
      String(status || "")
        .trim()
        .toLowerCase();

    switch (normalized) {
      case "success":
      case "successful":
      case "completed":
      case "paid":
        return "SUCCESS";

      case "failed":
      case "failure":
      case "refused":
        return "FAILED";

      case "cancelled":
      case "canceled":
        return "CANCELLED";

      case "pending":
      case "processing":
      case "waiting":
      case "waiting_for_customer":
        return "PROCESSING";

      default:
        return "PROCESSING";
    }
  }

  // ============================================================
  // INITIATE PAYMENT
  // ============================================================

  async initiatePayment({
    payment,
    amount,
    currency,
    idempotencyKey,
    phone,
    metadata = {},
  }: InitiatePaymentParams): Promise<PaymentResult> {
    this.ensureConfigured();

    if (
      String(currency).toUpperCase() !==
      "XAF"
    ) {
      throw new Error(
        "OpenPay accepte actuellement les paiements en XAF."
      );
    }

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      throw new Error(
        "Le montant du paiement est invalide."
      );
    }

    if (
      !Number.isInteger(
        numericAmount
      )
    ) {
      throw new Error(
        "Le montant OpenPay doit être un nombre entier."
      );
    }

    if (
      numericAmount % 5 !== 0
    ) {
      throw new Error(
        "Le montant OpenPay doit être un multiple de 5 XAF."
      );
    }

    const operator =
      this.resolveOperator(
        metadata
      );

    const normalizedPhone =
      this.normalizePhone(
        phone || payment.phone
      );

    const openPayMetadata = {
      ...metadata,

      bibsaasPaymentId:
        payment.id,

      transactionReference:
        payment.transactionReference,

      idempotencyKey,
    };

    const body = {
      amount: numericAmount,

      payment_phone_number:
        normalizedPhone,

      customer_external_id:
        payment.userId,

      customer: {
        phone:
          normalizedPhone,
      },

      provider: operator,

      metadata:
        openPayMetadata,
    };

    const response =
      await this.request<OpenPayResponse>(
        "/v1/transaction/payment",
        {
          method: "POST",

          body:
            JSON.stringify(body),
        }
      );

    if (!response.reference) {
      throw new Error(
        response.message ||
          "OpenPay n'a pas retourné de référence de transaction."
      );
    }

    const status =
      this.mapStatus(
        response.status
      );

    return {
      status,

      providerPaymentId:
        response.reference,

      providerTransactionId:
        response.reference,

      providerStatus:
        response.status ||
        "pending",

      instructions:
        response.message ||
        "Validez le paiement Mobile Money sur votre téléphone.",
    };
  }

  // ============================================================
  // VERIFY PAYMENT
  // ============================================================

  async verifyPayment(
    payment: any
  ): Promise<PaymentResult> {
    this.ensureConfigured();

    const reference =
      payment.providerTransactionId ||
      payment.providerPaymentId;

    if (!reference) {
      throw new Error(
        "La référence OpenPay est absente."
      );
    }

    const response =
      await this.request<OpenPayResponse>(
        `/v1/transaction/status/${encodeURIComponent(
          reference
        )}`,
        {
          method: "GET",
        }
      );

    const status =
      this.mapStatus(
        response.status
      );

    return {
      status,

      providerPaymentId:
        response.reference ||
        reference,

      providerTransactionId:
        response.reference ||
        reference,

      providerStatus:
        response.status ||
        "unknown",
    };
  }

  // ============================================================
  // WEBHOOK
  // ============================================================

  async handleWebhook({
    body,
  }: WebhookParams): Promise<WebhookResult | null> {
    if (!body) {
      throw new Error(
        "Payload OpenPay manquant."
      );
    }

    const reference =
      body.reference;

    if (!reference) {
      throw new Error(
        "Référence OpenPay manquante dans le webhook."
      );
    }

    const status =
      this.mapStatus(
        body.status
      );

    const metadata =
      body.metadata &&
      typeof body.metadata === "object"
        ? body.metadata
        : {};

    const transactionReference =
      typeof metadata.transactionReference ===
        "string"
        ? metadata.transactionReference
        : undefined;

    const amount =
      body.amount !== undefined
        ? Number(body.amount)
        : undefined;

    if (
      amount !== undefined &&
      !Number.isFinite(amount)
    ) {
      throw new Error(
        "Montant OpenPay invalide dans le webhook."
      );
    }

    return {
      providerTransactionId:
        reference,

      providerEventId:
        `openpay:${reference}:${String(
          body.status || ""
        ).toLowerCase()}`,

      transactionReference,

      status,

      amount,

      currency:
        body.currency ||
        "XAF",

      providerStatus:
        body.status ||
        "unknown",

      payload: body,

      /*
       * OpenPay documente actuellement
       * le callback JSON mais pas de
       * signature cryptographique dans
       * le payload documenté.
       */
      signatureVerified: false,
    };
  }
}

export default OpenPayProvider;