import { api } from './api';
import { ApiResponse, Hairstyle } from '../types/api';

export interface FaceAnalysisResult {
  faceShape?: string;
  hairTexture?: string;
  hairDensity?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  recommendations?: Hairstyle[];
  message?: string;
}

export const aiService = {
  async getFaceAnalysisStatus(): Promise<{ message: string }> {
    const response = await api.get<{ message: string }>('/face-analysis');
    return response.data;
  },

  async getRecommendationsStatus(): Promise<{ message: string }> {
    const response = await api.get<{ message: string }>('/recommendations');
    return response.data;
  },

  async getHairstylesByFaceShape(faceShape: string): Promise<Hairstyle[]> {
    const response = await api.get<ApiResponse<Hairstyle[]>>(`/hairstyles/face-shape/${faceShape}`);
    return response.data.data || [];
  },
};
