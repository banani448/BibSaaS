
/**
 * ============================================================
 * BibSaaS — Supabase Configuration
 * ============================================================
 *
 * File:
 * config/supabase.ts
 *
 * Stack:
 * - Node.js
 * - TypeScript
 * - Supabase
 * - PostgreSQL
 * - Supabase Auth
 * - Supabase Storage
 * - Supabase Realtime
 *
 * Responsabilités :
 * - Initialisation du client Supabase
 * - Configuration centralisée
 * - Auth server-side
 * - Storage
 * - Realtime
 * - Vérification de connexion
 * - Validation des variables d'environnement
 * - Protection des clés secrètes
 *
 * IMPORTANT :
 * Ce fichier est destiné au BACKEND.
 *
 * Ne jamais exposer SUPABASE_SERVICE_ROLE_KEY
 * au frontend.
 *
 * ============================================================
 */

import {
  createClient,
  SupabaseClient,
} from "@supabase/supabase-js";

/**
 * ============================================================
 * ENVIRONMENT
 * ============================================================
 */

const NODE_ENV =
  process.env.NODE_ENV ??
  "development";

const isProduction =
  NODE_ENV ===
  "production";

/**
 * ============================================================
 * ENV HELPERS
 * ============================================================
 */

function getRequiredEnv(
  name: string,
): string {
  const value =
    process.env[name];

  if (
    !value ||
    value.trim() === ""
  ) {
    throw new Error(
      `[SUPABASE] Missing required environment variable: ${name}`,
    );
  }

  return value.trim();
}

/**
 * ============================================================
 * SUPABASE CONFIGURATION
 * ============================================================
 */

export const SUPABASE_CONFIG = {
  /**
   * URL du projet Supabase.
   *
   * Exemple :
   * https://xxxxxxxx.supabase.co
   */
  url:
    getRequiredEnv(
      "SUPABASE_URL",
    ),

  /**
   * Clé service-role.
   *
   * BACKEND UNIQUEMENT.
   *
   * Ne jamais envoyer cette clé au frontend.
   */
  serviceRoleKey:
    getRequiredEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
    ),

  /**
   * Clé publique.
   *
   * Utile si certains services backend doivent utiliser
   * le même client public que le frontend.
   */
  anonKey:
    process.env
      .SUPABASE_ANON_KEY ??
    "",

  /**
   * Bucket principal pour les fichiers BibSaaS.
   */
  storageBucket:
    process.env
      .SUPABASE_STORAGE_BUCKET ??
    "bibsaas",

  /**
   * Bucket destiné aux analyses de visage.
   *
   * RECOMMANDATION :
   * protéger fortement les accès à ce bucket.
   */
  faceAnalysisBucket:
    process.env
      .SUPABASE_FACE_ANALYSIS_BUCKET ??
    "face-analysis",

  /**
   * Bucket destiné aux avatars.
   */
  avatarsBucket:
    process.env
      .SUPABASE_AVATARS_BUCKET ??
    "avatars",

  /**
   * Bucket destiné aux documents.
   */
  documentsBucket:
    process.env
      .SUPABASE_DOCUMENTS_BUCKET ??
    "documents",

  /**
   * Durée par défaut des URLs signées.
   */
  signedUrlExpiration:
    Number(
      process.env
        .SUPABASE_SIGNED_URL_EXPIRATION ??
        3600,
    ),

  /**
   * Timeout réseau.
   */
  requestTimeoutMs:
    Number(
      process.env
        .SUPABASE_REQUEST_TIMEOUT_MS ??
        15000,
    ),
} as const;

/**
 * ============================================================
 * VALIDATE CONFIGURATION
 * ============================================================
 */

function validateSupabaseConfiguration(): void {
  if (
    !SUPABASE_CONFIG.url.startsWith(
      "https://",
    ) &&
    !SUPABASE_CONFIG.url.startsWith(
      "http://",
    )
  ) {
    throw new Error(
      "[SUPABASE] SUPABASE_URL must be a valid HTTP(S) URL.",
    );
  }

  if (
    SUPABASE_CONFIG.serviceRoleKey.length <
    20
  ) {
    throw new Error(
      "[SUPABASE] SUPABASE_SERVICE_ROLE_KEY appears to be invalid.",
    );
  }

  if (
    SUPABASE_CONFIG.signedUrlExpiration <=
    0
  ) {
    throw new Error(
      "[SUPABASE] SUPABASE_SIGNED_URL_EXPIRATION must be greater than zero.",
    );
  }

  if (
    SUPABASE_CONFIG.requestTimeoutMs <=
    0
  ) {
    throw new Error(
      "[SUPABASE] SUPABASE_REQUEST_TIMEOUT_MS must be greater than zero.",
    );
  }
}

validateSupabaseConfiguration();

/**
 * ============================================================
 * SUPABASE CLIENT OPTIONS
 * ============================================================
 */

const SUPABASE_CLIENT_OPTIONS = {
  auth: {
    /**
     * Le backend ne doit pas persister les sessions
     * dans localStorage.
     */
    persistSession: false,

    /**
     * Le backend n'a pas besoin du refresh automatique
     * d'une session utilisateur.
     */
    autoRefreshToken: false,

    /**
     * Important côté serveur.
     */
    detectSessionInUrl: false,
  },
};

/**
 * ============================================================
 * SERVER CLIENT
 * ============================================================
 *
 * Client privilégié pour les opérations backend.
 *
 * Il utilise la service role key.
 *
 * ATTENTION :
 * Ce client contourne les RLS.
 *
 * Il doit donc être utilisé uniquement avec des contrôles
 * d'autorisation côté backend.
 * ============================================================
 */

export const supabaseAdmin: SupabaseClient =
  createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.serviceRoleKey,
    SUPABASE_CLIENT_OPTIONS,
  );

/**
 * ============================================================
 * PUBLIC CLIENT
 * ============================================================
 *
 * Créé uniquement lorsque SUPABASE_ANON_KEY est disponible.
 *
 * Ce client respecte les politiques RLS.
 * ============================================================
 */

export const supabasePublic: SupabaseClient | null =
  SUPABASE_CONFIG.anonKey
    ? createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.anonKey,
        SUPABASE_CLIENT_OPTIONS,
      )
    : null;

/**
 * ============================================================
 * DEFAULT CLIENT
 * ============================================================
 *
 * Pour le backend BibSaaS, le client admin est exporté
 * par défaut.
 * ============================================================
 */

export const supabase =
  supabaseAdmin;

/**
 * ============================================================
 * AUTH HELPERS
 * ============================================================
 */

/**
 * Récupérer un utilisateur Supabase par son ID.
 */
export async function getSupabaseUser(
  userId: string,
) {
  if (
    !userId ||
    userId.trim() === ""
  ) {
    throw new Error(
      "[SUPABASE] userId is required.",
    );
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin.auth.admin.getUserById(
      userId,
    );

  if (error) {
    throw error;
  }

  return data.user;
}

/**
 * Créer un utilisateur Supabase.
 */
export async function createSupabaseUser(
  input: {
    email: string;

    password?: string;

    phone?: string;

    emailConfirm?: boolean;

    phoneConfirm?: boolean;

    userMetadata?: Record<
      string,
      unknown
    >;
  },
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin.auth.admin.createUser(
      {
        email:
          input.email,

        password:
          input.password,

        phone:
          input.phone,

        email_confirm:
          input.emailConfirm ??
          false,

        phone_confirm:
          input.phoneConfirm ??
          false,

        user_metadata:
          input.userMetadata,
      },
    );

  if (error) {
    throw error;
  }

  return data.user;
}

/**
 * Supprimer un utilisateur Supabase.
 */
export async function deleteSupabaseUser(
  userId: string,
): Promise<void> {
  if (
    !userId ||
    userId.trim() === ""
  ) {
    throw new Error(
      "[SUPABASE] userId is required.",
    );
  }

  const {
    error,
  } =
    await supabaseAdmin.auth.admin.deleteUser(
      userId,
    );

  if (error) {
    throw error;
  }
}

/**
 * ============================================================
 * AUTH TOKEN VERIFICATION
 * ============================================================
 *
 * Vérifie un access token Supabase.
 *
 * Cette fonction ne remplace pas ton système JWT BibSaaS.
 * Elle est utile lorsque certaines routes utilisent
 * directement Supabase Auth.
 * ============================================================
 */

export async function verifySupabaseAccessToken(
  accessToken: string,
) {
  if (
    !accessToken ||
    accessToken.trim() === ""
  ) {
    throw new Error(
      "[SUPABASE] Access token is required.",
    );
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin.auth.getUser(
      accessToken,
    );

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error(
      "[SUPABASE] Invalid access token.",
    );
  }

  return data.user;
}

/**
 * ============================================================
 * STORAGE HELPERS
 * ============================================================
 */

/**
 * Vérifie l'existence d'un bucket.
 */
export async function storageBucketExists(
  bucketName: string,
): Promise<boolean> {
  const {
    data,
    error,
  } =
    await supabaseAdmin.storage.listBuckets();

  if (error) {
    throw error;
  }

  return Boolean(
    data?.some(
      (bucket) =>
        bucket.name ===
        bucketName,
    ),
  );
}

/**
 * Créer un bucket.
 */
export async function createStorageBucket(
  bucketName: string,
  options?: {
    public?: boolean;
    fileSizeLimit?: number;
    allowedMimeTypes?: string[];
  },
) {
  if (
    !bucketName ||
    bucketName.trim() === ""
  ) {
    throw new Error(
      "[SUPABASE] Bucket name is required.",
    );
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin.storage.createBucket(
      bucketName,
      {
        public:
          options?.public ??
          false,

        fileSizeLimit:
          options?.fileSizeLimit,

        allowedMimeTypes:
          options?.allowedMimeTypes,
      },
    );

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Supprimer un bucket.
 */
export async function deleteStorageBucket(
  bucketName: string,
  emptyFirst = false,
): Promise<void> {
  if (
    emptyFirst
  ) {
    const {
      data,
      error,
    } =
      await supabaseAdmin.storage
        .from(bucketName)
        .list("", {
          limit: 1000,
        });

    if (error) {
      throw error;
    }

    if (
      data &&
      data.length > 0
    ) {
      const paths =
        data
          .map(
            (file) =>
              file.name,
          )
          .filter(Boolean);

      if (
        paths.length > 0
      ) {
        const {
          error:
            removeError,
        } =
          await supabaseAdmin.storage
            .from(bucketName)
            .remove(paths);

        if (removeError) {
          throw removeError;
        }
      }
    }
  }

  const {
    error,
  } =
    await supabaseAdmin.storage.deleteBucket(
      bucketName,
    );

  if (error) {
    throw error;
  }
}

/**
 * ============================================================
 * SIGNED URL
 * ============================================================
 */

export async function createSignedStorageUrl(
  bucketName: string,
  path: string,
  expiresIn =
    SUPABASE_CONFIG.signedUrlExpiration,
): Promise<string> {
  if (
    !bucketName ||
    !path
  ) {
    throw new Error(
      "[SUPABASE] bucketName and path are required.",
    );
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(
        path,
        expiresIn,
      );

  if (error) {
    throw error;
  }

  if (
    !data?.signedUrl
  ) {
    throw new Error(
      "[SUPABASE] Failed to create signed URL.",
    );
  }

  return data.signedUrl;
}

/**
 * ============================================================
 * PUBLIC URL
 * ============================================================
 */

export function getPublicStorageUrl(
  bucketName: string,
  path: string,
): string {
  if (
    !bucketName ||
    !path
  ) {
    throw new Error(
      "[SUPABASE] bucketName and path are required.",
    );
  }

  const {
    data,
  } =
    supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * ============================================================
 * STORAGE DELETE
 * ============================================================
 */

export async function deleteStorageFile(
  bucketName: string,
  path: string,
): Promise<void> {
  if (
    !bucketName ||
    !path
  ) {
    throw new Error(
      "[SUPABASE] bucketName and path are required.",
    );
  }

  const {
    error,
  } =
    await supabaseAdmin.storage
      .from(bucketName)
      .remove([path]);

  if (error) {
    throw error;
  }
}

/**
 * ============================================================
 * STORAGE DOWNLOAD
 * ============================================================
 */

export async function downloadStorageFile(
  bucketName: string,
  path: string,
): Promise<Buffer> {
  if (
    !bucketName ||
    !path
  ) {
    throw new Error(
      "[SUPABASE] bucketName and path are required.",
    );
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin.storage
      .from(bucketName)
      .download(path);

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "[SUPABASE] Storage file not found.",
    );
  }

  const arrayBuffer =
    await data.arrayBuffer();

  return Buffer.from(
    arrayBuffer,
  );
}

/**
 * ============================================================
 * REALTIME CHANNEL
 * ============================================================
 */

export function createRealtimeChannel(
  channelName: string,
) {
  if (
    !channelName ||
    channelName.trim() === ""
  ) {
    throw new Error(
      "[SUPABASE] Channel name is required.",
    );
  }

  return supabaseAdmin.channel(
    channelName,
  );
}

/**
 * ============================================================
 * REALTIME REMOVE CHANNEL
 * ============================================================
 */

export async function removeRealtimeChannel(
  channel: ReturnType<
    SupabaseClient["channel"]
  >,
): Promise<void> {
  await supabaseAdmin.removeChannel(
    channel,
  );
}

/**
 * ============================================================
 * SUPABASE HEALTH CHECK
 * ============================================================
 *
 * On vérifie que l'API Supabase répond.
 *
 * ============================================================
 */

export async function checkSupabaseHealth(): Promise<{
  healthy: boolean;

  latencyMs: number;

  timestamp: string;

  error?: string;
}> {
  const startedAt =
    Date.now();

  try {
    /**
     * Appel léger à l'API Auth.
     *
     * Une erreur d'authentification d'une requête
     * inexistante ne signifie pas nécessairement que
     * Supabase est hors ligne.
     *
     * L'appel listUsers permet ici de tester réellement
     * l'accès Admin.
     */
    const {
      error,
    } =
      await supabaseAdmin.auth.admin.listUsers(
        {
          page: 1,

          perPage: 1,
        },
      );

    if (error) {
      throw error;
    }

    return {
      healthy: true,

      latencyMs:
        Date.now() -
        startedAt,

      timestamp:
        new Date().toISOString(),
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return {
      healthy: false,

      latencyMs:
        Date.now() -
        startedAt,

      timestamp:
        new Date().toISOString(),

      error: message,
    };
  }
}

/**
 * ============================================================
 * SUPABASE STATUS
 * ============================================================
 */

export async function getSupabaseStatus(): Promise<{
  connected: boolean;

  latencyMs: number;

  environment: string;

  projectUrl: string;

  timestamp: string;

  error?: string;
}> {
  const health =
    await checkSupabaseHealth();

  return {
    connected:
      health.healthy,

    latencyMs:
      health.latencyMs,

    environment:
      NODE_ENV,

    projectUrl:
      SUPABASE_CONFIG.url,

    timestamp:
      health.timestamp,

    ...(health.error
      ? {
          error:
            health.error,
        }
      : {}),
  };
}

/**
 * ============================================================
 * CONFIGURATION HEALTH
 * ============================================================
 */

export function getSupabaseConfiguration() {
  return {
    environment:
      NODE_ENV,

    url:
      SUPABASE_CONFIG.url,

    hasServiceRoleKey:
      Boolean(
        SUPABASE_CONFIG
          .serviceRoleKey,
      ),

    hasAnonKey:
      Boolean(
        SUPABASE_CONFIG
          .anonKey,
      ),

    storageBucket:
      SUPABASE_CONFIG
        .storageBucket,

    faceAnalysisBucket:
      SUPABASE_CONFIG
        .faceAnalysisBucket,

    avatarsBucket:
      SUPABASE_CONFIG
        .avatarsBucket,

    documentsBucket:
      SUPABASE_CONFIG
        .documentsBucket,

    signedUrlExpiration:
      SUPABASE_CONFIG
        .signedUrlExpiration,
  };
}

/**
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default supabaseAdmin;
