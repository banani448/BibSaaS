import prisma from '../config/prisma';
import AppError from '../utils/errors/app-error';
import recommendationService from './recommendation.service';

export interface SaveRecommendationParams {
  faceAnalysisId: string;
  hairstyleId: string;
  compatibilityScore?: number;
  explanation?: string;
  isFavorite?: boolean;
}

export class FaceAnalysisService {
  /**
   * Register a face analysis from an uploaded image.
   * The analysis is stored as PENDING: no AI provider is wired yet.
   */
  async analyzeFace(userId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new AppError('Image file is required', 400, 'IMAGE_REQUIRED');
    }

    return this.createAnalysis(userId, {
      imageStoragePath: file.path,
    });
  }

  /**
   * Register a face analysis from an image URL.
   */
  async analyzeFaceByUrl(userId: string, imageUrl?: string) {
    if (!imageUrl) {
      throw new AppError('imageUrl is required', 400, 'IMAGE_URL_REQUIRED');
    }

    return this.createAnalysis(userId, { imageUrl });
  }

  private async createAnalysis(
    userId: string,
    image: { imageUrl?: string; imageStoragePath?: string }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return prisma.faceAnalysis.create({
      data: {
        userId,
        imageUrl: image.imageUrl ?? null,
        imageStoragePath: image.imageStoragePath ?? null,
        status: 'PENDING',
      },
    });
  }

  /**
   * List the analyses of a user
   */
  async getUserAnalyses(userId: string) {
    return prisma.faceAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single analysis with its recommendations
   */
  async getAnalysisById(analysisId: string) {
    const analysis = await prisma.faceAnalysis.findUnique({
      where: { id: analysisId },
      include: {
        recommendations: {
          include: { hairstyle: true },
          orderBy: { compatibilityScore: 'desc' },
        },
      },
    });

    if (!analysis) {
      throw new AppError('Face analysis not found', 404, 'FACE_ANALYSIS_NOT_FOUND');
    }

    return analysis;
  }

  /**
   * Delete an analysis owned by the given user
   */
  async deleteAnalysis(analysisId: string, userId: string) {
    const analysis = await prisma.faceAnalysis.findUnique({
      where: { id: analysisId },
      select: { id: true, userId: true },
    });

    if (!analysis) {
      throw new AppError('Face analysis not found', 404, 'FACE_ANALYSIS_NOT_FOUND');
    }

    if (analysis.userId !== userId) {
      throw new AppError('You are not allowed to delete this analysis', 403, 'FORBIDDEN');
    }

    await prisma.faceAnalysis.delete({ where: { id: analysisId } });

    return { message: 'Analysis deleted successfully' };
  }

  /**
   * Recommendations attached to an analysis, generated on demand
   */
  async getRecommendations(analysisId: string) {
    const analysis = await prisma.faceAnalysis.findUnique({
      where: { id: analysisId },
      select: { id: true, userId: true },
    });

    if (!analysis) {
      throw new AppError('Face analysis not found', 404, 'FACE_ANALYSIS_NOT_FOUND');
    }

    const existing = await prisma.recommendation.findMany({
      where: { faceAnalysisId: analysisId },
      include: { hairstyle: true },
      orderBy: { compatibilityScore: 'desc' },
    });

    if (existing.length > 0) {
      return existing;
    }

    return recommendationService.generateRecommendations(analysis.userId, analysisId);
  }

  /**
   * Persist a recommendation chosen by the user
   */
  async saveRecommendation(userId: string, data: SaveRecommendationParams) {
    const { faceAnalysisId, hairstyleId, compatibilityScore, explanation, isFavorite } = data;

    if (!faceAnalysisId || !hairstyleId) {
      throw new AppError('faceAnalysisId and hairstyleId are required', 400, 'MISSING_FIELDS');
    }

    const analysis = await prisma.faceAnalysis.findUnique({
      where: { id: faceAnalysisId },
      select: { id: true, userId: true },
    });

    if (!analysis) {
      throw new AppError('Face analysis not found', 404, 'FACE_ANALYSIS_NOT_FOUND');
    }

    if (analysis.userId !== userId) {
      throw new AppError('You are not allowed to use this analysis', 403, 'FORBIDDEN');
    }

    const hairstyle = await prisma.hairstyle.findUnique({
      where: { id: hairstyleId },
      select: { id: true },
    });

    if (!hairstyle) {
      throw new AppError('Hairstyle not found', 404, 'HAIRSTYLE_NOT_FOUND');
    }

    return prisma.recommendation.upsert({
      where: {
        faceAnalysisId_hairstyleId: { faceAnalysisId, hairstyleId },
      },
      create: {
        userId,
        faceAnalysisId,
        hairstyleId,
        compatibilityScore: compatibilityScore ?? 0,
        explanation: explanation ?? null,
        isFavorite: isFavorite ?? false,
      },
      update: {
        ...(compatibilityScore !== undefined && { compatibilityScore }),
        ...(explanation !== undefined && { explanation }),
        ...(isFavorite !== undefined && { isFavorite }),
      },
    });
  }

  /**
   * Recommendations of the current user
   */
  async getMyRecommendations(userId: string) {
    return prisma.recommendation.findMany({
      where: { userId },
      include: { hairstyle: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Aggregated analysis statistics
   */
  async getAnalysisStats() {
    const [total, completed, failed, pending, faceShapes] = await Promise.all([
      prisma.faceAnalysis.count(),
      prisma.faceAnalysis.count({ where: { status: 'COMPLETED' } }),
      prisma.faceAnalysis.count({ where: { status: 'FAILED' } }),
      prisma.faceAnalysis.count({ where: { status: 'PENDING' } }),
      prisma.faceAnalysis.groupBy({
        by: ['faceShape'],
        _count: { _all: true },
      }),
    ]);

    return {
      total,
      completed,
      failed,
      pending,
      byFaceShape: faceShapes.map((entry) => ({
        faceShape: entry.faceShape,
        count: entry._count._all,
      })),
    };
  }

  /**
   * Admin dashboard for the AI section
   */
  async getAdminAiDashboard() {
    const [stats, totalRecommendations, favorites, latestAnalyses] = await Promise.all([
      this.getAnalysisStats(),
      prisma.recommendation.count(),
      prisma.recommendation.count({ where: { isFavorite: true } }),
      prisma.faceAnalysis.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      }),
    ]);

    return {
      analyses: stats,
      recommendations: {
        total: totalRecommendations,
        favorites,
      },
      latestAnalyses,
    };
  }
}

export default new FaceAnalysisService();
