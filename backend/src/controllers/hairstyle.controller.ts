import { Request, Response, NextFunction } from 'express';
import hairstyleService from '../services/hairstyle.service';

class HairstyleController {
  /**
   * POST /api/hairstyles
   * Create a new hairstyle
   */
  async createHairstyle(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, imageUrl, category, tags, suitableFaceShapes, hairTypes, forMen, forWomen } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Name is required',
          code: 'NAME_REQUIRED',
        });
      }

      const hairstyle = await hairstyleService.createHairstyle({
        name,
        description,
        imageUrl,
        category,
        gender:
          forMen === true
            ? 'MEN'
            : forWomen === true
              ? 'WOMEN'
              : undefined,
        suitableFaceShapes,
        hairTypes,
      });

      return res.status(201).json({
        success: true,
        message: 'Hairstyle created successfully',
        data: hairstyle,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/hairstyles
   * List hairstyles with filters
   */
  async listHairstyles(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, category, forMen, forWomen, hairType, faceShape, search } = req.query;

      const result = await hairstyleService.listHairstyles({
        page: Number(page),
        limit: Number(limit),
        category: category as string,
        gender:
          forMen === 'true'
            ? 'MEN'
            : forWomen === 'true'
              ? 'WOMEN'
              : undefined,
        hairType: hairType as string,
        faceShape: faceShape as string,
        search: search as string,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/hairstyles/:id
   * Get hairstyle by ID
   */
  async getHairstyleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const hairstyle = await hairstyleService.getHairstyleById(id);

      return res.json({
        success: true,
        data: hairstyle,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PUT /api/hairstyles/:id
   * Update hairstyle
   */
  async updateHairstyle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, imageUrl, category, tags, suitableFaceShapes, hairTypes, forMen, forWomen } = req.body;

      const updatedHairstyle = await hairstyleService.updateHairstyle(id, {
        name,
        description,
        imageUrl,
        category,
        gender:
          forMen === true
            ? 'MEN'
            : forWomen === true
              ? 'WOMEN'
              : undefined,
        suitableFaceShapes,
        hairTypes,
      });

      return res.json({
        success: true,
        message: 'Hairstyle updated successfully',
        data: updatedHairstyle,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * DELETE /api/hairstyles/:id
   * Delete hairstyle
   */
  async deleteHairstyle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await hairstyleService.deleteHairstyle(id);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/hairstyles/category/:category
   * Get hairstyles by category
   */
  async getHairstylesByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const result = await hairstyleService.getHairstylesByCategory(category, {
        page: Number(page),
        limit: Number(limit),
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/hairstyles/face-shape/:faceShape
   * Get hairstyles suitable for face shape
   */
  async getHairstylesByFaceShape(req: Request, res: Response, next: NextFunction) {
    try {
      const { faceShape } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const result = await hairstyleService.getHairstylesByFaceShape(faceShape, {
        page: Number(page),
        limit: Number(limit),
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/hairstyles/categories
   * Get all categories
   */
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await hairstyleService.getCategories();

      return res.json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export default new HairstyleController();