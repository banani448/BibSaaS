import { api } from './api';
import { ApiResponse, Salon } from '../types/api';

export const salonService = {
  async getSalons(): Promise<Salon[]> {
    const response = await api.get<ApiResponse<Salon[]>>('/salons');
    return response.data.data || [];
  },

  async getSalon(id: string): Promise<Salon> {
    const response = await api.get<ApiResponse<Salon>>(`/salons/${id}`);
    return response.data.data!;
  },

  async getMySalon(): Promise<Salon> {
    const response = await api.get<ApiResponse<Salon>>('/salons/me');
    return response.data.data!;
  },
};
