
// src/services/supabase-storage.service.ts

import {
  createClient,
  SupabaseClient,
} from "@supabase/supabase-js";

/**
 * ============================================================
 * SUPABASE STORAGE SERVICE - BibSaaS Premium
 * ============================================================
 */

export type StorageFolder =
  | "avatars"
  | "face-analyses"
  | "hairstyles"
  | "salons"
  | "barbers"
  | "documents"
  | "temporary";

export type UploadVisibility =
  | "public"
  | "private";

export interface StorageUploadOptions {
  bucket?: string;
  folder?: StorageFolder | string;
  fileName?: string;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
  visibility?: UploadVisibility;
  userId?: string;
  metadata?: Record<string, string>;
}

export interface StorageUploadResult {
  success: boolean;
  bucket: string;
  path?: string;
  fileName?: string;
  publicUrl?: string;
  error?: {
    code?: string;
    message: string;
  };
}

export interface SignedUrlResult {
  success: boolean;
  url?: string;
  expiresIn?: number;
  error?: {
    code?: string;
    message: string;
  };
}

export interface StorageFile {
  name: string;
  id?: string;
  updatedAt?: string;
  createdAt?: string;
  lastAccessedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface StorageConfig {
  enabled: boolean;
  url: string;
  bucket: string;
  serviceRoleConfigured: boolean;
  anonKeyConfigured: boolean;
  maxFileSizeMB: number;
  signedUrlExpiration: number;
}

export class SupabaseStorageServiceError extends Error {
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    options?: {
      code?: string;
      details?: unknown;
    },
  ) {
    super(message);

    this.name =
      "SupabaseStorageServiceError";

    this.code =
      options?.code;

    this.details =
      options?.details;

    Object.setPrototypeOf(
      this,
      SupabaseStorageServiceError.prototype,
    );
  }
}

class SupabaseStorageService {
  private readonly supabase: SupabaseClient;

  private readonly config: {
    enabled: boolean;
    url: string;
    serviceRoleKey: string;
    anonKey: string;
    bucket: string;
    maxFileSizeMB: number;
    signedUrlExpiration: number;
  };

  private readonly allowedImageTypes =
    new Set([
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ]);

  private readonly allowedDocumentTypes =
    new Set([
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ]);

  constructor() {
    const url =
      process.env.SUPABASE_URL ||
      "";

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "";

    const anonKey =
      process.env.SUPABASE_ANON_KEY ||
      "";

    const bucket =
      process.env.SUPABASE_STORAGE_BUCKET ||
      "bibsaas-storage";

    const enabled =
      this.getBoolean(
        process.env.SUPABASE_STORAGE_ENABLED,
        true,
      );

    const maxFileSizeMB =
      Number(
        process.env.SUPABASE_STORAGE_MAX_FILE_SIZE_MB,
      ) || 10;

    const signedUrlExpiration =
      Number(
        process.env.SUPABASE_STORAGE_SIGNED_URL_EXPIRATION,
      ) || 3600;

    this.config = {
      enabled,
      url,
      serviceRoleKey,
      anonKey,
      bucket,
      maxFileSizeMB,
      signedUrlExpiration,
    };

    const key =
      serviceRoleKey ||
      anonKey;

    this.supabase =
      createClient(
        url,
        key,
        {
          auth: {
            autoRefreshToken:
              false,
            persistSession:
              false,
            detectSessionInUrl:
              false,
          },
        },
      );
  }

  public getConfig(): StorageConfig {
    return {
      enabled:
        this.config.enabled,

      url:
        this.config.url,

      bucket:
        this.config.bucket,

      serviceRoleConfigured:
        Boolean(
          this.config.serviceRoleKey,
        ),

      anonKeyConfigured:
        Boolean(
          this.config.anonKey,
        ),

      maxFileSizeMB:
        this.config.maxFileSizeMB,

      signedUrlExpiration:
        this.config.signedUrlExpiration,
    };
  }

  public isConfigured(): boolean {
    return Boolean(
      this.config.enabled &&
        this.config.url &&
        (
          this.config.serviceRoleKey ||
          this.config.anonKey
        ),
    );
  }

  public getClient(): SupabaseClient {
    return this.supabase;
  }

  public getBucket(): string {
    return this.config.bucket;
  }

// ==========================================================
// BUCKET
// ==========================================================

/**
 * Vérifie que le bucket existe.
 */
public async bucketExists(
  bucketName = this.config.bucket,
): Promise<boolean> {
  try {
    const {
      data,
      error,
    } =
      await this.supabase.storage
        .listBuckets();

    if (error) {
      throw this.toServiceError(
        error,
        "Impossible de récupérer les buckets.",
      );
    }

    return Boolean(
      data?.some(
        (bucket) =>
          bucket.name ===
          bucketName,
      ),
    );
  } catch (error) {
    throw this.toServiceError(
      error,
      "Erreur lors de la vérification du bucket.",
    );
  }
}

// ==========================================================
// UPLOAD BUFFER
// ==========================================================

public async uploadBuffer(
  buffer: Buffer,
  options: StorageUploadOptions,
): Promise<StorageUploadResult> {
  if (!Buffer.isBuffer(buffer)) {
    throw new SupabaseStorageServiceError(
      "Buffer invalide.",
      {
        code:
          "INVALID_BUFFER",
      },
    );
  }

  if (buffer.length === 0) {
    throw new SupabaseStorageServiceError(
      "Fichier vide.",
      {
        code:
          "EMPTY_FILE",
      },
    );
  }

  this.validateFileSize(
    buffer.length,
  );

  const contentType =
    options.contentType ||
    "application/octet-stream";

  this.validateContentType(
    contentType,
    options.folder,
  );

  const path =
    this.generatePath(
      options,
    );

  return this.upload(
    buffer,
    path,
    {
      bucket:
        options.bucket ||
        this.config.bucket,

      contentType,

      cacheControl:
        options.cacheControl ||
        "3600",

      upsert:
        options.upsert ??
        false,
    },
  );
}

// ==========================================================
// UPLOAD GÉNÉRIQUE
// ==========================================================

public async upload(
  file:
    | Buffer
    | Uint8Array
    | ArrayBuffer,

  path: string,

  options?: {
    bucket?: string;
    contentType?: string;
    cacheControl?: string;
    upsert?: boolean;
  },
): Promise<StorageUploadResult> {
  this.ensureEnabled();

  this.validatePath(
    path,
  );

  const bucket =
    options?.bucket ||
    this.config.bucket;

  const body =
    file instanceof ArrayBuffer
      ? new Uint8Array(file)
      : file;

  const size =
    body instanceof Buffer
      ? body.length
      : body.byteLength;

  this.validateFileSize(
    size,
  );

  try {
    const {
      data,
      error,
    } =
      await this.supabase.storage
        .from(bucket)
        .upload(
          path,
          body,
          {
            contentType:
              options?.contentType,

            cacheControl:
              options?.cacheControl ||
              "3600",

            upsert:
              options?.upsert ??
              false,
          },
        );

    if (error) {
      throw this.toServiceError(
        error,
        "Échec de l'upload.",
      );
    }

    const publicUrl =
      await this.getPublicUrl(
        data.path,
        bucket,
      );

    return {
      success:
        true,

      bucket,

      path:
        data.path,

      fileName:
        data.path
          .split("/")
          .pop(),

      publicUrl:
        publicUrl || undefined,
    };
  } catch (error) {
    const normalized =
      this.normalizeError(
        error,
      );

    return {
      success:
        false,

      bucket,

      error: {
        code:
          normalized.code,

        message:
          normalized.message,
      },
    };
  }
}

// ==========================================================
// AVATAR
// ==========================================================

public async uploadAvatar(
  userId: string,
  buffer: Buffer,
  contentType: string,
): Promise<StorageUploadResult> {
  this.validateUserId(
    userId,
  );

  this.validateImageType(
    contentType,
  );

  const extension =
    this.extensionFromMime(
      contentType,
    );

  const path =
    `avatars/${this.sanitizeSegment(
      userId,
    )}/avatar.${extension}`;

  return this.upload(
    buffer,
    path,
    {
      contentType,
      cacheControl:
        "86400",
      upsert:
        true,
    },
  );
}

// ==========================================================
// FACE ANALYSIS
// ==========================================================

public async uploadFaceAnalysis(
  userId: string,
  analysisId: string,
  buffer: Buffer,
  contentType: string,
): Promise<StorageUploadResult> {
  this.validateUserId(
    userId,
  );

  this.validateId(
    analysisId,
    "analysisId",
  );

  this.validateImageType(
    contentType,
  );

  const extension =
    this.extensionFromMime(
      contentType,
    );

  const path =
    `face-analyses/${this.sanitizeSegment(
      userId,
    )}/${this.sanitizeSegment(
      analysisId,
    )}.${extension}`;

  return this.upload(
    buffer,
    path,
    {
      contentType,

      cacheControl:
        "private, max-age=3600",

      upsert:
        false,
    },
  );
}

// ==========================================================
// HAIRSTYLE
// ==========================================================

public async uploadHairstyle(
  hairstyleId: string,
  buffer: Buffer,
  contentType: string,
): Promise<StorageUploadResult> {
  this.validateId(
    hairstyleId,
    "hairstyleId",
  );

  this.validateImageType(
    contentType,
  );

  const extension =
    this.extensionFromMime(
      contentType,
    );

  const path =
    `hairstyles/${this.sanitizeSegment(
      hairstyleId,
    )}/image.${extension}`;

  return this.upload(
    buffer,
    path,
    {
      contentType,

      cacheControl:
        "86400",

      upsert:
        true,
    },
  );
}
// ==========================================================
// PUBLIC URL
// ==========================================================

public async getPublicUrl(
  path: string,
  bucket = this.config.bucket,
): Promise<string | null> {
  this.validatePath(path);

  try {
    const { data } =
      this.supabase.storage
        .from(bucket)
        .getPublicUrl(path);

    return (
      data.publicUrl ||
      null
    );
  } catch {
    return null;
  }
}

// ==========================================================
// SIGNED URL
// ==========================================================

public async createSignedUrl(
  path: string,

  expiresIn =
    this.config
      .signedUrlExpiration,

  bucket =
    this.config.bucket,
): Promise<SignedUrlResult> {
  this.ensureEnabled();

  this.validatePath(path);

  if (
    !Number.isInteger(
      expiresIn,
    ) ||
    expiresIn <= 0
  ) {
    throw new SupabaseStorageServiceError(
      "Durée invalide.",
      {
        code:
          "INVALID_EXPIRATION",
      },
    );
  }

  try {
    const {
      data,
      error,
    } =
      await this.supabase.storage
        .from(bucket)
        .createSignedUrl(
          path,
          expiresIn,
        );

    if (error) {
      throw this.toServiceError(
        error,
        "Impossible de créer l'URL signée.",
      );
    }

    return {
      success:
        true,

      url:
        data.signedUrl,

      expiresIn,
    };
  } catch (error) {
    const normalized =
      this.normalizeError(
        error,
      );

    return {
      success:
        false,

      error: {
        code:
          normalized.code,

        message:
          normalized.message,
      },
    };
  }
}

// ==========================================================
// MULTIPLE SIGNED URLS
// ==========================================================

public async createSignedUrls(
  paths: string[],

  expiresIn =
    this.config
      .signedUrlExpiration,

  bucket =
    this.config.bucket,
) {
  this.ensureEnabled();

  paths.forEach(
    (path) =>
      this.validatePath(
        path,
      ),
  );

  try {
    const {
      data,
      error,
    } =
      await this.supabase.storage
        .from(bucket)
        .createSignedUrls(
          paths,
          expiresIn,
        );

    if (error) {
      throw this.toServiceError(
        error,
        "Impossible de créer les URLs signées.",
      );
    }

    return (
      data?.map(
        (
          item,
          index,
        ) => ({
          path:
            paths[index],

          signedUrl:
            item.signedUrl,
        }),
      ) || []
    );
  } catch (error) {
    const normalized =
      this.normalizeError(
        error,
      );

    return paths.map(
      (path) => ({
        path,
        error:
          normalized.message,
      }),
    );
  }
}

// ==========================================================
// DOWNLOAD
// ==========================================================

public async download(
  path: string,

  bucket =
    this.config.bucket,
): Promise<Buffer> {
  this.ensureEnabled();

  this.validatePath(path);

  try {
    const {
      data,
      error,
    } =
      await this.supabase.storage
        .from(bucket)
        .download(
          path,
        );

    if (error) {
      throw this.toServiceError(
        error,
        "Téléchargement impossible.",
      );
    }

    if (!data) {
      throw new SupabaseStorageServiceError(
        "Aucune donnée reçue.",
        {
          code:
            "EMPTY_DOWNLOAD",
        },
      );
    }

    const arrayBuffer =
      await data.arrayBuffer();

    return Buffer.from(
      arrayBuffer,
    );
  } catch (error) {
    throw this.toServiceError(
      error,
      "Erreur téléchargement.",
    );
  }
}

// ==========================================================
// DELETE
// ==========================================================

public async delete(
  path: string,

  bucket =
    this.config.bucket,
): Promise<boolean> {
  this.ensureEnabled();

  this.validatePath(path);

  try {
    const {
      error,
    } =
      await this.supabase.storage
        .from(bucket)
        .remove([
          path,
        ]);

    if (error) {
      throw this.toServiceError(
        error,
        "Suppression impossible.",
      );
    }

    return true;
  } catch (
    error
  ) {
    console.error(
      "[Storage Delete]",
      error,
    );

    return false;
  }
}

// ==========================================================
// DELETE MANY
// ==========================================================

public async deleteMany(
  paths: string[],

  bucket =
    this.config.bucket,
): Promise<boolean> {
  this.ensureEnabled();

  if (
    !paths.length
  ) {
    return true;
  }

  paths.forEach(
    (path) =>
      this.validatePath(
        path,
      ),
  );

  try {
    const {
      error,
    } =
      await this.supabase.storage
        .from(bucket)
        .remove(
          paths,
        );

    if (error) {
      throw this.toServiceError(
        error,
        "Suppression multiple impossible.",
      );
    }

    return true;
  } catch (
    error
  ) {
    console.error(
      "[Storage DeleteMany]",
      error,
    );

    return false;
  }
}

// ==========================================================
// EXISTS
// ==========================================================

public async exists(
  path: string,

  bucket =
    this.config.bucket,
): Promise<boolean> {
  this.ensureEnabled();

  this.validatePath(path);

  const parts =
    path.split("/");

  const fileName =
    parts.pop();

  if (!fileName) {
    return false;
  }

  const directory =
    parts.join("/");

  try {
    const {
      data,
      error,
    } =
      await this.supabase.storage
        .from(bucket)
        .list(
          directory,
          {
            search:
              fileName,
            limit:
              100,
          },
        );

    if (error) {
      return false;
    }

    return Boolean(
      data?.some(
        (file) =>
          file.name ===
          fileName,
      ),
    );
  } catch {
    return false;
  }
}
// ==========================================================
// LIST
// ==========================================================

public async list(
  folder = "",
  bucket = this.config.bucket,
): Promise<StorageFile[]> {
  try {
    const { data, error } =
      await this.supabase.storage
        .from(bucket)
        .list(folder);

    if (error) {
      throw this.toServiceError(
        error,
        "Impossible de lister les fichiers.",
      );
    }

    return (
      data?.map((file) => ({
        name: file.name,
        ...(file.id ? { id: file.id } : {}),
        createdAt:
          file.created_at ?? undefined,
        updatedAt:
          file.updated_at ?? undefined,
        lastAccessedAt:
          file.last_accessed_at ?? undefined,
        metadata:
          file.metadata ?? undefined,
      })) || []
    );
  } catch (error) {
    throw this.toServiceError(
      error,
      "Erreur listing storage.",
    );
  }
}

// ==========================================================
// MOVE
// ==========================================================

public async move(
  fromPath: string,
  toPath: string,
  bucket = this.config.bucket,
): Promise<boolean> {
  try {
    const { error } =
      await this.supabase.storage
        .from(bucket)
        .move(
          fromPath,
          toPath,
        );

    if (error) {
      throw this.toServiceError(
        error,
        "Déplacement impossible.",
      );
    }

    return true;
  } catch {
    return false;
  }
}

// ==========================================================
// COPY
// ==========================================================

public async copy(
  fromPath: string,
  toPath: string,
  bucket = this.config.bucket,
): Promise<boolean> {
  try {
    const { error } =
      await this.supabase.storage
        .from(bucket)
        .copy(
          fromPath,
          toPath,
        );

    if (error) {
      throw this.toServiceError(
        error,
        "Copie impossible.",
      );
    }

    return true;
  } catch {
    return false;
  }
}

// ==========================================================
// DELETE USER FOLDER
// ==========================================================

public async deleteUserFolder(
  userId: string,
): Promise<boolean> {
  try {
    const folders = [
      `avatars/${userId}`,
      `face-analyses/${userId}`,
    ];

    for (const folder of folders) {
      const files =
        await this.list(
          folder,
        );

      const paths =
        files.map(
          (file) =>
            `${folder}/${file.name}`,
        );

      if (
        paths.length
      ) {
        await this.deleteMany(
          paths,
        );
      }
    }

    return true;
  } catch {
    return false;
  }
}

// ==========================================================
// HEALTH CHECK
// ==========================================================

public async healthCheck() {
  const bucketExists =
    await this.bucketExists();

  return {
    status:
      bucketExists
        ? "healthy"
        : "unhealthy",

    bucket:
      this.config.bucket,

    enabled:
      this.config.enabled,

    timestamp:
      new Date().toISOString(),
  };
}

// ==========================================================
// VALIDATIONS
// ==========================================================

private validateFileSize(
  size: number,
): void {
  const max =
    this.config.maxFileSizeMB *
    1024 *
    1024;

  if (size > max) {
    throw new SupabaseStorageServiceError(
      `Fichier trop volumineux. Maximum ${this.config.maxFileSizeMB}MB.`,
      {
        code:
          "FILE_TOO_LARGE",
      },
    );
  }
}

private validateImageType(
  mime: string,
): void {
  if (
    !this.allowedImageTypes.has(
      mime,
    )
  ) {
    throw new SupabaseStorageServiceError(
      `Type image non supporté : ${mime}`,
      {
        code:
          "INVALID_IMAGE_TYPE",
      },
    );
  }
}

private validateContentType(
  mime: string,
  folder?: string,
): void {
  if (
    folder ===
      "documents" &&
    !this.allowedDocumentTypes.has(
      mime,
    )
  ) {
    throw new SupabaseStorageServiceError(
      `Document non supporté : ${mime}`,
      {
        code:
          "INVALID_DOCUMENT_TYPE",
      },
    );
  }
}

// ==========================================================
// HELPERS
// ==========================================================

private generatePath(
  options: StorageUploadOptions,
): string {
  const folder =
    options.folder ||
    "temporary";

  const fileName =
    options.fileName ||
    this.generateFileName(
      options.contentType,
    );

  return `${folder}/${fileName}`;
}

private generateFileName(
  mime?: string,
): string {
  const ext =
    this.extensionFromMime(
      mime ||
        "application/octet-stream",
    );

  return `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 12)}.${ext}`;
}

private extensionFromMime(
  mime: string,
): string {
  const map: Record<
    string,
    string
  > = {
    "image/jpeg":
      "jpg",
    "image/jpg":
      "jpg",
    "image/png":
      "png",
    "image/webp":
      "webp",
    "application/pdf":
      "pdf",
  };

  return (
    map[mime] ||
    "bin"
  );
}

private sanitizeSegment(
  value: string,
): string {
  return value.replace(
    /[^a-zA-Z0-9-_]/g,
    "",
  );
}

private sanitizePath(
  value: string,
): string {
  return value.replace(
    /\.\./g,
    "",
  );
}

private sanitizeFileName(
  value: string,
): string {
  return value.replace(
    /[^a-zA-Z0-9._-]/g,
    "_",
  );
}

private validatePath(
  path: string,
): void {
  if (
    !path ||
    path.trim().length === 0
  ) {
    throw new SupabaseStorageServiceError(
      "Path invalide.",
      {
        code:
          "INVALID_PATH",
      },
    );
  }
}

private validateUserId(
  userId: string,
): void {
  if (
    !userId ||
    userId.trim().length === 0
  ) {
    throw new SupabaseStorageServiceError(
      "UserId invalide.",
      {
        code:
          "INVALID_USER_ID",
      },
    );
  }
}

private validateId(
  id: string,
  field: string,
): void {
  if (
    !id ||
    id.trim().length === 0
  ) {
    throw new SupabaseStorageServiceError(
      `${field} invalide.`,
      {
        code:
          "INVALID_ID",
      },
    );
  }
}

private ensureEnabled(): void {
  if (
    !this.config.enabled
  ) {
    throw new SupabaseStorageServiceError(
      "Storage désactivé.",
      {
        code:
          "STORAGE_DISABLED",
      },
    );
  }
}

private normalizeError(
  error: any,
) {
  return {
    code:
      error?.code ||
      "UNKNOWN_ERROR",

    message:
      error?.message ||
      "Erreur inconnue",
  };
}

private toServiceError(
  error: any,

  fallback: string,
): SupabaseStorageServiceError {
  return new SupabaseStorageServiceError(
    error?.message ||
      fallback,
    {
      code:
        error?.code,
      details:
        error,
    },
  );
}

private getBoolean(
  value:
    | string
    | undefined,

  defaultValue =
    false,
): boolean {
  if (
    value ===
      undefined
  ) {
    return defaultValue;
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
}

// ==========================================================
// EXPORTS
// ==========================================================

const supabaseStorageService =
  new SupabaseStorageService();

export default supabaseStorageService;

export {
  SupabaseStorageService,
};
