import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import config from './env';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

const accessSignOptions: SignOptions = {
  expiresIn: config.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  issuer: config.JWT_ISSUER,
  audience: config.JWT_AUDIENCE,
};

const refreshSignOptions: SignOptions = {
  expiresIn: config.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  issuer: config.JWT_ISSUER,
};

const accessVerifyOptions: jwt.VerifyOptions = {
  issuer: config.JWT_ISSUER,
  audience: config.JWT_AUDIENCE,
};

const refreshVerifyOptions: jwt.VerifyOptions = {
  issuer: config.JWT_ISSUER,
};

/**
 * Generate access token
 */
export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.JWT_SECRET as Secret, accessSignOptions);
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET as Secret, refreshSignOptions);
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.JWT_SECRET as Secret, accessVerifyOptions) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET as Secret, refreshVerifyOptions) as RefreshTokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): ReturnType<typeof jwt.decode> {
  return jwt.decode(token);
}
