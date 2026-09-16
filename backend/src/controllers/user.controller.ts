
import {
  Request,
  Response,
  NextFunction,
} from "express";

import userService from "../services/user.service";

/**
 * ============================================================
 * BibSaaS — User Controller
 * ============================================================
 *
 * Gestion :
 * - Profil utilisateur
 * - Mise à jour du profil
 * - Changement d'email
 * - Suppression du compte
 * - Statistiques
 * - Consultation d'un utilisateur
 * - Liste des utilisateurs
 * - Gestion du statut utilisateur
 *
 * Utilisateur authentifié :
 * req.user?.id
 *
 * ============================================================
 */

class UserController {
  /**
   * ==========================================================
   * GET /api/users/me
   * Get current user profile
   * ==========================================================
   */
  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const profile =
        await userService.getUserProfile(
          userId,
        );

      return res.json({
        success: true,
        data: profile,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * PUT /api/users/me
   * Update current user profile
   * ==========================================================
   */
  async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const {
        firstName,
        lastName,
        phone,
        avatar,
        preferences,
      } = req.body;

      const updatedUser =
        await userService.updateProfile(
          userId,
          {
            firstName,
            lastName,
            phone,
            avatar,
            preferences,
          },
        );

      return res.json({
        success: true,
        message:
          "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * POST /api/users/me/change-email
   * Change user email
   * ==========================================================
   */
  async changeEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const {
        newEmail,
        password,
      } = req.body;

      if (!newEmail || !password) {
        return res.status(400).json({
          success: false,
          message:
            "newEmail and password are required",
          code: "MISSING_FIELDS",
        });
      }

      const updatedUser =
        await userService.changeEmail(
          userId,
          {
            newEmail,
            password,
          },
        );

      return res.json({
        success: true,
        message:
          "Email changed successfully. Please verify your new email.",
        data: updatedUser,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * DELETE /api/users/me
   * Delete user account
   * ==========================================================
   */
  async deleteAccount(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const {
        password,
      } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message:
            "Password is required to delete account",
          code: "PASSWORD_REQUIRED",
        });
      }

      const result =
        await userService.deleteAccount(
          userId,
          password,
        );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * GET /api/users/me/stats
   * Get user statistics
   * ==========================================================
   */
  async getStats(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const stats =
        await userService.getUserStats(
          userId,
        );

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * GET /api/users/:id
   * Get user by ID (admin only)
   * ==========================================================
   */
  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
          code: "USER_ID_REQUIRED",
        });
      }

      const user =
        await userService.getUserById(id);

      return res.json({
        success: true,
        data: user,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * GET /api/users
   * List all users (admin only)
   * ==========================================================
   */
  async listUsers(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const {
        page = "1",
        limit = "20",
        role,
        status,
        search,
      } = req.query;

      const parsedPage =
        Number(page);

      const parsedLimit =
        Number(limit);

      if (
        !Number.isInteger(parsedPage) ||
        parsedPage < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "page must be a positive integer",
          code: "INVALID_PAGE",
        });
      }

      if (
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 1 ||
        parsedLimit > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "limit must be between 1 and 100",
          code: "INVALID_LIMIT",
        });
      }

      const result =
        await userService.listUsers({
          page: parsedPage,
          limit: parsedLimit,

          role:
            typeof role === "string"
              ? role
              : undefined,

          status:
            typeof status === "string"
              ? status
              : undefined,

          search:
            typeof search === "string"
              ? search
              : undefined,
        });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * ==========================================================
   * PATCH /api/users/:id/status
   * Update user status (admin only)
   * ==========================================================
   */
  async updateUserStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
          code: "USER_ID_REQUIRED",
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
          code: "STATUS_REQUIRED",
        });
      }

      const updatedUser =
        await userService.updateUserStatus(
          id,
          status,
        );

      return res.json({
        success: true,
        message:
          "User status updated successfully",
        data: updatedUser,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}

export default new UserController();

