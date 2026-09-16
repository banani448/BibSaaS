import { supabaseAdmin } from './database';

export class StorageService {
  static async uploadFile(
    bucket: string,
    path: string,
    file: Buffer,
    contentType: string
  ) {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw error;
    }

    return data;
  }

  static getPublicUrl(bucket: string, path: string) {
    const { data } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  static async deleteFile(bucket: string, path: string) {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }

    return true;
  }
}