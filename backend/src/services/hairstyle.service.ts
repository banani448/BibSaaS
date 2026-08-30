import prisma from '../config/prisma';
import AppError from '../utils/errors/app-error';
import { FaceShape, HairTexture, HairstyleCategory, HairstyleGender } from '@prisma/client';

class HairstyleService {
  /**
   * Create a new hairstyle
   */
  async createHairstyle(data: {
    name: string;
    description?: string;
    imageUrl?: string;
    category?: string;
    gender?: string;
    suitableFaceShapes?: string[];
    hairTypes?: string[];
    difficulty?: string;
  }) {
    const slug = this.slugify(data.name);
    const hairstyle = await prisma.hairstyle.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        imageUrl: data.imageUrl,
        category: (data.category as HairstyleCategory) || 'OTHER',
        gender: (data.gender as HairstyleGender) || 'UNISEX',
        suitableFaceShapes: (data.suitableFaceShapes as FaceShape[]) || [],
        suitableHairTextures: (data.hairTypes as HairTexture[]) || [],
      },
    });

    return hairstyle;
  }

  private slugify(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  }

  /**
   * Get hairstyle by ID
   */
  async getHairstyleById(hairstyleId: string) {
    const hairstyle = await prisma.hairstyle.findUnique({
      where: { id: hairstyleId },
      include: {
        recommendations: {
          include: {
            user: {
              select: {
                id: true,
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!hairstyle) {
      throw new AppError('Hairstyle not found', 404, 'HAIRSTYLE_NOT_FOUND');
    }

    return hairstyle;
  }

  /**
   * Update hairstyle
   */
  async updateHairstyle(hairstyleId: string, data: {
    name?: string;
    description?: string;
    imageUrl?: string;
    category?: string;
    gender?: string;
    suitableFaceShapes?: string[];
    hairTypes?: string[];
    difficulty?: string;
  }) {
    const hairstyle = await prisma.hairstyle.findUnique({
      where: { id: hairstyleId },
      select: { id: true },
    });

    if (!hairstyle) {
      throw new AppError('Hairstyle not found', 404, 'HAIRSTYLE_NOT_FOUND');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.category !== undefined) updateData.category = data.category as HairstyleCategory;
    if (data.gender !== undefined) updateData.gender = data.gender as HairstyleGender;
    if (data.suitableFaceShapes !== undefined) updateData.suitableFaceShapes = data.suitableFaceShapes as FaceShape[];
    if (data.hairTypes !== undefined) updateData.suitableHairTextures = data.hairTypes as HairTexture[];

    const updatedHairstyle = await prisma.hairstyle.update({
      where: { id: hairstyleId },
      data: updateData,
    });

    return updatedHairstyle;
  }

  /**
   * Delete hairstyle
   */
  async deleteHairstyle(hairstyleId: string) {
    const hairstyle = await prisma.hairstyle.findUnique({
      where: { id: hairstyleId },
      select: { id: true },
    });

    if (!hairstyle) {
      throw new AppError('Hairstyle not found', 404, 'HAIRSTYLE_NOT_FOUND');
    }

    await prisma.hairstyle.delete({
      where: { id: hairstyleId },
    });

    return { message: 'Hairstyle deleted successfully' };
  }

  /**
   * List hairstyles with filters
   */
  async listHairstyles(params: {
    page?: number;
    limit?: number;
    category?: string;
    gender?: string;
    hairType?: string;
    faceShape?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, category, gender, hairType, faceShape, search } = params;

    const where: any = {};

    if (category) {
      where.category = category as HairstyleCategory;
    }

    if (gender) {
      where.gender = gender as HairstyleGender;
    }

    if (hairType) {
      where.suitableHairTextures = {
        has: hairType as HairTexture,
      };
    }

    if (faceShape) {
      where.suitableFaceShapes = {
        has: faceShape as FaceShape,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [hairstyles, total] = await Promise.all([
      prisma.hairstyle.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.hairstyle.count({ where }),
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

  /**
   * Get hairstyles by category
   */
  async getHairstylesByCategory(category: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;

    const [hairstyles, total] = await Promise.all([
      prisma.hairstyle.findMany({
        where: { category: category as HairstyleCategory },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.hairstyle.count({ where: { category: category as HairstyleCategory } }),
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

  /**
   * Get hairstyles suitable for face shape
   */
  async getHairstylesByFaceShape(faceShape: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;

    const [hairstyles, total] = await Promise.all([
      prisma.hairstyle.findMany({
        where: {
          suitableFaceShapes: {
            has: faceShape as FaceShape,
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.hairstyle.count({
        where: {
          suitableFaceShapes: {
            has: faceShape as FaceShape,
          },
        },
      }),
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

  /**
   * Get hairstyle categories
   */
  async getCategories() {
    const categories = await prisma.hairstyle.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    return categories.map((c) => c.category).filter(Boolean);
  }
}

export default new HairstyleService();
