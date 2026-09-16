import { api } from './api';
import { ApiResponse, Hairstyle } from '../types/api';

export interface HairstyleFilters {
  category?: string;
  gender?: string;
  search?: string;
  difficulty?: string;
}

export const hairstyleService = {
  async getHairstyles(filters?: HairstyleFilters): Promise<Hairstyle[]> {
    const response = await api.get<ApiResponse<Hairstyle[]>>('/hairstyles', { params: filters });
    return response.data.data || [];
  },

  async getCategories(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/hairstyles/categories');
    return response.data.data || [];
  },

  async getHairstyle(id: string): Promise<Hairstyle> {
    const response = await api.get<ApiResponse<Hairstyle>>(`/hairstyles/${id}`);
    return response.data.data!;
  },

  async toggleFavorite(id: string): Promise<void> {
    await api.post(`/hairstyles/${id}/favorite`);
  },
};
