import prisma from '../config/prisma';
import AppError from '../utils/errors/app-error';

class RecommendationService {
  /**
   * Create a recommendation for a user
   */
  async createRecommendation(data: {
    userId: string;
    hairstyleId: string;
    faceAnalysisId: string;
    compatibilityScore?: number;
    reason?: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const hairstyle = await prisma.hairstyle.findUnique({
      where: { id: data.hairstyleId },
      select: { id: true },
    });

    if (!hairstyle) {
      throw new AppError('Hairstyle not found', 404, 'HAIRSTYLE_NOT_FOUND');
    }

    const recommendation = await prisma.recommendation.create({
      data: {
        userId: data.userId,
        hairstyleId: data.hairstyleId,
        faceAnalysisId: data.faceAnalysisId,
        compatibilityScore: data.compatibilityScore ? Number(data.compatibilityScore) : 0,
        explanation: data.reason || null,
      },
    });

    return recommendation;
  }

  /**
   * Get recommendation by ID
   */
  async getRecommendationById(recommendationId: string) {
    const recommendation = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
      include: {
        user: {
          select: {
            id: true,
            profile: true,
          },
        },
        hairstyle: true,
      },
    });

    if (!recommendation) {
      throw new AppError('Recommendation not found', 404, 'RECOMMENDATION_NOT_FOUND');
    }

    return recommendation;
  }

  /**
   * Get user's recommendations
   */
  async getUserRecommendations(userId: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const [recommendations, total] = await Promise.all([
      prisma.recommendation.findMany({
        where: { userId },
        include: {
          hairstyle: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { compatibilityScore: 'desc' },
      }),
      prisma.recommendation.count({ where: { userId } }),
    ]);

    return {
      recommendations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete recommendation
   */
  async deleteRecommendation(recommendationId: string) {
    const recommendation = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
      select: { id: true },
    });

    if (!recommendation) {
      throw new AppError('Recommendation not found', 404, 'RECOMMENDATION_NOT_FOUND');
    }

    await prisma.recommendation.delete({
      where: { id: recommendationId },
    });

    return { message: 'Recommendation deleted successfully' };
  }

  /**
   * Generate recommendations based on face analysis
   */
  async generateRecommendations(userId: string, faceAnalysisId: string, faceShape?: string, hairType?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const faceAnalysis = await prisma.faceAnalysis.findUnique({
      where: { id: faceAnalysisId },
      select: { id: true, faceShape: true, hairTexture: true },
    });

    if (!faceAnalysis) {
      throw new AppError('Face analysis not found', 404, 'FACE_ANALYSIS_NOT_FOUND');
    }

    const where: any = {};

    if (faceShape || faceAnalysis.faceShape) {
      where.suitableFaceShapes = {
        has: (faceShape || faceAnalysis.faceShape) as any,
      };
    }

    if (hairType || faceAnalysis.hairTexture) {
      where.suitableHairTextures = {
        has: (hairType || faceAnalysis.hairTexture) as any,
      };
    }

    const hairstyles = await prisma.hairstyle.findMany({
      where,
      take: 10,
    });

    const recommendations = await Promise.all(
      hairstyles.map(async (hairstyle) => {
        const score = this.calculateScore(hairstyle, faceShape || faceAnalysis.faceShape || undefined, hairType || faceAnalysis.hairTexture || undefined);

        const existingRecommendation = await prisma.recommendation.findFirst({
          where: {
            userId,
            hairstyleId: hairstyle.id,
          },
        });

        if (existingRecommendation) {
          return prisma.recommendation.update({
            where: { id: existingRecommendation.id },
            data: {
              compatibilityScore: score,
              explanation: this.generateReason(hairstyle, faceShape || faceAnalysis.faceShape || undefined, hairType || faceAnalysis.hairTexture || undefined),
            },
          });
        }

        return prisma.recommendation.create({
          data: {
            userId,
            faceAnalysisId,
            hairstyleId: hairstyle.id,
            compatibilityScore: score,
            explanation: this.generateReason(hairstyle, faceShape || faceAnalysis.faceShape || undefined, hairType || faceAnalysis.hairTexture || undefined),
          },
        });
      })
    );

    return recommendations;
  }

  /**
   * Calculate recommendation score
   */
  private calculateScore(hairstyle: { suitableFaceShapes?: string[]; suitableHairTextures?: string[] }, faceShape?: string, hairType?: string): number {
    let score = 50;

    if (faceShape && hairstyle.suitableFaceShapes?.includes(faceShape)) {
      score += 30;
    }

    if (hairType && hairstyle.suitableHairTextures?.includes(hairType)) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  /**
   * Generate recommendation reason
   */
  private generateReason(hairstyle: { suitableFaceShapes?: string[]; suitableHairTextures?: string[] }, faceShape?: string, hairType?: string): string {
    const reasons: string[] = [];

    if (faceShape && hairstyle.suitableFaceShapes?.includes(faceShape)) {
      reasons.push(`suitable for ${faceShape} face shape`);
    }

    if (hairType && hairstyle.suitableHairTextures?.includes(hairType)) {
      reasons.push(`works well with ${hairType} hair`);
    }

    if (reasons.length === 0) {
      return 'Popular choice based on general preferences';
    }

    return reasons.join(', ');
  }

  /**
   * Get trending hairstyles
   */
  async getTrendingHairstyles(params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;

    const [hairstyles, total] = await Promise.all([
      prisma.hairstyle.findMany({
        include: {
          _count: {
            select: { recommendations: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          recommendations: {
            _count: 'desc',
          },
        },
      }),
      prisma.hairstyle.count(),
    ]);

    return {
      hairstyles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new RecommendationService();
