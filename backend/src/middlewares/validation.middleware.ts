import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

export const validate =
  (schema: AnyZodObject) =>
  (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // Route validators describe the payload itself (for example the
      // register body), not an artificial `{ body, params, query }` wrapper.
      // Keep the parsed value so transforms (trim/lowercase/coercion) reach
      // the controller.
      req.body = schema.parse(req.body);

      next();
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
  };