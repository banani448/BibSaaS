import { supabaseAdmin } from './database';

export const BUCKETS = {
  AVATARS: 'avatars',
  FACE_IMAGES: 'face-images',
  HAIRSTYLES: 'hairstyles',
  DOCUMENTS: 'documents',
  INVOICES: 'invoices',
};

export async function initializeBuckets() {
  const buckets = Object.values(BUCKETS);

  for (const bucket of buckets) {
    const { data } =
      await supabaseAdmin.storage.listBuckets();

    const exists = data?.find(
      (b) => b.name === bucket
    );

    if (!exists) {
      await supabaseAdmin.storage.createBucket(
        bucket,
        {
          public: true,
        }
      );
    }
  }
}