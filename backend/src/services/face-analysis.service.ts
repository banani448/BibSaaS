
// src/services/face-analysis.service.ts

import {
  PrismaClient,
  FaceShape,
  Prisma,
} from "@prisma/client";

import supabaseUploadService from "./supabase-upload.service";
import supabaseRealtimeService from "./supabase-realtime.service";

const prisma = new PrismaClient();

export interface FaceAnalysisResult {
  faceShape: string;
  confidence: number;
  gender?: string;
  ageRange?: string;
  beard?: boolean;
  glasses?: boolean;
  recommendations: string[];
}

class FaceAnalysisService {
  /**
   * Création d'une analyse visage
   */
  async createAnalysis(
    userId: string,
    file: Express.Multer.File,
  ) {
    const analysis =
      await supabaseUploadService.uploadFaceAnalysis(
        userId,
        file,
      );

    return analysis;
  }

  async analyzeFace(
    userId: string,
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error("File required");
    }

    const analysis = await this.createAnalysis(userId, file);
    return this.processAnalysis(analysis.id);
  }

  async analyzeFaceByUrl(
    userId: string,
    imageUrl: string,
  ) {
    if (!imageUrl) {
      throw new Error("Image URL required");
    }

    const analysis = await prisma.faceAnalysis.create({
      data: {
        userId,
        imageUrl,
        status: "PENDING",
      },
    });

    return this.processAnalysis(analysis.id);
  }

  /**
   * Lance l'analyse IA
   */
  async processAnalysis(
    analysisId: string,
  ) {
    const analysis =
      await prisma.faceAnalysis.findUnique({
        where: {
          id: analysisId,
        },
      });

    if (!analysis) {
      throw new Error(
        "Analyse introuvable",
      );
    }

    await prisma.faceAnalysis.update({
      where: {
        id: analysisId,
      },

      data: {
        status:
          "PROCESSING",
      },
    });

    try {
      if (!analysis.imageUrl) {
        throw new Error("Analysis image is missing");
      }

      const result =
        await this.detectFaceShape(
          analysis.imageUrl,
        );

      const updated =
        await prisma.faceAnalysis.update({
          where: {
            id: analysisId,
          },

          data: {
            status:
              "COMPLETED",

            faceShape:
              result.faceShape as FaceShape,

            faceDetected: true,
            confidenceScore:
              result.confidence,

            rawResult: {
              gender:
                result.gender,

              ageRange:
                result.ageRange,

              beard:
                result.beard,

              glasses:
                result.glasses,
            } as Prisma.InputJsonValue,
          },
        });

      await supabaseRealtimeService.faceAnalysisCompleted(
        updated,
      );

      return updated;
    } catch (error) {
      await prisma.faceAnalysis.update({
        where: {
          id: analysisId,
        },

        data: {
          status:
            "FAILED",
        },
      });

      throw error;
    }
  }

  /**
   * Détection forme du visage
   * À remplacer par OpenAI Vision,
   * AWS Rekognition,
   * Azure Face API,
   * TensorFlow,
   * Ollama Vision...
   */
  private async detectFaceShape(
    imageUrl: string,
  ): Promise<FaceAnalysisResult> {
    const shapes = [
      "OVAL",
      "ROUND",
      "SQUARE",
      "HEART",
      "DIAMOND",
      "OBLONG",
    ];

    const shape =
      shapes[
        Math.floor(
          Math.random() *
            shapes.length,
        )
      ];

    const recommendations =
      await this.generateRecommendations(
        shape,
      );

    return {
      faceShape:
        shape,

      confidence:
        0.93,

      gender:
        "UNKNOWN",

      ageRange:
        "18-35",

      beard:
        false,

      glasses:
        false,

      recommendations,
    };
  }

  /**
   * Recommandations coiffures
   */
  async generateRecommendations(
    faceShape: string,
  ): Promise<string[]> {
    const styles =
      await prisma.hairstyle.findMany({
        where: {
          suitableFaceShapes: {
            has:
              faceShape as FaceShape,
          },

          isActive:
            true,
        },

        select: {
          name: true,
        },

        take: 10,
      });

    return styles.map(
      (style) =>
        style.name,
    );
  }

  /**
   * Historique utilisateur
   */
  async getUserAnalyses(
    userId: string,
  ) {
    return prisma.faceAnalysis.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt:
          "desc",
      },
    });
  }

  /**
   * Analyse par ID
   */
  async getAnalysisById(
    analysisId: string,
  ) {
    return prisma.faceAnalysis.findUnique({
      where: {
        id:
          analysisId,
      },

      include: {
        user: true,
      },
    });
  }

  /**
   * Suppression analyse
   */
  async deleteAnalysis(
    analysisId: string,
    userId?: string,
  ) {
    if (userId) {
      const analysis = await prisma.faceAnalysis.findFirst({
        where: { id: analysisId, userId },
        select: { id: true },
      });

      if (!analysis) {
        throw new Error("Analysis not found");
      }
    }

    return prisma.faceAnalysis.delete({
      where: {
        id:
          analysisId,
      },
    });
  }

  async getRecommendations(analysisId: string) {
    return prisma.recommendation.findMany({
      where: { faceAnalysisId: analysisId },
      include: { hairstyle: true },
      orderBy: { rank: "asc" },
    });
  }

  async saveRecommendation(
    userId: string,
    data: {
      faceAnalysisId: string;
      hairstyleId: string;
      compatibilityScore: number;
      explanation?: string;
    },
  ) {
    return prisma.recommendation.create({
      data: {
        userId,
        faceAnalysisId: data.faceAnalysisId,
        hairstyleId: data.hairstyleId,
        compatibilityScore: data.compatibilityScore,
        explanation: data.explanation,
      },
    });
  }

  async getMyRecommendations(userId: string) {
    return prisma.recommendation.findMany({
      where: { userId },
      include: { hairstyle: true, faceAnalysis: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAnalysisStats() {
    return this.getStatistics();
  }

  async getAdminAiDashboard() {
    return this.getStatistics();
  }

  /**
   * Statistiques Admin
   */
  async getStatistics() {
    const total =
      await prisma.faceAnalysis.count();

    const completed =
      await prisma.faceAnalysis.count({
        where: {
          status:
            "COMPLETED",
        },
      });

    const failed =
      await prisma.faceAnalysis.count({
        where: {
          status:
            "FAILED",
        },
      });

    const pending =
      await prisma.faceAnalysis.count({
        where: {
          status:
            "PENDING",
        },
      });

    return {
      total,
      completed,
      failed,
      pending,
      successRate:
        total > 0
          ? (
              (completed /
                total) *
              100
            ).toFixed(
              2,
            )
          : "0",
    };
  }

  /**
   * Health Check
   */
  async healthCheck() {
    return {
      service:
        "face-analysis",

      status:
        "healthy",

      timestamp:
        new Date().toISOString(),
    };
  }
}

const faceAnalysisService =
  new FaceAnalysisService();

export default faceAnalysisService;
export {
  FaceAnalysisService,
};
