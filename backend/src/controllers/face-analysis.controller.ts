import { Request, Response, NextFunction } from "express";
import faceAnalysisService from "../services/face-analysis.service";

export class FaceAnalysisController {
  /**
   * Upload et analyse du visage
   */
  async analyzeFace(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const result =
        await faceAnalysisService.analyzeFace(
          userId,
          req.file
        );

      return res.status(200).json({
        success: true,
        message: "Face analysis completed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyse par IA à partir d'une URL
   */
  async analyzeFaceByUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const result =
        await faceAnalysisService.analyzeFaceByUrl(
          userId,
          req.body.imageUrl
        );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Historique utilisateur
   */
  async getMyAnalyses(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const analyses =
        await faceAnalysisService.getUserAnalyses(userId);

      return res.status(200).json({
        success: true,
        data: analyses,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyse par ID
   */
  async getAnalysisById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const analysis =
        await faceAnalysisService.getAnalysisById(
          req.params.id
        );

      return res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer analyse
   */
  async deleteAnalysis(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      await faceAnalysisService.deleteAnalysis(
        req.params.id,
        userId
      );

      return res.status(200).json({
        success: true,
        message: "Analysis deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recommandations IA
   */
  async getRecommendations(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const recommendations =
        await faceAnalysisService.getRecommendations(
          req.params.id
        );

      return res.status(200).json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sauvegarder recommandation
   */
  async saveRecommendation(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const recommendation =
        await faceAnalysisService.saveRecommendation(
          userId,
          req.body
        );

      return res.status(201).json({
        success: true,
        message: "Recommendation saved successfully",
        data: recommendation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mes recommandations
   */
  async getMyRecommendations(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const recommendations =
        await faceAnalysisService.getMyRecommendations(userId);

      return res.status(200).json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Statistiques IA
   */
  async getAnalysisStats(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const stats =
        await faceAnalysisService.getAnalysisStats();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Dashboard Admin IA
   */
  async getAdminAiDashboard(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const dashboard =
        await faceAnalysisService.getAdminAiDashboard();

      return res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new FaceAnalysisController();