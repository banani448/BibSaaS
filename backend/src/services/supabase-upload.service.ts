import { randomUUID } from 'crypto';
import sharp from 'sharp';

import prisma from '../config/prisma';
import storageService from './supabase-storage.service';
import realtimeService from './supabase-realtime.service';

class SupabaseUploadService {
  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('File required');
    }

    const optimized = await sharp(file.buffer)
      .resize(512, 512)
      .jpeg({
        quality: 85,
      })
      .toBuffer();

    const result = await storageService.uploadAvatar(
      userId,
      optimized,
      'image/jpeg',
    );

    if (!result.success) {
      throw new Error(result.error?.message);
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        profile: {
          update: {
            avatarUrl: result.publicUrl,
          },
        },
      },
    });

    await realtimeService.broadcast(
      `bibsaas:user:${userId}`,
      'avatar.updated',
      {
        avatar: result.publicUrl,
      },
    );

    return user;
  }

  async uploadFaceAnalysis(
    userId: string,
    file: Express.Multer.File,
  ) {
    const analysisId = randomUUID();

    const image = await sharp(file.buffer)
      .jpeg({
        quality: 90,
      })
      .toBuffer();

    const upload = await storageService.uploadFaceAnalysis(
      userId,
      analysisId,
      image,
      'image/jpeg',
    );

    if (!upload.success) {
      throw new Error(upload.error?.message);
    }

    const analysis = await prisma.faceAnalysis.create({
      data: {
        id: analysisId,
        userId,
        imageUrl: upload.path || '',
        status: 'PENDING',
      },
    });

    await realtimeService.broadcast(
      `bibsaas:user:${userId}`,
      'analysis.created',
      analysis,
    );

    return analysis;
  }

  async uploadHairstyle(
    hairstyleId: string,
    file: Express.Multer.File,
  ) {
    const optimized = await sharp(file.buffer)
      .webp({
        quality: 90,
      })
      .toBuffer();

    return storageService.uploadHairstyle(
      hairstyleId,
      optimized,
      'image/webp',
    );
  }
}

export default new SupabaseUploadService();