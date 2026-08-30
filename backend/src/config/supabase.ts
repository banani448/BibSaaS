import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from './env';

/**
 * Supabase client for server-side operations
 * Uses service role key for admin operations
 */
const supabase: SupabaseClient = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Supabase client for client-side operations
 * Uses anon key for public operations
 */
const supabaseAnon: SupabaseClient = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

/**
 * Storage buckets configuration
 */
const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  HAIRSTYLES: 'hairstyles',
  SALONS: 'salons',
  FACE_ANALYSIS: 'face-analysis',
  INVOICES: 'invoices',
  DOCUMENTS: 'documents',
} as const;

/**
 * Get public URL for a file in a bucket
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string
): Promise<{ path: string; error?: string }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    return { path: '', error: error.message };
  }

  return { path: data.path };
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(bucket: string, path: string): Promise<{ error?: string }> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    return { error: error.message };
  }

  return {};
}

/**
 * Check if bucket exists, create if not
 */
export async function ensureBucket(bucket: string): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === bucket);

  if (!bucketExists) {
    await supabase.storage.createBucket(bucket, {
      public: true,
    });
  }
}

export { supabase, supabaseAnon, STORAGE_BUCKETS };
