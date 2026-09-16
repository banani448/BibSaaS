
import {
  Request,
  Response,
  NextFunction,
} from "express";

import authService from "../services/auth.service";
import { AppError } from "../middlewares/error.middleware";

/**
 * ============================================================
 * BibSaaS — Auth Controller
 * ============================================================
 *
 * Gestion :
 * - Register
 * - Login
 * - Refresh tokens
 * - Logout
 * - Logout all devices
 * - Profile
 * - Change password
 *
 * Authenticated user :
 * req.user?.id
 *
 * ============================================================
 */

/**
 * ============================================================
 * REGISTER
 * ============================================================
 */

/**
 * Register a new user
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
    } = req.body;

    if (!email || !password) {
      throw new AppError(
        "Email and password are required",
        400,
        "MISSING_CREDENTIALS",
      );
    }

    const result =
      await authService.register({
        email,
        password,
        firstName,
        lastName,
      });

    return res.status(201).json({
      success: true,
      message:
        "User registered successfully",
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * ============================================================
 * LOGIN
 * ============================================================
 */

/**
 * Login user
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      throw new AppError(
        "Email and password are required",
        400,
        "MISSING_CREDENTIALS",
      );
    }

    const result =
      await authService.login({
        email,
        password,
      });

    return res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * ============================================================
 * REFRESH TOKENS
 * ============================================================
 */

/**
 * Refresh access token
 */
export const refreshTokens = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      refreshToken,
    } = req.body;

    if (!refreshToken) {
      throw new AppError(
        "Refresh token is required",
        400,
        "REFRESH_TOKEN_REQUIRED",
      );
    }

    const result =
      await authService.refreshTokens(
        refreshToken,
      );

    return res.json({
      success: true,
      message:
        "Tokens refreshed successfully",
      data: result,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * ============================================================
 * LOGOUT
 * ============================================================
 */

/**
 * Logout current user
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      refreshToken,
    } = req.body;

    const userId =
      req.user?.id;

    if (!userId) {
      throw new AppError(
        "User not authenticated",
        401,
        "NOT_AUTHENTICATED",
      );
    }

    await authService.logout(
      userId,
      refreshToken,
    );

    return res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * ============================================================
 * LOGOUT ALL DEVICES
 * ============================================================
 */

/**
 * Logout from all devices
 */
export const logoutAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId =
      req.user?.id;

    if (!userId) {
      throw new AppError(
        "User not authenticated",
        401,
        "NOT_AUTHENTICATED",
      );
    }

    await authService.logoutAll(
      userId,
    );

    return res.json({
      success: true,
      message:
        "Logged out from all devices",
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * ============================================================
 * GET PROFILE
 * ============================================================
 */

/**
 * Get current user profile
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId =
      req.user?.id;

    if (!userId) {
      throw new AppError(
        "User not authenticated",
        401,
        "NOT_AUTHENTICATED",
      );
    }

    const profile =
      await authService.getProfile(
        userId,
      );

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * ============================================================
 * CHANGE PASSWORD
 * ============================================================
 */

/**
 * Change authenticated user's password
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId =
      req.user?.id;

    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (!userId) {
      throw new AppError(
        "User not authenticated",
        401,
        "NOT_AUTHENTICATED",
      );
    }

    if (
      !currentPassword ||
      !newPassword
    ) {
      throw new AppError(
        "Current password and new password are required",
        400,
        "MISSING_PASSWORDS",
      );
    }

    if (
      typeof currentPassword !==
        "string" ||
      typeof newPassword !==
        "string"
    ) {
      throw new AppError(
        "Passwords must be strings",
        400,
        "INVALID_PASSWORD_FORMAT",
      );
    }

    if (
      currentPassword ===
      newPassword
    ) {
      throw new AppError(
        "New password must be different from current password",
        400,
        "PASSWORD_UNCHANGED",
      );
    }

    await authService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );

    return res.json({
      success: true,
      message:
        "Password changed successfully",
    });
  } catch (error: unknown) {
    next(error);
  }
};

